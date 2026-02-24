import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { MessageId, Options } from './sort-maps/types'
import type { Settings } from '../utils/get-settings'

import {
  buildUseConfigurationIfJsonSchema,
  matchesAstSelectorJsonSchema,
  buildCommonJsonSchemas,
} from '../utils/json-schemas/common-json-schemas'
import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import {
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
} from './sort-maps/types'
import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import {
  sortPotentialMap,
  defaultOptions,
} from './sort-maps/sort-potential-map'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getSettings } from '../utils/get-settings'

export default createEslintRule<Options, MessageId>({
  meta: {
    schema: {
      items: {
        properties: {
          ...buildCommonJsonSchemas(),
          ...buildCommonGroupsJsonSchemas(),
          useConfigurationIf: buildUseConfigurationIfJsonSchema({
            additionalProperties: {
              matchesAstSelector: matchesAstSelectorJsonSchema,
            },
          }),
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
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-maps',
      description: 'Enforce sorted Map elements.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  create: context => {
    let settings = getSettings(context.settings)

    let alreadyParsedNodes = new Set<TSESTree.NewExpression>()

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
      'NewExpression:exit': node =>
        sortPotentialMap({
          alreadyParsedNodes,
          astSelector: null,
          settings,
          context,
          node,
        }),
    }
  },
  defaultOptions: [defaultOptions],
  name: 'sort-maps',
})

function buildPotentialEnumSorter({
  alreadyParsedNodes,
  astSelector,
  settings,
  context,
}: {
  context: Readonly<RuleContext<MessageId, Options>>
  alreadyParsedNodes: Set<TSESTree.NewExpression>
  astSelector: string
  settings: Settings
}): (node: TSESTree.Node) => void {
  return sorter

  function sorter(node: TSESTree.Node): void {
    if (node.type !== AST_NODE_TYPES.NewExpression) {
      return
    }

    sortPotentialMap({
      alreadyParsedNodes,
      astSelector,
      settings,
      context,
      node,
    })
  }
}
