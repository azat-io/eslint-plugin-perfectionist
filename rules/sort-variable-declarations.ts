import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { MessageId, Options } from './sort-variable-declarations/types'

import {
  additionalCustomGroupMatchOptionsJsonSchema,
  DEPENDENCY_ORDER_ERROR_ID,
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
} from './sort-variable-declarations/types'
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
import {
  sortVariableDeclaration,
  defaultOptions,
} from './sort-variable-declarations/sort-variable-declaration'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
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
      url: 'https://perfectionist.dev/rules/sort-variable-declarations',
      description: 'Enforce sorted variable declarations.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  create: context =>
    buildAstListeners({
      nodeTypes: [AST_NODE_TYPES.VariableDeclaration],
      sorter: sortVariableDeclaration,
      context,
    }),
  name: 'sort-variable-declarations',
  defaultOptions: [defaultOptions],
})
