import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import {
  matchesAstSelectorJsonSchema,
  buildUseConfigIfJsonSchema,
  buildCommonJsonSchemas,
} from '../../utils/json-schemas/common-json-schemas'
import {
  partitionByCommentJsonSchema,
  partitionByNewlineJsonSchema,
} from '../../utils/json-schemas/common-partition-json-schemas'
import { buildCommonGroupsJsonSchemas } from '../../utils/json-schemas/common-groups-json-schemas'
import { additionalCustomGroupMatchOptionsJsonSchema } from '../sort-union-types/types'

export function buildJsonSchema({
  ignoreCallableTypes,
}: {
  ignoreCallableTypes: boolean
}): JSONSchema4 {
  return {
    items: {
      properties: {
        ...buildCommonJsonSchemas(),
        ...buildCommonGroupsJsonSchemas({
          additionalCustomGroupMatchProperties:
            additionalCustomGroupMatchOptionsJsonSchema,
        }),
        useConfigurationIf: buildUseConfigIfJsonSchema({
          additionalProperties: {
            matchesAstSelector: matchesAstSelectorJsonSchema,
          },
        }),
        partitionByComment: partitionByCommentJsonSchema,
        partitionByNewLine: partitionByNewlineJsonSchema,
        ...(ignoreCallableTypes && {
          ignoreCallableTypes: { type: 'boolean' },
        }),
      },
      additionalProperties: false,
      type: 'object',
    },
    uniqueItems: true,
    type: 'array',
  }
}
