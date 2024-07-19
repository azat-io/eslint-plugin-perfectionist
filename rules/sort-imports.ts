import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { builtinModules } from 'node:module'
import { minimatch } from 'minimatch'

import type { SortingNode } from '../typings'

import { getCommentBefore } from '../utils/get-comment-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { getNodeRange } from '../utils/get-node-range'
import { rangeToDiff } from '../utils/range-to-diff'
import { isPositive } from '../utils/is-positive'
import { useGroups } from '../utils/use-groups'
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
  | 'side-effect-style'
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
    customGroups: {
      value?: { [key in T[number]]: string[] | string }
      type?: { [key in T[number]]: string[] | string }
    }
    type: 'alphabetical' | 'line-length' | 'natural'
    newlinesBetween: NewlinesBetweenValue
    groups: (Group<T>[] | Group<T>)[]
    environment: 'node' | 'bun'
    internalPattern: string[]
    maxLineLength?: number
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export const RULE_NAME = 'sort-imports'

type ModuleDeclaration =
  | TSESTree.TSImportEqualsDeclaration
  | TSESTree.ImportDeclaration

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted imports',
    },
    fixable: 'code',
    schema: [
      {
        id: 'sort-imports',
        type: 'object',
        properties: {
          customGroups: {
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
            default: [],
          },
          internalPattern: {
            items: {
              type: 'string',
            },
            type: 'array',
          },
          newlinesBetween: {
            enum: [
              NewlinesBetweenValue.ignore,
              NewlinesBetweenValue.always,
              NewlinesBetweenValue.never,
            ],
            default: NewlinesBetweenValue.always,
            type: 'string',
          },
          maxLineLength: {
            type: 'integer',
            minimum: 0,
            exclusiveMinimum: true,
          },
          environment: {
            enum: ['node', 'bun'],
            default: 'node',
            type: 'string',
          },
        },
        allOf: [
          {
            $ref: '#/definitions/max-line-length-requires-line-length-type',
          },
        ],
        additionalProperties: false,
        dependencies: {
          maxLineLength: ['type'],
        },
        definitions: {
          'is-line-length': {
            properties: {
              type: { enum: ['line-length'], type: 'string' },
            },
            required: ['type'],
            type: 'object',
          },
          'max-line-length-requires-line-length-type': {
            anyOf: [
              {
                not: {
                  required: ['maxLineLength'],
                  type: 'object',
                },
                type: 'object',
              },
              {
                $ref: '#/definitions/is-line-length',
              },
            ],
          },
        },
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
      type: 'alphabetical',
      order: 'asc',
    },
  ],
  create: context => {
    let options = complete(context.options.at(0), {
      newlinesBetween: NewlinesBetweenValue.always,
      customGroups: { type: {}, value: {} },
      internalPattern: ['~/**'],
      type: 'alphabetical',
      environment: 'node',
      ignoreCase: true,
      order: 'asc',
      groups: [],
    } as const)

    let sourceCode = getSourceCode(context)
    let hasUnknownGroup = false

    for (let group of options.groups) {
      if (Array.isArray(group)) {
        for (let subGroup of group) {
          if (subGroup === 'unknown') {
            hasUnknownGroup = true
          }
        }
      } else {
        if (group === 'unknown') {
          hasUnknownGroup = true
        }
      }
    }

    if (!hasUnknownGroup) {
      options.groups = [...options.groups, 'unknown']
    }

    let nodes: SortingNode[] = []

    let isSideEffectImport = (node: TSESTree.Node) =>
      node.type === 'ImportDeclaration' &&
      node.specifiers.length === 0 &&
      /* Avoid matching on named imports without specifiers */
      !/}\s*from\s+/.test(sourceCode.getText(node))

    let computeGroup = (node: ModuleDeclaration): Group<string[]> => {
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

      let { getGroup, defineGroup, setCustomGroups } = useGroups(options.groups)

      let isInternal = (nodeElement: TSESTree.ImportDeclaration) =>
        options.internalPattern.length &&
        options.internalPattern.some(pattern =>
          minimatch(nodeElement.source.value, pattern, {
            nocomment: true,
          }),
        )

      let isCoreModule = (value: string) => {
        let bunModules = [
          'bun',
          'bun:ffi',
          'bun:jsc',
          'bun:sqlite',
          'bun:test',
          'bun:wrap',
          'detect-libc',
          'undici',
          'ws',
        ]
        return (
          builtinModules.includes(
            value.startsWith('node:') ? value.split('node:')[1] : value,
          ) ||
          (options.environment === 'bun' ? bunModules.includes(value) : false)
        )
      }

      let isExternal = (value: string) =>
        !(value.startsWith('.') || value.startsWith('/'))

      if (node.importKind === 'type') {
        if (node.type === 'ImportDeclaration') {
          setCustomGroups(options.customGroups.type, node.source.value)

          if (isIndex(node.source.value)) {
            defineGroup('index-type')
          }

          if (isSibling(node.source.value)) {
            defineGroup('sibling-type')
          }

          if (isParent(node.source.value)) {
            defineGroup('parent-type')
          }

          if (isInternal(node)) {
            defineGroup('internal-type')
          }

          if (isCoreModule(node.source.value)) {
            defineGroup('builtin-type')
          }

          if (isExternal(node.source.value)) {
            defineGroup('external-type')
          }
        }

        defineGroup('type')
      }

      if (node.type === 'ImportDeclaration') {
        setCustomGroups(options.customGroups.value, node.source.value)

        if (isSideEffectImport(node) && isStyle(node.source.value)) {
          defineGroup('side-effect-style')
        }

        if (isSideEffectImport(node)) {
          defineGroup('side-effect')
        }

        if (isStyle(node.source.value)) {
          defineGroup('style')
        }

        if (isIndex(node.source.value)) {
          defineGroup('index')
        }

        if (isSibling(node.source.value)) {
          defineGroup('sibling')
        }

        if (isParent(node.source.value)) {
          defineGroup('parent')
        }

        if (isInternal(node)) {
          defineGroup('internal')
        }

        if (isCoreModule(node.source.value)) {
          defineGroup('builtin')
        }

        if (isExternal(node.source.value)) {
          defineGroup('external')
        }
      }

      return getGroup()
    }

    let hasMultipleImportDeclarations = (
      node: TSESTree.ImportDeclaration,
    ): boolean => node.specifiers.length > 1

    let registerNode = (node: ModuleDeclaration) => {
      let name: string

      if (node.type === 'ImportDeclaration') {
        name = node.source.value
      } else {
        if (node.moduleReference.type === 'TSExternalModuleReference') {
          name = `${node.moduleReference.expression.value}`
        } else {
          name = sourceCode.text.slice(...node.moduleReference.range)
        }
      }

      nodes.push({
        size: rangeToDiff(node.range),
        group: computeGroup(node),
        name,
        node,
        ...(options.type === 'line-length' &&
          options.maxLineLength && {
            hasMultipleImportDeclarations: hasMultipleImportDeclarations(
              node as TSESTree.ImportDeclaration,
            ),
          }),
      })
    }

    return {
      TSImportEqualsDeclaration: registerNode,
      ImportDeclaration: registerNode,
      'Program:exit': () => {
        let hasContentBetweenNodes = (
          left: SortingNode,
          right: SortingNode,
        ): boolean =>
          !!sourceCode.getTokensBetween(
            left.node,
            getCommentBefore(right.node, sourceCode) || right.node,
            {
              includeComments: true,
            },
          ).length

        let fix = (
          fixer: TSESLint.RuleFixer,
          nodesToFix: SortingNode[],
        ): TSESLint.RuleFix[] => {
          let fixes: TSESLint.RuleFix[] = []

          let grouped: {
            [key: string]: SortingNode[]
          } = {}

          for (let node of nodesToFix) {
            let groupNum = getGroupNumber(options.groups, node)

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
            .sort((a, b) => Number(a) - Number(b))
            .reduce(
              (accumulator: SortingNode[], group: string) => [
                ...accumulator,
                ...grouped[group],
              ],
              [],
            )

          for (let i = 0, max = formatted.length; i < max; i++) {
            let node = formatted.at(i)!

            fixes.push(
              fixer.replaceTextRange(
                getNodeRange(nodesToFix.at(i)!.node, sourceCode),
                sourceCode.text.slice(...getNodeRange(node.node, sourceCode)),
              ),
            )

            if (options.newlinesBetween !== 'ignore') {
              let nextNode = formatted.at(i + 1)

              if (nextNode) {
                let linesBetweenImports = getLinesBetween(
                  sourceCode,
                  nodesToFix.at(i)!,
                  nodesToFix.at(i + 1)!,
                )

                if (
                  (options.newlinesBetween === 'always' &&
                    getGroupNumber(options.groups, node) ===
                      getGroupNumber(options.groups, nextNode) &&
                    linesBetweenImports !== 0) ||
                  (options.newlinesBetween === 'never' &&
                    linesBetweenImports > 0)
                ) {
                  fixes.push(
                    fixer.removeRange([
                      getNodeRange(nodesToFix.at(i)!.node, sourceCode).at(1)!,
                      getNodeRange(nodesToFix.at(i + 1)!.node, sourceCode).at(
                        0,
                      )! - 1,
                    ]),
                  )
                }

                if (
                  options.newlinesBetween === 'always' &&
                  getGroupNumber(options.groups, node) !==
                    getGroupNumber(options.groups, nextNode) &&
                  linesBetweenImports > 1
                ) {
                  fixes.push(
                    fixer.replaceTextRange(
                      [
                        getNodeRange(nodesToFix.at(i)!.node, sourceCode).at(1)!,
                        getNodeRange(nodesToFix.at(i + 1)!.node, sourceCode).at(
                          0,
                        )! - 1,
                      ],
                      '\n',
                    ),
                  )
                }

                if (
                  options.newlinesBetween === 'always' &&
                  getGroupNumber(options.groups, node) !==
                    getGroupNumber(options.groups, nextNode) &&
                  linesBetweenImports === 0
                ) {
                  fixes.push(
                    fixer.insertTextAfterRange(
                      getNodeRange(nodesToFix.at(i)!.node, sourceCode),
                      '\n',
                    ),
                  )
                }
              }
            }
          }

          return fixes
        }

        let splittedNodes: SortingNode[][] = [[]]

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
            let leftNum = getGroupNumber(options.groups, left)
            let rightNum = getGroupNumber(options.groups, right)

            let numberOfEmptyLinesBetween = getLinesBetween(
              sourceCode,
              left,
              right,
            )

            if (
              !(
                isSideEffectImport(left.node) && isSideEffectImport(right.node)
              ) &&
              !hasContentBetweenNodes(left, right) &&
              (leftNum > rightNum ||
                (leftNum === rightNum &&
                  isPositive(compare(left, right, options))))
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
              options.newlinesBetween === 'never' &&
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

            if (options.newlinesBetween === 'always') {
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
