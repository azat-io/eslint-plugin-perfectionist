import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithOverloadSignatureImplementation } from './overload-signature-group'
import type { NewlinesBetweenValueGetter } from '../get-newlines-between-errors'

/**
 * Newlines between value getter for overload signatures.
 *
 * @returns NewlinesBetween option value.
 */
export function buildOverloadSignatureNewlinesBetweenValueGetter<
  T extends TSESTree.Node,
>(): NewlinesBetweenValueGetter<
  SortingNodeWithOverloadSignatureImplementation<T>
> {
  return ({ computedNewlinesBetween, right, left }) => {
    if (
      left.overloadSignatureImplementation &&
      left.overloadSignatureImplementation ===
        right.overloadSignatureImplementation
    ) {
      return 0
    }
    return computedNewlinesBetween
  }
}
