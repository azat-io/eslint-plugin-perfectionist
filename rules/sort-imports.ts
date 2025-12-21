import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type {
  SortImportsSortingNode,
  Selector,
  Modifier,
  Options,
} from './sort-imports/types'

import {
  MISSED_COMMENT_ABOVE_ERROR,
  DEPENDENCY_ORDER_ERROR,
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import {
  TYPE_IMPORT_FIRST_TYPE_OPTION,
  singleCustomGroupJsonSchema,
  allModifiers,
  allSelectors,
} from './sort-imports/types'
import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { buildDefaultOptionsByGroupIndexComputer } from '../utils/build-default-options-by-group-index-computer'
import { isNonExternalReferenceTsImportEquals } from './sort-imports/is-non-external-reference-ts-import-equals'
import {
  buildCommonJsonSchemas,
  buildRegexJsonSchema,
} from '../utils/json-schemas/common-json-schemas'
import { validateSideEffectsConfiguration } from './sort-imports/validate-side-effects-configuration'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { comparatorByOptionsComputer } from './sort-imports/comparator-by-options-computer'
import { readClosestTsConfigByPath } from './sort-imports/read-closest-ts-config-by-path'
import { computeSpecifierModifiers } from './sort-imports/compute-specifier-modifiers'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { getOptionsWithCleanGroups } from '../utils/get-options-with-clean-groups'
import { computeCommonSelectors } from './sort-imports/compute-common-selectors'
import { isSideEffectOnlyGroup } from './sort-imports/is-side-effect-only-group'
import { computeDependencyNames } from './sort-imports/compute-dependency-names'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { computeDependencies } from './sort-imports/compute-dependencies'
import { isSideEffectImport } from './sort-imports/is-side-effect-import'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { isNodeOnSingleLine } from '../utils/is-node-on-single-line'
import { computeNodeName } from './sort-imports/compute-node-name'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

/** Cache computed groups by modifiers and selectors for performance. */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

const ORDER_ERROR_ID = 'unexpectedImportsOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedImportsGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenImports'
const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenImports'
const MISSED_COMMENT_ABOVE_ERROR_ID = 'missedCommentAboveImport'
const DEPENDENCY_ORDER_ERROR_ID = 'unexpectedImportsDependencyOrder'

export type MessageId =
  | typeof MISSED_COMMENT_ABOVE_ERROR_ID
  | typeof DEPENDENCY_ORDER_ERROR_ID
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

let defaultOptions: Required<Options[number]> = {
  groups: [
    'type-import',
    ['value-builtin', 'value-external'],
    'type-internal',
    'value-internal',
    ['type-parent', 'type-sibling', 'type-index'],
    ['value-parent', 'value-sibling', 'value-index'],
    'ts-equals-import',
    'unknown',
  ],
  internalPattern: ['^~/.+', '^@/.+'],
  fallbackSort: { type: 'unsorted' },
  partitionByComment: false,
  partitionByNewLine: false,
  specialCharacters: 'keep',
  tsconfig: { rootDir: '' },
  maxLineLength: Infinity,
  sortSideEffects: false,
  type: 'alphabetical',
  environment: 'node',
  newlinesBetween: 1,
  newlinesInside: 0,
  customGroups: [],
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
}

export default createEslintRule<Options, MessageId>({
  create: context => {
    let settings = getSettings(context.settings)

    let userOptions = context.options.at(0)
    let options = getOptionsWithCleanGroups(
      complete(userOptions, settings, defaultOptions),
    )

    validateGroupsConfiguration({
      selectors: allSelectors,
      modifiers: allModifiers,
      options,
    })
    validateCustomSortConfiguration(options)
    validateNewlinesAndPartitionConfiguration(options)
    validateSideEffectsConfiguration(options)

    let tsconfigRootDirectory = options.tsconfig.rootDir
    let tsConfigOutput = tsconfigRootDirectory
      ? readClosestTsConfigByPath({
          tsconfigFilename: options.tsconfig.filename ?? 'tsconfig.json',
          tsconfigRootDir: tsconfigRootDirectory,
          filePath: context.physicalFilename,
          contextCwd: context.cwd,
        })
      : null

    let { sourceCode, filename, id } = context
    let eslintDisabledLines = getEslintDisabledLines({
      ruleName: id,
      sourceCode,
    })
    let sortingNodesWithoutPartitionId: Omit<
      SortImportsSortingNode,
      'partitionId'
    >[] = []

    let flatGroups = new Set(options.groups.flat())
    let shouldRegroupSideEffectNodes = flatGroups.has('side-effect')
    let shouldRegroupSideEffectStyleNodes = flatGroups.has('side-effect-style')

    function registerNode(
      node:
        | TSESTree.TSImportEqualsDeclaration
        | TSESTree.VariableDeclaration
        | TSESTree.ImportDeclaration,
    ): void {
      let name = computeNodeName({
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
      let group: string | null = null

      if (node.type !== 'VariableDeclaration' && node.importKind === 'type') {
        selectors.push('type')
        modifiers.push('type')
      }

      let isSideEffect = isSideEffectImport({ sourceCode, node })
      let isStyleValue = isStyle(name)
      let isStyleSideEffect = isSideEffect && isStyleValue

      if (!isNonExternalReferenceTsImportEquals(node)) {
        if (isStyleSideEffect) {
          selectors.push('side-effect-style')
        }

        if (isSideEffect) {
          selectors.push('side-effect')
          modifiers.push('side-effect')
        }

        if (isStyleValue) {
          selectors.push('style')
        }

        for (let selector of commonSelectors) {
          selectors.push(selector)
        }
      }
      selectors.push('import')

      if (!modifiers.includes('type')) {
        modifiers.push('value')
      }

      if (node.type === 'TSImportEqualsDeclaration') {
        modifiers.push('ts-equals')
      }

      if (node.type === 'VariableDeclaration') {
        modifiers.push('require')
      }

      modifiers.push(...computeSpecifierModifiers(node))

      if (isNodeOnSingleLine(node)) {
        modifiers.push('singleline')
      } else {
        modifiers.push('multiline')
      }

      group ??=
        computeGroupExceptUnknown({
          selectors,
          modifiers,
          options,
          name,
        }) ?? 'unknown'

      let hasMultipleImportDeclarations = isSortable(
        (node as TSESTree.ImportDeclaration).specifiers,
      )
      let size = rangeToDiff(node, sourceCode)
      if (hasMultipleImportDeclarations && size > options.maxLineLength) {
        size = name.length + 10
      }
      sortingNodesWithoutPartitionId.push({
        isIgnored:
          !options.sortSideEffects &&
          isSideEffect &&
          !shouldRegroupSideEffectNodes &&
          (!isStyleSideEffect || !shouldRegroupSideEffectStyleNodes),
        isEslintDisabled: isNodeEslintDisabled(node, eslintDisabledLines),
        dependencyNames: computeDependencyNames({ sourceCode, node }),
        isTypeImport: modifiers.includes('type'),
        dependencies: computeDependencies(node),
        addSafetySemicolonWhenInline: true,
        group,
        size,
        name,
        node,
      })
    }

    return {
      VariableDeclaration: node => {
        if (
          node.declarations[0].init?.type === 'CallExpression' &&
          node.declarations[0].init.callee.type === 'Identifier' &&
          node.declarations[0].init.callee.name === 'require' &&
          node.declarations[0].init.arguments[0]?.type === 'Literal'
        ) {
          registerNode(node)
        }
      },
      'Program:exit': () => {
        sortImportNodes({
          sortingNodesWithoutPartitionId,
          context,
          options,
        })
      },
      TSImportEqualsDeclaration: registerNode,
      ImportDeclaration: registerNode,
    }
  },
  meta: {
    schema: {
      items: {
        properties: {
          ...buildCommonJsonSchemas({
            allowedAdditionalTypeValues: [TYPE_IMPORT_FIRST_TYPE_OPTION],
          }),
          ...buildCommonGroupsJsonSchemas({
            allowedAdditionalTypeValues: [TYPE_IMPORT_FIRST_TYPE_OPTION],
            singleCustomGroupJsonSchema,
          }),
          tsconfig: {
            properties: {
              rootDir: {
                description: 'Specifies the tsConfig root directory.',
                type: 'string',
              },
              filename: {
                description: 'Specifies the tsConfig filename.',
                type: 'string',
              },
            },
            additionalProperties: false,
            required: ['rootDir'],
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
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
          internalPattern: buildRegexJsonSchema(),
        },
        additionalProperties: false,
        type: 'object',
      },
      uniqueItems: true,
      type: 'array',
    },
    messages: {
      [MISSED_COMMENT_ABOVE_ERROR_ID]: MISSED_COMMENT_ABOVE_ERROR,
      [DEPENDENCY_ORDER_ERROR_ID]: DEPENDENCY_ORDER_ERROR,
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-imports',
      description: 'Enforce sorted imports.',
      recommended: true,
    },
    defaultOptions: [defaultOptions],
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-imports',
})

function sortImportNodes({
  sortingNodesWithoutPartitionId,
  options,
  context,
}: {
  sortingNodesWithoutPartitionId: Omit<SortImportsSortingNode, 'partitionId'>[]
  context: Readonly<TSESLint.RuleContext<MessageId, Options>>
  options: Required<Options[number]>
}): void {
  let { sourceCode } = context
  let optionsByGroupIndexComputer =
    buildDefaultOptionsByGroupIndexComputer(options)

  let contentSeparatedSortingNodeGroups: SortImportsSortingNode[][][] = [[[]]]
  for (let sortingNodeWithoutPartitionId of sortingNodesWithoutPartitionId) {
    let lastGroupWithNoContentBetween =
      contentSeparatedSortingNodeGroups.at(-1)!
    let lastGroup = lastGroupWithNoContentBetween.at(-1)!
    let lastSortingNode = lastGroup.at(-1)

    if (
      lastSortingNode &&
      hasContentBetweenNodes(lastSortingNode, sortingNodeWithoutPartitionId)
    ) {
      lastGroup = []
      lastGroupWithNoContentBetween = [lastGroup]
      contentSeparatedSortingNodeGroups.push(lastGroupWithNoContentBetween)
    } else if (
      shouldPartition({
        sortingNode: sortingNodeWithoutPartitionId,
        lastSortingNode,
        sourceCode,
        options,
      })
    ) {
      lastGroup = []
      lastGroupWithNoContentBetween.push(lastGroup)
    }

    lastGroup.push({
      ...sortingNodeWithoutPartitionId,
      partitionId: lastGroupWithNoContentBetween.length,
    })
  }

  for (let sortingNodeGroups of contentSeparatedSortingNodeGroups) {
    let nodes = sortingNodeGroups.flat()

    reportAllErrors<MessageId>({
      availableMessageIds: {
        unexpectedDependencyOrder: DEPENDENCY_ORDER_ERROR_ID,
        missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
        extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
        missedCommentAbove: MISSED_COMMENT_ABOVE_ERROR_ID,
        unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
        unexpectedOrder: ORDER_ERROR_ID,
      },
      sortNodesExcludingEslintDisabled:
        createSortNodesExcludingEslintDisabled(sortingNodeGroups),
      options,
      context,
      nodes,
    })
  }

  function createSortNodesExcludingEslintDisabled(
    nodeGroups: SortImportsSortingNode[][],
  ) {
    return function (
      ignoreEslintDisabledNodes: boolean,
    ): SortImportsSortingNode[] {
      let nodesSortedByGroups = nodeGroups.flatMap(nodes =>
        sortNodesByGroups({
          isNodeIgnoredForGroup: ({ groupIndex }) => {
            if (options.sortSideEffects) {
              return false
            }
            return isSideEffectOnlyGroup(options.groups[groupIndex])
          },
          isNodeIgnored: node => node.isIgnored,
          optionsByGroupIndexComputer,
          comparatorByOptionsComputer,
          ignoreEslintDisabledNodes,
          groups: options.groups,
          nodes,
        }),
      )

      return sortNodesByDependencies(nodesSortedByGroups, {
        ignoreEslintDisabledNodes,
      })
    }
  }

  function hasContentBetweenNodes(
    left: Pick<SortImportsSortingNode, 'node'>,
    right: Pick<SortImportsSortingNode, 'node'>,
  ): boolean {
    return (
      sourceCode.getTokensBetween(left.node, right.node, {
        includeComments: false,
      }).length > 0
    )
  }
}

function computeGroupExceptUnknown({
  selectors,
  modifiers,
  options,
  name,
}: {
  options: Required<Options[number]>
  selectors: Selector[]
  modifiers: Modifier[]
  name: string
}): string | null {
  let predefinedGroups = generatePredefinedGroups({
    cache: cachedGroupsByModifiersAndSelectors,
    selectors,
    modifiers,
  })
  let computedCustomGroup = computeGroup({
    customGroupMatcher: customGroup =>
      doesCustomGroupMatch({
        elementName: name,
        customGroup,
        modifiers,
        selectors,
      }),
    predefinedGroups,
    options,
  })
  if (computedCustomGroup === 'unknown') {
    return null
  }
  return computedCustomGroup
}

let styleExtensions = [
  '.less',
  '.scss',
  '.sass',
  '.styl',
  '.pcss',
  '.css',
  '.sss',
]
function isStyle(value: string): boolean {
  let [cleanedValue] = value.split('?')
  return styleExtensions.some(extension => cleanedValue?.endsWith(extension))
}
