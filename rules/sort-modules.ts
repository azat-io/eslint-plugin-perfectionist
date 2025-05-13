import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  SortModulesOptions,
  Modifier,
  Selector,
} from './sort-modules/types'
import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'

import {
  buildCustomGroupsArrayJsonSchema,
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
} from '../utils/common-json-schemas'
import {
  DEPENDENCY_ORDER_ERROR,
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { buildGetCustomGroupOverriddenOptionsFunction } from '../utils/get-custom-groups-compare-options'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import {
  singleCustomGroupJsonSchema,
  allModifiers,
  allSelectors,
} from './sort-modules/types'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getNodeDecorators } from '../utils/get-node-decorators'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getDecoratorName } from '../utils/get-decorator-name'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { getEnumMembers } from '../utils/get-enum-members'
import { getGroupIndex } from '../utils/get-group-index'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'

/**
 * Cache computed groups by modifiers and selectors for performance
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

type MESSAGE_ID =
  | 'missedSpacingBetweenModulesMembers'
  | 'extraSpacingBetweenModulesMembers'
  | 'unexpectedModulesDependencyOrder'
  | 'unexpectedModulesGroupOrder'
  | 'unexpectedModulesOrder'

let defaultOptions: Required<SortModulesOptions[0]> = {
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

export default createEslintRule<SortModulesOptions, MESSAGE_ID>({
  meta: {
    schema: [
      {
        properties: {
          ...commonJsonSchemas,
          customGroups: buildCustomGroupsArrayJsonSchema({
            singleCustomGroupJsonSchema,
          }),
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          groups: groupsJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      unexpectedModulesDependencyOrder: DEPENDENCY_ORDER_ERROR,
      missedSpacingBetweenModulesMembers: MISSED_SPACING_ERROR,
      extraSpacingBetweenModulesMembers: EXTRA_SPACING_ERROR,
      unexpectedModulesGroupOrder: GROUP_ORDER_ERROR,
      unexpectedModulesOrder: ORDER_ERROR,
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
    validateGeneratedGroupsConfiguration({
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
            sourceCode,
            options,
            program,
            context,
          })
        }
      },
    }
  },
  defaultOptions: [defaultOptions],
  name: 'sort-modules',
})

let analyzeModule = ({
  eslintDisabledLines,
  sourceCode,
  options,
  program,
  context,
}: {
  context: TSESLint.RuleContext<MESSAGE_ID, SortModulesOptions>
  program: TSESTree.TSModuleBlock | TSESTree.Program
  options: Required<SortModulesOptions[0]>
  sourceCode: TSESLint.SourceCode
  eslintDisabledLines: number[]
}): void => {
  let formattedNodes: SortingNodeWithDependencies[][] = [[]]
  for (let node of program.body) {
    let selector: undefined | Selector
    let name: undefined | string
    let modifiers: Modifier[] = []
    let dependencies: string[] = []
    let decorators: string[] = []
    let addSafetySemicolonWhenInline: boolean = false

    /* eslint-disable typescript/no-loop-func */
    let parseNode = (
      nodeToParse:
        | TSESTree.DefaultExportDeclarations
        | TSESTree.NamedExportDeclarations
        | TSESTree.ProgramStatement,
    ): void => {
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
              program: nodeToParse.body,
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
          dependencies = [
            ...dependencies,
            ...getEnumMembers(nodeToParse).flatMap(extractDependencies),
          ]
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
          dependencies = [
            ...dependencies,
            ...(nodeToParse.superClass && 'name' in nodeToParse.superClass
              ? [nodeToParse.superClass.name]
              : []),
            ...extractDependencies(nodeToParse.body),
          ]
          break
        default:
      }
    }
    /* eslint-enable typescript/no-loop-func */
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

    let sortingNode: SortingNodeWithDependencies = {
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

    formattedNodes.at(-1)?.push(sortingNode)
  }

  let sortNodesExcludingEslintDisabled = (
    ignoreEslintDisabledNodes: boolean,
  ): SortingNodeWithDependencies[] => {
    let nodesSortedByGroups = formattedNodes.flatMap(nodes =>
      sortNodesByGroups({
        isNodeIgnored: sortingNode =>
          getGroupIndex(options.groups, sortingNode) === options.groups.length,
        getOptionsByGroupNumber:
          buildGetCustomGroupOverriddenOptionsFunction(options),
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

  reportAllErrors<MESSAGE_ID>({
    availableMessageIds: {
      missedSpacingBetweenMembers: 'missedSpacingBetweenModulesMembers',
      extraSpacingBetweenMembers: 'extraSpacingBetweenModulesMembers',
      unexpectedDependencyOrder: 'unexpectedModulesDependencyOrder',
      unexpectedGroupOrder: 'unexpectedModulesGroupOrder',
      unexpectedOrder: 'unexpectedModulesOrder',
    },
    sortNodesExcludingEslintDisabled,
    sourceCode,
    options,
    context,
    nodes,
  })
}

let extractDependencies = (
  expression: TSESTree.TSEnumMember | TSESTree.ClassBody,
): string[] => {
  let dependencies: string[] = []

  let isPropertyOrAccessor = (
    node: TSESTree.Node,
  ): node is TSESTree.PropertyDefinition | TSESTree.AccessorProperty =>
    node.type === 'PropertyDefinition' || node.type === 'AccessorProperty'

  let isArrowFunction = (
    node: TSESTree.Node,
  ): node is TSESTree.PropertyDefinition | TSESTree.AccessorProperty =>
    isPropertyOrAccessor(node) &&
    node.value !== null &&
    node.value.type === 'ArrowFunctionExpression'

  /**
   * Search static methods only if there is a static block or a static property
   * that is not an arrow function
   */
  let searchStaticMethodsAndFunctionProperties =
    expression.type === 'ClassBody' &&
    expression.body.some(
      classElement =>
        classElement.type === 'StaticBlock' ||
        (classElement.static &&
          isPropertyOrAccessor(classElement) &&
          !isArrowFunction(classElement)),
    )

  let checkNode = (nodeValue: TSESTree.Node): void => {
    if (
      (nodeValue.type === 'MethodDefinition' || isArrowFunction(nodeValue)) &&
      (!nodeValue.static || !searchStaticMethodsAndFunctionProperties)
    ) {
      return
    }

    if (
      nodeValue.type === 'NewExpression' &&
      nodeValue.callee.type === 'Identifier'
    ) {
      dependencies.push(nodeValue.callee.name)
    }

    if (nodeValue.type === 'Identifier') {
      dependencies.push(nodeValue.name)
    }

    if (nodeValue.type === 'ConditionalExpression') {
      checkNode(nodeValue.test)
      checkNode(nodeValue.consequent)
      checkNode(nodeValue.alternate)
    }

    if (
      'expression' in nodeValue &&
      typeof nodeValue.expression !== 'boolean'
    ) {
      checkNode(nodeValue.expression)
    }

    if ('object' in nodeValue) {
      checkNode(nodeValue.object)
    }

    if ('callee' in nodeValue) {
      checkNode(nodeValue.callee)
    }

    if ('init' in nodeValue && nodeValue.init) {
      checkNode(nodeValue.init)
    }

    if ('body' in nodeValue && nodeValue.body) {
      traverseNode(nodeValue.body)
    }

    if ('left' in nodeValue) {
      checkNode(nodeValue.left)
    }

    if ('right' in nodeValue) {
      checkNode(nodeValue.right)
    }

    if ('initializer' in nodeValue && nodeValue.initializer) {
      checkNode(nodeValue.initializer)
    }

    if ('elements' in nodeValue) {
      let elements = nodeValue.elements.filter(
        currentNode => currentNode !== null,
      )

      for (let element of elements) {
        traverseNode(element)
      }
    }

    if ('argument' in nodeValue && nodeValue.argument) {
      checkNode(nodeValue.argument)
    }

    if ('arguments' in nodeValue) {
      for (let argument of nodeValue.arguments) {
        checkNode(argument)
      }
    }

    if ('declarations' in nodeValue) {
      for (let declaration of nodeValue.declarations) {
        checkNode(declaration)
      }
    }

    if ('properties' in nodeValue) {
      for (let property of nodeValue.properties) {
        checkNode(property)
      }
    }

    if (
      'value' in nodeValue &&
      nodeValue.value &&
      typeof nodeValue.value === 'object' &&
      'type' in nodeValue.value
    ) {
      checkNode(nodeValue.value)
    }

    if ('expressions' in nodeValue) {
      for (let nodeExpression of nodeValue.expressions) {
        checkNode(nodeExpression)
      }
    }
  }

  let traverseNode = (nodeValue: TSESTree.Node[] | TSESTree.Node): void => {
    if (Array.isArray(nodeValue)) {
      for (let nodeItem of nodeValue) {
        traverseNode(nodeItem)
      }
    } else {
      checkNode(nodeValue)
    }
  }

  checkNode(expression)
  return dependencies
}
