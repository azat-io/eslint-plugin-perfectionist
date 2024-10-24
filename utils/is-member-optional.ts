import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

export let isMemberOptional = (node: TSESTree.Node): boolean => {
  switch (node.type) {
    case AST_NODE_TYPES.TSPropertySignature:
    case AST_NODE_TYPES.TSMethodSignature:
      return node.optional
  }

  return false
}
