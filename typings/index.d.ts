import type { Node } from '@typescript-eslint/types/dist/generated/ast-spec'

export interface SortingNode {
  size: number
  name: string
  node: Node
}
