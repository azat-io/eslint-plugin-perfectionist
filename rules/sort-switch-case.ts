import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

import { createEslintRule } from '../utils/create-eslint-rule'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { isPositive } from '../utils/is-positive'
import { makeFixes } from '../utils/make-fixes'
import { sortNodes } from '../utils/sort-nodes'
import { pairwise } from '../utils/pairwise'
import { complete } from '../utils/complete'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedSwitchCaseOrder'

type Options = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-switch-case',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted switch cases.',
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
          ignoreCase: {
            description:
              'Controls whether sorting should be case-sensitive or not.',
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedSwitchCaseOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
    },
  ],
  create: context => ({
    SwitchStatement: node => {
      let options = complete(context.options.at(0), {
        type: 'alphabetical',
        ignoreCase: true,
        order: 'asc',
      } as const)

      let sourceCode = getSourceCode(context)

      let isDiscriminantIdentifier = node.discriminant.type === 'Identifier'
      let isCasesHasBreak = node.cases
        .filter(caseNode => caseNode.test !== null)
        .every(
          caseNode =>
            caseNode.consequent.length === 0 ||
            caseNode.consequent.some(
              currentConsequent =>
                currentConsequent.type === 'BreakStatement' ||
                currentConsequent.type === 'ReturnStatement',
            ),
        )

      if (isDiscriminantIdentifier && isCasesHasBreak) {
        let nodes = node.cases.map<SortingNode<TSESTree.SwitchCase>>(
          (caseNode: TSESTree.SwitchCase) => {
            let name: string
            if (caseNode.test?.type === 'Literal') {
              name = `${caseNode.test.value}`
            } else if (caseNode.test === null) {
              name = 'default'
            } else {
              name = sourceCode.text.slice(...caseNode.test.range)
            }

            return {
              size: rangeToDiff(caseNode.test?.range ?? caseNode.range),
              node: structuredClone(caseNode),
              name,
            }
          },
        )

        pairwise(nodes, (left, right, iteration) => {
          let compareValue: boolean
          let lefter = nodes.at(iteration - 1)
          let isCaseGrouped =
            lefter?.node.consequent.length === 0 &&
            left.node.consequent.length !== 0

          let isGroupContainsDefault = (group: SortingNode[]) =>
            group.some(currentNode => currentNode.name === 'default')

          let leftCaseGroup = [left]
          let rightCaseGroup = [right]
          for (let i = iteration - 1; i >= 0; i--) {
            if (nodes.at(i)!.node.consequent.length === 0) {
              leftCaseGroup.unshift(nodes.at(i)!)
            } else {
              break
            }
          }
          if (right.node.consequent.length === 0) {
            for (let i = iteration + 1; i < nodes.length; i++) {
              if (nodes.at(i)!.node.consequent.length === 0) {
                rightCaseGroup.push(nodes.at(i)!)
              } else {
                rightCaseGroup.push(nodes.at(i)!)
                break
              }
            }
          }

          if (isGroupContainsDefault(leftCaseGroup)) {
            compareValue = true
          } else if (isGroupContainsDefault(rightCaseGroup)) {
            compareValue = false
          } else if (isCaseGrouped) {
            compareValue = isPositive(compare(leftCaseGroup[0], right, options))
          } else {
            compareValue = isPositive(compare(left, right, options))
          }

          if (compareValue) {
            context.report({
              messageId: 'unexpectedSwitchCaseOrder',
              data: {
                left: left.name,
                right: right.name,
              },
              node: right.node,
              fix: fixer => {
                let nodeGroups = nodes.reduce<
                  SortingNode<TSESTree.SwitchCase>[][]
                >(
                  (
                    accumulator: SortingNode<TSESTree.SwitchCase>[][],
                    currentNode: SortingNode<TSESTree.SwitchCase>,
                    index,
                  ) => {
                    if (index === 0) {
                      accumulator.at(-1)!.push(currentNode)
                    } else if (
                      accumulator.at(-1)!.at(-1)?.node.consequent.length === 0
                    ) {
                      accumulator.at(-1)!.push(currentNode)
                    } else {
                      accumulator.push([currentNode])
                    }
                    return accumulator
                  },
                  [[]],
                )

                let sortedNodeGroups = nodeGroups
                  .map(group => {
                    let { consequent } = group.at(-1)!.node
                    group.at(-1)!.node.consequent = []
                    let sortedGroup = sortNodes(group, options)
                    sortedGroup.at(-1)!.node.consequent = consequent
                    return sortedGroup
                  })
                  .sort((a, b) => {
                    if (isGroupContainsDefault(a)) {
                      return 1
                    } else if (isGroupContainsDefault(b)) {
                      return -1
                    }
                    return compare(a.at(0)!, b.at(0)!, options)
                  })

                let sortedNodes = sortedNodeGroups.flat()

                for (let max = sortedNodes.length, i = 0; i < max; i++) {
                  if (sortedNodes.at(i)!.name === 'default') {
                    sortedNodes.push(sortedNodes.splice(i, 1).at(0)!)
                  }
                }

                return makeFixes(fixer, nodes, sortedNodes, sourceCode)
              },
            })
          }
        })
      }
    },
  }),
})
