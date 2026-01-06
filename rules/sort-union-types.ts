import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Selector, Options } from './sort-union-types/types'
import type { SortingNode } from '../types/sorting-node'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { buildDefaultOptionsByGroupIndexComputer } from '../utils/build-default-options-by-group-index-computer'
import { defaultComparatorByOptionsComputer } from '../utils/compare/default-comparator-by-options-computer'
import {
  additionalCustomGroupMatchOptionsJsonSchema,
  allSelectors,
} from './sort-union-types/types'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { buildCommonJsonSchemas } from '../utils/json-schemas/common-json-schemas'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { complete } from '../utils/complete'

/** Cache computed groups by modifiers and selectors for performance. */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

const ORDER_ERROR_ID = 'unexpectedUnionTypesOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedUnionTypesGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenUnionTypes'
const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenUnionTypes'

type MessageId =
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
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
      ...buildCommonJsonSchemas(),
      ...buildCommonGroupsJsonSchemas({
        additionalCustomGroupMatchProperties:
          additionalCustomGroupMatchOptionsJsonSchema,
      }),
      partitionByComment: partitionByCommentJsonSchema,
      partitionByNewLine: partitionByNewLineJsonSchema,
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
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-union-types',
      description: 'Enforce sorted union types.',
      recommended: true,
    },
    schema: jsonSchema,
    type: 'suggestion',
    fixable: 'code',
  },
  create: context => ({
    TSUnionType: node => {
      sortUnionOrIntersectionTypes({
        availableMessageIds: {
          missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
          extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
          unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
          unexpectedOrder: ORDER_ERROR_ID,
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
  validateGroupsConfiguration({
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
        case AST_NODE_TYPES.TSTemplateLiteralType:
        case AST_NODE_TYPES.TSLiteralType:
          selectors.push('literal')
          break
        case AST_NODE_TYPES.TSIndexedAccessType:
        case AST_NODE_TYPES.TSTypeReference:
        case AST_NODE_TYPES.TSQualifiedName:
        case AST_NODE_TYPES.TSArrayType:
        case AST_NODE_TYPES.TSInferType:
          selectors.push('named')
          break
        case AST_NODE_TYPES.TSIntersectionType:
          selectors.push('intersection')
          break
        case AST_NODE_TYPES.TSUndefinedKeyword:
        case AST_NODE_TYPES.TSNullKeyword:
        case AST_NODE_TYPES.TSVoidKeyword:
          selectors.push('nullish')
          break
        case AST_NODE_TYPES.TSConditionalType:
          selectors.push('conditional')
          break
        case AST_NODE_TYPES.TSConstructorType:
        case AST_NODE_TYPES.TSFunctionType:
          selectors.push('function')
          break
        case AST_NODE_TYPES.TSBooleanKeyword:
        case AST_NODE_TYPES.TSUnknownKeyword:
        case AST_NODE_TYPES.TSBigIntKeyword:
        case AST_NODE_TYPES.TSNumberKeyword:
        case AST_NODE_TYPES.TSObjectKeyword:
        case AST_NODE_TYPES.TSStringKeyword:
        case AST_NODE_TYPES.TSSymbolKeyword:
        case AST_NODE_TYPES.TSNeverKeyword:
        case AST_NODE_TYPES.TSAnyKeyword:
        case AST_NODE_TYPES.TSThisType:
          selectors.push('keyword')
          break
        case AST_NODE_TYPES.TSTypeOperator:
        case AST_NODE_TYPES.TSTypeQuery:
          selectors.push('operator')
          break
        case AST_NODE_TYPES.TSTypeLiteral:
        case AST_NODE_TYPES.TSMappedType:
          selectors.push('object')
          break
        case AST_NODE_TYPES.TSImportType:
          selectors.push('import')
          break
        case AST_NODE_TYPES.TSTupleType:
          selectors.push('tuple')
          break
        case AST_NODE_TYPES.TSUnionType:
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
          optionsByGroupIndexComputer:
            buildDefaultOptionsByGroupIndexComputer(options),
          comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
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
      options,
      context,
      nodes,
    })
  }
}
