import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

/**
 * JSON schema for the sorting type option. Defines available sorting algorithms
 * for rules.
 */
let typeJsonSchema: JSONSchema4 = {
  enum: ['alphabetical', 'natural', 'line-length', 'custom', 'unsorted'],
  description: 'Specifies the sorting method.',
  type: 'string',
}

/**
 * JSON schema for the sort order option. Validates ascending or descending sort
 * direction.
 */
let orderJsonSchema: JSONSchema4 = {
  description:
    'Specifies whether to sort items in ascending or descending order.',
  enum: ['asc', 'desc'],
  type: 'string',
}

/**
 * JSON schema for the custom alphabet option. Used with 'custom' sort type to
 * define character ordering.
 */
let alphabetJsonSchema: JSONSchema4 = {
  description:
    "Used only when the `type` option is set to `'custom'`. Specifies the custom alphabet for sorting.",
  type: 'string',
}

/**
 * JSON schema for the locales option. Validates locale settings for
 * locale-aware string comparison.
 */
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

/**
 * JSON schema for the ignoreCase option. Controls case sensitivity in string
 * comparisons.
 */
let ignoreCaseJsonSchema: JSONSchema4 = {
  description: 'Controls whether sorting should be case-sensitive or not.',
  type: 'boolean',
}

/**
 * JSON schema for the special characters handling option. Defines how special
 * characters are treated during sorting.
 */
let specialCharactersJsonSchema: JSONSchema4 = {
  description:
    'Specifies whether to trim, remove, or keep special characters before sorting.',
  enum: ['remove', 'trim', 'keep'],
  type: 'string',
}

/**
 * Builds a collection of common JSON schemas used across sorting rules.
 *
 * Creates schemas for standard sorting options that are shared by multiple
 * rules. This ensures consistent validation across the plugin.
 *
 * @param options - Configuration options.
 * @param options.additionalFallbackSortProperties - Extra properties to add to
 *   fallback sort schema.
 * @returns Object containing common JSON schemas for rule validation.
 */
export function buildCommonJsonSchemas({
  additionalFallbackSortProperties,
}: {
  additionalFallbackSortProperties?: Record<string, JSONSchema4>
} = {}): Record<string, JSONSchema4> {
  return {
    fallbackSort: buildFallbackSortJsonSchema({
      additionalProperties: additionalFallbackSortProperties,
    }),
    specialCharacters: specialCharactersJsonSchema,
    ignoreCase: ignoreCaseJsonSchema,
    alphabet: alphabetJsonSchema,
    locales: localesJsonSchema,
    order: orderJsonSchema,
    type: typeJsonSchema,
  }
}

/**
 * Builds JSON schema for fallback sort configuration.
 *
 * Creates a schema for the fallback sorting option that is applied when the
 * primary sort results in equality. Allows customization through additional
 * properties.
 *
 * @param options - Configuration options.
 * @param options.additionalProperties - Extra properties to include in the
 *   schema.
 * @returns JSON schema for fallback sort validation.
 */
function buildFallbackSortJsonSchema({
  additionalProperties,
}: {
  additionalProperties?: Record<string, JSONSchema4>
} = {}): JSONSchema4 {
  return {
    properties: {
      order: orderJsonSchema,
      type: typeJsonSchema,
      ...additionalProperties,
    },
    description: 'Fallback sort order.',
    additionalProperties: false,
    required: ['type'],
    type: 'object',
  }
}

/**
 * Pre-built collection of common JSON schemas for sorting rules.
 *
 * Contains schemas for type, order, ignoreCase, specialCharacters, locales,
 * alphabet, and fallbackSort options. Used as the default set of schemas for
 * rule configuration validation.
 */
export let commonJsonSchemas: Record<string, JSONSchema4> =
  buildCommonJsonSchemas()

/**
 * JSON schema for the newlines between option. Validates configuration for
 * adding newlines between different groups.
 */
export let newlinesBetweenJsonSchema: JSONSchema4 = {
  oneOf: [
    {
      description: 'Specifies how to handle newlines between groups.',
      enum: ['ignore'],
      type: 'string',
    },
    {
      type: 'number',
      minimum: 0,
    },
  ],
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
        minItems: 1,
      },
      {
        properties: {
          newlinesBetween: newlinesBetweenJsonSchema,
        },
        required: ['newlinesBetween'],
        additionalProperties: false,
        type: 'object',
      },
      {
        properties: {
          group: {
            oneOf: [
              {
                type: 'string',
              },
              {
                items: {
                  type: 'string',
                },
                type: 'array',
                minItems: 1,
              },
            ],
          },
          commentAbove: {
            description: 'Specifies a comment to enforce above the group.',
            type: 'string',
          },
          type: typeJsonSchema,
        },
        additionalProperties: false,
        required: ['group'],
        minProperties: 2,
        type: 'object',
      },
    ],
  },
  description: 'Specifies a list of groups for sorting.',
  type: 'array',
}

let singleRegexJsonSchema: JSONSchema4 = {
  oneOf: [
    {
      properties: {
        pattern: {
          description: 'Regular expression pattern.',
          type: 'string',
        },
        flags: {
          description: 'Regular expression flags.',
          type: 'string',
        },
      },
      additionalProperties: false,
      required: ['pattern'],
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

/**
 * Builds JSON schema for custom groups array configuration.
 *
 * Creates a schema that validates an array of custom group definitions.
 * Supports both single custom groups and "anyOf" groups containing multiple
 * subgroups. Each group must have a groupName and can include various matching
 * criteria.
 *
 * @example
 *   // Valid configuration:
 *   ;[
 *     {
 *       groupName: 'react',
 *       anyOf: [{ elementNamePattern: 'use*' }, { selector: 'hook' }],
 *     },
 *     {
 *       groupName: 'utils',
 *       elementNamePattern: '*Utils',
 *     },
 *   ]
 *
 * @param options - Configuration options.
 * @param options.additionalFallbackSortProperties - Extra properties for
 *   fallback sort.
 * @param options.singleCustomGroupJsonSchema - Schema for individual custom
 *   group properties.
 * @returns JSON schema for custom groups array validation.
 */
export function buildCustomGroupsArrayJsonSchema({
  additionalFallbackSortProperties,
  singleCustomGroupJsonSchema,
}: {
  additionalFallbackSortProperties?: Record<string, JSONSchema4>
  singleCustomGroupJsonSchema?: Record<string, JSONSchema4>
}): JSONSchema4 {
  return {
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
          required: ['groupName'],
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
          required: ['groupName'],
          type: 'object',
        },
      ],
    },
    description: 'Defines custom groups to match specific members.',
    type: 'array',
  }
}

/**
 * Builds JSON schema for conditional configuration blocks.
 *
 * Creates a schema for configuration that is applied only when certain
 * conditions are met. Used for context-specific sorting rules where different
 * configurations apply based on element patterns.
 *
 * @param options - Configuration options for the conditional block.
 * @param options.additionalProperties - Extra properties to include in the
 *   schema.
 * @returns JSON schema for conditional configuration validation.
 */
export function buildUseConfigurationIfJsonSchema({
  additionalProperties,
}: {
  additionalProperties?: Record<string, JSONSchema4>
} = {}): JSONSchema4 {
  return {
    description:
      'Specifies filters to match a particular options configuration for a given element to sort.',
    properties: {
      allNamesMatchPattern: regexJsonSchema,
      ...additionalProperties,
    },
    additionalProperties: false,
    type: 'object',
  }
}

/**
 * Builds JSON schema for custom group modifiers configuration.
 *
 * Creates a schema that validates an array of modifiers that must be present on
 * an element for it to match a custom group.
 *
 * @example
 *   // For TypeScript class members:
 *   buildCustomGroupModifiersJsonSchema([
 *     'static',
 *     'private',
 *     'readonly',
 *     'async',
 *   ])
 *
 * @param modifiers - Array of valid modifier names.
 * @returns JSON schema for modifiers array validation.
 */
export function buildCustomGroupModifiersJsonSchema(
  modifiers: string[],
): JSONSchema4 {
  return {
    items: {
      enum: modifiers,
      type: 'string',
    },
    description: 'Modifier filters.',
    type: 'array',
  }
}

/**
 * Builds JSON schema for custom group selector configuration.
 *
 * Creates a schema that validates a selector string used to match specific
 * types of elements in a custom group.
 *
 * @example
 *   // For class members:
 *   buildCustomGroupSelectorJsonSchema([
 *     'property',
 *     'method',
 *     'constructor',
 *     'accessor',
 *   ])
 *
 * @param selectors - Array of valid selector names.
 * @returns JSON schema for selector validation.
 */
export function buildCustomGroupSelectorJsonSchema(
  selectors: string[],
): JSONSchema4 {
  return {
    description: 'Selector filter.',
    enum: selectors,
    type: 'string',
  }
}

function buildCommonCustomGroupJsonSchemas({
  additionalFallbackSortProperties,
}: {
  additionalFallbackSortProperties?: Record<string, JSONSchema4>
} = {}): Record<string, JSONSchema4> {
  return {
    fallbackSort: buildFallbackSortJsonSchema({
      additionalProperties: additionalFallbackSortProperties,
    }),
    groupName: {
      description: 'Custom group name.',
      type: 'string',
    },
    newlinesInside: {
      type: 'number',
      minimum: 0,
    },
    order: orderJsonSchema,
    type: typeJsonSchema,
  }
}
