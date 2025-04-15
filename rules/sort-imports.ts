import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type {
  SortImportsSortingNode,
  Selector,
  Modifier,
  Options,
  Group,
} from './sort-imports/types'
import type {
  DeprecatedCustomGroupsOption,
  CustomGroupsOption,
} from '../types/common-options'

import {
  buildCustomGroupsArrayJsonSchema,
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
  regexJsonSchema,
} from '../utils/common-json-schemas'
import {
  DEPENDENCY_ORDER_ERROR,
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import { validateSideEffectsConfiguration } from './sort-imports/validate-side-effects-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { getCustomGroupOverriddenOptions } from '../utils/get-custom-groups-compare-options'
import { readClosestTsConfigByPath } from './sort-imports/read-closest-ts-config-by-path'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { getOptionsWithCleanGroups } from '../utils/get-options-with-clean-groups'
import { computeCommonSelectors } from './sort-imports/compute-common-selectors'
import { isSideEffectOnlyGroup } from './sort-imports/is-side-effect-only-group'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { singleCustomGroupJsonSchema } from './sort-imports/types'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { allModifiers, allSelectors } from './sort-imports/types'
import { createEslintRule } from '../utils/create-eslint-rule'
import { allDeprecatedSelectors } from './sort-imports/types'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

/**
 * Cache computed groups by modifiers and selectors for performance
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

export type MESSAGE_ID =
  | 'unexpectedImportsDependencyOrder'
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
          'unknown',
        ],
        fallbackSort: { type: 'unsorted' },
        internalPattern: ['^~/.+'],
        partitionByComment: false,
        partitionByNewLine: false,
        newlinesBetween: 'always',
        specialCharacters: 'keep',
        sortSideEffects: false,
        type: 'alphabetical',
        environment: 'node',
        customGroups: [],
        ignoreCase: true,
        locales: 'en-US',
        alphabet: '',
        order: 'asc',
      } as const),
    )

    if (Array.isArray(options.customGroups)) {
      validateGeneratedGroupsConfiguration({
        options: {
          ...options,
          customGroups: options.customGroups,
        },
        selectors: [...allSelectors, ...allDeprecatedSelectors],
        modifiers: allModifiers,
      })
    } else {
      let generatedGroups = generatePredefinedGroups({
        cache: cachedGroupsByModifiersAndSelectors,
        selectors: allSelectors,
        modifiers: allModifiers,
      })
      validateGroupsConfiguration({
        allowedCustomGroups: [
          ...Object.keys(options.customGroups.type ?? {}),
          ...Object.keys(options.customGroups.value ?? {}),
        ],
        allowedPredefinedGroups: [
          ...generatedGroups,
          ...allDeprecatedSelectors,
          'unknown',
        ],
        options,
      })
    }
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

      let commonSelectors = computeCommonSelectors({
        tsConfigOutput,
        filename,
        options,
        name,
      })

      let selectors: Selector[] = []
      let modifiers: Modifier[] = []
      let group: Group | null = null

      if (node.type !== 'VariableDeclaration' && node.importKind === 'type') {
        if (node.type === 'ImportDeclaration') {
          if (!Array.isArray(options.customGroups)) {
            // For deprecated `customGroups.type`
            group = computeGroupExceptUnknown({
              customGroups: options.customGroups.type,
              options,
              name,
            })
          }

          for (let selector of commonSelectors) {
            selectors.push(`${selector}-type`)
          }
        }

        selectors.push('type')
        modifiers.push('type')

        if (!group && !Array.isArray(options.customGroups)) {
          group = computeGroupExceptUnknown({
            customGroups: [],
            selectors,
            modifiers,
            options,
            name,
          })
        }
      }

      let isSideEffect = isSideEffectImport({ sourceCode, node })
      let isStyleValue = isStyle(name)
      let isStyleSideEffect = isSideEffect && isStyleValue

      if (!group && !Array.isArray(options.customGroups)) {
        // For deprecated `customGroups.value`
        group = computeGroupExceptUnknown({
          customGroups: options.customGroups.value,
          options,
          name,
        })
      }

      if (isStyleSideEffect) {
        selectors.push('side-effect-style')
      }

      if (isSideEffect) {
        selectors.push('side-effect')
      }

      if (isStyleValue) {
        selectors.push('style')
      }

      for (let selector of commonSelectors) {
        selectors.push(selector)
      }

      group ??=
        computeGroupExceptUnknown({
          customGroups: Array.isArray(options.customGroups)
            ? options.customGroups
            : [],
          selectors,
          modifiers,
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
        dependencyNames: computeDependencyNames({ sourceCode, node }),
        dependencies: computeDependencies(node),
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
        let contentSeparatedSortingNodeGroups: SortImportsSortingNode[][][] = [
          [[]],
        ]
        for (let sortingNode of sortingNodes) {
          let lastGroupWithNoContentBetween =
            contentSeparatedSortingNodeGroups.at(-1)!
          let lastGroup = lastGroupWithNoContentBetween.at(-1)!
          let lastSortingNode = lastGroup.at(-1)

          if (
            lastSortingNode &&
            hasContentBetweenNodes(sourceCode, lastSortingNode, sortingNode)
          ) {
            lastGroup = []
            lastGroupWithNoContentBetween = [lastGroup]
            contentSeparatedSortingNodeGroups.push(
              lastGroupWithNoContentBetween,
            )
          } else if (
            shouldPartition({
              lastSortingNode,
              sortingNode,
              sourceCode,
              options,
            })
          ) {
            lastGroup = []
            lastGroupWithNoContentBetween.push(lastGroup)
          }

          lastGroup.push(sortingNode)
        }

        for (let sortingNodeGroups of contentSeparatedSortingNodeGroups) {
          let sortNodesExcludingEslintDisabled = (
            ignoreEslintDisabledNodes: boolean,
          ): SortImportsSortingNode[] => {
            let nodesSortedByGroups = sortingNodeGroups.flatMap(nodes =>
              sortNodesByGroups({
                getOptionsByGroupNumber: groupNumber => {
                  let customGroupOverriddenOptions =
                    getCustomGroupOverriddenOptions({
                      options: {
                        ...options,
                        customGroups: Array.isArray(options.customGroups)
                          ? options.customGroups
                          : [],
                      },
                      groupNumber,
                    })

                  if (options.sortSideEffects) {
                    return {
                      options: {
                        ...options,
                        ...customGroupOverriddenOptions,
                      },
                    }
                  }
                  let overriddenOptions = {
                    ...options,
                    ...customGroupOverriddenOptions,
                  }
                  return {
                    options: {
                      ...overriddenOptions,
                      type:
                        overriddenOptions.groups[groupNumber] &&
                        isSideEffectOnlyGroup(
                          overriddenOptions.groups[groupNumber],
                        )
                          ? 'unsorted'
                          : overriddenOptions.type,
                    },
                  }
                },
                isNodeIgnored: node => node.isIgnored,
                ignoreEslintDisabledNodes,
                groups: options.groups,
                nodes,
              }),
            )

            return sortNodesByDependencies(nodesSortedByGroups, {
              ignoreEslintDisabledNodes,
            })
          }

          let nodes = sortingNodeGroups.flat()

          reportAllErrors<MESSAGE_ID>({
            availableMessageIds: {
              unexpectedDependencyOrder: 'unexpectedImportsDependencyOrder',
              missedSpacingBetweenMembers: 'missedSpacingBetweenImports',
              extraSpacingBetweenMembers: 'extraSpacingBetweenImports',
              unexpectedGroupOrder: 'unexpectedImportsGroupOrder',
              unexpectedOrder: 'unexpectedImportsOrder',
            },
            options: {
              ...options,
              customGroups: Array.isArray(options.customGroups)
                ? options.customGroups
                : [],
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
    schema: {
      items: {
        properties: {
          ...commonJsonSchemas,
          customGroups: {
            oneOf: [
              {
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
              buildCustomGroupsArrayJsonSchema({ singleCustomGroupJsonSchema }),
            ],
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
      uniqueItems: true,
      type: 'array',
    },
    messages: {
      unexpectedImportsDependencyOrder: DEPENDENCY_ORDER_ERROR,
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
  customGroups,
  selectors,
  modifiers,
  options,
  name,
}: {
  options: Omit<
    Required<Options[0]>,
    'tsconfigRootDir' | 'maxLineLength' | 'customGroups'
  >
  customGroups: DeprecatedCustomGroupsOption | CustomGroupsOption | undefined
  selectors?: Selector[]
  modifiers?: Modifier[]
  name: string
}): string | null => {
  let predefinedGroups =
    modifiers && selectors
      ? generatePredefinedGroups({
          cache: cachedGroupsByModifiersAndSelectors,
          selectors,
          modifiers,
        })
      : []
  let computedCustomGroup = computeGroup({
    customGroupMatcher: customGroup =>
      doesCustomGroupMatch({
        modifiers: modifiers!,
        selectors: selectors!,
        elementName: name,
        customGroup,
      }),
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

let computeDependencies = (
  node:
    | TSESTree.TSImportEqualsDeclaration
    | TSESTree.VariableDeclaration
    | TSESTree.ImportDeclaration,
): string[] => {
  if (node.type !== 'TSImportEqualsDeclaration') {
    return []
  }
  if (node.moduleReference.type !== 'TSQualifiedName') {
    return []
  }
  let qualifiedName = getQualifiedNameDependencyName(node.moduleReference)
  /* v8 ignore next 3 - Unsure how we can reach that case */
  if (!qualifiedName) {
    return []
  }
  return [qualifiedName]
}

let getQualifiedNameDependencyName = (
  node: TSESTree.EntityName,
): string | null => {
  switch (node.type) {
    case 'TSQualifiedName':
      return getQualifiedNameDependencyName(node.left)
    case 'Identifier':
      return node.name
    /* v8 ignore next 3 - Unsure how we can reach that case */
  }
  return null
}

let computeDependencyNames = ({
  sourceCode,
  node,
}: {
  node:
    | TSESTree.TSImportEqualsDeclaration
    | TSESTree.VariableDeclaration
    | TSESTree.ImportDeclaration
  sourceCode: TSESLint.SourceCode
}): string[] => {
  if (node.type === 'VariableDeclaration') {
    return []
  }

  if (node.type === 'TSImportEqualsDeclaration') {
    return [node.id.name]
  }

  let returnValue: string[] = []
  for (let specifier of node.specifiers) {
    switch (specifier.type) {
      case 'ImportNamespaceSpecifier':
        returnValue.push(sourceCode.getText(specifier.local))
        break
      case 'ImportDefaultSpecifier':
        returnValue.push(sourceCode.getText(specifier.local))
        break
      case 'ImportSpecifier':
        returnValue.push(sourceCode.getText(specifier.imported))
        break
    }
  }
  return returnValue
}
