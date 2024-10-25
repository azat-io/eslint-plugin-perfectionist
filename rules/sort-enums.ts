import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'
import type { CompareOptions } from '../utils/compare'

import {
  getFirstUnorderedNodeDependentOn,
  sortNodesByDependencies,
} from '../utils/sort-nodes-by-dependencies'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

type MESSAGE_ID = 'unexpectedEnumsDependencyOrder' | 'unexpectedEnumsOrder'

export type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    specialCharacters: 'remove' | 'trim' | 'keep'
    matcher: 'minimatch' | 'regex'
    partitionByNewLine: boolean
    forceNumericSort: boolean
    order: 'desc' | 'asc'
    sortByValue: boolean
    ignoreCase: boolean
  }>,
]

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-enums',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted TypeScript enums.',
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
          sortByValue: {
            description: 'Compare enum values instead of names.',
            type: 'boolean',
          },
          forceNumericSort: {
            description:
              'Will always sort numeric enums by their value regardless of the sort type specified.',
            type: 'boolean',
          },
          partitionByComment: {
            description:
              'Allows you to use comments to separate the members of enums into logical groups.',
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
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedEnumsOrder: 'Expected "{{right}}" to come before "{{left}}".',
      unexpectedEnumsDependencyOrder:
        'Expected dependency "{{right}}" to come before "{{nodeDependentOnRight}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
      specialCharacters: 'keep',
      matcher: 'minimatch',
      sortByValue: false,
      partitionByComment: false,
      partitionByNewLine: false,
      forceNumericSort: false,
    },
  ],
  create: context => ({
    TSEnumDeclaration: node => {
      let getMembers = (nodeValue: TSESTree.TSEnumDeclaration) =>
        /* v8 ignore next 2 */
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        node.body?.members ?? nodeValue.members ?? []
      let members = getMembers(node)
      if (
        members.length > 1 &&
        members.every(({ initializer }) => initializer)
      ) {
        let settings = getSettings(context.settings)

        let options = complete(context.options.at(0), settings, {
          partitionByComment: false,
          partitionByNewLine: false,
          type: 'alphabetical',
          matcher: 'minimatch',
          ignoreCase: true,
          specialCharacters: 'keep',
          order: 'asc',
          sortByValue: false,
          forceNumericSort: false,
        } as const)

        let sourceCode = getSourceCode(context)
        let partitionComment = options.partitionByComment

        let extractDependencies = (
          expression: TSESTree.Expression,
          enumName: string,
        ): string[] => {
          let dependencies: string[] = []

          let checkNode = (nodeValue: TSESTree.Node) => {
            if (
              nodeValue.type === 'MemberExpression' &&
              nodeValue.object.type === 'Identifier' &&
              nodeValue.object.name === enumName &&
              nodeValue.property.type === 'Identifier'
            ) {
              /**
               * enum Enum {
               *   A = 1,
               *   B = Enum.A
               * }
               */
              dependencies.push(nodeValue.property.name)
            } else if (nodeValue.type === 'Identifier') {
              /**
               * enum Enum {
               *   A = 1,
               *   B = A
               * }
               */
              dependencies.push(nodeValue.name)
            }

            if ('left' in nodeValue) {
              checkNode(nodeValue.left)
            }

            if ('right' in nodeValue) {
              checkNode(nodeValue.right)
            }

            if ('expressions' in nodeValue) {
              nodeValue.expressions.forEach(checkNode)
            }
          }

          checkNode(expression)
          return dependencies
        }

        let formattedMembers: SortingNodeWithDependencies[][] = members.reduce(
          (accumulator: SortingNodeWithDependencies[][], member) => {
            let dependencies: string[] = []
            if (member.initializer) {
              dependencies = extractDependencies(
                member.initializer,
                node.id.name,
              )
            }
            let lastSortingNode = accumulator.at(-1)?.at(-1)
            let sortingNode: SortingNodeWithDependencies = {
              size: rangeToDiff(member, sourceCode),
              node: member,
              dependencies,
              name:
                member.id.type === 'Literal'
                  ? `${member.id.value}`
                  : `${sourceCode.getText(member.id)}`,
            }

            if (
              (partitionComment &&
                hasPartitionComment(
                  partitionComment,
                  getCommentsBefore(member, sourceCode),
                  options.matcher,
                )) ||
              (options.partitionByNewLine &&
                lastSortingNode &&
                getLinesBetween(sourceCode, lastSortingNode, sortingNode))
            ) {
              accumulator.push([])
            }

            accumulator.at(-1)!.push(sortingNode)
            return accumulator
          },
          [[]],
        )
        let isNumericEnum = members.every(
          member =>
            member.initializer?.type === 'Literal' &&
            typeof member.initializer.value === 'number',
        )

        let compareOptions: CompareOptions = {
          // If the enum is numeric, and we sort by value, always use the `natural` sort type, which will correctly sort them.
          type:
            isNumericEnum && (options.forceNumericSort || options.sortByValue)
              ? 'natural'
              : options.type,
          order: options.order,
          ignoreCase: options.ignoreCase,
          specialCharacters: options.specialCharacters,
          // Get the enum value rather than the name if needed
          nodeValueGetter:
            options.sortByValue || (isNumericEnum && options.forceNumericSort)
              ? sortingNode => {
                  if (
                    sortingNode.node.type === 'TSEnumMember' &&
                    sortingNode.node.initializer?.type === 'Literal'
                  ) {
                    return sortingNode.node.initializer.value?.toString() ?? ''
                  }
                  return ''
                }
              : undefined,
        }
        let sortedNodes = sortNodesByDependencies(
          formattedMembers
            .map(nodes => sortNodes(nodes, compareOptions))
            .flat(),
        )
        let nodes = formattedMembers.flat()
        pairwise(nodes, (left, right) => {
          let indexOfLeft = sortedNodes.indexOf(left)
          let indexOfRight = sortedNodes.indexOf(right)
          if (indexOfLeft > indexOfRight) {
            let firstUnorderedNodeDependentOnRight =
              getFirstUnorderedNodeDependentOn(right, nodes)
            context.report({
              messageId: firstUnorderedNodeDependentOnRight
                ? 'unexpectedEnumsDependencyOrder'
                : 'unexpectedEnumsOrder',
              data: {
                left: toSingleLine(left.name),
                right: toSingleLine(right.name),
                nodeDependentOnRight: firstUnorderedNodeDependentOnRight?.name,
              },
              node: right.node,
              fix: fixer =>
                makeFixes(fixer, nodes, sortedNodes, sourceCode, options),
            })
          }
        })
      }
    },
  }),
})
