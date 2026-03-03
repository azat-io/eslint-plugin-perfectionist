/**
 * Checks if the given AST selector matches the expected AST selector.
 *
 * @param params - The parameters object.
 * @param params.matchesAstSelector - The AST selector to match against, or
 *   undefined if no selector is specified.
 * @param params.astSelector - The AST selector currently being evaluated, or
 *   null if no selector is being evaluated.
 * @returns True if the given AST selector matches the expected AST selector,
 *   false otherwise.
 */
export function passesAstSelectorFilter({
  matchesAstSelector,
  astSelector,
}: {
  matchesAstSelector: undefined | string
  astSelector: string | null
}): boolean {
  if (!matchesAstSelector) {
    return astSelector === null
  }

  return matchesAstSelector === astSelector
}
