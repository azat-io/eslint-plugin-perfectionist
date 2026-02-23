import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Options } from './sort-array-includes/types'

import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { defaultOptions, jsonSchema } from './sort-array-includes'
import { createEslintRule } from '../utils/create-eslint-rule'
import { sortArray } from './sort-array-includes/sort-array'

/**
 * Cache computed groups by modifiers and selectors for performance.
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

const ORDER_ERROR_ID = 'unexpectedSetsOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedSetsGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenSetsMembers'
const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenSetsMembers'

type MessageId =
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

export default createEslintRule<Options, MessageId>({
  create: context => {
    let alreadyParsedExpressions = new Set<TSESTree.CallExpressionArgument>()

    let allAstSelectors = context.options
      .map(option => option.useConfigurationIf?.matchesAstSelector)
      .filter(matchesAstSelector => matchesAstSelector !== undefined)
    let allAstSelectorMatchers = allAstSelectors.map(
      astSelector =>
        [
          astSelector,
          buildPotentialSetSorter({
            alreadyParsedExpressions,
            astSelector,
            context,
          }),
        ] as const,
    )

    return {
      ...Object.fromEntries(allAstSelectorMatchers),
      'NewExpression:exit': buildFromNewExpressionSetSorter({
        alreadyParsedExpressions,
        astSelector: null,
        context,
      }),
    }
  },
  meta: {
    messages: {
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-sets',
      description: 'Enforce sorted sets.',
      recommended: true,
    },
    schema: jsonSchema,
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-sets',
})

function sortSetFromNewExpression({
  alreadyParsedExpressions,
  astSelector,
  context,
  node,
}: {
  alreadyParsedExpressions: Set<TSESTree.CallExpressionArgument>
  context: Readonly<RuleContext<MessageId, Options>>
  node: TSESTree.NewExpression
  astSelector: string | null
}): void {
  let setExpression = extractSetExpression()
  if (!setExpression) {
    return
  }

  sortArray<MessageId>({
    availableMessageIds: {
      missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
      extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
      unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
      unexpectedOrder: ORDER_ERROR_ID,
    },
    cachedGroupsByModifiersAndSelectors,
    expression: setExpression,
    alreadyParsedExpressions,
    astSelector,
    context,
  })

  function extractSetExpression(): TSESTree.CallExpressionArgument | null {
    if (node.callee.type !== AST_NODE_TYPES.Identifier) {
      return null
    }
    if (node.callee.name !== 'Set') {
      return null
    }
    if (!node.arguments[0]) {
      return null
    }

    return node.arguments[0]
  }
}

function buildPotentialSetSorter({
  alreadyParsedExpressions,
  astSelector,
  context,
}: {
  alreadyParsedExpressions: Set<TSESTree.CallExpressionArgument>
  context: Readonly<RuleContext<MessageId, Options>>
  astSelector: string
}): (node: TSESTree.Node) => void {
  return sortPotentialSet

  function sortPotentialSet(node: TSESTree.Node): void {
    if (node.type !== AST_NODE_TYPES.ArrayExpression) {
      return
    }
    if (node.parent.type !== AST_NODE_TYPES.NewExpression) {
      return
    }

    sortSetFromNewExpression({
      alreadyParsedExpressions,
      node: node.parent,
      astSelector,
      context,
    })
  }
}

function buildFromNewExpressionSetSorter({
  alreadyParsedExpressions,
  astSelector,
  context,
}: {
  alreadyParsedExpressions: Set<TSESTree.CallExpressionArgument>
  context: Readonly<RuleContext<MessageId, Options>>
  astSelector: string | null
}): (node: TSESTree.NewExpression) => void {
  return sorter

  function sorter(node: TSESTree.NewExpression): void {
    return sortSetFromNewExpression({
      alreadyParsedExpressions,
      astSelector,
      context,
      node,
    })
  }
}
