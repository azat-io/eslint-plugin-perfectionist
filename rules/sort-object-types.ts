import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  SortObjectTypesSortingNode,
  Modifier,
  Selector,
  Options,
} from './sort-object-types/types'

import {
  buildUseConfigurationIfJsonSchema,
  buildCommonJsonSchemas,
  buildRegexJsonSchema,
} from '../utils/json-schemas/common-json-schemas'
import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import {
  singleCustomGroupJsonSchema,
  sortByJsonSchema,
  allModifiers,
  allSelectors,
} from './sort-object-types/types'
import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { buildOptionsByGroupIndexComputer } from './sort-object-types/build-options-by-group-index-computer'
import { computeMatchedContextOptions } from './sort-object-types/compute-matched-context-options'
import { comparatorByOptionsComputer } from './sort-object-types/comparator-by-options-computer'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { computeParentNodesWithTypes } from '../utils/compute-parent-nodes-with-types'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isMemberOptional } from './sort-object-types/is-member-optional'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { computeNodeName } from './sort-object-types/compute-node-name'
import { UnreachableCaseError } from '../utils/unreachable-case-error'
import { isNodeOnSingleLine } from '../utils/is-node-on-single-line'
import { isNodeFunctionType } from '../utils/is-node-function-type'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

/** Cache computed groups by modifiers and selectors for performance. */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

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
        additionalFallbackSortProperties: {
          sortBy: sortByJsonSchema,
        },
      }),
      ...buildCommonGroupsJsonSchemas({
        additionalFallbackSortProperties: { sortBy: sortByJsonSchema },
        singleCustomGroupJsonSchema,
      }),
      useConfigurationIf: buildUseConfigurationIfJsonSchema({
        additionalProperties: {
          hasNumericKeysOnly: {
            description:
              'Specifies whether to only match types that have exclusively numeric keys.',
            type: 'boolean',
          },
          declarationCommentMatchesPattern: buildRegexJsonSchema(),
          declarationMatchesPattern: buildRegexJsonSchema(),
        },
      }),
      partitionByComment: partitionByCommentJsonSchema,
      partitionByNewLine: partitionByNewLineJsonSchema,
      sortBy: sortByJsonSchema,
    },
    additionalProperties: false,
    type: 'object',
  },
  uniqueItems: true,
  type: 'array',
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
      url: 'https://perfectionist.dev/rules/sort-object-types',
      description: 'Enforce sorted object types.',
      recommended: true,
    },
    defaultOptions: [defaultOptions],
    schema: jsonSchema,
    type: 'suggestion',
    fixable: 'code',
  },
  create: context => ({
    TSTypeLiteral: node =>
      sortObjectTypeElements<MessageId>({
        availableMessageIds: {
          missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
          extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
          unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
          unexpectedOrder: ORDER_ERROR_ID,
        },
        parentNode: computeObjectTypeParentNode(node),
        elements: node.members,
        context,
      }),
  }),
  defaultOptions: [defaultOptions],
  name: 'sort-object-types',
})

export function sortObjectTypeElements<MessageIds extends string>({
  availableMessageIds,
  parentNode,
  elements,
  context,
}: {
  availableMessageIds: {
    missedSpacingBetweenMembers: MessageIds
    extraSpacingBetweenMembers: MessageIds
    unexpectedGroupOrder: MessageIds
    unexpectedOrder: MessageIds
  }
  parentNode:
    | TSESTree.TSTypeAliasDeclaration
    | TSESTree.TSInterfaceDeclaration
    | TSESTree.TSPropertySignature
    | null
  context: RuleContext<MessageIds, Options>
  elements: TSESTree.TypeElement[]
}): void {
  if (!isSortable(elements)) {
    return
  }

  let settings = getSettings(context.settings)
  let { sourceCode, id } = context

  let matchedContextOptions = computeMatchedContextOptions({
    parentNode,
    sourceCode,
    elements,
    context,
  })
  let options = complete(matchedContextOptions, settings, defaultOptions)
  validateCustomSortConfiguration(options)
  validateGroupsConfiguration({
    selectors: allSelectors,
    modifiers: allModifiers,
    options,
  })
  validateNewlinesAndPartitionConfiguration(options)

  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: id,
    sourceCode,
  })

  let formattedMembers: SortObjectTypesSortingNode[][] = [[]]
  for (let typeElement of elements) {
    if (
      typeElement.type === AST_NODE_TYPES.TSCallSignatureDeclaration ||
      typeElement.type === AST_NODE_TYPES.TSConstructSignatureDeclaration
    ) {
      continue
    }

    let lastGroup = formattedMembers.at(-1)
    let lastSortingNode = lastGroup?.at(-1)

    let selectors: Selector[] = []
    let modifiers: Modifier[] = []

    if (typeElement.type === AST_NODE_TYPES.TSIndexSignature) {
      selectors.push('index-signature')
    }

    if (isNodeFunctionType(typeElement)) {
      selectors.push('method')
    }

    if (!isNodeOnSingleLine(typeElement)) {
      modifiers.push('multiline')
    }

    if (
      !(['index-signature', 'method'] as const).some(selector =>
        selectors.includes(selector),
      )
    ) {
      selectors.push('property')
    }

    selectors.push('member')

    if (isMemberOptional(typeElement)) {
      modifiers.push('optional')
    } else {
      modifiers.push('required')
    }

    let name = computeNodeName({ node: typeElement, sourceCode })
    let value: string | null = null
    if (
      typeElement.type === AST_NODE_TYPES.TSPropertySignature &&
      typeElement.typeAnnotation
    ) {
      value = sourceCode.getText(typeElement.typeAnnotation.typeAnnotation)
    }

    let predefinedGroups = generatePredefinedGroups({
      cache: cachedGroupsByModifiersAndSelectors,
      selectors,
      modifiers,
    })
    let group = computeGroup({
      customGroupMatcher: customGroup =>
        doesCustomGroupMatch({
          elementValue: value,
          elementName: name,
          customGroup,
          selectors,
          modifiers,
        }),
      predefinedGroups,
      options,
    })

    let sortingNode: Omit<SortObjectTypesSortingNode, 'partitionId'> = {
      isEslintDisabled: isNodeEslintDisabled(typeElement, eslintDisabledLines),
      size: rangeToDiff(typeElement, sourceCode),
      addSafetySemicolonWhenInline: true,
      value: value ?? '',
      node: typeElement,
      group,
      name,
    }

    if (
      shouldPartition({
        lastSortingNode,
        sortingNode,
        sourceCode,
        options,
      })
    ) {
      lastGroup = []
      formattedMembers.push(lastGroup)
    }

    lastGroup?.push({
      ...sortingNode,
      partitionId: formattedMembers.length,
    })
  }

  let nodes = formattedMembers.flat()
  reportAllErrors<MessageIds>({
    sortNodesExcludingEslintDisabled,
    availableMessageIds,
    options,
    context,
    nodes,
  })

  function sortNodesExcludingEslintDisabled(
    ignoreEslintDisabledNodes: boolean,
  ): SortObjectTypesSortingNode[] {
    return formattedMembers.flatMap(groupedNodes =>
      sortNodesByGroups({
        isNodeIgnoredForGroup: ({ groupOptions, node }) => {
          switch (groupOptions.sortBy) {
            case 'value':
              return !node.value
            case 'name':
              return false
            /* v8 ignore next 2 -- @preserve Exhaustive guard. */
            default:
              throw new UnreachableCaseError(groupOptions.sortBy)
          }
        },
        optionsByGroupIndexComputer: buildOptionsByGroupIndexComputer(options),
        comparatorByOptionsComputer,
        ignoreEslintDisabledNodes,
        groups: options.groups,
        nodes: groupedNodes,
      }),
    )
  }
}

function computeObjectTypeParentNode(
  node: TSESTree.TSTypeLiteral,
): TSESTree.TSTypeAliasDeclaration | TSESTree.TSPropertySignature | null {
  let parentNodes = computeParentNodesWithTypes({
    allowedTypes: [
      AST_NODE_TYPES.TSTypeAliasDeclaration,
      AST_NODE_TYPES.TSPropertySignature,
    ],
    node,
  })

  return parentNodes[0] ?? null
}
