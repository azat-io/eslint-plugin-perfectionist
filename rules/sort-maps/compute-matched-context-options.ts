import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Options } from './types'

import { filterOptionsByAllNamesMatch } from '../../utils/context-matching/filter-options-by-all-names-match'
import { computeNodeName } from './compute-node-name'

/**
 * Computes the matched context options for a given map node.
 *
 * @param params - Parameters.
 * @param params.astSelector - The AST selector string currently evaluated.
 * @param params.elements - The map elements to compute the context options for.
 * @param params.context - The rule context.
 * @returns The matched context options or undefined if none match.
 */
export function computeMatchedContextOptions<MessageIds extends string>({
  astSelector,
  elements,
  context,
}: {
  elements: (TSESTree.SpreadElement | TSESTree.Expression | null)[]
  context: Readonly<RuleContext<MessageIds, Options>>
  astSelector: string | null
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

  return matchedContextOptions.find(isContextOptionMatching)

  function isContextOptionMatching(options: Options[number]): boolean {
    return passesAstSelectorFilter({
      matchesAstSelector: options.useConfigurationIf?.matchesAstSelector,
      astSelector,
    })
  }
}

function passesAstSelectorFilter({
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
