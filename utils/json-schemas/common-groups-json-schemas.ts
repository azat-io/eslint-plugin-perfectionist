import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import {
  buildFallbackSortJsonSchema,
  orderJsonSchema,
  regexJsonSchema,
  typeJsonSchema,
} from './common-json-schemas'

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

let newlinesInsideJsonSchema: JSONSchema4 = {
  type: 'number',
  minimum: 0,
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
          newlinesInside: newlinesInsideJsonSchema,
          order: orderJsonSchema,
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
  additionalFallbackSortProperties: Record<string, JSONSchema4> | undefined
  singleCustomGroupJsonSchema: Record<string, JSONSchema4> | undefined
}): JSONSchema4 {
  let commonCustomGroupJsonSchemas = buildCommonCustomGroupJsonSchemas({
    additionalFallbackSortProperties,
  })
  let populatedSingleCustomGroupJsonSchema =
    buildPopulatedSingleCustomGroupJsonSchema(singleCustomGroupJsonSchema)

  return {
    items: {
      oneOf: [
        {
          properties: {
            ...commonCustomGroupJsonSchemas,
            anyOf: {
              items: {
                properties: populatedSingleCustomGroupJsonSchema,
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
            ...commonCustomGroupJsonSchemas,
            ...populatedSingleCustomGroupJsonSchema,
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

export function buildCommonGroupsJsonSchemas({
  additionalFallbackSortProperties,
  singleCustomGroupJsonSchema,
}: {
  additionalFallbackSortProperties?: Record<string, JSONSchema4>
  singleCustomGroupJsonSchema?: Record<string, JSONSchema4>
} = {}): Record<string, JSONSchema4> {
  return {
    customGroups: buildCustomGroupsArrayJsonSchema({
      additionalFallbackSortProperties,
      singleCustomGroupJsonSchema,
    }),
    newlinesBetween: newlinesBetweenJsonSchema,
    groups: groupsJsonSchema,
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
  additionalFallbackSortProperties: Record<string, JSONSchema4> | undefined
}): Record<string, JSONSchema4> {
  return {
    fallbackSort: buildFallbackSortJsonSchema({
      additionalProperties: additionalFallbackSortProperties,
    }),
    groupName: {
      description: 'Custom group name.',
      type: 'string',
    },
    newlinesInside: newlinesInsideJsonSchema,
    order: orderJsonSchema,
    type: typeJsonSchema,
  }
}

function buildPopulatedSingleCustomGroupJsonSchema(
  singleCustomGroupJsonSchema: Record<string, JSONSchema4> | undefined,
): Record<string, JSONSchema4> {
  return {
    elementNamePattern: regexJsonSchema,
    ...singleCustomGroupJsonSchema,
  }
}
