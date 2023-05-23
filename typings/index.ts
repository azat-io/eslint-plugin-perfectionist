import type { TSESTree } from '@typescript-eslint/types'

export enum SortType {
  'alphabetical' = 'alphabetical',
  'natural' = 'natural',
  'line-length' = 'line-length',
}

export enum SortOrder {
  'asc' = 'asc',
  'desc' = 'desc',
}

export interface SortingNode {
  size: number
  name: string
  node: TSESTree.Node
}
