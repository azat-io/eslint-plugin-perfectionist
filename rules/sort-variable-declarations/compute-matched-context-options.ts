import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import type { Options } from './types'

import { filterOptionsByAllNamesMatch } from '../../utils/context-matching/filter-options-by-all-names-match'
import { passesAstSelectorFilter } from '../../utils/context-matching/passes-ast-selector-filter'
import { computeNodeName } from './compute-node-name'

/**
 * Computes the matched context options for a given variable declaration node.
 *
 * @param params - Parameters.
 * @param params.node - The variable declaration node to compute the context
 *   options for.
 * @param params.matchedAstSelectors - The matched AST selectors for an object
 *   node.
 * @param params.sourceCode - The ESLint source code object.
 * @param params.context - The rule context.
 * @returns The matched context options or undefined if none match.
 */
export function computeMatchedContextOptions<MessageIds extends string>({
  matchedAstSelectors,
  sourceCode,
  context,
  node,
}: {
  context: Readonly<RuleContext<MessageIds, Options>>
  matchedAstSelectors: ReadonlySet<string>
  node: TSESTree.VariableDeclaration
  sourceCode: TSESLint.SourceCode
}): Options[number] | undefined {
  let nodeNames = node.declarations.map(declaration =>
    computeNodeName({ node: declaration, sourceCode }),
  )

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
