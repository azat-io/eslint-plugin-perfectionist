import type { Alternative } from '@eslint-community/regexpp/ast'
import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

/**
 * Produces a pseudo literal node representing a regex alternative.
 *
 * @param parameters - Source literal context and alternative.
 * @returns Literal node mirroring the alternative segment.
 */
export function createPseudoLiteralNode({
  literalNode,
  alternative,
  sourceCode,
}: {
  sourceCode: TSESLint.SourceCode
  literalNode: TSESTree.Literal
  alternative: Alternative
}): TSESTree.Literal {
  let [literalStart] = literalNode.range
  let offsetStart = literalStart + alternative.start
  let offsetEnd = literalStart + alternative.end
  let range: TSESTree.Range = [offsetStart, offsetEnd]
  let loc = {
    start: sourceCode.getLocFromIndex(range[0]),
    end: sourceCode.getLocFromIndex(range[1]),
  }

  return {
    type: AST_NODE_TYPES.Literal,
    value: alternative.raw,
    raw: alternative.raw,
    parent: literalNode,
    range,
    loc,
  } as TSESTree.Literal
}
