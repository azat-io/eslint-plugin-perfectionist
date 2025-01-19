import type { TSESTree } from '@typescript-eslint/types'

import type {
  PartitionByCommentOption,
  CommonOptions,
} from '../types/common-options'
import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'
import type { CompareOptions } from '../utils/compare'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  buildTypeJsonSchema,
  commonJsonSchemas,
} from '../utils/common-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/has-partition-comment'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { reportAllErrors } from '../utils/report-all-errors'
import { getEnumMembers } from '../utils/get-enum-members'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { sortNodes } from '../utils/sort-nodes'
import { complete } from '../utils/complete'

export type Options = [
  Partial<
    {
      type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
      partitionByComment: PartitionByCommentOption
      partitionByNewLine: boolean
      forceNumericSort: boolean
      sortByValue: boolean
    } & CommonOptions
  >,
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

      let nodes = formattedMembers.flat()

      let isNumericEnum = nodes.every(
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

      let sortNodesExcludingEslintDisabled = (
        ignoreEslintDisabledNodes: boolean,
      ): SortEnumsSortingNode[] =>
        sortNodesByDependencies(
          formattedMembers.flatMap(sortingNodes =>
            sortNodes(sortingNodes, compareOptions, {
              ignoreEslintDisabledNodes,
            }),
          ),
          {
            ignoreEslintDisabledNodes,
          },
        )

      reportAllErrors<MESSAGE_ID>({
        availableMessageIds: {
          unexpectedDependencyOrder: 'unexpectedEnumsDependencyOrder',
          unexpectedOrder: 'unexpectedEnumsOrder',
        },
        sortNodesExcludingEslintDisabled,
        sourceCode,
        options,
        context,
        nodes,
      })
    },
  }),
  meta: {
    schema: [
      {
        properties: {
          ...commonJsonSchemas,
          forceNumericSort: {
            description:
              'Will always sort numeric enums by their value regardless of the sort type specified.',
            type: 'boolean',
          },
          sortByValue: {
            description: 'Compare enum values instead of names.',
            type: 'boolean',
          },
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
          type: buildTypeJsonSchema(),
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
