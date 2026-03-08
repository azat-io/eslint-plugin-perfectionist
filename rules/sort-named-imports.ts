import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { MessageId, Options } from './sort-named-imports/types'

import {
  additionalCustomGroupMatchOptionsJsonSchema,
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
} from './sort-named-imports/types'
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
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import {
  sortNamedImport,
  defaultOptions,
} from './sort-named-imports/sort-named-import'
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
            },
          }),
          ignoreAlias: {
            description: 'Controls whether to ignore alias names.',
            type: 'boolean',
          },
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
      url: 'https://perfectionist.dev/rules/sort-named-imports',
      description: 'Enforce sorted named imports.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  create: context =>
    buildAstListeners({
      nodeTypes: [AST_NODE_TYPES.ImportDeclaration],
      sorter: sortNamedImport,
      context,
    }),
  defaultOptions: [defaultOptions],
  name: 'sort-named-imports',
})
