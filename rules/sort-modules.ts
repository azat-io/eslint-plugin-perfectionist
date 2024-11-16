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
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  newlinesBetweenJsonSchema,
  ignoreCaseJsonSchema,
  localesJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import {
  singleCustomGroupJsonSchema,
  customGroupNameJsonSchema,
  customGroupSortJsonSchema,
  allModifiers,
  allSelectors,
} from './sort-modules.types'
import {
  getFirstUnorderedNodeDependentOn,
  sortNodesByDependencies,
} from '../utils/sort-nodes-by-dependencies'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { validateGeneratedGroupsConfiguration } from './validate-generated-groups-configuration'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { customGroupMatches, getCompareOptions } from './sort-modules-utils'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getNewlinesErrors } from '../utils/get-newlines-errors'
import { makeNewlinesFixes } from '../utils/make-newlines-fixes'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
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
  type: 'alphabetical',
  ignoreCase: true,
  specialCharacters: 'keep',
  customGroups: [],
  order: 'asc',
  locales: 'en-US',
}

export default createEslintRule<SortModulesOptions, MESSAGE_ID>({
  name: 'sort-modules',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted modules.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: typeJsonSchema,
          order: orderJsonSchema,
          locales: localesJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows to use comments to separate the modules members into logical groups.',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          groups: groupsJsonSchema,
          customGroups: {
            description: 'Specifies custom groups.',
            type: 'array',
            items: {
              oneOf: [
                {
                  description: 'Custom group block.',
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    ...customGroupNameJsonSchema,
                    ...customGroupSortJsonSchema,
                    anyOf: {
                      type: 'array',
                      items: {
                        description: 'Custom group.',
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                          ...singleCustomGroupJsonSchema,
                        },
                      },
                    },
                  },
                },
                {
                  description: 'Custom group.',
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    ...customGroupNameJsonSchema,
                    ...customGroupSortJsonSchema,
                    ...singleCustomGroupJsonSchema,
                  },
                },
              ],
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedModulesGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedModulesOrder: 'Expected "{{right}}" to come before "{{left}}".',
      unexpectedModulesDependencyOrder:
        'Expected dependency "{{right}}" to come before "{{nodeDependentOnRight}}".',
      missedSpacingBetweenModulesMembers:
        'Missed spacing between "{{left}}" and "{{right}}" objects.',
      extraSpacingBetweenModulesMembers:
        'Extra spacing between "{{left}}" and "{{right}}" objects.',
    },
  },
  defaultOptions: [defaultOptions],
  create: context => {
    let settings = getSettings(context.settings)
    let options = complete(context.options.at(0), settings, defaultOptions)
    validateGeneratedGroupsConfiguration({
      groups: options.groups,
      customGroups: options.customGroups,
      modifiers: allModifiers,
      selectors: allSelectors,
    })
    validateNewlinesAndPartitionConfiguration(options)
    let sourceCode = getSourceCode(context)
    let eslintDisabledLines = getEslintDisabledLines({
      sourceCode,
      ruleName: context.id,
    })

    return {
      Program: program =>
        analyzeModule({
          options,
          program,
          sourceCode,
          context,
          eslintDisabledLines,
        }),
    }
  },
})

let analyzeModule = ({
  options,
  program,
  sourceCode,
  context,
  eslintDisabledLines,
}: {
  context: TSESLint.RuleContext<MESSAGE_ID, SortModulesOptions>
  program: TSESTree.TSModuleBlock | TSESTree.Program
  options: Required<SortModulesOptions[0]>
  sourceCode: TSESLint.SourceCode
  eslintDisabledLines: number[]
}) => {
  let formattedNodes: SortingNodeWithDependencies[][] = [[]]
  for (let node of program.body) {
    let selector: undefined | Selector
    let name: undefined | string
    let modifiers: Modifier[] = []
    let dependencies: string[] = []
    let decorators: string[] = []
    let addSafetySemicolonWhenInline: boolean = false

    let parseNode = (
      nodeToParse:
        | TSESTree.DefaultExportDeclarations
        | TSESTree.NamedExportDeclarations
        | TSESTree.ProgramStatement,
    ) => {
      if ('declare' in nodeToParse && nodeToParse.declare) {
        modifiers.push('declare')
      }
      switch (nodeToParse.type) {
        case AST_NODE_TYPES.ExportDefaultDeclaration:
          modifiers.push('default')
          modifiers.push('export')
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
              options,
              program: nodeToParse.body,
              sourceCode,
              context,
              eslintDisabledLines,
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
            ...extractDependencies(nodeToParse.body),
          ]
          break
        case AST_NODE_TYPES.ClassDeclaration:
          selector = 'class'
          name = nodeToParse.id?.name
          if (nodeToParse.decorators.length > 0) {
            modifiers.push('decorated')
          }
          for (let decorator of nodeToParse.decorators) {
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
    parseNode(node)

    if (!selector || !name) {
      continue
    }

    let { getGroup, defineGroup } = useGroups(options)
    for (let officialGroup of generatePredefinedGroups({
      selectors: [selector],
      modifiers,
      cache: cachedGroupsByModifiersAndSelectors,
    })) {
      defineGroup(officialGroup)
    }
    for (let customGroup of options.customGroups) {
      if (
        customGroupMatches({
          customGroup,
          elementName: name,
          decorators,
          modifiers,
          selectors: [selector],
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
      node,
      size: rangeToDiff(node, sourceCode),
      group: getGroup(),
      name,
      addSafetySemicolonWhenInline,
      dependencyName: name,
      isEslintDisabled: isNodeEslintDisabled(node, eslintDisabledLines),
      dependencies,
    }
    let comments = getCommentsBefore(node, sourceCode)
    let lastSortingNode = formattedNodes.at(-1)?.at(-1)
    if (
      (options.partitionByNewLine &&
        lastSortingNode &&
        getLinesBetween(sourceCode, lastSortingNode, sortingNode)) ||
      (options.partitionByComment &&
        hasPartitionComment(options.partitionByComment, comments))
    ) {
      formattedNodes.push([])
    }
    formattedNodes.at(-1)?.push(sortingNode)
  }

  let sortNodesIgnoringEslintDisabledNodes = (
    ignoreEslintDisabledNodes: boolean,
  ) =>
    sortNodesByDependencies(
      formattedNodes.flatMap(nodes =>
        sortNodesByGroups(nodes, options, {
          getGroupCompareOptions: groupNumber =>
            getCompareOptions(options, groupNumber),
          ignoreEslintDisabledNodes,
          isNodeIgnored: sortingNode =>
            getGroupNumber(options.groups, sortingNode) ===
            options.groups.length,
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
          leftNumber !== rightNumber
            ? 'unexpectedModulesGroupOrder'
            : 'unexpectedModulesOrder',
        )
      }
    }

    messageIds = [
      ...messageIds,
      ...getNewlinesErrors({
        left,
        leftNum: leftNumber,
        right,
        rightNum: rightNumber,
        sourceCode,
        missedSpacingError: 'missedSpacingBetweenModulesMembers',
        extraSpacingError: 'extraSpacingBetweenModulesMembers',
        options,
      }),
    ]

    for (let messageId of messageIds) {
      context.report({
        messageId,
        data: {
          left: toSingleLine(left.name),
          leftGroup: left.group,
          right: toSingleLine(right.name),
          rightGroup: right.group,
          nodeDependentOnRight: firstUnorderedNodeDependentOnRight?.name,
        },
        node: right.node,
        fix: (fixer: TSESLint.RuleFixer) => [
          ...makeFixes(
            fixer,
            nodes,
            sortedNodesExcludingEslintDisabled,
            sourceCode,
            options,
          ),
          ...makeNewlinesFixes(
            fixer,
            nodes,
            sortedNodesExcludingEslintDisabled,
            sourceCode,
            options,
          ),
        ],
      })
    }
  })
}

const extractDependencies = (
  expression: TSESTree.TSEnumBody | TSESTree.ClassBody,
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

  let checkNode = (nodeValue: TSESTree.Node) => {
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

    if ('members' in nodeValue) {
      traverseNode(nodeValue.members)
    }

    if ('initializer' in nodeValue && nodeValue.initializer) {
      checkNode(nodeValue.initializer)
    }

    if ('elements' in nodeValue) {
      nodeValue.elements
        .filter(currentNode => currentNode !== null)
        .forEach(checkNode)
    }

    if ('argument' in nodeValue && nodeValue.argument) {
      checkNode(nodeValue.argument)
    }

    if ('arguments' in nodeValue) {
      nodeValue.arguments.forEach(checkNode)
    }

    if ('declarations' in nodeValue) {
      nodeValue.declarations.forEach(checkNode)
    }

    if ('properties' in nodeValue) {
      nodeValue.properties.forEach(checkNode)
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
      nodeValue.expressions.forEach(checkNode)
    }
  }

  let traverseNode = (nodeValue: TSESTree.Node[] | TSESTree.Node) => {
    if (Array.isArray(nodeValue)) {
      nodeValue.forEach(traverseNode)
    } else {
      checkNode(nodeValue)
    }
  }

  checkNode(expression)
  return dependencies
}
