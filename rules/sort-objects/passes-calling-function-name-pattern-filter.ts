import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { NodeValuesComputer } from '../../utils/scoped-regex/matches-scoped-expressions'
import type { ScopedRegexOption } from '../../types/scoped-regex-option'
import type { ObjectParent } from './types'

import { matchesScopedExpressions } from '../../utils/scoped-regex/matches-scoped-expressions'

/**
 * Checks if the object passes the calling function name pattern filter.
 *
 * @param params - Parameters.
 * @param params.callingFunctionNamePattern - The pattern to evaluate.
 * @param params.parentNodes - The parent nodes of the object.
 * @param params.sourceCode - The source code object.
 * @returns True if the object passes the filter, false otherwise.
 */
export function passesCallingFunctionNamePatternFilter({
  callingFunctionNamePattern,
  parentNodes,
  sourceCode,
}: {
  callingFunctionNamePattern: ScopedRegexOption | undefined
  sourceCode: TSESLint.SourceCode
  parentNodes: ObjectParent[]
}): boolean {
  return matchesScopedExpressions({
    allowedNodeTypes: new Set([AST_NODE_TYPES.CallExpression]),
    nodeValuesComputer: buildNodeValuesComputer(sourceCode),
    scopedRegexOption: callingFunctionNamePattern,
    parentNodes,
  })
}

function buildNodeValuesComputer(
  sourceCode: TSESLint.SourceCode,
): NodeValuesComputer<AST_NODE_TYPES.CallExpression> {
  return node => [sourceCode.getText(node.callee)]
}
