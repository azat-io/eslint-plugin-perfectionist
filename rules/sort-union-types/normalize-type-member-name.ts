import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Normalizes union/intersection member text for stable sorting across
 * formatting styles.
 *
 * Multi-line parenthesized unions/intersections can include leading `|` or `&`
 * in raw source text, while formatter output often omits them. This function
 * removes only those leading separators (and adjacent whitespace) so the
 * comparator receives the same logical value in both forms.
 *
 * @param params - Values used to normalize member text.
 * @param params.type - Type node represented by the member text.
 * @param params.name - Raw source text extracted from the member node.
 * @returns Normalized member text used for sorting and matching.
 */
export function normalizeTypeMemberName({
  type,
  name,
}: {
  type: TSESTree.TypeNode
  name: string
}): string {
  if (
    type.type !== AST_NODE_TYPES.TSUnionType &&
    type.type !== AST_NODE_TYPES.TSIntersectionType
  ) {
    return name
  }

  return name.replace(/^\s*[&|][\s&|]*/u, '')
}
