import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  SortModulesSortingNode,
  SortModulesOptions,
  Modifier,
  Selector,
} from './sort-modules/types'

import {
  DEPENDENCY_ORDER_ERROR,
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
} from '../utils/json-schemas/common-partition-json-schemas'
import {
  customGroupMatchOptionsJsonSchema,
  USAGE_TYPE_OPTION,
  allModifiers,
  allSelectors,
} from './sort-modules/types'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { buildDefaultOptionsByGroupIndexComputer } from '../utils/build-default-options-by-group-index-computer'
import { buildComparatorByOptionsComputer } from './sort-modules/build-comparator-by-options-computer'
import { buildCommonGroupsJsonSchemas } from '../utils/json-schemas/common-groups-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { isPropertyOrAccessorNode } from './sort-modules/is-property-or-accessor-node'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { buildCommonJsonSchemas } from '../utils/json-schemas/common-json-schemas'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isArrowFunctionNode } from './sort-modules/is-arrow-function-node'
import { computeDependencies } from './sort-modules/compute-dependencies'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getNodeDecorators } from '../utils/get-node-decorators'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getDecoratorName } from '../utils/get-decorator-name'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { getGroupIndex } from '../utils/get-group-index'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

/** Cache computed groups by modifiers and selectors for performance. */
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

let defaultOptions: Required<SortModulesOptions[number]> = {
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
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
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

export default createEslintRule<SortModulesOptions, MessageId>({
  meta: {
    schema: [
      {
        properties: {
          ...buildCommonJsonSchemas({
            allowedAdditionalTypeValues: [USAGE_TYPE_OPTION],
          }),
          ...buildCommonGroupsJsonSchemas({
            additionalCustomGroupMatchProperties:
              customGroupMatchOptionsJsonSchema,
            allowedAdditionalTypeValues: [USAGE_TYPE_OPTION],
          }),
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
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
    let options = complete(context.options.at(0), settings, defaultOptions)
    validateCustomSortConfiguration(options)
    validateGroupsConfiguration({
      modifiers: allModifiers,
      selectors: allSelectors,
      options,
    })
    validateNewlinesAndPartitionConfiguration(options)

    let { sourceCode, id } = context
    let eslintDisabledLines = getEslintDisabledLines({
      ruleName: id,
      sourceCode,
    })

    return {
      Program: program => {
        if (isSortable(program.body)) {
          return analyzeModule({
            eslintDisabledLines,
            module: program,
            sourceCode,
            options,
            context,
          })
        }
      },
    }
  },
  defaultOptions: [defaultOptions],
  name: 'sort-modules',
})

function analyzeModule({
  eslintDisabledLines,
  sourceCode,
  options,
  context,
  module,
}: {
  context: TSESLint.RuleContext<MessageId, SortModulesOptions>
  module: TSESTree.TSModuleBlock | TSESTree.Program
  options: Required<SortModulesOptions[number]>
  sourceCode: TSESLint.SourceCode
  eslintDisabledLines: number[]
}): void {
  let optionsByGroupIndexComputer =
    buildDefaultOptionsByGroupIndexComputer(options)

  let formattedNodes: SortModulesSortingNode[][] = [[]]
  for (let node of module.body) {
    let selector: undefined | Selector
    let name: undefined | string
    let modifiers: Modifier[] = []
    let dependencies: string[] = []
    let decorators: string[] = []
    let addSafetySemicolonWhenInline: boolean = false

    function parseNode(
      nodeToParse:
        | TSESTree.DefaultExportDeclarations
        | TSESTree.NamedExportDeclarations
        | TSESTree.ProgramStatement,
    ): void {
      if ('declare' in nodeToParse && nodeToParse.declare) {
        modifiers.push('declare')
      }
      switch (nodeToParse.type) {
        case AST_NODE_TYPES.ExportDefaultDeclaration:
          modifiers.push('default', 'export')
          parseNode(nodeToParse.declaration)
          break
        case AST_NODE_TYPES.ExportNamedDeclaration:
          if (nodeToParse.declaration) {
            parseNode(nodeToParse.declaration)
          }
          modifiers.push('export')
          break
        case AST_NODE_TYPES.TSInterfaceDeclaration:
          selector = 'interface'
          ;({ name } = nodeToParse.id)
          break
        case AST_NODE_TYPES.TSTypeAliasDeclaration:
          selector = 'type'
          ;({ name } = nodeToParse.id)
          addSafetySemicolonWhenInline = true
          break
        case AST_NODE_TYPES.FunctionDeclaration:
        case AST_NODE_TYPES.TSDeclareFunction:
          selector = 'function'
          if (nodeToParse.async) {
            modifiers.push('async')
          }
          if (modifiers.includes('declare')) {
            addSafetySemicolonWhenInline = true
          }
          name = nodeToParse.id?.name
          break
        case AST_NODE_TYPES.TSModuleDeclaration:
          formattedNodes.push([])
          if (nodeToParse.body) {
            analyzeModule({
              module: nodeToParse.body,
              eslintDisabledLines,
              sourceCode,
              options,
              context,
            })
          }
          break
        case AST_NODE_TYPES.VariableDeclaration:
        case AST_NODE_TYPES.ExpressionStatement:
          formattedNodes.push([])
          break
        case AST_NODE_TYPES.TSEnumDeclaration:
          selector = 'enum'
          ;({ name } = nodeToParse.id)
          dependencies = [...dependencies, ...extractDependencies(nodeToParse)]
          break
        case AST_NODE_TYPES.ClassDeclaration:
          selector = 'class'
          name = nodeToParse.id?.name
          // eslint-disable-next-line no-case-declarations -- Easier to handle
          let nodeDecorators = getNodeDecorators(nodeToParse)
          if (nodeDecorators.length > 0) {
            modifiers.push('decorated')
          }
          decorators = nodeDecorators.map(decorator =>
            getDecoratorName({
              sourceCode,
              decorator,
            }),
          )
          dependencies = [...dependencies, ...extractDependencies(nodeToParse)]
          break
        default:
      }
    }

    parseNode(node)

    if (!selector || !name) {
      continue
    }

    if (
      selector === 'class' &&
      modifiers.includes('export') &&
      modifiers.includes('decorated')
    ) {
      // Not always handled correctly at the moment.
      continue
    }

    let predefinedGroups = generatePredefinedGroups({
      cache: cachedGroupsByModifiersAndSelectors,
      selectors: [selector],
      modifiers,
    })
    let group = computeGroup({
      customGroupMatcher: customGroup =>
        doesCustomGroupMatch({
          selectors: [selector!],
          elementName: name!,
          customGroup,
          decorators,
          modifiers,
        }),
      predefinedGroups,
      options,
    })

    let sortingNode: Omit<SortModulesSortingNode, 'partitionId'> = {
      isEslintDisabled: isNodeEslintDisabled(node, eslintDisabledLines),
      size: rangeToDiff(node, sourceCode),
      addSafetySemicolonWhenInline,
      dependencyNames: [name],
      dependencies,
      group,
      name,
      node,
    }

    let lastSortingNode = formattedNodes.at(-1)?.at(-1)
    if (
      shouldPartition({
        lastSortingNode,
        sortingNode,
        sourceCode,
        options,
      })
    ) {
      formattedNodes.push([])
    }

    formattedNodes.at(-1)?.push({
      ...sortingNode,
      partitionId: formattedNodes.length,
    })
  }

  function sortNodesExcludingEslintDisabled(
    ignoreEslintDisabledNodes: boolean,
  ): SortModulesSortingNode[] {
    let nodesSortedByGroups = formattedNodes.flatMap(nodes =>
      sortNodesByGroups({
        comparatorByOptionsComputer: buildComparatorByOptionsComputer({
          ignoreEslintDisabledNodes,
          sortingNodes: nodes,
        }),
        isNodeIgnored: sortingNode =>
          getGroupIndex(options.groups, sortingNode) === options.groups.length,
        optionsByGroupIndexComputer,
        ignoreEslintDisabledNodes,
        groups: options.groups,
        nodes,
      }),
    )

    return sortNodesByDependencies(nodesSortedByGroups, {
      ignoreEslintDisabledNodes,
    })
  }
  let nodes = formattedNodes.flat()

  reportAllErrors<MessageId>({
    availableMessageIds: {
      missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
      unexpectedDependencyOrder: DEPENDENCY_ORDER_ERROR_ID,
      extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
      unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
      unexpectedOrder: ORDER_ERROR_ID,
    },
    sortNodesExcludingEslintDisabled,
    options,
    context,
    nodes,
  })
}

function extractDependencies(
  expression: TSESTree.TSEnumDeclaration | TSESTree.ClassDeclaration,
): string[] {
  /**
   * Search static methods only if there is a static block or a static property
   * that is not an arrow function.
   */
  let searchStaticMethodsAndFunctionProperties =
    expression.type === AST_NODE_TYPES.ClassDeclaration &&
    expression.body.body.some(
      classElement =>
        classElement.type === AST_NODE_TYPES.StaticBlock ||
        (classElement.static &&
          isPropertyOrAccessorNode(classElement) &&
          !isArrowFunctionNode(classElement)),
    )

  return computeDependencies(expression, {
    searchStaticMethodsAndFunctionProperties,
    type: 'hard',
  })
}
