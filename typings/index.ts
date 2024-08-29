import type { TSESTree } from '@typescript-eslint/types'

export interface SortingNode<Node extends TSESTree.Node = TSESTree.Node> {
  hasMultipleImportDeclarations?: boolean
  /**
   * Custom name used to check if a node is a dependency of another node. If unspecified, defaults to the node's name.
   */
  dependencyName?: string
  dependencies?: string[]
  group?: string
  name: string
  size: number
  node: Node
}
