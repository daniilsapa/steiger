import { describe, expect, it } from 'vitest'

import { applyExclusion } from './apply-exclusion'
import { not } from './not'
import { joinFromRoot, parseIntoFsdRoot } from '../../_lib/prepare-test'

describe('applyExclusion', () => {
  it('should apply exclusions with a normal glob group', () => {
    const vfs = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📄 index.ts
          📄 Button.tsx
        📂 lib
          📄 device-detect.ts
          📄 get-query-params.ts
          📄 index.ts
      📂 entities
        📂 user
          📂 ui
            📄 UserAvatar.tsx
            📄 index.ts
          📄 index.ts
        📂 post
          📂 ui
            📄 index.ts
            📄 PostList.tsx
          📄 index.ts
      `,
      joinFromRoot('src'),
    )

    const expectedVfs = parseIntoFsdRoot(
      `
      📂 shared
        📂 lib
          📄 device-detect.ts
          📄 get-query-params.ts
          📄 index.ts
      📂 entities
        📂 user
          📄 index.ts
        📂 post
          📄 index.ts
        `,
      joinFromRoot('src'),
    )

    const globs = [
      {
        files: ['/src/shared/**', '/src/entities/**'],
        ignores: ['**/ui/**'],
      },
    ]

    expect(applyExclusion(vfs, globs)).toEqual(expectedVfs)
  })

  it('should correctly apply exclusions with an inverted glob group', () => {
    const vfs = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📄 index.ts
          📄 Button.tsx
        📂 lib
          📄 device-detect.ts
          📄 get-query-params.ts
          📄 index.ts
      📂 entities
        📂 user
          📂 ui
            📄 UserAvatar.tsx
            📄 index.ts
          📄 index.ts
        📂 post
          📂 ui
            📄 index.ts
            📄 PostList.tsx
          📄 index.ts
      `,
      joinFromRoot('src'),
    )

    const expectedVfs = parseIntoFsdRoot(
      `
      📂 shared
        📂 lib
          📄 device-detect.ts
          📄 index.ts`,
      joinFromRoot('src'),
    )

    const globs = [
      {
        files: ['/src/shared/**', '/src/entities/**'],
        ignores: ['**/ui/**'],
      },
      not({
        files: ['/src/entities/**', '/src/shared/lib/get-query-params.ts'],
        ignores: [],
      }),
    ]

    expect(applyExclusion(vfs, globs)).toEqual(expectedVfs)
  })

  it('should correctly apply exclusions with several normal and inverted glob groups', () => {
    const vfs = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📄 index.ts
          📄 Button.tsx
        📂 lib
          📄 device-detect.ts
          📄 get-query-params.ts
          📄 index.ts
      📂 entities
        📂 user
          📂 ui
            📄 UserAvatar.tsx
            📄 index.ts
          📄 index.ts
        📂 post
          📂 ui
            📄 index.ts
            📄 PostList.tsx
          📄 index.ts
      📂 pages
        📂 main
          📄 index.ts
        📂 account
          📄 index.ts
      `,
      joinFromRoot('src'),
    )

    const expectedVfs = parseIntoFsdRoot(
      `
      📂 shared
        📂 lib
          📄 device-detect.ts
          📄 index.ts
      📂 pages
        📂 main
          📄 index.ts`,
      joinFromRoot('src'),
    )

    const globs = [
      {
        files: ['/src/shared/**', '/src/entities/**'],
        ignores: ['**/ui/**'],
      },
      not({
        files: ['/src/entities/**', '/src/shared/lib/get-query-params.ts'],
        ignores: [],
      }),
      {
        files: ['/src/pages/**'],
        ignores: [],
      },
      not({
        files: ['/src/pages/account/**'],
        ignores: [],
      }),
    ]

    expect(applyExclusion(vfs, globs)).toEqual(expectedVfs)
  })

  it('should correctly apply exclusions for a special case', () => {
    const globs = [not({ files: [], ignores: [] }), { files: ['/src/shared/ui/Button.ts'], ignores: [] }]

    const vfs = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📄 Button.ts
          📄 Button.spec.ts
          📄 Input.ts
          📄 Input.spec.ts
          📄 index.ts
        📂 lib
          📄 get-query-params.ts
          📄 get-query-params.spec.ts
          📄 device-detection.ts
          📄 device-detection.spec.ts
          📄 index.ts
      📂 entities
        📂 user
          📂 ui
            📄 UserAvatar.ts
            📄 UserAvatar.spec.ts
          📄 Input.ts
      📂 pages
        📂 profile
          📄 index.ts
        📂 main
          📄 index.ts
      `,
      joinFromRoot('src'),
    )

    const expectedVfs = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📄 Button.ts
      `,
      joinFromRoot('src'),
    )

    expect(applyExclusion(vfs, globs)).toEqual(expectedVfs)
  })
})
