import type {
  LookaroundAssertion,
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
): node is LookaroundAssertion | CapturingGroup | Pattern | Group {
  return (
    node.type === 'CapturingGroup' ||
    node.type === 'Group' ||
    node.type === 'Pattern'
  )
}
