import type {
  JSONSchema4ObjectSchema,
  JSONSchema4,
} from '@typescript-eslint/utils/json-schema'

/**
 * Checks whether a value matches a JSON schema.
 *
 * ESLint validates rule options against the rule JSON schema, but it does not
 * validate plugin settings and does not expose its validator. This function
 * lets settings be validated against the same schemas without a validation
 * library.
 *
 * Only the keywords used by the plugin schemas are supported: `type` (`array`,
 * `boolean`, `number`, `object` and `string`), `enum` for strings, `oneOf`,
 * `items`, `properties`, `required`, `additionalProperties: false`,
 * `minProperties` and `minimum`. Other keywords are ignored. As in ESLint,
 * `required` and `properties` treat a property set to `undefined` as missing.
 *
 * @example
 *
 * ```ts
 * matchesJsonSchema('asc', { enum: ['asc', 'desc'], type: 'string' })
 * // Returns: true
 *
 * matchesJsonSchema('ascending', { enum: ['asc', 'desc'], type: 'string' })
 * // Returns: false
 * ```
 *
 * @param value - The value to check.
 * @param schema - The JSON schema to check the value against.
 * @returns True if the value matches the schema, false otherwise.
 */
export function matchesJsonSchema(
  value: unknown,
  schema: JSONSchema4,
): boolean {
  if (
    schema.oneOf &&
    schema.oneOf.filter(oneOfSchema => matchesJsonSchema(value, oneOfSchema))
      .length !== 1
  ) {
    return false
  }

  switch (schema.type) {
    case 'boolean':
      return typeof value === 'boolean'
    case 'string':
      return (
        typeof value === 'string' &&
        (!schema.enum || schema.enum.includes(value))
      )
    case 'number':
      return (
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= (schema.minimum ?? -Infinity)
      )
    case 'object':
      return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        matchesObjectJsonSchema(value as Record<string, unknown>, schema)
      )
    case 'array':
      return (
        Array.isArray(value) &&
        value.every(
          item =>
            !schema.items ||
            matchesJsonSchema(item, schema.items as JSONSchema4),
        )
      )
    default:
      return true
  }
}

/**
 * Checks the properties of an object against an object JSON schema.
 *
 * @param value - The object to check.
 * @param schema - The object JSON schema to check the object against.
 * @returns True if the object properties match the schema, false otherwise.
 */
function matchesObjectJsonSchema(
  value: Record<string, unknown>,
  schema: JSONSchema4ObjectSchema,
): boolean {
  let {
    additionalProperties,
    minProperties = 0,
    properties = {},
    required,
  } = schema
  let keys = Object.keys(value)

  if (keys.length < minProperties) {
    return false
  }

  if (
    Array.isArray(required) &&
    required.some(key => value[key] === undefined)
  ) {
    return false
  }

  return keys.every(key => {
    if (!Object.hasOwn(properties, key)) {
      return additionalProperties !== false
    }
    return (
      value[key] === undefined ||
      matchesJsonSchema(value[key], properties[key]!)
    )
  })
}
