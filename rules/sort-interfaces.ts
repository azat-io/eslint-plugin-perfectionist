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
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { matches } from '../utils/matches'

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

type MESSAGE_ID =
  | 'unexpectedInterfacePropertiesGroupOrder'
  | 'missedSpacingBetweenInterfaceMembers'
  | 'extraSpacingBetweenInterfaceMembers'
  | 'unexpectedInterfacePropertiesOrder'

interface SortInterfacesSortingNode extends SortingNode<TSESTree.TypeElement> {
  groupKind: 'required' | 'optional'
}

type Group<T extends string[]> = 'multiline' | 'unknown' | T[number] | 'method'

let defaultOptions: Required<Options<string[]>[0]> = {
  partitionByComment: false,
  partitionByNewLine: false,
  newlinesBetween: 'ignore',
  specialCharacters: 'keep',
  type: 'alphabetical',
  groupKind: 'mixed',
  ignorePattern: [],
  ignoreCase: true,
  customGroups: {},
  locales: 'en-US',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
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
        ruleName: context.id,
        sourceCode,
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

            let { setCustomGroups, defineGroup, getGroup } = useGroups(options)

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
              isEslintDisabled: isNodeEslintDisabled(
                element,
                eslintDisabledLines,
              ),
              groupKind: isMemberOptional(element) ? 'optional' : 'required',
              size: rangeToDiff(element, sourceCode),
              addSafetySemicolonWhenInline: true,
              group: getGroup(),
              node: element,
              name,
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
              missedSpacingError: 'missedSpacingBetweenInterfaceMembers',
              extraSpacingError: 'extraSpacingBetweenInterfaceMembers',
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
                rightGroup: right.group,
                leftGroup: left.group,
                right: right.name,
                left: left.name,
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
          groupKind: {
            description: 'Specifies the order of optional and required nodes.',
            enum: ['mixed', 'optional-first', 'required-first'],
            type: 'string',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          customGroups: customGroupsJsonSchema,
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
      unexpectedInterfacePropertiesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      missedSpacingBetweenInterfaceMembers:
        'Missed spacing between "{{left}}" and "{{right}}" interfaces.',
      extraSpacingBetweenInterfaceMembers:
        'Extra spacing between "{{left}}" and "{{right}}" interfaces.',
      unexpectedInterfacePropertiesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-interfaces',
      description: 'Enforce sorted interface properties.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-interfaces',
})
