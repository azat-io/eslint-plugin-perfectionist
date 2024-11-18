import type { TSESTree } from '@typescript-eslint/types'

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
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getCommentsBefore } from '../utils/get-comments-before'
import { makeNewlinesFixes } from '../utils/make-newlines-fixes'
import { getNewlinesErrors } from '../utils/get-newlines-errors'
import { createEslintRule } from '../utils/create-eslint-rule'
import { isMemberOptional } from '../utils/is-member-optional'
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

type MESSAGE_ID =
  | 'missedSpacingBetweenObjectTypeMembers'
  | 'extraSpacingBetweenObjectTypeMembers'
  | 'unexpectedObjectTypesGroupOrder'
  | 'unexpectedObjectTypesOrder'

type Group<T extends string[]> = 'multiline' | 'unknown' | T[number] | 'method'

type Options<T extends string[]> = [
  Partial<{
    groupKind: 'required-first' | 'optional-first' | 'mixed'
    customGroups: Record<T[number], string[] | string>
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    newlinesBetween: 'ignore' | 'always' | 'never'
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    groups: (Group<T>[] | Group<T>)[]
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

interface SortObjectTypesSortingNode extends SortingNode<TSESTree.TypeElement> {
  groupKind: 'required' | 'optional'
}

let defaultOptions: Required<Options<string[]>[0]> = {
  partitionByComment: false,
  partitionByNewLine: false,
  type: 'alphabetical',
  groupKind: 'mixed',
  newlinesBetween: 'ignore',
  ignoreCase: true,
  specialCharacters: 'keep',
  customGroups: {},
  order: 'asc',
  groups: [],
  locales: 'en-US',
}

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: 'sort-object-types',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted object types.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: typeJsonSchema,
          order: orderJsonSchema,
          locales: localesJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the type members into logical groups.',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          groupKind: {
            description: 'Specifies top-level groups.',
            type: 'string',
            enum: ['mixed', 'required-first', 'optional-first'],
          },
          groups: groupsJsonSchema,
          customGroups: customGroupsJsonSchema,
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedObjectTypesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedObjectTypesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
      missedSpacingBetweenObjectTypeMembers:
        'Missed spacing between "{{left}}" and "{{right}}" types.',
      extraSpacingBetweenObjectTypeMembers:
        'Extra spacing between "{{left}}" and "{{right}}" types.',
    },
  },
  defaultOptions: [defaultOptions],
  create: context => ({
    TSTypeLiteral: node => {
      if (!isSortable(node.members)) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
      validateGroupsConfiguration(
        options.groups,
        ['multiline', 'method', 'unknown'],
        Object.keys(options.customGroups),
      )
      validateNewlinesAndPartitionConfiguration(options)

      let sourceCode = getSourceCode(context)
      let eslintDisabledLines = getEslintDisabledLines({
        sourceCode,
        ruleName: context.id,
      })

      let formattedMembers: SortObjectTypesSortingNode[][] =
        node.members.reduce(
          (accumulator: SortObjectTypesSortingNode[][], member) => {
            let name: string
            let lastSortingNode = accumulator.at(-1)?.at(-1)

            let { getGroup, defineGroup, setCustomGroups } = useGroups(options)

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

            setCustomGroups(options.customGroups, name)

            if (
              member.type === 'TSMethodSignature' ||
              (member.type === 'TSPropertySignature' &&
                member.typeAnnotation?.typeAnnotation.type === 'TSFunctionType')
            ) {
              defineGroup('method')
            }

            if (member.loc.start.line !== member.loc.end.line) {
              defineGroup('multiline')
            }

            let sortingNode: SortObjectTypesSortingNode = {
              size: rangeToDiff(member, sourceCode),
              group: getGroup(),
              groupKind: isMemberOptional(member) ? 'optional' : 'required',
              node: member,
              isEslintDisabled: isNodeEslintDisabled(
                member,
                eslintDisabledLines,
              ),
              name,
              addSafetySemicolonWhenInline: true,
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
              left,
              leftNum: leftNumber,
              right,
              rightNum: rightNumber,
              sourceCode,
              missedSpacingError: 'missedSpacingBetweenObjectTypeMembers',
              extraSpacingError: 'extraSpacingBetweenObjectTypeMembers',
              options,
            }),
          ]

          for (let messageId of messageIds) {
            context.report({
              messageId,
              data: {
                left: toSingleLine(left.name),
                leftGroup: left.group,
                right: toSingleLine(right.name),
                rightGroup: right.group,
              },
              node: right.node,
              fix: fixer => [
                ...makeFixes(
                  fixer,
                  nodes,
                  sortedNodesExcludingEslintDisabled,
                  sourceCode,
                  options,
                ),
                ...makeNewlinesFixes(
                  fixer,
                  nodes,
                  sortedNodesExcludingEslintDisabled,
                  sourceCode,
                  options,
                ),
              ],
            })
          }
        })
      }
    },
  }),
})
