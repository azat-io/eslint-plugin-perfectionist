import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import {
  partitionByCommentJsonSchema,
  specialCharactersJsonSchema,
  customGroupsJsonSchema,
  ignoreCaseJsonSchema,
  buildTypeJsonSchema,
  alphabetJsonSchema,
  localesJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
} from '../utils/common-json-schemas'
import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { getEslintDisabledLines } from '../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../utils/is-node-eslint-disabled'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { createNodeIndexMap } from '../utils/create-node-index-map'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getCommentsBefore } from '../utils/get-comments-before'
import { getNodeDecorators } from '../utils/get-node-decorators'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getDecoratorName } from '../utils/get-decorator-name'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { isSortable } from '../utils/is-sortable'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

export type Options<T extends string[]> = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
    customGroups: Record<T[number], string[] | string>
    partitionByComment: string[] | boolean | string
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    groups: (Group<T>[] | Group<T>)[]
    sortOnParameters: boolean
    sortOnProperties: boolean
    sortOnAccessors: boolean
    sortOnMethods: boolean
    sortOnClasses: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
    alphabet: string
  }>,
]

type MESSAGE_ID = 'unexpectedDecoratorsGroupOrder' | 'unexpectedDecoratorsOrder'

type SortDecoratorsSortingNode = SortingNode<TSESTree.Decorator>

type Group<T extends string[]> = 'unknown' | T[number]

let defaultOptions: Required<Options<string[]>[0]> = {
  specialCharacters: 'keep',
  partitionByComment: false,
  sortOnProperties: true,
  sortOnParameters: true,
  sortOnAccessors: true,
  type: 'alphabetical',
  sortOnClasses: true,
  sortOnMethods: true,
  ignoreCase: true,
  customGroups: {},
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  meta: {
    schema: [
      {
        properties: {
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the decorators into logical groups.',
          },
          sortOnParameters: {
            description:
              'Controls whether sorting should be enabled for method parameter decorators.',
            type: 'boolean',
          },
          sortOnProperties: {
            description:
              'Controls whether sorting should be enabled for class property decorators.',
            type: 'boolean',
          },
          sortOnAccessors: {
            description:
              'Controls whether sorting should be enabled for class accessor decorators.',
            type: 'boolean',
          },
          sortOnMethods: {
            description:
              'Controls whether sorting should be enabled for class method decorators.',
            type: 'boolean',
          },
          sortOnClasses: {
            description:
              'Controls whether sorting should be enabled for class decorators.',
            type: 'boolean',
          },
          specialCharacters: specialCharactersJsonSchema,
          customGroups: customGroupsJsonSchema,
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
      unexpectedDecoratorsGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedDecoratorsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
    docs: {
      url: 'https://perfectionist.dev/rules/sort-decorators',
      description: 'Enforce sorted decorators.',
      recommended: true,
    },
    type: 'suggestion',
    fixable: 'code',
  },
  create: context => {
    let settings = getSettings(context.settings)

    let options = complete(context.options.at(0), settings, defaultOptions)
    validateCustomSortConfiguration(options)
    validateGroupsConfiguration(
      options.groups,
      ['unknown'],
      Object.keys(options.customGroups),
    )

    return {
      Decorator: decorator => {
        if (!options.sortOnParameters) {
          return
        }
        if (
          'decorators' in decorator.parent &&
          decorator.parent.type === 'Identifier' &&
          decorator.parent.parent.type === 'FunctionExpression'
        ) {
          let { decorators } = decorator.parent
          if (decorator !== decorators[0]) {
            return
          }
          sortDecorators(context, options, decorators)
        }
      },
      PropertyDefinition: propertyDefinition =>
        options.sortOnProperties
          ? sortDecorators(
              context,
              options,
              getNodeDecorators(propertyDefinition),
            )
          : null,
      AccessorProperty: accessorDefinition =>
        options.sortOnAccessors
          ? sortDecorators(
              context,
              options,
              getNodeDecorators(accessorDefinition),
            )
          : null,
      MethodDefinition: methodDefinition =>
        options.sortOnMethods
          ? sortDecorators(
              context,
              options,
              getNodeDecorators(methodDefinition),
            )
          : null,
      ClassDeclaration: declaration =>
        options.sortOnClasses
          ? sortDecorators(context, options, getNodeDecorators(declaration))
          : null,
    }
  },
  defaultOptions: [defaultOptions],
  name: 'sort-decorators',
})

let sortDecorators = (
  context: Readonly<RuleContext<MESSAGE_ID, Options<string[]>>>,
  options: Required<Options<string[]>[0]>,
  decorators: TSESTree.Decorator[],
): void => {
  if (!isSortable(decorators)) {
    return
  }
  let sourceCode = getSourceCode(context)
  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: context.id,
    sourceCode,
  })

  let formattedMembers: SortDecoratorsSortingNode[][] = decorators.reduce(
    (accumulator: SortDecoratorsSortingNode[][], decorator) => {
      if (
        hasPartitionComment(
          options.partitionByComment,
          getCommentsBefore({
            node: decorator,
            sourceCode,
          }),
        )
      ) {
        accumulator.push([])
      }

      let { setCustomGroups, getGroup } = useGroups(options)
      let name = getDecoratorName(decorator)

      setCustomGroups(options.customGroups, name)

      let sortingNode: SortDecoratorsSortingNode = {
        isEslintDisabled: isNodeEslintDisabled(decorator, eslintDisabledLines),
        size: rangeToDiff(decorator, sourceCode),
        group: getGroup(),
        node: decorator,
        name,
      }

      accumulator.at(-1)!.push(sortingNode)

      return accumulator
    },
    [[]],
  )

  let sortNodesExcludingEslintDisabled = (
    ignoreEslintDisabledNodes: boolean,
  ): SortDecoratorsSortingNode[] =>
    formattedMembers.flatMap(nodes =>
      sortNodesByGroups(nodes, options, { ignoreEslintDisabledNodes }),
    )
  let sortedNodes = sortNodesExcludingEslintDisabled(false)
  let sortedNodesExcludingEslintDisabled =
    sortNodesExcludingEslintDisabled(true)

  let nodes = formattedMembers.flat()

  let nodeIndexMap = createNodeIndexMap(sortedNodes)

  pairwise(nodes, (left, right) => {
    let leftIndex = nodeIndexMap.get(left)!
    let rightIndex = nodeIndexMap.get(right)!
    let indexOfRightExcludingEslintDisabled =
      sortedNodesExcludingEslintDisabled.indexOf(right)
    if (
      leftIndex < rightIndex &&
      leftIndex < indexOfRightExcludingEslintDisabled
    ) {
      return
    }
    let leftNumber = getGroupNumber(options.groups, left)
    let rightNumber = getGroupNumber(options.groups, right)
    context.report({
      fix: fixer =>
        makeFixes({
          sortedNodes: sortedNodesExcludingEslintDisabled,
          ignoreFirstNodeHighestBlockComment: true,
          sourceCode,
          options,
          fixer,
          nodes,
        }),
      data: {
        right: toSingleLine(right.name),
        left: toSingleLine(left.name),
        rightGroup: right.group,
        leftGroup: left.group,
      },
      messageId:
        leftNumber === rightNumber
          ? 'unexpectedDecoratorsOrder'
          : 'unexpectedDecoratorsGroupOrder',
      node: right.node,
    })
  })
}
