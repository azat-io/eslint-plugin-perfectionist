import type { MessageId, Options } from './sort-heritage-clauses/types'

import {
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
} from './sort-heritage-clauses/types'
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
import {
  buildUseConfigurationIfJsonSchema,
  buildCommonJsonSchemas,
} from '../utils/json-schemas/common-json-schemas'
import {
  sortHeritageClause,
  defaultOptions,
} from './sort-heritage-clauses/sort-heritage-clause'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getSettings } from '../utils/get-settings'

export default createEslintRule<Options, MessageId>({
  meta: {
    schema: {
      items: {
        properties: {
          ...buildCommonJsonSchemas(),
          ...buildCommonGroupsJsonSchemas(),
          useConfigurationIf: buildUseConfigurationIfJsonSchema(),
          partitionByNewLine: partitionByNewLineJsonSchema,
          partitionByComment: partitionByCommentJsonSchema,
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
      url: 'https://perfectionist.dev/rules/sort-heritage-clauses',
      description: 'Enforce sorted heritage clauses.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  create: context => {
    let settings = getSettings(context.settings)

    return {
      TSInterfaceDeclaration: node =>
        sortHeritageClause({
          settings,
          context,
          node,
        }),
      ClassDeclaration: node =>
        sortHeritageClause({
          settings,
          context,
          node,
        }),
    }
  },
  defaultOptions: [defaultOptions],
  name: 'sort-heritage-clauses',
})
