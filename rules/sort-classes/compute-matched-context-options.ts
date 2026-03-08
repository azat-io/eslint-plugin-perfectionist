import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Options } from './types'

import { passesAllNamesMatchPatternFilter } from '../../utils/context-matching/passes-all-names-match-pattern-filter'
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
