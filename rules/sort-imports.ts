import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type {
  SortImportsSortingNode,
  Options,
  Group,
} from './sort-imports/types'
import type { DeprecatedCustomGroupsOption } from '../types/common-options'

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
import { validateSideEffectsConfiguration } from './sort-imports/validate-side-effects-configuration'
import { computeCommonPredefinedGroups } from './sort-imports/compute-common-predefined-groups'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { readClosestTsConfigByPath } from './sort-imports/read-closest-ts-config-by-path'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { getOptionsWithCleanGroups } from '../utils/get-options-with-clean-groups'
import { isSideEffectOnlyGroup } from './sort-imports/is-side-effect-only-group'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

export type MESSAGE_ID =
  | 'missedSpacingBetweenImports'
  | 'unexpectedImportsGroupOrder'
  | 'extraSpacingBetweenImports'
  | 'unexpectedImportsOrder'

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
    validateSideEffectsConfiguration(options)

    let tsConfigOutput = options.tsconfigRootDir
      ? readClosestTsConfigByPath({
          tsconfigRootDir: options.tsconfigRootDir,
          filePath: context.physicalFilename,
          contextCwd: context.cwd,
        })
      : null

    let { sourceCode, filename, id } = context
    let eslintDisabledLines = getEslintDisabledLines({
      ruleName: id,
      sourceCode,
    })
    let sortingNodes: SortImportsSortingNode[] = []

    let flatGroups = new Set(options.groups.flat())
    let shouldRegroupSideEffectNodes = flatGroups.has('side-effect')
    let shouldRegroupSideEffectStyleNodes = flatGroups.has('side-effect-style')

    let registerNode = (
      node:
        | TSESTree.TSImportEqualsDeclaration
        | TSESTree.VariableDeclaration
        | TSESTree.ImportDeclaration,
    ): void => {
      let name = getNodeName({
        sourceCode,
        node,
      })

      let commonPredefinedGroups = computeCommonPredefinedGroups({
        tsConfigOutput,
        filename,
        options,
        name,
      })

      let predefinedGroups: Group[] = []
      let group: Group | null = null

      if (node.type !== 'VariableDeclaration' && node.importKind === 'type') {
        if (node.type === 'ImportDeclaration') {
          group = computeGroupExceptUnknown({
            customGroups: options.customGroups.type,
            predefinedGroups: [],
            options,
            name,
          })

          for (let predefinedGroup of commonPredefinedGroups) {
            predefinedGroups.push(`${predefinedGroup}-type`)
          }
        }

        predefinedGroups.push('type')

        group ??= computeGroupExceptUnknown({
          predefinedGroups,
          options,
          name,
        })
      }

      let isSideEffect = isSideEffectImport({ sourceCode, node })
      let isStyleSideEffect = false

      let isStyleValue = isStyle(name)
      isStyleSideEffect = isSideEffect && isStyleValue

      group ??= computeGroupExceptUnknown({
        customGroups: options.customGroups.value,
        predefinedGroups: [],
        options,
        name,
      })

      if (isStyleSideEffect) {
        predefinedGroups.push('side-effect-style')
      }

      if (isSideEffect) {
        predefinedGroups.push('side-effect')
      }

      if (isStyleValue) {
        predefinedGroups.push('style')
      }

      for (let predefinedGroup of commonPredefinedGroups) {
        predefinedGroups.push(predefinedGroup)
      }

      group ??=
        computeGroupExceptUnknown({
          predefinedGroups,
          options,
          name,
        }) ?? 'unknown'

      sortingNodes.push({
        isIgnored:
          !options.sortSideEffects &&
          isSideEffect &&
          !shouldRegroupSideEffectNodes &&
          (!isStyleSideEffect || !shouldRegroupSideEffectStyleNodes),
        isEslintDisabled: isNodeEslintDisabled(node, eslintDisabledLines),
        size: rangeToDiff(node, sourceCode),
        addSafetySemicolonWhenInline: true,
        group,
        name,
        node,
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
              hasContentBetweenNodes(sourceCode, lastSortingNode, sortingNode))
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
            sortNodesByGroups({
              getOptionsByGroupNumber: groupNumber => {
                if (options.sortSideEffects) {
                  return {
                    options,
                  }
                }
                return {
                  options: {
                    ...options,
                    type:
                      options.groups[groupNumber] &&
                      isSideEffectOnlyGroup(options.groups[groupNumber])
                        ? 'unsorted'
                        : options.type,
                  },
                }
              },
              isNodeIgnored: node => node.isIgnored,
              ignoreEslintDisabledNodes,
              groups: options.groups,
              nodes,
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

let hasContentBetweenNodes = (
  sourceCode: TSESLint.SourceCode,
  left: SortImportsSortingNode,
  right: SortImportsSortingNode,
): boolean =>
  sourceCode.getTokensBetween(left.node, right.node, {
    includeComments: false,
  }).length > 0

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
  return styleExtensions.some(extension => cleanedValue?.endsWith(extension))
}

let isSideEffectImport = ({
  sourceCode,
  node,
}: {
  sourceCode: TSESLint.SourceCode
  node: TSESTree.Node
}): boolean =>
  node.type === 'ImportDeclaration' &&
  node.specifiers.length === 0 &&
  /* Avoid matching on named imports without specifiers */
  !/\}\s*from\s+/u.test(sourceCode.getText(node))

let getNodeName = ({
  sourceCode,
  node,
}: {
  node:
    | TSESTree.TSImportEqualsDeclaration
    | TSESTree.VariableDeclaration
    | TSESTree.ImportDeclaration
  sourceCode: TSESLint.SourceCode
}): string => {
  if (node.type === 'ImportDeclaration') {
    return node.source.value
  }

  if (node.type === 'TSImportEqualsDeclaration') {
    if (node.moduleReference.type === 'TSExternalModuleReference') {
      return node.moduleReference.expression.value
    }

    return sourceCode.getText(node.moduleReference)
  }

  let callExpression = node.declarations[0].init as TSESTree.CallExpression
  let { value } = callExpression.arguments[0] as TSESTree.Literal
  return value!.toString()
}

let computeGroupExceptUnknown = ({
  predefinedGroups,
  customGroups,
  options,
  name,
}: {
  options: Omit<
    Required<Options[0]>,
    'tsconfigRootDir' | 'maxLineLength' | 'customGroups'
  >
  customGroups?: DeprecatedCustomGroupsOption | undefined
  predefinedGroups: Group[]
  name: string
}): Group | null => {
  let computedCustomGroup = computeGroup({
    options: {
      ...options,
      customGroups,
    },
    predefinedGroups,
    name,
  })
  if (computedCustomGroup === 'unknown') {
    return null
  }
  return computedCustomGroup
}
