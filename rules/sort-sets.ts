import type { Options } from './sort-array-includes'

import { defaultOptions, jsonSchema, sortArray } from './sort-array-includes'
import { createEslintRule } from '../utils/create-eslint-rule'

type MESSAGE_ID = 'unexpectedSetsOrder'

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-sets',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted sets.',
      url: 'https://perfectionist.dev/rules/sort-sets',
      recommended: true,
    },
    fixable: 'code',
    schema: [jsonSchema],
    messages: {
      unexpectedSetsOrder: 'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [defaultOptions],
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
        sortArray<MESSAGE_ID>(context, 'unexpectedSetsOrder', elements)
      }
    },
  }),
})
