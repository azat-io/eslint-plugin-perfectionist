import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Options } from './types'

import { filterOptionsByAllNamesMatch } from '../../utils/context-matching/filter-options-by-all-names-match'
import { computeMethodOrPropertyNameDetails } from './node-info/compute-method-or-property-name-details'
import { passesAstSelectorFilter } from '../../utils/context-matching/passes-ast-selector-filter'

/**
 * Computes the matched context options for a given class node.
 *
 * @param params - Parameters.
 * @param params.matchedAstSelectors - The matched AST selectors for a class
 *   node.
 * @param params.context - The rule context.
 * @returns The matched context options or undefined if none match.
 */
export function computeMatchedContextOptions<MessageIds extends string>({
  matchedAstSelectors,
  classElements,
  context,
}: {
  context: Readonly<RuleContext<MessageIds, Options>>
  matchedAstSelectors: ReadonlySet<string>
  classElements: TSESTree.ClassElement[]
}): Options[number] | undefined {
  let nodeNames = classElements
    .filter(
      element =>
        element.type !== AST_NODE_TYPES.StaticBlock &&
        element.type !== AST_NODE_TYPES.TSIndexSignature,
    )
    .map(
      element =>
        computeMethodOrPropertyNameDetails(element, context.sourceCode).name,
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
