import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import { hasPartitionComment } from '../utils/is-partition-comment'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

type MESSAGE_ID = 'unexpectedExportsOrder'

type Options = [
  Partial<{
    groupKind: 'values-first' | 'types-first' | 'mixed'
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    specialCharacters: 'remove' | 'trim' | 'keep'
    matcher: 'minimatch' | 'regex'
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

type SortExportsSortingNode = SortingNode<
  TSESTree.ExportNamedDeclarationWithSource | TSESTree.ExportAllDeclaration
>

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
          matcher: {
            description: 'Specifies the string matcher.',
            type: 'string',
            enum: ['minimatch', 'regex'],
          },
          ignoreCase: {
            description:
              'Controls whether sorting should be case-sensitive or not.',
            type: 'boolean',
          },
          specialCharacters: {
            description:
              'Controls how special characters should be handled before sorting.',
            type: 'string',
            enum: ['remove', 'trim', 'keep'],
          },
          partitionByComment: {
            description:
              'Allows you to use comments to separate the exports into logical groups.',
            anyOf: [
              {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              {
                type: 'boolean',
              },
              {
                type: 'string',
              },
            ],
          },
          partitionByNewLine: {
            description:
              'Allows to use spaces to separate the nodes into logical groups.',
            type: 'boolean',
          },
          groupKind: {
            description: 'Specifies top-level groups.',
            type: 'string',
            enum: ['mixed', 'values-first', 'types-first'],
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
      specialCharacters: 'keep',
      matcher: 'minimatch',
      partitionByComment: false,
      partitionByNewLine: false,
      groupKind: 'mixed',
    },
  ],
  create: context => {
    let settings = getSettings(context.settings)

    let options = complete(context.options.at(0), settings, {
      type: 'alphabetical',
      ignoreCase: true,
      specialCharacters: 'keep',
      order: 'asc',
      matcher: 'minimatch',
      partitionByComment: false,
      partitionByNewLine: false,
      groupKind: 'mixed',
    } as const)

    let sourceCode = getSourceCode(context)
    let partitionComment = options.partitionByComment

    let parts: SortExportsSortingNode[][] = [[]]

    let registerNode = (
      node:
        | TSESTree.ExportNamedDeclarationWithSource
        | TSESTree.ExportAllDeclaration,
    ) => {
      let sortingNode: SortExportsSortingNode = {
        size: rangeToDiff(node, sourceCode),
        name: node.source.value,
        node,
        addSafetySemicolonWhenInline: true,
      }
      let lastNode = parts.at(-1)?.at(-1)
      if (
        (partitionComment &&
          hasPartitionComment(
            partitionComment,
            getCommentsBefore(node, sourceCode),
            options.matcher,
          )) ||
        (options.partitionByNewLine &&
          lastNode &&
          getLinesBetween(sourceCode, lastNode, sortingNode))
      ) {
        parts.push([])
      }
      parts.at(-1)!.push(sortingNode)
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
          let groupedByKind
          if (options.groupKind !== 'mixed') {
            groupedByKind = nodes.reduce<SortExportsSortingNode[][]>(
              (accumulator, currentNode) => {
                let exportTypeIndex =
                  options.groupKind === 'types-first' ? 0 : 1
                let exportIndex = options.groupKind === 'types-first' ? 1 : 0
                if (currentNode.node.exportKind === 'value') {
                  accumulator[exportIndex].push(currentNode)
                } else {
                  accumulator[exportTypeIndex].push(currentNode)
                }
                return accumulator
              },
              [[], []],
            )
          } else {
            groupedByKind = [nodes]
          }

          let sortedNodes: SortingNode[] = []
          for (let nodesByKind of groupedByKind) {
            sortedNodes = [...sortedNodes, ...sortNodes(nodesByKind, options)]
          }

          pairwise(nodes, (left, right) => {
            let indexOfLeft = sortedNodes.indexOf(left)
            let indexOfRight = sortedNodes.indexOf(right)
            if (indexOfLeft > indexOfRight) {
              context.report({
                messageId: 'unexpectedExportsOrder',
                data: {
                  left: left.name,
                  right: right.name,
                },
                node: right.node,
                fix: fixer =>
                  makeFixes(fixer, nodes, sortedNodes, sourceCode, options),
              })
            }
          })
        }
      },
    }
  },
})
