import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import { buildRegexJsonSchema } from './common-json-schemas'

let allowedPartitionByCommentJsonSchemas: JSONSchema4[] = [
  {
    type: 'boolean',
  },
  buildRegexJsonSchema(),
]

/**
 * JSON schema for the partition by comment option. Validates configuration for
 * splitting elements into partitions based on comments.
 */
export let partitionByCommentJsonSchema: JSONSchema4 = {
  oneOf: [
    ...allowedPartitionByCommentJsonSchemas,
    {
      properties: {
        block: {
          description: 'Enables specific block comments to separate the nodes.',
          oneOf: allowedPartitionByCommentJsonSchemas,
        },
        line: {
          description: 'Enables specific line comments to separate the nodes.',
          oneOf: allowedPartitionByCommentJsonSchemas,
        },
      },
      additionalProperties: false,
      minProperties: 1,
      type: 'object',
    },
  ],
  description:
    'Enables the use of comments to separate the nodes into logical groups.',
}

/**
 * JSON schema for the partition by new line option. Controls whether to create
 * separate partitions when newlines are encountered.
 */
export let partitionByNewLineJsonSchema: JSONSchema4 = {
  description:
    'Enables the use of newlines to separate the nodes into logical groups.',
  type: 'boolean',
}
