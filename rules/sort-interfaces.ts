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
import { isMemberOptional } from '../utils/is-member-optional'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { matches } from '../utils/matches'

type MESSAGE_ID =
  | 'unexpectedInterfacePropertiesGroupOrder'
  | 'missedSpacingBetweenInterfaceMembers'
  | 'extraSpacingBetweenInterfaceMembers'
  | 'unexpectedInterfacePropertiesOrder'

type Group<T extends string[]> = 'multiline' | 'unknown' | T[number] | 'method'

export type Options<T extends string[]> = [
  Partial<{
    groupKind: 'optional-first' | 'required-first' | 'mixed'
    customGroups: { [key: string]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    newlinesBetween: 'ignore' | 'always' | 'never'
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    groups: (Group<T>[] | Group<T>)[]
    partitionByNewLine: boolean
    ignorePattern: string[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

const defaultOptions: Required<Options<string[]>[0]> = {
  partitionByComment: false,
  partitionByNewLine: false,
  type: 'alphabetical',
  groupKind: 'mixed',
  newlinesBetween: 'ignore',
  ignorePattern: [],
  ignoreCase: true,
  specialCharacters: 'keep',
  customGroups: {},
  order: 'asc',
  groups: [],
  locales: 'en-US',
}

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: 'sort-interfaces',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted interface properties.',
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
          ignorePattern: {
            description:
              'Specifies names or patterns for nodes that should be ignored by rule.',
            items: {
              type: 'string',
            },
            type: 'array',
          },
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the interface properties into logical groups.',
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
            description: 'Specifies the order of optional and required nodes.',
            enum: ['mixed', 'optional-first', 'required-first'],
            type: 'string',
          },
          groups: groupsJsonSchema,
          customGroups: customGroupsJsonSchema,
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedInterfacePropertiesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedInterfacePropertiesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
      missedSpacingBetweenInterfaceMembers:
        'Missed spacing between "{{left}}" and "{{right}}" interfaces.',
      extraSpacingBetweenInterfaceMembers:
        'Extra spacing between "{{left}}" and "{{right}}" interfaces.',
    },
  },
  defaultOptions: [defaultOptions],
  create: context => ({
    TSInterfaceDeclaration: node => {
      if (node.body.body.length > 1) {
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

        if (
          !options.ignorePattern.some(pattern => matches(node.id.name, pattern))
        ) {
          let formattedMembers: SortingNode[][] = node.body.body.reduce(
            (accumulator: SortingNode[][], element) => {
              if (element.type === 'TSCallSignatureDeclaration') {
                accumulator.push([])
                return accumulator
              }

              let lastElement = accumulator.at(-1)?.at(-1)
              let name: string

              let { getGroup, defineGroup, setCustomGroups } =
                useGroups(options)

              if (element.type === 'TSPropertySignature') {
                if (element.key.type === 'Identifier') {
                  ;({ name } = element.key)
                } else if (element.key.type === 'Literal') {
                  name = `${element.key.value}`
                } else {
                  let end: number =
                    element.typeAnnotation?.range.at(0) ??
                    element.range.at(1)! - (element.optional ? '?'.length : 0)

                  name = sourceCode.text.slice(element.range.at(0), end)
                }
              } else if (element.type === 'TSIndexSignature') {
                let endIndex: number =
                  element.typeAnnotation?.range.at(0) ?? element.range.at(1)!

                name = sourceCode.text.slice(element.range.at(0), endIndex)
              } else {
                let endIndex: number =
                  element.returnType?.range.at(0) ?? element.range.at(1)!

                name = sourceCode.text.slice(element.range.at(0), endIndex)
              }

              setCustomGroups(options.customGroups, name)

              if (
                element.type === 'TSMethodSignature' ||
                (element.type === 'TSPropertySignature' &&
                  element.typeAnnotation?.typeAnnotation.type ===
                    'TSFunctionType')
              ) {
                defineGroup('method')
              }

              if (element.loc.start.line !== element.loc.end.line) {
                defineGroup('multiline')
              }

              let elementSortingNode: SortingNode = {
                size: rangeToDiff(element, sourceCode),
                node: element,
                group: getGroup(),
                name,
                addSafetySemicolonWhenInline: true,
              }

              if (
                (partitionComment &&
                  hasPartitionComment(
                    partitionComment,
                    getCommentsBefore(element, sourceCode),
                  )) ||
                (options.partitionByNewLine &&
                  lastElement &&
                  getLinesBetween(sourceCode, lastElement, elementSortingNode))
              ) {
                accumulator.push([])
              }

              accumulator.at(-1)!.push(elementSortingNode)

              return accumulator
            },
            [[]],
          )

          let { groupKind } = options

          for (let nodes of formattedMembers) {
            let sortedNodes: SortingNode[]

            if (groupKind !== 'mixed') {
              let optionalNodes = nodes.filter(member =>
                isMemberOptional(member.node),
              )
              let requiredNodes = nodes.filter(
                member => !isMemberOptional(member.node),
              )

              sortedNodes =
                groupKind === 'optional-first'
                  ? [
                      ...sortNodesByGroups(optionalNodes, options),
                      ...sortNodesByGroups(requiredNodes, options),
                    ]
                  : [
                      ...sortNodesByGroups(requiredNodes, options),
                      ...sortNodesByGroups(optionalNodes, options),
                    ]
            } else {
              sortedNodes = sortNodesByGroups(nodes, options)
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
                    ? 'unexpectedInterfacePropertiesGroupOrder'
                    : 'unexpectedInterfacePropertiesOrder',
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
                  missedSpacingError: 'missedSpacingBetweenInterfaceMembers',
                  extraSpacingError: 'extraSpacingBetweenInterfaceMembers',
                  options,
                }),
              ]

              for (let messageId of messageIds) {
                context.report({
                  messageId,
                  data: {
                    left: left.name,
                    leftGroup: left.group,
                    right: right.name,
                    rightGroup: right.group,
                  },
                  node: right.node,
                  fix: fixer => [
                    ...makeFixes(
                      fixer,
                      nodes,
                      sortedNodes,
                      sourceCode,
                      options,
                    ),
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
      }
    },
  }),
})
