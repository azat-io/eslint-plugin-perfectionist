import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { Options } from './types'

import { passesAllNamesMatchPatternFilter } from '../../utils/context-matching/passes-all-names-match-pattern-filter'
import { passesAstSelectorFilter } from '../../utils/context-matching/passes-ast-selector-filter'
import { computeNodeName } from './compute-node-name'

/**
 * Computes the matched context options for a given array node.
 *
 * @param params - Parameters.
 * @param params.matchedAstSelectors - The matched AST selectors for an array
 *   node.
 * @param params.elements - The array elements to compute the context options
 *   for.
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
    .filter(element => element !== null)
    .map(element =>
      computeNodeName({ sourceCode: context.sourceCode, node: element }),
    )

  return context.options.find(options =>
    isContextOptionMatching({ matchedAstSelectors, nodeNames, options }),
  )
}

function isContextOptionMatching({
  matchedAstSelectors,
  nodeNames,
  options,
}: {
  matchedAstSelectors: ReadonlySet<string>
  options: Options[number]
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
