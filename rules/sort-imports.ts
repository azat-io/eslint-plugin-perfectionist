import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  SortImportsSortingNode,
  Modifier,
  Selector,
  Options,
} from './sort-imports/types'
import type { CustomOrderFixesParameters } from '../utils/make-fixes'

import {
  additionalCustomGroupMatchOptionsJsonSchema,
  additionalSortOptionsJsonSchema,
  TYPE_IMPORT_FIRST_TYPE_OPTION,
  allModifiers,
  allSelectors,
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
  useExperimentalDependencyDetectionJsonSchema,
  buildCommonJsonSchemas,
  buildRegexJsonSchema,
} from '../utils/json-schemas/common-json-schemas'
import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { isNonExternalReferenceTsImportEquals } from './sort-imports/is-non-external-reference-ts-import-equals'
import { validateSideEffectsConfiguration } from './sort-imports/validate-side-effects-configuration'
import { buildOptionsByGroupIndexComputer } from '../utils/build-options-by-group-index-computer'
import { computeDependenciesBySortingNode } from '../utils/compute-dependencies-by-sorting-node'
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
import { getNewlinesBetweenOption } from '../utils/get-newlines-between-option'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { computeSpecifierName } from './sort-imports/compute-specifier-name'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { computeDependencies } from './sort-imports/compute-dependencies'
import { isSideEffectImport } from './sort-imports/is-side-effect-import'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { UnreachableCaseError } from '../utils/unreachable-case-error'
import { isNodeOnSingleLine } from '../utils/is-node-on-single-line'
import { computeNodeName } from './sort-imports/compute-node-name'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { getGroupIndex } from '../utils/get-group-index'
import { getNodeRange } from '../utils/get-node-range'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

/**
 * Cache computed groups by modifiers and selectors for performance.
 */
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
  useExperimentalDependencyDetection: true,
  internalPattern: ['^~/.+', '^@/.+'],
  fallbackSort: { type: 'unsorted' },
  partitionImportsSplitOnSort: false,
  partitionSortingStable: true,
  partitionByComment: false,
  partitionByNewLine: false,
  specialCharacters: 'keep',
  tsconfig: { rootDir: '' },
  partitionSorting: 'off',
  maxLineLength: Infinity,
  sortSideEffects: false,
  type: 'alphabetical',
  environment: 'node',
  newlinesBetween: 1,
  newlinesInside: 0,
  customGroups: [],
  ignoreCase: true,
  locales: 'en-US',
  sortBy: 'path',
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
    let tsConfigOutput =
      tsconfigRootDirectory ?
        readClosestTsConfigByPath({
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

      if (
        node.type !== AST_NODE_TYPES.VariableDeclaration &&
        node.importKind === 'type'
      ) {
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

      if (node.type === AST_NODE_TYPES.TSImportEqualsDeclaration) {
        modifiers.push('ts-equals')
      }

      if (node.type === AST_NODE_TYPES.VariableDeclaration) {
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

      let hasMultipleImportDeclarations =
        node.type === AST_NODE_TYPES.ImportDeclaration &&
        isSortable(node.specifiers)
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
        dependencies:
          options.useExperimentalDependencyDetection ?
            []
          : computeDependencies(node),
        isEslintDisabled: isNodeEslintDisabled(node, eslintDisabledLines),
        dependencyNames: computeDependencyNames({ sourceCode, node }),
        specifierName: computeSpecifierName({ sourceCode, node }),
        isTypeImport: modifiers.includes('type'),
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
          node.declarations[0].init?.type === AST_NODE_TYPES.CallExpression &&
          node.declarations[0].init.callee.type === AST_NODE_TYPES.Identifier &&
          node.declarations[0].init.callee.name === 'require' &&
          node.declarations[0].init.arguments[0]?.type ===
            AST_NODE_TYPES.Literal
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
            additionalSortProperties: additionalSortOptionsJsonSchema,
          }),
          ...buildCommonGroupsJsonSchemas({
            additionalCustomGroupMatchProperties:
              additionalCustomGroupMatchOptionsJsonSchema,
            allowedAdditionalTypeValues: [TYPE_IMPORT_FIRST_TYPE_OPTION],
            additionalSortProperties: additionalSortOptionsJsonSchema,
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
          partitionSorting: {
            description:
              'Controls partition reordering when partitionByNewLine is enabled.',
            enum: ['off', 'type-first'],
            type: 'string',
          },
          maxLineLength: {
            description: 'Specifies the maximum line length.',
            exclusiveMinimum: true,
            type: 'integer',
            minimum: 0,
          },
          partitionImportsSplitOnSort: {
            description:
              'Controls whether specifier sorting can split import declarations.',
            type: 'boolean',
          },
          partitionSortingStable: {
            description:
              'Whether to keep partition order stable within the same category.',
            type: 'boolean',
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
          useExperimentalDependencyDetection:
            useExperimentalDependencyDetectionJsonSchema,
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
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-imports',
})

interface SortImportsSpecifierSortingNode extends SortImportsSortingNode {
  specifierKind?: 'namespace' | 'default' | 'named'
  parentImportNode?: TSESTree.ImportDeclaration
  parentSortingNode: SortImportsSortingNode
  specifier?: TSESTree.ImportClause
}

interface PartitionSortingInfo {
  sortedPartitions: PartitionInfo[]
  partitions: PartitionInfo[]
  separatorsBetween: string[]
  regionStart: number
  regionEnd: number
}

interface PartitionInfo {
  nodeSet: Set<SortImportsSortingNode>
  nodes: SortImportsSortingNode[]
  isTypeOnly: boolean
  start: number
  end: number
}
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
  let optionsByGroupIndexComputer = buildOptionsByGroupIndexComputer(options)

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

  for (let contentSeparatedSortingNodeGroup of contentSeparatedSortingNodeGroups) {
    let sortingNodeGroups = [...contentSeparatedSortingNodeGroup]
    let sortingNodes = sortingNodeGroups.flat()
    let partitionSortingInfo =
      shouldSortPartitions(options) && sortingNodes.length > 0 ?
        buildPartitionSortingInfo({
          sortingNodeGroups,
          sourceCode,
          options,
        })
      : null

    if (options.useExperimentalDependencyDetection) {
      let allSortingNodes = sortingNodeGroups.flat()
      let dependenciesBySortingNode = computeDependenciesBySortingNode({
        sortingNodes: allSortingNodes,
        sourceCode,
      })
      for (let sortingNode of allSortingNodes) {
        sortingNode.dependencies =
          dependenciesBySortingNode
            .get(sortingNode)
            ?.flatMap(({ dependencyNames }) => dependencyNames) ?? []
      }
    }

    let expandedSortingNodeGroups =
      options.partitionImportsSplitOnSort ?
        sortingNodeGroups.map(nodes =>
          expandSortingNodesBySpecifier({
            sourceCode,
            options,
            nodes,
          }),
        )
      : (sortingNodeGroups as SortImportsSpecifierSortingNode[][])
    let expandedSortingNodeGroupsForSorting =
      partitionSortingInfo ?
        partitionSortingInfo.sortedPartitions.map(({ nodes }) => {
          let index = sortingNodeGroups.indexOf(nodes)
          return expandedSortingNodeGroups[index]!
        })
      : expandedSortingNodeGroups

    let expandedSortingNodes =
      options.partitionImportsSplitOnSort ?
        expandedSortingNodeGroups.flat()
      : (sortingNodes as SortImportsSpecifierSortingNode[])
    let usesSpecifierSorting =
      options.partitionImportsSplitOnSort &&
      expandedSortingNodes.some(node => node.specifier)

    let sortedNodesForIgnore =
      usesSpecifierSorting ?
        createSortNodesExcludingEslintDisabled(
          expandedSortingNodeGroupsForSorting,
        )(false)
      : null
    let sortedNodeIndexForIgnore =
      sortedNodesForIgnore ?
        new Map(sortedNodesForIgnore.map((node, index) => [node, index]))
      : null

    let partitionInfo =
      usesSpecifierSorting ?
        (partitionSortingInfo ??
        buildPartitionInfo({
          sortingNodeGroups,
          sourceCode,
          options,
        }))
      : null

    let partitionOrderFixes =
      partitionSortingInfo === null ? undefined : (
        createPartitionOrderFixes({
          partitionSortingInfo,
          sourceCode,
          options,
        })
      )

    reportAllErrors<MessageId, SortImportsSpecifierSortingNode>({
      availableMessageIds: {
        unexpectedDependencyOrder: DEPENDENCY_ORDER_ERROR_ID,
        missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
        extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
        missedCommentAbove: MISSED_COMMENT_ABOVE_ERROR_ID,
        unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
        unexpectedOrder: ORDER_ERROR_ID,
      },
      shouldIgnoreOrder:
        usesSpecifierSorting ?
          (left, right) =>
            shouldIgnoreSpecifierOrder({
              sortedNodeIndex: sortedNodeIndexForIgnore!,
              sortedNodes: sortedNodesForIgnore!,
              right,
              left,
            })
        : undefined,
      newlinesBetweenValueGetter:
        usesSpecifierSorting ?
          ({ computedNewlinesBetween, right, left }) =>
            left.parentSortingNode === right.parentSortingNode ?
              'ignore'
            : computedNewlinesBetween
        : undefined,
      customOrderFixes:
        usesSpecifierSorting && partitionInfo !== null ?
          createSpecifierAwareOrderFixes({
            partitionInfo,
            sourceCode,
            options,
          })
        : partitionOrderFixes,
      sortNodesExcludingEslintDisabled: createSortNodesExcludingEslintDisabled(
        expandedSortingNodeGroupsForSorting,
      ),
      customOrderFixesAreSingleRange:
        usesSpecifierSorting || !!partitionSortingInfo,
      nodes: expandedSortingNodes,
      options,
      context,
    })
  }

  function createSortNodesExcludingEslintDisabled(
    nodeGroups: SortImportsSpecifierSortingNode[][],
  ) {
    return function (
      ignoreEslintDisabledNodes: boolean,
    ): SortImportsSpecifierSortingNode[] {
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

function shouldIgnoreSpecifierOrder({
  sortedNodeIndex,
  sortedNodes,
  right,
  left,
}: {
  sortedNodeIndex: Map<SortImportsSpecifierSortingNode, number>
  sortedNodes: SortImportsSpecifierSortingNode[]
  left: SortImportsSpecifierSortingNode | null
  right: SortImportsSpecifierSortingNode
}): boolean {
  if (!left?.parentImportNode || !right.parentImportNode) {
    return false
  }
  if (left.parentImportNode !== right.parentImportNode) {
    return false
  }

  let leftIndex = sortedNodeIndex.get(left)
  let rightIndex = sortedNodeIndex.get(right)
  /* v8 ignore next 2 -- @preserve Defensive guard for unexpected index lookups. */
  if (leftIndex === undefined || rightIndex === undefined) {
    return false
  }

  let start = Math.min(leftIndex, rightIndex)
  let end = Math.max(leftIndex, rightIndex)
  for (let i = start + 1; i < end; i++) {
    if (sortedNodes[i]!.parentImportNode !== left.parentImportNode) {
      return false
    }
  }

  return true
}

let namedSpecifierSegmentsCache = new WeakMap<
  TSESTree.ImportDeclaration,
  {
    segmentsBySpecifier: Map<TSESTree.ImportSpecifier, string>
    trailingWhitespace: string
    hasTrailingComma: boolean
    leadingWhitespace: string
    trailingText: string
  }
>()

type OutputNode =
  | {
      sortingNode: SortImportsSpecifierSortingNode
      parentImportNode: TSESTree.ImportDeclaration
      specifiers: TSESTree.ImportClause[]
      includeLeadingComments: boolean
      includeTrailingComment: boolean
      kind: 'split-import'
    }
  | {
      sortingNode: SortImportsSpecifierSortingNode
      kind: 'original'
    }

function buildOutputNodes(
  sortedNodes: SortImportsSpecifierSortingNode[],
): OutputNode[] {
  let lastIndexByParent = new Map<TSESTree.ImportDeclaration, number>()
  let groupCountByParent = new Map<TSESTree.ImportDeclaration, number>()
  let previousParent: TSESTree.ImportDeclaration | null = null
  for (let [index, node] of sortedNodes.entries()) {
    if (node.specifier && node.parentImportNode) {
      lastIndexByParent.set(node.parentImportNode, index)
      if (previousParent !== node.parentImportNode) {
        groupCountByParent.set(
          node.parentImportNode,
          (groupCountByParent.get(node.parentImportNode) ?? 0) + 1,
        )
      }
      previousParent = node.parentImportNode
    } else {
      previousParent = null
    }
  }

  let outputNodes: OutputNode[] = []
  let seenParents = new Set<TSESTree.ImportDeclaration>()
  let emittedParents = new Set<TSESTree.ImportDeclaration>()
  let currentGroup: OutputNode | null = null

  for (let [index, node] of sortedNodes.entries()) {
    if (node.specifier && node.parentImportNode) {
      if (groupCountByParent.get(node.parentImportNode) === 1) {
        if (currentGroup) {
          outputNodes.push(currentGroup)
          currentGroup = null
        }
        if (!emittedParents.has(node.parentImportNode)) {
          outputNodes.push({
            sortingNode: node,
            kind: 'original',
          })
          emittedParents.add(node.parentImportNode)
        }
        continue
      }

      if (
        currentGroup?.kind === 'split-import' &&
        currentGroup.parentImportNode === node.parentImportNode
      ) {
        currentGroup.specifiers.push(node.specifier)
      } else {
        if (currentGroup) {
          outputNodes.push(currentGroup)
        }
        currentGroup = {
          includeLeadingComments: !seenParents.has(node.parentImportNode),
          parentImportNode: node.parentImportNode,
          includeTrailingComment: false,
          specifiers: [node.specifier],
          kind: 'split-import',
          sortingNode: node,
        }
        seenParents.add(node.parentImportNode)
      }

      if (index === lastIndexByParent.get(node.parentImportNode)) {
        currentGroup.includeTrailingComment = true
      }
      continue
    }

    if (currentGroup) {
      outputNodes.push(currentGroup)
      currentGroup = null
    }
    outputNodes.push({
      sortingNode: node,
      kind: 'original',
    })
  }

  if (currentGroup) {
    outputNodes.push(currentGroup)
  }

  return outputNodes
}

function buildSplitImportDeclarationText({
  specifiers,
  sourceCode,
  importNode,
}: {
  importNode: TSESTree.ImportDeclaration
  specifiers: TSESTree.ImportClause[]
  sourceCode: TSESLint.SourceCode
}): string {
  let defaultSpecifier = specifiers.find(
    specifier => specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier,
  )
  let namespaceSpecifier = specifiers.find(
    specifier => specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier,
  )
  let namedSpecifiers = specifiers.filter(
    specifier => specifier.type === AST_NODE_TYPES.ImportSpecifier,
  )

  let importKeyword =
    importNode.importKind === 'type' ? 'import type' : 'import'
  let sourceText = sourceCode.getText(importNode.source)

  let namedText = ''
  if (namedSpecifiers.length > 0) {
    let segmentInfo = getNamedSpecifierSegments(importNode, sourceCode)
    namedText = namedSpecifiers
      .map(specifier =>
        segmentInfo.segmentsBySpecifier.get(specifier)!.trimEnd(),
      )
      .join(',')
    if (segmentInfo.hasTrailingComma) {
      namedText += `,${segmentInfo.trailingText}`
    }
    if (
      segmentInfo.trailingWhitespace &&
      !namedText.endsWith(segmentInfo.trailingWhitespace)
    ) {
      namedText += segmentInfo.trailingWhitespace
    }
  }

  let importClause = ''
  if (namespaceSpecifier) {
    // Default + namespace never appear in the same split group.
    importClause = sourceCode.getText(namespaceSpecifier)
  } else if (namedSpecifiers.length > 0) {
    let namedBlock = `{${namedText}}`
    if (defaultSpecifier) {
      let defaultText = sourceCode.getText(defaultSpecifier)
      importClause = `${defaultText}, ${namedBlock}`
    } else {
      importClause = namedBlock
    }
  } else {
    importClause = sourceCode.getText(defaultSpecifier)
  }

  let statement = `${importKeyword} ${importClause} from ${sourceText}`
  if (sourceCode.getText(importNode).trimEnd().endsWith(';')) {
    statement += ';'
  }
  return statement
}

function getNamedSpecifierSegments(
  importNode: TSESTree.ImportDeclaration,
  sourceCode: TSESLint.SourceCode,
): {
  segmentsBySpecifier: Map<TSESTree.ImportSpecifier, string>
  trailingWhitespace: string
  hasTrailingComma: boolean
  leadingWhitespace: string
  trailingText: string
} {
  let cached = namedSpecifierSegmentsCache.get(importNode)
  if (cached) {
    return cached
  }

  let namedSpecifiers = importNode.specifiers.filter(
    specifier => specifier.type === AST_NODE_TYPES.ImportSpecifier,
  )
  let tokens = sourceCode.getTokens(importNode, { includeComments: false })
  let openBrace = tokens.find(token => token.value === '{')!
  let closeBrace = [...tokens].toReversed().find(token => token.value === '}')!

  let content = sourceCode.text.slice(openBrace.range[1], closeBrace.range[0])
  let segments = splitNamedImportContent(content)
  let [leadingWhitespace] = content.match(/^\s*/u)!
  let [trailingWhitespace] = content.match(/\s*$/u)!

  let specifierSegments = segments.slice(0, namedSpecifiers.length)
  let trailingText = segments.slice(namedSpecifiers.length).join(',')
  let hasTrailingComma = segments.length > namedSpecifiers.length

  let segmentsBySpecifier = new Map<TSESTree.ImportSpecifier, string>()
  for (let [index, specifier] of namedSpecifiers.entries()) {
    segmentsBySpecifier.set(specifier, specifierSegments[index]!)
  }

  let result = {
    segmentsBySpecifier,
    trailingWhitespace,
    leadingWhitespace,
    hasTrailingComma,
    trailingText,
  }
  namedSpecifierSegmentsCache.set(importNode, result)
  return result
}

function createSpecifierAwareOrderFixes({
  partitionInfo,
  sourceCode,
  options,
}: {
  partitionInfo: PartitionSortingInfo
  options: Required<Options[number]>
  sourceCode: TSESLint.SourceCode
}) {
  return function ({
    sortedNodes,
    fixer,
  }: CustomOrderFixesParameters<SortImportsSpecifierSortingNode>): TSESLint.RuleFix[] {
    let { separatorsBetween, sortedPartitions, regionStart, regionEnd } =
      partitionInfo
    let updatedText = sortedPartitions
      .map((partition, index) => {
        let partitionNodes = sortedNodes.filter(node =>
          partition.nodeSet.has(node.parentSortingNode),
        )
        let partitionText =
          needsSplitImportDeclarations(partitionNodes) ?
            buildSortedPartitionTextWithSpecifiers({
              sortedNodes: partitionNodes,
              sourceCode,
              options,
            })
          : buildSortedPartitionText({
              sortedNodes: getSortedOriginalNodes(partitionNodes),
              sourceCode,
              partition,
              options,
            })
        let separator =
          index < separatorsBetween.length ? separatorsBetween[index] : ''
        return `${partitionText}${separator}`
      })
      .join('')

    return [fixer.replaceTextRange([regionStart, regionEnd], updatedText)]
  }
}

function buildOutputNodeText({
  outputNode,
  sourceCode,
  options,
}: {
  options: Required<Options[number]>
  sourceCode: TSESLint.SourceCode
  outputNode: OutputNode
}): string {
  if (outputNode.kind === 'original') {
    return sourceCode.text.slice(
      ...getNodeRangeWithInlineComment({
        node: outputNode.sortingNode.node,
        sourceCode,
        options,
      }),
    )
  }

  let {
    includeTrailingComment,
    includeLeadingComments,
    parentImportNode,
    specifiers,
  } = outputNode
  let leadingText = ''
  if (includeLeadingComments) {
    let [start] = getNodeRange({
      node: parentImportNode,
      sourceCode,
      options,
    })
    leadingText = sourceCode.text.slice(start, parentImportNode.range.at(0))
  }

  let trailingText = ''
  if (includeTrailingComment) {
    let inlineComment = getInlineCommentAfter(parentImportNode, sourceCode)
    if (inlineComment) {
      trailingText = sourceCode.text.slice(
        parentImportNode.range.at(1),
        inlineComment.range.at(1),
      )
    }
  }

  let importText = buildSplitImportDeclarationText({
    importNode: parentImportNode,
    sourceCode,
    specifiers,
  })

  return `${leadingText}${importText}${trailingText}`
}

function buildSortedPartitionText({
  sortedNodes,
  sourceCode,
  partition,
  options,
}: {
  sortedNodes: SortImportsSortingNode[]
  options: Required<Options[number]>
  sourceCode: TSESLint.SourceCode
  partition: PartitionInfo
}): string {
  let sortedPartitionNodes = sortedNodes.filter(node =>
    partition.nodeSet.has(node),
  )

  let text = ''
  let cursor = partition.start
  for (let i = 0; i < partition.nodes.length; i++) {
    let currentNode = partition.nodes[i]!
    let sortedNode = sortedPartitionNodes[i]!
    let nodeRange = getNodeRangeWithInlineComment({
      node: currentNode.node,
      sourceCode,
      options,
    })

    text += sourceCode.text.slice(cursor, nodeRange.at(0))
    let sortedNodeText = sourceCode.text.slice(
      ...getNodeRangeWithInlineComment({
        node: sortedNode.node,
        sourceCode,
        options,
      }),
    )

    sortedNodeText = addSafetySemicolonIfNeeded({
      text: sortedNodeText,
      node: currentNode,
      sortedNode,
      sourceCode,
    })

    text += sortedNodeText
    cursor = nodeRange.at(1)!
  }

  text += sourceCode.text.slice(cursor, partition.end)
  return text
}

function buildPartitionSortingInfo({
  sortingNodeGroups,
  sourceCode,
  options,
}: {
  sortingNodeGroups: SortImportsSortingNode[][]
  options: Required<Options[number]>
  sourceCode: TSESLint.SourceCode
}): PartitionSortingInfo {
  let partitions = sortingNodeGroups.map(nodes => {
    let start = getNodeRange({
      node: nodes.at(0)!.node,
      sourceCode,
      options,
    }).at(0)!
    let end = getPartitionEnd({
      node: nodes.at(-1)!.node,
      sourceCode,
    })

    return {
      isTypeOnly: isTypeOnlyPartition(nodes),
      nodeSet: new Set(nodes),
      start,
      nodes,
      end,
    }
  })

  let separatorsBetween = partitions.slice(0, -1).map((partition, index) => {
    let nextPartition = partitions[index + 1]!
    return sourceCode.text.slice(partition.end, nextPartition.start)
  })

  let sortedPartitions = orderPartitionsByTypeFirst({
    stable: options.partitionSortingStable,
    partitions,
  })

  return {
    regionStart: partitions.at(0)!.start,
    regionEnd: partitions.at(-1)!.end,
    separatorsBetween,
    sortedPartitions,
    partitions,
  }
}

function expandSortingNodesBySpecifier({
  sourceCode,
  options,
  nodes,
}: {
  options: Required<Options[number]>
  nodes: SortImportsSortingNode[]
  sourceCode: TSESLint.SourceCode
}): SortImportsSpecifierSortingNode[] {
  return nodes.flatMap(node => {
    let importNode =
      node.node.type === AST_NODE_TYPES.ImportDeclaration ? node.node : null

    if (
      options.sortBy !== 'specifier' ||
      !importNode ||
      !isSortable(importNode.specifiers)
    ) {
      return [
        Object.assign(node, {
          parentSortingNode: node,
        }) as SortImportsSpecifierSortingNode,
      ]
    }

    return importNode.specifiers.map(specifier => ({
      ...node,
      dependencyNames: [
        computeImportSpecifierDependencyName(specifier, sourceCode),
      ],
      specifierName: computeImportSpecifierName(specifier),
      specifierKind: getSpecifierKind(specifier),
      size: rangeToDiff(specifier, sourceCode),
      parentImportNode: importNode,
      parentSortingNode: node,
      node: importNode,
      specifier,
    }))
  })
}

function createPartitionOrderFixes({
  partitionSortingInfo,
  sourceCode,
  options,
}: {
  partitionSortingInfo: PartitionSortingInfo
  options: Required<Options[number]>
  sourceCode: TSESLint.SourceCode
}) {
  return function ({
    sortedNodes,
    fixer,
  }: CustomOrderFixesParameters<SortImportsSortingNode>): TSESLint.RuleFix[] {
    let { separatorsBetween, sortedPartitions, regionStart, regionEnd } =
      partitionSortingInfo
    let updatedText = sortedPartitions
      .map((partition, index) => {
        let partitionText = buildSortedPartitionText({
          sortedNodes,
          sourceCode,
          partition,
          options,
        })
        let separator =
          index < separatorsBetween.length ? separatorsBetween[index] : ''
        return `${partitionText}${separator}`
      })
      .join('')
    let originalText = sourceCode.text.slice(regionStart, regionEnd)
    if (updatedText === originalText) {
      return []
    }

    return [fixer.replaceTextRange([regionStart, regionEnd], updatedText)]
  }
}

function splitNamedImportContent(content: string): string[] {
  let segments: string[] = []
  let start = 0
  let index = 0
  let inLineComment = false
  let inBlockComment = false

  while (index < content.length) {
    let char = content[index]
    let next = content[index + 1]

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false
      }
      index += 1
      continue
    }

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false
        index += 2
        continue
      }
      index += 1
      continue
    }

    if (char === '/' && next === '/') {
      inLineComment = true
      index += 2
      continue
    }

    if (char === '/' && next === '*') {
      inBlockComment = true
      index += 2
      continue
    }

    if (char === ',') {
      segments.push(content.slice(start, index))
      start = index + 1
      index += 1
      continue
    }

    index += 1
  }

  segments.push(content.slice(start))
  return segments
}

function buildPartitionInfo({
  sortingNodeGroups,
  sourceCode,
  options,
}: {
  sortingNodeGroups: SortImportsSortingNode[][]
  options: Required<Options[number]>
  sourceCode: TSESLint.SourceCode
}): PartitionSortingInfo {
  let partitions = sortingNodeGroups.map(nodes => {
    let start = getNodeRange({
      node: nodes.at(0)!.node,
      sourceCode,
      options,
    }).at(0)!
    let end = getPartitionEnd({
      node: nodes.at(-1)!.node,
      sourceCode,
    })

    return {
      isTypeOnly: isTypeOnlyPartition(nodes),
      nodeSet: new Set(nodes),
      start,
      nodes,
      end,
    }
  })

  let separatorsBetween = partitions.slice(0, -1).map((partition, index) => {
    let nextPartition = partitions[index + 1]!
    return sourceCode.text.slice(partition.end, nextPartition.start)
  })

  return {
    regionStart: partitions.at(0)!.start,
    regionEnd: partitions.at(-1)!.end,
    sortedPartitions: partitions,
    separatorsBetween,
    partitions,
  }
}

function addSafetySemicolonIfNeeded({
  sortedNode,
  sourceCode,
  node,
  text,
}: {
  sortedNode: SortImportsSortingNode
  sourceCode: TSESLint.SourceCode
  node: SortImportsSortingNode
  text: string
}): string {
  let sortedNodeText = sourceCode.getText(sortedNode.node)
  let tokensAfter = sourceCode.getTokensAfter(node.node, {
    includeComments: false,
    count: 1,
  })
  let nextToken = tokensAfter.at(0)

  let sortedNextNodeEndsWithSafeCharacter =
    sortedNodeText.endsWith(';') || sortedNodeText.endsWith(',')
  let isNextTokenOnSameLineAsNode =
    nextToken?.loc.start.line === node.node.loc.end.line
  let isNextTokenSafeCharacter =
    nextToken?.value === ';' || nextToken?.value === ','

  if (
    isNextTokenOnSameLineAsNode &&
    !sortedNextNodeEndsWithSafeCharacter &&
    !isNextTokenSafeCharacter
  ) {
    return `${text};`
  }

  return text
}

function buildSortedPartitionTextWithSpecifiers({
  sortedNodes,
  sourceCode,
  options,
}: {
  sortedNodes: SortImportsSpecifierSortingNode[]
  options: Required<Options[number]>
  sourceCode: TSESLint.SourceCode
}): string {
  let outputNodes = buildOutputNodes(sortedNodes)
  let text = ''
  for (let i = 0; i < outputNodes.length; i++) {
    let current = outputNodes[i]!
    let next = outputNodes[i + 1]
    text += buildOutputNodeText({
      outputNode: current,
      sourceCode,
      options,
    })
    if (next) {
      text += buildSeparatorBetweenOutputNodes({
        left: current.sortingNode,
        right: next.sortingNode,
        options,
      })
    }
  }
  return text
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

function needsSplitImportDeclarations(
  sortedNodes: SortImportsSpecifierSortingNode[],
): boolean {
  let seenParents = new Set<TSESTree.ImportDeclaration>()
  let lastParent: TSESTree.ImportDeclaration | null = null

  for (let node of sortedNodes) {
    if (!node.parentImportNode || !node.specifier) {
      lastParent = null
      continue
    }

    if (
      seenParents.has(node.parentImportNode) &&
      lastParent !== node.parentImportNode
    ) {
      return true
    }

    seenParents.add(node.parentImportNode)
    lastParent = node.parentImportNode
  }

  return false
}

function buildSeparatorBetweenOutputNodes({
  options,
  right,
  left,
}: {
  right: SortImportsSpecifierSortingNode
  left: SortImportsSpecifierSortingNode
  options: Required<Options[number]>
}): string {
  let leftGroupIndex = getGroupIndex(options.groups, left)
  let rightGroupIndex = getGroupIndex(options.groups, right)
  let newlinesBetween = getNewlinesBetweenOption({
    nextNodeGroupIndex: rightGroupIndex,
    nodeGroupIndex: leftGroupIndex,
    options,
  })

  if (newlinesBetween === 'ignore') {
    newlinesBetween = 0
  }

  return '\n'.repeat(newlinesBetween + 1)
}

function computeImportSpecifierDependencyName(
  specifier: TSESTree.ImportClause,
  sourceCode: TSESLint.SourceCode,
): string {
  switch (specifier.type) {
    case AST_NODE_TYPES.ImportNamespaceSpecifier:
    case AST_NODE_TYPES.ImportDefaultSpecifier:
      return sourceCode.getText(specifier.local)
    case AST_NODE_TYPES.ImportSpecifier:
      return sourceCode.getText(specifier.imported)
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(specifier)
  }
}

function getInlineCommentAfter(
  node: SortImportsSortingNode['node'],
  sourceCode: TSESLint.SourceCode,
): TSESTree.Comment | null {
  let token = sourceCode.getTokenAfter(node, {
    filter: ({ value, type }) =>
      type !== 'Punctuator' || ![',', ';', ':'].includes(value),
    includeComments: true,
  })

  if (
    (token?.type === 'Block' || token?.type === 'Line') &&
    node.loc.end.line === token.loc.end.line
  ) {
    return token
  }

  return null
}

function getSpecifierKind(
  specifier: TSESTree.ImportClause,
): 'namespace' | 'default' | 'named' {
  switch (specifier.type) {
    case AST_NODE_TYPES.ImportNamespaceSpecifier:
      return 'namespace'
    case AST_NODE_TYPES.ImportDefaultSpecifier:
      return 'default'
    case AST_NODE_TYPES.ImportSpecifier:
      return 'named'
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(specifier)
  }
}

function computeImportSpecifierName(specifier: TSESTree.ImportClause): string {
  switch (specifier.type) {
    case AST_NODE_TYPES.ImportNamespaceSpecifier:
    case AST_NODE_TYPES.ImportDefaultSpecifier:
      return specifier.local.name
    case AST_NODE_TYPES.ImportSpecifier:
      return specifier.local.name
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(specifier)
  }
}

function getSortedOriginalNodes(
  sortedNodes: SortImportsSpecifierSortingNode[],
): SortImportsSortingNode[] {
  let seenNodes = new Set<SortImportsSortingNode>()
  let originalNodes: SortImportsSortingNode[] = []

  for (let node of sortedNodes) {
    let parentNode = node.parentSortingNode
    if (!seenNodes.has(parentNode)) {
      seenNodes.add(parentNode)
      originalNodes.push(parentNode)
    }
  }

  return originalNodes
}

function orderPartitionsByTypeFirst({
  partitions,
  stable,
}: {
  partitions: PartitionInfo[]
  stable: boolean
}): PartitionInfo[] {
  if (stable) {
    return [
      ...partitions.filter(partition => partition.isTypeOnly),
      ...partitions.filter(partition => !partition.isTypeOnly),
    ]
  }

  return partitions.toSorted(
    (left, right) => Number(right.isTypeOnly) - Number(left.isTypeOnly),
  )
}

function getNodeRangeWithInlineComment({
  sourceCode,
  options,
  node,
}: {
  node: SortImportsSortingNode['node']
  options: Required<Options[number]>
  sourceCode: TSESLint.SourceCode
}): TSESTree.Range {
  let start = getNodeRange({
    sourceCode,
    options,
    node,
  }).at(0)!

  return [start, getPartitionEnd({ sourceCode, node })]
}

function getPartitionEnd({
  sourceCode,
  node,
}: {
  node: SortImportsSortingNode['node']
  sourceCode: TSESLint.SourceCode
}): number {
  let end = node.range.at(1)!
  let inlineCommentAfter = getInlineCommentAfter(node, sourceCode)
  if (inlineCommentAfter) {
    end = inlineCommentAfter.range.at(1)!
  }
  return end
}

function isTypeOnlyPartition(nodes: SortImportsSortingNode[]): boolean {
  return nodes.every(
    ({ node }) =>
      node.type === AST_NODE_TYPES.ImportDeclaration &&
      node.importKind === 'type',
  )
}

function shouldSortPartitions(options: Required<Options[number]>): boolean {
  return options.partitionByNewLine && options.partitionSorting === 'type-first'
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
