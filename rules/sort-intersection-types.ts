import type { Options as SortUnionTypesOptions } from './sort-union-types'

import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { sortUnionOrIntersectionTypes, jsonSchema } from './sort-union-types'
import { createEslintRule } from '../utils/create-eslint-rule'

type MESSAGE_ID =
  | 'missedSpacingBetweenIntersectionTypes'
  | 'unexpectedIntersectionTypesGroupOrder'
  | 'extraSpacingBetweenIntersectionTypes'
  | 'unexpectedIntersectionTypesOrder'

type Options = SortUnionTypesOptions

let defaultOptions: Required<Options[0]> = {
  fallbackSort: { type: 'unsorted' },
  specialCharacters: 'keep',
  newlinesBetween: 'ignore',
  partitionByComment: false,
  partitionByNewLine: false,
  type: 'alphabetical',
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MESSAGE_ID>({
  meta: {
    messages: {
      missedSpacingBetweenIntersectionTypes: MISSED_SPACING_ERROR,
      extraSpacingBetweenIntersectionTypes: EXTRA_SPACING_ERROR,
      unexpectedIntersectionTypesGroupOrder: GROUP_ORDER_ERROR,
      unexpectedIntersectionTypesOrder: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-intersection-types',
      description: 'Enforce sorted intersection types.',
      recommended: true,
    },
    schema: [jsonSchema],
    type: 'suggestion',
    fixable: 'code',
  },
  create: context => ({
    TSIntersectionType: node => {
      sortUnionOrIntersectionTypes({
        availableMessageIds: {
          missedSpacingBetweenMembers: 'missedSpacingBetweenIntersectionTypes',
          extraSpacingBetweenMembers: 'extraSpacingBetweenIntersectionTypes',
          unexpectedGroupOrder: 'unexpectedIntersectionTypesGroupOrder',
          unexpectedOrder: 'unexpectedIntersectionTypesOrder',
        },
        tokenValueToIgnoreBefore: '&',
        context,
        node,
      })
    },
  }),
  defaultOptions: [defaultOptions],
  name: 'sort-intersection-types',
})
