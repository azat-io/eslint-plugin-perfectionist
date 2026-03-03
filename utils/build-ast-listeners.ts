import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import type { NodeOfType } from '../types/node-of-type'
import type { Settings } from './get-settings'

import { getSettings } from './get-settings'

type Sorter<
  MessageId extends string,
  Options extends BaseOptions[],
  NodeTypes extends AST_NODE_TYPES,
> = (parameters: {
  context: Readonly<RuleContext<MessageId, Options>>
  alreadyParsedNodes: Set<NodeOfType<NodeTypes>>
  node: NodeOfType<NodeTypes>
  astSelector: string | null
  settings: Settings
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
  let settings = getSettings(context.settings)

  let alreadyParsedNodes = new Set<NodeOfType<NodeTypes>>()

  let allAstSelectors = context.options
    .map(option => option.useConfigurationIf?.matchesAstSelector)
    .filter(matchesAstSelector => matchesAstSelector !== undefined)
  let allAstSelectorMatchers = allAstSelectors.map(
    astSelector =>
      [
        astSelector,
        buildPotentialNodeSorter({
          alreadyParsedNodes,
          astSelector,
          nodeTypes,
          settings,
          context,
          sorter,
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
          alreadyParsedNodes,
          astSelector: null,
          settings,
          context,
          node,
        }),
    ]
  }
}

function buildPotentialNodeSorter<
  MessageId extends string,
  Options extends BaseOptions[],
  NodeTypes extends AST_NODE_TYPES,
>({
  alreadyParsedNodes,
  astSelector,
  nodeTypes,
  settings,
  context,
  sorter,
}: {
  context: Readonly<RuleContext<MessageId, Options>>
  alreadyParsedNodes: Set<NodeOfType<NodeTypes>>
  sorter: Sorter<MessageId, Options, NodeTypes>
  nodeTypes: NodeTypes[]
  astSelector: string
  settings: Settings
}): (node: TSESTree.Node) => void {
  return potentialNodeSorter

  function potentialNodeSorter(node: TSESTree.Node): void {
    if (!isNodeOfType(node)) {
      return
    }

    sorter({
      alreadyParsedNodes,
      astSelector,
      settings,
      context,
      node,
    })
  }
  function isNodeOfType(node: TSESTree.Node): node is NodeOfType<NodeTypes> {
    return (nodeTypes as string[]).includes(node.type)
  }
}
