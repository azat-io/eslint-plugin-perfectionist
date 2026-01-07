import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  SortModulesSortingNode,
  SortModulesOptions,
} from './sort-modules/types'

import {
  DEPENDENCY_ORDER_ERROR,
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import {
  additionalCustomGroupMatchOptionsJsonSchema,
  USAGE_TYPE_OPTION,
  allModifiers,
  allSelectors,
} from './sort-modules/types'
import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { buildComparatorByOptionsComputer } from './sort-modules/build-comparator-by-options-computer'
import { buildOptionsByGroupIndexComputer } from '../utils/build-options-by-group-index-computer'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { buildCommonJsonSchemas } from '../utils/json-schemas/common-json-schemas'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { computeNodeDetails } from './sort-modules/compute-node-details'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { getGroupIndex } from '../utils/get-group-index'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { complete } from '../utils/complete'

/** Cache computed groups by modifiers and selectors for performance. */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

const ORDER_ERROR_ID = 'unexpectedModulesOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedModulesGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenModulesMembers'
const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenModulesMembers'
const DEPENDENCY_ORDER_ERROR_ID = 'unexpectedModulesDependencyOrder'

type MessageId =
  | typeof DEPENDENCY_ORDER_ERROR_ID
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

let defaultOptions: Required<SortModulesOptions[number]> = {
  groups: [
    'declare-enum',
    'export-enum',
    'enum',
    ['declare-interface', 'declare-type'],
    ['export-interface', 'export-type'],
    ['interface', 'type'],
    'declare-class',
    'class',
    'export-class',
    'declare-function',
    'export-function',
    'function',
  ],
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
  partitionByComment: false,
  partitionByNewLine: false,
  newlinesBetween: 'ignore',
  specialCharacters: 'keep',
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
}

export default createEslintRule<SortModulesOptions, MessageId>({
  meta: {
    schema: [
      {
        properties: {
          ...buildCommonJsonSchemas({
            allowedAdditionalTypeValues: [USAGE_TYPE_OPTION],
          }),
          ...buildCommonGroupsJsonSchemas({
            additionalCustomGroupMatchProperties:
              additionalCustomGroupMatchOptionsJsonSchema,
            allowedAdditionalTypeValues: [USAGE_TYPE_OPTION],
          }),
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
      url: 'https://perfectionist.dev/rules/sort-modules',
      description: 'Enforce sorted modules.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  create: context => {
    let settings = getSettings(context.settings)
    let options = complete(context.options.at(0), settings, defaultOptions)
    validateCustomSortConfiguration(options)
    validateGroupsConfiguration({
      modifiers: allModifiers,
      selectors: allSelectors,
      options,
    })
    validateNewlinesAndPartitionConfiguration(options)

    let { sourceCode, id } = context
    let eslintDisabledLines = getEslintDisabledLines({
      ruleName: id,
      sourceCode,
    })

    return {
      Program: program =>
        analyzeModule({
          eslintDisabledLines,
          module: program,
          sourceCode,
          options,
          context,
        }),
    }
  },
  defaultOptions: [defaultOptions],
  name: 'sort-modules',
})

function analyzeModule({
  eslintDisabledLines,
  sourceCode,
  options,
  context,
  module,
}: {
  context: TSESLint.RuleContext<MessageId, SortModulesOptions>
  module: TSESTree.TSModuleBlock | TSESTree.Program
  options: Required<SortModulesOptions[number]>
  sourceCode: TSESLint.SourceCode
  eslintDisabledLines: number[]
}): void {
  let optionsByGroupIndexComputer = buildOptionsByGroupIndexComputer(options)

  let formattedNodes: SortModulesSortingNode[][] = [[]]
  for (let node of module.body) {
    switch (node.type) {
      case AST_NODE_TYPES.ExportDefaultDeclaration:
      case AST_NODE_TYPES.ExportNamedDeclaration:
      case AST_NODE_TYPES.TSInterfaceDeclaration:
      case AST_NODE_TYPES.TSTypeAliasDeclaration:
      case AST_NODE_TYPES.FunctionDeclaration:
      case AST_NODE_TYPES.TSModuleDeclaration:
        break
      case AST_NODE_TYPES.VariableDeclaration:
      case AST_NODE_TYPES.ExpressionStatement:
        formattedNodes.push([])
        continue
      case AST_NODE_TYPES.TSDeclareFunction:
      case AST_NODE_TYPES.TSEnumDeclaration:
      case AST_NODE_TYPES.ClassDeclaration:
        break
      default:
        continue
    }

    let details = computeNodeDetails({ sourceCode, node })

    if (!details.nodeDetails) {
      if (details.shouldPartitionAfterNode) {
        formattedNodes.push([])
      }
      if (details.moduleBlock) {
        analyzeModule({
          module: details.moduleBlock,
          eslintDisabledLines,
          sourceCode,
          options,
          context,
        })
      }
      continue
    }

    let {
      addSafetySemicolonWhenInline,
      dependencies,
      decorators,
      modifiers,
      selector,
      name,
    } = details.nodeDetails

    let predefinedGroups = generatePredefinedGroups({
      cache: cachedGroupsByModifiersAndSelectors,
      selectors: [selector],
      modifiers,
    })
    let group = computeGroup({
      customGroupMatcher: customGroup =>
        doesCustomGroupMatch({
          selectors: [selector],
          elementName: name,
          customGroup,
          decorators,
          modifiers,
        }),
      predefinedGroups,
      options,
    })

    let sortingNode: Omit<SortModulesSortingNode, 'partitionId'> = {
      isEslintDisabled: isNodeEslintDisabled(node, eslintDisabledLines),
      size: rangeToDiff(node, sourceCode),
      addSafetySemicolonWhenInline,
      dependencyNames: [name],
      dependencies,
      group,
      name,
      node,
    }

    let lastSortingNode = formattedNodes.at(-1)?.at(-1)
    if (
      shouldPartition({
        lastSortingNode,
        sortingNode,
        sourceCode,
        options,
      })
    ) {
      formattedNodes.push([])
    }

    formattedNodes.at(-1)?.push({
      ...sortingNode,
      partitionId: formattedNodes.length,
    })
  }

  let sortingNodes = formattedNodes.flat()

  reportAllErrors<MessageId>({
    availableMessageIds: {
      missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
      unexpectedDependencyOrder: DEPENDENCY_ORDER_ERROR_ID,
      extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
      unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
      unexpectedOrder: ORDER_ERROR_ID,
    },
    sortNodesExcludingEslintDisabled,
    nodes: sortingNodes,
    options,
    context,
  })

  function sortNodesExcludingEslintDisabled(
    ignoreEslintDisabledNodes: boolean,
  ): SortModulesSortingNode[] {
    let nodesSortedByGroups = formattedNodes.flatMap(nodes =>
      sortNodesByGroups({
        comparatorByOptionsComputer: buildComparatorByOptionsComputer({
          ignoreEslintDisabledNodes,
          sortingNodes: nodes,
        }),
        isNodeIgnored: sortingNode =>
          getGroupIndex(options.groups, sortingNode) === options.groups.length,
        optionsByGroupIndexComputer,
        ignoreEslintDisabledNodes,
        groups: options.groups,
        nodes,
      }),
    )

    return sortNodesByDependencies(nodesSortedByGroups, {
      ignoreEslintDisabledNodes,
    })
  }
}
