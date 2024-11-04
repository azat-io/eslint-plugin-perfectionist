import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'

import {
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  specialCharactersJsonSchema,
  customGroupsJsonSchema,
  ignoreCaseJsonSchema,
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
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
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
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { matches } from '../utils/matches'

type MESSAGE_ID =
  | 'missedSpacingBetweenObjectMembers'
  | 'unexpectedObjectsDependencyOrder'
  | 'extraSpacingBetweenObjectMembers'
  | 'unexpectedObjectsGroupOrder'
  | 'unexpectedObjectsOrder'

type Group = 'multiline' | 'unknown' | 'method' | string

type Options = [
  Partial<{
    customGroups: { [key: string]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    newlinesBetween: 'ignore' | 'always' | 'never'
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    groups: (Group[] | Group)[]
    partitionByNewLine: boolean
    styledComponents: boolean
    destructureOnly: boolean
    ignorePattern: string[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

const defaultOptions: Required<Options[0]> = {
  partitionByNewLine: false,
  partitionByComment: false,
  styledComponents: true,
  destructureOnly: false,
  type: 'alphabetical',
  ignorePattern: [],
  newlinesBetween: 'ignore',
  ignoreCase: true,
  specialCharacters: 'keep',
  customGroups: {},
  order: 'asc',
  groups: [],
  locales: 'en-US',
}

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-objects',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted objects.',
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
              'Allows you to use comments to separate the keys of objects into logical groups.',
          },
          partitionByNewLine: partitionByNewLineJsonSchema,
          newlinesBetween: {
            description:
              'Specifies how new lines should be handled between object types groups.',
            enum: ['ignore', 'always', 'never'],
            type: 'string',
          },
          styledComponents: {
            description: 'Controls whether to sort styled components.',
            type: 'boolean',
          },
          destructureOnly: {
            description: 'Controls whether to sort only destructured objects.',
            type: 'boolean',
          },
          ignorePattern: {
            description:
              'Specifies names or patterns for nodes that should be ignored by rule.',
            items: {
              type: 'string',
            },
            type: 'array',
          },
          groups: groupsJsonSchema,
          customGroups: customGroupsJsonSchema,
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedObjectsGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedObjectsOrder: 'Expected "{{right}}" to come before "{{left}}".',
      unexpectedObjectsDependencyOrder:
        'Expected dependency "{{right}}" to come before "{{nodeDependentOnRight}}".',
      missedSpacingBetweenObjectMembers:
        'Missed spacing between "{{left}}" and "{{right}}" objects.',
      extraSpacingBetweenObjectMembers:
        'Extra spacing between "{{left}}" and "{{right}}" objects.',
    },
  },
  defaultOptions: [defaultOptions],
  create: context => {
    let sortObject = (
      node: TSESTree.ObjectExpression | TSESTree.ObjectPattern,
    ) => {
      let settings = getSettings(context.settings)

      let options = complete(context.options.at(0), settings, defaultOptions)

      validateGroupsConfiguration(
        options.groups,
        ['multiline', 'method', 'unknown'],
        Object.keys(options.customGroups),
      )
      validateNewlinesAndPartitionConfiguration(options)

      let shouldIgnore = false

      if (options.destructureOnly) {
        shouldIgnore = node.type !== 'ObjectPattern'
      }

      if (!shouldIgnore && options.ignorePattern.length) {
        let varParent = getNodeParent(node, ['VariableDeclarator', 'Property'])
        let parentId =
          varParent?.type === 'VariableDeclarator'
            ? varParent.id
            : (varParent as TSESTree.Property | null)?.key

        let varIdentifier =
          parentId?.type === 'Identifier' ? parentId.name : null

        let checkMatch = (identifier: string) =>
          options.ignorePattern.some(pattern => matches(identifier, pattern))

        if (typeof varIdentifier === 'string' && checkMatch(varIdentifier)) {
          shouldIgnore = true
        }

        let callParent = getNodeParent(node, ['CallExpression'])
        let callIdentifier =
          callParent?.type === 'CallExpression' &&
          callParent.callee.type === 'Identifier'
            ? callParent.callee.name
            : null

        if (callIdentifier && checkMatch(callIdentifier)) {
          shouldIgnore = true
        }
      }

      if (!shouldIgnore && node.properties.length > 1) {
        let isStyledCallExpression = (identifier: TSESTree.Expression) =>
          identifier.type === 'Identifier' && identifier.name === 'styled'

        let isCssCallExpression = (identifier: TSESTree.Expression) =>
          identifier.type === 'Identifier' && identifier.name === 'css'

        let isStyledComponents = (
          styledNode: TSESTree.Node | undefined,
        ): boolean =>
          styledNode !== undefined &&
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
          (isStyledComponents(node.parent) ||
            (node.parent.type === 'ArrowFunctionExpression' &&
              isStyledComponents(node.parent.parent)))
        ) {
          return
        }

        let sourceCode = getSourceCode(context)

        let extractDependencies = (
          init: TSESTree.AssignmentPattern,
        ): string[] => {
          let dependencies: string[] = []

          let checkNode = (nodeValue: TSESTree.Node) => {
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
              nodeValue.elements
                .filter(currentNode => currentNode !== null)
                .forEach(traverseNode)
            }

            if ('argument' in nodeValue && nodeValue.argument) {
              traverseNode(nodeValue.argument)
            }

            if ('arguments' in nodeValue) {
              nodeValue.arguments.forEach(traverseNode)
            }

            if ('properties' in nodeValue) {
              nodeValue.properties.forEach(traverseNode)
            }

            if ('expressions' in nodeValue) {
              nodeValue.expressions.forEach(traverseNode)
            }
          }

          let traverseNode = (nodeValue: TSESTree.Node) => {
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
            (accumulator: SortingNodeWithDependencies[][], prop) => {
              if (
                prop.type === 'SpreadElement' ||
                prop.type === 'RestElement'
              ) {
                accumulator.push([])
                return accumulator
              }

              let comments = getCommentsBefore(prop, sourceCode)
              let lastProp = accumulator.at(-1)?.at(-1)

              let name: string
              let dependencies: string[] = []

              let { getGroup, defineGroup, setCustomGroups } =
                useGroups(options)

              if (prop.key.type === 'Identifier') {
                ;({ name } = prop.key)
              } else if (prop.key.type === 'Literal') {
                name = `${prop.key.value}`
              } else {
                name = sourceCode.getText(prop.key)
              }

              if (prop.value.type === 'AssignmentPattern') {
                dependencies = extractDependencies(prop.value)
              }

              setCustomGroups(options.customGroups, name)

              if (
                prop.value.type === 'ArrowFunctionExpression' ||
                prop.value.type === 'FunctionExpression'
              ) {
                defineGroup('method')
              }

              if (prop.loc.start.line !== prop.loc.end.line) {
                defineGroup('multiline')
              }

              let propSortingNode: SortingNodeWithDependencies = {
                size: rangeToDiff(prop, sourceCode),
                node: prop,
                group: getGroup(),
                dependencies,
                name,
              }

              if (
                (options.partitionByNewLine &&
                  lastProp &&
                  getLinesBetween(sourceCode, lastProp, propSortingNode)) ||
                (options.partitionByComment &&
                  hasPartitionComment(options.partitionByComment, comments))
              ) {
                accumulator.push([])
              }

              accumulator.at(-1)!.push(propSortingNode)

              return accumulator
            },
            [[]],
          )

        let formattedMembers = formatProperties(node.properties)
        let sortedNodes = sortNodesByDependencies(
          formattedMembers
            .map(nodes => sortNodesByGroups(nodes, options))
            .flat(),
        )
        let nodes = formattedMembers.flat()

        pairwise(nodes, (left, right) => {
          let leftNum = getGroupNumber(options.groups, left)
          let rightNum = getGroupNumber(options.groups, right)

          let indexOfLeft = sortedNodes.indexOf(left)
          let indexOfRight = sortedNodes.indexOf(right)

          let messageIds: MESSAGE_ID[] = []
          let firstUnorderedNodeDependentOnRight:
            | SortingNodeWithDependencies
            | undefined

          if (indexOfLeft > indexOfRight) {
            firstUnorderedNodeDependentOnRight =
              getFirstUnorderedNodeDependentOn(right, nodes)
            if (firstUnorderedNodeDependentOnRight) {
              messageIds.push('unexpectedObjectsDependencyOrder')
            } else {
              messageIds.push(
                leftNum !== rightNum
                  ? 'unexpectedObjectsGroupOrder'
                  : 'unexpectedObjectsOrder',
              )
            }
          }

          messageIds = [
            ...messageIds,
            ...getNewlinesErrors({
              left,
              leftNum,
              right,
              rightNum,
              sourceCode,
              missedSpacingError: 'missedSpacingBetweenObjectMembers',
              extraSpacingError: 'extraSpacingBetweenObjectMembers',
              options,
            }),
          ]

          for (let messageId of messageIds) {
            context.report({
              messageId,
              data: {
                left: left.name,
                leftGroup: left.group,
                right: right.name,
                rightGroup: right.group,
                nodeDependentOnRight: firstUnorderedNodeDependentOnRight?.name,
              },
              node: right.node,
              fix: fixer => [
                ...makeFixes(fixer, nodes, sortedNodes, sourceCode, options),
                ...makeNewlinesFixes(
                  fixer,
                  nodes,
                  sortedNodes,
                  sourceCode,
                  options,
                ),
              ],
            })
          }
        })
      }
    }

    return {
      ObjectExpression: sortObject,
      ObjectPattern: sortObject,
    }
  },
})
