import type { SortingNode } from '../typings'

import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isPositive } from '../utils/is-positive'
import { useGroups } from '../utils/use-groups'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

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
    groups: (Group[] | Group)[]
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

      let nodes: SortingNode[] = node.types.map(type => {
        let { getGroup, defineGroup } = useGroups(options.groups)

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

        return {
          name: sourceCode.text.slice(...type.range),
          size: rangeToDiff(type.range),
          group: getGroup(),
          node: type,
        }
      })

      pairwise(nodes, (left, right) => {
        let leftNum = getGroupNumber(options.groups, left)
        let rightNum = getGroupNumber(options.groups, right)

        if (
          leftNum > rightNum ||
          (leftNum === rightNum && isPositive(compare(left, right, options)))
        ) {
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
            fix: fixer => {
              let grouped: {
                [key: string]: SortingNode[]
              } = {}

              for (let currentNode of nodes) {
                let groupNum = getGroupNumber(options.groups, currentNode)

                if (!(groupNum in grouped)) {
                  grouped[groupNum] = [currentNode]
                } else {
                  grouped[groupNum] = sortNodes(
                    [...grouped[groupNum], currentNode],
                    options,
                  )
                }
              }

              let sortedNodes: SortingNode[] = []

              for (let group of Object.keys(grouped).sort(
                (a, b) => Number(a) - Number(b),
              )) {
                sortedNodes.push(...sortNodes(grouped[group], options))
              }

              return makeFixes(fixer, nodes, sortedNodes, sourceCode)
            },
          })
        }
      })
    },
  }),
})
