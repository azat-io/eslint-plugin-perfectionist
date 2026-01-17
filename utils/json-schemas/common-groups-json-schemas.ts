import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import {
  buildFallbackSortJsonSchema,
  buildRegexJsonSchema,
  buildTypeJsonSchema,
  orderJsonSchema,
} from './common-json-schemas'

/**
 * JSON schema for the newlines-like options
 * (newlinesBetween/newlinesInside/newlinesAfter).
 */
export let newlinesJsonSchema: JSONSchema4 = {
  oneOf: [
    {
      description: 'Specifies how to handle newlines.',
      enum: ['ignore'],
      type: 'string',
    },
    {
      type: 'number',
      minimum: 0,
    },
  ],
}

export function buildGroupsJsonSchema({
  allowedAdditionalTypeValues,
  additionalSortProperties,
}: {
  additionalSortProperties: Record<string, JSONSchema4> | undefined
  allowedAdditionalTypeValues: undefined | string[]
}): JSONSchema4 {
  return {
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
            newlinesBetween: newlinesJsonSchema,
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
            fallbackSort: buildFallbackSortJsonSchema({
              additionalProperties: additionalSortProperties,
              allowedAdditionalTypeValues,
            }),
            commentAbove: {
              description: 'Specifies a comment to enforce above the group.',
              type: 'string',
            },
            type: buildTypeJsonSchema({
              allowedAdditionalValues: allowedAdditionalTypeValues,
            }),
            newlinesInside: newlinesJsonSchema,
            order: orderJsonSchema,
            ...additionalSortProperties,
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
 * @param options.additionalSortProperties - Extra properties for sorting.
 * @param options.additionalCustomGroupMatchProperties - Extra properties for
 *   matching custom groups.
 * @returns JSON schema for custom groups array validation.
 */
export function buildCustomGroupsArrayJsonSchema({
  additionalCustomGroupMatchProperties,
  allowedAdditionalTypeValues,
  additionalSortProperties,
}: {
  additionalCustomGroupMatchProperties: Record<string, JSONSchema4> | undefined
  additionalSortProperties: Record<string, JSONSchema4> | undefined
  allowedAdditionalTypeValues: undefined | string[]
}): JSONSchema4 {
  let commonCustomGroupJsonSchemas = buildCommonCustomGroupJsonSchemas({
    allowedAdditionalTypeValues,
    additionalSortProperties,
  })
  let populatedCustomGroupMatchOptionsJsonSchema =
    buildPopulatedCustomGroupMatchPropertiesJsonSchema(
      additionalCustomGroupMatchProperties,
    )

  return {
    items: {
      oneOf: [
        {
          properties: {
            ...commonCustomGroupJsonSchemas,
            anyOf: {
              items: {
                properties: populatedCustomGroupMatchOptionsJsonSchema,
                description: 'Custom group.',
                additionalProperties: false,
                type: 'object',
              },
              type: 'array',
              minItems: 1,
            },
          },
          description: 'Custom group block.',
          required: ['groupName', 'anyOf'],
          additionalProperties: false,
          type: 'object',
        },
        {
          properties: {
            ...commonCustomGroupJsonSchemas,
            ...populatedCustomGroupMatchOptionsJsonSchema,
          },
          description: 'Custom group.',
          additionalProperties: false,
          required: ['groupName'],
          minProperties: 2,
          type: 'object',
        },
      ],
    },
    description: 'Defines custom groups to match specific members.',
    type: 'array',
  }
}

export function buildCommonGroupsJsonSchemas({
  additionalCustomGroupMatchProperties,
  allowedAdditionalTypeValues,
  additionalSortProperties,
}: {
  additionalCustomGroupMatchProperties?: Record<string, JSONSchema4>
  additionalSortProperties?: Record<string, JSONSchema4>
  allowedAdditionalTypeValues?: string[]
} = {}): Record<string, JSONSchema4> {
  return {
    customGroups: buildCustomGroupsArrayJsonSchema({
      additionalCustomGroupMatchProperties,
      allowedAdditionalTypeValues,
      additionalSortProperties,
    }),
    newlinesInside: {
      oneOf: [
        newlinesJsonSchema,
        { enum: ['newlinesBetween'], type: 'string' },
      ],
    },
    groups: buildGroupsJsonSchema({
      allowedAdditionalTypeValues,
      additionalSortProperties,
    }),
    newlinesBetween: newlinesJsonSchema,
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
  modifiers: readonly string[],
): JSONSchema4 {
  return {
    items: {
      enum: [...modifiers],
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
  selectors: readonly string[],
): JSONSchema4 {
  return {
    description: 'Selector filter.',
    enum: [...selectors],
    type: 'string',
  }
}

function buildCommonCustomGroupJsonSchemas({
  allowedAdditionalTypeValues,
  additionalSortProperties,
}: {
  additionalSortProperties: Record<string, JSONSchema4> | undefined
  allowedAdditionalTypeValues: undefined | string[]
}): Record<string, JSONSchema4> {
  return {
    fallbackSort: buildFallbackSortJsonSchema({
      additionalProperties: additionalSortProperties,
      allowedAdditionalTypeValues,
    }),
    type: buildTypeJsonSchema({
      allowedAdditionalValues: allowedAdditionalTypeValues,
    }),
    groupName: {
      description: 'Custom group name.',
      type: 'string',
    },
    newlinesInside: newlinesJsonSchema,
    order: orderJsonSchema,
    ...additionalSortProperties,
  }
}

function buildPopulatedCustomGroupMatchPropertiesJsonSchema(
  customGroupMatchOptionsJsonSchema: Record<string, JSONSchema4> | undefined,
): Record<string, JSONSchema4> {
  return {
    elementNamePattern: buildRegexJsonSchema(),
    ...customGroupMatchOptionsJsonSchema,
  }
}
