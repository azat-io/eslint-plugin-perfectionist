import type { TSESTree } from '@typescript-eslint/types'

import type { NodeValueGetterFunction } from '../utils/compare/compare'
import type { SortEnumsSortingNode, Options } from './sort-enums/types'
import type { TypeOption } from '../types/common-options'

import {
  buildCustomGroupsArrayJsonSchema,
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
} from '../utils/common-json-schemas'
import {
  DEPENDENCY_ORDER_ERROR,
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { computeOverriddenOptionsByGroupIndex } from '../utils/compute-overridden-options-by-group-index'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { UnreachableCaseError } from '../utils/unreachable-case-error'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { singleCustomGroupJsonSchema } from './sort-enums/types'
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

      function extractDependencies(
        expression: TSESTree.Expression,
        enumName: string,
      ): string[] {
        let dependencies: string[] = []
        let stack: TSESTree.Node[] = [expression]

        while (stack.length > 0) {
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
          let dependencies = extractDependencies(
            member.initializer!,
            enumDeclaration.id.name,
          )

          let name =
            member.id.type === 'Literal'
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
              member.initializer?.type === 'Literal'
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

      let nodeValueGetter = computeNodeValueGetter({
        isNumericEnum,
        options,
      })
      let overriddenOptions = {
        ...options,
        type: computeOptionType({
          isNumericEnum,
          options,
        }),
      }
      function sortNodesExcludingEslintDisabled(
        ignoreEslintDisabledNodes: boolean,
      ): SortEnumsSortingNode[] {
        let nodesSortedByGroups = formattedMembers.flatMap(sortingNodes =>
          sortNodesByGroups({
            optionsByGroupIndexComputer: groupIndex => ({
              options: computeOverriddenOptionsByGroupIndex(
                overriddenOptions,
                groupIndex,
              ),
              nodeValueGetter,
            }),
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
          sortByValue: {
            description: 'Specifies whether to sort enums by value.',
            enum: ['always', 'ifNumericEnum', 'never'],
            type: 'string',
          },
          customGroups: buildCustomGroupsArrayJsonSchema({
            singleCustomGroupJsonSchema,
          }),
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          groups: groupsJsonSchema,
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
    defaultOptions: [defaultOptions],
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-enums',
})

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

function computeNodeValueGetter({
  isNumericEnum,
  options,
}: {
  options: Pick<Required<Options[number]>, 'sortByValue'>
  isNumericEnum: boolean
}): NodeValueGetterFunction<SortEnumsSortingNode> | null {
  switch (options.sortByValue) {
    case 'ifNumericEnum':
      if (!isNumericEnum) {
        return null
      }
      break
    case 'always':
      break
    case 'never':
      return null
    /* v8 ignore next 2 -- @preserve Unsure if we can reach it. */
    default:
      throw new UnreachableCaseError(options.sortByValue)
  }
  return sortingNode => {
    if (isNumericEnum) {
      return sortingNode.numericValue!.toString()
    }
    return sortingNode.value ?? ''
  }
}

function getExpressionNumberValue(expression: TSESTree.Node): number | null {
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
      return typeof expression.value === 'number' ? expression.value : null
    default:
      return null
  }
}

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

function computeOptionType({
  isNumericEnum,
  options,
}: {
  options: Pick<Required<Options[number]>, 'sortByValue' | 'type'>
  isNumericEnum: boolean
}): TypeOption {
  /**
   * If the enum is numeric, and we sort by value, always use the `natural` sort
   * type, which will correctly sort them.
   */
  if (!isNumericEnum) {
    return options.type
  }
  if (options.sortByValue === 'never') {
    return options.type
  }
  return 'natural'
}
