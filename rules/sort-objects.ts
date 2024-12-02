import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  newlinesBetweenJsonSchema,
  customGroupsJsonSchema,
  ignoreCaseJsonSchema,
  alphabetJsonSchema,
  localesJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import {
  getFirstUnorderedNodeDependentOn,
  sortNodesByDependencies,
} from '../utils/sort-nodes-by-dependencies'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getCommentsBefore } from '../utils/get-comments-before'
import { makeNewlinesFixes } from '../utils/make-newlines-fixes'
import { getNewlinesErrors } from '../utils/get-newlines-errors'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getLinesBetween } from '../utils/get-lines-between'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { getNodeParent } from '../utils/get-node-parent'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { sortNodes } from '../utils/sort-nodes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { matches } from '../utils/matches'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
    destructuredObjects: { groups: boolean } | boolean
    customGroups: Record<string, string[] | string>
    partitionByComment: string[] | boolean | string
    newlinesBetween: 'ignore' | 'always' | 'never'
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    groups: (Group[] | Group)[]
    partitionByNewLine: boolean
    objectDeclarations: boolean
    styledComponents: boolean
    /**
     * @deprecated for {@link `destructuredObjects`} and {@link `objectDeclarations`}
     */
    destructureOnly: boolean
    ignorePattern: string[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
    alphabet: string
  }>,
]

type MESSAGE_ID =
  | 'missedSpacingBetweenObjectMembers'
  | 'unexpectedObjectsDependencyOrder'
  | 'extraSpacingBetweenObjectMembers'
  | 'unexpectedObjectsGroupOrder'
  | 'unexpectedObjectsOrder'

type Group = 'multiline' | 'unknown' | 'method' | string

let defaultOptions: Required<Options[0]> = {
  partitionByNewLine: false,
  partitionByComment: false,
  newlinesBetween: 'ignore',
  specialCharacters: 'keep',
  destructuredObjects: true,
  objectDeclarations: true,
  styledComponents: true,
  destructureOnly: false,
  type: 'alphabetical',
  ignorePattern: [],
  ignoreCase: true,
  customGroups: {},
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MESSAGE_ID>({
  create: context => {
    let sortObject = (
      nodeObject: TSESTree.ObjectExpression | TSESTree.ObjectPattern,
    ): void => {
      if (!isSortable(nodeObject.properties)) {
        return
      }

      let settings = getSettings(context.settings)

      let options = complete(context.options.at(0), settings, defaultOptions)
      validateCustomSortConfiguration(options)
      validateGroupsConfiguration(
        options.groups,
        ['multiline', 'method', 'unknown'],
        Object.keys(options.customGroups),
      )
      validateNewlinesAndPartitionConfiguration(options)

      let isDestructuredObject = nodeObject.type === 'ObjectPattern'
      if (isDestructuredObject) {
        if (!options.destructuredObjects) {
          return
        }
      } else if (options.destructureOnly || !options.objectDeclarations) {
        return
      }

      if (options.ignorePattern.length) {
        let variableParent = getNodeParent(nodeObject, [
          'VariableDeclarator',
          'Property',
        ])
        let parentId =
          variableParent?.type === 'VariableDeclarator'
            ? variableParent.id
            : (variableParent as TSESTree.Property | null)?.key

        let variableIdentifier =
          parentId?.type === 'Identifier' ? parentId.name : null

        let checkMatch = (identifier: string): boolean =>
          options.ignorePattern.some(pattern => matches(identifier, pattern))

        if (
          typeof variableIdentifier === 'string' &&
          checkMatch(variableIdentifier)
        ) {
          return
        }

        let callParent = getNodeParent(nodeObject, ['CallExpression'])
        let callIdentifier =
          callParent?.type === 'CallExpression' &&
          callParent.callee.type === 'Identifier'
            ? callParent.callee.name
            : null

        if (callIdentifier && checkMatch(callIdentifier)) {
          return
        }
      }

      let isStyledCallExpression = (identifier: TSESTree.Expression): boolean =>
        identifier.type === 'Identifier' && identifier.name === 'styled'
      let isCssCallExpression = (identifier: TSESTree.Expression): boolean =>
        identifier.type === 'Identifier' && identifier.name === 'css'
      let isStyledComponents = (
        styledNode: TSESTree.Node | undefined,
      ): boolean =>
        !!styledNode &&
        ((styledNode.type === 'CallExpression' &&
          (isCssCallExpression(styledNode.callee) ||
            (styledNode.callee.type === 'MemberExpression' &&
              isStyledCallExpression(styledNode.callee.object)) ||
            (styledNode.callee.type === 'CallExpression' &&
              isStyledCallExpression(styledNode.callee.callee)))) ||
          (styledNode.type === 'JSXExpressionContainer' &&
            styledNode.parent.type === 'JSXAttribute' &&
            styledNode.parent.name.name === 'style'))
      if (
        !options.styledComponents &&
        (isStyledComponents(nodeObject.parent) ||
          (nodeObject.parent.type === 'ArrowFunctionExpression' &&
            isStyledComponents(nodeObject.parent.parent)))
      ) {
        return
      }

      let sourceCode = getSourceCode(context)
      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: context.id,
        sourceCode,
      })

      let extractDependencies = (
        init: TSESTree.AssignmentPattern,
      ): string[] => {
        let dependencies: string[] = []

        let checkNode = (nodeValue: TSESTree.Node): void => {
          /**
           * No need to check the body of functions and arrow functions
           */
          if (
            nodeValue.type === 'ArrowFunctionExpression' ||
            nodeValue.type === 'FunctionExpression'
          ) {
            return
          }

          if (nodeValue.type === 'Identifier') {
            dependencies.push(nodeValue.name)
          }

          if (nodeValue.type === 'Property') {
            traverseNode(nodeValue.key)
            traverseNode(nodeValue.value)
          }

          if (nodeValue.type === 'ConditionalExpression') {
            traverseNode(nodeValue.test)
            traverseNode(nodeValue.consequent)
            traverseNode(nodeValue.alternate)
          }

          if (
            'expression' in nodeValue &&
            typeof nodeValue.expression !== 'boolean'
          ) {
            traverseNode(nodeValue.expression)
          }

          if ('object' in nodeValue) {
            traverseNode(nodeValue.object)
          }

          if ('callee' in nodeValue) {
            traverseNode(nodeValue.callee)
          }

          if ('left' in nodeValue) {
            traverseNode(nodeValue.left)
          }

          if ('right' in nodeValue) {
            traverseNode(nodeValue.right as TSESTree.Node)
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
            traverseNode(nodeValue.argument)
          }

          if ('arguments' in nodeValue) {
            for (let argument of nodeValue.arguments) {
              traverseNode(argument)
            }
          }

          if ('properties' in nodeValue) {
            for (let property of nodeValue.properties) {
              traverseNode(property)
            }
          }

          if ('expressions' in nodeValue) {
            for (let nodeExpression of nodeValue.expressions) {
              traverseNode(nodeExpression)
            }
          }
        }

        let traverseNode = (nodeValue: TSESTree.Node): void => {
          checkNode(nodeValue)
        }

        traverseNode(init)
        return dependencies
      }
      let formatProperties = (
        props: (
          | TSESTree.ObjectLiteralElement
          | TSESTree.RestElement
          | TSESTree.Property
        )[],
      ): SortingNodeWithDependencies[][] =>
        props.reduce(
          (accumulator: SortingNodeWithDependencies[][], property) => {
            if (
              property.type === 'SpreadElement' ||
              property.type === 'RestElement'
            ) {
              accumulator.push([])
              return accumulator
            }

            let lastProperty = accumulator.at(-1)?.at(-1)

            let name: string
            let dependencies: string[] = []

            let { setCustomGroups, defineGroup, getGroup } = useGroups(options)

            if (property.key.type === 'Identifier') {
              ;({ name } = property.key)
            } else if (property.key.type === 'Literal') {
              name = `${property.key.value}`
            } else {
              name = sourceCode.getText(property.key)
            }

            if (property.value.type === 'AssignmentPattern') {
              dependencies = extractDependencies(property.value)
            }

            setCustomGroups(options.customGroups, name)

            if (
              property.value.type === 'ArrowFunctionExpression' ||
              property.value.type === 'FunctionExpression'
            ) {
              defineGroup('method')
            }

            if (property.loc.start.line !== property.loc.end.line) {
              defineGroup('multiline')
            }

            let propertySortingNode: SortingNodeWithDependencies = {
              isEslintDisabled: isNodeEslintDisabled(
                property,
                eslintDisabledLines,
              ),
              size: rangeToDiff(property, sourceCode),
              group: getGroup(),
              node: property,
              dependencies,
              name,
            }

            if (
              (options.partitionByNewLine &&
                lastProperty &&
                getLinesBetween(
                  sourceCode,
                  lastProperty,
                  propertySortingNode,
                )) ||
              (options.partitionByComment &&
                hasPartitionComment(
                  options.partitionByComment,
                  getCommentsBefore({
                    node: property,
                    sourceCode,
                  }),
                ))
            ) {
              accumulator.push([])
            }

            accumulator.at(-1)!.push(propertySortingNode)

            return accumulator
          },
          [[]],
        )
      let formattedMembers = formatProperties(nodeObject.properties)

      let nodesSortingFunction =
        isDestructuredObject &&
        typeof options.destructuredObjects === 'object' &&
        !options.destructuredObjects.groups
          ? sortNodes
          : sortNodesByGroups
      let sortNodesIgnoringEslintDisabledNodes = (
        ignoreEslintDisabledNodes: boolean,
      ): SortingNodeWithDependencies[] =>
        sortNodesByDependencies(
          formattedMembers.flatMap(nodes =>
            nodesSortingFunction(nodes, options, {
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
      let nodes = formattedMembers.flat()

      pairwise(nodes, (left, right) => {
        let leftNumber = getGroupNumber(options.groups, left)
        let rightNumber = getGroupNumber(options.groups, right)

        let indexOfLeft = sortedNodes.indexOf(left)
        let indexOfRight = sortedNodes.indexOf(right)
        let indexOfRightExcludingEslintDisabled =
          sortedNodesExcludingEslintDisabled.indexOf(right)

        let messageIds: MESSAGE_ID[] = []
        let firstUnorderedNodeDependentOnRight:
          | SortingNodeWithDependencies
          | undefined

        if (
          indexOfLeft > indexOfRight ||
          indexOfLeft >= indexOfRightExcludingEslintDisabled
        ) {
          firstUnorderedNodeDependentOnRight = getFirstUnorderedNodeDependentOn(
            right,
            nodes,
          )
          if (firstUnorderedNodeDependentOnRight) {
            messageIds.push('unexpectedObjectsDependencyOrder')
          } else {
            messageIds.push(
              leftNumber === rightNumber
                ? 'unexpectedObjectsOrder'
                : 'unexpectedObjectsGroupOrder',
            )
          }
        }

        messageIds = [
          ...messageIds,
          ...getNewlinesErrors({
            missedSpacingError: 'missedSpacingBetweenObjectMembers',
            extraSpacingError: 'extraSpacingBetweenObjectMembers',
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
            fix: fixer => [
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
              rightGroup: right.group,
              leftGroup: left.group,
              right: right.name,
              left: left.name,
            },
            node: right.node,
            messageId,
          })
        }
      })
    }

    return {
      ObjectExpression: sortObject,
      ObjectPattern: sortObject,
    }
  },
  meta: {
    schema: [
      {
        properties: {
          destructuredObjects: {
            oneOf: [
              {
                type: 'boolean',
              },
              {
                properties: {
                  groups: {
                    description:
                      'Controls whether to use groups to sort destructured objects.',
                    type: 'boolean',
                  },
                },
                additionalProperties: false,
                type: 'object',
              },
            ],
            description: 'Controls whether to sort destructured objects.',
          },
          ignorePattern: {
            description:
              'Specifies names or patterns for nodes that should be ignored by rule.',
            items: {
              type: 'string',
            },
            type: 'array',
          },
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the keys of objects into logical groups.',
          },
          destructureOnly: {
            description: 'Controls whether to sort only destructured objects.',
            type: 'boolean',
          },
          objectDeclarations: {
            description: 'Controls whether to sort object declarations.',
            type: 'boolean',
          },
          styledComponents: {
            description: 'Controls whether to sort styled components.',
            type: 'boolean',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          customGroups: customGroupsJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          alphabet: alphabetJsonSchema,
          locales: localesJsonSchema,
          groups: groupsJsonSchema,
          order: orderJsonSchema,
          type: typeJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    messages: {
      unexpectedObjectsGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedObjectsDependencyOrder:
        'Expected dependency "{{right}}" to come before "{{nodeDependentOnRight}}".',
      missedSpacingBetweenObjectMembers:
        'Missed spacing between "{{left}}" and "{{right}}" objects.',
      extraSpacingBetweenObjectMembers:
        'Extra spacing between "{{left}}" and "{{right}}" objects.',
      unexpectedObjectsOrder: 'Expected "{{right}}" to come before "{{left}}".',
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-objects',
      description: 'Enforce sorted objects.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-objects',
})
