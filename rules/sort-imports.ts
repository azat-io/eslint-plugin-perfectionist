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
import { TSConfig } from '../utils/read-ts-config'
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

type Group =
  | 'internal-type'
  | 'sibling-type'
  | 'side-effect'
  | 'parent-type'
  | 'index-type'
  | 'external'
  | 'internal'
  | 'builtin'
  | 'unknown'
  | 'sibling'
  | 'object'
  | 'parent'
  | 'style'
  | 'index'
  | 'type'

type Options = [
  Partial<{
    'newlines-between': NewlinesBetweenValue
    'internal-pattern': string[]
    groups: (Group[] | Group)[]
    'read-tsconfig': boolean
    'ignore-case': boolean
    order: SortOrder
    type: SortType
  }>,
]

export const RULE_NAME = 'sort-imports'

type ModuleDeclaration =
  | TSESTree.TSImportEqualsDeclaration
  | TSESTree.ImportDeclaration

type SortingNodeWithGroup = SortingNode & { group: Group }

export default createEslintRule<Options, MESSAGE_ID>({
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
          'read-tsconfig': {
            type: 'boolean',
            default: false,
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
      'internal-pattern': ['~/**'],
      type: SortType.alphabetical,
      'read-tsconfig': false,
      order: SortOrder.asc,
      'ignore-case': false,
      groups: [],
    })

    let tsPaths: string[] = []

    if (options['read-tsconfig']) {
      let tsConfig = TSConfig.get()

      if (tsConfig.compilerOptions?.paths) {
        Object.keys(tsConfig.compilerOptions.paths).forEach(path => {
          tsPaths.push(path)
        })
      }
    }

    let source = context.getSourceCode()

    let nodes: SortingNodeWithGroup[] = []

    let computeGroup = (node: ModuleDeclaration): Group => {
      let group: undefined | Group

      let isStyle = (value: string) =>
        ['.less', '.scss', '.sass', '.pcss', '.css', '.sss'].some(extension =>
          value.endsWith(extension),
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

      let defineGroup = (nodeGroup: Group) => {
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

      if (node.importKind === 'type') {
        if (node.type === AST_NODE_TYPES.ImportDeclaration) {
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

        defineGroup('type')
      }

      if (!group && node.type === AST_NODE_TYPES.ImportDeclaration) {
        if (isCoreModule(node.source.value)) {
          defineGroup('builtin')
        }

        if (isInternal(node)) {
          defineGroup('internal')
        }

        if (isStyle(node.source.value)) {
          defineGroup('style')
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
        let getGroupNumber = (node: SortingNodeWithGroup): number => {
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
          nodesToFix: SortingNodeWithGroup[],
        ): TSESLint.RuleFix[] => {
          let fixes: TSESLint.RuleFix[] = []

          let grouped = nodesToFix.reduce(
            (
              accumulator: {
                [key: string]: SortingNodeWithGroup[]
              },
              node,
            ) => {
              let groupNum = getGroupNumber(node)

              if (!(groupNum in accumulator)) {
                accumulator[groupNum] = [node]
              } else {
                accumulator[groupNum] = sortNodes(
                  [...accumulator[groupNum], node],
                  options,
                )
              }

              return accumulator
            },
            {},
          )

          let formatted = Object.keys(grouped)
            .sort()
            .reduce(
              (accumulator: SortingNodeWithGroup[], group: string) => [
                ...accumulator,
                ...grouped[group],
              ],
              [],
            )

          formatted.forEach((node, i) => {
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
          })

          return fixes
        }

        let splittedNodes = nodes.reduce(
          (
            accumulator: SortingNodeWithGroup[][],
            node: SortingNodeWithGroup,
          ) => {
            let lastNode = accumulator.at(-1)?.at(-1)

            if (lastNode && hasContentBetweenNodes(lastNode, node)) {
              accumulator.push([node])
            } else {
              accumulator.at(-1)!.push(node)
            }

            return accumulator
          },
          [[]],
        )

        splittedNodes.forEach(nodeList => {
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
        })
      },
    }
  },
})
