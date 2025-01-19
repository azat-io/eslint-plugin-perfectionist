import type { TSESTree } from '@typescript-eslint/types'

import { builtinModules } from 'node:module'

import type {
  PartitionByCommentOption,
  GroupOptions,
} from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  buildTypeJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
} from '../utils/common-json-schemas'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { readClosestTsConfigByPath } from './sort-imports/read-closest-ts-config-by-path'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { getOptionsWithCleanGroups } from '../utils/get-options-with-clean-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { getTypescriptImport } from './sort-imports/get-typescript-import'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/has-partition-comment'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getCommentsBefore } from '../utils/get-comments-before'
import { getNewlinesErrors } from '../utils/get-newlines-errors'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { makeFixes } from '../utils/make-fixes'
import { useGroups } from '../utils/use-groups'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { matches } from '../utils/matches'

export type Options<T extends string = string> = [
  Partial<{
    customGroups: {
      value?: Record<T, string[] | string>
      type?: Record<T, string[] | string>
    }
    type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
    newlinesBetween: 'ignore' | 'always' | 'never'
    specialCharacters: 'remove' | 'trim' | 'keep'
    partitionByComment: PartitionByCommentOption
    locales: NonNullable<Intl.LocalesArgument>
    groups: GroupOptions<Group<T>>
    environment: 'node' | 'bun'
    partitionByNewLine: boolean
    internalPattern: string[]
    sortSideEffects: boolean
    tsconfigRootDir?: string
    maxLineLength?: number
    order: 'desc' | 'asc'
    ignoreCase: boolean
    alphabet: string
  }>,
]

export type MESSAGE_ID =
  | 'missedSpacingBetweenImports'
  | 'unexpectedImportsGroupOrder'
  | 'extraSpacingBetweenImports'
  | 'unexpectedImportsOrder'

type Group<T extends string> =
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
  | 'sibling'
  | 'unknown'
  | 'builtin'
  | 'parent'
  | 'object'
  | 'index'
  | 'style'
  | 'type'
  | T

interface SortImportsSortingNode extends SortingNode {
  isIgnored: boolean
}

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => {
    let settings = getSettings(context.settings)

    let userOptions = context.options.at(0)
    let options = getOptionsWithCleanGroups(
      complete(userOptions, settings, {
        groups: [
          'type',
          ['builtin', 'external'],
          'internal-type',
          'internal',
          ['parent-type', 'sibling-type', 'index-type'],
          ['parent', 'sibling', 'index'],
          'object',
          'unknown',
        ],
        customGroups: { value: {}, type: {} },
        internalPattern: ['^~/.+'],
        partitionByComment: false,
        partitionByNewLine: false,
        newlinesBetween: 'always',
        specialCharacters: 'keep',
        sortSideEffects: false,
        type: 'alphabetical',
        environment: 'node',
        ignoreCase: true,
        locales: 'en-US',
        alphabet: '',
        order: 'asc',
      } as const),
    )

    validateGroupsConfiguration(
      options.groups,
      [
        'side-effect-style',
        'external-type',
        'internal-type',
        'builtin-type',
        'sibling-type',
        'parent-type',
        'side-effect',
        'index-type',
        'internal',
        'external',
        'sibling',
        'unknown',
        'builtin',
        'parent',
        'object',
        'index',
        'style',
        'type',
      ],
      [
        ...Object.keys(options.customGroups.type ?? {}),
        ...Object.keys(options.customGroups.value ?? {}),
      ],
    )
    validateCustomSortConfiguration(options)
    validateNewlinesAndPartitionConfiguration(options)

    let tsConfigOutput = options.tsconfigRootDir
      ? readClosestTsConfigByPath({
          tsconfigRootDir: options.tsconfigRootDir,
          filePath: context.physicalFilename,
          contextCwd: context.cwd,
        })
      : null

    let isSideEffectOnlyGroup = (
      group:
        | { newlinesBetween: 'ignore' | 'always' | 'never' }
        | undefined
        | string[]
        | string,
    ): boolean => {
      if (!group || (typeof group === 'object' && 'newlinesBetween' in group)) {
        return false
      }
      if (typeof group === 'string') {
        return group === 'side-effect' || group === 'side-effect-style'
      }

      return group.every(isSideEffectOnlyGroup)
    }

    /**
     * Ensure that if `sortSideEffects: false`, no side effect group is in a
     * nested group with non-side-effect groups.
     */
    if (!options.sortSideEffects) {
      let hasInvalidGroup = options.groups
        .filter(group => Array.isArray(group))
        .some(
          nestedGroup =>
            !isSideEffectOnlyGroup(nestedGroup) &&
            nestedGroup.some(
              subGroup =>
                subGroup === 'side-effect' || subGroup === 'side-effect-style',
            ),
        )
      if (hasInvalidGroup) {
        throw new Error(
          "Side effect groups cannot be nested with non side effect groups when 'sortSideEffects' is 'false'.",
        )
      }
    }

    let sourceCode = getSourceCode(context)
    let eslintDisabledLines = getEslintDisabledLines({
      ruleName: context.id,
      sourceCode,
    })
    let nodes: SortImportsSortingNode[] = []

    let isSideEffectImport = (node: TSESTree.Node): boolean =>
      node.type === 'ImportDeclaration' &&
      node.specifiers.length === 0 &&
      /* Avoid matching on named imports without specifiers */
      !/\}\s*from\s+/u.test(sourceCode.getText(node))

    let styleExtensions = [
      '.less',
      '.scss',
      '.sass',
      '.styl',
      '.pcss',
      '.css',
      '.sss',
    ]
    let isStyle = (value: string): boolean => {
      let [cleanedValue] = value.split('?')
      return styleExtensions.some(extension =>
        cleanedValue?.endsWith(extension),
      )
    }

    let flatGroups = new Set(options.groups.flat())
    let shouldRegroupSideEffectNodes = flatGroups.has('side-effect')
    let shouldRegroupSideEffectStyleNodes = flatGroups.has('side-effect-style')
    let registerNode = (
      node:
        | TSESTree.TSImportEqualsDeclaration
        | TSESTree.VariableDeclaration
        | TSESTree.ImportDeclaration,
    ): void => {
      let name: string

      if (node.type === 'ImportDeclaration') {
        name = node.source.value
      } else if (node.type === 'TSImportEqualsDeclaration') {
        if (node.moduleReference.type === 'TSExternalModuleReference') {
          name = node.moduleReference.expression.value
        } else {
          name = sourceCode.getText(node.moduleReference)
        }
      } else {
        let decl = node.declarations[0].init as TSESTree.CallExpression
        let { value } = decl.arguments[0] as TSESTree.Literal
        name = value!.toString()
      }

      let isIndex = (value: string): boolean =>
        [
          './index.d.js',
          './index.d.ts',
          './index.js',
          './index.ts',
          './index',
          './',
          '.',
        ].includes(value)

      let isParent = (value: string): boolean => value.startsWith('..')

      let isSibling = (value: string): boolean => value.startsWith('./')

      let { setCustomGroups, defineGroup, getGroup } = useGroups(options)

      let matchesInternalPattern = (value: string): boolean | number =>
        options.internalPattern.length &&
        options.internalPattern.some(pattern => matches(value, pattern))

      let isCoreModule = (value: string): boolean => {
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
        let builtinPrefixOnlyModules = ['sea', 'sqlite', 'test']
        let valueToCheck = value.startsWith('node:')
          ? value.split('node:')[1]
          : value
        return (
          (!!valueToCheck && builtinModules.includes(valueToCheck)) ||
          builtinPrefixOnlyModules.some(module => `node:${module}` === value) ||
          (options.environment === 'bun' ? bunModules.includes(value) : false)
        )
      }

      let getInternalOrExternalGroup = (
        value: string,
      ): 'internal' | 'external' | null => {
        let typescriptImport = getTypescriptImport()
        if (!typescriptImport) {
          return !value.startsWith('.') && !value.startsWith('/')
            ? 'external'
            : null
        }

        let isRelativeImport =
          typescriptImport.isExternalModuleNameRelative(value)
        if (isRelativeImport) {
          return null
        }
        if (!tsConfigOutput) {
          return 'external'
        }

        let resolution = typescriptImport.resolveModuleName(
          value,
          context.filename,
          tsConfigOutput.compilerOptions,
          typescriptImport.sys,
          tsConfigOutput.cache,
        )
        // If the module can't be resolved, assume it is external.
        if (
          typeof resolution.resolvedModule?.isExternalLibraryImport !==
          'boolean'
        ) {
          return 'external'
        }

        return resolution.resolvedModule.isExternalLibraryImport
          ? 'external'
          : 'internal'
      }

      if (node.type !== 'VariableDeclaration' && node.importKind === 'type') {
        if (node.type === 'ImportDeclaration') {
          setCustomGroups(options.customGroups.type, node.source.value)
          let internalExternalGroup = matchesInternalPattern(node.source.value)
            ? 'internal'
            : getInternalOrExternalGroup(node.source.value)

          if (isIndex(node.source.value)) {
            defineGroup('index-type')
          }

          if (isSibling(node.source.value)) {
            defineGroup('sibling-type')
          }

          if (isParent(node.source.value)) {
            defineGroup('parent-type')
          }

          if (internalExternalGroup === 'internal') {
            defineGroup('internal-type')
          }

          if (isCoreModule(node.source.value)) {
            defineGroup('builtin-type')
          }

          if (internalExternalGroup === 'external') {
            defineGroup('external-type')
          }
        }

        defineGroup('type')
      }

      let isSideEffect = isSideEffectImport(node)
      let isStyleSideEffect = false
      if (
        node.type === 'ImportDeclaration' ||
        node.type === 'VariableDeclaration'
      ) {
        let value: string
        if (node.type === 'ImportDeclaration') {
          ;({ value } = node.source)
        } else {
          let decl = node.declarations[0].init as TSESTree.CallExpression
          let declValue = (decl.arguments[0] as TSESTree.Literal).value
          value = declValue!.toString()
        }
        let internalExternalGroup = matchesInternalPattern(value)
          ? 'internal'
          : getInternalOrExternalGroup(value)
        let isStyleValue = isStyle(value)
        isStyleSideEffect = isSideEffect && isStyleValue

        setCustomGroups(options.customGroups.value, value)

        if (isStyleSideEffect) {
          defineGroup('side-effect-style')
        }

        if (isSideEffect) {
          defineGroup('side-effect')
        }

        if (isStyleValue) {
          defineGroup('style')
        }

        if (isIndex(value)) {
          defineGroup('index')
        }

        if (isSibling(value)) {
          defineGroup('sibling')
        }

        if (isParent(value)) {
          defineGroup('parent')
        }

        if (internalExternalGroup === 'internal') {
          defineGroup('internal')
        }

        if (isCoreModule(value)) {
          defineGroup('builtin')
        }

        if (internalExternalGroup === 'external') {
          defineGroup('external')
        }
      }

      nodes.push({
        isIgnored:
          !options.sortSideEffects &&
          isSideEffect &&
          !shouldRegroupSideEffectNodes &&
          (!isStyleSideEffect || !shouldRegroupSideEffectStyleNodes),
        isEslintDisabled: isNodeEslintDisabled(node, eslintDisabledLines),
        size: rangeToDiff(node, sourceCode),
        addSafetySemicolonWhenInline: true,
        group: getGroup(),
        node,
        name,
        ...(options.type === 'line-length' &&
          options.maxLineLength && {
            hasMultipleImportDeclarations: isSortable(
              (node as TSESTree.ImportDeclaration).specifiers,
            ),
          }),
      })
    }

    return {
      'Program:exit': () => {
        let hasContentBetweenNodes = (
          left: SortImportsSortingNode,
          right: SortImportsSortingNode,
        ): boolean =>
          !!sourceCode.getTokensBetween(left.node, right.node, {
            includeComments: false,
          }).length

        let formattedMembers: SortImportsSortingNode[][] = [[]]
        for (let sortingNode of nodes) {
          let lastGroup = formattedMembers.at(-1)
          let lastSortingNode = lastGroup?.at(-1)

          if (
            hasPartitionComment({
              comments: getCommentsBefore({
                node: sortingNode.node,
                sourceCode,
              }),
              partitionByComment: options.partitionByComment,
            }) ||
            (options.partitionByNewLine &&
              lastSortingNode &&
              getLinesBetween(sourceCode, lastSortingNode, sortingNode)) ||
            (lastSortingNode &&
              hasContentBetweenNodes(lastSortingNode, sortingNode))
          ) {
            lastGroup = []
            formattedMembers.push(lastGroup)
          }

          lastGroup!.push(sortingNode)
        }

        for (let nodeList of formattedMembers) {
          let sortNodesExcludingEslintDisabled = (
            ignoreEslintDisabledNodes: boolean,
          ): SortImportsSortingNode[] =>
            sortNodesByGroups(nodeList, options, {
              getGroupCompareOptions: groupNumber => {
                if (options.sortSideEffects) {
                  return options
                }
                let group = options.groups[groupNumber]
                return isSideEffectOnlyGroup(group) ? null : options
              },
              isNodeIgnored: node => node.isIgnored,
              ignoreEslintDisabledNodes,
            })

          let sortedNodes = sortNodesExcludingEslintDisabled(false)
          let sortedNodesExcludingEslintDisabled =
            sortNodesExcludingEslintDisabled(true)

          let nodeIndexMap = createNodeIndexMap(sortedNodes)

          pairwise(nodeList, (left, right) => {
            let leftNumber = getGroupNumber(options.groups, left)
            let rightNumber = getGroupNumber(options.groups, right)

            let leftIndex = nodeIndexMap.get(left)!
            let rightIndex = nodeIndexMap.get(right)!

            let indexOfRightExcludingEslintDisabled =
              sortedNodesExcludingEslintDisabled.indexOf(right)

            let messageIds: MESSAGE_ID[] = []

            if (
              leftIndex > rightIndex ||
              leftIndex >= indexOfRightExcludingEslintDisabled
            ) {
              messageIds.push(
                leftNumber === rightNumber
                  ? 'unexpectedImportsOrder'
                  : 'unexpectedImportsGroupOrder',
              )
            }

            messageIds = [
              ...messageIds,
              ...getNewlinesErrors({
                options: {
                  ...options,
                  customGroups: [],
                },
                missedSpacingError: 'missedSpacingBetweenImports',
                extraSpacingError: 'extraSpacingBetweenImports',
                rightNum: rightNumber,
                leftNum: leftNumber,
                sourceCode,
                right,
                left,
              }),
            ]

            for (let messageId of messageIds) {
              context.report({
                fix: fixer =>
                  makeFixes({
                    options: {
                      ...options,
                      customGroups: [],
                    },
                    sortedNodes: sortedNodesExcludingEslintDisabled,
                    nodes: nodeList,
                    sourceCode,
                    fixer,
                  }),
                data: {
                  rightGroup: right.group,
                  leftGroup: left.group,
                  right: right.name,
                  left: left.name,
                },
                node: right.node,
                messageId,
              })
            }
          })
        }
      },
      VariableDeclaration: node => {
        if (
          node.declarations[0].init &&
          node.declarations[0].init.type === 'CallExpression' &&
          node.declarations[0].init.callee.type === 'Identifier' &&
          node.declarations[0].init.callee.name === 'require' &&
          node.declarations[0].init.arguments[0]?.type === 'Literal'
        ) {
          registerNode(node)
        }
      },
      TSImportEqualsDeclaration: registerNode,
      ImportDeclaration: registerNode,
    }
  },
  meta: {
    schema: [
      {
        properties: {
          ...commonJsonSchemas,
          customGroups: {
            properties: {
              value: {
                description: 'Specifies custom groups for value imports.',
                type: 'object',
              },
              type: {
                description: 'Specifies custom groups for type imports.',
                type: 'object',
              },
            },
            description: 'Specifies custom groups.',
            additionalProperties: false,
            type: 'object',
          },
          internalPattern: {
            description: 'Specifies the pattern for internal modules.',
            items: {
              type: 'string',
            },
            type: 'array',
          },
          maxLineLength: {
            description: 'Specifies the maximum line length.',
            exclusiveMinimum: true,
            type: 'integer',
            minimum: 0,
          },
          sortSideEffects: {
            description:
              'Controls whether side-effect imports should be sorted.',
            type: 'boolean',
          },
          environment: {
            description: 'Specifies the environment.',
            enum: ['node', 'bun'],
            type: 'string',
          },
          tsconfigRootDir: {
            description: 'Specifies the tsConfig root directory.',
            type: 'string',
          },
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          type: buildTypeJsonSchema(),
          groups: groupsJsonSchema,
        },
        definitions: {
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
          'is-line-length': {
            properties: {
              type: { enum: ['line-length'], type: 'string' },
            },
            required: ['type'],
            type: 'object',
          },
        },
        allOf: [
          {
            $ref: '#/definitions/max-line-length-requires-line-length-type',
          },
        ],
        dependencies: {
          maxLineLength: ['type'],
        },
        additionalProperties: false,
        id: 'sort-imports',
        type: 'object',
      },
    ],
    messages: {
      unexpectedImportsGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      missedSpacingBetweenImports:
        'Missed spacing between "{{left}}" and "{{right}}" imports.',
      extraSpacingBetweenImports:
        'Extra spacing between "{{left}}" and "{{right}}" imports.',
      unexpectedImportsOrder: 'Expected "{{right}}" to come before "{{left}}".',
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-imports',
      description: 'Enforce sorted imports.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [
    {
      groups: [
        'type',
        ['builtin', 'external'],
        'internal-type',
        'internal',
        ['parent-type', 'sibling-type', 'index-type'],
        ['parent', 'sibling', 'index'],
        'object',
        'unknown',
      ],
      customGroups: { value: {}, type: {} },
      internalPattern: ['^~/.+'],
      partitionByComment: false,
      partitionByNewLine: false,
      specialCharacters: 'keep',
      newlinesBetween: 'always',
      sortSideEffects: false,
      type: 'alphabetical',
      environment: 'node',
      ignoreCase: true,
      locales: 'en-US',
      alphabet: '',
      order: 'asc',
    },
  ],
  name: 'sort-imports',
})
