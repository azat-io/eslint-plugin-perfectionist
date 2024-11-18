import type { TSESTree } from '@typescript-eslint/types'

import { builtinModules } from 'node:module'

import type { SortingNode } from '../typings'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  newlinesBetweenJsonSchema,
  ignoreCaseJsonSchema,
  localesJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { readClosestTsConfigByPath } from '../utils/read-closest-ts-config-by-path'
import { getOptionsWithCleanGroups } from '../utils/get-options-with-clean-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { getTypescriptImport } from '../utils/get-typescript-import'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getCommentsBefore } from '../utils/get-comments-before'
import { makeNewlinesFixes } from '../utils/make-newlines-fixes'
import { getNewlinesErrors } from '../utils/get-newlines-errors'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { matches } from '../utils/matches'

export type Options<T extends string[]> = [
  Partial<{
    customGroups: {
      value?: Record<T[number], string[] | string>
      type?: Record<T[number], string[] | string>
    }
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    newlinesBetween: 'ignore' | 'always' | 'never'
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    groups: (Group<T>[] | Group<T>)[]
    environment: 'node' | 'bun'
    partitionByNewLine: boolean
    internalPattern: string[]
    sortSideEffects: boolean
    tsconfigRootDir?: string
    maxLineLength?: number
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export type MESSAGE_ID =
  | 'missedSpacingBetweenImports'
  | 'unexpectedImportsGroupOrder'
  | 'extraSpacingBetweenImports'
  | 'unexpectedImportsOrder'

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

interface SortImportsSortingNode extends SortingNode {
  isIgnored: boolean
}

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
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
        internalPattern: ['^~/.*'],
        partitionByComment: false,
        partitionByNewLine: false,
        newlinesBetween: 'always',
        specialCharacters: 'keep',
        sortSideEffects: false,
        type: 'alphabetical',
        environment: 'node',
        ignoreCase: true,
        locales: 'en-US',
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
    validateNewlinesAndPartitionConfiguration(options)

    let tsConfigOutput = options.tsconfigRootDir
      ? readClosestTsConfigByPath({
          tsconfigRootDir: options.tsconfigRootDir,
          filePath: context.physicalFilename,
          contextCwd: context.cwd,
        })
      : null

    let isSideEffectOnlyGroup = (
      group: undefined | string[] | string,
    ): boolean => {
      if (!group) {
        return false
      }
      if (typeof group === 'string') {
        return group === 'side-effect' || group === 'side-effect-style'
      }

      return group.every(isSideEffectOnlyGroup)
    }

    // Ensure that if `sortSideEffects: false`, no side effect group is in a
    // Nested group with non-side-effect groups.
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

    let isStyle = (value: string): boolean => {
      let [cleanedValue] = value.split('?')
      return ['.less', '.scss', '.sass', '.styl', '.pcss', '.css', '.sss'].some(
        extension => cleanedValue.endsWith(extension),
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
        return (
          builtinModules.includes(
            value.startsWith('node:') ? value.split('node:')[1] : value,
          ) ||
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
        // If the module can't be resolved, assume it is external
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
          let lastSortingNode = formattedMembers.at(-1)?.at(-1)

          if (
            (options.partitionByComment &&
              hasPartitionComment(
                options.partitionByComment,
                getCommentsBefore(sortingNode.node, sourceCode),
              )) ||
            (options.partitionByNewLine &&
              lastSortingNode &&
              getLinesBetween(sourceCode, lastSortingNode, sortingNode)) ||
            (lastSortingNode &&
              hasContentBetweenNodes(lastSortingNode, sortingNode))
          ) {
            formattedMembers.push([])
          }

          formattedMembers.at(-1)!.push(sortingNode)
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

          pairwise(nodeList, (left, right) => {
            let leftNumber = getGroupNumber(options.groups, left)
            let rightNumber = getGroupNumber(options.groups, right)

            let indexOfLeft = sortedNodes.indexOf(left)
            let indexOfRight = sortedNodes.indexOf(right)
            let indexOfRightExcludingEslintDisabled =
              sortedNodesExcludingEslintDisabled.indexOf(right)

            let messageIds: MESSAGE_ID[] = []

            if (
              indexOfLeft > indexOfRight ||
              indexOfLeft >= indexOfRightExcludingEslintDisabled
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
                missedSpacingError: 'missedSpacingBetweenImports',
                extraSpacingError: 'extraSpacingBetweenImports',
                rightNum: rightNumber,
                leftNum: leftNumber,
                sourceCode,
                options,
                right,
                left,
              }),
            ]

            for (let messageId of messageIds) {
              context.report({
                fix: fixer => [
                  ...makeFixes({
                    sortedNodes: sortedNodesExcludingEslintDisabled,
                    nodes: nodeList,
                    sourceCode,
                    options,
                    fixer,
                  }),
                  ...makeNewlinesFixes({
                    sortedNodes: sortedNodesExcludingEslintDisabled,
                    nodes: nodeList,
                    sourceCode,
                    options,
                    fixer,
                  }),
                ],
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
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the interface properties into logical groups.',
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
          partitionByNewLine: partitionByNewLineJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          locales: localesJsonSchema,
          groups: groupsJsonSchema,
          order: orderJsonSchema,
          type: typeJsonSchema,
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
      partitionByComment: false,
      partitionByNewLine: false,
      specialCharacters: 'keep',
      internalPattern: ['~/**'],
      newlinesBetween: 'always',
      sortSideEffects: false,
      type: 'alphabetical',
      environment: 'node',
      ignoreCase: true,
      locales: 'en-US',
      order: 'asc',
    },
  ],
  name: 'sort-imports',
})
