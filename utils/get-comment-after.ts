import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

export let getCommentAfter = (
  node: TSESTree.Token | TSESTree.Node,
  source: TSESLint.SourceCode,
): TSESTree.Comment | null => {
  let token = source.getTokenAfter(node, {
    filter: ({ value, type }) =>
      !(type === 'Punctuator' && [',', ';', ':'].includes(value)),
    includeComments: true,
  })

  if (
    (token?.type === 'Block' || token?.type === 'Line') &&
    node.loc.end.line === token.loc.end.line
  ) {
    return token
  }

  return null
}
