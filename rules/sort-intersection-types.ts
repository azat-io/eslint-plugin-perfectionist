import type { SortingNode } from '../typings'

import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
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
  | 'unexpectedIntersectionTypesGroupOrder'
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
    groups: (Group[] | Group)[]
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
      unexpectedIntersectionTypesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedIntersectionTypesOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
      groups: ['unknown'],
    },
  ],
  create: context => ({
    TSIntersectionType: node => {
      let settings = getSettings(context.settings)

      let options = complete(context.options.at(0), settings, {
        type: 'alphabetical',
        ignoreCase: true,
        order: 'asc',
        groups: ['unknown'],
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
                ? 'unexpectedIntersectionTypesGroupOrder'
                : 'unexpectedIntersectionTypesOrder',
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
    },
  }),
})
