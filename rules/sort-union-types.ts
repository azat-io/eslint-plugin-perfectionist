import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { Selector, Options } from './sort-union-types/types'
import type { SortingNode } from '../types/sorting-node'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
} from '../utils/common-json-schemas'
import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { complete } from '../utils/complete'

/**
 * Cache computed groups by modifiers and selectors for performance
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

type MESSAGE_ID =
  | 'missedSpacingBetweenUnionTypes'
  | 'unexpectedUnionTypesGroupOrder'
  | 'extraSpacingBetweenUnionTypes'
  | 'unexpectedUnionTypesOrder'

let defaultOptions: Required<Options[0]> = {
  fallbackSort: { type: 'unsorted' },
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
    groups: groupsJsonSchema,
  },
  additionalProperties: false,
  type: 'object',
}

export default createEslintRule<Options, MESSAGE_ID>({
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
  meta: {
    messages: {
      missedSpacingBetweenUnionTypes: MISSED_SPACING_ERROR,
      extraSpacingBetweenUnionTypes: EXTRA_SPACING_ERROR,
      unexpectedUnionTypesGroupOrder: GROUP_ORDER_ERROR,
      unexpectedUnionTypesOrder: ORDER_ERROR,
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
  validateGeneratedGroupsConfiguration({
    selectors: [
      'intersection',
      'conditional',
      'function',
      'operator',
      'keyword',
      'literal',
      'nullish',
      'import',
      'object',
      'named',
      'tuple',
      'union',
    ],
    options: {
      ...options,
      customGroups: [],
    },
    modifiers: [],
  })
  validateNewlinesAndPartitionConfiguration(options)

  let { sourceCode, id } = context
  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: id,
    sourceCode,
  })

  let formattedMembers: SortingNode[][] = node.types.reduce(
    (accumulator: SortingNode[][], type) => {
      let selectors: Selector[] = []

      switch (type.type) {
        case 'TSTemplateLiteralType':
        case 'TSLiteralType':
          selectors.push('literal')
          break
        case 'TSIndexedAccessType':
        case 'TSTypeReference':
        case 'TSQualifiedName':
        case 'TSArrayType':
        case 'TSInferType':
          selectors.push('named')
          break
        case 'TSIntersectionType':
          selectors.push('intersection')
          break
        case 'TSUndefinedKeyword':
        case 'TSNullKeyword':
        case 'TSVoidKeyword':
          selectors.push('nullish')
          break
        case 'TSConditionalType':
          selectors.push('conditional')
          break
        case 'TSConstructorType':
        case 'TSFunctionType':
          selectors.push('function')
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
          selectors.push('keyword')
          break
        case 'TSTypeOperator':
        case 'TSTypeQuery':
          selectors.push('operator')
          break
        case 'TSTypeLiteral':
        case 'TSMappedType':
          selectors.push('object')
          break
        case 'TSImportType':
          selectors.push('import')
          break
        case 'TSTupleType':
          selectors.push('tuple')
          break
        case 'TSUnionType':
          selectors.push('union')
          break
      }

      let predefinedGroups = generatePredefinedGroups({
        cache: cachedGroupsByModifiersAndSelectors,
        modifiers: [],
        selectors,
      })
      let group = computeGroup({
        predefinedGroups,
        options,
      })

      let lastGroup = accumulator.at(-1)
      let lastSortingNode = lastGroup?.at(-1)
      let sortingNode: SortingNode = {
        isEslintDisabled: isNodeEslintDisabled(type, eslintDisabledLines),
        size: rangeToDiff(type, sourceCode),
        name: sourceCode.getText(type),
        node: type,
        group,
      }

      if (
        shouldPartition({
          tokenValueToIgnoreBefore,
          lastSortingNode,
          sortingNode,
          sourceCode,
          options,
        })
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
      sortNodesByGroups({
        getOptionsByGroupNumber: () => ({ options }),
        ignoreEslintDisabledNodes,
        groups: options.groups,
        nodes,
      })

    reportAllErrors<MessageIds>({
      sortNodesExcludingEslintDisabled,
      availableMessageIds,
      sourceCode,
      options,
      context,
      nodes,
    })
  }
}
