import type { SortingNode } from '../typings'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  ignoreCaseJsonSchema,
  localesJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isPositive } from '../utils/is-positive'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedNamedImportsOrder'

type Options = [
  Partial<{
    groupKind: 'values-first' | 'types-first' | 'mixed'
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreAlias: boolean
    ignoreCase: boolean
  }>,
]

const defaultOptions: Required<Options[0]> = {
  type: 'alphabetical',
  ignoreAlias: false,
  groupKind: 'mixed',
  ignoreCase: true,
  specialCharacters: 'keep',
  partitionByNewLine: false,
  partitionByComment: false,
  order: 'asc',
  locales: 'en-US',
}

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-named-imports',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted named imports.',
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
          ignoreAlias: {
            description: 'Controls whether to ignore alias names.',
            type: 'boolean',
          },
          groupKind: {
            description: 'Specifies top-level groups.',
            enum: ['mixed', 'values-first', 'types-first'],
            type: 'string',
          },
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the named imports members into logical groups.',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedNamedImportsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [defaultOptions],
  create: context => ({
    ImportDeclaration: node => {
      let specifiers = node.specifiers.filter(
        ({ type }) => type === 'ImportSpecifier',
      )
      if (specifiers.length <= 1) {
        return
      }

      let settings = getSettings(context.settings)
      let options = complete(context.options.at(0), settings, defaultOptions)
      let sourceCode = getSourceCode(context)
      let partitionComment = options.partitionByComment
      let formattedMembers: SortingNode[][] = [[]]
      for (let specifier of specifiers) {
        let group: undefined | 'value' | 'type'
        let { name } = specifier.local

        if (specifier.type === 'ImportSpecifier' && options.ignoreAlias) {
          if (specifier.imported.type === 'Identifier') {
            ;({ name } = specifier.imported)
          } else {
            name = specifier.imported.value
          }
        }

        if (
          specifier.type === 'ImportSpecifier' &&
          specifier.importKind === 'type'
        ) {
          group = 'type'
        } else {
          group = 'value'
        }

        let lastSortingNode = formattedMembers.at(-1)?.at(-1)
        let sortingNode: SortingNode = {
          size: rangeToDiff(specifier, sourceCode),
          node: specifier,
          group,
          name,
        }

        if (
          (partitionComment &&
            hasPartitionComment(
              partitionComment,
              getCommentsBefore(specifier, sourceCode),
            )) ||
          (options.partitionByNewLine &&
            lastSortingNode &&
            getLinesBetween(sourceCode, lastSortingNode, sortingNode))
        ) {
          formattedMembers.push([])
        }

        formattedMembers.at(-1)!.push(sortingNode)
      }
      let shouldGroupByKind = options.groupKind !== 'mixed'
      let groupKindOrder =
        options.groupKind === 'values-first'
          ? ['value', 'type']
          : ['type', 'value']
      for (let nodes of formattedMembers) {
        pairwise(nodes, (left, right) => {
          let leftNum = getGroupNumber(groupKindOrder, left)
          let rightNum = getGroupNumber(groupKindOrder, right)
          if (
            (shouldGroupByKind && leftNum > rightNum) ||
            ((!shouldGroupByKind || leftNum === rightNum) &&
              isPositive(compare(left, right, options)))
          ) {
            let sortedNodes = shouldGroupByKind
              ? groupKindOrder
                  .map(group => nodes.filter(n => n.group === group))
                  .map(groupedNodes => sortNodes(groupedNodes, options))
                  .flat()
              : sortNodes(nodes, options)

            context.report({
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                left: left.name,
                right: right.name,
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
