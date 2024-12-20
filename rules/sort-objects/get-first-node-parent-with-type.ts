import type { TSESTree } from '@typescript-eslint/types'

type NodeOfType<Type> = { type: Type } & TSESTree.Node

export let getFirstNodeParentWithType = <
  NodeType extends TSESTree.AST_NODE_TYPES,
>({
  allowedTypes,
  node,
}: {
  allowedTypes: NodeType[]
  node: TSESTree.Node
}): NodeOfType<NodeType> | null => {
  let { parent } = node
  while (parent) {
    if ((allowedTypes as string[]).includes(parent.type)) {
      return parent as NodeOfType<NodeType>
    }

    ;({ parent } = parent)
  }
  return null
}
