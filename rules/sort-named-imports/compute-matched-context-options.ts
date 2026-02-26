import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { Options } from './types'

import { filterOptionsByAllNamesMatch } from '../../utils/context-matching/filter-options-by-all-names-match'
import { passesAstSelectorFilter } from '../../utils/context-matching/passes-ast-selector-filter'
import { computeNodeName } from './compute-node-name'

/**
 * Computes the matched context options for a given named import node.
 *
 * @param params - Parameters.
 * @param params.node - The named import node to compute the context options
 *   for.
 * @param params.matchedAstSelectors - The matched AST selectors for a named
 *   export node.
 * @param params.context - The rule context.
 * @returns The matched context options or undefined if none match.
 */
export function computeMatchedContextOptions<MessageIds extends string>({
  matchedAstSelectors,
  context,
  node,
}: {
  context: Readonly<RuleContext<MessageIds, Options>>
  matchedAstSelectors: ReadonlySet<string>
  node: TSESTree.ImportDeclaration
}): Options[number] | undefined {
  let nodeNames = node.specifiers
    .filter(
      (specifier): specifier is TSESTree.ImportSpecifier =>
        specifier.type === 'ImportSpecifier',
    )
    .map(specifier => computeNodeName(specifier, true))

  let matchedContextOptions = filterOptionsByAllNamesMatch({
    contextOptions: context.options,
    nodeNames,
  })

  return matchedContextOptions.find(isContextOptionMatching)

  function isContextOptionMatching(options: Options[number]): boolean {
    if (!options.useConfigurationIf) {
      return true
    }

    if (
      !passesAstSelectorFilter({
        matchesAstSelector: options.useConfigurationIf.matchesAstSelector,
        matchedAstSelectors,
      })
    ) {
      return false
    }

    return true
  }
}
