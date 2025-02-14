import type { TSESTree } from '@typescript-eslint/types'

import { builtinModules } from 'node:module'

import type {
  DeprecatedCustomGroupsOption,
  PartitionByCommentOption,
  SpecialCharactersOption,
  NewlinesBetweenOption,
  FallbackSortOption,
  GroupsOptions,
  OrderOption,
  RegexOption,
  TypeOption,
} from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
  regexJsonSchema,
} from '../utils/common-json-schemas'
import {
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { readClosestTsConfigByPath } from './sort-imports/read-closest-ts-config-by-path'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { getOptionsWithCleanGroups } from '../utils/get-options-with-clean-groups'
import { isNewlinesBetweenOption } from '../utils/is-newlines-between-option'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { getTypescriptImport } from './sort-imports/get-typescript-import'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { useGroups } from '../utils/use-groups'
import { complete } from '../utils/complete'
import { matches } from '../utils/matches'

export type Options = [
  Partial<{
    customGroups: {
      value?: DeprecatedCustomGroupsOption
      type?: DeprecatedCustomGroupsOption
    }
    partitionByComment: PartitionByCommentOption
    specialCharacters: SpecialCharactersOption
    locales: NonNullable<Intl.LocalesArgument>
    newlinesBetween: NewlinesBetweenOption
    fallbackSort: FallbackSortOption
    internalPattern: RegexOption[]
    groups: GroupsOptions<Group>
    environment: 'node' | 'bun'
    partitionByNewLine: boolean
    sortSideEffects: boolean
    tsconfigRootDir?: string
    maxLineLength?: number
    ignoreCase: boolean
    order: OrderOption
    type: TypeOption
    alphabet: string
  }>,
]

export type MESSAGE_ID =
  | 'missedSpacingBetweenImports'
  | 'unexpectedImportsGroupOrder'
  | 'extraSpacingBetweenImports'
  | 'unexpectedImportsOrder'

type Group =
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
  | string

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
        fallbackSort: { type: 'unsorted' },
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

    validateGroupsConfiguration({
      allowedPredefinedGroups: [
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
      allowedCustomGroups: [
        ...Object.keys(options.customGroups.type ?? {}),
        ...Object.keys(options.customGroups.value ?? {}),
      ],
      options,
    })
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
        | { newlinesBetween: NewlinesBetweenOption }
        | undefined
        | string[]
        | string,
    ): boolean => {
      if (!group || isNewlinesBetweenOption(group)) {
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
    let sortingNodes: SortImportsSortingNode[] = []

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

      sortingNodes.push({
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
          sourceCode.getTokensBetween(left.node, right.node, {
            includeComments: false,
          }).length > 0

        let formattedMembers: SortImportsSortingNode[][] = [[]]
        for (let sortingNode of sortingNodes) {
          let lastGroup = formattedMembers.at(-1)
          let lastSortingNode = lastGroup?.at(-1)

          if (
            shouldPartition({
              lastSortingNode,
              sortingNode,
              sourceCode,
              options,
            }) ||
            (lastSortingNode &&
              hasContentBetweenNodes(lastSortingNode, sortingNode))
          ) {
            lastGroup = []
            formattedMembers.push(lastGroup)
          }

          lastGroup!.push(sortingNode)
        }

        for (let nodes of formattedMembers) {
          let sortNodesExcludingEslintDisabled = (
            ignoreEslintDisabledNodes: boolean,
          ): SortImportsSortingNode[] =>
            sortNodesByGroups(nodes, options, {
              getGroupCompareOptions: groupNumber => {
                if (options.sortSideEffects) {
                  return options
                }
                let group = options.groups[groupNumber]
                return {
                  ...options,
                  type: isSideEffectOnlyGroup(group)
                    ? 'unsorted'
                    : options.type,
                }
              },
              isNodeIgnored: node => node.isIgnored,
              ignoreEslintDisabledNodes,
            })

          reportAllErrors<MESSAGE_ID>({
            availableMessageIds: {
              missedSpacingBetweenMembers: 'missedSpacingBetweenImports',
              extraSpacingBetweenMembers: 'extraSpacingBetweenImports',
              unexpectedGroupOrder: 'unexpectedImportsGroupOrder',
              unexpectedOrder: 'unexpectedImportsOrder',
            },
            options: {
              ...options,
              customGroups: [],
            },
            sortNodesExcludingEslintDisabled,
            sourceCode,
            context,
            nodes,
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
          internalPattern: regexJsonSchema,
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
      missedSpacingBetweenImports: MISSED_SPACING_ERROR,
      extraSpacingBetweenImports: EXTRA_SPACING_ERROR,
      unexpectedImportsGroupOrder: GROUP_ORDER_ERROR,
      unexpectedImportsOrder: ORDER_ERROR,
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
