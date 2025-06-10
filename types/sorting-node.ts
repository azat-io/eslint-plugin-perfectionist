import type { TSESTree } from '@typescript-eslint/types'

export interface SortingNode<Node extends TSESTree.Node = TSESTree.Node> {
  addSafetySemicolonWhenInline?: boolean
  isEslintDisabled: boolean
  partitionId: number
  group: string
  name: string
  size: number
  node: Node
}
