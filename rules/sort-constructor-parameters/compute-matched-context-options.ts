import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Options } from './types'

import { passesAllNamesMatchPatternFilter } from '../../utils/context-matching/passes-all-names-match-pattern-filter'
import { passesAstSelectorFilter } from '../../utils/context-matching/passes-ast-selector-filter'
import { computeNodeName } from './compute-node-name'

/**
 * Computes the matched context options for a given constructor node.
 *
 * @param params - Parameters.
 * @param params.matchedAstSelectors - The matched AST selectors for a
 *   constructor node.
 * @param params.params - The constructor parameters to compute the context
 *   options for.
 * @param params.context - The rule context.
 * @returns The matched context options or undefined if none match.
 */
export function computeMatchedContextOptions<MessageIds extends string>({
  matchedAstSelectors,
  context,
  params,
}: {
  context: Readonly<RuleContext<MessageIds, Options>>
  matchedAstSelectors: ReadonlySet<string>
  params: TSESTree.Parameter[]
}): Options[number] | undefined {
  let nodeNames = params
    .filter(parameter => parameter.type !== AST_NODE_TYPES.RestElement)
    .map(parameter =>
      computeNodeName({ sourceCode: context.sourceCode, node: parameter }),
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
  /* v8 ignore if -- Filtered at validation level */
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
