import type { TSESTree } from '@typescript-eslint/types'

type NodeOfType<Type> = { type: Type } & TSESTree.Node

export let getFirstNodeParentWithType = <
  NodeType extends TSESTree.AST_NODE_TYPES,
>({
  onlyFirstParent,
  allowedTypes,
  node,
}: {
  allowedTypes: NodeType[]
  onlyFirstParent: boolean
  node: TSESTree.Node
}): NodeOfType<NodeType> | null => {
  let { parent } = node
  if (onlyFirstParent) {
    return parent && (allowedTypes as string[]).includes(parent.type)
      ? (parent as NodeOfType<NodeType>)
      : null
  }
  while (parent) {
    if ((allowedTypes as string[]).includes(parent.type)) {
      return parent as NodeOfType<NodeType>
    }

    ;({ parent } = parent)
  }
  return null
}
