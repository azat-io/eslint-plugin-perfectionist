import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import type { MessageId, Options } from './types'

import { isContextOptionMatching } from '../../utils/context-matching/is-context-option-matching'
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
export function computeMatchedContextOptions({
  matchedAstSelectors,
  sourceCode,
  context,
  node,
}: {
  context: Readonly<RuleContext<MessageId, Options>>
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
