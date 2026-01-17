import type { TSESTree } from '@typescript-eslint/types'

export function rangeContainsRange(
  includingRange: TSESTree.Range,
  subRange: TSESTree.Range,
): boolean {
  return includingRange[0] <= subRange[0] && includingRange[1] >= subRange[1]
}
