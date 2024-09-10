import { createEffect, sample } from 'effector'
import { debounce, not } from 'patronum'
import { Config, Folder, Rule } from '@steiger/types'

import { scan, createWatcher } from './features/transfer-fs-to-vfs'
import { defer } from './shared/defer'
import { $enabledRules, getEnabledRules, getGlobalIgnores } from './models/config'
import calculateSeverity from './features/calculate-severity'
import { runRule } from './features/run-rule'
import removeGlobalIgnoresFromVfs from './features/remove-global-ignores-from-vfs'

function getRuleDescriptionUrl(ruleName: string) {
  return new URL(`https://github.com/feature-sliced/steiger/tree/master/packages/steiger-plugin-fsd/src/${ruleName}`)
}

async function runRules({ vfs, rules }: { vfs: Folder; rules: Array<Rule> }) {
  const vfsWithoutGlobalIgnores = removeGlobalIgnoresFromVfs(vfs, getGlobalIgnores())
  const ruleResults = await Promise.all(rules.map((rule) => runRule(vfsWithoutGlobalIgnores, rule)))
  return ruleResults.flatMap((r, index) =>
    r.diagnostics.map((d) => {
      const ruleName = rules[index].name
      return {
        ...d,
        ruleName,
        getRuleDescriptionUrl,
        severity: calculateSeverity(d.location.path, ruleName),
      }
    }),
  )
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
