import { File, Folder } from '@steiger/types'

import { GlobGroupWithSeverity } from '../config'
import { createFilterAccordingToGlobs } from '../../shared/globs/create-filter-according-to-globs'
import { copyNode } from '../../shared/file-system'
import { SeverityMarkedFile, SeverityMarkedFolder } from './types'
import { pipe } from 'ramda'

function markDefault(node: Folder | File): Folder | SeverityMarkedFile {
  return node.type === 'folder'
    ? node
    : {
        ...node,
        severity: 'off',
      }
}

export default function markFileSeverities(globs: Array<GlobGroupWithSeverity>, vfs: Folder): SeverityMarkedFolder {
  const vfsCopy = copyNode(vfs, true)

  const fileMarkingPipeline = pipe(markDefault, markIfFile)

  function markIfFile(node: Folder | SeverityMarkedFile): SeverityMarkedFile | Folder {
    return node.type === 'folder'
      ? node
      : globs.reduce((acc, { severity, files, ignores }) => {
          const isApplied = createFilterAccordingToGlobs({ inclusions: files, exclusions: ignores })
          const severityApplies = isApplied(acc.path)

          return severityApplies
            ? {
                ...acc,
                severity,
              }
            : acc
        }, node)
  }

  function walk(node: Folder | SeverityMarkedFile): SeverityMarkedFolder | SeverityMarkedFile {
    if (node.type === 'folder') {
      return {
        ...node,
        children: (node.children as Array<SeverityMarkedFolder | SeverityMarkedFile>).map(walk),
      } as SeverityMarkedFolder
    }

    return <SeverityMarkedFile>fileMarkingPipeline(node)
  }

  return <SeverityMarkedFolder>walk(vfsCopy)
}
