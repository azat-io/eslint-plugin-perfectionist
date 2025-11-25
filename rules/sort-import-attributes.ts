import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type {
  SortImportAttributesSortingNode,
  Options,
} from './sort-import-attributes/types'

import {
  buildCustomGroupsArrayJsonSchema,
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
} from '../utils/common-json-schemas'
import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { buildDefaultOptionsByGroupIndexComputer } from '../utils/build-default-options-by-group-index-computer'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { singleCustomGroupJsonSchema } from './sort-import-attributes/types'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

const ORDER_ERROR_ID = 'unexpectedImportAttributesOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedImportAttributesGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenImportAttributes'
const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenImportAttributes'

type MessageId =
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

let defaultOptions: Required<Options[0]> = {
  fallbackSort: { type: 'unsorted' },
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
  create: context => ({
    ImportDeclaration: node => {
      let attributes: TSESTree.ImportAttribute[] | undefined = node.attributes
      if (!isSortable(attributes)) {
        return
      }

      let { sourceCode, id } = context
      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
      validateCustomSortConfiguration(options)
      validateGroupsConfiguration({
        selectors: [],
        modifiers: [],
        options,
      })
      validateNewlinesAndPartitionConfiguration(options)

      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: id,
        sourceCode,
      })

      let formattedMembers: SortImportAttributesSortingNode[][] = [[]]
      for (let attribute of attributes) {
        let name = getAttributeName(attribute, sourceCode)

        let group = computeGroup({
          customGroupMatcher: customGroup =>
            doesCustomGroupMatch({
              elementName: name,
              selectors: [],
              modifiers: [],
              customGroup,
            }),
          predefinedGroups: [],
          options,
        })

        let sortingNode: Omit<SortImportAttributesSortingNode, 'partitionId'> =
          {
            isEslintDisabled: isNodeEslintDisabled(
              attribute,
              eslintDisabledLines,
            ),
            size: rangeToDiff(attribute, sourceCode),
            node: attribute,
            group,
            name,
          }

        let lastSortingNode = formattedMembers.at(-1)?.at(-1)
        if (
          shouldPartition({
            lastSortingNode,
            sortingNode,
            sourceCode,
            options,
          })
        ) {
          formattedMembers.push([])
        }

        formattedMembers.at(-1)!.push({
          ...sortingNode,
          partitionId: formattedMembers.length,
        })
      }

      for (let nodes of formattedMembers) {
        function createSortNodesExcludingEslintDisabled(
          sortingNodes: SortImportAttributesSortingNode[],
        ) {
          return function (
            ignoreEslintDisabledNodes: boolean,
          ): SortImportAttributesSortingNode[] {
            return sortNodesByGroups({
              optionsByGroupIndexComputer:
                buildDefaultOptionsByGroupIndexComputer(options),
              ignoreEslintDisabledNodes,
              groups: options.groups,
              nodes: sortingNodes,
            })
          }
        }

        reportAllErrors<MessageId>({
          availableMessageIds: {
            missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
            extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
            unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
            unexpectedOrder: ORDER_ERROR_ID,
          },
          sortNodesExcludingEslintDisabled:
            createSortNodesExcludingEslintDisabled(nodes),
          sourceCode,
          options,
          context,
          nodes,
        })
      }
    },
  }),
  meta: {
    schema: {
      items: {
        properties: {
          ...commonJsonSchemas,
          customGroups: buildCustomGroupsArrayJsonSchema({
            singleCustomGroupJsonSchema,
          }),
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          groups: groupsJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
      uniqueItems: true,
      type: 'array',
    },
    messages: {
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-import-attributes',
      description: 'Enforce sorted import attributes.',
      recommended: true,
    },
    defaultOptions: [defaultOptions],
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-import-attributes',
})

function getAttributeName(
  attribute: TSESTree.ImportAttribute,
  sourceCode: TSESLint.SourceCode,
): string {
  let { key } = attribute
  if (key.type === 'Identifier') {
    return key.name
  }
  return key.value?.toString() ?? sourceCode.getText(attribute)
}
