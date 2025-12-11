import type { TSESLint } from '@typescript-eslint/utils'

import type {
  ObjectTypeParentForDeclarationMatch,
  ScopedRegexOption,
} from './types'

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
  let [parentNode] = parentNodes

  /* v8 ignore if -- @preserve Unsure how we can reach that case */
  if (!parentNode) {
    return false
  }

  return matches(
    computeNodeParentName(parentNode, sourceCode),
    declarationMatchesPattern,
  )
}
