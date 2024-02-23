export enum SortType {
  'alphabetical' = 'alphabetical',
  'line-length' = 'line-length',
  'natural' = 'natural',
}

export enum SortOrder {
  'desc' = 'desc',
  'asc' = 'asc',
}

export type PartitionComment = string[] | boolean | string

export interface SortingNode<Node extends unknown> {
  hasMultipleImportDeclarations?: boolean
  dependencies?: string[]
  group?: string
  name: string
  size: number
  node: Node
}
