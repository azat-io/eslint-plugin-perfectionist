import type { SortingNode } from '../typings'

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
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

type MESSAGE_ID =
  | 'missedSpacingBetweenIntersectionTypes'
  | 'unexpectedIntersectionTypesGroupOrder'
  | 'extraSpacingBetweenIntersectionTypes'
  | 'unexpectedIntersectionTypesOrder'

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
    matcher: 'minimatch' | 'regex'
    groups: (Group[] | Group)[]
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-intersection-types',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted intersection types.',
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
          matcher: {
            description: 'Specifies the string matcher.',
            type: 'string',
            enum: ['minimatch', 'regex'],
          },
          ignoreCase: {
            description:
              'Controls whether sorting should be case-sensitive or not.',
            type: 'boolean',
          },
          specialCharacters: {
            description:
              'Controls how special characters should be handled before sorting.',
            type: 'string',
            enum: ['remove', 'trim', 'keep'],
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
          partitionByComment: {
            description:
              'Allows you to use comments to separate the intersection types members into logical groups.',
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
          newlinesBetween: {
            description:
              'Specifies how new lines should be handled between object types groups.',
            enum: ['ignore', 'always', 'never'],
            type: 'string',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedIntersectionTypesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedIntersectionTypesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
      missedSpacingBetweenIntersectionTypes:
        'Missed spacing between "{{left}}" and "{{right}}" types.',
      extraSpacingBetweenIntersectionTypes:
        'Extra spacing between "{{left}}" and "{{right}}" types.',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
      specialCharacters: 'keep',
      matcher: 'minimatch',
      partitionByNewLine: false,
      partitionByComment: false,
      groups: [],
    },
  ],
  create: context => ({
    TSIntersectionType: node => {
      let settings = getSettings(context.settings)

      let options = complete(context.options.at(0), settings, {
        type: 'alphabetical',
        ignoreCase: true,
        specialCharacters: 'keep',
        order: 'asc',
        matcher: 'minimatch',
        newlinesBetween: 'ignore',
        partitionByComment: false,
        partitionByNewLine: false,
        groups: [],
      } as const)

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
      let partitionComment = options.partitionByComment

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
            node: type,
          }
          if (
            (partitionComment &&
              hasPartitionComment(
                partitionComment,
                getCommentsBefore(type, sourceCode, '&'),
                options.matcher,
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
        let sortedNodes = sortNodesByGroups(nodes, options)

        pairwise(nodes, (left, right) => {
          let leftNum = getGroupNumber(options.groups, left)
          let rightNum = getGroupNumber(options.groups, right)

          let indexOfLeft = sortedNodes.indexOf(left)
          let indexOfRight = sortedNodes.indexOf(right)

          let messageIds: MESSAGE_ID[] = []

          if (indexOfLeft > indexOfRight) {
            messageIds.push(
              leftNum !== rightNum
                ? 'unexpectedIntersectionTypesGroupOrder'
                : 'unexpectedIntersectionTypesOrder',
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
              missedSpacingError: 'missedSpacingBetweenIntersectionTypes',
              extraSpacingError: 'extraSpacingBetweenIntersectionTypes',
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
    },
  }),
})
