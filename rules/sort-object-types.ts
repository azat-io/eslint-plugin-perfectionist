import type { TSESTree } from '@typescript-eslint/types'

import type { Modifier, Selector, Options } from './sort-object-types.types'
import type { SortingNode } from '../typings'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  newlinesBetweenJsonSchema,
  customGroupsJsonSchema,
  ignoreCaseJsonSchema,
  localesJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import {
  singleCustomGroupJsonSchema,
  customGroupNameJsonSchema,
  customGroupSortJsonSchema,
} from './sort-object-types.types'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { validateGeneratedGroupsConfiguration } from './validate-generated-groups-configuration'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { allModifiers, allSelectors } from './sort-object-types.types'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getCommentsBefore } from '../utils/get-comments-before'
import { makeNewlinesFixes } from '../utils/make-newlines-fixes'
import { getNewlinesErrors } from '../utils/get-newlines-errors'
import { createEslintRule } from '../utils/create-eslint-rule'
import { isMemberOptional } from '../utils/is-member-optional'
import { customGroupMatches } from './sort-object-types-utils'
import { getCompareOptions } from './sort-object-types-utils'
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
  type: 'alphabetical',
  groupKind: 'mixed',
  ignoreCase: true,
  customGroups: {},
  locales: 'en-US',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => ({
    TSTypeLiteral: node => {
      if (!isSortable(node.members)) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
      validateGeneratedGroupsConfiguration({
        customGroups: options.customGroups,
        selectors: allSelectors,
        modifiers: allModifiers,
        groups: options.groups,
      })
      validateNewlinesAndPartitionConfiguration(options)

      let sourceCode = getSourceCode(context)
      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: context.id,
        sourceCode,
      })

      let formattedMembers: SortObjectTypesSortingNode[][] =
        node.members.reduce(
          (accumulator: SortObjectTypesSortingNode[][], member) => {
            let name: string
            let lastSortingNode = accumulator.at(-1)?.at(-1)

            let { setCustomGroups, defineGroup, getGroup } = useGroups(options)

            let formatName = (value: string): string =>
              value.replace(/[,;]$/u, '')

            if (member.type === 'TSPropertySignature') {
              if (member.key.type === 'Identifier') {
                ;({ name } = member.key)
              } else if (member.key.type === 'Literal') {
                name = `${member.key.value}`
              } else {
                name = sourceCode.text.slice(
                  member.range.at(0),
                  member.typeAnnotation?.range.at(0) ?? member.range.at(1),
                )
              }
            } else if (member.type === 'TSIndexSignature') {
              let endIndex: number =
                member.typeAnnotation?.range.at(0) ?? member.range.at(1)!

              name = formatName(
                sourceCode.text.slice(member.range.at(0), endIndex),
              )
            } else {
              name = formatName(
                sourceCode.text.slice(member.range.at(0), member.range.at(1)),
              )
            }

            let selectors: Selector[] = []
            let modifiers: Modifier[] = []

            if (member.type === 'TSIndexSignature') {
              selectors.push('index-signature')
            }

            if (
              member.type === 'TSMethodSignature' ||
              (member.type === 'TSPropertySignature' &&
                member.typeAnnotation?.typeAnnotation.type === 'TSFunctionType')
            ) {
              selectors.push('method')
            }

            if (member.loc.start.line !== member.loc.end.line) {
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

          if (isMemberOptional(member)) {
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
                member,
                eslintDisabledLines,
              ),
              groupKind: isMemberOptional(member) ? 'optional' : 'required',
              size: rangeToDiff(member, sourceCode),
              addSafetySemicolonWhenInline: true,
              group: getGroup(),
              node: member,
              name,
            }

            if (
              (options.partitionByComment &&
                hasPartitionComment(
                  options.partitionByComment,
                  getCommentsBefore(member, sourceCode),
                )) ||
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
                getCompareOptions(options, groupNumber),
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

          let messageIds: MESSAGE_ID[] = []

          if (
            indexOfLeft > indexOfRight ||
            indexOfLeft >= indexOfRightExcludingEslintDisabled
          ) {
            messageIds.push(
              leftNumber === rightNumber
                ? 'unexpectedObjectTypesOrder'
                : 'unexpectedObjectTypesGroupOrder',
            )
          }

          messageIds = [
            ...messageIds,
            ...getNewlinesErrors({
              missedSpacingError: 'missedSpacingBetweenObjectTypeMembers',
              extraSpacingError: 'extraSpacingBetweenObjectTypeMembers',
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
    },
  }),
  meta: {
    schema: [
      {
        properties: {
          customGroups: {
            oneOf: [
              customGroupsJsonSchema,
              {
                items: {
                  oneOf: [
                    {
                      properties: {
                        ...customGroupNameJsonSchema,
                        ...customGroupSortJsonSchema,
                        anyOf: {
                          items: {
                            properties: {
                              ...singleCustomGroupJsonSchema,
                            },
                            description: 'Custom group.',
                            additionalProperties: false,
                            type: 'object',
                          },
                          type: 'array',
                        },
                      },
                      description: 'Custom group block.',
                      additionalProperties: false,
                      type: 'object',
                    },
                    {
                      properties: {
                        ...customGroupNameJsonSchema,
                        ...customGroupSortJsonSchema,
                        ...singleCustomGroupJsonSchema,
                      },
                      description: 'Custom group.',
                      additionalProperties: false,
                      type: 'object',
                    },
                  ],
                },
                type: 'array',
              },
            ],
          },
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the type members into logical groups.',
          },
          groupKind: {
            enum: ['mixed', 'required-first', 'optional-first'],
            description: 'Specifies top-level groups.',
            type: 'string',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          locales: localesJsonSchema,
          groups: groupsJsonSchema,
          order: orderJsonSchema,
          type: typeJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
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
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-object-types',
})
