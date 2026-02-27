import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Options } from './types'

import { computeMethodOrPropertyNameDetails } from './node-info/compute-method-or-property-name-details'
import { filterOptionsByAllNamesMatch } from '../../utils/filter-options-by-all-names-match'

/**
 * Computes the matched context options for a given class node.
 *
 * @param params - Parameters.
 * @param params.astSelector - The AST selector string currently evaluated.
 * @param params.context - The rule context.
 * @returns The matched context options or undefined if none match.
 */
export function computeMatchedContextOptions<MessageIds extends string>({
  classElements,
  astSelector,
  context,
}: {
  context: Readonly<RuleContext<MessageIds, Options>>
  classElements: TSESTree.ClassElement[]
  astSelector: string | null
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
