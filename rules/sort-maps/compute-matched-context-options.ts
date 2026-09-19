import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { MessageId, Options } from './types'

import { isContextOptionMatching } from '../../utils/context-matching/is-context-option-matching'
import { computeNodeName } from './compute-node-name'

/**
 * Computes the matched context options for a given map node.
 *
 * @param params - Parameters.
 * @param params.matchedAstSelectors - The matched AST selectors for a map node.
 * @param params.elements - The map elements to compute the context options for.
 * @param params.context - The rule context.
 * @returns The matched context options or undefined if none match.
 */
export function computeMatchedContextOptions({
  matchedAstSelectors,
  elements,
  context,
}: {
  elements: (TSESTree.SpreadElement | TSESTree.Expression | null)[]
  context: Readonly<RuleContext<MessageId, Options>>
  matchedAstSelectors: ReadonlySet<string>
}): Options[number] | undefined {
  let nodeNames = elements
    .filter(
      element =>
        element !== null && element.type !== AST_NODE_TYPES.SpreadElement,
    )
    .map(element =>
      computeNodeName({ sourceCode: context.sourceCode, node: element }),
    )

  return context.options.find(options =>
    isContextOptionMatching({ matchedAstSelectors, nodeNames, options }),
  )
}
