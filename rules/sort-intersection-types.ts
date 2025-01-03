import type { Options as SortUnionTypesOptions } from './sort-union-types'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  newlinesBetweenJsonSchema,
  ignoreCaseJsonSchema,
  buildTypeJsonSchema,
  alphabetJsonSchema,
  localesJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
} from '../utils/common-json-schemas'
import { sortUnionOrIntersectionTypes } from './sort-union-types'
import { createEslintRule } from '../utils/create-eslint-rule'

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
    schema: [
      {
        properties: {
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the intersection types members into logical groups.',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          alphabet: alphabetJsonSchema,
          type: buildTypeJsonSchema(),
          locales: localesJsonSchema,
          groups: groupsJsonSchema,
          order: orderJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
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
