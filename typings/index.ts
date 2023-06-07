import type { TSESTree } from '@typescript-eslint/types'

export enum SortType {
  'alphabetical' = 'alphabetical',
  'line-length' = 'line-length',
  'natural' = 'natural',
}

export enum SortOrder {
  'desc' = 'desc',
  'asc' = 'asc',
}

export interface SortingNode {
  node: TSESTree.Node
  name: string
  size: number
}
