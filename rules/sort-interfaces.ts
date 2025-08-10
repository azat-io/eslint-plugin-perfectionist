import type { Options as SortObjectTypesOptions } from './sort-object-types/types'

import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { sortObjectTypeElements, jsonSchema } from './sort-object-types'
import { createEslintRule } from '../utils/create-eslint-rule'

export type Options = SortObjectTypesOptions

type MessageId =
  | 'unexpectedInterfacePropertiesGroupOrder'
  | 'missedSpacingBetweenInterfaceMembers'
  | 'extraSpacingBetweenInterfaceMembers'
  | 'unexpectedInterfacePropertiesOrder'

let defaultOptions: Required<Options[0]> = {
  fallbackSort: { type: 'unsorted' },
  partitionByComment: false,
  partitionByNewLine: false,
  newlinesBetween: 'ignore',
  specialCharacters: 'keep',
  useConfigurationIf: {},
  type: 'alphabetical',
  groupKind: 'mixed',
  ignorePattern: [],
  ignoreCase: true,
  customGroups: {},
  locales: 'en-US',
  sortBy: 'name',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MessageId>({
  create: context => ({
    TSInterfaceDeclaration: node =>
      sortObjectTypeElements<MessageId>({
        availableMessageIds: {
          missedSpacingBetweenMembers: 'missedSpacingBetweenInterfaceMembers',
          extraSpacingBetweenMembers: 'extraSpacingBetweenInterfaceMembers',
          unexpectedGroupOrder: 'unexpectedInterfacePropertiesGroupOrder',
          unexpectedOrder: 'unexpectedInterfacePropertiesOrder',
        },
        parentNodeName: node.id.name,
        elements: node.body.body,
        context,
      }),
  }),
  meta: {
    messages: {
      unexpectedInterfacePropertiesGroupOrder: GROUP_ORDER_ERROR,
      missedSpacingBetweenInterfaceMembers: MISSED_SPACING_ERROR,
      extraSpacingBetweenInterfaceMembers: EXTRA_SPACING_ERROR,
      unexpectedInterfacePropertiesOrder: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-interfaces',
      description: 'Enforce sorted interface properties.',
      recommended: true,
    },
    schema: jsonSchema,
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-interfaces',
})
