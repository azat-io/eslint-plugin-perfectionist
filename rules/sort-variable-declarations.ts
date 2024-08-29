import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isPositive } from '../utils/is-positive'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedVariableDeclarationsOrder'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-variable-declarations',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted variable declarations.',
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
      unexpectedVariableDeclarationsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
    },
  ],
  create: context => ({
    VariableDeclaration: node => {
      if (node.declarations.length > 1) {
        let settings = getSettings(context.settings)

        let options = complete(context.options.at(0), settings, {
          type: 'alphabetical',
          ignoreCase: true,
          order: 'asc',
        } as const)

        let sourceCode = getSourceCode(context)

        let extractDependencies = (
          init: TSESTree.Expression | null,
        ): string[] => {
          if (!init) {
            return []
          }
          let dependencies: string[] = []

          let checkNode = (nodeValue: TSESTree.Node) => {
            if (nodeValue.type === 'Identifier') {
              dependencies.push(nodeValue.name)
            }

            if (
              'body' in nodeValue &&
              nodeValue.body &&
              !Array.isArray(nodeValue.body)
            ) {
              traverseNode(nodeValue.body)
            }

            if ('left' in nodeValue) {
              traverseNode(nodeValue.left)
            }

            if ('right' in nodeValue) {
              traverseNode(nodeValue.right as TSESTree.Node)
            }

            if ('elements' in nodeValue) {
              nodeValue.elements
                .filter(currentNode => currentNode !== null)
                .forEach(traverseNode)
            } else if ('arguments' in nodeValue) {
              nodeValue.arguments.forEach(traverseNode)
            }
          }

          let traverseNode = (nodeValue: TSESTree.Node) => {
            checkNode(nodeValue)
          }

          traverseNode(init)
          return dependencies
        }

        let nodes = node.declarations.map((declaration): SortingNode => {
          let name

          if (
            declaration.id.type === 'ArrayPattern' ||
            declaration.id.type === 'ObjectPattern'
          ) {
            name = sourceCode.text.slice(...declaration.id.range)
          } else {
            ;({ name } = declaration.id)
          }

          let dependencies = extractDependencies(declaration.init)

          return {
            size: rangeToDiff(declaration.range),
            node: declaration,
            dependencies,
            name,
          }
        })

        pairwise(nodes, (left, right) => {
          if (isPositive(compare(left, right, options))) {
            context.report({
              messageId: 'unexpectedVariableDeclarationsOrder',
              data: {
                left: toSingleLine(left.name),
                right: toSingleLine(right.name),
              },
              node: right.node,
              fix: fixer =>
                makeFixes(fixer, nodes, sortNodes(nodes, options), sourceCode),
            })
          }
        })
      }
    },
  }),
})
