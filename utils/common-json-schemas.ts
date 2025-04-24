import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

let typeJsonSchema: JSONSchema4 = {
  enum: ['alphabetical', 'natural', 'line-length', 'custom', 'unsorted'],
  description: 'Specifies the sorting method.',
  type: 'string',
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

let buildFallbackSortJsonSchema = ({
  additionalProperties,
}: {
  additionalProperties?: Record<string, JSONSchema4>
} = {}): JSONSchema4 => ({
  properties: {
    order: orderJsonSchema,
    type: typeJsonSchema,
    ...additionalProperties,
  },
  description: 'Fallback sort order.',
  additionalProperties: false,
  type: 'object',
})

export let buildCommonJsonSchemas = ({
  additionalFallbackSortProperties,
}: {
  additionalFallbackSortProperties?: Record<string, JSONSchema4>
} = {}): Record<string, JSONSchema4> => ({
  fallbackSort: buildFallbackSortJsonSchema({
    additionalProperties: additionalFallbackSortProperties,
  }),
  specialCharacters: specialCharactersJsonSchema,
  ignoreCase: ignoreCaseJsonSchema,
  alphabet: alphabetJsonSchema,
  locales: localesJsonSchema,
  order: orderJsonSchema,
  type: typeJsonSchema,
})

export let commonJsonSchemas: Record<string, JSONSchema4> =
  buildCommonJsonSchemas()

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

export let deprecatedCustomGroupsJsonSchema: JSONSchema4 = {
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
      // https://github.com/azat-io/eslint-plugin-perfectionist/pull/490#issuecomment-2720969705
      // Uncomment the code below in the next major version (v5)
      // To uncomment: required: ['pattern'],
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

let buildCommonCustomGroupJsonSchemas = ({
  additionalFallbackSortProperties,
}: {
  additionalFallbackSortProperties?: Record<string, JSONSchema4>
} = {}): Record<string, JSONSchema4> => ({
  newlinesInside: {
    description:
      'Specifies how new lines should be handled between members of the custom group.',
    enum: ['always', 'never'],
    type: 'string',
  },
  fallbackSort: buildFallbackSortJsonSchema({
    additionalProperties: additionalFallbackSortProperties,
  }),
  groupName: {
    description: 'Custom group name.',
    type: 'string',
  },
  order: orderJsonSchema,
  type: typeJsonSchema,
})

export let buildCustomGroupsArrayJsonSchema = ({
  additionalFallbackSortProperties,
  singleCustomGroupJsonSchema,
}: {
  additionalFallbackSortProperties?: Record<string, JSONSchema4>
  singleCustomGroupJsonSchema?: Record<string, JSONSchema4>
}): JSONSchema4 => ({
  items: {
    oneOf: [
      {
        properties: {
          ...buildCommonCustomGroupJsonSchemas({
            additionalFallbackSortProperties,
          }),
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
          ...buildCommonCustomGroupJsonSchemas({
            additionalFallbackSortProperties,
          }),
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
