import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import { describe, expect, it } from 'vitest'
import Ajv from 'ajv-draft-04'

import {
  partitionByCommentJsonSchema,
  partitionByNewlineJsonSchema,
} from '../../utils/json-schemas/common-partition-json-schemas'
import { buildCommonGroupsJsonSchemas } from '../../utils/json-schemas/common-groups-json-schemas'
import { buildCommonJsonSchemas } from '../../utils/json-schemas/common-json-schemas'
import { tsconfigJsonSchema } from '../../utils/json-schemas/tsconfig-json-schema'
import { matchesJsonSchema } from '../../utils/matches-json-schema'

let objectSchema: JSONSchema4 = {
  properties: {
    order: { type: 'string' },
    type: { type: 'string' },
  },
  additionalProperties: false,
  required: ['type'],
  type: 'object',
}

let cases: {
  description: string
  schema: JSONSchema4
  expected: boolean
  value: unknown
}[] = [
  {
    schema: { enum: ['asc', 'desc'], type: 'string' },
    description: 'a string from the enum',
    expected: true,
    value: 'asc',
  },
  {
    schema: { enum: ['asc', 'desc'], type: 'string' },
    description: 'a string outside the enum',
    value: 'ascending',
    expected: false,
  },
  {
    description: 'a non-string',
    schema: { type: 'string' },
    expected: false,
    value: 1,
  },
  {
    schema: { type: 'number', minimum: 0 },
    description: 'a number at the minimum',
    expected: true,
    value: 0,
  },
  {
    description: 'a number below the minimum',
    schema: { type: 'number', minimum: 0 },
    expected: false,
    value: -1,
  },
  {
    description: 'a number without a minimum',
    schema: { type: 'number' },
    expected: true,
    value: -1,
  },
  {
    schema: { type: 'number' },
    description: 'NaN',
    value: Number.NaN,
    expected: false,
  },
  {
    schema: { type: 'boolean' },
    description: 'a boolean',
    expected: true,
    value: false,
  },
  {
    description: 'a boolean string',
    schema: { type: 'boolean' },
    expected: false,
    value: 'false',
  },
  {
    schema: { items: { type: 'string' }, type: 'array' },
    description: 'an array of matching items',
    value: ['a', 'b'],
    expected: true,
  },
  {
    schema: { items: { type: 'string' }, type: 'array' },
    description: 'an array with a mismatching item',
    expected: false,
    value: ['a', 1],
  },
  {
    description: 'an array without an items schema',
    schema: { type: 'array' },
    value: [1, 'a'],
    expected: true,
  },
  {
    description: 'a non-array',
    schema: { type: 'array' },
    expected: false,
    value: 'a',
  },
  {
    description: 'an object with the required property',
    value: { order: 'b', type: 'a' },
    schema: objectSchema,
    expected: true,
  },
  {
    description: 'an object without a required property',
    value: { order: 'b' },
    schema: objectSchema,
    expected: false,
  },
  {
    description: 'an object with a required property set to undefined',
    value: { type: undefined },
    schema: objectSchema,
    expected: false,
  },
  {
    description: 'an object with an optional property set to undefined',
    value: { order: undefined, type: 'a' },
    schema: objectSchema,
    expected: true,
  },
  {
    description: 'an object with a mismatching property',
    schema: objectSchema,
    value: { type: 1 },
    expected: false,
  },
  {
    description: 'an object with an additional property',
    value: { extra: true, type: 'a' },
    schema: objectSchema,
    expected: false,
  },
  {
    description: 'an object with an additional property named constructor',
    value: { constructor: 1, type: 'a' },
    schema: objectSchema,
    expected: false,
  },
  {
    description: 'an object with an additional property when it is allowed',
    schema: { type: 'object' },
    value: { extra: true },
    expected: true,
  },
  {
    description: 'an object with too few properties',
    schema: { minProperties: 1, type: 'object' },
    expected: false,
    value: {},
  },
  {
    description: 'an object with enough properties',
    schema: { minProperties: 1, type: 'object' },
    value: { line: true },
    expected: true,
  },
  {
    description: 'null against an object schema',
    schema: { type: 'object' },
    expected: false,
    value: null,
  },
  {
    description: 'an array against an object schema',
    schema: { type: 'object' },
    expected: false,
    value: [],
  },
  {
    description: 'a string against an object schema',
    schema: { type: 'object' },
    expected: false,
    value: 'a',
  },
  {
    schema: { oneOf: [{ type: 'string' }, { type: 'boolean' }] },
    description: 'a value matching exactly one oneOf schema',
    expected: true,
    value: 'a',
  },
  {
    schema: { oneOf: [{ type: 'string' }, { type: 'boolean' }] },
    description: 'a value matching no oneOf schema',
    expected: false,
    value: 1,
  },
  {
    schema: {
      oneOf: [{ type: 'string' }, { type: 'string', enum: ['a'] }],
    },
    description: 'a value matching several oneOf schemas',
    expected: false,
    value: 'a',
  },
]

let { newlinesBetween, newlinesInside } = buildCommonGroupsJsonSchemas()

let settingsJsonSchemas: Record<string, JSONSchema4> = {
  ...buildCommonJsonSchemas(),
  partitionByComment: partitionByCommentJsonSchema,
  partitionByNewLine: partitionByNewlineJsonSchema,
  tsconfig: tsconfigJsonSchema,
  newlinesBetween,
  newlinesInside,
}

let settingsValues: [string, unknown][] = [
  ['type', 'natural'],
  ['type', 'subgroup-order'],
  ['type', 'Natural'],
  ['type', 1],
  ['order', 'asc'],
  ['order', 'ascending'],
  ['fallbackSort', { type: 'natural' }],
  ['fallbackSort', { type: 'natural', order: 'desc' }],
  ['fallbackSort', { type: 'natural', extra: true }],
  ['fallbackSort', { order: 'asc' }],
  ['fallbackSort', 'alphabetical'],
  ['alphabet', 'abc'],
  ['alphabet', 1],
  ['ignoreCase', false],
  ['ignoreCase', 'false'],
  ['specialCharacters', 'trim'],
  ['specialCharacters', 'bogus'],
  ['locales', 'en-US'],
  ['locales', ['en-US', 'zh-CN']],
  ['locales', []],
  ['locales', ['en-US', 1]],
  ['locales', 1],
  ['partitionByComment', true],
  ['partitionByComment', '^Part'],
  ['partitionByComment', ['^A', { pattern: '^b', flags: 'i' }]],
  ['partitionByComment', { line: ['^x'], block: true }],
  ['partitionByComment', { block: true, extra: 1 }],
  ['partitionByComment', { pattern: 1 }],
  ['partitionByComment', {}],
  ['partitionByComment', 1],
  ['partitionByNewLine', true],
  ['partitionByNewLine', 'true'],
  ['newlinesBetween', 'ignore'],
  ['newlinesBetween', 0],
  ['newlinesBetween', 1.5],
  ['newlinesBetween', -1],
  ['newlinesBetween', 'always'],
  ['newlinesInside', 'ignore'],
  ['newlinesInside', 'newlinesBetween'],
  ['newlinesInside', 2],
  ['newlinesInside', -1],
  ['newlinesInside', 'never'],
  ['tsconfig', { rootDir: '.' }],
  ['tsconfig', { filename: 'tsconfig.json', rootDir: '.' }],
  ['tsconfig', { filename: 'tsconfig.json' }],
  ['tsconfig', { rootDir: '.', extra: 1 }],
  ['tsconfig', { constructor: 1, rootDir: '.' }],
  ['tsconfig', { rootDir: 1 }],
  ['tsconfig', null],
  ['tsconfig', '.'],
]

let ajv = new Ajv()

describe('matches-json-schema', () => {
  it.each(cases)(
    'returns $expected for $description',
    ({ expected, schema, value }) => {
      expect(matchesJsonSchema(value, schema)).toBe(expected)
    },
  )

  it.each(settingsValues)(
    'agrees with Ajv on the %s schema for %j',
    (setting, value) => {
      let schema = settingsJsonSchemas[setting]!

      expect(matchesJsonSchema(value, schema)).toBe(ajv.validate(schema, value))
    },
  )
})
