import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'
import type { CompareOptions } from '../utils/compare'
import type { Options } from './sort-enums/types'

import {
  buildCustomGroupsArrayJsonSchema,
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  customGroupsJsonSchema,
  buildTypeJsonSchema,
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
import { getCustomGroupsCompareOptions } from '../utils/get-custom-groups-compare-options'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { doesCustomGroupMatch } from './sort-enums/does-custom-group-match'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { singleCustomGroupJsonSchema } from './sort-enums/types'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { getEnumMembers } from '../utils/get-enum-members'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { useGroups } from '../utils/use-groups'
import { complete } from '../utils/complete'

type MESSAGE_ID =
  | 'missedSpacingBetweenEnumsMembers'
  | 'extraSpacingBetweenEnumsMembers'
  | 'unexpectedEnumsDependencyOrder'
  | 'unexpectedEnumsGroupOrder'
  | 'unexpectedEnumsOrder'

interface SortEnumsSortingNode
  extends SortingNodeWithDependencies<TSESTree.TSEnumMember> {
  numericValue: number | null
}

let defaultOptions: Required<Options[0]> = {
  partitionByComment: false,
  partitionByNewLine: false,
  specialCharacters: 'keep',
  newlinesBetween: 'ignore',
  forceNumericSort: false,
  type: 'alphabetical',
  sortByValue: false,
  ignoreCase: true,
  fallbackSort: [],
  locales: 'en-US',
  customGroups: [],
  alphabet: '',
  order: 'asc',
  groups: [],
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
      validateGeneratedGroupsConfiguration({
        selectors: [],
        modifiers: [],
        options,
      })
      validateNewlinesAndPartitionConfiguration(options)

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
              ? `${member.id.value}`
              : sourceCode.getText(member.id)

          let { defineGroup, getGroup } = useGroups(options)
          for (let customGroup of options.customGroups) {
            if (
              doesCustomGroupMatch({
                elementValue: sourceCode.getText(member.initializer),
                elementName: name,
                customGroup,
              })
            ) {
              defineGroup(customGroup.groupName, true)
              /**
               * If the custom group is not referenced in the `groups` option, it
               * will be ignored
               */
              if (getGroup() === customGroup.groupName) {
                break
              }
            }
          }

          let lastSortingNode = accumulator.at(-1)?.at(-1)
          let sortingNode: SortEnumsSortingNode = {
            numericValue: member.initializer
              ? getExpressionNumberValue(
                  member.initializer,
                ) /* v8 ignore next - Unsure how we can reach that case */
              : null,
            isEslintDisabled: isNodeEslintDisabled(member, eslintDisabledLines),
            size: rangeToDiff(member, sourceCode),
            group: getGroup(),
            node: member,
            dependencies,
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

      let compareOptions: CompareOptions<SortEnumsSortingNode> &
        Required<Options[0]> = {
        ...options,
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
      }

      let sortNodesExcludingEslintDisabled = (
        ignoreEslintDisabledNodes: boolean,
      ): SortEnumsSortingNode[] =>
        sortNodesByDependencies(
          formattedMembers.flatMap(sortingNodes =>
            sortNodesByGroups(sortingNodes, compareOptions, {
              getGroupCompareOptions: groupNumber =>
                getCustomGroupsCompareOptions(compareOptions, groupNumber),
              ignoreEslintDisabledNodes,
            }),
          ),
          {
            ignoreEslintDisabledNodes,
          },
        )

      reportAllErrors<MESSAGE_ID>({
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
          customGroups: {
            oneOf: [
              customGroupsJsonSchema,
              buildCustomGroupsArrayJsonSchema({ singleCustomGroupJsonSchema }),
            ],
          },
          sortByValue: {
            description: 'Compare enum values instead of names.',
            type: 'boolean',
          },
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          type: buildTypeJsonSchema(),
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
