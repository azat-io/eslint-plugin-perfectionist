import type { Options as SortImportAttributesOptions } from './sort-import-attributes/types'

import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { sortImportOrExportAttributes } from './sort-import-attributes/sort-import-or-export-attributes'
import { createEslintRule } from '../utils/create-eslint-rule'
import { jsonSchema } from './sort-import-attributes'

const ORDER_ERROR_ID = 'unexpectedExportAttributesOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedExportAttributesGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenExportAttributes'
const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenExportAttributes'

type MessageId =
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

type Options = SortImportAttributesOptions

let defaultOptions: Required<Options[0]> = {
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
  specialCharacters: 'keep',
  partitionByComment: false,
  partitionByNewLine: false,
  newlinesBetween: 'ignore',
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MessageId>({
  meta: {
    messages: {
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-export-attributes',
      description: 'Enforce sorted export attributes.',
      recommended: true,
    },
    schema: jsonSchema,
    type: 'suggestion',
    fixable: 'code',
  },
  create: context => ({
    ExportNamedDeclaration: node =>
      sortImportOrExportAttributes({
        availableMessageIds: {
          missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
          extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
          unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
          unexpectedOrder: ORDER_ERROR_ID,
        },
        defaultOptions,
        context,
        node,
      }),
  }),
  defaultOptions: [defaultOptions],
  name: 'sort-export-attributes',
})
