import type { Options as SortObjectTypesOptions } from './sort-object-types/types'

import { sortObjectTypeElements, jsonSchema } from './sort-object-types'
import { createEslintRule } from '../utils/create-eslint-rule'

export type Options = SortObjectTypesOptions

type MESSAGE_ID =
  | 'unexpectedInterfacePropertiesGroupOrder'
  | 'missedSpacingBetweenInterfaceMembers'
  | 'extraSpacingBetweenInterfaceMembers'
  | 'unexpectedInterfacePropertiesOrder'

let defaultOptions: Required<Options[0]> = {
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
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MESSAGE_ID>({
  meta: {
    messages: {
      unexpectedInterfacePropertiesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      missedSpacingBetweenInterfaceMembers:
        'Missed spacing between "{{left}}" and "{{right}}" properties.',
      extraSpacingBetweenInterfaceMembers:
        'Extra spacing between "{{left}}" and "{{right}}" properties.',
      unexpectedInterfacePropertiesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
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
  create: context => ({
    TSInterfaceDeclaration: node =>
      sortObjectTypeElements<MESSAGE_ID>({
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
  defaultOptions: [defaultOptions],
  name: 'sort-interfaces',
})
