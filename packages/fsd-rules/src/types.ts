import type { FsdRoot } from '@feature-sliced/filesystem'

export interface Rule {
  /** Short code name for the rule. */
  name: string
  check: (root: FsdRoot) => RuleResult
}

export interface RuleResult {
  diagnostics: Array<Diagnostic>
}

export interface Diagnostic {
  message: string
  fixes?: Array<Fix>
}

export type Fix =
  | {
      type: 'rename'
      path: string
      newName: string
    }
  | {
      type: 'create-file'
      path: string
      content: string
    }
  | {
      type: 'create-folder'
      path: string
    }
  | {
      type: 'delete'
      path: string
    }
  | {
      type: 'modify-file'
      path: string
      content: string
    }