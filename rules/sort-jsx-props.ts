import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { MessageId, Options } from './sort-jsx-props/types'

import {
  additionalCustomGroupMatchOptionsJsonSchema,
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
} from './sort-jsx-props/types'
import {
  buildUseConfigurationIfJsonSchema,
  matchesAstSelectorJsonSchema,
  buildCommonJsonSchemas,
  buildRegexJsonSchema,
} from '../utils/json-schemas/common-json-schemas'
import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { partitionByNewLineJsonSchema } from '../utils/json-schemas/common-partition-json-schemas'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { defaultOptions, sortJsxObject } from './sort-jsx-props/sort-jsx-object'
import { buildAstListeners } from '../utils/build-ast-listeners'
import { createEslintRule } from '../utils/create-eslint-rule'

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
              tagMatchesPattern: buildRegexJsonSchema(),
            },
          }),
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
      url: 'https://perfectionist.dev/rules/sort-jsx-props',
      description: 'Enforce sorted JSX props.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  create: context =>
    buildAstListeners({
      nodeTypes: [AST_NODE_TYPES.JSXElement],
      sorter: sortJsxObject,
      context,
    }),
  defaultOptions: [defaultOptions],
  name: 'sort-jsx-props',
})
