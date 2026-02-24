import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { MessageId, Options } from './sort-enums/types'
import type { Settings } from '../utils/get-settings'

import {
  additionalCustomGroupMatchOptionsJsonSchema,
  DEPENDENCY_ORDER_ERROR_ID,
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
} from './sort-enums/types'
import {
  useExperimentalDependencyDetectionJsonSchema,
  buildUseConfigurationIfJsonSchema,
  matchesAstSelectorJsonSchema,
  buildCommonJsonSchemas,
} from '../utils/json-schemas/common-json-schemas'
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
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { defaultOptions, sortEnum } from './sort-enums/sort-enum'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getSettings } from '../utils/get-settings'

export default createEslintRule<Options, MessageId>({
  meta: {
    schema: {
      items: {
        properties: {
          ...buildCommonJsonSchemas(),
          ...buildCommonGroupsJsonSchemas({
            additionalCustomGroupMatchProperties:
              additionalCustomGroupMatchOptionsJsonSchema,
          }),
          useConfigurationIf: buildUseConfigurationIfJsonSchema({
            additionalProperties: {
              matchesAstSelector: matchesAstSelectorJsonSchema,
            },
          }),
          sortByValue: {
            description: 'Specifies whether to sort enums by value.',
            enum: ['always', 'ifNumericEnum', 'never'],
            type: 'string',
          },
          useExperimentalDependencyDetection:
            useExperimentalDependencyDetectionJsonSchema,
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
      uniqueItems: true,
      type: 'array',
    },
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
  create: context => {
    let settings = getSettings(context.settings)

    let alreadyParsedNodes = new Set<TSESTree.TSEnumDeclaration>()

    let allAstSelectors = context.options
      .map(option => option.useConfigurationIf?.matchesAstSelector)
      .filter(matchesAstSelector => matchesAstSelector !== undefined)
    let allAstSelectorMatchers = allAstSelectors.map(
      astSelector =>
        [
          astSelector,
          buildPotentialEnumSorter({
            alreadyParsedNodes,
            astSelector,
            settings,
            context,
          }),
        ] as const,
    )

    return {
      ...Object.fromEntries(allAstSelectorMatchers),
      'TSEnumDeclaration:exit': node =>
        sortEnum({
          alreadyParsedNodes,
          astSelector: null,
          settings,
          context,
          node,
        }),
    }
  },
  defaultOptions: [defaultOptions],
  name: 'sort-enums',
})

function buildPotentialEnumSorter({
  alreadyParsedNodes,
  astSelector,
  settings,
  context,
}: {
  alreadyParsedNodes: Set<TSESTree.TSEnumDeclaration>
  context: Readonly<RuleContext<MessageId, Options>>
  astSelector: string
  settings: Settings
}): (node: TSESTree.Node) => void {
  return sorter

  function sorter(node: TSESTree.Node): void {
    if (node.type !== AST_NODE_TYPES.TSEnumDeclaration) {
      return
    }

    sortEnum({
      alreadyParsedNodes,
      astSelector,
      settings,
      context,
      node,
    })
  }
}
