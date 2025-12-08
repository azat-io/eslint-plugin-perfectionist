import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

/**
 * JSON schema for the sort order option. Validates ascending or descending sort
 * direction.
 */
export let orderJsonSchema: JSONSchema4 = {
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
  allowedAdditionalTypeValues,
}: {
  additionalFallbackSortProperties?: Record<string, JSONSchema4>
  allowedAdditionalTypeValues?: string[]
} = {}): Record<string, JSONSchema4> {
  return {
    fallbackSort: buildFallbackSortJsonSchema({
      additionalProperties: additionalFallbackSortProperties,
      allowedAdditionalTypeValues,
    }),
    type: buildTypeJsonSchema({
      allowedAdditionalValues: allowedAdditionalTypeValues,
    }),
    specialCharacters: specialCharactersJsonSchema,
    ignoreCase: ignoreCaseJsonSchema,
    alphabet: alphabetJsonSchema,
    locales: localesJsonSchema,
    order: orderJsonSchema,
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
export function buildFallbackSortJsonSchema({
  allowedAdditionalTypeValues,
  additionalProperties,
}: {
  additionalProperties: Record<string, JSONSchema4> | undefined
  allowedAdditionalTypeValues: undefined | string[]
}): JSONSchema4 {
  return {
    properties: {
      type: buildTypeJsonSchema({
        allowedAdditionalValues: allowedAdditionalTypeValues,
      }),
      order: orderJsonSchema,
      ...additionalProperties,
    },
    description: 'Fallback sort order.',
    additionalProperties: false,
    required: ['type'],
    type: 'object',
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
      allNamesMatchPattern: buildRegexJsonSchema(),
      ...additionalProperties,
    },
    additionalProperties: false,
    type: 'object',
  }
}

export function buildTypeJsonSchema({
  allowedAdditionalValues,
}: {
  allowedAdditionalValues: undefined | string[]
}): JSONSchema4 {
  return {
    enum: [
      'alphabetical',
      'natural',
      'line-length',
      'custom',
      'unsorted',
      ...(allowedAdditionalValues ?? []),
    ],
    description: 'Specifies the sorting method.',
    type: 'string',
  }
}

export function buildRegexJsonSchema(): JSONSchema4 {
  return {
    oneOf: [
      {
        items: buildSingleRegexJsonSchema(),
        type: 'array',
      },
      buildSingleRegexJsonSchema(),
    ],
    description: 'Regular expression.',
  }
}

function buildSingleRegexJsonSchema(): JSONSchema4 {
  return {
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
        type: 'object',
      },
      {
        type: 'string',
      },
    ],
    description: 'Regular expression.',
  }
}
