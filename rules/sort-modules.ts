import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import type {
  SortModulesSortingNode,
  SortModulesNode,
  Options,
} from './sort-modules/types'

import {
  additionalCustomGroupMatchOptionsJsonSchema,
  USAGE_TYPE_OPTION,
  commonJsonSchemas,
  allModifiers,
  allSelectors,
} from './sort-modules/types'
import {
  DEPENDENCY_ORDER_ERROR,
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { buildOverloadSignatureNewlinesBetweenValueGetter } from '../utils/overload-signature/build-overload-signature-newlines-between-value-getter'
import { populateSortingNodeGroupsWithOverloadSignature } from '../utils/overload-signature/populate-sorting-node-groups-with-overload-signature'
import {
  partitionByCommentJsonSchema,
  partitionByNewlineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import {
  buildCommonGroupsJsonSchemas,
  newlinesBetweenJsonSchema,
} from '../utils/json-schemas/common-groups-json-schemas'
import { populateSortingNodeGroupsWithDependencies } from '../utils/populate-sorting-node-groups-with-dependencies'
import { computeDependenciesBySortingNode } from './sort-modules/dependencies/compute-dependencies-by-sorting-node'
import { useExperimentalDependencyDetectionJsonSchema } from '../utils/json-schemas/common-json-schemas'
import { computeAdditionalModuleStatements } from './sort-modules/compute-additional-module-statements'
import { buildComparatorByOptionsComputer } from './sort-modules/build-comparator-by-options-computer'
import { validateNewlinesAndPartitionConfig } from '../utils/validate-newlines-and-partition-config'
import { buildOptionsByGroupIndexComputer } from '../utils/build-options-by-group-index-computer'
import { computeOverloadSignatureGroups } from './sort-modules/compute-overload-signature-groups'
import { readClosestTsConfigByPath } from '../utils/tsconfig/read-closest-ts-config-by-path'
import { splitGroupsAtArrowFunctions } from './sort-modules/split-groups-at-arrow-functions'
import { limitDependenciesToBlocks } from './sort-modules/limit-dependencies-to-blocks'
import { validateCustomSortConfig } from '../utils/validate-custom-sort-config'
import { tsconfigJsonSchema } from '../utils/json-schemas/tsconfig-json-schema'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { computeNodeDetails } from './sort-modules/compute-node-details'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { validateGroupsConfig } from '../utils/validate-groups-config'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getDecoratorName } from '../utils/get-decorator-name'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { getGroupIndex } from '../utils/get-group-index'
import { assertIsNever } from '../utils/assert-is-never'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { complete } from '../utils/complete'

/**
 * Cache computed groups by modifiers and selectors for performance.
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

const ORDER_ERROR_ID = 'unexpectedModulesOrder'
const GROUP_ORDER_ERROR_ID = 'unexpectedModulesGroupOrder'
const EXTRA_SPACING_ERROR_ID = 'extraSpacingBetweenModulesMembers'
const MISSED_SPACING_ERROR_ID = 'missedSpacingBetweenModulesMembers'
const DEPENDENCY_ORDER_ERROR_ID = 'unexpectedModulesDependencyOrder'

type MessageId =
  | typeof DEPENDENCY_ORDER_ERROR_ID
  | typeof MISSED_SPACING_ERROR_ID
  | typeof EXTRA_SPACING_ERROR_ID
  | typeof GROUP_ORDER_ERROR_ID
  | typeof ORDER_ERROR_ID

let defaultOptions: Required<Options[number]> = {
  groups: [
    'declare-enum',
    'export-enum',
    'enum',
    ['declare-interface', 'declare-type'],
    ['export-interface', 'export-type'],
    ['interface', 'type'],
    'declare-class',
    'class',
    'export-class',
    'declare-function',
    'export-function',
    'function',
  ],
  useExperimentalDependencyDetection: true,
  newlinesBetweenOverloadSignatures: 0,
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
  additionalModuleBlockTypes: [],
  tsconfig: { rootDir: '' },
  sortArrowFunctions: false,
  partitionByComment: false,
  partitionByNewLine: false,
  newlinesBetween: 'ignore',
  specialCharacters: 'keep',
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
}

export default createEslintRule<Options, MessageId>({
  meta: {
    schema: [
      {
        properties: {
          ...commonJsonSchemas,
          ...buildCommonGroupsJsonSchemas({
            additionalCustomGroupMatchProperties:
              additionalCustomGroupMatchOptionsJsonSchema,
            allowedAdditionalTypeValues: [USAGE_TYPE_OPTION],
          }),
          additionalModuleBlockTypes: {
            description:
              'Specifies the node types to analyze as module blocks, in addition to the built-in ones.',
            items: {
              type: 'string',
            },
            type: 'array',
          },
          sortArrowFunctions: {
            description:
              'Enables sorting of arrow functions declared with const.',
            type: 'boolean',
          },
          useExperimentalDependencyDetection:
            useExperimentalDependencyDetectionJsonSchema,
          newlinesBetweenOverloadSignatures: newlinesBetweenJsonSchema,
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewlineJsonSchema,
          tsconfig: tsconfigJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      [DEPENDENCY_ORDER_ERROR_ID]: DEPENDENCY_ORDER_ERROR,
      [MISSED_SPACING_ERROR_ID]: MISSED_SPACING_ERROR,
      [EXTRA_SPACING_ERROR_ID]: EXTRA_SPACING_ERROR,
      [GROUP_ORDER_ERROR_ID]: GROUP_ORDER_ERROR,
      [ORDER_ERROR_ID]: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-modules',
      description: 'Enforce sorted modules.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  create: context => {
    let settings = getSettings(context.settings)
    let options = complete({
      options: context.options.at(0),
      defaults: defaultOptions,
      commonJsonSchemas,
      settings,
    })
    validateCustomSortConfig(options)
    validateGroupsConfig({
      modifiers: allModifiers,
      selectors: allSelectors,
      options,
    })
    validateNewlinesAndPartitionConfig(options)

    let { sourceCode, id } = context
    let eslintDisabledLines = getEslintDisabledLines({
      ruleName: id,
      sourceCode,
    })

    return {
      Program: program =>
        analyzeModule({
          eslintDisabledLines,
          module: program,
          sourceCode,
          options,
          context,
        }),
    }
  },
  defaultOptions: [defaultOptions],
  name: 'sort-modules',
})

/**
 * Sorts the statements of a module body and reports ordering errors.
 *
 * @param params - Parameters.
 * @param params.eslintDisabledLines - Lines where the rule is disabled.
 * @param params.sourceCode - The source code object.
 * @param params.options - The completed options.
 * @param params.context - The rule context.
 * @param params.module - The program or module block to sort.
 */
function analyzeModule({
  eslintDisabledLines,
  sourceCode,
  options,
  context,
  module,
}: {
  context: TSESLint.RuleContext<MessageId, Options>
  module: { body: TSESTree.ProgramStatement[] }
  eslintDisabledLines: ReadonlySet<number>
  options: Required<Options[number]>
  sourceCode: TSESLint.SourceCode
}): void {
  let optionsByGroupIndexComputer = buildOptionsByGroupIndexComputer(options)
  let arrowFunctionNodes = new Set<SortModulesNode>()
  let classOrEnumNodes = new Set<SortModulesNode>()
  let overloadSignatureNewlinesBetweenValueGetter =
    buildOverloadSignatureNewlinesBetweenValueGetter(
      options.newlinesBetweenOverloadSignatures,
    )

  let sortingNodeGroupsWithoutOverloadSignature: Omit<
    SortModulesSortingNode,
    'overloadSignatureImplementation'
  >[][] = [[]]
  for (let node of module.body) {
    let additionalModuleStatements = computeAdditionalModuleStatements(
      node,
      options.additionalModuleBlockTypes,
    )
    if (additionalModuleStatements) {
      sortingNodeGroupsWithoutOverloadSignature.push([])
      analyzeModule({
        module: { body: additionalModuleStatements },
        eslintDisabledLines,
        sourceCode,
        options,
        context,
      })
      continue
    }

    switch (node.type) {
      case AST_NODE_TYPES.TSNamespaceExportDeclaration:
      case AST_NODE_TYPES.ExportAllDeclaration:
      case AST_NODE_TYPES.ImportDeclaration:
      case AST_NODE_TYPES.DebuggerStatement:
      case AST_NODE_TYPES.ContinueStatement:
      case AST_NODE_TYPES.EmptyStatement:
      case AST_NODE_TYPES.BreakStatement:
        continue
      case AST_NODE_TYPES.ExportDefaultDeclaration:
      case AST_NODE_TYPES.ExportNamedDeclaration:
      case AST_NODE_TYPES.TSInterfaceDeclaration:
      case AST_NODE_TYPES.TSTypeAliasDeclaration:
      case AST_NODE_TYPES.FunctionDeclaration:
      case AST_NODE_TYPES.TSModuleDeclaration:
      case AST_NODE_TYPES.VariableDeclaration:
        break
      case AST_NODE_TYPES.TSImportEqualsDeclaration:
      case AST_NODE_TYPES.ExpressionStatement:
      case AST_NODE_TYPES.TSExportAssignment:
      case AST_NODE_TYPES.DoWhileStatement:
      case AST_NODE_TYPES.LabeledStatement:
      case AST_NODE_TYPES.ReturnStatement:
      case AST_NODE_TYPES.SwitchStatement:
      case AST_NODE_TYPES.WhileStatement:
      case AST_NODE_TYPES.ForInStatement:
      case AST_NODE_TYPES.ForOfStatement:
      case AST_NODE_TYPES.ThrowStatement:
      case AST_NODE_TYPES.BlockStatement:
      case AST_NODE_TYPES.WithStatement:
      case AST_NODE_TYPES.ForStatement:
      case AST_NODE_TYPES.TryStatement:
      case AST_NODE_TYPES.IfStatement:
        sortingNodeGroupsWithoutOverloadSignature.push([])
        continue
      case AST_NODE_TYPES.TSDeclareFunction:
      case AST_NODE_TYPES.TSEnumDeclaration:
      case AST_NODE_TYPES.ClassDeclaration:
        break
      /* v8 ignore next 2 -- @preserve Exhaustive guard. */
      default:
        assertIsNever(node)
        continue
    }

    let details = computeNodeDetails({
      useExperimentalDependencyDetection:
        options.useExperimentalDependencyDetection,
      sortArrowFunctions: options.sortArrowFunctions,
      node,
    })

    if (!details.nodeDetails) {
      if (details.shouldPartitionAfterNode) {
        sortingNodeGroupsWithoutOverloadSignature.push([])
      }
      if (details.moduleBlock) {
        analyzeModule({
          module: details.moduleBlock,
          eslintDisabledLines,
          sourceCode,
          options,
          context,
        })
      }
      continue
    }

    let {
      addSafetySemicolonWhenInline,
      dependencyDetection,
      dependencies,
      decorators,
      modifiers,
      selector,
      name,
    } = details.nodeDetails

    if (modifiers.includes('arrow')) {
      arrowFunctionNodes.add(node)
    } else if (
      (selector === 'class' || selector === 'enum') &&
      !modifiers.includes('declare')
    ) {
      classOrEnumNodes.add(node)
    }

    let predefinedGroups = generatePredefinedGroups({
      cache: cachedGroupsByModifiersAndSelectors,
      selectors: [selector],
      modifiers,
    })
    let decoratorNames = decorators.map(decorator =>
      getDecoratorName({
        sourceCode,
        decorator,
      }),
    )
    let group = computeGroup({
      customGroupMatcher: customGroup =>
        doesCustomGroupMatch({
          selectors: [selector],
          elementName: name,
          decoratorNames,
          customGroup,
          modifiers,
        }),
      predefinedGroups,
      options,
    })

    let sortingNode: Omit<
      SortModulesSortingNode,
      'overloadSignatureImplementation' | 'partitionId'
    > = {
      isEslintDisabled: isNodeEslintDisabled(node, eslintDisabledLines),
      size: rangeToDiff(node, sourceCode),
      implicitDecorators: decorators,
      addSafetySemicolonWhenInline,
      dependencyNames: [name],
      dependencyDetection,
      dependencies,
      group,
      name,
      node,
    }

    let lastSortingNode = sortingNodeGroupsWithoutOverloadSignature
      .at(-1)
      ?.at(-1)
    if (
      shouldPartition({
        lastSortingNode,
        sortingNode,
        sourceCode,
        options,
      })
    ) {
      sortingNodeGroupsWithoutOverloadSignature.push([])
    }

    sortingNodeGroupsWithoutOverloadSignature.at(-1)?.push({
      ...sortingNode,
      partitionId: sortingNodeGroupsWithoutOverloadSignature.length,
    })
  }

  sortingNodeGroupsWithoutOverloadSignature = splitGroupsAtArrowFunctions({
    sortingNodeGroups: sortingNodeGroupsWithoutOverloadSignature,
    arrowFunctionNodes,
    classOrEnumNodes,
    sourceCode,
    options,
  })

  let overloadSignatureGroups = computeOverloadSignatureGroups(
    sortingNodeGroupsWithoutOverloadSignature.flat().map(({ node }) => node),
  )
  let sortingNodeGroups = populateSortingNodeGroupsWithOverloadSignature({
    sortingNodeGroups: sortingNodeGroupsWithoutOverloadSignature,
    overloadSignatureGroups,
  })

  if (options.useExperimentalDependencyDetection) {
    let tsconfigRootDirectory = options.tsconfig.rootDir
    let tsConfigOutput =
      tsconfigRootDirectory ?
        readClosestTsConfigByPath({
          tsconfigFilename: options.tsconfig.filename ?? 'tsconfig.json',
          tsconfigRootDir: options.tsconfig.rootDir,
          filePath: context.physicalFilename,
          contextCwd: context.cwd,
        })
      : null
    let dependenciesBySortingNode = computeDependenciesBySortingNode({
      emitDecoratorMetadata:
        tsConfigOutput ?
          (tsConfigOutput.compilerOptions.emitDecoratorMetadata ?? false)
        : true,
      sortingNodes: sortingNodeGroups.flat(),
      dependencyDetection: 'hard',
      sourceCode,
    })
    sortingNodeGroups = populateSortingNodeGroupsWithDependencies({
      dependenciesBySortingNode,
      sortingNodeGroups,
    })
  }
  sortingNodeGroups = limitDependenciesToBlocks({
    sortingNodeGroups,
    sourceCode,
    options,
  })

  let sortingNodes = sortingNodeGroups.flat()

  reportAllErrors<MessageId, SortModulesSortingNode>({
    availableMessageIds: {
      missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
      unexpectedDependencyOrder: DEPENDENCY_ORDER_ERROR_ID,
      extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
      unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
      unexpectedOrder: ORDER_ERROR_ID,
    },
    newlinesBetweenValueGetter: overloadSignatureNewlinesBetweenValueGetter,
    sortNodesExcludingEslintDisabled,
    nodes: sortingNodes,
    options,
    context,
  })

  function sortNodesExcludingEslintDisabled(
    ignoreEslintDisabledNodes: boolean,
  ): SortModulesSortingNode[] {
    let nodesSortedByGroups = sortingNodeGroups.flatMap(sortingNodeGroup =>
      sortNodesByGroups({
        comparatorByOptionsComputer: buildComparatorByOptionsComputer({
          useExperimentalDependencyDetection:
            options.useExperimentalDependencyDetection,
          sortingNodes: sortingNodeGroup,
          ignoreEslintDisabledNodes,
          sourceCode,
        }),
        isNodeIgnored: sortingNode =>
          getGroupIndex(options.groups, sortingNode) === options.groups.length,
        optionsByGroupIndexComputer,
        ignoreEslintDisabledNodes,
        nodes: sortingNodeGroup,
        groups: options.groups,
      }),
    )

    return sortNodesByDependencies(nodesSortedByGroups, {
      ignoreEslintDisabledNodes,
    })
  }
}
