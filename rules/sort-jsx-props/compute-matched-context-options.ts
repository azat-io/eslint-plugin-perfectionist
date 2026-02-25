import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Options } from './types'

import { filterOptionsByAllNamesMatch } from '../../utils/context-matching/filter-options-by-all-names-match'
import { computeNodeName } from './compute-node-name'
import { matches } from '../../utils/matches'

/**
 * Computes the matched context options for a given JSX element node.
 *
 * @param params - Parameters.
 * @param params.sourceCode - The source code object.
 * @param params.node - The JSX element node to evaluate.
 * @param params.context - The rule context.
 * @returns The matched context options or undefined if none match.
 */
export function computeMatchedContextOptions({
  sourceCode,
  context,
  node,
}: {
  context: TSESLint.RuleContext<string, Options>
  sourceCode: TSESLint.SourceCode
  node: TSESTree.JSXElement
}): Options[number] | undefined {
  return filterOptionsByAllNamesMatch({
    nodeNames: node.openingElement.attributes
      .filter(attribute => attribute.type !== AST_NODE_TYPES.JSXSpreadAttribute)
      .map(attribute => computeNodeName(attribute)),
    contextOptions: context.options,
  }).find(options => {
    if (!options.useConfigurationIf?.tagMatchesPattern) {
      return true
    }
    return matches(
      sourceCode.getText(node.openingElement.name),
      options.useConfigurationIf.tagMatchesPattern,
    )
  })
}
