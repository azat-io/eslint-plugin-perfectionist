import type { TSESLint } from '@typescript-eslint/utils'

import { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from '../utils/sort-nodes-by-dependencies'
import type { Modifier, Selector, Options } from './sort-objects/types'

import {
  buildUseConfigurationIfJsonSchema,
  buildCustomGroupsArrayJsonSchema,
  partitionByCommentJsonSchema,
  partitionByNewLineJsonSchema,
  newlinesBetweenJsonSchema,
  commonJsonSchemas,
  groupsJsonSchema,
  regexJsonSchema,
} from '../utils/common-json-schemas'
import {
  DEPENDENCY_ORDER_ERROR,
  MISSED_SPACING_ERROR,
  EXTRA_SPACING_ERROR,
  GROUP_ORDER_ERROR,
  ORDER_ERROR,
} from '../utils/report-errors'
import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'
import { filterOptionsByDeclarationCommentMatches } from '../utils/filter-options-by-declaration-comment-matches'
import { buildGetCustomGroupOverriddenOptionsFunction } from '../utils/get-custom-groups-compare-options'
import { validateGeneratedGroupsConfiguration } from '../utils/validate-generated-groups-configuration'
import {
  singleCustomGroupJsonSchema,
  allModifiers,
  allSelectors,
} from './sort-objects/types'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { getFirstNodeParentWithType } from './sort-objects/get-first-node-parent-with-type'
import { filterOptionsByAllNamesMatch } from '../utils/filter-options-by-all-names-match'
import { generatePredefinedGroups } from '../utils/generate-predefined-groups'
import { sortNodesByDependencies } from '../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../utils/does-custom-group-match'
import { UnreachableCaseError } from '../utils/unreachable-case-error'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { createEslintRule } from '../utils/create-eslint-rule'
import { reportAllErrors } from '../utils/report-all-errors'
import { shouldPartition } from '../utils/should-partition'
import { computeGroup } from '../utils/compute-group'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { complete } from '../utils/complete'
import { matches } from '../utils/matches'

/** Cache computed groups by modifiers and selectors for performance. */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

type MessageId =
  | 'missedSpacingBetweenObjectMembers'
  | 'unexpectedObjectsDependencyOrder'
  | 'extraSpacingBetweenObjectMembers'
  | 'unexpectedObjectsGroupOrder'
  | 'unexpectedObjectsOrder'

let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted' },
  partitionByNewLine: false,
  partitionByComment: false,
  newlinesBetween: 'ignore',
  specialCharacters: 'keep',
  styledComponents: true,
  useConfigurationIf: {},
  type: 'alphabetical',
  ignorePattern: [],
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options, MessageId>({
  create: context => {
    let settings = getSettings(context.settings)
    let { sourceCode, id } = context

    function sortObject(
      nodeObject: TSESTree.ObjectExpression | TSESTree.ObjectPattern,
    ): void {
      if (!isSortable(nodeObject.properties)) {
        return
      }

      let matchedContextOptions = computeMatchedContextOptions({
        nodeObject,
        sourceCode,
        context,
      })
      let options = complete(matchedContextOptions, settings, defaultOptions)
      validateCustomSortConfiguration(options)
      validateGeneratedGroupsConfiguration({
        selectors: allSelectors,
        modifiers: allModifiers,
        options,
      })
      validateNewlinesAndPartitionConfiguration(options)

      let objectParentForIgnorePattern = getObjectParent({
        onlyFirstParent: false,
        node: nodeObject,
        sourceCode,
      })
      if (
        objectParentForIgnorePattern?.name &&
        matches(objectParentForIgnorePattern.name, options.ignorePattern)
      ) {
        return
      }

      let objectRoot =
        nodeObject.type === 'ObjectPattern' ? null : getRootObject(nodeObject)
      if (
        objectRoot &&
        !options.styledComponents &&
        (isStyledComponents(objectRoot.parent) ||
          (objectRoot.parent.type === 'ArrowFunctionExpression' &&
            isStyledComponents(objectRoot.parent.parent)))
      ) {
        return
      }

      let eslintDisabledLines = getEslintDisabledLines({
        ruleName: id,
        sourceCode,
      })

      function extractDependencies(init: TSESTree.Expression): string[] {
        let dependencies: string[] = []

        function checkNode(nodeValue: TSESTree.Node): void {
          /** No need to check the body of functions and arrow functions. */
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

        function traverseNode(nodeValue: TSESTree.Node): void {
          checkNode(nodeValue)
        }

        traverseNode(init)
        return dependencies
      }
      function formatProperties(
        props: (
          | TSESTree.ObjectLiteralElement
          | TSESTree.RestElement
          | TSESTree.Property
        )[],
      ): SortingNodeWithDependencies[][] {
        return props.reduce(
          (accumulator: SortingNodeWithDependencies[][], property) => {
            if (
              property.type === 'SpreadElement' ||
              property.type === 'RestElement'
            ) {
              accumulator.push([])
              return accumulator
            }

            let lastSortingNode = accumulator.at(-1)?.at(-1)

            let dependencies: string[] = []

            let selectors: Selector[] = []
            let modifiers: Modifier[] = []

            if (property.value.type === 'AssignmentPattern') {
              dependencies = extractDependencies(property.value.right)
            }

            if (
              property.value.type === 'ArrowFunctionExpression' ||
              property.value.type === 'FunctionExpression'
            ) {
              selectors.push('method')
            } else {
              selectors.push('property')
            }

            selectors.push('member')

            if (property.loc.start.line !== property.loc.end.line) {
              modifiers.push('multiline')
            }

            let name = getNodeName({ sourceCode, property })
            let predefinedGroups = generatePredefinedGroups({
              cache: cachedGroupsByModifiersAndSelectors,
              selectors,
              modifiers,
            })
            let group = computeGroup({
              customGroupMatcher: customGroup =>
                doesCustomGroupMatch({
                  elementValue: getNodeValue({
                    sourceCode,
                    property,
                  }),
                  elementName: name,
                  customGroup,
                  selectors,
                  modifiers,
                }),
              predefinedGroups,
              options,
            })

            let dependencyName: string = name
            let isDestructuredObject = nodeObject.type === 'ObjectPattern'
            if (isDestructuredObject && property.value.type === 'Identifier') {
              dependencyName = property.value.name
            }

            let sortingNode: Omit<SortingNodeWithDependencies, 'partitionId'> =
              {
                isEslintDisabled: isNodeEslintDisabled(
                  property,
                  eslintDisabledLines,
                ),
                size: rangeToDiff(property, sourceCode),
                dependencyNames: [dependencyName],
                node: property,
                dependencies,
                group,
                name,
              }

            if (
              shouldPartition({
                lastSortingNode,
                sortingNode,
                sourceCode,
                options,
              })
            ) {
              accumulator.push([])
            }

            accumulator.at(-1)!.push({
              ...sortingNode,
              partitionId: accumulator.length,
            })

            return accumulator
          },
          [[]],
        )
      }
      let formattedMembers = formatProperties(nodeObject.properties)

      function sortNodesExcludingEslintDisabled(
        ignoreEslintDisabledNodes: boolean,
      ): SortingNodeWithDependencies[] {
        let nodesSortedByGroups = formattedMembers.flatMap(nodes =>
          sortNodesByGroups({
            getOptionsByGroupIndex:
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
      let nodes = formattedMembers.flat()

      reportAllErrors<MessageId>({
        availableMessageIds: {
          missedSpacingBetweenMembers: 'missedSpacingBetweenObjectMembers',
          extraSpacingBetweenMembers: 'extraSpacingBetweenObjectMembers',
          unexpectedDependencyOrder: 'unexpectedObjectsDependencyOrder',
          unexpectedGroupOrder: 'unexpectedObjectsGroupOrder',
          unexpectedOrder: 'unexpectedObjectsOrder',
        },
        sortNodesExcludingEslintDisabled,
        sourceCode,
        options,
        context,
        nodes,
      })
    }

    return {
      ObjectExpression: sortObject,
      ObjectPattern: sortObject,
    }
  },
  meta: {
    schema: {
      items: {
        properties: {
          ...commonJsonSchemas,
          useConfigurationIf: buildUseConfigurationIfJsonSchema({
            additionalProperties: {
              objectType: {
                description:
                  'Specifies whether to only match destructured objects or regular objects.',
                enum: ['destructured', 'non-destructured'],
                type: 'string',
              },
              declarationCommentMatchesPattern: regexJsonSchema,
              callingFunctionNamePattern: regexJsonSchema,
              declarationMatchesPattern: regexJsonSchema,
            },
          }),
          styledComponents: {
            description: 'Controls whether to sort styled components.',
            type: 'boolean',
          },
          customGroups: buildCustomGroupsArrayJsonSchema({
            singleCustomGroupJsonSchema,
          }),
          partitionByComment: partitionByCommentJsonSchema,
          partitionByNewLine: partitionByNewLineJsonSchema,
          newlinesBetween: newlinesBetweenJsonSchema,
          ignorePattern: regexJsonSchema,
          groups: groupsJsonSchema,
        },
        additionalProperties: false,
        type: 'object',
      },
      uniqueItems: true,
      type: 'array',
    },
    messages: {
      unexpectedObjectsDependencyOrder: DEPENDENCY_ORDER_ERROR,
      missedSpacingBetweenObjectMembers: MISSED_SPACING_ERROR,
      extraSpacingBetweenObjectMembers: EXTRA_SPACING_ERROR,
      unexpectedObjectsGroupOrder: GROUP_ORDER_ERROR,
      unexpectedObjectsOrder: ORDER_ERROR,
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-objects',
      description: 'Enforce sorted objects.',
      recommended: true,
    },
    defaultOptions: [defaultOptions],
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [defaultOptions],
  name: 'sort-objects',
})

function computeMatchedContextOptions({
  sourceCode,
  nodeObject,
  context,
}: {
  nodeObject: TSESTree.ObjectExpression | TSESTree.ObjectPattern
  context: TSESLint.RuleContext<MessageId, Options>
  sourceCode: TSESLint.SourceCode
}): Options[number] | undefined {
  let objectParent = getObjectParent({
    onlyFirstParent: true,
    node: nodeObject,
    sourceCode,
  })
  let filteredContextOptions = filterOptionsByAllNamesMatch({
    nodeNames: nodeObject.properties
      .filter(
        property =>
          property.type !== 'SpreadElement' && property.type !== 'RestElement',
      )
      .map(property => getNodeName({ sourceCode, property })),
    contextOptions: context.options,
  })

  let parentNodeForDeclarationComment = null
  if (objectParent) {
    parentNodeForDeclarationComment =
      objectParent.type === 'VariableDeclarator'
        ? objectParent.node.parent
        : objectParent.node
  }
  filteredContextOptions = filterOptionsByDeclarationCommentMatches({
    parentNode: parentNodeForDeclarationComment,
    contextOptions: filteredContextOptions,
    sourceCode,
  })

  return filteredContextOptions.find(options => {
    if (!options.useConfigurationIf) {
      return true
    }

    if (options.useConfigurationIf.objectType) {
      let isDestructuredObject = nodeObject.type === 'ObjectPattern'
      if (
        isDestructuredObject &&
        options.useConfigurationIf.objectType === 'non-destructured'
      ) {
        return false
      }
      if (
        !isDestructuredObject &&
        options.useConfigurationIf.objectType === 'destructured'
      ) {
        return false
      }
    }

    if (options.useConfigurationIf.callingFunctionNamePattern) {
      if (!objectParent) {
        return false
      }
      if (objectParent.type !== 'CallExpression' || !objectParent.name) {
        return false
      }
      let patternMatches = matches(
        objectParent.name,
        options.useConfigurationIf.callingFunctionNamePattern,
      )
      if (!patternMatches) {
        return false
      }
    }

    if (options.useConfigurationIf.declarationMatchesPattern) {
      if (!objectParent) {
        return false
      }
      if (objectParent.type !== 'VariableDeclarator' || !objectParent.name) {
        return false
      }
      let patternMatches = matches(
        objectParent.name,
        options.useConfigurationIf.declarationMatchesPattern,
      )
      if (!patternMatches) {
        return false
      }
    }

    return true
  })
}

function getObjectParent({
  onlyFirstParent,
  sourceCode,
  node,
}: {
  node: TSESTree.ObjectExpression | TSESTree.ObjectPattern
  sourceCode: TSESLint.SourceCode
  onlyFirstParent: boolean
}):
  | {
      node: TSESTree.VariableDeclarator | TSESTree.Property
      type: 'VariableDeclarator'
      name: string | null
    }
  | {
      node: TSESTree.CallExpression
      type: 'CallExpression'
      name: string | null
    }
  | null {
  let variableParent = getVariableParent({ onlyFirstParent, node })
  if (variableParent) {
    return {
      type: 'VariableDeclarator',
      name: variableParent.name,
      node: variableParent.node,
    }
  }
  let callParent = getFirstNodeParentWithType({
    allowedTypes: [TSESTree.AST_NODE_TYPES.CallExpression],
    onlyFirstParent,
    node,
  })
  if (callParent) {
    return {
      name: sourceCode.getText(callParent.callee),
      type: 'CallExpression',
      node: callParent,
    }
  }
  return null
}

function getVariableParent({
  onlyFirstParent,
  node,
}: {
  node: TSESTree.ObjectExpression | TSESTree.ObjectPattern
  onlyFirstParent: boolean
}): {
  node: TSESTree.VariableDeclarator | TSESTree.Property
  name: string | null
} | null {
  let variableParent = getFirstNodeParentWithType({
    allowedTypes: [
      TSESTree.AST_NODE_TYPES.VariableDeclarator,
      TSESTree.AST_NODE_TYPES.Property,
    ],
    onlyFirstParent,
    node,
  })
  if (!variableParent) {
    return null
  }
  let parentId
  switch (variableParent.type) {
    case TSESTree.AST_NODE_TYPES.VariableDeclarator:
      parentId = variableParent.id
      break
    case TSESTree.AST_NODE_TYPES.Property:
      parentId = variableParent.key
      break
    /* v8 ignore next 2 */
    default:
      throw new UnreachableCaseError(variableParent)
  }

  return {
    name: parentId.type === 'Identifier' ? parentId.name : null,
    node: variableParent,
  }
}

function isStyledComponents(styledNode: TSESTree.Node): boolean {
  if (
    styledNode.type === 'JSXExpressionContainer' &&
    styledNode.parent.type === 'JSXAttribute' &&
    styledNode.parent.name.name === 'style'
  ) {
    return true
  }

  if (styledNode.type !== 'CallExpression') {
    return false
  }

  return (
    isCssCallExpression(styledNode.callee) ||
    (styledNode.callee.type === 'MemberExpression' &&
      isStyledCallExpression(styledNode.callee.object)) ||
    (styledNode.callee.type === 'CallExpression' &&
      isStyledCallExpression(styledNode.callee.callee))
  )
}

function getNodeName({
  sourceCode,
  property,
}: {
  sourceCode: TSESLint.SourceCode
  property: TSESTree.Property
}): string {
  if (property.key.type === 'Identifier') {
    return property.key.name
  } else if (property.key.type === 'Literal') {
    return `${property.key.value}`
  }
  return sourceCode.getText(property.key)
}

function getNodeValue({
  sourceCode,
  property,
}: {
  sourceCode: TSESLint.SourceCode
  property: TSESTree.Property
}): string | null {
  if (
    property.value.type === 'ArrowFunctionExpression' ||
    property.value.type === 'FunctionExpression'
  ) {
    return null
  }
  return sourceCode.getText(property.value)
}

function getRootObject(
  node: TSESTree.ObjectExpression,
): TSESTree.ObjectExpression {
  let objectRoot = node
  while (
    objectRoot.parent.type === 'Property' &&
    objectRoot.parent.parent.type === 'ObjectExpression'
  ) {
    objectRoot = objectRoot.parent.parent
  }
  return objectRoot
}

function isStyledCallExpression(identifier: TSESTree.Expression): boolean {
  return identifier.type === 'Identifier' && identifier.name === 'styled'
}

function isCssCallExpression(identifier: TSESTree.Expression): boolean {
  return identifier.type === 'Identifier' && identifier.name === 'css'
}
