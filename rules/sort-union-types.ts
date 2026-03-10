import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { Options } from './sort-union-types/types'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { sortUnionOrIntersectionTypes } from './sort-union-types/sort-union-or-intersection-types'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { additionalCustomGroupMatchOptionsJsonSchema } from './sort-union-types/types'
import { buildCommonJsonSchemas } from '../utils/json-schemas/common-json-schemas'
import { createEslintRule } from '../utils/create-eslint-rule'

/**
 * Cache computed groups by modifiers and selectors for performance.
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

const ORDER_ERROR_ID = 'unexpectedUnionTypesOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedUnionTypesGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenUnionTypes'
const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenUnionTypes'

type MessageId =
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
  specialCharacters: 'keep',
  newlinesBetween: 'ignore',
  partitionByNewLine: false,
  partitionByComment: false,
  type: 'alphabetical',
  ignoreCase: true,
  locales: 'en-US',
  customGroups: [],
  alphabet: '',
  order: 'asc',
  groups: [],
}

export let jsonSchema: JSONSchema4 = {
  items: {
    properties: {
      ...buildCommonJsonSchemas(),
      ...buildCommonGroupsJsonSchemas({
        additionalCustomGroupMatchProperties:
          additionalCustomGroupMatchOptionsJsonSchema,
      }),
      partitionByComment: partitionByCommentJsonSchema,
      partitionByNewLine: partitionByNewLineJsonSchema,
    },
    additionalProperties: false,
    type: 'object',
  },
  uniqueItems: true,
  type: 'array',
}

export default createEslintRule<Options, MessageId>({
  create: context => ({
    TSUnionType: node => {
      sortUnionOrIntersectionTypes({
        availableMessageIds: {
          missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
          extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
          unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
          unexpectedOrder: ORDER_ERROR_ID,
        },
        cachedGroupsByModifiersAndSelectors,
        tokenValueToIgnoreBefore: '|',
        defaultOptions,
        context,
        node,
      })
    },
  }),
  meta: {
    messages: {
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-union-types',
      description: 'Enforce sorted union types.',
      recommended: true,
    },
    schema: jsonSchema,
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-union-types',
})
