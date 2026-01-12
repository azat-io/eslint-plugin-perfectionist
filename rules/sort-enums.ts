import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { SortEnumsSortingNode, Options } from './sort-enums/types'

import {
  DEPENDENCY_ORDER_ERROR,
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { buildComparatorByOptionsComputer } from './sort-enums/build-comparator-by-options-computer'
import { buildOptionsByGroupIndexComputer } from '../utils/build-options-by-group-index-computer'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { buildCommonJsonSchemas } from '../utils/json-schemas/common-json-schemas'
import { additionalCustomGroupMatchOptionsJsonSchema } from './sort-enums/types'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { getEnumMembers } from '../utils/get-enum-members'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

const ORDER_ERROR_ID = 'unexpectedEnumsOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedEnumsGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenEnumsMembers'
const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenEnumsMembers'
const DEPENDENCY_ORDER_ERROR_ID = 'unexpectedEnumsDependencyOrder'

type MessageId =
  | typeof DEPENDENCY_ORDER_ERROR_ID
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
  sortByValue: 'ifNumericEnum',
  partitionByComment: false,
  partitionByNewLine: false,
  specialCharacters: 'keep',
  newlinesBetween: 'ignore',
  type: 'alphabetical',
  ignoreCase: true,
  locales: 'en-US',
  customGroups: [],
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MessageId>({
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
      validateGroupsConfiguration({
        selectors: [],
        modifiers: [],
        options,
      })
      validateNewlinesAndPartitionConfiguration(options)

      let { sourceCode, id } = context
      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: id,
        sourceCode,
      })
      let optionsByGroupIndexComputer =
        buildOptionsByGroupIndexComputer(options)

      function extractDependencies(
        expression: TSESTree.Expression,
        enumName: string,
      ): string[] {
        let dependencies: string[] = []
        let stack: TSESTree.Node[] = [expression]

        while (stack.length > 0) {
          let node = stack.pop()!
          if (
            node.type === AST_NODE_TYPES.MemberExpression &&
            node.object.type === AST_NODE_TYPES.Identifier &&
            node.object.name === enumName &&
            node.property.type === AST_NODE_TYPES.Identifier
          ) {
            dependencies.push(node.property.name)
          } else if (node.type === AST_NODE_TYPES.Identifier) {
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
          let dependencies = extractDependencies(
            member.initializer!,
            enumDeclaration.id.name,
          )

          let name =
            member.id.type === AST_NODE_TYPES.Literal
              ? member.id.value
              : sourceCode.getText(member.id)

          let group = computeGroup({
            customGroupMatcher: customGroup =>
              doesCustomGroupMatch({
                elementValue: sourceCode.getText(member.initializer),
                elementName: name,
                selectors: [],
                modifiers: [],
                customGroup,
              }),
            predefinedGroups: [],
            options,
          })

          let lastSortingNode = accumulator.at(-1)?.at(-1)
          let sortingNode: Omit<SortEnumsSortingNode, 'partitionId'> = {
            value:
              member.initializer?.type === AST_NODE_TYPES.Literal
                ? (member.initializer.value?.toString() ?? null)
                : null,
            isEslintDisabled: isNodeEslintDisabled(member, eslintDisabledLines),
            numericValue: getExpressionNumberValue(member.initializer!),
            size: rangeToDiff(member, sourceCode),
            dependencyNames: [name],
            node: member,
            dependencies,
            group,
            name,
          }

          if (
            shouldPartition({
              lastSortingNode,
              sortingNode,
              sourceCode,
              options,
            })
          ) {
            accumulator.push([])
          }

          accumulator.at(-1)!.push({
            ...sortingNode,
            partitionId: accumulator.length,
          })
          return accumulator
        },
        [[]],
      )

      let nodes = formattedMembers.flat()

      let isNumericEnum = nodes.every(
        sortingNode => sortingNode.numericValue !== null,
      )

      function sortNodesExcludingEslintDisabled(
        ignoreEslintDisabledNodes: boolean,
      ): SortEnumsSortingNode[] {
        let nodesSortedByGroups = formattedMembers.flatMap(sortingNodes =>
          sortNodesByGroups({
            comparatorByOptionsComputer:
              buildComparatorByOptionsComputer(isNumericEnum),
            optionsByGroupIndexComputer,
            ignoreEslintDisabledNodes,
            groups: options.groups,
            nodes: sortingNodes,
          }),
        )

        return sortNodesByDependencies(nodesSortedByGroups, {
          ignoreEslintDisabledNodes,
        })
      }

      reportAllErrors<MessageId>({
        availableMessageIds: {
          missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
          unexpectedDependencyOrder: DEPENDENCY_ORDER_ERROR_ID,
          extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
          unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
          unexpectedOrder: ORDER_ERROR_ID,
        },
        sortNodesExcludingEslintDisabled,
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
          ...buildCommonJsonSchemas(),
          ...buildCommonGroupsJsonSchemas({
            additionalCustomGroupMatchProperties:
              additionalCustomGroupMatchOptionsJsonSchema,
          }),
          sortByValue: {
            description: 'Specifies whether to sort enums by value.',
            enum: ['always', 'ifNumericEnum', 'never'],
            type: 'string',
          },
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      [DEPENDENCY_ORDER_ERROR_ID]: DEPENDENCY_ORDER_ERROR,
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
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

/**
 * Evaluates a binary expression to compute its numeric value.
 *
 * Supports arithmetic operators (+, -, *, /, %, **), bitwise operators (|, &,
 * ^, <<, >>), and returns null for unsupported expressions.
 *
 * @param leftExpression - The left operand of the binary expression.
 * @param rightExpression - The right operand of the binary expression.
 * @param operator - The operator string (e.g., '+', '-', '*', '|').
 * @returns The computed numeric value, or null if it cannot be evaluated.
 */
function getBinaryExpressionNumberValue(
  leftExpression: TSESTree.PrivateIdentifier | TSESTree.Expression,
  rightExpression: TSESTree.Expression,
  operator: string,
): number | null {
  let left = getExpressionNumberValue(leftExpression)
  let right = getExpressionNumberValue(rightExpression)
  if (left === null || right === null) {
    return null
  }
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
    /* v8 ignore next 2 -- @preserve Unsure if we can reach it. */
    default:
      return null
  }
}

/**
 * Extracts a numeric value from an AST expression node.
 *
 * Handles literal numbers, binary expressions, and unary expressions
 * recursively to compute the final numeric value.
 *
 * @param expression - The AST node to evaluate.
 * @returns The numeric value of the expression, or null if not evaluable.
 */
function getExpressionNumberValue(expression: TSESTree.Node): number | null {
  switch (expression.type) {
    case AST_NODE_TYPES.BinaryExpression:
      return getBinaryExpressionNumberValue(
        expression.left,
        expression.right,
        expression.operator,
      )
    case AST_NODE_TYPES.UnaryExpression:
      return getUnaryExpressionNumberValue(
        expression.argument,
        expression.operator,
      )
    case AST_NODE_TYPES.Literal:
      return typeof expression.value === 'number' ? expression.value : null
    default:
      return null
  }
}

/**
 * Evaluates a unary expression to compute its numeric value.
 *
 * Supports unary plus (+), minus (-), and bitwise NOT (~) operators.
 *
 * @param argumentExpression - The operand of the unary expression.
 * @param operator - The operator string (e.g., '+', '-', '~').
 * @returns The computed numeric value, or null if it cannot be evaluated.
 */
function getUnaryExpressionNumberValue(
  argumentExpression: TSESTree.Expression,
  operator: string,
): number | null {
  let argument = getExpressionNumberValue(argumentExpression)
  if (argument === null) {
    return null
  }
  switch (operator) {
    case '+':
      return argument
    case '-':
      return -argument
    case '~':
      return ~argument
    /* v8 ignore next 2 -- @preserve Unsure if we can reach it. */
    default:
      return null
  }
}
