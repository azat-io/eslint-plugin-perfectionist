import type { SortingNode } from '../typings'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  newlinesBetweenJsonSchema,
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
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

type MESSAGE_ID =
  | 'missedSpacingBetweenUnionTypes'
  | 'unexpectedUnionTypesGroupOrder'
  | 'extraSpacingBetweenUnionTypes'
  | 'unexpectedUnionTypesOrder'

type Group =
  | 'intersection'
  | 'conditional'
  | 'function'
  | 'operator'
  | 'keyword'
  | 'literal'
  | 'nullish'
  | 'unknown'
  | 'import'
  | 'object'
  | 'named'
  | 'tuple'
  | 'union'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    newlinesBetween: 'ignore' | 'always' | 'never'
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    groups: (Group[] | Group)[]
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

let defaultOptions: Required<Options[0]> = {
  type: 'alphabetical',
  ignoreCase: true,
  specialCharacters: 'keep',
  order: 'asc',
  groups: [],
  newlinesBetween: 'ignore',
  partitionByNewLine: false,
  partitionByComment: false,
  locales: 'en-US',
}

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-union-types',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted union types.',
      url: 'https://perfectionist.dev/rules/sort-union-types',
      recommended: true,
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
          groups: groupsJsonSchema,
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the union types into logical groups.',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedUnionTypesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedUnionTypesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
      missedSpacingBetweenUnionTypes:
        'Missed spacing between "{{left}}" and "{{right}}" types.',
      extraSpacingBetweenUnionTypes:
        'Extra spacing between "{{left}}" and "{{right}}" types.',
    },
  },
  defaultOptions: [defaultOptions],
  create: context => ({
    TSUnionType: node => {
      let settings = getSettings(context.settings)

      let options = complete(context.options.at(0), settings, defaultOptions)

      validateGroupsConfiguration(
        options.groups,
        [
          'intersection',
          'conditional',
          'function',
          'operator',
          'keyword',
          'literal',
          'nullish',
          'unknown',
          'import',
          'object',
          'named',
          'tuple',
          'union',
        ],
        [],
      )
      validateNewlinesAndPartitionConfiguration(options)

      let sourceCode = getSourceCode(context)
      let eslintDisabledLines = getEslintDisabledLines({
        sourceCode,
        ruleName: context.id,
      })

      let formattedMembers: SortingNode[][] = node.types.reduce(
        (accumulator: SortingNode[][], type) => {
          let { getGroup, defineGroup } = useGroups(options)

          switch (type.type) {
            case 'TSTemplateLiteralType':
            case 'TSLiteralType':
              defineGroup('literal')
              break
            case 'TSIndexedAccessType':
            case 'TSTypeReference':
            case 'TSQualifiedName':
            case 'TSArrayType':
            case 'TSInferType':
              defineGroup('named')
              break
            case 'TSIntersectionType':
              defineGroup('intersection')
              break
            case 'TSUndefinedKeyword':
            case 'TSNullKeyword':
            case 'TSVoidKeyword':
              defineGroup('nullish')
              break
            case 'TSConditionalType':
              defineGroup('conditional')
              break
            case 'TSConstructorType':
            case 'TSFunctionType':
              defineGroup('function')
              break
            case 'TSBooleanKeyword':
            case 'TSUnknownKeyword':
            case 'TSBigIntKeyword':
            case 'TSNumberKeyword':
            case 'TSObjectKeyword':
            case 'TSStringKeyword':
            case 'TSSymbolKeyword':
            case 'TSNeverKeyword':
            case 'TSAnyKeyword':
            case 'TSThisType':
              defineGroup('keyword')
              break
            case 'TSTypeOperator':
            case 'TSTypeQuery':
              defineGroup('operator')
              break
            case 'TSTypeLiteral':
            case 'TSMappedType':
              defineGroup('object')
              break
            case 'TSImportType':
              defineGroup('import')
              break
            case 'TSTupleType':
              defineGroup('tuple')
              break
            case 'TSUnionType':
              defineGroup('union')
              break
          }

          let lastSortingNode = accumulator.at(-1)?.at(-1)
          let sortingNode: SortingNode = {
            name: sourceCode.getText(type),
            size: rangeToDiff(type, sourceCode),
            group: getGroup(),
            isEslintDisabled: isNodeEslintDisabled(type, eslintDisabledLines),
            node: type,
          }
          if (
            (options.partitionByComment &&
              hasPartitionComment(
                options.partitionByComment,
                getCommentsBefore(type, sourceCode, '|'),
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
        let sortNodesExcludingEslintDisabled = (
          ignoreEslintDisabledNodes: boolean,
        ): SortingNode[] =>
          sortNodesByGroups(nodes, options, { ignoreEslintDisabledNodes })
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
                ? 'unexpectedUnionTypesOrder'
                : 'unexpectedUnionTypesGroupOrder',
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
              missedSpacingError: 'missedSpacingBetweenUnionTypes',
              extraSpacingError: 'extraSpacingBetweenUnionTypes',
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
