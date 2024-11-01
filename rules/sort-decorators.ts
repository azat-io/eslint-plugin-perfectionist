import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import {
  partitionByCommentJsonSchema,
  specialCharactersJsonSchema,
  customGroupsJsonSchema,
  ignoreCaseJsonSchema,
  groupsJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import { validateGroupsConfiguration } from '../utils/validate-groups-configuration'
import { hasPartitionComment } from '../utils/is-partition-comment'
import { sortNodesByGroups } from '../utils/sort-nodes-by-groups'
import { getCommentsBefore } from '../utils/get-comments-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getDecoratorName } from '../utils/get-decorator-name'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
import { useGroups } from '../utils/use-groups'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'

type MESSAGE_ID = 'unexpectedDecoratorsGroupOrder' | 'unexpectedDecoratorsOrder'

type Group<T extends string[]> = 'unknown' | T[number]

export type Options<T extends string[]> = [
  Partial<{
    customGroups: { [key in T[number]]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    specialCharacters: 'remove' | 'trim' | 'keep'
    groups: (Group<T>[] | Group<T>)[]
    sortOnParameters: boolean
    sortOnProperties: boolean
    sortOnAccessors: boolean
    sortOnMethods: boolean
    sortOnClasses: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

type SortDecoratorsSortingNode = SortingNode<TSESTree.Decorator>

const defaultOptions: Required<Options<string[]>[0]> = {
  type: 'alphabetical',
  ignoreCase: true,
  specialCharacters: 'keep',
  partitionByComment: false,
  customGroups: {},
  order: 'asc',
  groups: [],
  sortOnClasses: true,
  sortOnMethods: true,
  sortOnAccessors: true,
  sortOnProperties: true,
  sortOnParameters: true,
}

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: 'sort-decorators',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted decorators.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          type: typeJsonSchema,
          order: orderJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
          sortOnClasses: {
            description:
              'Controls whether sorting should be enabled for class decorators.',
            type: 'boolean',
          },
          sortOnMethods: {
            description:
              'Controls whether sorting should be enabled for class method decorators.',
            type: 'boolean',
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
          partitionByComment: {
            ...partitionByCommentJsonSchema,
            description:
              'Allows you to use comments to separate the decorators into logical groups.',
          },
          groups: groupsJsonSchema,
          customGroups: customGroupsJsonSchema,
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedDecoratorsGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedDecoratorsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [defaultOptions],
  create: context => {
    let settings = getSettings(context.settings)

    let options = complete(context.options.at(0), settings, defaultOptions)

    validateGroupsConfiguration(
      options.groups,
      ['unknown'],
      Object.keys(options.customGroups),
    )

    return {
      ClassDeclaration: Declaration =>
        options.sortOnClasses
          ? sortDecorators(context, options, Declaration.decorators)
          : undefined,
      AccessorProperty: accessorDefinition =>
        options.sortOnAccessors
          ? sortDecorators(context, options, accessorDefinition.decorators)
          : undefined,
      MethodDefinition: methodDefinition =>
        options.sortOnMethods
          ? sortDecorators(context, options, methodDefinition.decorators)
          : undefined,
      PropertyDefinition: propertyDefinition =>
        options.sortOnProperties
          ? sortDecorators(context, options, propertyDefinition.decorators)
          : undefined,
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
    }
  },
})

let sortDecorators = (
  context: Readonly<RuleContext<MESSAGE_ID, Options<string[]>>>,
  options: Required<Options<string[]>[0]>,
  decorators: TSESTree.Decorator[],
) => {
  if (decorators.length < 2) {
    return
  }
  let sourceCode = getSourceCode(context)
  let partitionComment = options.partitionByComment

  let formattedMembers: SortDecoratorsSortingNode[][] = decorators.reduce(
    (accumulator: SortDecoratorsSortingNode[][], decorator) => {
      if (
        partitionComment &&
        hasPartitionComment(
          partitionComment,
          getCommentsBefore(decorator, sourceCode),
        )
      ) {
        accumulator.push([])
      }

      let { getGroup, setCustomGroups } = useGroups(options)
      let name = getDecoratorName(decorator)

      setCustomGroups(options.customGroups, name)

      let sortingNode: SortDecoratorsSortingNode = {
        size: rangeToDiff(decorator, sourceCode),
        node: decorator,
        group: getGroup(),
        name,
      }

      accumulator.at(-1)!.push(sortingNode)

      return accumulator
    },
    [[]],
  )

  let sortedNodes = formattedMembers.flatMap(nodes =>
    sortNodesByGroups(nodes, options),
  )

  let nodes = formattedMembers.flat()
  pairwise(nodes, (left, right) => {
    let indexOfLeft = sortedNodes.indexOf(left)
    let indexOfRight = sortedNodes.indexOf(right)
    if (indexOfLeft <= indexOfRight) {
      return
    }
    let leftNum = getGroupNumber(options.groups, left)
    let rightNum = getGroupNumber(options.groups, right)
    context.report({
      messageId:
        leftNum !== rightNum
          ? 'unexpectedDecoratorsGroupOrder'
          : 'unexpectedDecoratorsOrder',
      data: {
        left: toSingleLine(left.name),
        leftGroup: left.group,
        right: toSingleLine(right.name),
        rightGroup: right.group,
      },
      node: right.node,
      fix: fixer => makeFixes(fixer, nodes, sortedNodes, sourceCode, options),
    })
  })
}
