import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  ScopedRegexOption,
  SingleRegexOption,
} from '../../types/scoped-regex-option'
import type { ObjectParent } from './types'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { partitionPatternsByScope } from './partition-patterns-by-scope'
import { matches } from '../../utils/matches'

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
  if (!declarationCommentMatchesPattern) {
    return true
  }

  let { shallowScopePatterns, deepScopePatterns } = partitionPatternsByScope(
    declarationCommentMatchesPattern,
  )

  return (
    matchesShallowScopedExpressions({
      patterns: shallowScopePatterns,
      parentNodes,
      sourceCode,
    }) ||
    matchesDeepScopedExpressions({
      patterns: deepScopePatterns,
      parentNodes,
      sourceCode,
    })
  )
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

function matchesShallowScopedExpressions({
  parentNodes,
  sourceCode,
  patterns,
}: {
  sourceCode: TSESLint.SourceCode
  patterns: SingleRegexOption[]
  parentNodes: ObjectParent[]
}): boolean {
  let [objectParent] = parentNodes

  /* v8 ignore if -- @preserve Unsure how we can reach that case */
  if (!objectParent) {
    return false
  }

  return matchesParent({
    objectParent,
    sourceCode,
    patterns,
  })
}

function matchesParent({
  objectParent,
  sourceCode,
  patterns,
}: {
  sourceCode: TSESLint.SourceCode
  patterns: SingleRegexOption[]
  objectParent: ObjectParent
}): boolean {
  let nodeForComment = computeRelevantNodeForComment(objectParent)
  let parentComments = sourceCode.getCommentsBefore(nodeForComment)

  return matchesParentComments({
    parentComments,
    patterns,
  })
}

function matchesParentComments({
  parentComments,
  patterns,
}: {
  parentComments: TSESTree.Comment[]
  patterns: SingleRegexOption[]
}): boolean {
  return patterns.some(patternMatchesParentComment)

  function patternMatchesParentComment(pattern: SingleRegexOption): boolean {
    return parentComments.some(comment =>
      matches(comment.value.trim(), pattern),
    )
  }
}

function matchesDeepScopedExpressions({
  parentNodes,
  sourceCode,
  patterns,
}: {
  sourceCode: TSESLint.SourceCode
  patterns: SingleRegexOption[]
  parentNodes: ObjectParent[]
}): boolean {
  return parentNodes.some(objectParent =>
    matchesParent({
      objectParent,
      sourceCode,
      patterns,
    }),
  )
}
