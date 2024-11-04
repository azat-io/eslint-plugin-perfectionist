import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'
import type { CompareOptions } from '../utils/compare'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  ignoreCaseJsonSchema,
  localesJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import {
  getFirstUnorderedNodeDependentOn,
  sortNodesByDependencies,
} from '../utils/sort-nodes-by-dependencies'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

type MESSAGE_ID = 'unexpectedEnumsDependencyOrder' | 'unexpectedEnumsOrder'

export type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    partitionByNewLine: boolean
    forceNumericSort: boolean
    order: 'desc' | 'asc'
    sortByValue: boolean
    ignoreCase: boolean
  }>,
]

const defaultOptions: Required<Options[0]> = {
  partitionByComment: false,
  partitionByNewLine: false,
  type: 'alphabetical',
  ignoreCase: true,
  specialCharacters: 'keep',
  order: 'asc',
  sortByValue: false,
  forceNumericSort: false,
  locales: 'en-US',
}

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-enums',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted TypeScript enums.',
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
          sortByValue: {
            description: 'Compare enum values instead of names.',
            type: 'boolean',
          },
          forceNumericSort: {
            description:
              'Will always sort numeric enums by their value regardless of the sort type specified.',
            type: 'boolean',
          },
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the members of enums into logical groups.',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedEnumsOrder: 'Expected "{{right}}" to come before "{{left}}".',
      unexpectedEnumsDependencyOrder:
        'Expected dependency "{{right}}" to come before "{{nodeDependentOnRight}}".',
    },
  },
  defaultOptions: [defaultOptions],
  create: context => ({
    TSEnumDeclaration: node => {
      let getMembers = (nodeValue: TSESTree.TSEnumDeclaration) =>
        /* v8 ignore next 2 */
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        node.body?.members ?? nodeValue.members ?? []
      let members = getMembers(node)
      if (
        members.length > 1 &&
        members.every(({ initializer }) => initializer)
      ) {
        let settings = getSettings(context.settings)

        let options = complete(context.options.at(0), settings, defaultOptions)

        let sourceCode = getSourceCode(context)
        let partitionComment = options.partitionByComment

        let extractDependencies = (
          expression: TSESTree.Expression,
          enumName: string,
        ): string[] => {
          let dependencies: string[] = []

          let checkNode = (nodeValue: TSESTree.Node) => {
            if (
              nodeValue.type === 'MemberExpression' &&
              nodeValue.object.type === 'Identifier' &&
              nodeValue.object.name === enumName &&
              nodeValue.property.type === 'Identifier'
            ) {
              /**
               * enum Enum {
               *   A = 1,
               *   B = Enum.A
               * }
               */
              dependencies.push(nodeValue.property.name)
            } else if (nodeValue.type === 'Identifier') {
              /**
               * enum Enum {
               *   A = 1,
               *   B = A
               * }
               */
              dependencies.push(nodeValue.name)
            }

            if ('left' in nodeValue) {
              checkNode(nodeValue.left)
            }

            if ('right' in nodeValue) {
              checkNode(nodeValue.right)
            }

            if ('expressions' in nodeValue) {
              nodeValue.expressions.forEach(checkNode)
            }
          }

          checkNode(expression)
          return dependencies
        }

        let formattedMembers: SortingNodeWithDependencies[][] = members.reduce(
          (accumulator: SortingNodeWithDependencies[][], member) => {
            let dependencies: string[] = []
            if (member.initializer) {
              dependencies = extractDependencies(
                member.initializer,
                node.id.name,
              )
            }
            let lastSortingNode = accumulator.at(-1)?.at(-1)
            let sortingNode: SortingNodeWithDependencies = {
              size: rangeToDiff(member, sourceCode),
              node: member,
              dependencies,
              name:
                member.id.type === 'Literal'
                  ? `${member.id.value}`
                  : `${sourceCode.getText(member.id)}`,
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

            accumulator.at(-1)!.push(sortingNode)
            return accumulator
          },
          [[]],
        )
        let isNumericEnum = members.every(
          member =>
            member.initializer?.type === 'Literal' &&
            typeof member.initializer.value === 'number',
        )

        let compareOptions: CompareOptions = {
          // If the enum is numeric, and we sort by value, always use the `natural` sort type, which will correctly sort them.
          type:
            isNumericEnum && (options.forceNumericSort || options.sortByValue)
              ? 'natural'
              : options.type,
          order: options.order,
          ignoreCase: options.ignoreCase,
          specialCharacters: options.specialCharacters,
          locales: options.locales,
          // Get the enum value rather than the name if needed
          nodeValueGetter:
            options.sortByValue || (isNumericEnum && options.forceNumericSort)
              ? sortingNode => {
                  if (
                    sortingNode.node.type === 'TSEnumMember' &&
                    sortingNode.node.initializer?.type === 'Literal'
                  ) {
                    return sortingNode.node.initializer.value?.toString() ?? ''
                  }
                  return ''
                }
              : undefined,
        }
        let sortedNodes = sortNodesByDependencies(
          formattedMembers
            .map(nodes => sortNodes(nodes, compareOptions))
            .flat(),
        )
        let nodes = formattedMembers.flat()
        pairwise(nodes, (left, right) => {
          let indexOfLeft = sortedNodes.indexOf(left)
          let indexOfRight = sortedNodes.indexOf(right)
          if (indexOfLeft > indexOfRight) {
            let firstUnorderedNodeDependentOnRight =
              getFirstUnorderedNodeDependentOn(right, nodes)
            context.report({
              messageId: firstUnorderedNodeDependentOnRight
                ? 'unexpectedEnumsDependencyOrder'
                : 'unexpectedEnumsOrder',
              data: {
                left: toSingleLine(left.name),
                right: toSingleLine(right.name),
                nodeDependentOnRight: firstUnorderedNodeDependentOnRight?.name,
              },
              node: right.node,
              fix: fixer =>
                makeFixes(fixer, nodes, sortedNodes, sourceCode, options),
            })
          }
        })
      }
    },
  }),
})
