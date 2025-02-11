import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

export let buildTypeJsonSchema = ({
  withUnsorted,
}: { withUnsorted?: boolean } = {}): JSONSchema4 => {
  let enumValues = ['alphabetical', 'natural', 'line-length', 'custom']
  if (withUnsorted) {
    enumValues.push('unsorted')
  }
  return {
    description: 'Specifies the sorting method.',
    enum: enumValues,
    type: 'string',
  }
}

let orderJsonSchema: JSONSchema4 = {
  description:
    'Determines whether the sorted items should be in ascending or descending order.',
  enum: ['asc', 'desc'],
  type: 'string',
}

let alphabetJsonSchema: JSONSchema4 = {
  description: 'Alphabet to use for the `custom` sort type.',
  type: 'string',
}

let localesJsonSchema: JSONSchema4 = {
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

let ignoreCaseJsonSchema: JSONSchema4 = {
  description: 'Controls whether sorting should be case-sensitive or not.',
  type: 'boolean',
}

let specialCharactersJsonSchema: JSONSchema4 = {
  description:
    'Controls how special characters should be handled before sorting.',
  enum: ['remove', 'trim', 'keep'],
  type: 'string',
}

let fallbackSortJsonSchema: JSONSchema4 = {
  properties: {
    type: buildTypeJsonSchema(),
    order: orderJsonSchema,
  },
  description: 'Fallback sort order.',
  type: 'object',
}

export let commonJsonSchemas: Record<string, JSONSchema4> = {
  specialCharacters: specialCharactersJsonSchema,
  fallbackSort: fallbackSortJsonSchema,
  ignoreCase: ignoreCaseJsonSchema,
  alphabet: alphabetJsonSchema,
  locales: localesJsonSchema,
  order: orderJsonSchema,
}

export let newlinesBetweenJsonSchema: JSONSchema4 = {
  description: 'Specifies how new lines should be handled between groups.',
  enum: ['ignore', 'always', 'never'],
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
      {
        properties: {
          newlinesBetween: newlinesBetweenJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
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

let singleRegexJsonSchema: JSONSchema4 = {
  oneOf: [
    {
      properties: {
        pattern: {
          type: 'string',
        },
        flags: {
          type: 'string',
        },
      },
      additionalProperties: false,
      type: 'object',
    },
    {
      type: 'string',
    },
  ],
  description: 'Regular expression.',
}

export let regexJsonSchema: JSONSchema4 = {
  oneOf: [
    {
      items: singleRegexJsonSchema,
      type: 'array',
    },
    singleRegexJsonSchema,
  ],
  description: 'Regular expression.',
}

let allowedPartitionByCommentJsonSchemas: JSONSchema4[] = [
  {
    type: 'boolean',
  },
  regexJsonSchema,
]
export let partitionByCommentJsonSchema: JSONSchema4 = {
  oneOf: [
    ...allowedPartitionByCommentJsonSchemas,
    {
      properties: {
        block: {
          oneOf: allowedPartitionByCommentJsonSchemas,
        },
        line: {
          oneOf: allowedPartitionByCommentJsonSchemas,
        },
      },
      additionalProperties: false,
      type: 'object',
    },
  ],
  description:
    'Allows to use comments to separate members into logical groups.',
}

export let partitionByNewLineJsonSchema: JSONSchema4 = {
  description:
    'Allows to use newlines to separate the nodes into logical groups.',
  type: 'boolean',
}

export let buildUseConfigurationIfJsonSchema = ({
  additionalProperties,
}: {
  additionalProperties?: Record<string, JSONSchema4>
} = {}): JSONSchema4 => ({
  properties: {
    allNamesMatchPattern: regexJsonSchema,
    ...additionalProperties,
  },
  additionalProperties: false,
  type: 'object',
})

let customGroupSortJsonSchema: Record<string, JSONSchema4> = {
  type: {
    enum: ['alphabetical', 'line-length', 'natural', 'unsorted'],
    description: 'Custom group sort type.',
    type: 'string',
  },
  order: {
    description: 'Custom group sort order.',
    enum: ['desc', 'asc'],
    type: 'string',
  },
}

let customGroupNameJsonSchema: Record<string, JSONSchema4> = {
  groupName: {
    description: 'Custom group name.',
    type: 'string',
  },
}

let customGroupNewlinesInsideJsonSchema: Record<string, JSONSchema4> = {
  newlinesInside: {
    description:
      'Specifies how new lines should be handled between members of the custom group.',
    enum: ['always', 'never'],
    type: 'string',
  },
}

export let buildCustomGroupsArrayJsonSchema = ({
  singleCustomGroupJsonSchema,
}: {
  singleCustomGroupJsonSchema?: Record<string, JSONSchema4>
}): JSONSchema4 => ({
  items: {
    oneOf: [
      {
        properties: {
          ...customGroupNameJsonSchema,
          ...customGroupSortJsonSchema,
          ...customGroupNewlinesInsideJsonSchema,
          anyOf: {
            items: {
              properties: {
                ...singleCustomGroupJsonSchema,
              },
              description: 'Custom group.',
              additionalProperties: false,
              type: 'object',
            },
            type: 'array',
          },
        },
        description: 'Custom group block.',
        additionalProperties: false,
        type: 'object',
      },
      {
        properties: {
          ...customGroupNameJsonSchema,
          ...customGroupSortJsonSchema,
          ...customGroupNewlinesInsideJsonSchema,
          ...singleCustomGroupJsonSchema,
        },
        description: 'Custom group.',
        additionalProperties: false,
        type: 'object',
      },
    ],
  },
  description: 'Specifies custom groups.',
  type: 'array',
})

export let buildCustomGroupModifiersJsonSchema = (
  modifiers: string[],
): JSONSchema4 => ({
  items: {
    enum: modifiers,
    type: 'string',
  },
  description: 'Modifier filters.',
  type: 'array',
})

export let buildCustomGroupSelectorJsonSchema = (
  selectors: string[],
): JSONSchema4 => ({
  description: 'Selector filter.',
  enum: selectors,
  type: 'string',
})
