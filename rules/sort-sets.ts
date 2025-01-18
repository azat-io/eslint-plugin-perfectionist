import type { Options } from './sort-array-includes/types'

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
        node.arguments.length &&
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
      unexpectedSetsGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      missedSpacingBetweenSetsMembers:
        'Missed spacing between "{{left}}" and "{{right}}" members.',
      extraSpacingBetweenSetsMembers:
        'Extra spacing between "{{left}}" and "{{right}}" members.',
      unexpectedSetsOrder: 'Expected "{{right}}" to come before "{{left}}".',
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
