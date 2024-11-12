import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'
import type { CompareOptions } from '../utils/compare'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  ignoreCaseJsonSchema,
  localesJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import {
  getFirstUnorderedNodeDependentOn,
  sortNodesByDependencies,
} from '../utils/sort-nodes-by-dependencies'
import { matchesPartitionByNewLine } from '../utils/matches-partition-by-new-line'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
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
    locales: NonNullable<Intl.LocalesArgument>
    partitionByNewLine: boolean | number
    forceNumericSort: boolean
    order: 'desc' | 'asc'
    sortByValue: boolean
    ignoreCase: boolean
  }>,
]

let defaultOptions: Required<Options[0]> = {
  partitionByComment: false,
  partitionByNewLine: false,
  type: 'alphabetical',
  ignoreCase: true,
  specialCharacters: 'keep',
  order: 'asc',
  sortByValue: false,
  forceNumericSort: false,
  locales: 'en-US',
}

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
          type: typeJsonSchema,
          order: orderJsonSchema,
          locales: localesJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
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
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the members of enums into logical groups.',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
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
  defaultOptions: [defaultOptions],
  create: context => ({
    TSEnumDeclaration: node => {
      /* v8 ignore next 2 */
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      let members = node.body.members ?? node.members ?? []
      if (
        !isSortable(members) ||
        !members.every(({ initializer }) => initializer)
      ) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
      let sourceCode = getSourceCode(context)
      let eslintDisabledLines = getEslintDisabledLines({
        sourceCode,
        ruleName: context.id,
      })

      let extractDependencies = (
        expression: TSESTree.Expression,
        enumName: string,
      ): string[] => {
        let dependencies: string[] = []

        let checkNode = (nodeValue: TSESTree.Node): void => {
          if (
            nodeValue.type === 'MemberExpression' &&
            nodeValue.object.type === 'Identifier' &&
            nodeValue.object.name === enumName &&
            nodeValue.property.type === 'Identifier'
          ) {
            /**
             * Enum Enum {
             *   A = 1,
             *   B = Enum.A
             * }
             */
            dependencies.push(nodeValue.property.name)
          } else if (nodeValue.type === 'Identifier') {
            /**
             * Enum Enum {
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
            for (let currentExpression of nodeValue.expressions) {
              checkNode(currentExpression)
            }
          }
        }

        checkNode(expression)
        return dependencies
      }
      let formattedMembers: SortingNodeWithDependencies[][] = members.reduce(
        (accumulator: SortingNodeWithDependencies[][], member) => {
          let dependencies: string[] = []
          if (member.initializer) {
            dependencies = extractDependencies(member.initializer, node.id.name)
          }
          let lastSortingNode = accumulator.at(-1)?.at(-1)
          let sortingNode: SortingNodeWithDependencies = {
            size: rangeToDiff(member, sourceCode),
            node: member,
            dependencies,
            isEslintDisabled: isNodeEslintDisabled(member, eslintDisabledLines),
            name:
              member.id.type === 'Literal'
                ? `${member.id.value}`
                : sourceCode.getText(member.id),
          }

          if (
            (options.partitionByComment &&
              hasPartitionComment(
                options.partitionByComment,
                getCommentsBefore(member, sourceCode),
              )) ||
            (lastSortingNode &&
              matchesPartitionByNewLine({
                options,
                sortingNode,
                sourceCode,
                lastSortingNode,
              }))
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
        locales: options.locales,
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
            : null,
      }

      let sortNodesIgnoringEslintDisabledNodes = (
        ignoreEslintDisabledNodes: boolean,
      ): SortingNodeWithDependencies[] =>
        sortNodesByDependencies(
          formattedMembers.flatMap(nodes =>
            sortNodes(nodes, compareOptions, {
              ignoreEslintDisabledNodes,
            }),
          ),
          {
            ignoreEslintDisabledNodes,
          },
        )
      let sortedNodes = sortNodesIgnoringEslintDisabledNodes(false)
      let sortedNodesExcludingEslintDisabled =
        sortNodesIgnoringEslintDisabledNodes(true)
      let nodes = formattedMembers.flat()

      pairwise(nodes, (left, right) => {
        let indexOfLeft = sortedNodes.indexOf(left)
        let indexOfRight = sortedNodes.indexOf(right)
        let indexOfRightExcludingEslintDisabled =
          sortedNodesExcludingEslintDisabled.indexOf(right)
        if (
          indexOfLeft < indexOfRight &&
          indexOfLeft < indexOfRightExcludingEslintDisabled
        ) {
          return
        }

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
            makeFixes(
              fixer,
              nodes,
              sortedNodesExcludingEslintDisabled,
              sourceCode,
              options,
            ),
        })
      })
    },
  }),
})
