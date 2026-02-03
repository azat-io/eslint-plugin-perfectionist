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
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { computeSpecifierName } from './sort-imports/compute-specifier-name'
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
    let sortingNodeGroupsForSorting =
      partitionSortingInfo?.sortedPartitions.map(({ nodes }) => nodes) ??
      sortingNodeGroups

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

    reportAllErrors<MessageId, SortImportsSortingNode>({
      availableMessageIds: {
        unexpectedDependencyOrder: DEPENDENCY_ORDER_ERROR_ID,
        missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
        extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
        missedCommentAbove: MISSED_COMMENT_ABOVE_ERROR_ID,
        unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
        unexpectedOrder: ORDER_ERROR_ID,
      },
      customOrderFixes:
        partitionSortingInfo ?
          createPartitionOrderFixes({
            partitionSortingInfo,
            sourceCode,
            options,
          })
        : undefined,
      sortNodesExcludingEslintDisabled: createSortNodesExcludingEslintDisabled(sortingNodeGroupsForSorting),
      customOrderFixesAreSingleRange: !!partitionSortingInfo,
      nodes: sortingNodes,
      options,
      context,
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
