import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithOverloadSignatureImplementation } from './overload-signature-group'
import type { NewlinesBetweenValueGetter } from '../get-newlines-between-errors'
import type { NewlinesBetweenOption } from '../../types/common-groups-options'

/**
 * Newlines between value getter for overload signatures.
 *
 * @param newlinesBetweenOverloadSignatures - Newlines between overload
 *   signatures option value.
 * @returns NewlinesBetween option value.
 */
export function buildOverloadSignatureNewlinesBetweenValueGetter<
  T extends TSESTree.Node,
>(
  newlinesBetweenOverloadSignatures: NewlinesBetweenOption,
): NewlinesBetweenValueGetter<
  SortingNodeWithOverloadSignatureImplementation<T>
> {
  return ({ computedNewlinesBetween, right, left }) => {
    if (
      left.overloadSignatureImplementation &&
      left.overloadSignatureImplementation ===
        right.overloadSignatureImplementation
    ) {
      return newlinesBetweenOverloadSignatures
    }
    return computedNewlinesBetween
  }
}
