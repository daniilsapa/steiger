import { createEffect, sample } from 'effector'
import { debounce, not } from 'patronum'
import { Config, Folder, Rule } from '@steiger/types'

import { scan, createWatcher } from './features/transfer-fs-to-vfs'
import { defer } from './shared/defer'
import { $enabledRules, getEnabledRules, getGlobalIgnores } from './models/config'
import complementDiagnostics from './features/complement-diagnostics'
import { runRule } from './features/run-rule'
import removeGlobalIgnoreFromVfs from './features/remove-global-ignore-from-vfs'

async function ruleRunSequence({ vfs, rules }: { vfs: Folder; rules: Array<Rule> }) {
  const vfsWithoutGlobalIgnores = removeGlobalIgnoreFromVfs(vfs, getGlobalIgnores())
  const ruleResults = await Promise.all(rules.map((rule) => runRule(vfsWithoutGlobalIgnores, rule)))
  return ruleResults.flatMap((r, index) => complementDiagnostics(r.diagnostics, rules[index].name))
}

export const linter = {
  run: (path: string) =>
    scan(path).then((vfs) =>
      ruleRunSequence({
        vfs,
        rules: getEnabledRules(),
      }),
    ),
  watch: async (path: string) => {
    const { vfs, watcher } = await createWatcher(path)

    const treeChanged = debounce(vfs.$tree, 500)
    const runRulesFx = createEffect(ruleRunSequence)

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
