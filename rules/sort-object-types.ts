import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import {
  partitionByCommentJsonSchema,
  specialCharactersJsonSchema,
  customGroupsJsonSchema,
  ignoreCaseJsonSchema,
  localesJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getCommentsBefore } from '../utils/get-comments-before'
import { makeNewlinesFixes } from '../utils/make-newlines-fixes'
import { getNewlinesErrors } from '../utils/get-newlines-errors'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
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
    customGroups: { [key in T[number]]: string[] | string }
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

type SortObjectTypesSortingNode = SortingNode<TSESTree.TypeElement>

const defaultOptions: Required<Options<string[]>[0]> = {
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
          partitionByNewLine: {
            description:
              'Allows to use spaces to separate the nodes into logical groups.',
            type: 'boolean',
          },
          newlinesBetween: {
            description:
              'Specifies how new lines should be handled between object types groups.',
            enum: ['ignore', 'always', 'never'],
            type: 'string',
          },
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
      if (node.members.length > 1) {
        let settings = getSettings(context.settings)

        let options = complete(context.options.at(0), settings, defaultOptions)

        validateGroupsConfiguration(
          options.groups,
          ['multiline', 'method', 'unknown'],
          Object.keys(options.customGroups),
        )
        validateNewlinesAndPartitionConfiguration(options)

        let sourceCode = getSourceCode(context)
        let partitionComment = options.partitionByComment

        let formattedMembers: SortObjectTypesSortingNode[][] =
          node.members.reduce(
            (accumulator: SortObjectTypesSortingNode[][], member) => {
              let name: string
              let lastSortingNode = accumulator.at(-1)?.at(-1)

              let { getGroup, defineGroup, setCustomGroups } =
                useGroups(options)

              let formatName = (value: string): string =>
                value.replace(/([,;])$/, '')

              if (member.type === 'TSPropertySignature') {
                if (member.key.type === 'Identifier') {
                  ;({ name } = member.key)
                } else if (member.key.type === 'Literal') {
                  name = `${member.key.value}`
                } else {
                  name = sourceCode.text.slice(
                    member.range.at(0),
                    member.typeAnnotation?.range.at(0),
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
                  member.typeAnnotation?.typeAnnotation.type ===
                    'TSFunctionType')
              ) {
                defineGroup('method')
              }

              if (member.loc.start.line !== member.loc.end.line) {
                defineGroup('multiline')
              }

              let sortingNode: SortObjectTypesSortingNode = {
                size: rangeToDiff(member, sourceCode),
                group: getGroup(),
                node: member,
                name,
                addSafetySemicolonWhenInline: true,
              }

              if (
                (partitionComment &&
                  hasPartitionComment(
                    partitionComment,
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

        for (let nodes of formattedMembers) {
          let groupedByKind
          if (options.groupKind !== 'mixed') {
            groupedByKind = nodes.reduce<SortObjectTypesSortingNode[][]>(
              (accumulator, currentNode) => {
                let requiredIndex =
                  options.groupKind === 'required-first' ? 0 : 1
                let optionalIndex =
                  options.groupKind === 'required-first' ? 1 : 0

                if (
                  'optional' in currentNode.node &&
                  currentNode.node.optional
                ) {
                  accumulator[optionalIndex].push(currentNode)
                } else {
                  accumulator[requiredIndex].push(currentNode)
                }
                return accumulator
              },
              [[], []],
            )
          } else {
            groupedByKind = [nodes]
          }

          let sortedNodes: SortObjectTypesSortingNode[] = []

          for (let nodesByKind of groupedByKind) {
            sortedNodes.push(...sortNodesByGroups(nodesByKind, options))
          }

          pairwise(nodes, (left, right) => {
            let leftNum = getGroupNumber(options.groups, left)
            let rightNum = getGroupNumber(options.groups, right)

            let indexOfLeft = sortedNodes.indexOf(left)
            let indexOfRight = sortedNodes.indexOf(right)

            let messageIds: MESSAGE_ID[] = []

            if (indexOfLeft > indexOfRight) {
              messageIds.push(
                leftNum !== rightNum
                  ? 'unexpectedObjectTypesGroupOrder'
                  : 'unexpectedObjectTypesOrder',
              )
            }

            messageIds = [
              ...messageIds,
              ...getNewlinesErrors({
                left,
                leftNum,
                right,
                rightNum,
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
                  ...makeFixes(fixer, nodes, sortedNodes, sourceCode, options),
                  ...makeNewlinesFixes(
                    fixer,
                    nodes,
                    sortedNodes,
                    sourceCode,
                    options,
                  ),
                ],
              })
            }
          })
        }
      }
    },
  }),
})
