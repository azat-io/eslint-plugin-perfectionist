export type PartitionComment = string[] | boolean | string

export interface SortingNode<Node extends unknown> {
  hasMultipleImportDeclarations?: boolean
  dependencies?: string[]
  group?: string
  name: string
  size: number
  node: Node
}

export enum GroupKind {
  'values-first' = 'values-first',
  'types-first' = 'types-first',
  'mixed' = 'mixed',
}
