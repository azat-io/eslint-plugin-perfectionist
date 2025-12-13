import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { NodeValuesComputer } from '../../utils/scoped-regex/matches-scoped-expressions'
import type { ScopedRegexOption } from '../../types/scoped-regex-option'
import type { ObjectTypeParentType, ObjectTypeParent } from './types'

import { matchesScopedExpressions } from '../../utils/scoped-regex/matches-scoped-expressions'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { objectTypeParentTypes } from './types'

/**
 * Checks if the object passes the declaration comment matches filter.
 *
 * @param params - Parameters.
 * @param params.declarationCommentMatchesPattern - The pattern to evaluate.
 * @param params.parentNodes - The parent nodes of the object type.
 * @param params.sourceCode - The source code object.
 * @returns True if the object type passes the filter, false otherwise.
 */
export function passesDeclarationCommentMatchesFilter({
  declarationCommentMatchesPattern,
  parentNodes,
  sourceCode,
}: {
  declarationCommentMatchesPattern: ScopedRegexOption | undefined
  parentNodes: ObjectTypeParent[]
  sourceCode: TSESLint.SourceCode
}): boolean {
  return matchesScopedExpressions({
    nodeValuesComputer: buildNodeValuesComputer(sourceCode),
    scopedRegexOption: declarationCommentMatchesPattern,
    allowedNodeTypes: new Set(objectTypeParentTypes),
    parentNodes,
  })
}

function computeRelevantNodeForComment(
  objectParent: ObjectTypeParent,
): TSESTree.Node {
  let objectParentType = objectParent.type
  switch (objectParentType) {
    case AST_NODE_TYPES.TSInterfaceDeclaration:
    case AST_NODE_TYPES.TSTypeAliasDeclaration:
    case AST_NODE_TYPES.TSPropertySignature:
    case AST_NODE_TYPES.PropertyDefinition:
      return objectParent
    case AST_NODE_TYPES.VariableDeclarator:
      return objectParent.parent
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(objectParentType)
  }
}

function buildNodeValuesComputer(
  sourceCode: TSESLint.SourceCode,
): NodeValuesComputer<ObjectTypeParentType> {
  return node => {
    let nodeForComment = computeRelevantNodeForComment(node)

    return sourceCode
      .getCommentsBefore(nodeForComment)
      .map(comment => comment.value.trim())
  }
}
