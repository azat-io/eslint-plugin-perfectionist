import type { TSESTree } from '@typescript-eslint/types'

type NodeWithDecorator = {
  decorators: TSESTree.Decorator[]
} & TSESTree.Node

/*
 * Projects without typescript-eslint parser will not have the `decorators`
 * property on the node, so add a fallback.
 */
export function getNodeDecorators(
  node: NodeWithDecorator,
): TSESTree.Decorator[] {
  /* v8 ignore next 2 */
  // eslint-disable-next-line typescript/no-unnecessary-condition
  return node.decorators ?? []
}
