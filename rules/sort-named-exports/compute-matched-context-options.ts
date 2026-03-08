import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { Options } from './types'

import { passesAllNamesMatchPatternFilter } from '../../utils/context-matching/passes-all-names-match-pattern-filter'
import { passesAstSelectorFilter } from '../../utils/context-matching/passes-ast-selector-filter'
import { computeNodeName } from './compute-node-name'

/**
 * Computes the matched context options for a given named export node.
 *
 * @param params - Parameters.
 * @param params.node - The named export node to compute the context options
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
  node: TSESTree.ExportNamedDeclaration
}): Options[number] | undefined {
  return context.options.find(options =>
    isContextOptionMatching({ matchedAstSelectors, options, node }),
  )
}

function isContextOptionMatching({
  matchedAstSelectors,
  options,
  node,
}: {
  matchedAstSelectors: ReadonlySet<string>
  node: TSESTree.ExportNamedDeclaration
  options: Options[number]
}): boolean {
  if (!options.useConfigurationIf) {
    return true
  }

  let nodeNames = node.specifiers.map(specifier =>
    computeNodeName(specifier, !!options.ignoreAlias),
  )

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
