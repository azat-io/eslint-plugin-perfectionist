import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { MessageId, Options } from './sort-classes/types'
import type { Settings } from '../utils/get-settings'

import {
  useExperimentalDependencyDetectionJsonSchema,
  buildUseConfigurationIfJsonSchema,
  matchesAstSelectorJsonSchema,
  buildCommonJsonSchemas,
  buildRegexJsonSchema,
} from '../utils/json-schemas/common-json-schemas'
import {
  additionalCustomGroupMatchOptionsJsonSchema,
  DEPENDENCY_ORDER_ERROR_ID,
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
} from './sort-classes/types'
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
import { defaultOptions, sortClass } from './sort-classes/sort-class'
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
          useExperimentalDependencyDetection:
            useExperimentalDependencyDetectionJsonSchema,
          ignoreCallbackDependenciesPatterns: buildRegexJsonSchema(),
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
      url: 'https://perfectionist.dev/rules/sort-classes',
      description: 'Enforce sorted classes.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  create: context => {
    let settings = getSettings(context.settings)

    let alreadyParsedNodes = new Set<TSESTree.ClassBody>()

    let allAstSelectors = context.options
      .map(option => option.useConfigurationIf?.matchesAstSelector)
      .filter(matchesAstSelector => matchesAstSelector !== undefined)
    let allAstSelectorMatchers = allAstSelectors.map(
      astSelector =>
        [
          astSelector,
          buildPotentialClassSorter({
            alreadyParsedNodes,
            astSelector,
            settings,
            context,
          }),
        ] as const,
    )

    return {
      ...Object.fromEntries(allAstSelectorMatchers),
      'ClassBody:exit': classBody =>
        sortClass({
          alreadyParsedNodes,
          astSelector: null,
          node: classBody,
          settings,
          context,
        }),
    }
  },
  defaultOptions: [defaultOptions],
  name: 'sort-classes',
})

function buildPotentialClassSorter({
  alreadyParsedNodes,
  astSelector,
  settings,
  context,
}: {
  context: Readonly<RuleContext<MessageId, Options>>
  alreadyParsedNodes: Set<TSESTree.ClassBody>
  astSelector: string
  settings: Settings
}): (node: TSESTree.Node) => void {
  return sorter

  function sorter(node: TSESTree.Node): void {
    if (node.type !== AST_NODE_TYPES.ClassBody) {
      return
    }

    sortClass({
      alreadyParsedNodes,
      astSelector,
      settings,
      context,
      node,
    })
  }
}
