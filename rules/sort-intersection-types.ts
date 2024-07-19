import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { isPositive } from '../utils/is-positive'
import { sortNodes } from '../utils/sort-nodes'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedIntersectionTypesOrder'

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

export const RULE_NAME = 'sort-intersection-types'

export default createEslintRule<Options, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted intersection types',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: {
            enum: ['alphabetical', 'natural', 'line-length'],
            default: 'alphabetical',
            type: 'string',
          },
          order: {
            enum: ['asc', 'desc'],
            default: 'asc',
            type: 'string',
          },
          ignoreCase: {
            type: 'boolean',
            default: true,
          },
          groups: {
            type: 'array',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedIntersectionTypesOrder:
        'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
    },
  ],
  create: context => ({
    TSIntersectionType: node => {
      let options = complete(context.options.at(0), {
        type: 'alphabetical',
        ignoreCase: true,
        order: 'asc',
        groups: [],
      } as const)

      let sourceCode = getSourceCode(context)

      let nodes: SortingNode[] = node.types.map(type => {
        let { getGroup, defineGroup } = useGroups(options.groups)

        switch (type.type) {
          case 'TSConditionalType':
            defineGroup('conditional')
            break
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
          case 'TSUnknownKeyword':
          case 'TSVoidKeyword':
            defineGroup('keyword')
            break
          case 'TSLiteralType':
            defineGroup('literal')
            break
          case 'TSTypeReference':
          case 'TSIndexedAccessType':
            defineGroup('named')
            break
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
            messageId: 'unexpectedIntersectionTypesOrder',
            data: {
              left: toSingleLine(left.name),
              right: toSingleLine(right.name),
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
