import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../typings'

import { isPartitionComment } from '../utils/is-partition-comment'
import { getCommentBefore } from '../utils/get-comment-before'
import { createEslintRule } from '../utils/create-eslint-rule'
import { getGroupNumber } from '../utils/get-group-number'
import { getSourceCode } from '../utils/get-source-code'
import { toSingleLine } from '../utils/to-single-line'
import { rangeToDiff } from '../utils/range-to-diff'
import { isPositive } from '../utils/is-positive'
import { useGroups } from '../utils/use-groups'
import { sortNodes } from '../utils/sort-nodes'
import { makeFixes } from '../utils/make-fixes'
import { complete } from '../utils/complete'
import { pairwise } from '../utils/pairwise'
import { compare } from '../utils/compare'

type MESSAGE_ID = 'unexpectedClassesOrder'

type Group = OfficialGroup | 'unknown' | string

type OfficialGroup =
  | 'protected-abstract-readonly-decorated-property'
  | 'static-protected-readonly-decorated-property'
  | 'public-abstract-readonly-decorated-property'
  | 'static-private-readonly-decorated-property'
  | 'static-public-readonly-decorated-property'
  | 'protected-abstract-decorated-set-method'
  | 'protected-abstract-decorated-get-method'
  | 'static-protected-decorated-get-method'
  | 'static-protected-decorated-set-method'
  | 'protected-decorated-accessor-property'
  | 'protected-abstract-decorated-property'
  | 'protected-readonly-decorated-property'
  | 'protected-abstract-readonly-property'
  | 'public-abstract-decorated-set-method'
  | 'public-abstract-decorated-get-method'
  | 'abstract-readonly-decorated-property'
  | 'static-private-decorated-get-method'
  | 'static-private-decorated-set-method'
  | 'private-decorated-accessor-property'
  | 'static-protected-decorated-property'
  | 'protected-abstract-decorated-method'
  | 'private-readonly-decorated-property'
  | 'static-protected-readonly-property'
  | 'static-readonly-decorated-property'
  | 'static-public-decorated-get-method'
  | 'static-public-decorated-set-method'
  | 'public-abstract-decorated-property'
  | 'public-readonly-decorated-property'
  | 'static-protected-decorated-method'
  | 'public-abstract-readonly-property'
  | 'static-private-decorated-property'
  | 'static-public-decorated-property'
  | 'static-private-readonly-property'
  | 'public-abstract-decorated-method'
  | 'static-private-decorated-method'
  | 'static-public-readonly-property'
  | 'static-public-decorated-method'
  | 'protected-decorated-get-method'
  | 'protected-decorated-set-method'
  | 'protected-abstract-get-method'
  | 'protected-abstract-set-method'
  | 'abstract-decorated-get-method'
  | 'abstract-decorated-set-method'
  | 'protected-decorated-property'
  | 'private-decorated-get-method'
  | 'private-decorated-set-method'
  | 'static-decorated-get-method'
  | 'static-decorated-set-method'
  | 'readonly-decorated-property'
  | 'decorated-accessor-property'
  | 'protected-abstract-property'
  | 'static-protected-get-method'
  | 'static-protected-set-method'
  | 'protected-readonly-property'
  | 'public-decorated-get-method'
  | 'public-decorated-set-method'
  | 'abstract-decorated-property'
  | 'private-decorated-property'
  | 'public-abstract-get-method'
  | 'public-abstract-set-method'
  | 'abstract-readonly-property'
  | 'protected-decorated-method'
  | 'abstract-decorated-method'
  | 'static-protected-property'
  | 'protected-abstract-method'
  | 'static-private-get-method'
  | 'static-private-set-method'
  | 'private-readonly-property'
  | 'public-decorated-property'
  | 'static-decorated-property'
  | 'public-abstract-property'
  | 'static-public-get-method'
  | 'static-public-set-method'
  | 'static-readonly-property'
  | 'public-readonly-property'
  | 'private-decorated-method'
  | 'static-decorated-method'
  | 'static-private-property'
  | 'static-protected-method'
  | 'public-decorated-method'
  | 'static-public-property'
  | 'public-abstract-method'
  | 'protected-constructor'
  | 'static-private-method'
  | 'decorated-get-method'
  | 'decorated-set-method'
  | 'static-public-method'
  | 'protected-get-method'
  | 'protected-set-method'
  | 'private-constructor'
  | 'abstract-get-method'
  | 'abstract-set-method'
  | 'public-constructor'
  | 'protected-property'
  | 'decorated-property'
  | 'private-get-method'
  | 'private-set-method'
  | 'abstract-property'
  | 'public-get-method'
  | 'public-set-method'
  | 'static-get-method'
  | 'static-set-method'
  | 'readonly-property'
  | 'decorated-method'
  | 'private-property'
  | 'protected-method'
  | 'static-property'
  | 'public-property'
  | 'abstract-method'
  | 'index-signature'
  | 'private-method'
  | 'static-method'
  | 'public-method'
  | 'constructor'
  | 'get-method'
  | 'set-method'
  | 'property'
  | 'method'

type Options = [
  Partial<{
    customGroups: { [key: string]: string[] | string }
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    groups: (Group[] | Group)[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export default createEslintRule<Options, MESSAGE_ID>({
  name: 'sort-classes',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce sorted classes.',
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
          partitionByComment: {
            description:
              'Allows to use comments to separate the nodes into logical groups.',
            anyOf: [
              {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              {
                type: 'boolean',
              },
              {
                type: 'string',
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
      unexpectedClassesOrder: 'Expected "{{right}}" to come before "{{left}}".',
    },
  },
  defaultOptions: [
    {
      type: 'alphabetical',
      order: 'asc',
      ignoreCase: true,
      partitionByComment: false,
      groups: [
        'index-signature',
        'static-property',
        'protected-property',
        'private-property',
        'property',
        'constructor',
        'static-method',
        'protected-method',
        'private-method',
        'method',
        ['get-method', 'set-method'],
        'unknown',
      ],
      customGroups: {},
    },
  ],
  create: context => ({
    ClassBody: node => {
      if (node.body.length > 1) {
        let options = complete(context.options.at(0), {
          groups: [
            'index-signature',
            'static-property',
            'protected-property',
            'private-property',
            'property',
            'constructor',
            'static-method',
            'protected-method',
            'private-method',
            'method',
            ['get-method', 'set-method'],
            'unknown',
          ],
          partitionByComment: false,
          type: 'alphabetical',
          ignoreCase: true,
          customGroups: {},
          order: 'asc',
        } as const)

        let sourceCode = getSourceCode(context)

        let extractDependencies = (
          expression: TSESTree.Expression,
        ): string[] => {
          let dependencies: string[] = []

          let checkNode = (nodeValue: TSESTree.Node) => {
            if (
              nodeValue.type === 'MemberExpression' &&
              nodeValue.object.type === 'ThisExpression' &&
              nodeValue.property.type === 'Identifier'
            ) {
              dependencies.push(nodeValue.property.name)
            }

            if ('body' in nodeValue && nodeValue.body) {
              traverseNode(nodeValue.body)
            }

            if ('left' in nodeValue) {
              traverseNode(nodeValue.left)
            }

            if ('right' in nodeValue) {
              traverseNode(nodeValue.right)
            }

            if ('elements' in nodeValue) {
              nodeValue.elements
                .filter(currentNode => currentNode !== null)
                .forEach(traverseNode)
            }

            if ('arguments' in nodeValue) {
              nodeValue.arguments.forEach(traverseNode)
            }
          }

          let traverseNode = (nodeValue: TSESTree.Node[] | TSESTree.Node) => {
            if (Array.isArray(nodeValue)) {
              nodeValue.forEach(traverseNode)
            } else {
              checkNode(nodeValue)
            }
          }

          traverseNode(expression)
          return dependencies
        }

        let formattedNodes: SortingNode[][] = node.body.reduce(
          (accumulator: SortingNode[][], member) => {
            let comment = getCommentBefore(member, sourceCode)

            if (
              options.partitionByComment &&
              comment &&
              isPartitionComment(options.partitionByComment, comment.value)
            ) {
              accumulator.push([])
            }

            let name: string
            let dependencies: string[] = []
            let { getGroup, defineGroup, setCustomGroups } = useGroups(
              options.groups,
            )

            if (member.type === 'StaticBlock') {
              name = 'static'
            } else if (member.type === 'TSIndexSignature') {
              name = sourceCode.text.slice(
                member.range.at(0),
                member.typeAnnotation?.range.at(0) ?? member.range.at(1),
              )
            } else {
              if (member.key.type === 'Identifier') {
                ;({ name } = member.key)
              } else {
                name = sourceCode.text.slice(...member.key.range)
              }
            }

            let isPrivateName = name.startsWith('_') || name.startsWith('#')
            let decorated =
              'decorators' in member && member.decorators.length > 0
            let memberGroups: OfficialGroup[] = []

            // Methods
            if (
              member.type === 'MethodDefinition' ||
              member.type === 'TSAbstractMethodDefinition'
            ) {
              let isProtectedMethod = member.accessibility === 'protected'
              let isPrivateMethod =
                member.accessibility === 'private' || isPrivateName
              let isStaticMethod = member.static
              let isAbstractMethod =
                member.type === 'TSAbstractMethodDefinition'
              let isGetMethod = member.kind === 'get'
              let isSetMethod = member.kind === 'set'

              if (member.kind === 'constructor') {
                if (isProtectedMethod) {
                  memberGroups.push('protected-constructor')
                } else if (isPrivateMethod) {
                  memberGroups.push('private-constructor')
                } else {
                  memberGroups.push('public-constructor')
                }
                memberGroups.push('constructor')
              }

              if (isStaticMethod) {
                if (isPrivateMethod) {
                  if (isGetMethod) {
                    if (decorated) {
                      memberGroups.push('static-private-decorated-get-method')
                    }
                    memberGroups.push('static-private-get-method')
                  } else if (isSetMethod) {
                    if (decorated) {
                      memberGroups.push('static-private-decorated-set-method')
                    }
                    memberGroups.push('static-private-set-method')
                  }
                  if (decorated) {
                    memberGroups.push('static-private-decorated-method')
                  }
                  memberGroups.push('static-private-method')
                } else if (isProtectedMethod) {
                  if (isGetMethod) {
                    if (decorated) {
                      memberGroups.push('static-protected-decorated-get-method')
                    }
                    memberGroups.push('static-protected-get-method')
                  } else if (isSetMethod) {
                    if (decorated) {
                      memberGroups.push('static-protected-decorated-set-method')
                    }
                    memberGroups.push('static-protected-set-method')
                  }
                  if (decorated) {
                    memberGroups.push('static-protected-decorated-method')
                  }
                  memberGroups.push('static-protected-method')
                } else {
                  // Public static methods
                  if (isGetMethod) {
                    if (decorated) {
                      memberGroups.push('static-public-decorated-get-method')
                    }
                    memberGroups.push('static-public-get-method')
                  } else if (isSetMethod) {
                    if (decorated) {
                      memberGroups.push('static-public-decorated-set-method')
                    }
                    memberGroups.push('static-public-set-method')
                  }
                  if (decorated) {
                    memberGroups.push('static-public-decorated-method')
                  }
                  memberGroups.push('static-public-method')
                }
                if (isGetMethod) {
                  if (decorated) {
                    memberGroups.push('static-decorated-get-method')
                  }
                  memberGroups.push('static-get-method')
                }
                if (isSetMethod) {
                  if (decorated) {
                    memberGroups.push('static-decorated-set-method')
                  }
                  memberGroups.push('static-set-method')
                }
                if (decorated) {
                  memberGroups.push('static-decorated-method')
                }
                memberGroups.push('static-method')
              } else {
                // Non-static methods
                if (isAbstractMethod) {
                  // Abstract methods can not be private
                  if (isProtectedMethod) {
                    if (isGetMethod) {
                      if (decorated) {
                        memberGroups.push(
                          'protected-abstract-decorated-get-method',
                        )
                      }
                      memberGroups.push('protected-abstract-get-method')
                    } else if (isSetMethod) {
                      if (decorated) {
                        memberGroups.push(
                          'protected-abstract-decorated-set-method',
                        )
                      }
                      memberGroups.push('protected-abstract-set-method')
                    }
                    if (decorated) {
                      memberGroups.push('protected-abstract-decorated-method')
                    }
                    memberGroups.push('protected-abstract-method')
                  } else {
                    // Public abstract methods
                    if (isGetMethod) {
                      if (decorated) {
                        memberGroups.push(
                          'public-abstract-decorated-get-method',
                        )
                      }
                      memberGroups.push('public-abstract-get-method')
                    } else if (isSetMethod) {
                      if (decorated) {
                        memberGroups.push(
                          'public-abstract-decorated-set-method',
                        )
                      }
                      memberGroups.push('public-abstract-set-method')
                    }
                    if (decorated) {
                      memberGroups.push('public-abstract-decorated-method')
                    }
                    memberGroups.push('public-abstract-method')
                  }
                  if (isGetMethod) {
                    if (decorated) {
                      memberGroups.push('abstract-decorated-get-method')
                    }
                    memberGroups.push('abstract-get-method')
                  } else if (isSetMethod) {
                    if (decorated) {
                      memberGroups.push('abstract-decorated-set-method')
                    }
                    memberGroups.push('abstract-set-method')
                  }
                  if (decorated) {
                    memberGroups.push('abstract-decorated-method')
                  }
                  memberGroups.push('abstract-method')
                } else {
                  // Non-abstract methods
                  if (isPrivateMethod) {
                    if (isGetMethod) {
                      if (decorated) {
                        memberGroups.push('private-decorated-get-method')
                      }
                      memberGroups.push('private-get-method')
                    } else if (isSetMethod) {
                      if (decorated) {
                        memberGroups.push('private-decorated-set-method')
                      }
                      memberGroups.push('private-set-method')
                    }
                    if (decorated) {
                      memberGroups.push('private-decorated-method')
                    }
                    memberGroups.push('private-method')
                  } else if (isProtectedMethod) {
                    if (isGetMethod) {
                      if (decorated) {
                        memberGroups.push('protected-decorated-get-method')
                      }
                      memberGroups.push('protected-get-method')
                    } else if (isSetMethod) {
                      if (decorated) {
                        memberGroups.push('protected-decorated-set-method')
                      }
                      memberGroups.push('protected-set-method')
                    }
                    if (decorated) {
                      memberGroups.push('protected-decorated-method')
                    }
                    memberGroups.push('protected-method')
                  } else {
                    if (isGetMethod) {
                      if (decorated) {
                        memberGroups.push('public-decorated-get-method')
                      }
                      memberGroups.push('public-get-method')
                    } else if (isSetMethod) {
                      if (decorated) {
                        memberGroups.push('public-decorated-set-method')
                      }
                      memberGroups.push('public-set-method')
                    }
                    if (decorated) {
                      memberGroups.push('public-decorated-method')
                    }
                    memberGroups.push('public-method')
                  }
                  if (isGetMethod) {
                    if (decorated) {
                      memberGroups.push('decorated-get-method')
                    }
                    memberGroups.push('get-method')
                  } else if (isSetMethod) {
                    if (decorated) {
                      memberGroups.push('decorated-set-method')
                    }
                    memberGroups.push('set-method')
                  }
                  if (decorated) {
                    memberGroups.push('decorated-method')
                  }
                  memberGroups.push('method')
                }
              }
            } else if (member.type === 'TSIndexSignature') {
              memberGroups.push('index-signature')
            } else if (member.type === 'AccessorProperty') {
              if (decorated) {
                if (member.accessibility === 'protected') {
                  memberGroups.push('protected-decorated-accessor-property')
                }

                if (member.accessibility === 'private' || isPrivateName) {
                  memberGroups.push('private-decorated-accessor-property')
                }

                memberGroups.push('decorated-accessor-property')
              }
            } else if (
              member.type === 'PropertyDefinition' ||
              member.type === 'TSAbstractPropertyDefinition'
            ) {
              // Properties
              let isProtectedProperty = member.accessibility === 'protected'
              let isPrivateProperty =
                member.accessibility === 'private' || isPrivateName
              let isStaticProperty = member.static
              let isAbstractProperty =
                member.type === 'TSAbstractPropertyDefinition'
              let isReadonly = member.readonly

              if (isStaticProperty) {
                if (isPrivateProperty) {
                  if (isReadonly) {
                    if (decorated) {
                      memberGroups.push(
                        'static-private-readonly-decorated-property',
                      )
                    }
                    memberGroups.push('static-private-readonly-property')
                  }
                  if (decorated) {
                    memberGroups.push('static-private-decorated-property')
                  }
                  memberGroups.push('static-private-property')
                } else if (isProtectedProperty) {
                  if (isReadonly) {
                    if (decorated) {
                      memberGroups.push(
                        'static-protected-readonly-decorated-property',
                      )
                    }
                    memberGroups.push('static-protected-readonly-property')
                  }
                  if (decorated) {
                    memberGroups.push('static-protected-decorated-property')
                  }
                  memberGroups.push('static-protected-property')
                } else {
                  if (isReadonly) {
                    if (decorated) {
                      memberGroups.push(
                        'static-public-readonly-decorated-property',
                      )
                    }
                    memberGroups.push('static-public-readonly-property')
                  }
                  if (decorated) {
                    memberGroups.push('static-public-decorated-property')
                  }
                  memberGroups.push('static-public-property')
                }
                if (isReadonly) {
                  if (decorated) {
                    memberGroups.push('static-readonly-decorated-property')
                  }
                  memberGroups.push('static-readonly-property')
                }
                if (decorated) {
                  memberGroups.push('static-decorated-property')
                }
                memberGroups.push('static-property')
              } else {
                // Non-static properties
                if (isAbstractProperty) {
                  // Private properties can not be abstract
                  if (isProtectedProperty) {
                    if (isReadonly) {
                      if (decorated) {
                        memberGroups.push(
                          'protected-abstract-readonly-decorated-property',
                        )
                      }
                      memberGroups.push('protected-abstract-readonly-property')
                    }
                    if (decorated) {
                      memberGroups.push('protected-abstract-decorated-property')
                    }
                    memberGroups.push('protected-abstract-property')
                  } else {
                    if (isReadonly) {
                      if (decorated) {
                        memberGroups.push(
                          'public-abstract-readonly-decorated-property',
                        )
                      }
                      memberGroups.push('public-abstract-readonly-property')
                    }
                    if (decorated) {
                      memberGroups.push('public-abstract-decorated-property')
                    }
                    memberGroups.push('public-abstract-property')
                  }
                  if (isReadonly) {
                    if (decorated) {
                      memberGroups.push('abstract-readonly-decorated-property')
                    }
                    memberGroups.push('abstract-readonly-property')
                  }
                  if (decorated) {
                    memberGroups.push('abstract-decorated-property')
                  }
                  memberGroups.push('abstract-property')
                } else {
                  // Non-abstract
                  if (isPrivateProperty) {
                    if (isReadonly) {
                      if (decorated) {
                        memberGroups.push('private-readonly-decorated-property')
                      }
                      memberGroups.push('private-readonly-property')
                    }
                    if (decorated) {
                      memberGroups.push('private-decorated-property')
                    }
                    memberGroups.push('private-property')
                  } else if (isProtectedProperty) {
                    if (isReadonly) {
                      if (decorated) {
                        memberGroups.push(
                          'protected-readonly-decorated-property',
                        )
                      }
                      memberGroups.push('protected-readonly-property')
                    }
                    if (decorated) {
                      memberGroups.push('protected-decorated-property')
                    }
                    memberGroups.push('protected-property')
                  } else {
                    if (isReadonly) {
                      if (decorated) {
                        memberGroups.push('public-readonly-decorated-property')
                      }
                      memberGroups.push('public-readonly-property')
                    }
                    if (decorated) {
                      memberGroups.push('public-decorated-property')
                    }
                    memberGroups.push('public-property')
                  }
                  if (isReadonly) {
                    if (decorated) {
                      memberGroups.push('readonly-decorated-property')
                    }
                    memberGroups.push('readonly-property')
                  }
                  if (decorated) {
                    memberGroups.push('decorated-property')
                  }
                  memberGroups.push('property')
                }
              }
            }
            for (let memberGroup of memberGroups) {
              defineGroup(memberGroup)
            }

            setCustomGroups(options.customGroups, name, {
              override: true,
            })

            if (member.type === 'PropertyDefinition' && member.value) {
              dependencies = extractDependencies(member.value)
            }

            let value = {
              size: rangeToDiff(member.range),
              node: structuredClone(member),
              group: getGroup(),
              dependencies,
              name,
            }

            accumulator.at(-1)!.push(value)

            return accumulator
          },
          [[]],
        )

        for (let nodes of formattedNodes) {
          pairwise(nodes, (left, right) => {
            let leftNum = getGroupNumber(options.groups, left)
            let rightNum = getGroupNumber(options.groups, right)

            if (
              left.name !== right.name &&
              (leftNum > rightNum ||
                (leftNum === rightNum &&
                  isPositive(compare(left, right, options))))
            ) {
              context.report({
                messageId: 'unexpectedClassesOrder',
                data: {
                  left: toSingleLine(left.name),
                  right: toSingleLine(right.name),
                },
                node: right.node,
                fix: (fixer: TSESLint.RuleFixer) => {
                  let grouped = nodes.reduce(
                    (
                      accumulator: {
                        [key: string]: SortingNode[]
                      },
                      sortingNode,
                    ) => {
                      let groupNum = getGroupNumber(options.groups, sortingNode)

                      if (!(groupNum in accumulator)) {
                        accumulator[groupNum] = [sortingNode]
                      } else {
                        accumulator[groupNum] = sortNodes(
                          [...accumulator[groupNum], sortingNode],
                          options,
                        )
                      }

                      return accumulator
                    },
                    {},
                  )

                  let sortedNodes: SortingNode[] = []

                  for (let group of Object.keys(grouped).sort(
                    (a, b) => Number(a) - Number(b),
                  )) {
                    sortedNodes.push(...sortNodes(grouped[group], options))
                  }

                  return makeFixes(fixer, nodes, sortedNodes, sourceCode, {
                    partitionComment: options.partitionByComment,
                  })
                },
              })
            }
          })
        }
      }
    },
  }),
})
