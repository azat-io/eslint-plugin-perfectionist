import { createSortingRule } from '../utils/create-sorting-rule'
import { createEslintRule } from '../utils/create-eslint-rule'
import { complete } from '../utils/complete'

type MESSAGE_ID = 'unexpectedEnumsOrder'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    'ignore-case': boolean
    order: 'desc' | 'asc'
  }>,
]

export const RULE_NAME = 'sort-enums'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted TypeScript enums',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: {
            enum: ['alphabetical', 'natural', 'line-length'],
            default: 'alphabetical',
            type: 'string',
          },
          'ignore-case': {
            type: 'boolean',
            default: false,
          },
          order: {
            enum: ['asc', 'desc'],
            default: 'asc',
            type: 'string',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedEnumsOrder: 'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
    },
  ],
  create: context => ({
    TSEnumDeclaration: node => {
      if (
        node.members.length > 1 &&
        node.members.every(({ initializer }) => initializer)
      ) {
        let options = complete(context.options.at(0), {
          type: 'alphabetical',
          'ignore-case': false,
          order: 'asc',
        } as const)

        let nodes = node.members

        createSortingRule({
          getName: member =>
            member.id.type === 'Literal'
              ? `${member.id.value}`
              : `${context.sourceCode.text.slice(...member.id.range)}`,
          unexpectedOrderMessage: 'unexpectedEnumsOrder',
          context,
          options,
          nodes,
        })
      }
    },
  }),
})
