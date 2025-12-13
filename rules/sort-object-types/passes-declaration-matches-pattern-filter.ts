import type { TSESLint } from '@typescript-eslint/utils'

import type { NodeValuesComputer } from '../../utils/scoped-regex/matches-scoped-expressions'
import type { ScopedRegexOption } from '../../types/scoped-regex-option'
import type { ObjectTypeParentType, ObjectTypeParent } from './types'

import { matchesScopedExpressions } from '../../utils/scoped-regex/matches-scoped-expressions'
import { computeNodeParentName } from './compute-node-parent-name'
import { objectTypeParentTypes } from './types'

/**
 * Checks whether the parent node's name matches the given pattern.
 *
 * @param params - The parameters object.
 * @param params.declarationMatchesPattern - The regex pattern to match against.
 * @param params.parentNodes - The parent nodes to check.
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
  parentNodes: ObjectTypeParent[]
  sourceCode: TSESLint.SourceCode
}): boolean {
  return matchesScopedExpressions({
    nodeValuesComputer: buildNodeValuesComputer(sourceCode),
    allowedNodeTypes: new Set(objectTypeParentTypes),
    scopedRegexOption: declarationMatchesPattern,
    parentNodes,
  })
}

function buildNodeValuesComputer(
  sourceCode: TSESLint.SourceCode,
): NodeValuesComputer<ObjectTypeParentType> {
  return node => [computeNodeParentName(node, sourceCode)]
}
