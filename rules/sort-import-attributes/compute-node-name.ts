import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

/**
 * Extracts the name of an import attribute for sorting purposes.
 *
 * For identifier keys, returns the identifier name. For literal keys, returns
 * the string value. Falls back to source code text if needed.
 *
 * @param attribute - The import attribute AST node.
 * @param sourceCode - The ESLint source code object.
 * @returns The attribute name to use for sorting.
 */
export function computeNodeName(
  attribute: TSESTree.ImportAttribute,
  sourceCode: TSESLint.SourceCode,
): string {
  let { key } = attribute
  switch (key.type) {
    case AST_NODE_TYPES.Identifier:
      return key.name
    case AST_NODE_TYPES.Literal:
      return key.value?.toString() ?? sourceCode.getText(attribute)
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(key)
  }
}
