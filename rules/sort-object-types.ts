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
import type { CompareOptions } from '../utils/compare'

import {
  buildUseConfigurationIfJsonSchema,
  buildCustomGroupsArrayJsonSchema,
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  customGroupsJsonSchema,
  commonJsonSchemas,
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
import { doesCustomGroupMatch } from './sort-object-types/does-custom-group-match'
import { buildNodeValueGetter } from './sort-object-types/build-node-value-getter'
import { getMatchingContextOptions } from '../utils/get-matching-context-options'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isMemberOptional } from './sort-object-types/is-member-optional'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { isNodeFunctionType } from '../utils/is-node-function-type'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { sortByJsonSchema } from './sort-object-types/types'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { useGroups } from '../utils/use-groups'
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

export let jsonSchema: JSONSchema4 = {
  items: {
    properties: {
      ...commonJsonSchemas,
      customGroups: {
        oneOf: [
          customGroupsJsonSchema,
          buildCustomGroupsArrayJsonSchema({ singleCustomGroupJsonSchema }),
        ],
      },
      useConfigurationIf: buildUseConfigurationIfJsonSchema({
        additionalProperties: {
          declarationMatchesPattern: regexJsonSchema,
        },
      }),
      groupKind: {
        enum: ['mixed', 'required-first', 'optional-first'],
        description: 'Specifies top-level groups.',
        type: 'string',
      },
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

export let sortObjectTypeElements = <MessageIds extends string>({
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
}): void => {
  if (!isSortable(elements)) {
    return
  }

  let settings = getSettings(context.settings)
  let sourceCode = getSourceCode(context)
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
    ruleName: context.id,
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

      let { setCustomGroups, defineGroup, getGroup } = useGroups(options)

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
        !(<Selector[]>['index-signature', 'method']).some(selector =>
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

      let predefinedGroups = generatePredefinedGroups({
        cache: cachedGroupsByModifiersAndSelectors,
        selectors,
        modifiers,
      })

      for (let predefinedGroup of predefinedGroups) {
        defineGroup(predefinedGroup)
      }

      let name = getNodeName({ typeElement, sourceCode })
      let value: string | null = null
      if (
        typeElement.type === 'TSPropertySignature' &&
        typeElement.typeAnnotation
      ) {
        value = sourceCode.getText(typeElement.typeAnnotation.typeAnnotation)
      }

      if (Array.isArray(options.customGroups)) {
        for (let customGroup of options.customGroups) {
          if (
            doesCustomGroupMatch({
              elementValue: value,
              elementName: name,
              customGroup,
              selectors,
              modifiers,
            })
          ) {
            defineGroup(customGroup.groupName, true)
            /**
             * If the custom group is not referenced in the `groups` option, it
             * will be ignored
             */
            if (getGroup() === customGroup.groupName) {
              break
            }
          }
        }
      } else {
        setCustomGroups(options.customGroups, name, {
          override: true,
        })
      }

      let sortingNode: SortObjectTypesSortingNode = {
        isEslintDisabled: isNodeEslintDisabled(
          typeElement,
          eslintDisabledLines,
        ),
        groupKind: isMemberOptional(typeElement) ? 'optional' : 'required',
        size: rangeToDiff(typeElement, sourceCode),
        addSafetySemicolonWhenInline: true,
        group: getGroup(),
        node: typeElement,
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

    let compareOptions: CompareOptions<SortObjectTypesSortingNode> &
      Required<Options[0]> = {
      ...options,
      nodeValueGetter: buildNodeValueGetter(options.sortBy),
    }
    let sortNodesExcludingEslintDisabled = (
      ignoreEslintDisabledNodes: boolean,
    ): SortObjectTypesSortingNode[] =>
      filteredGroupKindNodes.flatMap(groupedNodes =>
        sortNodesByGroups(groupedNodes, compareOptions, {
          isNodeIgnoredForGroup: (node, groupCompareOptions) => {
            if (groupCompareOptions.sortBy === 'value') {
              return !node.value
            }
            return false
          },
          getGroupCompareOptions: groupNumber =>
            getCustomGroupsCompareOptions(compareOptions, groupNumber),
          ignoreEslintDisabledNodes,
        }),
      )

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

let getNodeName = ({
  typeElement,
  sourceCode,
}: {
  typeElement: TSESTree.TypeElement
  sourceCode: TSESLint.SourceCode
}): string => {
  let name: string

  let formatName = (value: string): string => value.replace(/[,;]$/u, '')

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
