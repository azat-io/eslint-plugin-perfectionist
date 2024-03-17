import type { TSESTree } from '@typescript-eslint/types'

import { createSortingRule } from '../utils/create-sorting-rule'
import { createEslintRule } from '../utils/create-eslint-rule'
import { complete } from '../utils/complete'

type MESSAGE_ID = 'unexpectedExportsOrder'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    'ignore-case': boolean
    order: 'desc' | 'asc'
  }>,
]

export const RULE_NAME = 'sort-exports'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted exports',
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
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedExportsOrder: 'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
    },
  ],
  create: context => {
    let options = complete(context.options.at(0), {
      'ignore-case': false,
      type: 'alphabetical',
      order: 'asc',
    } as const)

    let parts: TSESTree.ExportNamedDeclarationWithSource[][] = [[]]

    let registerNode = (
      node:
        | TSESTree.ExportNamedDeclarationWithSource
        | TSESTree.ExportAllDeclaration,
    ) => {
      if (node.type === 'ExportAllDeclaration' && node.exported === null) {
        parts.push([])
      } else {
        parts.at(-1)!.push(node as TSESTree.ExportNamedDeclarationWithSource)
      }
    }

    return {
      ExportAllDeclaration: registerNode,
      ExportNamedDeclaration: node => {
        if (node.source !== null) {
          registerNode(node)
        }
      },
      'Program:exit': () => {
        for (let nodes of parts) {
          createSortingRule({
            unexpectedOrderMessage: 'unexpectedExportsOrder',
            getName: node => node.source.value,
            context,
            options,
            nodes,
          })
        }
      },
    }
  },
})
