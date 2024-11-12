import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

export let typeJsonSchema: JSONSchema4 = {
  enum: ['alphabetical', 'natural', 'line-length'],
  description: 'Specifies the sorting method.',
  type: 'string',
}

export let orderJsonSchema: JSONSchema4 = {
  description:
    'Determines whether the sorted items should be in ascending or descending order.',
  enum: ['asc', 'desc'],
  type: 'string',
}

export let localesJsonSchema: JSONSchema4 = {
  oneOf: [
    {
      type: 'string',
    },
    {
      items: {
        type: 'string',
      },
      type: 'array',
    },
  ],
  description: 'Specifies the sorting locales.',
}

export let ignoreCaseJsonSchema: JSONSchema4 = {
  description: 'Controls whether sorting should be case-sensitive or not.',
  type: 'boolean',
}

export let specialCharactersJsonSchema: JSONSchema4 = {
  description:
    'Controls how special characters should be handled before sorting.',
  enum: ['remove', 'trim', 'keep'],
  type: 'string',
}

export let groupsJsonSchema: JSONSchema4 = {
  items: {
    oneOf: [
      {
        type: 'string',
      },
      {
        items: {
          type: 'string',
        },
        type: 'array',
      },
    ],
  },
  description: 'Specifies the order of the groups.',
  type: 'array',
}

export let customGroupsJsonSchema: JSONSchema4 = {
  additionalProperties: {
    oneOf: [
      {
        type: 'string',
      },
      {
        items: {
          type: 'string',
        },
        type: 'array',
      },
    ],
  },
  description: 'Specifies custom groups.',
  type: 'object',
}

export let partitionByCommentJsonSchema: JSONSchema4 = {
  anyOf: [
    {
      items: {
        type: 'string',
      },
      type: 'array',
    },
    {
      type: 'boolean',
    },
    {
      type: 'string',
    },
  ],
}

export let partitionByNewLineJsonSchema: JSONSchema4 = {
  description:
    'Allows to use newlines to separate the nodes into logical groups.',
  oneOf: [
    {
      type: 'boolean',
    },
    {
      type: 'number',
      minimum: 1,
    },
  ],
}
