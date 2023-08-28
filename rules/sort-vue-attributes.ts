import type { TSESTree } from '@typescript-eslint/types'
import type { AST } from 'vue-eslint-parser'

import path from 'path'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { rangeToDiff } from '../utils/range-to-diff'
import { SortOrder, SortType } from '../typings'
import { useGroups } from '../utils/use-groups'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedVueAttributesOrder'

type Group<T extends string[]> =
  | 'multiline'
  | 'shorthand'
  | 'unknown'
  | T[number]

type Options<T extends string[]> = [
  Partial<{
    'custom-groups': { [key in T[number]]: string[] | string }
    groups: (Group<T>[] | Group<T>)[]
    'ignore-case': boolean
    order: SortOrder
    type: SortType
  }>,
]

export const RULE_NAME = 'sort-vue-attributes'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted Vue attributes',
      recommended: false,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          'custom-groups': {
            type: 'object',
          },
          type: {
            enum: [
              SortType.alphabetical,
              SortType.natural,
              SortType['line-length'],
            ],
            default: SortType.alphabetical,
          },
          order: {
            enum: [SortOrder.asc, SortOrder.desc],
            default: SortOrder.asc,
          },
          'ignore-case': {
            type: 'boolean',
            default: false,
          },
          groups: {
            type: 'array',
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedVueAttributesOrder:
        'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: SortType.alphabetical,
      order: SortOrder.asc,
    },
  ],
  create: context => {
    if (path.extname(context.getFilename()) !== '.vue') {
      return {}
    }

    if (!('defineTemplateBodyVisitor' in context.parserServices!)) {
      return {}
    }

    let { defineTemplateBodyVisitor } = context.parserServices as unknown as {
      defineTemplateBodyVisitor: (mapper: {
        [key: string]: (node: AST.VStartTag) => void
      }) => {}
    }

    return defineTemplateBodyVisitor({
      VStartTag: (node: AST.VStartTag) => {
        if (node.attributes.length > 1) {
          let options = complete(context.options.at(0), {
            type: SortType.alphabetical,
            order: SortOrder.asc,
            'ignore-case': false,
            'custom-groups': {},
            groups: [],
          })

          let source = context.getSourceCode()

          let parts: SortingNode[][] = node.attributes.reduce(
            (accumulator: SortingNode[][], attribute) => {
              if (
                attribute.key.type === 'VDirectiveKey' &&
                attribute.key.name.rawName === 'bind'
              ) {
                accumulator.push([])
                return accumulator
              }

              let name: string

              let { getGroup, defineGroup, setCustomGroups } = useGroups(
                options.groups,
              )

              if (
                typeof attribute.key.name === 'string' &&
                attribute.key.type !== 'VDirectiveKey'
              ) {
                name = attribute.key.rawName
              } else {
                name = source.text.slice(...attribute.key.range)
              }

              setCustomGroups(options['custom-groups'], name)

              if (attribute.value === null) {
                defineGroup('shorthand')
              }

              if (attribute.loc.start.line !== attribute.loc.end.line) {
                defineGroup('multiline')
              }

              accumulator.at(-1)!.push({
                size: rangeToDiff(attribute.range),
                node: attribute as unknown as TSESTree.Node,
                group: getGroup(),
                name,
              })

              return accumulator
            },
            [[]],
          )

          for (let nodes of parts) {
            pairwise(nodes, (left, right) => {
              let leftNum = getGroupNumber(options.groups, left)
              let rightNum = getGroupNumber(options.groups, right)

              if (
                leftNum > rightNum ||
                (leftNum === rightNum && compare(left, right, options))
              ) {
                context.report({
                  messageId: 'unexpectedVueAttributesOrder',
                  data: {
                    left: left.name,
                    right: right.name,
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

                    for (let group of Object.keys(grouped).sort()) {
                      sortedNodes.push(...sortNodes(grouped[group], options))
                    }

                    return makeFixes(fixer, nodes, sortedNodes, source)
                  },
                })
              }
            })
          }
        }
      },
    })
  },
})
