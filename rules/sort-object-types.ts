import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type { Modifier, Selector, Options } from './sort-object-types.types'
import type { SortingNode } from '../typings'

import {
  buildUseConfigurationIfJsonSchema,
  buildCustomGroupsArrayJsonSchema,
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  newlinesBetweenJsonSchema,
  customGroupsJsonSchema,
  ignoreCaseJsonSchema,
  buildTypeJsonSchema,
  alphabetJsonSchema,
  localesJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
} from '../utils/common-json-schemas'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { getCustomGroupsCompareOptions } from '../utils/get-custom-groups-compare-options'
import { getMatchingContextOptions } from '../utils/get-matching-context-options'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { singleCustomGroupJsonSchema } from './sort-object-types.types'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { allModifiers, allSelectors } from './sort-object-types.types'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { isNodeFunctionType } from '../utils/is-node-function-type'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getCommentsBefore } from '../utils/get-comments-before'
import { makeNewlinesFixes } from '../utils/make-newlines-fixes'
import { getNewlinesErrors } from '../utils/get-newlines-errors'
import { createEslintRule } from '../utils/create-eslint-rule'
import { isMemberOptional } from '../utils/is-member-optional'
import { customGroupMatches } from './sort-object-types-utils'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { makeFixes } from '../utils/make-fixes'
import { useGroups } from '../utils/use-groups'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
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

interface SortObjectTypesSortingNode extends SortingNode<TSESTree.TypeElement> {
  groupKind: 'required' | 'optional'
}

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

export let jsonSchema: JSONSchema4 = {
  items: {
    properties: {
      ignorePattern: {
        description:
          'Specifies names or patterns for nodes that should be ignored by rule.',
        items: {
          type: 'string',
        },
        type: 'array',
      },
      useConfigurationIf: buildUseConfigurationIfJsonSchema({
        additionalProperties: {
          declarationMatchesPattern: {
            type: 'string',
          },
        },
      }),
      partitionByComment: {
        ...partitionByCommentJsonSchema,
        description:
          'Allows you to use comments to separate members into logical groups.',
      },
      customGroups: {
        oneOf: [
          customGroupsJsonSchema,
          buildCustomGroupsArrayJsonSchema({ singleCustomGroupJsonSchema }),
        ],
      },
      groupKind: {
        enum: ['mixed', 'required-first', 'optional-first'],
        description: 'Specifies top-level groups.',
        type: 'string',
      },
      type: buildTypeJsonSchema({ withUnsorted: true }),
      partitionByNewLine: partitionByNewLineJsonSchema,
      specialCharacters: specialCharactersJsonSchema,
      newlinesBetween: newlinesBetweenJsonSchema,
      ignoreCase: ignoreCaseJsonSchema,
      alphabet: alphabetJsonSchema,
      locales: localesJsonSchema,
      groups: groupsJsonSchema,
      order: orderJsonSchema,
    },
    additionalProperties: false,
    type: 'object',
  },
  uniqueItems: true,
  type: 'array',
}

export default createEslintRule<Options, MESSAGE_ID>({
  meta: {
    messages: {
      unexpectedObjectTypesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      missedSpacingBetweenObjectTypeMembers:
        'Missed spacing between "{{left}}" and "{{right}}" types.',
      extraSpacingBetweenObjectTypeMembers:
        'Extra spacing between "{{left}}" and "{{right}}" types.',
      unexpectedObjectTypesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
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
  let completeOptions = complete(
    matchedContextOptions,
    settings,
    defaultOptions,
  )
  let { type } = completeOptions
  if (type === 'unsorted') {
    return
  }
  let options = {
    ...completeOptions,
    type,
  }
  validateCustomSortConfiguration(options)
  validateGeneratedGroupsConfiguration({
    customGroups: options.customGroups,
    selectors: allSelectors,
    modifiers: allModifiers,
    groups: options.groups,
  })
  validateNewlinesAndPartitionConfiguration(options)

  if (
    options.ignorePattern.some(
      pattern => parentNodeName && matches(parentNodeName, pattern),
    )
  ) {
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

      let lastSortingNode = accumulator.at(-1)?.at(-1)

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
        !selectors.includes('index-signature') &&
        !selectors.includes('method')
      ) {
        selectors.push('property')
      }

      selectors.push('member')

      if (isMemberOptional(typeElement)) {
        modifiers.push('optional')
      } else {
        modifiers.push('required')
      }

      for (let predefinedGroup of generatePredefinedGroups({
        cache: cachedGroupsByModifiersAndSelectors,
        selectors,
        modifiers,
      })) {
        defineGroup(predefinedGroup)
      }

      let name = getNodeName({ typeElement, sourceCode })
      if (Array.isArray(options.customGroups)) {
        for (let customGroup of options.customGroups) {
          if (
            customGroupMatches({
              elementName: name,
              customGroup,
              selectors,
              modifiers,
            })
          ) {
            defineGroup(customGroup.groupName, true)
            // If the custom group is not referenced in the `groups` option, it will be ignored
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
        name,
      }

      if (
        hasPartitionComment(
          options.partitionByComment,
          getCommentsBefore({
            node: typeElement,
            sourceCode,
          }),
        ) ||
        (options.partitionByNewLine &&
          lastSortingNode &&
          getLinesBetween(sourceCode, lastSortingNode, sortingNode))
      ) {
        accumulator.push([])
      }

      accumulator.at(-1)?.push(sortingNode)

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
    let sortNodesExcludingEslintDisabled = (
      ignoreEslintDisabledNodes: boolean,
    ): SortObjectTypesSortingNode[] =>
      filteredGroupKindNodes.flatMap(groupedNodes =>
        sortNodesByGroups(groupedNodes, options, {
          getGroupCompareOptions: groupNumber =>
            getCustomGroupsCompareOptions(options, groupNumber),
          ignoreEslintDisabledNodes,
        }),
      )
    let sortedNodes = sortNodesExcludingEslintDisabled(false)
    let sortedNodesExcludingEslintDisabled =
      sortNodesExcludingEslintDisabled(true)

    pairwise(nodes, (left, right) => {
      let leftNumber = getGroupNumber(options.groups, left)
      let rightNumber = getGroupNumber(options.groups, right)

      let indexOfLeft = sortedNodes.indexOf(left)
      let indexOfRight = sortedNodes.indexOf(right)
      let indexOfRightExcludingEslintDisabled =
        sortedNodesExcludingEslintDisabled.indexOf(right)

      let messageIds: MessageIds[] = []

      if (
        indexOfLeft > indexOfRight ||
        indexOfLeft >= indexOfRightExcludingEslintDisabled
      ) {
        messageIds.push(
          leftNumber === rightNumber
            ? availableMessageIds.unexpectedOrder
            : availableMessageIds.unexpectedGroupOrder,
        )
      }

      messageIds = [
        ...messageIds,
        ...getNewlinesErrors({
          missedSpacingError: availableMessageIds.missedSpacingBetweenMembers,
          extraSpacingError: availableMessageIds.extraSpacingBetweenMembers,
          rightNum: rightNumber,
          leftNum: leftNumber,
          sourceCode,
          options,
          right,
          left,
        }),
      ]

      for (let messageId of messageIds) {
        context.report({
          fix: fixer => [
            ...makeFixes({
              sortedNodes: sortedNodesExcludingEslintDisabled,
              sourceCode,
              options,
              fixer,
              nodes,
            }),
            ...makeNewlinesFixes({
              sortedNodes: sortedNodesExcludingEslintDisabled,
              sourceCode,
              options,
              fixer,
              nodes,
            }),
          ],
          data: {
            right: toSingleLine(right.name),
            left: toSingleLine(left.name),
            rightGroup: right.group,
            leftGroup: left.group,
          },
          node: right.node,
          messageId,
        })
      }
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
