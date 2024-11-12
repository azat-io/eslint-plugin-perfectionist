import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
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
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
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
    type: 'alphabetical' | 'line-length' | 'natural'
    customGroups: Record<string, string[] | string>
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

interface SortInterfacesSortingNode extends SortingNode<TSESTree.TypeElement> {
  groupKind: 'required' | 'optional'
}

let defaultOptions: Required<Options<string[]>[0]> = {
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
          partitionByNewLine: partitionByNewLineJsonSchema,
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
      if (!isSortable(node.body.body)) {
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

      if (
        options.ignorePattern.some(pattern => matches(node.id.name, pattern))
      ) {
        return
      }

      let sourceCode = getSourceCode(context)
      let eslintDisabledLines = getEslintDisabledLines({
        sourceCode,
        ruleName: context.id,
      })

      let formattedMembers: SortInterfacesSortingNode[][] =
        node.body.body.reduce(
          (accumulator: SortInterfacesSortingNode[][], element) => {
            if (element.type === 'TSCallSignatureDeclaration') {
              accumulator.push([])
              return accumulator
            }

            let lastElement = accumulator.at(-1)?.at(-1)
            let name: string

            let { getGroup, defineGroup, setCustomGroups } = useGroups(options)

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

            let elementSortingNode: SortInterfacesSortingNode = {
              size: rangeToDiff(element, sourceCode),
              node: element,
              group: getGroup(),
              name,
              isEslintDisabled: isNodeEslintDisabled(
                element,
                eslintDisabledLines,
              ),
              groupKind: isMemberOptional(element) ? 'optional' : 'required',
              addSafetySemicolonWhenInline: true,
            }

            if (
              (options.partitionByComment &&
                hasPartitionComment(
                  options.partitionByComment,
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
        ): SortInterfacesSortingNode[] =>
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
                ? 'unexpectedInterfacePropertiesOrder'
                : 'unexpectedInterfacePropertiesGroupOrder',
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
