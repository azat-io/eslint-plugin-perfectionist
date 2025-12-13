import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { NodeValuesComputer } from '../../utils/scoped-regex/matches-scoped-expressions'
import type { ScopedRegexOption } from '../../types/scoped-regex-option'
import type { ObjectParent } from './types'

import { computePropertyOrVariableDeclaratorName } from './compute-property-or-variable-declarator-name'
import { matchesScopedExpressions } from '../../utils/scoped-regex/matches-scoped-expressions'

let allowedTypes = [
  AST_NODE_TYPES.VariableDeclarator,
  AST_NODE_TYPES.Property,
] as const
type AllowedType = (typeof allowedTypes)[number]

/**
 * Checks whether the node parent names match the given pattern.
 *
 * @param params - The parameters object.
 * @param params.declarationMatchesPattern - The regex pattern to match against.
 * @param params.parentNodes - The parent nodes to check.
 * @param params.sourceCode - The source code object.
 * @returns True if the parent node parent names passes the pattern filter,
 *   false otherwise.
 */
export function passesDeclarationMatchesPatternFilter({
  declarationMatchesPattern,
  parentNodes,
  sourceCode,
}: {
  declarationMatchesPattern: ScopedRegexOption | undefined
  sourceCode: TSESLint.SourceCode
  parentNodes: ObjectParent[]
}): boolean {
  return matchesScopedExpressions({
    nodeValuesComputer: buildNodeValuesComputer(sourceCode),
    scopedRegexOption: declarationMatchesPattern,
    allowedNodeTypes: new Set(allowedTypes),
    parentNodes,
  })
}

function buildNodeValuesComputer(
  sourceCode: TSESLint.SourceCode,
): NodeValuesComputer<AllowedType> {
  return node => [
    computePropertyOrVariableDeclaratorName({
      sourceCode,
      node,
    }),
  ]
}
