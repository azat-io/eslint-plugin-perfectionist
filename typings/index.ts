import type { TSESTree } from '@typescript-eslint/types'

export enum OptionalityOrder {
  'optional-first' = 'optional-first',
  'required-first' = 'required-first',
  'ignore' = 'ignore',
}

export type PartitionComment = string[] | boolean | string

export interface SortingNode<Node extends TSESTree.Node = TSESTree.Node> {
  hasMultipleImportDeclarations?: boolean
  dependencies?: string[]
  group?: string
  name: string
  size: number
  node: Node
}
