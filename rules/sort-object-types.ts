import type { TSESTree } from '@typescript-eslint/types'

import { createSortingRule } from '../utils/create-sorting-rule'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { complete } from '../utils/complete'

type MESSAGE_ID = 'unexpectedObjectTypesOrder'

type Group<T extends string[]> = 'multiline' | 'unknown' | T[number]

type Options<T extends string[]> = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    groups: (Group<T>[] | Group<T>)[]
    'partition-by-new-line': boolean
    'ignore-case': boolean
    order: 'desc' | 'asc'
    'custom-groups': {}
  }>,
]

export const RULE_NAME = 'sort-object-types'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted object types',
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
          order: {
            enum: ['asc', 'desc'],
            default: 'asc',
            type: 'string',
          },
          'ignore-case': {
            type: 'boolean',
            default: false,
          },
          groups: {
            type: 'array',
            default: [],
          },
          'custom-groups': {
            type: 'object',
          },
          'partition-by-new-line': {
            type: 'boolean',
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedObjectTypesOrder:
        'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
    },
  ],
  create: context => ({
    TSTypeLiteral: node => {
      if (node.members.length > 1) {
        let options = complete(context.options.at(0), {
          'partition-by-new-line': false,
          type: 'alphabetical',
          'ignore-case': false,
          'custom-groups': {},
          order: 'asc',
          groups: [],
        })

        let formattedMembers: TSESTree.TypeElement[][] = node.members.reduce(
          (accumulator: TSESTree.TypeElement[][], member) => {
            let lastMember = accumulator.at(-1)?.at(-1)

            if (
              options['partition-by-new-line'] &&
              lastMember &&
              getLinesBetween(context.sourceCode, lastMember, member)
            ) {
              accumulator.push([])
            }

            accumulator.at(-1)?.push(member)

            return accumulator
          },
          [[]],
        )

        for (let nodes of formattedMembers) {
          createSortingRule({
            getName: member => {
              let formatName = (value: string): string =>
                value.replace(/(,|;)$/, '')

              if (member.type === 'TSPropertySignature') {
                if (member.key.type === 'Identifier') {
                  return member.key.name
                } else if (member.key.type === 'Literal') {
                  return `${member.key.value}`
                }
                return context.sourceCode.text.slice(
                  member.range.at(0),
                  member.typeAnnotation?.range.at(0),
                )
              } else if (member.type === 'TSIndexSignature') {
                let endIndex: number =
                  member.typeAnnotation?.range.at(0) ?? member.range.at(1)!

                return formatName(
                  context.sourceCode.text.slice(member.range.at(0), endIndex),
                )
              }
              return formatName(
                context.sourceCode.text.slice(
                  member.range.at(0),
                  member.range.at(1),
                ),
              )
            },
            definedGroups: (define, element) => {
              if (element.loc.start.line !== element.loc.end.line) {
                define('multiline')
              }
            },
            unexpectedOrderMessage: 'unexpectedObjectTypesOrder',
            context,
            options,
            nodes,
          })
        }
      }
    },
  }),
})
