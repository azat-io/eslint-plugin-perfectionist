import type { TSESTree } from '@typescript-eslint/types'

import { builtinModules } from 'node:module'

import type { SortingNode } from '../typings'

import {
  specialCharactersJsonSchema,
  ignoreCaseJsonSchema,
  localesJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { readClosestTsConfigByPath } from '../utils/read-closest-ts-config-by-path'
import { getOptionsWithCleanGroups } from '../utils/get-options-with-clean-groups'
import { getTypescriptImport } from '../utils/get-typescript-import'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getCommentsBefore } from '../utils/get-comments-before'
import { makeNewlinesFixes } from '../utils/make-newlines-fixes'
import { getNewlinesErrors } from '../utils/get-newlines-errors'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { matches } from '../utils/matches'

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

export type Options<T extends string[]> = [
  Partial<{
    customGroups: {
      value?: { [key in T[number]]: string[] | string }
      type?: { [key in T[number]]: string[] | string }
    }
    type: 'alphabetical' | 'line-length' | 'natural'
    newlinesBetween: 'ignore' | 'always' | 'never'
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    groups: (Group<T>[] | Group<T>)[]
    environment: 'node' | 'bun'
    internalPattern: string[]
    sortSideEffects: boolean
    tsconfigRootDir?: string
    maxLineLength?: number
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

interface SortImportsSortingNode extends SortingNode {
  isIgnored: boolean
}

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: 'sort-imports',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted imports.',
    },
    fixable: 'code',
    schema: [
      {
        id: 'sort-imports',
        type: 'object',
        properties: {
          type: typeJsonSchema,
          order: orderJsonSchema,
          locales: localesJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          internalPattern: {
            description: 'Specifies the pattern for internal modules.',
            items: {
              type: 'string',
            },
            type: 'array',
          },
          sortSideEffects: {
            description:
              'Controls whether side-effect imports should be sorted.',
            type: 'boolean',
          },
          newlinesBetween: {
            description:
              'Specifies how new lines should be handled between import groups.',
            enum: ['ignore', 'always', 'never'],
            type: 'string',
          },
          maxLineLength: {
            description: 'Specifies the maximum line length.',
            type: 'integer',
            minimum: 0,
            exclusiveMinimum: true,
          },
          tsconfigRootDir: {
            description: 'Specifies the tsConfig root directory.',
            type: 'string',
          },
          groups: groupsJsonSchema,
          customGroups: {
            description: 'Specifies custom groups.',
            type: 'object',
            properties: {
              type: {
                type: 'object',
                description: 'Specifies custom groups for type imports.',
              },
              value: {
                type: 'object',
                description: 'Specifies custom groups for value imports.',
              },
            },
            additionalProperties: false,
          },
          environment: {
            description: 'Specifies the environment.',
            enum: ['node', 'bun'],
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
      unexpectedImportsGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedImportsOrder: 'Expected "{{right}}" to come before "{{left}}".',
      missedSpacingBetweenImports:
        'Missed spacing between "{{left}}" and "{{right}}" imports.',
      extraSpacingBetweenImports:
        'Extra spacing between "{{left}}" and "{{right}}" imports.',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
      specialCharacters: 'keep',
      internalPattern: ['~/**'],
      sortSideEffects: false,
      newlinesBetween: 'always',
      maxLineLength: undefined,
      tsconfigRootDir: undefined,
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
      customGroups: { type: {}, value: {} },
      environment: 'node',
      locales: 'en-US',
    },
  ],
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
        customGroups: { type: {}, value: {} },
        internalPattern: ['^~/.*'],
        newlinesBetween: 'always',
        sortSideEffects: false,
        type: 'alphabetical',
        environment: 'node',
        ignoreCase: true,
        specialCharacters: 'keep',
        order: 'asc',
        locales: 'en-US',
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

    let tsConfigOutput = options.tsconfigRootDir
      ? readClosestTsConfigByPath({
          filePath: context.physicalFilename,
          contextCwd: context.cwd,
          tsconfigRootDir: options.tsconfigRootDir,
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
    // nested group with non-side-effect groups.
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
    let nodes: SortImportsSortingNode[] = []

    let isSideEffectImport = (node: TSESTree.Node) =>
      node.type === 'ImportDeclaration' &&
      node.specifiers.length === 0 &&
      /* Avoid matching on named imports without specifiers */
      !/}\s*from\s+/.test(sourceCode.getText(node))

    let isStyle = (value: string) =>
      ['.less', '.scss', '.sass', '.styl', '.pcss', '.css', '.sss'].some(
        extension => value.endsWith(extension),
      )

    let hasMultipleImportDeclarations = (
      node: TSESTree.ImportDeclaration,
    ): boolean => node.specifiers.length > 1

    let flatGroups = options.groups.flat()
    let shouldRegroupSideEffectNodes = flatGroups.includes('side-effect')
    let shouldRegroupSideEffectStyleNodes =
      flatGroups.includes('side-effect-style')
    let registerNode = (
      node:
        | TSESTree.TSImportEqualsDeclaration
        | TSESTree.VariableDeclaration
        | TSESTree.ImportDeclaration,
    ) => {
      let name: string

      if (node.type === 'ImportDeclaration') {
        name = node.source.value
      } else if (node.type === 'TSImportEqualsDeclaration') {
        if (node.moduleReference.type === 'TSExternalModuleReference') {
          name = `${node.moduleReference.expression.value}`
        } else {
          name = sourceCode.getText(node.moduleReference)
        }
      } else {
        let decl = node.declarations[0].init as TSESTree.CallExpression
        let { value } = decl.arguments[0] as TSESTree.Literal
        name = value!.toString()
      }

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

      let isParent = (value: string) => value.startsWith('..')

      let isSibling = (value: string) => value.startsWith('./')

      let { getGroup, defineGroup, setCustomGroups } = useGroups(options)

      let matchesInternalPattern = (value: string) =>
        options.internalPattern.length &&
        options.internalPattern.some(pattern => matches(value, pattern))

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
        if (resolution.resolvedModule?.isExternalLibraryImport === undefined) {
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
        size: rangeToDiff(node, sourceCode),
        group: getGroup(),
        node,
        addSafetySemicolonWhenInline: true,
        isIgnored:
          !options.sortSideEffects &&
          isSideEffect &&
          !shouldRegroupSideEffectNodes &&
          (!isStyleSideEffect || !shouldRegroupSideEffectStyleNodes),
        name,
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
      'Program:exit': () => {
        let hasContentBetweenNodes = (
          left: SortImportsSortingNode,
          right: SortImportsSortingNode,
        ): boolean =>
          getCommentsBefore(right.node, sourceCode).length > 0 ||
          !!sourceCode.getTokensBetween(left.node, right.node, {
            includeComments: false,
          }).length

        let splitNodes: SortImportsSortingNode[][] = [[]]

        for (let node of nodes) {
          let lastNode = splitNodes.at(-1)?.at(-1)

          if (lastNode && hasContentBetweenNodes(lastNode, node)) {
            splitNodes.push([node])
          } else {
            splitNodes.at(-1)!.push(node)
          }
        }

        for (let nodeList of splitNodes) {
          let sortedNodes = sortNodesByGroups(nodeList, options, {
            isNodeIgnored: node => node.isIgnored,
            getGroupCompareOptions: groupNumber => {
              if (options.sortSideEffects) {
                return options
              }
              let group = options.groups[groupNumber]
              return isSideEffectOnlyGroup(group) ? null : options
            },
          })
          pairwise(nodeList, (left, right) => {
            let leftNum = getGroupNumber(options.groups, left)
            let rightNum = getGroupNumber(options.groups, right)

            let indexOfLeft = sortedNodes.indexOf(left)
            let indexOfRight = sortedNodes.indexOf(right)

            let messageIds: MESSAGE_ID[] = []

            if (indexOfLeft > indexOfRight) {
              messageIds.push(
                leftNum !== rightNum
                  ? 'unexpectedImportsGroupOrder'
                  : 'unexpectedImportsOrder',
              )
            }

            messageIds = [
              ...messageIds,
              ...getNewlinesErrors({
                left,
                leftNum,
                right,
                rightNum,
                sourceCode,
                missedSpacingError: 'missedSpacingBetweenImports',
                extraSpacingError: 'extraSpacingBetweenImports',
                options,
              }),
            ]

            for (let messageId of messageIds) {
              context.report({
                messageId,
                data: {
                  left: left.name,
                  leftGroup: left.group,
                  right: right.name,
                  rightGroup: right.group,
                },
                node: right.node,
                fix: fixer => [
                  ...makeFixes(fixer, nodeList, sortedNodes, sourceCode),
                  ...makeNewlinesFixes(
                    fixer,
                    nodeList,
                    sortedNodes,
                    sourceCode,
                    options,
                  ),
                ],
              })
            }
          })
        }
      },
    }
  },
})
