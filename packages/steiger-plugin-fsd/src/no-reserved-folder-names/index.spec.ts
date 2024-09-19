import { expect, it } from 'vitest'

import noReservedFolderNames from './index.js'
import { joinFromRoot, parseIntoFsdRoot } from '../_lib/prepare-test.js'

it('reports no errors on a project without subfolders in segments that use reserved names', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 index.ts
      📂 lib
        📄 index.ts
    📂 entities
      📂 user
        📂 ui
        📂 model
        📄 index.ts
    📂 pages
      📂 home
        📂 ui
        📄 index.ts
  `)

  expect(noReservedFolderNames.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project with subfolders in segments that use reserved names', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 index.ts
        📂 lib
          📄 someUiFunction.ts
    📂 entities
      📂 user
        📂 ui
        📂 model
        📄 index.ts
    📂 pages
      📂 home
        📂 ui
        📄 index.ts
  `)

  const diagnostics = noReservedFolderNames.check(root).diagnostics
  expect(diagnostics).toEqual([
    {
      message:
        'Having a folder with the name "lib" inside a segment could be confusing because that name is commonly used for segments. Consider renaming it.',
      location: { path: joinFromRoot('shared', 'ui', 'lib') },
    },
  ])
})
