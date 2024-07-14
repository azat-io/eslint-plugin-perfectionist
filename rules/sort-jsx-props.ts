import type { TSESTree } from '@typescript-eslint/types'

import { minimatch } from 'minimatch'
import path from 'node:path'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { rangeToDiff } from '../utils/range-to-diff'
import { isPositive } from '../utils/is-positive'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { sortNodes } from '../utils/sort-nodes'
import { pairwise } from '../utils/pairwise'
import { complete } from '../utils/complete'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedJSXPropsOrder'

type Group<T extends string[]> =
  | 'multiline'
  | 'shorthand'
  | 'unknown'
  | T[number]

type Options<T extends string[]> = [
  Partial<{
    customGroups: { [key in T[number]]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    groups: (Group<T>[] | Group<T>)[]
    ignorePattern: string[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export const RULE_NAME = 'sort-jsx-props'

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted JSX props',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          customGroups: {
            type: 'object',
          },
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
          groups: {
            type: 'array',
          },
          ignoreCase: {
            type: 'boolean',
            default: true,
          },
          ignorePattern: {
            items: {
              type: 'string',
            },
            type: 'array',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedJSXPropsOrder: 'Expected "{{right}}" to come before "{{left}}"',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
    },
  ],
  create: context => {
    if (
      ['.svelte', '.astro', '.vue'].includes(path.extname(context.filename))
    ) {
      return {}
    }
    return {
      JSXElement: node => {
        if (node.openingElement.attributes.length > 1) {
          let options = complete(context.options.at(0), {
            type: 'alphabetical',
            ignorePattern: [],
            ignoreCase: true,
            customGroups: {},
            order: 'asc',
            groups: [],
          } as const)

          let shouldIgnore = false
          if (options.ignorePattern.length) {
            let tagName = context.sourceCode.text.slice(
              ...node.openingElement.name.range,
            )
            shouldIgnore = options.ignorePattern.some(pattern =>
              minimatch(tagName, pattern),
            )
          }

          if (!shouldIgnore && node.openingElement.attributes.length > 1) {
            let parts: SortingNode[][] = node.openingElement.attributes.reduce(
              (
                accumulator: SortingNode[][],
                attribute: TSESTree.JSXSpreadAttribute | TSESTree.JSXAttribute,
              ) => {
                if (attribute.type === 'JSXSpreadAttribute') {
                  accumulator.push([])
                  return accumulator
                }

                let name =
                  attribute.name.type === 'JSXNamespacedName'
                    ? `${attribute.name.namespace.name}:${attribute.name.name.name}`
                    : attribute.name.name

                let { getGroup, defineGroup, setCustomGroups } = useGroups(
                  options.groups,
                )

                setCustomGroups(options.customGroups, name)

                if (attribute.value === null) {
                  defineGroup('shorthand')
                }

                if (attribute.loc.start.line !== attribute.loc.end.line) {
                  defineGroup('multiline')
                }

                let jsxNode = {
                  size: rangeToDiff(attribute.range),
                  group: getGroup(),
                  node: attribute,
                  name,
                }

                accumulator.at(-1)!.push(jsxNode)

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
                  (leftNum === rightNum &&
                    isPositive(compare(left, right, options)))
                ) {
                  context.report({
                    messageId: 'unexpectedJSXPropsOrder',
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
                        let groupNum = getGroupNumber(
                          options.groups,
                          currentNode,
                        )

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

                      return makeFixes(
                        fixer,
                        nodes,
                        sortedNodes,
                        context.sourceCode,
                      )
                    },
                  })
                }
              })
            }
          }
        }
      },
    }
  },
})
