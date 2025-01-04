import type { Options as SortUnionTypesOptions } from './sort-union-types'

import { sortUnionOrIntersectionTypes } from './sort-union-types'
import { createEslintRule } from '../utils/create-eslint-rule'
import { jsonSchema } from './sort-union-types'

type MESSAGE_ID =
  | 'missedSpacingBetweenIntersectionTypes'
  | 'unexpectedIntersectionTypesGroupOrder'
  | 'extraSpacingBetweenIntersectionTypes'
  | 'unexpectedIntersectionTypesOrder'

type Options = SortUnionTypesOptions

let defaultOptions: Required<Options[0]> = {
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
      unexpectedIntersectionTypesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      missedSpacingBetweenIntersectionTypes:
        'Missed spacing between "{{left}}" and "{{right}}" types.',
      extraSpacingBetweenIntersectionTypes:
        'Extra spacing between "{{left}}" and "{{right}}" types.',
      unexpectedIntersectionTypesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
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
