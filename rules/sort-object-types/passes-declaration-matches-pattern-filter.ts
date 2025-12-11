import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { ObjectTypeParentForDeclarationMatch } from './types'
import type { RegexOption } from '../../types/common-options'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { matches } from '../../utils/matches'

/**
 * Checks whether the parent node's name matches the given pattern.
 *
 * @param params - The parameters object.
 * @param params.declarationMatchesPattern - The regex pattern to match against.
 * @param params.parentNode - The parent node to check.
 * @param params.sourceCode - The source code object.
 * @returns True if the parent node's name passes the pattern filter, false
 *   otherwise.
 */
export function passesDeclarationMatchesPatternFilter({
  declarationMatchesPattern,
  parentNode,
  sourceCode,
}: {
  parentNode: ObjectTypeParentForDeclarationMatch | null
  declarationMatchesPattern: RegexOption | undefined
  sourceCode: TSESLint.SourceCode
}): boolean {
  if (!declarationMatchesPattern) {
    return true
  }
  /* v8 ignore if -- @preserve Unsure how we can reach that case */
  if (!parentNode) {
    return false
  }

  return matches(
    computeNodeParentName(parentNode, sourceCode),
    declarationMatchesPattern,
  )
}

function computeNodeParentName(
  node: ObjectTypeParentForDeclarationMatch,
  sourceCode: TSESLint.SourceCode,
): string {
  switch (node.type) {
    case AST_NODE_TYPES.TSTypeAliasDeclaration:
    case AST_NODE_TYPES.TSInterfaceDeclaration:
      return node.id.name
    case AST_NODE_TYPES.TSPropertySignature:
      return computePropertySignatureName(node)
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }

  function computePropertySignatureName(
    propertySignature: TSESTree.TSPropertySignature,
  ): string {
    switch (propertySignature.key.type) {
      case AST_NODE_TYPES.Identifier:
        return propertySignature.key.name
      case AST_NODE_TYPES.Literal:
        return String(propertySignature.key.value)
      /* v8 ignore next 2 -- @preserve Unsure how we can reach that case */
      default:
        return sourceCode.getText(propertySignature.key)
    }
  }
}
