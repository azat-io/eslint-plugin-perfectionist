import type { TSESTree } from '@typescript-eslint/types'

export enum OptionalityOrder {
  'optional-first' = 'optional-first',
  'required-first' = 'required-first',
  'ignore' = 'ignore',
}

export type PartitionComment = string[] | boolean | string

export interface SortingNode {
  hasMultipleImportDeclarations?: boolean
  dependencies?: string[]
  node: TSESTree.Node
  group?: string
  name: string
  size: number
}
