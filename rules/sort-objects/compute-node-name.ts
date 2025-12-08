import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

export function computeNodeName({
  sourceCode,
  property,
}: {
  sourceCode: TSESLint.SourceCode
  property: TSESTree.Property
}): string {
  switch (property.key.type) {
    case AST_NODE_TYPES.Identifier:
      return property.key.name
    case AST_NODE_TYPES.Literal:
      return `${property.key.value}`
    default:
      return sourceCode.getText(property.key)
  }
}
