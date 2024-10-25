import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

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
    matcher: 'minimatch' | 'regex'
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
          type: {
            description: 'Specifies the sorting method.',
            type: 'string',
            enum: ['alphabetical', 'natural', 'line-length'],
          },
          order: {
            description:
              'Determines whether the sorted items should be in ascending or descending order.',
            type: 'string',
            enum: ['asc', 'desc'],
          },
          matcher: {
            description: 'Specifies the string matcher.',
            type: 'string',
            enum: ['minimatch', 'regex'],
          },
          ignoreCase: {
            description:
              'Controls whether sorting should be case-sensitive or not.',
            type: 'boolean',
          },
          specialCharacters: {
            description:
              'Controls how special characters should be handled before sorting.',
            type: 'string',
            enum: ['remove', 'trim', 'keep'],
          },
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
            description:
              'Allows you to use comments to separate the decorators into logical groups.',
            anyOf: [
              {
                type: 'boolean',
              },
              {
                type: 'string',
              },
              {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            ],
          },
          groups: {
            description: 'Specifies the order of the groups.',
            type: 'array',
            items: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              ],
            },
          },
          customGroups: {
            description: 'Specifies custom groups.',
            type: 'object',
            additionalProperties: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
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
      unexpectedDecoratorsGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedDecoratorsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
      specialCharacters: 'keep',
      partitionByComment: false,
      matcher: 'minimatch',
      groups: [],
      customGroups: {},
      sortOnClasses: true,
      sortOnMethods: true,
      sortOnAccessors: true,
      sortOnProperties: true,
      sortOnParameters: true,
    },
  ],
  create: context => {
    let settings = getSettings(context.settings)

    let options = complete(context.options.at(0), settings, {
      type: 'alphabetical',
      matcher: 'minimatch',
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
    } as const)

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
          options.matcher,
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
