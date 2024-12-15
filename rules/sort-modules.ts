import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  SortModulesOptions,
  Modifier,
  Selector,
} from './sort-modules.types'
import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'

import {
  buildCustomGroupsArrayJsonSchema,
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  newlinesBetweenJsonSchema,
  ignoreCaseJsonSchema,
  buildTypeJsonSchema,
  alphabetJsonSchema,
  localesJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
} from '../utils/common-json-schemas'
import {
  getFirstUnorderedNodeDependentOn,
  sortNodesByDependencies,
} from '../utils/sort-nodes-by-dependencies'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import {
  singleCustomGroupJsonSchema,
  allModifiers,
  allSelectors,
} from './sort-modules.types'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { getCustomGroupsCompareOptions } from '../utils/get-custom-groups-compare-options'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getNewlinesErrors } from '../utils/get-newlines-errors'
import { makeNewlinesFixes } from '../utils/make-newlines-fixes'
import { getCommentsBefore } from '../utils/get-comments-before'
import { getNodeDecorators } from '../utils/get-node-decorators'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getEnumMembers } from '../utils/get-enum-members'
import { customGroupMatches } from './sort-modules-utils'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

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
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows to use comments to separate the modules members into logical groups.',
          },
          customGroups: buildCustomGroupsArrayJsonSchema({
            singleCustomGroupJsonSchema,
          }),
          partitionByNewLine: partitionByNewLineJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          alphabet: alphabetJsonSchema,
          type: buildTypeJsonSchema(),
          locales: localesJsonSchema,
          groups: groupsJsonSchema,
          order: orderJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      unexpectedModulesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedModulesDependencyOrder:
        'Expected dependency "{{right}}" to come before "{{nodeDependentOnRight}}".',
      missedSpacingBetweenModulesMembers:
        'Missed spacing between "{{left}}" and "{{right}}" objects.',
      extraSpacingBetweenModulesMembers:
        'Extra spacing between "{{left}}" and "{{right}}" objects.',
      unexpectedModulesOrder: 'Expected "{{right}}" to come before "{{left}}".',
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
      customGroups: options.customGroups,
      modifiers: allModifiers,
      selectors: allSelectors,
      groups: options.groups,
    })
    validateNewlinesAndPartitionConfiguration(options)

    let sourceCode = getSourceCode(context)
    let eslintDisabledLines = getEslintDisabledLines({
      ruleName: context.id,
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

    /* eslint-disable @typescript-eslint/no-loop-func */
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
          for (let decorator of nodeDecorators) {
            if (decorator.expression.type === 'Identifier') {
              decorators.push(decorator.expression.name)
            } else if (
              decorator.expression.type === 'CallExpression' &&
              decorator.expression.callee.type === 'Identifier'
            ) {
              decorators.push(decorator.expression.callee.name)
            }
          }
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
    /* eslint-enable @typescript-eslint/no-loop-func */
    parseNode(node)

    if (!selector || !name) {
      continue
    }

    if (
      selector === 'class' &&
      modifiers.includes('export') &&
      modifiers.includes('decorated')
    ) {
      // Not always handled correctly at the moment
      continue
    }

    let { defineGroup, getGroup } = useGroups(options)
    for (let officialGroup of generatePredefinedGroups({
      cache: cachedGroupsByModifiersAndSelectors,
      selectors: [selector],
      modifiers,
    })) {
      defineGroup(officialGroup)
    }
    for (let customGroup of options.customGroups) {
      if (
        customGroupMatches({
          selectors: [selector],
          elementName: name,
          customGroup,
          decorators,
          modifiers,
        })
      ) {
        defineGroup(customGroup.groupName, true)
        // If the custom group is not referenced in the `groups` option, it will be ignored
        if (getGroup() === customGroup.groupName) {
          break
        }
      }
    }
    let sortingNode: SortingNodeWithDependencies = {
      isEslintDisabled: isNodeEslintDisabled(node, eslintDisabledLines),
      size: rangeToDiff(node, sourceCode),
      addSafetySemicolonWhenInline,
      dependencyName: name,
      group: getGroup(),
      dependencies,
      node,
      name,
    }
    let lastSortingNode = formattedNodes.at(-1)?.at(-1)
    if (
      (options.partitionByNewLine &&
        lastSortingNode &&
        getLinesBetween(sourceCode, lastSortingNode, sortingNode)) ||
      (options.partitionByComment &&
        hasPartitionComment(
          options.partitionByComment,
          getCommentsBefore({
            sourceCode,
            node,
          }),
        ))
    ) {
      formattedNodes.push([])
    }
    formattedNodes.at(-1)?.push(sortingNode)
  }

  let sortNodesIgnoringEslintDisabledNodes = (
    ignoreEslintDisabledNodes: boolean,
  ): SortingNodeWithDependencies[] =>
    sortNodesByDependencies(
      formattedNodes.flatMap(nodes =>
        sortNodesByGroups(nodes, options, {
          isNodeIgnored: sortingNode =>
            getGroupNumber(options.groups, sortingNode) ===
            options.groups.length,
          getGroupCompareOptions: groupNumber =>
            getCustomGroupsCompareOptions(options, groupNumber),
          ignoreEslintDisabledNodes,
        }),
      ),
      {
        ignoreEslintDisabledNodes,
      },
    )
  let sortedNodes = sortNodesIgnoringEslintDisabledNodes(false)
  let sortedNodesExcludingEslintDisabled =
    sortNodesIgnoringEslintDisabledNodes(true)
  let nodes = formattedNodes.flat()

  pairwise(nodes, (left, right) => {
    let leftNumber = getGroupNumber(options.groups, left)
    let rightNumber = getGroupNumber(options.groups, right)

    let indexOfLeft = sortedNodes.indexOf(left)
    let indexOfRight = sortedNodes.indexOf(right)
    let indexOfRightExcludingEslintDisabled =
      sortedNodesExcludingEslintDisabled.indexOf(right)

    let messageIds: MESSAGE_ID[] = []
    let firstUnorderedNodeDependentOnRight = getFirstUnorderedNodeDependentOn(
      right,
      nodes,
    )
    if (
      firstUnorderedNodeDependentOnRight ||
      indexOfLeft > indexOfRight ||
      indexOfLeft >= indexOfRightExcludingEslintDisabled
    ) {
      if (firstUnorderedNodeDependentOnRight) {
        messageIds.push('unexpectedModulesDependencyOrder')
      } else {
        messageIds.push(
          leftNumber === rightNumber
            ? 'unexpectedModulesOrder'
            : 'unexpectedModulesGroupOrder',
        )
      }
    }

    messageIds = [
      ...messageIds,
      ...getNewlinesErrors({
        missedSpacingError: 'missedSpacingBetweenModulesMembers',
        extraSpacingError: 'extraSpacingBetweenModulesMembers',
        rightNum: rightNumber,
        leftNum: leftNumber,
        sourceCode,
        options,
        right,
        left,
      }),
    ]

    for (let messageId of messageIds) {
      context.report({
        fix: (fixer: TSESLint.RuleFixer) => [
          ...makeFixes({
            sortedNodes: sortedNodesExcludingEslintDisabled,
            sourceCode,
            options,
            fixer,
            nodes,
          }),
          ...makeNewlinesFixes({
            sortedNodes: sortedNodesExcludingEslintDisabled,
            sourceCode,
            options,
            fixer,
            nodes,
          }),
        ],
        data: {
          nodeDependentOnRight: firstUnorderedNodeDependentOnRight?.name,
          right: toSingleLine(right.name),
          left: toSingleLine(left.name),
          rightGroup: right.group,
          leftGroup: left.group,
        },
        node: right.node,
        messageId,
      })
    }
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
