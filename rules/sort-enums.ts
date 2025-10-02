import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'
import type { NodeValueGetterFunction } from '../utils/compare'
import type { TypeOption } from '../types/common-options'
import type { Options } from './sort-enums/types'

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
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { getCustomGroupOverriddenOptions } from '../utils/get-custom-groups-compare-options'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
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

type MessageId =
  | 'missedSpacingBetweenEnumsMembers'
  | 'extraSpacingBetweenEnumsMembers'
  | 'unexpectedEnumsDependencyOrder'
  | 'unexpectedEnumsGroupOrder'
  | 'unexpectedEnumsOrder'

interface SortEnumsSortingNode
  extends SortingNodeWithDependencies<TSESTree.TSEnumMember> {
  numericValue: number | null
  value: string | null
}

let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted' },
  partitionByComment: false,
  partitionByNewLine: false,
  specialCharacters: 'keep',
  newlinesBetween: 'ignore',
  forceNumericSort: false,
  type: 'alphabetical',
  sortByValue: false,
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
      validateGeneratedGroupsConfiguration({
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
          let dependencies: string[] = []
          if (member.initializer) {
            dependencies = extractDependencies(
              member.initializer,
              enumDeclaration.id.name,
            )
          }

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
            numericValue: member.initializer
              ? getExpressionNumberValue(
                  member.initializer,
                ) /* v8 ignore next - Unsure how we can reach that case */
              : null,
            value:
              member.initializer?.type === 'Literal'
                ? (member.initializer.value?.toString() ?? null)
                : null,
            isEslintDisabled: isNodeEslintDisabled(member, eslintDisabledLines),
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
        sortingNode =>
          sortingNode.numericValue !== null &&
          !Number.isNaN(sortingNode.numericValue),
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
            getOptionsByGroupIndex: groupIndex => ({
              options: getCustomGroupOverriddenOptions({
                options: overriddenOptions,
                groupIndex,
              }),
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
          missedSpacingBetweenMembers: 'missedSpacingBetweenEnumsMembers',
          extraSpacingBetweenMembers: 'extraSpacingBetweenEnumsMembers',
          unexpectedDependencyOrder: 'unexpectedEnumsDependencyOrder',
          unexpectedGroupOrder: 'unexpectedEnumsGroupOrder',
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
      unexpectedEnumsDependencyOrder: DEPENDENCY_ORDER_ERROR,
      missedSpacingBetweenEnumsMembers: MISSED_SPACING_ERROR,
      extraSpacingBetweenEnumsMembers: EXTRA_SPACING_ERROR,
      unexpectedEnumsGroupOrder: GROUP_ORDER_ERROR,
      unexpectedEnumsOrder: ORDER_ERROR,
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
): number {
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

function getExpressionNumberValue(expression: TSESTree.Node): number {
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

function computeNodeValueGetter({
  isNumericEnum,
  options,
}: {
  options: Pick<Required<Options[number]>, 'forceNumericSort' | 'sortByValue'>
  isNumericEnum: boolean
}): NodeValueGetterFunction<SortEnumsSortingNode> | null {
  return options.sortByValue || (isNumericEnum && options.forceNumericSort)
    ? sortingNode => {
        if (isNumericEnum) {
          return sortingNode.numericValue!.toString()
        }
        return sortingNode.value ?? ''
      }
    : null
}

function computeOptionType({
  isNumericEnum,
  options,
}: {
  options: Pick<
    Required<Options[number]>,
    'forceNumericSort' | 'sortByValue' | 'type'
  >
  isNumericEnum: boolean
}): TypeOption {
  /**
   * If the enum is numeric, and we sort by value, always use the `natural` sort
   * type, which will correctly sort them.
   */
  return isNumericEnum && (options.forceNumericSort || options.sortByValue)
    ? 'natural'
    : options.type
}

function getUnaryExpressionNumberValue(
  argumentExpression: TSESTree.Expression,
  operator: string,
): number {
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
