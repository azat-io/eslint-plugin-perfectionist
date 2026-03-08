/**
 * Checks if the given AST selector matches the expected AST selector.
 *
 * @param params - The parameters object.
 * @param params.matchesAstSelector - The AST selector to match against, or
 *   undefined if no selector is specified.
 * @param params.matchedAstSelectors - The matched AST selectors for a node.
 * @returns True if the given AST selector matches the expected AST selector, or
 *   if no selector is specified; otherwise, false.
 */
export function passesAstSelectorFilter({
  matchedAstSelectors,
  matchesAstSelector,
}: {
  matchedAstSelectors: ReadonlySet<string>
  matchesAstSelector: undefined | string
}): boolean {
  if (!matchesAstSelector) {
    return true
  }

  return matchedAstSelectors.has(matchesAstSelector)
}
