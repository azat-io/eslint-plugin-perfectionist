import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { NodeValuesComputer } from '../../utils/scoped-regex/matches-scoped-expressions'
import type { ScopedRegexOption } from '../../types/scoped-regex-option'
import type { ObjectParentType, ObjectParent } from './types'

import { matchesScopedExpressions } from '../../utils/scoped-regex/matches-scoped-expressions'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { objectParentTypes } from './types'

/**
 * Checks if the object passes the declaration comment matches filter.
 *
 * @param params - Parameters.
 * @param params.declarationCommentMatchesPattern - The pattern to evaluate.
 * @param params.parentNodes - The parent nodes of the object.
 * @param params.sourceCode - The source code object.
 * @returns True if the object passes the filter, false otherwise.
 */
export function passesDeclarationCommentMatchesFilter({
  declarationCommentMatchesPattern,
  parentNodes,
  sourceCode,
}: {
  declarationCommentMatchesPattern: ScopedRegexOption | undefined
  sourceCode: TSESLint.SourceCode
  parentNodes: ObjectParent[]
}): boolean {
  return matchesScopedExpressions({
    nodeValuesComputer: buildNodeValuesComputer(sourceCode),
    scopedRegexOption: declarationCommentMatchesPattern,
    allowedNodeTypes: new Set(objectParentTypes),
    parentNodes,
  })
}

function computeRelevantNodeForComment(
  objectParent: ObjectParent,
): TSESTree.Node {
  let objectParentType = objectParent.type
  switch (objectParentType) {
    case AST_NODE_TYPES.VariableDeclarator:
      return objectParent.parent
    case AST_NODE_TYPES.CallExpression:
    case AST_NODE_TYPES.Property:
      return objectParent
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(objectParentType)
  }
}

function buildNodeValuesComputer(
  sourceCode: TSESLint.SourceCode,
): NodeValuesComputer<ObjectParentType> {
  return node => {
    let nodeForComment = computeRelevantNodeForComment(node)

    return sourceCode
      .getCommentsBefore(nodeForComment)
      .map(comment => comment.value.trim())
  }
}
