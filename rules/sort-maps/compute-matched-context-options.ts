import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Options } from './types'

import { filterOptionsByAllNamesMatch } from '../../utils/context-matching/filter-options-by-all-names-match'
import { passesAstSelectorFilter } from '../../utils/context-matching/passes-ast-selector-filter'
import { computeNodeName } from './compute-node-name'

/**
 * Computes the matched context options for a given map node.
 *
 * @param params - Parameters.
 * @param params.matchedAstSelectors - The matched AST selectors for a map node.
 * @param params.elements - The map elements to compute the context options for.
 * @param params.context - The rule context.
 * @returns The matched context options or undefined if none match.
 */
export function computeMatchedContextOptions<MessageIds extends string>({
  matchedAstSelectors,
  elements,
  context,
}: {
  elements: (TSESTree.SpreadElement | TSESTree.Expression | null)[]
  context: Readonly<RuleContext<MessageIds, Options>>
  matchedAstSelectors: ReadonlySet<string>
}): Options[number] | undefined {
  let nodeNames = elements
    .filter(
      element =>
        element !== null && element.type !== AST_NODE_TYPES.SpreadElement,
    )
    .map(element =>
      computeNodeName({ sourceCode: context.sourceCode, node: element }),
    )

  let matchedContextOptions = filterOptionsByAllNamesMatch({
    contextOptions: context.options,
    nodeNames,
  })

  return (
    matchedContextOptions.find(isSelectorBasedContextOptionMatching) ??
    matchedContextOptions.find(isFallbackContextOptionMatching)
  )

  function isSelectorBasedContextOptionMatching(
    options: Options[number],
  ): boolean {
    return passesAstSelectorFilter({
      matchesAstSelector: options.useConfigurationIf?.matchesAstSelector,
      matchedAstSelectors,
    })
  }

  function isFallbackContextOptionMatching(options: Options[number]): boolean {
    return options.useConfigurationIf?.matchesAstSelector === undefined
  }
}
