import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/types'
import isCoreModule from 'is-core-module'
import { minimatch } from 'minimatch'

import type { SortingNode } from '../typings'

import { getCommentBefore } from '../utils/get-comment-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getNodeRange } from '../utils/get-node-range'
import { rangeToDiff } from '../utils/range-to-diff'
import { SortOrder, SortType } from '../typings'
import { sortNodes } from '../utils/sort-nodes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID =
  | 'missedSpacingBetweenImports'
  | 'extraSpacingBetweenImports'
  | 'unexpectedImportsOrder'

export enum NewlinesBetweenValue {
  'ignore' = 'ignore',
  'always' = 'always',
  'never' = 'never',
}

type Group<T extends string[]> =
  | 'external-type'
  | 'internal-type'
  | 'builtin-type'
  | 'sibling-type'
  | 'parent-type'
  | 'side-effect'
  | 'index-type'
  | 'internal'
  | 'external'
  | T[number]
  | 'sibling'
  | 'unknown'
  | 'builtin'
  | 'parent'
  | 'object'
  | 'index'
  | 'style'
  | 'type'

type Options<T extends string[]> = [
  Partial<{
    'custom-groups': {
      value?: { [key in T[number]]: string[] | string }
      type?: { [key in T[number]]: string[] | string }
    }
    'newlines-between': NewlinesBetweenValue
    groups: (Group<T>[] | Group<T>)[]
    'internal-pattern': string[]
    'ignore-case': boolean
    order: SortOrder
    type: SortType
  }>,
]

export const RULE_NAME = 'sort-imports'

type ModuleDeclaration =
  | TSESTree.TSImportEqualsDeclaration
  | TSESTree.ImportDeclaration

type SortingNodeWithGroup<T extends string[]> = SortingNode & {
  group: Group<T>
}

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce sorted imports',
      recommended: false,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          'custom-groups': {
            type: 'object',
            properties: {
              type: {
                type: 'object',
              },
              value: {
                type: 'object',
              },
            },
            additionalProperties: false,
          },
          type: {
            enum: [
              SortType.alphabetical,
              SortType.natural,
              SortType['line-length'],
            ],
            default: SortType.natural,
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
          'internal-pattern': {
            type: 'array',
            default: ['~/**'],
          },
          'newlines-between': {
            enum: [
              NewlinesBetweenValue.ignore,
              NewlinesBetweenValue.always,
              NewlinesBetweenValue.never,
            ],
            default: NewlinesBetweenValue.always,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedImportsOrder: 'Expected "{{right}}" to come before "{{left}}"',
      missedSpacingBetweenImports:
        'Missed spacing between "{{left}}" and "{{right}}" imports',
      extraSpacingBetweenImports:
        'Extra spacing between "{{left}}" and "{{right}}" imports',
    },
  },
  defaultOptions: [
    {
      type: SortType.alphabetical,
      order: SortOrder.asc,
    },
  ],
  create: context => {
    let options = complete(context.options.at(0), {
      'newlines-between': NewlinesBetweenValue.always,
      'custom-groups': { type: {}, value: {} },
      'internal-pattern': ['~/**'],
      type: SortType.alphabetical,
      order: SortOrder.asc,
      'ignore-case': false,
      groups: [],
    })

    let tsPaths: string[] = []

    let source = context.getSourceCode()

    let nodes: SortingNodeWithGroup<string[]>[] = []

    let computeGroup = (node: ModuleDeclaration): Group<string[]> => {
      let group: Group<string[]> | undefined

      let isStyle = (value: string) =>
        ['.less', '.scss', '.sass', '.styl', '.pcss', '.css', '.sss'].some(
          extension => value.endsWith(extension),
        )

      let isIndex = (value: string) =>
        [
          './index.d.js',
          './index.d.ts',
          './index.js',
          './index.ts',
          './index',
          './',
          '.',
        ].includes(value)

      let isParent = (value: string) => value.indexOf('..') === 0

      let isSibling = (value: string) => value.indexOf('./') === 0

      let defineGroup = (nodeGroup: Group<string[]>) => {
        if (!group && options.groups.flat().includes(nodeGroup)) {
          group = nodeGroup
        }
      }

      let isInternal = (nodeElement: TSESTree.ImportDeclaration) =>
        (options['internal-pattern'].length &&
          options['internal-pattern'].some(pattern =>
            minimatch(nodeElement.source.value, pattern),
          )) ||
        tsPaths.some(pattern => minimatch(nodeElement.source.value, pattern))

      let determineCustomGroup = (
        groupType: 'value' | 'type',
        value: string,
      ) => {
        for (let [key, pattern] of Object.entries(
          options['custom-groups'][groupType] ?? {},
        )) {
          if (
            Array.isArray(pattern) &&
            pattern.some(patternValue => minimatch(value, patternValue))
          ) {
            defineGroup(key)
          }

          if (typeof pattern === 'string' && minimatch(value, pattern)) {
            defineGroup(key)
          }
        }
      }

      if (node.importKind === 'type') {
        if (node.type === AST_NODE_TYPES.ImportDeclaration) {
          determineCustomGroup('type', node.source.value)

          if (isCoreModule(node.source.value)) {
            defineGroup('builtin-type')
          }

          if (isInternal(node)) {
            defineGroup('internal-type')
          }

          if (isIndex(node.source.value)) {
            defineGroup('index-type')
          }

          if (isParent(node.source.value)) {
            defineGroup('parent-type')
          }

          if (isSibling(node.source.value)) {
            defineGroup('sibling-type')
          }
        }

        defineGroup('external-type')
        defineGroup('type')
      }

      if (!group && node.type === AST_NODE_TYPES.ImportDeclaration) {
        determineCustomGroup('value', node.source.value)

        if (isCoreModule(node.source.value)) {
          defineGroup('builtin')
        }

        if (isInternal(node)) {
          defineGroup('internal')
        }

        if (isStyle(node.source.value)) {
          defineGroup('style')
        }

        if (node.specifiers.length === 0) {
          defineGroup('side-effect')
        }

        if (isIndex(node.source.value)) {
          defineGroup('index')
        }

        if (isParent(node.source.value)) {
          defineGroup('parent')
        }

        if (isSibling(node.source.value)) {
          defineGroup('sibling')
        }

        defineGroup('external')
      }

      return group ?? 'unknown'
    }

    let registerNode = (node: ModuleDeclaration) => {
      let name: string

      if (node.type === AST_NODE_TYPES.ImportDeclaration) {
        name = node.source.value
      } else {
        if (
          node.moduleReference.type ===
            AST_NODE_TYPES.TSExternalModuleReference &&
          node.moduleReference.expression.type === AST_NODE_TYPES.Literal
        ) {
          name = `${node.moduleReference.expression.value}`
        } else {
          name = source.text.slice(...node.moduleReference.range)
        }
      }

      nodes.push({
        size: rangeToDiff(node.range),
        group: computeGroup(node),
        name,
        node,
      })
    }

    return {
      TSImportEqualsDeclaration: registerNode,
      ImportDeclaration: registerNode,
      'Program:exit': () => {
        let getGroupNumber = (node: SortingNodeWithGroup<string[]>): number => {
          for (let i = 0, max = options.groups.length; i < max; i++) {
            let currentGroup = options.groups[i]

            if (
              node.group === currentGroup ||
              (Array.isArray(currentGroup) && currentGroup.includes(node.group))
            ) {
              return i
            }
          }
          return options.groups.length
        }

        let hasContentBetweenNodes = (
          left: SortingNode,
          right: SortingNode,
        ): boolean =>
          !!source.getTokensBetween(
            left.node,
            getCommentBefore(right.node, source) || right.node,
            {
              includeComments: true,
            },
          ).length

        let getLinesBetweenImports = (
          left: SortingNode,
          right: SortingNode,
        ) => {
          let linesBetweenImports = source.lines.slice(
            left.node.loc.end.line,
            right.node.loc.start.line - 1,
          )

          return linesBetweenImports.filter(line => !line.trim().length).length
        }

        let fix = (
          fixer: TSESLint.RuleFixer,
          nodesToFix: SortingNodeWithGroup<string[]>[],
        ): TSESLint.RuleFix[] => {
          let fixes: TSESLint.RuleFix[] = []

          let grouped: {
            [key: string]: SortingNodeWithGroup<string[]>[]
          } = {}

          for (let node of nodesToFix) {
            let groupNum = getGroupNumber(node)

            if (!(groupNum in grouped)) {
              grouped[groupNum] = [node]
            } else {
              grouped[groupNum] = sortNodes(
                [...grouped[groupNum], node],
                options,
              )
            }
          }

          let formatted = Object.keys(grouped)
            .sort()
            .reduce(
              (
                accumulator: SortingNodeWithGroup<string[]>[],
                group: string,
              ) => [...accumulator, ...grouped[group]],
              [],
            )

          for (let i = 0, max = formatted.length; i < max; i++) {
            let node = formatted.at(i)!

            fixes.push(
              fixer.replaceTextRange(
                getNodeRange(nodesToFix.at(i)!.node, source),
                source.text.slice(...getNodeRange(node.node, source)),
              ),
            )

            if (options['newlines-between'] !== 'ignore') {
              let nextNode = formatted.at(i + 1)

              if (nextNode) {
                let linesBetweenImports = getLinesBetweenImports(
                  nodesToFix.at(i)!,
                  nodesToFix.at(i + 1)!,
                )

                if (
                  (options['newlines-between'] === 'always' &&
                    getGroupNumber(node) === getGroupNumber(nextNode) &&
                    linesBetweenImports !== 0) ||
                  (options['newlines-between'] === 'never' &&
                    linesBetweenImports > 0)
                ) {
                  fixes.push(
                    fixer.removeRange([
                      getNodeRange(nodesToFix.at(i)!.node, source).at(1)!,
                      getNodeRange(nodesToFix.at(i + 1)!.node, source).at(0)! -
                        1,
                    ]),
                  )
                }

                if (
                  options['newlines-between'] === 'always' &&
                  getGroupNumber(node) !== getGroupNumber(nextNode) &&
                  linesBetweenImports > 1
                ) {
                  fixes.push(
                    fixer.replaceTextRange(
                      [
                        getNodeRange(nodesToFix.at(i)!.node, source).at(1)!,
                        getNodeRange(nodesToFix.at(i + 1)!.node, source).at(
                          0,
                        )! - 1,
                      ],
                      '\n',
                    ),
                  )
                }

                if (
                  options['newlines-between'] === 'always' &&
                  getGroupNumber(node) !== getGroupNumber(nextNode) &&
                  linesBetweenImports === 0
                ) {
                  fixes.push(
                    fixer.insertTextAfterRange(
                      getNodeRange(nodesToFix.at(i)!.node, source),
                      '\n',
                    ),
                  )
                }
              }
            }
          }

          return fixes
        }

        let splittedNodes: SortingNodeWithGroup<string[]>[][] = [[]]

        for (let node of nodes) {
          let lastNode = splittedNodes.at(-1)?.at(-1)

          if (lastNode && hasContentBetweenNodes(lastNode, node)) {
            splittedNodes.push([node])
          } else {
            splittedNodes.at(-1)!.push(node)
          }
        }

        for (let nodeList of splittedNodes) {
          pairwise(nodeList, (left, right) => {
            let leftNum = getGroupNumber(left)
            let rightNum = getGroupNumber(right)

            let numberOfEmptyLinesBetween = getLinesBetweenImports(left, right)

            if (
              !hasContentBetweenNodes(left, right) &&
              (leftNum > rightNum ||
                (leftNum === rightNum && compare(left, right, options)))
            ) {
              context.report({
                messageId: 'unexpectedImportsOrder',
                data: {
                  left: left.name,
                  right: right.name,
                },
                node: right.node,
                fix: fixer => fix(fixer, nodeList),
              })
            }

            if (
              options['newlines-between'] === 'never' &&
              numberOfEmptyLinesBetween > 0
            ) {
              context.report({
                messageId: 'extraSpacingBetweenImports',
                data: {
                  left: left.name,
                  right: right.name,
                },
                node: right.node,
                fix: fixer => fix(fixer, nodeList),
              })
            }

            if (options['newlines-between'] === 'always') {
              if (leftNum < rightNum && numberOfEmptyLinesBetween === 0) {
                context.report({
                  messageId: 'missedSpacingBetweenImports',
                  data: {
                    left: left.name,
                    right: right.name,
                  },
                  node: right.node,
                  fix: fixer => fix(fixer, nodeList),
                })
              } else if (
                numberOfEmptyLinesBetween > 1 ||
                (leftNum === rightNum && numberOfEmptyLinesBetween > 0)
              ) {
                context.report({
                  messageId: 'extraSpacingBetweenImports',
                  data: {
                    left: left.name,
                    right: right.name,
                  },
                  node: right.node,
                  fix: fixer => fix(fixer, nodeList),
                })
              }
            }
          })
        }
      },
    }
  },
})
