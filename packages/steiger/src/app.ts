import { createEffect, sample } from 'effector'
import { debounce, not } from 'patronum'
import { Config, Folder, GlobalIgnore, Rule } from '@steiger/types'
import type { AugmentedDiagnostic } from '@steiger/pretty-reporter'

import { scan, createWatcher } from './features/transfer-fs-to-vfs'
import { defer } from './shared/defer'
import { $enabledRules, getEnabledRules, getRuleOptions, getGlobsForRule, getGlobalIgnores } from './models/config'
import applySeverityGlobsToVfs from './features/apply-severity-globs-to-vfs'
import { copyFsEntity, flattenFolder, recomposeTree } from './shared/file-system'
import { createFilterAccordingToGlobs } from './shared/globs'

function getRuleDescriptionUrl(ruleName: string) {
  return new URL(`https://github.com/feature-sliced/steiger/tree/master/packages/steiger-plugin-fsd/src/${ruleName}`)
}

function removeNodes(vfs: Folder, globalIgnores: Array<GlobalIgnore>) {
  const flatVfs = flattenFolder(vfs)

  return recomposeTree(
    copyFsEntity(vfs),
    flatVfs.filter((file) =>
      globalIgnores.every((ignore) => {
        const filterAccordingToGlobs = createFilterAccordingToGlobs({ exclusions: ignore.ignores })

        return !filterAccordingToGlobs(file.path)
      }),
    ),
  )
}

async function runRules({ vfs, rules }: { vfs: Folder; rules: Array<Rule> }) {
  const vfsWithoutGlobalIgnores = removeNodes(vfs, getGlobalIgnores())

  const ruleResults = await Promise.all(
    rules.map((rule) => {
      const optionsForCurrentRule = getRuleOptions(rule.name)
      const severitySettings = getGlobsForRule(rule.name)

      if (!severitySettings) {
        throw new Error(`Severity settings for rule ${rule.name} are not found but rule is enabled`)
      }

      const { vfs: finalVfs, severityMap } = applySeverityGlobsToVfs(severitySettings, vfsWithoutGlobalIgnores)

      if (!finalVfs) {
        return Promise.resolve([])
      }

      return Promise.resolve(rule.check(finalVfs, optionsForCurrentRule || undefined)).then(({ diagnostics }) =>
        diagnostics.map<AugmentedDiagnostic>((d) => ({
          ...d,
          ruleName: rule.name,
          getRuleDescriptionUrl,
          severity: severityMap[d.location.path],
        })),
      )
    }),
  )
  return ruleResults.flat()
}

export const linter = {
  run: (path: string) =>
    scan(path).then((vfs) =>
      runRules({
        vfs,
        rules: getEnabledRules(),
      }),
    ),
  watch: async (path: string) => {
    const { vfs, watcher } = await createWatcher(path)

    const treeChanged = debounce(vfs.$tree, 500)
    const runRulesFx = createEffect(runRules)

    sample({
      clock: defer({ clock: [treeChanged, $enabledRules], until: not(runRulesFx.pending) }),
      source: {
        vfs: vfs.$tree,
        rules: $enabledRules,
      },
      target: runRulesFx,
    })

    return [runRulesFx.doneData, () => watcher.close()] as const
  },
}

export function defineConfig(config: Config) {
  return config
}
