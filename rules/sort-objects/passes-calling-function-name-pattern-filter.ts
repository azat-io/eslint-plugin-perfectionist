import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { SingleRegexOption } from './partition-patterns-by-scope'
import type { ScopedRegexOption, ObjectParent } from './types'

import { partitionPatternsByScope } from './partition-patterns-by-scope'
import { matches } from '../../utils/matches'

/**
 * Checks if the object passes the calling function name pattern filter.
 *
 * @param params - Parameters.
 * @param params.callingFunctionNamePattern - The pattern to evaluate.
 * @param params.objectParents - The parent nodes of the object.
 * @param params.sourceCode - The source code object.
 * @returns True if the object passes the filter, false otherwise.
 */
export function passesCallingFunctionNamePatternFilter({
  callingFunctionNamePattern,
  objectParents,
  sourceCode,
}: {
  callingFunctionNamePattern: ScopedRegexOption | undefined
  sourceCode: TSESLint.SourceCode
  objectParents: ObjectParent[]
}): boolean {
  if (!callingFunctionNamePattern) {
    return true
  }

  let { shallowScopePatterns, deepScopePatterns } = partitionPatternsByScope(
    callingFunctionNamePattern,
  )

  return (
    matchesShallowScopedExpressions({
      patterns: shallowScopePatterns,
      objectParents,
      sourceCode,
    }) ||
    matchesDeepScopedExpressions({
      patterns: deepScopePatterns,
      objectParents,
      sourceCode,
    })
  )
}

function matchesDeepScopedExpressions({
  objectParents,
  sourceCode,
  patterns,
}: {
  sourceCode: TSESLint.SourceCode
  patterns: SingleRegexOption[]
  objectParents: ObjectParent[]
}): boolean {
  let callExpressions = objectParents.filter(
    parent => parent.type === AST_NODE_TYPES.CallExpression,
  )
  return callExpressions.some(callExpression =>
    matchesCallExpression({
      callExpression,
      sourceCode,
      patterns,
    }),
  )
}

function matchesShallowScopedExpressions({
  objectParents,
  sourceCode,
  patterns,
}: {
  sourceCode: TSESLint.SourceCode
  patterns: SingleRegexOption[]
  objectParents: ObjectParent[]
}): boolean {
  let [firstParent] = objectParents
  if (firstParent?.type !== AST_NODE_TYPES.CallExpression) {
    return false
  }

  return matchesCallExpression({
    callExpression: firstParent,
    sourceCode,
    patterns,
  })
}

function matchesCallExpression({
  callExpression,
  sourceCode,
  patterns,
}: {
  callExpression: TSESTree.CallExpression
  sourceCode: TSESLint.SourceCode
  patterns: SingleRegexOption[]
}): boolean {
  let callExpressionName = sourceCode.getText(callExpression.callee)

  return patterns.some(pattern => matches(callExpressionName, pattern))
}
