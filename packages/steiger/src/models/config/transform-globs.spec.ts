import { describe, it, expect } from 'vitest'
import { Config } from '@steiger/types'

import { joinFromRoot } from '../../_lib/prepare-test'
import { transformGlobs } from './transform-globs'

describe('transformGlobs', () => {
  it('should convert relative globs to absolute', () => {
    const config: Config = [
      {
        ignores: ['./src/entities/**'],
      },
      {
        rules: {
          rule1: 'warn',
        },
        files: ['./src/shared/ui/**/*'],
        ignores: ['./src/shared/ui/index.ts'],
      },
    ]

    expect(transformGlobs(config, joinFromRoot('projects', 'dummy-project'))).toEqual([
      {
        ignores: ['/projects/dummy-project/src/entities/**'],
      },
      {
        rules: {
          rule1: 'warn',
        },
        files: ['/projects/dummy-project/src/shared/ui/**/*'],
        ignores: ['/projects/dummy-project/src/shared/ui/index.ts'],
      },
    ])
  })

  it('should strip trailing slashes', () => {
    const config: Config = [
      {
        ignores: ['./src/entities/', '**/shared/'],
      },
      {
        rules: {
          rule1: 'warn',
        },
        files: ['./src/shared/ui/', '**/pages/'],
        ignores: ['./src/shared/ui/index.ts'],
      },
    ]

    expect(transformGlobs(config, joinFromRoot('projects', 'dummy-project'))).toEqual([
      {
        ignores: ['/projects/dummy-project/src/entities', '**/shared'],
      },
      {
        rules: {
          rule1: 'warn',
        },
        files: ['/projects/dummy-project/src/shared/ui', '**/pages'],
        ignores: ['/projects/dummy-project/src/shared/ui/index.ts'],
      },
    ])
  })
})