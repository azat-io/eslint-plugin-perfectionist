import type { Node } from '@typescript-eslint/types/dist/generated/ast-spec'

export enum SortType {
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
  node: Node
}
