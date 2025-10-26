import type {
  CapturingGroup,
  Alternative,
  Pattern,
  Group,
} from '@eslint-community/regexpp/ast'

/**
 * Checks whether an alternative is nested inside a sortable capturing context.
 *
 * @param node - Parent node of the alternative.
 * @returns True when the parent supports alternative reordering.
 */
export function isCapturingContext(
  node: Alternative['parent'],
): node is CapturingGroup | Pattern | Group {
  return (
    node.type === 'CapturingGroup' ||
    node.type === 'Group' ||
    node.type === 'Pattern'
  )
}
