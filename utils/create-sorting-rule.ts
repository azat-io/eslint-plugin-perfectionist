import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../typings'

import { getGroupNumber } from './get-group-number'
import { toSingleLine } from './to-single-line'
import { rangeToDiff } from './range-to-diff'
import { isPositive } from './is-positive'
import { sortNodes } from './sort-nodes'
import { makeFixes } from './make-fixes'
import { useGroups } from './use-groups'
import { pairwise } from './pairwise'
import { compare } from './compare'

interface ESLintNode {
  range: TSESTree.Node['range']
  loc: TSESTree.Node['loc']
  type: string
}

interface Options {
  'custom-groups'?: { [key: string]: string[] | string }
  type: 'alphabetical' | 'line-length' | 'natural'
  groups?: (string[] | string)[]
  'ignore-case': boolean
  order: 'desc' | 'asc'
}

interface SortingRule<Node extends ESLintNode, ErrorMessages extends string> {
  definedGroups?:
    | ((define: (value: string) => void, node: Node, name: string) => void)
    | null
  context: TSESLint.RuleContext<ErrorMessages, unknown[]>
  getName: (node: Node) => undefined | string
  unexpectedOrderMessage: ErrorMessages
  saveSameNameOrder?: boolean
  options: Options
  nodes: Node[]
}

export let createSortingRule = <
  Node extends ESLintNode,
  ErrorMessages extends string,
>({
  saveSameNameOrder = false,
  unexpectedOrderMessage,
  definedGroups = null,
  context,
  getName,
  options,
  nodes,
}: SortingRule<Node, ErrorMessages>) => {
  if (nodes.length > 1) {
    let sortingNodes: SortingNode<Node>[] = nodes.map((element: Node) => {
      let name =
        getName(element) ??
        context.sourceCode.text.slice(element.range.at(0), element.range.at(1))

      let { setCustomGroups, defineGroup, getGroup } = useGroups(options.groups)

      setCustomGroups(options['custom-groups'], name)

      definedGroups?.(defineGroup, element, name)

      return {
        size: rangeToDiff(element.range),
        group: getGroup(),
        node: element,
        name,
      }
    })

    pairwise(sortingNodes, (left, right) => {
      let leftNum = getGroupNumber(options.groups, left)
      let rightNum = getGroupNumber(options.groups, right)
      let hasDifferentNames = true

      if (saveSameNameOrder) {
        hasDifferentNames = left.name !== right.name
      }

      if (
        hasDifferentNames &&
        (leftNum > rightNum ||
          (leftNum === rightNum && isPositive(compare(left, right, options))))
      ) {
        context.report({
          fix: fixer => {
            let grouped: {
              [key: string]: SortingNode<Node>[]
            } = {}

            for (let currentNode of sortingNodes) {
              let groupNum = getGroupNumber(options.groups, currentNode)

              if (!(groupNum in grouped)) {
                grouped[groupNum] = [currentNode]
              } else {
                grouped[groupNum] = sortNodes(
                  [...grouped[groupNum], currentNode],
                  options,
                )
              }
            }

            let sortedNodes: SortingNode<Node>[] = []

            for (let group of Object.keys(grouped).sort(
              (a, b) => Number(a) - Number(b),
            )) {
              sortedNodes.push(...sortNodes(grouped[group], options))
            }

            return makeFixes(
              fixer,
              sortingNodes,
              sortedNodes,
              context.sourceCode,
            )
          },
          data: {
            right: toSingleLine(right.name),
            left: toSingleLine(left.name),
          },
          node: right.node as unknown as TSESTree.Node,
          messageId: unexpectedOrderMessage,
        })
      }
    })
  }
}
