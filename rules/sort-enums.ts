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
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

export type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    partitionByNewLine: boolean
    forceNumericSort: boolean
    order: 'desc' | 'asc'
    sortByValue: boolean
    ignoreCase: boolean
  }>,
]

type MESSAGE_ID = 'unexpectedEnumsDependencyOrder' | 'unexpectedEnumsOrder'

let defaultOptions: Required<Options[0]> = {
  partitionByComment: false,
  partitionByNewLine: false,
  specialCharacters: 'keep',
  forceNumericSort: false,
  type: 'alphabetical',
  sortByValue: false,
  ignoreCase: true,
  locales: 'en-US',
  order: 'asc',
}

export default createEslintRule<Options, MESSAGE_ID>({
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
        ruleName: context.id,
        sourceCode,
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
            dependencies.push(nodeValue.property.name)
          } else if (nodeValue.type === 'Identifier') {
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
            name:
              member.id.type === 'Literal'
                ? `${member.id.value}`
                : sourceCode.getText(member.id),
            isEslintDisabled: isNodeEslintDisabled(member, eslintDisabledLines),
            size: rangeToDiff(member, sourceCode),
            node: member,
            dependencies,
          }

          if (
            (options.partitionByComment &&
              hasPartitionComment(
                options.partitionByComment,
                getCommentsBefore(member, sourceCode),
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
        // If the enum is numeric, and we sort by value, always use the `natural` sort type, which will correctly sort them.
        type:
          isNumericEnum && (options.forceNumericSort || options.sortByValue)
            ? 'natural'
            : options.type,
        specialCharacters: options.specialCharacters,
        ignoreCase: options.ignoreCase,
        locales: options.locales,
        order: options.order,
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
          fix: fixer =>
            makeFixes({
              sortedNodes: sortedNodesExcludingEslintDisabled,
              sourceCode,
              options,
              fixer,
              nodes,
            }),
          data: {
            nodeDependentOnRight: firstUnorderedNodeDependentOnRight?.name,
            right: toSingleLine(right.name),
            left: toSingleLine(left.name),
          },
          messageId: firstUnorderedNodeDependentOnRight
            ? 'unexpectedEnumsDependencyOrder'
            : 'unexpectedEnumsOrder',
          node: right.node,
        })
      })
    },
  }),
  meta: {
    schema: [
      {
        properties: {
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the members of enums into logical groups.',
          },
          forceNumericSort: {
            description:
              'Will always sort numeric enums by their value regardless of the sort type specified.',
            type: 'boolean',
          },
          sortByValue: {
            description: 'Compare enum values instead of names.',
            type: 'boolean',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          locales: localesJsonSchema,
          order: orderJsonSchema,
          type: typeJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      unexpectedEnumsDependencyOrder:
        'Expected dependency "{{right}}" to come before "{{nodeDependentOnRight}}".',
      unexpectedEnumsOrder: 'Expected "{{right}}" to come before "{{left}}".',
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-enums',
      description: 'Enforce sorted TypeScript enums.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-enums',
})
