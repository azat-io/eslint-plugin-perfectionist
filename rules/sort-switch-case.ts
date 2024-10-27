import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../typings'

import {
  specialCharactersJsonSchema,
  ignoreCaseJsonSchema,
  orderJsonSchema,
  typeJsonSchema,
} from '../utils/common-json-schemas'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getSourceCode } from '../utils/get-source-code'
import { rangeToDiff } from '../utils/range-to-diff'
import { getSettings } from '../utils/get-settings'
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
    specialCharacters: 'remove' | 'trim' | 'keep'
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

interface SortSwitchCaseSortingNode extends SortingNode<TSESTree.SwitchCase> {
  isDefaultClause: boolean
}

const defaultOptions: Required<Options[0]> = {
  type: 'alphabetical',
  ignoreCase: true,
  specialCharacters: 'keep',
  order: 'asc',
}

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
          type: typeJsonSchema,
          order: orderJsonSchema,
          ignoreCase: ignoreCaseJsonSchema,
          specialCharacters: specialCharactersJsonSchema,
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedSwitchCaseOrder:
        'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [defaultOptions],
  create: context => ({
    SwitchStatement: node => {
      let settings = getSettings(context.settings)

      let options = complete(context.options.at(0), settings, defaultOptions)

      let sourceCode = getSourceCode(context)

      let isDiscriminantTrue =
        node.discriminant.type === 'Literal' && node.discriminant.value === true
      let isCasesHasBreak = node.cases
        .filter(caseNode => caseNode.test !== null)
        .every(
          caseNode =>
            caseNode.consequent.length === 0 ||
            caseNode.consequent.some(
              currentConsequent =>
                currentConsequent.type === 'BreakStatement' ||
                currentConsequent.type === 'ReturnStatement' ||
                currentConsequent.type === 'BlockStatement',
            ),
        )

      if (!isDiscriminantTrue && isCasesHasBreak) {
        let nodes = node.cases.map<SortSwitchCaseSortingNode>(
          (caseNode: TSESTree.SwitchCase) => {
            let name: string
            let isDefaultClause = false
            if (caseNode.test?.type === 'Literal') {
              name = `${caseNode.test.value}`
            } else if (caseNode.test === null) {
              name = 'default'
              isDefaultClause = true
            } else {
              name = sourceCode.getText(caseNode.test)
            }

            return {
              size: rangeToDiff(caseNode.test ?? caseNode, sourceCode),
              node: caseNode,
              isDefaultClause,
              addSafetySemicolonWhenInline: true,
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

          let isGroupContainsDefault = (group: SortSwitchCaseSortingNode[]) =>
            group.some(currentNode => currentNode.isDefaultClause)

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
                let additionalFixes: TSESLint.RuleFix[] = []
                let nodeGroups = nodes.reduce<SortSwitchCaseSortingNode[][]>(
                  (
                    accumulator: SortSwitchCaseSortingNode[][],
                    currentNode: SortSwitchCaseSortingNode,
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
                    let sortedGroup = sortNodes(group, options).sort((a, b) => {
                      if (b.isDefaultClause) {
                        return -1
                      }
                      return 1
                    })

                    if (group.at(-1)!.name !== sortedGroup.at(-1)!.name) {
                      let consequentNodeIndex = sortedGroup.findIndex(
                        currentNode => currentNode.node.consequent.length !== 0,
                      )
                      let firstSortedNodeConsequent =
                        sortedGroup.at(consequentNodeIndex)!.node.consequent
                      let consequentStart = firstSortedNodeConsequent
                        .at(0)
                        ?.range.at(0)
                      let consequentEnd = firstSortedNodeConsequent
                        .at(-1)
                        ?.range.at(1)
                      let lastNode = group.at(-1)!.node

                      if (consequentStart && consequentEnd && lastNode.test) {
                        lastNode.range = [
                          lastNode.range.at(0)!,
                          lastNode.test.range.at(1)! + 1,
                        ]
                        additionalFixes.push(
                          ...makeFixes(fixer, group, sortedGroup, sourceCode),
                          fixer.removeRange([
                            lastNode.range.at(1)!,
                            consequentEnd,
                          ]),
                          fixer.insertTextAfter(
                            lastNode,
                            sourceCode.text.slice(
                              lastNode.range.at(1),
                              consequentEnd,
                            ),
                          ),
                        )
                      }
                    }

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
                  if (sortedNodes.at(i)!.isDefaultClause) {
                    sortedNodes.push(sortedNodes.splice(i, 1).at(0)!)
                  }
                }

                if (additionalFixes.length) {
                  return additionalFixes
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
