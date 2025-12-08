import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { SingleRegexOption } from './partition-patterns-by-scope'
import type { ScopedRegexOption } from './types'

import { computePropertyOrVariableDeclaratorName } from './compute-property-or-variable-declarator-name'
import { partitionPatternsByScope } from './partition-patterns-by-scope'
import { matches } from '../../utils/matches'

type ObjectParent =
  | TSESTree.VariableDeclarator
  | TSESTree.CallExpression
  | TSESTree.Property

export function passesDeclarationMatchesPatternFilter({
  declarationMatchesPattern,
  objectParents,
  sourceCode,
}: {
  declarationMatchesPattern: ScopedRegexOption | undefined
  sourceCode: TSESLint.SourceCode
  objectParents: ObjectParent[]
}): boolean {
  if (!declarationMatchesPattern) {
    return true
  }

  let { shallowScopePatterns, deepScopePatterns } = partitionPatternsByScope(
    declarationMatchesPattern,
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
  let propertyExpressions = objectParents.filter(
    parent =>
      parent.type === AST_NODE_TYPES.VariableDeclarator ||
      parent.type === AST_NODE_TYPES.Property,
  )

  return propertyExpressions.some(propertyExpression =>
    matchesPropertyExpression({
      propertyExpression,
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
  if (
    firstParent?.type !== AST_NODE_TYPES.VariableDeclarator &&
    firstParent?.type !== AST_NODE_TYPES.Property
  ) {
    return false
  }

  return matchesPropertyExpression({
    propertyExpression: firstParent,
    sourceCode,
    patterns,
  })
}

function matchesPropertyExpression({
  propertyExpression,
  sourceCode,
  patterns,
}: {
  propertyExpression: TSESTree.VariableDeclarator | TSESTree.Property
  sourceCode: TSESLint.SourceCode
  patterns: SingleRegexOption[]
}): boolean {
  let propertyExpressionName = computePropertyOrVariableDeclaratorName({
    node: propertyExpression,
    sourceCode,
  })
  return patterns.some(pattern => matches(propertyExpressionName, pattern))
}
