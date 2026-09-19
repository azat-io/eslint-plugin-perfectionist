import type { RegexOption } from '../../types/common-options'

import { passesAllNamesMatchPatternFilter } from './passes-all-names-match-pattern-filter'
import { passesAstSelectorFilter } from './passes-ast-selector-filter'

/**
 * Checks if a context option applies to a node, based on the conditions of its
 * `useConfigurationIf` option.
 *
 * Only handles the `allNamesMatchPattern` and `matchesAstSelector` conditions,
 * which are shared by all rules. Rules supporting additional conditions check
 * them on their own.
 *
 * @param params - The parameters object.
 * @param params.matchedAstSelectors - The matched AST selectors for the node.
 * @param params.nodeNames - Names of the node elements to sort.
 * @param params.options - The context option to check.
 * @returns True if the context option has no `useConfigurationIf` or all of its
 *   conditions are met; otherwise, false.
 */
export function isContextOptionMatching({
  matchedAstSelectors,
  nodeNames,
  options,
}: {
  options: {
    useConfigurationIf?: {
      allNamesMatchPattern?: RegexOption
      matchesAstSelector?: string
    }
  }
  matchedAstSelectors: ReadonlySet<string>
  nodeNames: string[]
}): boolean {
  if (!options.useConfigurationIf) {
    return true
  }

  return (
    passesAllNamesMatchPatternFilter({
      allNamesMatchPattern: options.useConfigurationIf.allNamesMatchPattern,
      nodeNames,
    }) &&
    passesAstSelectorFilter({
      matchesAstSelector: options.useConfigurationIf.matchesAstSelector,
      matchedAstSelectors,
    })
  )
}
