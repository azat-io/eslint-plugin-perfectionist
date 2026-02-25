import type { TSESTree } from '@typescript-eslint/types'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

export function computeExportKindModifier(
  node: TSESTree.ExportSpecifier,
): 'value' | 'type' {
  let exportKind = 'exportKind' in node ? node.exportKind : undefined

  switch (exportKind) {
    case undefined:
    case 'value':
      return 'value'
    case 'type':
      return 'type'
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(exportKind)
  }
}
