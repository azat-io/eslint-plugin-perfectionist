import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import type { NodeOfType } from '../types/node-of-type'

type Sorter<
  MessageId extends string,
  Options extends BaseOptions[],
  NodeTypes extends AST_NODE_TYPES,
> = (parameters: {
  context: Readonly<RuleContext<MessageId, Options>>
  matchedAstSelectors: ReadonlySet<string>
  node: NodeOfType<NodeTypes>
}) => void

type AstListeners<NodeTypes extends AST_NODE_TYPES> = Record<
  string,
  (node: NodeOfType<NodeTypes>) => void
>

interface BaseOptions {
  useConfigurationIf?: {
    matchesAstSelector?: string
  }
}

/**
 * Builds the AST listeners for the rule based on the provided node types,
 * context, and sorter function.
 *
 * @param params - The parameters object.
 * @param params.nodeTypes - The AST node types to listen for.
 * @param params.context - The rule context.
 * @param params.sorter - The function that sorts the nodes based on the
 *   provided parameters.
 * @returns An object containing the AST listeners for the specified node types.
 */
export function buildAstListeners<
  MessageId extends string,
  Options extends BaseOptions[],
  NodeTypes extends AST_NODE_TYPES,
>({
  nodeTypes,
  context,
  sorter,
}: {
  sorter: Sorter<MessageId, Options, NoInfer<NodeTypes>>
  context: Readonly<RuleContext<MessageId, Options>>
  nodeTypes: NodeTypes[]
}): AstListeners<NodeTypes> {
  let emptyMatchedAstSelectors = new Set<string>()
  let matchedAstSelectorsByNode = new WeakMap<
    NodeOfType<NodeTypes>,
    Set<string>
  >()

  let allAstSelectors = [
    ...new Set(
      context.options
        .map(option => option.useConfigurationIf?.matchesAstSelector)
        .filter(matchesAstSelector => matchesAstSelector !== undefined),
    ),
  ]
  let allAstSelectorMatchers = allAstSelectors.map(
    astSelector =>
      [
        astSelector,
        buildMatchedAstSelectorsCollector({
          matchedAstSelectorsByNode,
          astSelector,
          nodeTypes,
        }),
      ] as const,
  )

  return {
    ...Object.fromEntries(allAstSelectorMatchers),
    ...Object.fromEntries(nodeTypes.map(buildNodeTypeExitListener)),
  }

  function buildNodeTypeExitListener(
    nodeType: NodeTypes,
  ): [string, (node: NodeOfType<NodeTypes>) => void] {
    return [
      `${nodeType}:exit`,
      (node: NodeOfType<NodeTypes>) =>
        sorter({
          matchedAstSelectors:
            matchedAstSelectorsByNode.get(node) ?? emptyMatchedAstSelectors,
          context,
          node,
        }),
    ]
  }
}

function buildMatchedAstSelectorsCollector<NodeTypes extends AST_NODE_TYPES>({
  matchedAstSelectorsByNode,
  astSelector,
  nodeTypes,
}: {
  matchedAstSelectorsByNode: WeakMap<NodeOfType<NodeTypes>, Set<string>>
  nodeTypes: NodeTypes[]
  astSelector: string
}): (node: TSESTree.Node) => void {
  return collectMatchedAstSelectors

  function collectMatchedAstSelectors(node: TSESTree.Node): void {
    if (!isNodeOfType(node)) {
      return
    }

    let matchedAstSelectors = matchedAstSelectorsByNode.get(node)
    if (!matchedAstSelectors) {
      matchedAstSelectors = new Set()
      matchedAstSelectorsByNode.set(node, matchedAstSelectors)
    }

    matchedAstSelectors.add(astSelector)
  }

  function isNodeOfType(node: TSESTree.Node): node is NodeOfType<NodeTypes> {
    return (nodeTypes as string[]).includes(node.type)
  }
}
