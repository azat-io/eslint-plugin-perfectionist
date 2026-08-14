import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

export let tsconfigJsonSchema: JSONSchema4 = {
  properties: {
    rootDir: {
      description: 'Specifies the tsConfig root directory.',
      type: 'string',
    },
    filename: {
      description: 'Specifies the tsConfig filename.',
      type: 'string',
    },
  },
  additionalProperties: false,
  required: ['rootDir'],
  type: 'object',
}
