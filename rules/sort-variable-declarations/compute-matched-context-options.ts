import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import type { Options } from './types'

import { passesAllNamesMatchPatternFilter } from '../../utils/context-matching/passes-all-names-match-pattern-filter'
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
