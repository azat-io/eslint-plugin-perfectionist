import type { TSESTree } from '@typescript-eslint/types'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

export function computeImportKindModifier(
  node: TSESTree.ImportSpecifier,
): 'value' | 'type' {
  let importKind = 'importKind' in node ? node.importKind : undefined
  switch (importKind) {
    case undefined:
    case 'value':
      return 'value'
    case 'type':
      return 'type'
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(importKind)
  }
}
