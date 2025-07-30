import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

export function rangeToDiff(
  node: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
): number {
  let nodeText = sourceCode.getText(node)
  let endsWithCommaOrSemicolon =
    nodeText.endsWith(';') || nodeText.endsWith(',')
  let [from, to] = node.range
  return to - from - (endsWithCommaOrSemicolon ? 1 : 0)
}
