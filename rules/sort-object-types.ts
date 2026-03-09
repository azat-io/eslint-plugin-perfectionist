import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type { ObjectTypeParent, Options } from './sort-object-types/types'

import {
  additionalCustomGroupMatchOptionsJsonSchema,
  additionalSortOptionsJsonSchema,
  objectTypeParentTypes,
} from './sort-object-types/types'
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
import {
  buildUseConfigurationIfJsonSchema,
  buildCommonJsonSchemas,
} from '../utils/json-schemas/common-json-schemas'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { computeParentNodesWithTypes } from '../utils/compute-parent-nodes-with-types'
import { scopedRegexJsonSchema } from '../utils/json-schemas/scoped-regex-json-schema'
import { sortObjectTypeElements } from './sort-object-types/sort-object-type-elements'
import { createEslintRule } from '../utils/create-eslint-rule'

const ORDER_ERROR_ID = 'unexpectedObjectTypesOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedObjectTypesGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenObjectTypeMembers'
const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenObjectTypeMembers'

type MessageId =
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

export let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted', sortBy: 'name' },
  newlinesInside: 'newlinesBetween',
  partitionByComment: false,
  partitionByNewLine: false,
  newlinesBetween: 'ignore',
  specialCharacters: 'keep',
  useConfigurationIf: {},
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  sortBy: 'name',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export let jsonSchema: JSONSchema4 = {
  items: {
    properties: {
      ...buildCommonJsonSchemas({
        additionalSortProperties: additionalSortOptionsJsonSchema,
      }),
      ...buildCommonGroupsJsonSchemas({
        additionalCustomGroupMatchProperties:
          additionalCustomGroupMatchOptionsJsonSchema,
        additionalSortProperties: additionalSortOptionsJsonSchema,
      }),
      useConfigurationIf: buildUseConfigurationIfJsonSchema({
        additionalProperties: {
          hasNumericKeysOnly: {
            description:
              'Specifies whether to only match types that have exclusively numeric keys.',
            type: 'boolean',
          },
          declarationCommentMatchesPattern: scopedRegexJsonSchema,
          declarationMatchesPattern: scopedRegexJsonSchema,
        },
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
    TSTypeLiteral: node =>
      sortObjectTypeElements<MessageId>({
        availableMessageIds: {
          missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
          extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
          unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
          unexpectedOrder: ORDER_ERROR_ID,
        },
        parentNodes: computeObjectTypeParentNodes(node),
        elements: node.members,
        context,
      }),
  }),
  meta: {
    messages: {
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-object-types',
      description: 'Enforce sorted object types.',
      recommended: true,
    },
    schema: jsonSchema,
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-object-types',
})

function computeObjectTypeParentNodes(
  node: TSESTree.TSTypeLiteral,
): ObjectTypeParent[] {
  return computeParentNodesWithTypes({
    allowedTypes: [...objectTypeParentTypes],
    consecutiveOnly: false,
    maxParent: null,
    node,
  })
}
