import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { Selector, Options } from './sort-union-types/types'
import type { SortingNode } from '../types/sorting-node'

import {
  buildCustomGroupsArrayJsonSchema,
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
import { buildGetCustomGroupOverriddenOptionsFunction } from '../utils/get-custom-groups-compare-options'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { singleCustomGroupJsonSchema } from './sort-union-types/types'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { allSelectors } from './sort-union-types/types'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { complete } from '../utils/complete'

/** Cache computed groups by modifiers and selectors for performance. */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

type MessageId =
  | 'missedSpacingBetweenUnionTypes'
  | 'unexpectedUnionTypesGroupOrder'
  | 'extraSpacingBetweenUnionTypes'
  | 'unexpectedUnionTypesOrder'

let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted' },
  specialCharacters: 'keep',
  newlinesBetween: 'ignore',
  partitionByNewLine: false,
  partitionByComment: false,
  type: 'alphabetical',
  ignoreCase: true,
  locales: 'en-US',
  customGroups: [],
  alphabet: '',
  order: 'asc',
  groups: [],
}

export let jsonSchema: JSONSchema4 = {
  items: {
    properties: {
      ...commonJsonSchemas,
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
  uniqueItems: true,
  type: 'array',
}

export default createEslintRule<Options, MessageId>({
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
    defaultOptions: [defaultOptions],
    schema: jsonSchema,
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

export function sortUnionOrIntersectionTypes<MessageIds extends string>({
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
}): void {
  let settings = getSettings(context.settings)

  let options = complete(context.options.at(0), settings, defaultOptions)
  validateCustomSortConfiguration(options)
  validateGeneratedGroupsConfiguration({
    selectors: allSelectors,
    modifiers: [],
    options,
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

      let name = sourceCode.getText(type)

      let predefinedGroups = generatePredefinedGroups({
        cache: cachedGroupsByModifiersAndSelectors,
        modifiers: [],
        selectors,
      })
      let group = computeGroup({
        customGroupMatcher: customGroup =>
          doesCustomGroupMatch({
            elementName: name,
            modifiers: [],
            customGroup,
            selectors,
          }),
        predefinedGroups,
        options,
      })

      let lastGroup = accumulator.at(-1)
      let lastSortingNode = lastGroup?.at(-1)
      let sortingNode: Omit<SortingNode, 'partitionId'> = {
        isEslintDisabled: isNodeEslintDisabled(type, eslintDisabledLines),
        size: rangeToDiff(type, sourceCode),
        node: type,
        group,
        name,
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

      lastGroup?.push({
        ...sortingNode,
        partitionId: accumulator.length,
      })
      return accumulator
    },
    [[]],
  )

  for (let nodes of formattedMembers) {
    function createSortNodesExcludingEslintDisabled(
      sortingNodes: SortingNode[],
    ) {
      return function (ignoreEslintDisabledNodes: boolean): SortingNode[] {
        return sortNodesByGroups({
          getOptionsByGroupIndex:
            buildGetCustomGroupOverriddenOptionsFunction(options),
          ignoreEslintDisabledNodes,
          groups: options.groups,
          nodes: sortingNodes,
        })
      }
    }

    reportAllErrors<MessageIds>({
      sortNodesExcludingEslintDisabled:
        createSortNodesExcludingEslintDisabled(nodes),
      availableMessageIds,
      sourceCode,
      options,
      context,
      nodes,
    })
  }
}
