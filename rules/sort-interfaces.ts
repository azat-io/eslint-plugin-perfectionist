import type { TSESTree } from '@typescript-eslint/types'

import { minimatch } from 'minimatch'

import { createSortingRule } from '../utils/create-sorting-rule'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { complete } from '../utils/complete'

type MESSAGE_ID = 'unexpectedInterfacePropertiesOrder'

type Group<T extends string[]> = 'multiline' | 'unknown' | T[number]

type Options<T extends string[]> = [
  Partial<{
    'custom-groups': { [key: string]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    groups: (Group<T>[] | Group<T>)[]
    'partition-by-new-line': boolean
    'ignore-pattern': string[]
    'ignore-case': boolean
    order: 'desc' | 'asc'
  }>,
]

export const RULE_NAME = 'sort-interfaces'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted interface properties',
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
          'ignore-pattern': {
            items: {
              type: 'string',
            },
            type: 'array',
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
      unexpectedInterfacePropertiesOrder:
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
    TSInterfaceDeclaration: node => {
      if (node.body.body.length > 1) {
        let options = complete(context.options.at(0), {
          'partition-by-new-line': false,
          type: 'alphabetical',
          'ignore-case': false,
          'ignore-pattern': [],
          'custom-groups': {},
          order: 'asc',
          groups: [],
        })

        if (
          !options['ignore-pattern'].some(pattern =>
            minimatch(node.id.name, pattern, {
              nocomment: true,
            }),
          )
        ) {
          type InterfaceNode =
            | TSESTree.TSConstructSignatureDeclaration
            | TSESTree.TSPropertySignature
            | TSESTree.TSMethodSignature
            | TSESTree.TSIndexSignature

          let formattedMembers: InterfaceNode[][] = node.body.body.reduce(
            (accumulator: InterfaceNode[][], element) => {
              if (element.type === 'TSCallSignatureDeclaration') {
                accumulator.push([])
                return accumulator
              }

              let lastElement = accumulator.at(-1)?.at(-1)

              if (
                options['partition-by-new-line'] &&
                lastElement &&
                getLinesBetween(context.sourceCode, lastElement, element)
              ) {
                accumulator.push([])
              }

              accumulator.at(-1)!.push(element)

              return accumulator
            },
            [[]],
          )

          for (let nodes of formattedMembers) {
            createSortingRule({
              getName: element => {
                if (element.type === 'TSPropertySignature') {
                  if (element.key.type === 'Identifier') {
                    return element.key.name
                  } else if (element.key.type === 'Literal') {
                    return `${element.key.value}`
                  }
                  let end: number =
                    element.typeAnnotation?.range.at(0) ??
                    element.range.at(1)! - (element.optional ? '?'.length : 0)

                  return context.sourceCode.text.slice(element.range.at(0), end)
                } else if (element.type === 'TSIndexSignature') {
                  let endIndex: number =
                    element.typeAnnotation?.range.at(0) ?? element.range.at(1)!

                  return context.sourceCode.text.slice(
                    element.range.at(0),
                    endIndex,
                  )
                }
                let endIndex: number =
                  element.returnType?.range.at(0) ?? element.range.at(1)!

                return context.sourceCode.text.slice(
                  element.range.at(0),
                  endIndex,
                )
              },
              definedGroups: element => {
                if (element.loc.start.line !== element.loc.end.line) {
                  return 'multiline'
                }
              },
              unexpectedOrderMessage: 'unexpectedInterfacePropertiesOrder',
              context,
              options,
              nodes,
            })
          }
        }
      }
    },
  }),
})
