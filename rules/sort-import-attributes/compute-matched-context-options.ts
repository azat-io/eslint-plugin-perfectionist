import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { Options } from './types'

import { isContextOptionMatching } from '../../utils/context-matching/is-context-option-matching'
import { computeNodeName } from './compute-node-name'

/**
 * Computes the matched context options for a given import/export attributes
 * node.
 *
 * @param params - Parameters.
 * @param params.matchedAstSelectors - The matched AST selectors for an
 *   import/export declaration node.
 * @param params.attributes - The import attributes to compute the context
 *   options for.
 * @param params.context - The rule context.
 * @returns The matched context options or undefined if none match.
 */
export function computeMatchedContextOptions<MessageIds extends string>({
  matchedAstSelectors,
  attributes,
  context,
}: {
  context: Readonly<RuleContext<MessageIds, Options>>
  matchedAstSelectors: ReadonlySet<string>
  attributes: TSESTree.ImportAttribute[]
}): Options[number] | undefined {
  let nodeNames = attributes.map(attribute =>
    computeNodeName(attribute, context.sourceCode),
  )

  return context.options.find(options =>
    isContextOptionMatching({ matchedAstSelectors, nodeNames, options }),
  )
}
