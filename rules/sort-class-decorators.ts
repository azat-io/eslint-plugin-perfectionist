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

type MESSAGE_ID =
  | 'unexpectedClassDecoratorsGroupOrder'
  | 'unexpectedClassDecoratorsOrder'

type Group<T extends string[]> = 'unknown' | T[number]

export type Options<T extends string[]> = [
  Partial<{
    customGroups: { [key in T[number]]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    groups: (Group<T>[] | Group<T>)[]
    matcher: 'minimatch' | 'regex'
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

type SortClassDecoratorsSortingNode = SortingNode<TSESTree.Decorator>

export default createEslintRule<Options<string[]>, MESSAGE_ID>({
  name: 'sort-class-decorators',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted class decorators.',
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
      unexpectedClassDecoratorsGroupOrder:
        'Expected "{{right}}" ({{rightGroup}}) to come before "{{left}}" ({{leftGroup}}).',
      unexpectedClassDecoratorsOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
      partitionByComment: false,
      matcher: 'minimatch',
      groups: [],
      customGroups: {},
    },
  ],
  create: context => ({
    ClassDeclaration: classDeclaration =>
      sortDecorators(
        context,
        'unexpectedClassDecoratorsOrder',
        'unexpectedClassDecoratorsGroupOrder',
        classDeclaration.decorators,
      ),
  }),
})

export let sortDecorators = <MessageIds extends string>(
  context: Readonly<RuleContext<MessageIds, Options<string[]>>>,
  errorMessageId: MessageIds,
  groupErrorMessageId: MessageIds,
  decorators: TSESTree.Decorator[],
) => {
  if (decorators.length < 2) {
    return
  }

  let settings = getSettings(context.settings)

  let options = complete(context.options.at(0), settings, {
    type: 'alphabetical',
    matcher: 'minimatch',
    ignoreCase: true,
    partitionByComment: false,
    customGroups: {},
    order: 'asc',
    groups: [],
  } as const)

  validateGroupsConfiguration(
    options.groups,
    ['unknown'],
    Object.keys(options.customGroups),
  )

  let sourceCode = getSourceCode(context)
  let partitionComment = options.partitionByComment

  let formattedMembers: SortClassDecoratorsSortingNode[][] = decorators.reduce(
    (accumulator: SortClassDecoratorsSortingNode[][], decorator) => {
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

      let sortingNode: SortClassDecoratorsSortingNode = {
        size: rangeToDiff(decorator.range),
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
      messageId: leftNum !== rightNum ? groupErrorMessageId : errorMessageId,
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
