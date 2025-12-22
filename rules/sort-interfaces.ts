import type { Options as SortObjectTypesOptions } from './sort-object-types/types'

import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import {
  sortObjectTypeElements,
  defaultOptions,
  jsonSchema,
} from './sort-object-types'
import { createEslintRule } from '../utils/create-eslint-rule'

type Options = SortObjectTypesOptions

const ORDER_ERROR_ID = 'unexpectedInterfacePropertiesOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedInterfacePropertiesGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenInterfaceMembers'
const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenInterfaceMembers'

type MessageId =
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

export default createEslintRule<Options, MessageId>({
  meta: {
    messages: {
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
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
      sortObjectTypeElements<MessageId>({
        availableMessageIds: {
          missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
          extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
          unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
          unexpectedOrder: ORDER_ERROR_ID,
        },
        elements: node.body.body,
        parentNodes: [node],
        context,
      }),
  }),
  defaultOptions: [defaultOptions],
  name: 'sort-interfaces',
})
