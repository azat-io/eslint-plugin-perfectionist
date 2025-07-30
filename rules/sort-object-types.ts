import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type {
  SortObjectTypesSortingNode,
  Modifier,
  Selector,
  Options,
} from './sort-object-types/types'

import {
  buildUseConfigurationIfJsonSchema,
  buildCustomGroupsArrayJsonSchema,
  deprecatedCustomGroupsJsonSchema,
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  buildCommonJsonSchemas,
  groupsJsonSchema,
  regexJsonSchema,
} from '../utils/common-json-schemas'
import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import {
  singleCustomGroupJsonSchema,
  allModifiers,
  allSelectors,
} from './sort-object-types/types'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import { getCustomGroupsCompareOptions } from './sort-object-types/get-custom-groups-compare-options'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { getMatchingContextOptions } from '../utils/get-matching-context-options'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isMemberOptional } from './sort-object-types/is-member-optional'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { isNodeFunctionType } from '../utils/is-node-function-type'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { sortByJsonSchema } from './sort-object-types/types'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'
import { matches } from '../utils/matches'

/**
 * Cache computed groups by modifiers and selectors for performance
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

type MESSAGE_ID =
  | 'missedSpacingBetweenObjectTypeMembers'
  | 'extraSpacingBetweenObjectTypeMembers'
  | 'unexpectedObjectTypesGroupOrder'
  | 'unexpectedObjectTypesOrder'

let defaultOptions: Required<Options[0]> = {
  fallbackSort: { type: 'unsorted', sortBy: 'name' },
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

export let jsonSchema: JSONSchema4 = {
  items: {
    properties: {
      ...buildCommonJsonSchemas({
        additionalFallbackSortProperties: {
          sortBy: sortByJsonSchema,
        },
      }),
      customGroups: {
        oneOf: [
          deprecatedCustomGroupsJsonSchema,
          buildCustomGroupsArrayJsonSchema({
            additionalFallbackSortProperties: { sortBy: sortByJsonSchema },
            singleCustomGroupJsonSchema,
          }),
        ],
      },
      groupKind: {
        description: '[DEPRECATED] Specifies top-level groups.',
        enum: ['mixed', 'required-first', 'optional-first'],
        type: 'string',
      },
      useConfigurationIf: buildUseConfigurationIfJsonSchema({
        additionalProperties: {
          declarationMatchesPattern: regexJsonSchema,
        },
      }),
      partitionByComment: partitionByCommentJsonSchema,
      partitionByNewLine: partitionByNewLineJsonSchema,
      newlinesBetween: newlinesBetweenJsonSchema,
      ignorePattern: regexJsonSchema,
      sortBy: sortByJsonSchema,
      groups: groupsJsonSchema,
    },
    additionalProperties: false,
    type: 'object',
  },
  uniqueItems: true,
  type: 'array',
}

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => ({
    TSTypeLiteral: node =>
      sortObjectTypeElements<MESSAGE_ID>({
        availableMessageIds: {
          missedSpacingBetweenMembers: 'missedSpacingBetweenObjectTypeMembers',
          extraSpacingBetweenMembers: 'extraSpacingBetweenObjectTypeMembers',
          unexpectedGroupOrder: 'unexpectedObjectTypesGroupOrder',
          unexpectedOrder: 'unexpectedObjectTypesOrder',
        },
        parentNodeName:
          node.parent.type === 'TSTypeAliasDeclaration'
            ? node.parent.id.name
            : null,
        elements: node.members,
        context,
      }),
  }),
  meta: {
    messages: {
      missedSpacingBetweenObjectTypeMembers: MISSED_SPACING_ERROR,
      extraSpacingBetweenObjectTypeMembers: EXTRA_SPACING_ERROR,
      unexpectedObjectTypesGroupOrder: GROUP_ORDER_ERROR,
      unexpectedObjectTypesOrder: ORDER_ERROR,
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

export function sortObjectTypeElements<MessageIds extends string>({
  availableMessageIds,
  parentNodeName,
  elements,
  context,
}: {
  availableMessageIds: {
    missedSpacingBetweenMembers: MessageIds
    extraSpacingBetweenMembers: MessageIds
    unexpectedGroupOrder: MessageIds
    unexpectedOrder: MessageIds
  }
  context: RuleContext<MessageIds, Options>
  elements: TSESTree.TypeElement[]
  parentNodeName: string | null
}): void {
  if (!isSortable(elements)) {
    return
  }

  let settings = getSettings(context.settings)
  let { sourceCode, id } = context
  let matchedContextOptions = getMatchingContextOptions({
    nodeNames: elements.map(node =>
      getNodeName({ typeElement: node, sourceCode }),
    ),
    contextOptions: context.options,
  }).find(options => {
    if (!options.useConfigurationIf?.declarationMatchesPattern) {
      return true
    }
    if (!parentNodeName) {
      return false
    }
    return matches(
      parentNodeName,
      options.useConfigurationIf.declarationMatchesPattern,
    )
  })
  let options = complete(matchedContextOptions, settings, defaultOptions)
  validateCustomSortConfiguration(options)
  validateGeneratedGroupsConfiguration({
    selectors: allSelectors,
    modifiers: allModifiers,
    options,
  })
  validateNewlinesAndPartitionConfiguration(options)

  if (parentNodeName && matches(parentNodeName, options.ignorePattern)) {
    return
  }

  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: id,
    sourceCode,
  })

  let formattedMembers: SortObjectTypesSortingNode[][] = elements.reduce(
    (accumulator: SortObjectTypesSortingNode[][], typeElement) => {
      if (
        typeElement.type === 'TSCallSignatureDeclaration' ||
        typeElement.type === 'TSConstructSignatureDeclaration'
      ) {
        accumulator.push([])
        return accumulator
      }

      let lastGroup = accumulator.at(-1)
      let lastSortingNode = lastGroup?.at(-1)

      let selectors: Selector[] = []
      let modifiers: Modifier[] = []

      if (typeElement.type === 'TSIndexSignature') {
        selectors.push('index-signature')
      }

      if (isNodeFunctionType(typeElement)) {
        selectors.push('method')
      }

      if (typeElement.loc.start.line !== typeElement.loc.end.line) {
        modifiers.push('multiline')
        selectors.push('multiline')
      }

      if (
        !(['index-signature', 'method'] as Selector[]).some(selector =>
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

      let name = getNodeName({ typeElement, sourceCode })
      let value: string | null = null
      if (
        typeElement.type === 'TSPropertySignature' &&
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
        name,
      })

      let sortingNode: SortObjectTypesSortingNode = {
        isEslintDisabled: isNodeEslintDisabled(
          typeElement,
          eslintDisabledLines,
        ),
        groupKind: isMemberOptional(typeElement) ? 'optional' : 'required',
        size: rangeToDiff(typeElement, sourceCode),
        addSafetySemicolonWhenInline: true,
        partitionId: accumulator.length,
        node: typeElement,
        group,
        value,
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
        accumulator.push(lastGroup)
      }

      lastGroup?.push(sortingNode)

      return accumulator
    },
    [[]],
  )

  let groupKindOrder
  if (options.groupKind === 'required-first') {
    groupKindOrder = ['required', 'optional'] as const
  } else if (options.groupKind === 'optional-first') {
    groupKindOrder = ['optional', 'required'] as const
  } else {
    groupKindOrder = ['any'] as const
  }
  for (let nodes of formattedMembers) {
    let filteredGroupKindNodes = groupKindOrder.map(groupKind =>
      nodes.filter(
        currentNode =>
          groupKind === 'any' || currentNode.groupKind === groupKind,
      ),
    )

    function sortNodesExcludingEslintDisabled(
      ignoreEslintDisabledNodes: boolean,
    ): SortObjectTypesSortingNode[] {
      return filteredGroupKindNodes.flatMap(groupedNodes =>
        sortNodesByGroups({
          getOptionsByGroupIndex: groupIndex => {
            let {
              fallbackSortNodeValueGetter,
              options: overriddenOptions,
              nodeValueGetter,
            } = getCustomGroupsCompareOptions(options, groupIndex)
            return {
              options: {
                ...options,
                ...overriddenOptions,
              },
              fallbackSortNodeValueGetter,
              nodeValueGetter,
            }
          },
          isNodeIgnoredForGroup: (node, groupOptions) => {
            if (groupOptions.sortBy === 'value') {
              return !node.value
            }
            return false
          },
          ignoreEslintDisabledNodes,
          groups: options.groups,
          nodes: groupedNodes,
        }),
      )
    }

    reportAllErrors<MessageIds>({
      sortNodesExcludingEslintDisabled,
      availableMessageIds,
      sourceCode,
      options,
      context,
      nodes,
    })
  }
}

function getNodeName({
  typeElement,
  sourceCode,
}: {
  typeElement: TSESTree.TypeElement
  sourceCode: TSESLint.SourceCode
}): string {
  let name: string

  function formatName(value: string): string {
    return value.replace(/[,;]$/u, '')
  }

  if (typeElement.type === 'TSPropertySignature') {
    if (typeElement.key.type === 'Identifier') {
      ;({ name } = typeElement.key)
    } else if (typeElement.key.type === 'Literal') {
      name = `${typeElement.key.value}`
    } else {
      let end: number =
        typeElement.typeAnnotation?.range.at(0) ??
        typeElement.range.at(1)! - (typeElement.optional ? '?'.length : 0)
      name = sourceCode.text.slice(typeElement.range.at(0), end)
    }
  } else if (typeElement.type === 'TSIndexSignature') {
    let endIndex: number =
      typeElement.typeAnnotation?.range.at(0) ?? typeElement.range.at(1)!

    name = formatName(sourceCode.text.slice(typeElement.range.at(0), endIndex))
  } else if (
    typeElement.type === 'TSMethodSignature' &&
    'name' in typeElement.key
  ) {
    ;({ name } = typeElement.key)
    /* v8 ignore next 8 - Unsure if we can reach it */
  } else {
    name = formatName(
      sourceCode.text.slice(typeElement.range.at(0), typeElement.range.at(1)),
    )
  }
  return name
}
