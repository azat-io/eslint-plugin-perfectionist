import type { Options } from './sort-array-includes/types'

import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { defaultOptions, jsonSchema, sortArray } from './sort-array-includes'
import { createEslintRule } from '../utils/create-eslint-rule'

type MESSAGE_ID =
  | 'missedSpacingBetweenSetsMembers'
  | 'extraSpacingBetweenSetsMembers'
  | 'unexpectedSetsGroupOrder'
  | 'unexpectedSetsOrder'

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => ({
    NewExpression: node => {
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'Set' &&
        node.arguments.length > 0 &&
        (node.arguments[0]?.type === 'ArrayExpression' ||
          (node.arguments[0]?.type === 'NewExpression' &&
            'name' in node.arguments[0].callee &&
            node.arguments[0].callee.name === 'Array'))
      ) {
        let elements =
          node.arguments[0].type === 'ArrayExpression'
            ? node.arguments[0].elements
            : node.arguments[0].arguments
        sortArray<MESSAGE_ID>({
          availableMessageIds: {
            missedSpacingBetweenMembers: 'missedSpacingBetweenSetsMembers',
            extraSpacingBetweenMembers: 'extraSpacingBetweenSetsMembers',
            unexpectedGroupOrder: 'unexpectedSetsGroupOrder',
            unexpectedOrder: 'unexpectedSetsOrder',
          },
          elements,
          context,
        })
      }
    },
  }),
  meta: {
    messages: {
      missedSpacingBetweenSetsMembers: MISSED_SPACING_ERROR,
      extraSpacingBetweenSetsMembers: EXTRA_SPACING_ERROR,
      unexpectedSetsGroupOrder: GROUP_ORDER_ERROR,
      unexpectedSetsOrder: ORDER_ERROR,
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
