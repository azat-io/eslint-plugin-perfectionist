import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { MessageId, Options } from './types'

import { computeMethodOrPropertyNameDetails } from './node-info/compute-method-or-property-name-details'
import { isContextOptionMatching } from '../../utils/context-matching/is-context-option-matching'

/**
 * Computes the matched context options for a given class node.
 *
 * @param params - Parameters.
 * @param params.matchedAstSelectors - The matched AST selectors for a class
 *   node.
 * @param params.context - The rule context.
 * @returns The matched context options or undefined if none match.
 */
export function computeMatchedContextOptions({
  matchedAstSelectors,
  classElements,
  context,
}: {
  context: Readonly<RuleContext<MessageId, Options>>
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
