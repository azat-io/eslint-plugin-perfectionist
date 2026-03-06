import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { RegexOption } from '../../types/common-options'
import type { Options } from './types'

import { filterOptionsByAllNamesMatch } from '../../utils/context-matching/filter-options-by-all-names-match'
import { passesAstSelectorFilter } from '../../utils/context-matching/passes-ast-selector-filter'
import { computeNodeName } from './compute-node-name'
import { matches } from '../../utils/matches'

/**
 * Computes the matched context options for a given JSX element node.
 *
 * @param params - Parameters.
 * @param params.matchedAstSelectors - The matched AST selectors for a JSX node.
 * @param params.sourceCode - The source code object.
 * @param params.node - The JSX element node to evaluate.
 * @param params.context - The rule context.
 * @returns The matched context options or undefined if none match.
 */
export function computeMatchedContextOptions({
  matchedAstSelectors,
  sourceCode,
  context,
  node,
}: {
  context: TSESLint.RuleContext<string, Options>
  matchedAstSelectors: ReadonlySet<string>
  sourceCode: TSESLint.SourceCode
  node: TSESTree.JSXElement
}): Options[number] | undefined {
  let nodeNames = node.openingElement.attributes
    .filter(attribute => attribute.type !== AST_NODE_TYPES.JSXSpreadAttribute)
    .map(attribute => computeNodeName(attribute))

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
    if (
      !passesAstSelectorFilter({
        matchesAstSelector: options.useConfigurationIf?.matchesAstSelector,
        matchedAstSelectors,
      })
    ) {
      return false
    }

    return passesUseConfigurationIfFilters(options)
  }

  function isFallbackContextOptionMatching(options: Options[number]): boolean {
    if (options.useConfigurationIf?.matchesAstSelector !== undefined) {
      return false
    }

    return passesUseConfigurationIfFilters(options)
  }

  function passesUseConfigurationIfFilters(options: Options[number]): boolean {
    if (!options.useConfigurationIf) {
      return true
    }

    return passesTagMatchesPatternFilter({
      tagMatchesPattern: options.useConfigurationIf.tagMatchesPattern,
      sourceCode,
      node,
    })
  }
}

function passesTagMatchesPatternFilter({
  tagMatchesPattern,
  sourceCode,
  node,
}: {
  tagMatchesPattern: RegexOption | undefined
  sourceCode: TSESLint.SourceCode
  node: TSESTree.JSXElement
}): boolean {
  if (!tagMatchesPattern) {
    return true
  }
  return matches(
    sourceCode.getText(node.openingElement.name),
    tagMatchesPattern,
  )
}
