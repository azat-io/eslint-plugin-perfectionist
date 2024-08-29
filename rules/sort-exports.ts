import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isPositive } from '../utils/is-positive'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedExportsOrder'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-exports',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted exports.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: {
            description: 'Specifies the sorting method.',
            type: 'string',
            enum: ['alphabetical', 'natural', 'line-length'],
          },
          order: {
            description:
              'Determines whether the sorted items should be in ascending or descending order.',
            type: 'string',
            enum: ['asc', 'desc'],
          },
          ignoreCase: {
            description:
              'Controls whether sorting should be case-sensitive or not.',
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedExportsOrder: 'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
    },
  ],
  create: context => {
    let settings = getSettings(context.settings)

    let options = complete(context.options.at(0), settings, {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const)

    let parts: SortingNode[][] = [[]]

    let registerNode = (
      node:
        | TSESTree.ExportNamedDeclarationWithSource
        | TSESTree.ExportAllDeclaration,
    ) => {
      parts.at(-1)!.push({
        size: rangeToDiff(node.range),
        name: node.source.value,
        node,
      })
    }

    return {
      ExportAllDeclaration: registerNode,
      ExportNamedDeclaration: node => {
        if (node.source !== null) {
          registerNode(node)
        }
      },
      'Program:exit': () => {
        let sourceCode = getSourceCode(context)

        for (let nodes of parts) {
          pairwise(nodes, (left, right) => {
            if (isPositive(compare(left, right, options, true))) {
              context.report({
                messageId: 'unexpectedExportsOrder',
                data: {
                  left: left.name,
                  right: right.name,
                },
                node: right.node,
                fix: fixer =>
                  makeFixes(
                    fixer,
                    nodes,
                    sortNodes(nodes, options),
                    sourceCode,
                  ),
              })
            }
          })
        }
      },
    }
  },
})
