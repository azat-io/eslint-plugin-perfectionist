import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type {
  PartitionByCommentOption,
  CommonOptions,
  GroupOptions,
} from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  buildTypeJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
} from '../utils/common-json-schemas'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/has-partition-comment'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getCommentsBefore } from '../utils/get-comments-before'
import { getNewlinesErrors } from '../utils/get-newlines-errors'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { reportErrors } from '../utils/report-errors'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { useGroups } from '../utils/use-groups'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

export type Options = [
  Partial<
    {
      type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
      newlinesBetween: 'ignore' | 'always' | 'never'
      partitionByComment: PartitionByCommentOption
      groups: GroupOptions<Group>
      partitionByNewLine: boolean
    } & CommonOptions
  >,
]

type Group =
  | 'intersection'
  | 'conditional'
  | 'function'
  | 'operator'
  | 'keyword'
  | 'literal'
  | 'nullish'
  | 'unknown'
  | 'import'
  | 'object'
  | 'named'
  | 'tuple'
  | 'union'

type MESSAGE_ID =
  | 'missedSpacingBetweenUnionTypes'
  | 'unexpectedUnionTypesGroupOrder'
  | 'extraSpacingBetweenUnionTypes'
  | 'unexpectedUnionTypesOrder'

let defaultOptions: Required<Options[0]> = {
  specialCharacters: 'keep',
  newlinesBetween: 'ignore',
  partitionByNewLine: false,
  partitionByComment: false,
  type: 'alphabetical',
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export let jsonSchema: JSONSchema4 = {
  properties: {
    ...commonJsonSchemas,
    partitionByComment: partitionByCommentJsonSchema,
    partitionByNewLine: partitionByNewLineJsonSchema,
    newlinesBetween: newlinesBetweenJsonSchema,
    type: buildTypeJsonSchema(),
    groups: groupsJsonSchema,
  },
  additionalProperties: false,
  type: 'object',
}

export default createEslintRule<Options, MESSAGE_ID>({
  meta: {
    messages: {
      unexpectedUnionTypesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      missedSpacingBetweenUnionTypes:
        'Missed spacing between "{{left}}" and "{{right}}" types.',
      extraSpacingBetweenUnionTypes:
        'Extra spacing between "{{left}}" and "{{right}}" types.',
      unexpectedUnionTypesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-union-types',
      description: 'Enforce sorted union types.',
      recommended: true,
    },
    schema: [jsonSchema],
    type: 'suggestion',
    fixable: 'code',
  },
  create: context => ({
    TSUnionType: node => {
      sortUnionOrIntersectionTypes({
        availableMessageIds: {
          missedSpacingBetweenMembers: 'missedSpacingBetweenUnionTypes',
          extraSpacingBetweenMembers: 'extraSpacingBetweenUnionTypes',
          unexpectedGroupOrder: 'unexpectedUnionTypesGroupOrder',
          unexpectedOrder: 'unexpectedUnionTypesOrder',
        },
        tokenValueToIgnoreBefore: '|',
        context,
        node,
      })
    },
  }),
  defaultOptions: [defaultOptions],
  name: 'sort-union-types',
})

export let sortUnionOrIntersectionTypes = <MessageIds extends string>({
  tokenValueToIgnoreBefore,
  availableMessageIds,
  context,
  node,
}: {
  availableMessageIds: {
    missedSpacingBetweenMembers: MessageIds
    extraSpacingBetweenMembers: MessageIds
    unexpectedGroupOrder: MessageIds
    unexpectedOrder: MessageIds
  }
  node: TSESTree.TSIntersectionType | TSESTree.TSUnionType
  context: Readonly<RuleContext<MessageIds, Options>>
  tokenValueToIgnoreBefore: string
}): void => {
  let settings = getSettings(context.settings)

  let options = complete(context.options.at(0), settings, defaultOptions)
  validateCustomSortConfiguration(options)
  validateGroupsConfiguration(
    options.groups,
    [
      'intersection',
      'conditional',
      'function',
      'operator',
      'keyword',
      'literal',
      'nullish',
      'unknown',
      'import',
      'object',
      'named',
      'tuple',
      'union',
    ],
    [],
  )
  validateNewlinesAndPartitionConfiguration(options)

  let sourceCode = getSourceCode(context)
  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: context.id,
    sourceCode,
  })

  let formattedMembers: SortingNode[][] = node.types.reduce(
    (accumulator: SortingNode[][], type) => {
      let { defineGroup, getGroup } = useGroups(options)

      switch (type.type) {
        case 'TSTemplateLiteralType':
        case 'TSLiteralType':
          defineGroup('literal')
          break
        case 'TSIndexedAccessType':
        case 'TSTypeReference':
        case 'TSQualifiedName':
        case 'TSArrayType':
        case 'TSInferType':
          defineGroup('named')
          break
        case 'TSIntersectionType':
          defineGroup('intersection')
          break
        case 'TSUndefinedKeyword':
        case 'TSNullKeyword':
        case 'TSVoidKeyword':
          defineGroup('nullish')
          break
        case 'TSConditionalType':
          defineGroup('conditional')
          break
        case 'TSConstructorType':
        case 'TSFunctionType':
          defineGroup('function')
          break
        case 'TSBooleanKeyword':
        case 'TSUnknownKeyword':
        case 'TSBigIntKeyword':
        case 'TSNumberKeyword':
        case 'TSObjectKeyword':
        case 'TSStringKeyword':
        case 'TSSymbolKeyword':
        case 'TSNeverKeyword':
        case 'TSAnyKeyword':
        case 'TSThisType':
          defineGroup('keyword')
          break
        case 'TSTypeOperator':
        case 'TSTypeQuery':
          defineGroup('operator')
          break
        case 'TSTypeLiteral':
        case 'TSMappedType':
          defineGroup('object')
          break
        case 'TSImportType':
          defineGroup('import')
          break
        case 'TSTupleType':
          defineGroup('tuple')
          break
        case 'TSUnionType':
          defineGroup('union')
          break
      }

      let lastGroup = accumulator.at(-1)
      let lastSortingNode = lastGroup?.at(-1)
      let sortingNode: SortingNode = {
        isEslintDisabled: isNodeEslintDisabled(type, eslintDisabledLines),
        size: rangeToDiff(type, sourceCode),
        name: sourceCode.getText(type),
        group: getGroup(),
        node: type,
      }
      if (
        hasPartitionComment({
          comments: getCommentsBefore({
            tokenValueToIgnoreBefore,
            node: type,
            sourceCode,
          }),
          partitionByComment: options.partitionByComment,
        }) ||
        (options.partitionByNewLine &&
          lastSortingNode &&
          getLinesBetween(sourceCode, lastSortingNode, sortingNode))
      ) {
        lastGroup = []
        accumulator.push(lastGroup)
      }

      lastGroup?.push(sortingNode)
      return accumulator
    },
    [[]],
  )

  for (let nodes of formattedMembers) {
    let sortNodesExcludingEslintDisabled = (
      ignoreEslintDisabledNodes: boolean,
    ): SortingNode[] =>
      sortNodesByGroups(nodes, options, { ignoreEslintDisabledNodes })
    let sortedNodes = sortNodesExcludingEslintDisabled(false)
    let sortedNodesExcludingEslintDisabled =
      sortNodesExcludingEslintDisabled(true)

    let nodeIndexMap = createNodeIndexMap(sortedNodes)

    pairwise(nodes, (left, right) => {
      let leftNumber = getGroupNumber(options.groups, left)
      let rightNumber = getGroupNumber(options.groups, right)

      let leftIndex = nodeIndexMap.get(left)!
      let rightIndex = nodeIndexMap.get(right)!

      let indexOfRightExcludingEslintDisabled =
        sortedNodesExcludingEslintDisabled.indexOf(right)

      let messageIds: MessageIds[] = []

      if (
        leftIndex > rightIndex ||
        leftIndex >= indexOfRightExcludingEslintDisabled
      ) {
        messageIds.push(
          leftNumber === rightNumber
            ? availableMessageIds.unexpectedOrder
            : availableMessageIds.unexpectedGroupOrder,
        )
      }

      messageIds = [
        ...messageIds,
        ...getNewlinesErrors({
          missedSpacingError: availableMessageIds.missedSpacingBetweenMembers,
          extraSpacingError: availableMessageIds.extraSpacingBetweenMembers,
          rightNum: rightNumber,
          leftNum: leftNumber,
          sourceCode,
          options,
          right,
          left,
        }),
      ]

      reportErrors({
        sortedNodes: sortedNodesExcludingEslintDisabled,
        messageIds,
        sourceCode,
        options,
        context,
        nodes,
        right,
        left,
      })
    })
  }
}
