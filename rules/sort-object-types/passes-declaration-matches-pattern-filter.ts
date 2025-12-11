import type { TSESLint } from '@typescript-eslint/utils'

import type {
  ObjectTypeParentForDeclarationMatch,
  ScopedRegexOption,
} from './types'
import type { SingleRegexOption } from '../sort-objects/partition-patterns-by-scope'

import { partitionPatternsByScope } from './partition-patterns-by-scope'
import { computeNodeParentName } from './compute-node-parent-name'
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
  parentNodes,
  sourceCode,
}: {
  declarationMatchesPattern: ScopedRegexOption | undefined
  parentNodes: ObjectTypeParentForDeclarationMatch[]
  sourceCode: TSESLint.SourceCode
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

function matchesShallowScopedExpressions({
  parentNodes,
  sourceCode,
  patterns,
}: {
  parentNodes: ObjectTypeParentForDeclarationMatch[]
  sourceCode: TSESLint.SourceCode
  patterns: SingleRegexOption[]
}): boolean {
  let [firstParent] = parentNodes
  // v8 ignore if -- @preserve Unsure how we can reach that case
  if (!firstParent) {
    return false
  }

  return matchesParentExpression({
    propertyExpression: firstParent,
    sourceCode,
    patterns,
  })
}

function matchesDeepScopedExpressions({
  parentNodes,
  sourceCode,
  patterns,
}: {
  parentNodes: ObjectTypeParentForDeclarationMatch[]
  sourceCode: TSESLint.SourceCode
  patterns: SingleRegexOption[]
}): boolean {
  return parentNodes.some(parentNode =>
    matchesParentExpression({
      propertyExpression: parentNode,
      sourceCode,
      patterns,
    }),
  )
}

function matchesParentExpression({
  propertyExpression,
  sourceCode,
  patterns,
}: {
  propertyExpression: ObjectTypeParentForDeclarationMatch
  sourceCode: TSESLint.SourceCode
  patterns: SingleRegexOption[]
}): boolean {
  let parentName = computeNodeParentName(propertyExpression, sourceCode)
  return patterns.some(pattern => matches(parentName, pattern))
}
