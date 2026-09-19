import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { MessageId, Options } from './types'

import { isContextOptionMatching } from '../../utils/context-matching/is-context-option-matching'
import { computeNodeName } from './compute-node-name'

/**
 * Computes the matched context options for a given heritage clause parent node.
 *
 * @param params - Parameters.
 * @param params.heritageClauses - The heritage clauses of the parent node.
 * @param params.matchedAstSelectors - The matched AST selectors for an object
 *   node.
 * @param params.context - The rule context.
 * @returns The matched context options or undefined if none match.
 */
export function computeMatchedContextOptions({
  matchedAstSelectors,
  heritageClauses,
  context,
}: {
  heritageClauses: TSESTree.TSInterfaceHeritage[] | TSESTree.TSClassImplements[]
  context: Readonly<RuleContext<MessageId, Options>>
  matchedAstSelectors: ReadonlySet<string>
}): Options[number] | undefined {
  let nodeNames = heritageClauses.map(clause =>
    computeNodeName(clause.expression),
  )

  return context.options.find(options =>
    isContextOptionMatching({ matchedAstSelectors, nodeNames, options }),
  )
}
