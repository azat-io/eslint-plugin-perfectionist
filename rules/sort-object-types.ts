import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { getCommentsBefore } from '../utils/get-comments-before'
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
  | 'unexpectedObjectTypesGroupOrder'
  | 'unexpectedObjectTypesOrder'

type Group<T extends string[]> = 'multiline' | 'unknown' | T[number]

type Options<T extends string[]> = [
  Partial<{
    groupKind: 'required-first' | 'optional-first' | 'mixed'
    customGroups: { [key in T[number]]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    groups: (Group<T>[] | Group<T>)[]
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

type SortObjectTypesSortingNode = SortingNode<TSESTree.TypeElement>

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
          type: {
            description: 'Specifies the sorting method.',
            type: 'string',
            enum: ['alphabetical', 'natural', 'line-length'],
          },
          order: {
            description:
              'Determines whether the sorted items should be in ascending or descending order.',
            type: 'string',
            enum: ['asc', 'desc'],
          },
          ignoreCase: {
            description:
              'Controls whether sorting should be case-sensitive or not.',
            type: 'boolean',
          },
          partitionByComment: {
            description:
              'Allows you to use comments to separate the type members into logical groups.',
            anyOf: [
              {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              {
                type: 'boolean',
              },
              {
                type: 'string',
              },
            ],
          },
          partitionByNewLine: {
            description:
              'Allows to use spaces to separate the nodes into logical groups.',
            type: 'boolean',
          },
          groupKind: {
            description: 'Specifies top-level groups.',
            type: 'string',
            enum: ['mixed', 'required-first', 'optional-first'],
          },
          groups: {
            description: 'Specifies the order of the groups.',
            type: 'array',
            items: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              ],
            },
          },
          customGroups: {
            description: 'Specifies custom groups.',
            type: 'object',
            additionalProperties: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              ],
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedObjectTypesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedObjectTypesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
      partitionByComment: false,
      partitionByNewLine: false,
      groupKind: 'mixed',
      groups: [],
      customGroups: {},
    },
  ],
  create: context => ({
    TSTypeLiteral: node => {
      if (node.members.length > 1) {
        let settings = getSettings(context.settings)

        let options = complete(context.options.at(0), settings, {
          partitionByComment: false,
          partitionByNewLine: false,
          type: 'alphabetical',
          groupKind: 'mixed',
          ignoreCase: true,
          customGroups: {},
          order: 'asc',
          groups: [],
        } as const)

        validateGroupsConfiguration(
          options.groups,
          ['multiline', 'unknown'],
          Object.keys(options.customGroups),
        )

        let sourceCode = getSourceCode(context)
        let partitionComment = options.partitionByComment

        let formattedMembers: SortObjectTypesSortingNode[][] =
          node.members.reduce(
            (accumulator: SortObjectTypesSortingNode[][], member) => {
              let name: string
              let raw = sourceCode.text.slice(
                member.range.at(0),
                member.range.at(1),
              )
              let lastSortingNode = accumulator.at(-1)?.at(-1)

              let { getGroup, defineGroup, setCustomGroups } = useGroups(
                options.groups,
              )

              let formatName = (value: string): string =>
                value.replace(/(,|;)$/, '')

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

              if (member.loc.start.line !== member.loc.end.line) {
                defineGroup('multiline')
              }

              let endsWithComma = raw.endsWith(';') || raw.endsWith(',')
              let endSize = endsWithComma ? 1 : 0

              let sortingNode: SortObjectTypesSortingNode = {
                size: rangeToDiff(member.range) - endSize,
                group: getGroup(),
                node: member,
                name,
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
            groupedByKind = nodes.reduce<SortingNode<TSESTree.TypeElement>[][]>(
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

          let sortedNodes: SortingNode[] = []

          for (let nodesByKind of groupedByKind) {
            sortedNodes.push(...sortNodesByGroups(nodesByKind, options))
          }

          pairwise(nodes, (left, right) => {
            let indexOfLeft = sortedNodes.indexOf(left)
            let indexOfRight = sortedNodes.indexOf(right)
            if (indexOfLeft > indexOfRight) {
              let leftNum = getGroupNumber(options.groups, left)
              let rightNum = getGroupNumber(options.groups, right)
              context.report({
                messageId:
                  leftNum !== rightNum
                    ? 'unexpectedObjectTypesGroupOrder'
                    : 'unexpectedObjectTypesOrder',
                data: {
                  left: toSingleLine(left.name),
                  leftGroup: left.group,
                  right: toSingleLine(right.name),
                  rightGroup: right.group,
                },
                node: right.node,
                fix: fixer => makeFixes(fixer, nodes, sortedNodes, sourceCode),
              })
            }
          })
        }
      }
    },
  }),
})
