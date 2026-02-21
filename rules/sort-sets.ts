import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Options } from './sort-array-includes/types'

import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { computeArrayElements } from './sort-array-includes/compute-array-elements'
import { defaultOptions, jsonSchema, sortArray } from './sort-array-includes'
import { createEslintRule } from '../utils/create-eslint-rule'

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
  create: context => ({
    NewExpression: node => {
      let setElements = computeSetElements(node)
      if (!setElements) {
        return
      }

      sortArray<MessageId>({
        availableMessageIds: {
          missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
          extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
          unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
          unexpectedOrder: ORDER_ERROR_ID,
        },
        elements: setElements,
        context,
      })
    },
  }),
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

function computeSetElements(
  newExpression: TSESTree.NewExpression,
): (TSESTree.SpreadElement | TSESTree.Expression | null)[] | null {
  if (newExpression.callee.type !== AST_NODE_TYPES.Identifier) {
    return null
  }
  if (newExpression.callee.name !== 'Set') {
    return null
  }
  if (!newExpression.arguments[0]) {
    return null
  }

  return computeArrayElements(newExpression.arguments[0])
}
