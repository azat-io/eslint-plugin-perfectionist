import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import { regexScopes } from '../../types/scoped-regex-option'
import { buildRegexJsonSchema } from './common-json-schemas'

export let scopedRegexJsonSchema: JSONSchema4 = buildRegexJsonSchema({
  additionalProperties: {
    scope: {
      enum: [...regexScopes],
      type: 'string',
    },
  },
})
