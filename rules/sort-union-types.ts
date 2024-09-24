import type { SortingNode } from '../typings'

import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getCommentsBefore } from '../utils/get-comments-before'
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

type MESSAGE_ID = 'unexpectedUnionTypesGroupOrder' | 'unexpectedUnionTypesOrder'

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
    matcher: 'minimatch' | 'regex'
    groups: (Group[] | Group)[]
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-union-types',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted union types.',
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
              'Allows you to use comments to separate the union types into logical groups.',
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
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedUnionTypesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedUnionTypesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
      matcher: 'minimatch',
      partitionByNewLine: false,
      partitionByComment: false,
      groups: [],
    },
  ],
  create: context => ({
    TSUnionType: node => {
      let settings = getSettings(context.settings)

      let options = complete(context.options.at(0), settings, {
        type: 'alphabetical',
        ignoreCase: true,
        order: 'asc',
        groups: [],
        matcher: 'minimatch',
        partitionByNewLine: false,
        partitionByComment: false,
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

      let sourceCode = getSourceCode(context)
      let partitionComment = options.partitionByComment

      let formattedMembers: SortingNode[][] = node.types.reduce(
        (accumulator: SortingNode[][], type) => {
          let { getGroup, defineGroup } = useGroups(options)

          switch (type.type) {
            case 'TSConditionalType':
              defineGroup('conditional')
              break
            case 'TSConstructorType':
            case 'TSFunctionType':
              defineGroup('function')
              break
            case 'TSImportType':
              defineGroup('import')
              break
            case 'TSIntersectionType':
              defineGroup('intersection')
              break
            case 'TSAnyKeyword':
            case 'TSBigIntKeyword':
            case 'TSBooleanKeyword':
            case 'TSNeverKeyword':
            case 'TSNumberKeyword':
            case 'TSObjectKeyword':
            case 'TSStringKeyword':
            case 'TSSymbolKeyword':
            case 'TSThisType':
            case 'TSUnknownKeyword':
            case 'TSIntrinsicKeyword':
              defineGroup('keyword')
              break
            case 'TSLiteralType':
            case 'TSTemplateLiteralType':
              defineGroup('literal')
              break
            case 'TSArrayType':
            case 'TSIndexedAccessType':
            case 'TSInferType':
            case 'TSTypeReference':
            case 'TSQualifiedName':
              defineGroup('named')
              break
            case 'TSMappedType':
            case 'TSTypeLiteral':
              defineGroup('object')
              break
            case 'TSTypeQuery':
            case 'TSTypeOperator':
              defineGroup('operator')
              break
            case 'TSTupleType':
              defineGroup('tuple')
              break
            case 'TSUnionType':
              defineGroup('union')
              break
            case 'TSNullKeyword':
            case 'TSUndefinedKeyword':
            case 'TSVoidKeyword':
              defineGroup('nullish')
              break
          }

          let lastSortingNode = accumulator.at(-1)?.at(-1)
          let sortingNode: SortingNode = {
            name: sourceCode.text.slice(...type.range),
            size: rangeToDiff(type.range),
            group: getGroup(),
            node: type,
          }
          if (
            (partitionComment &&
              hasPartitionComment(
                partitionComment,
                getCommentsBefore(type, sourceCode),
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
          let indexOfLeft = sortedNodes.indexOf(left)
          let indexOfRight = sortedNodes.indexOf(right)
          if (indexOfLeft > indexOfRight) {
            let leftNum = getGroupNumber(options.groups, left)
            let rightNum = getGroupNumber(options.groups, right)
            context.report({
              messageId:
                leftNum !== rightNum
                  ? 'unexpectedUnionTypesGroupOrder'
                  : 'unexpectedUnionTypesOrder',
              data: {
                left: toSingleLine(left.name),
                leftGroup: left.group,
                right: toSingleLine(right.name),
                rightGroup: right.group,
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
