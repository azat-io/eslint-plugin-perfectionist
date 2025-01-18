import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'
import type { PartitionByCommentOption } from '../types/common-options'
import type { CompareOptions } from '../utils/compare'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  ignoreCaseJsonSchema,
  buildTypeJsonSchema,
  alphabetJsonSchema,
  localesJsonSchema,
  orderJsonSchema,
} from '../utils/common-json-schemas'
import {
  getFirstUnorderedNodeDependentOn,
  sortNodesByDependencies,
} from '../utils/sort-nodes-by-dependencies'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/has-partition-comment'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getEnumMembers } from '../utils/get-enum-members'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { makeFixes } from '../utils/make-fixes'
import { sortNodes } from '../utils/sort-nodes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

export type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
    specialCharacters: 'remove' | 'trim' | 'keep'
    partitionByComment: PartitionByCommentOption
    locales: NonNullable<Intl.LocalesArgument>
    partitionByNewLine: boolean
    forceNumericSort: boolean
    order: 'desc' | 'asc'
    sortByValue: boolean
    ignoreCase: boolean
    alphabet: string
  }>,
]

interface SortEnumsSortingNode
  extends SortingNodeWithDependencies<TSESTree.TSEnumMember> {
  numericValue: number | null
}

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
  alphabet: '',
  order: 'asc',
}

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => ({
    TSEnumDeclaration: enumDeclaration => {
      let members = getEnumMembers(enumDeclaration)
      if (
        !isSortable(members) ||
        !members.every(({ initializer }) => initializer)
      ) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
      validateCustomSortConfiguration(options)

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
        let stack: TSESTree.Node[] = [expression]

        while (stack.length) {
          let node = stack.pop()!
          if (
            node.type === 'MemberExpression' &&
            node.object.type === 'Identifier' &&
            node.object.name === enumName &&
            node.property.type === 'Identifier'
          ) {
            dependencies.push(node.property.name)
          } else if (node.type === 'Identifier') {
            dependencies.push(node.name)
          }

          if ('left' in node) {
            stack.push(node.left)
          }
          if ('right' in node) {
            stack.push(node.right)
          }
          if ('expressions' in node) {
            stack.push(...node.expressions)
          }
        }

        return dependencies
      }

      let formattedMembers: SortEnumsSortingNode[][] = members.reduce(
        (accumulator: SortEnumsSortingNode[][], member) => {
          let dependencies: string[] = []
          if (member.initializer) {
            dependencies = extractDependencies(
              member.initializer,
              enumDeclaration.id.name,
            )
          }
          let lastSortingNode = accumulator.at(-1)?.at(-1)
          let sortingNode: SortEnumsSortingNode = {
            numericValue: member.initializer
              ? getExpressionNumberValue(
                  member.initializer,
                ) /* v8 ignore next - Unsure how we can reach that case */
              : null,
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
            hasPartitionComment({
              comments: getCommentsBefore({
                node: member,
                sourceCode,
              }),
              partitionByComment: options.partitionByComment,
            }) ||
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

      let sortingNodes = formattedMembers.flat()

      let isNumericEnum = sortingNodes.every(
        sortingNode =>
          sortingNode.numericValue !== null &&
          !Number.isNaN(sortingNode.numericValue),
      )

      let compareOptions: CompareOptions<SortEnumsSortingNode> = {
        // Get the enum value rather than the name if needed.
        nodeValueGetter:
          options.sortByValue || (isNumericEnum && options.forceNumericSort)
            ? sortingNode => {
                if (isNumericEnum) {
                  return sortingNode.numericValue!.toString()
                }
                if (sortingNode.node.initializer?.type === 'Literal') {
                  return sortingNode.node.initializer.value?.toString() ?? ''
                }
                return ''
              }
            : null,
        /**
         * If the enum is numeric, and we sort by value, always use the
         * `natural` sort type, which will correctly sort them.
         */
        type:
          isNumericEnum && (options.forceNumericSort || options.sortByValue)
            ? 'natural'
            : options.type,
        specialCharacters: options.specialCharacters,
        ignoreCase: options.ignoreCase,
        alphabet: options.alphabet,
        locales: options.locales,
        order: options.order,
      }

      let sortNodesIgnoringEslintDisabledNodes = (
        ignoreEslintDisabledNodes: boolean,
      ): SortEnumsSortingNode[] =>
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

      let nodeIndexMap = createNodeIndexMap(sortedNodes)

      pairwise(sortingNodes, (left, right) => {
        let leftIndex = nodeIndexMap.get(left)!
        let rightIndex = nodeIndexMap.get(right)!

        let indexOfRightExcludingEslintDisabled =
          sortedNodesExcludingEslintDisabled.indexOf(right)
        if (
          leftIndex < rightIndex &&
          leftIndex < indexOfRightExcludingEslintDisabled
        ) {
          return
        }

        let firstUnorderedNodeDependentOnRight =
          getFirstUnorderedNodeDependentOn(right, sortingNodes)
        context.report({
          fix: fixer =>
            makeFixes({
              sortedNodes: sortedNodesExcludingEslintDisabled,
              nodes: sortingNodes,
              sourceCode,
              options,
              fixer,
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
          alphabet: alphabetJsonSchema,
          type: buildTypeJsonSchema(),
          locales: localesJsonSchema,
          order: orderJsonSchema,
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

let getExpressionNumberValue = (expression: TSESTree.Node): number => {
  switch (expression.type) {
    case 'BinaryExpression':
      return getBinaryExpressionNumberValue(
        expression.left,
        expression.right,
        expression.operator,
      )
    case 'UnaryExpression':
      return getUnaryExpressionNumberValue(
        expression.argument,
        expression.operator,
      )
    case 'Literal':
      return typeof expression.value === 'number'
        ? expression.value
        : Number.NaN
    default:
      return Number.NaN
  }
}

let getUnaryExpressionNumberValue = (
  argumentExpression: TSESTree.Expression,
  operator: string,
): number => {
  let argument = getExpressionNumberValue(argumentExpression)
  switch (operator) {
    case '+':
      return argument
    case '-':
      return -argument
    case '~':
      return ~argument
    /* v8 ignore next 2 - Unsure if we can reach it */
    default:
      return Number.NaN
  }
}

let getBinaryExpressionNumberValue = (
  leftExpression: TSESTree.PrivateIdentifier | TSESTree.Expression,
  rightExpression: TSESTree.Expression,
  operator: string,
): number => {
  let left = getExpressionNumberValue(leftExpression)
  let right = getExpressionNumberValue(rightExpression)
  switch (operator) {
    case '**':
      return left ** right
    case '>>':
      return left >> right
    case '<<':
      return left << right
    case '+':
      return left + right
    case '-':
      return left - right
    case '*':
      return left * right
    case '/':
      return left / right
    case '%':
      return left % right
    case '|':
      return left | right
    case '&':
      return left & right
    case '^':
      return left ^ right
    /* v8 ignore next 2 - Unsure if we can reach it */
    default:
      return Number.NaN
  }
}
