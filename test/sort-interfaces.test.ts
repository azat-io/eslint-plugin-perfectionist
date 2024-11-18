import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import type { Options } from '../rules/sort-interfaces'

import rule from '../rules/sort-interfaces'

let ruleName = 'sort-interfaces'

describe(ruleName, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester()

  describe(`${ruleName}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    let options: Options<string[]>[0] = {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          output: dedent`
            interface Interface {
              a: string
              b: 'b1' | 'b2',
              c: string
            }
          `,
          code: dedent`
            interface Interface {
              a: string
              c: string
              b: 'b1' | 'b2',
            }
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            interface Interface {
              a: string
            }
          `,
          options: [options],
        },
        {
          code: dedent`
            interface Interface {
              a: string
              b: 'b1' | 'b2',
              c: string
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with ts index signature`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '[key in Object]',
                  left: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                [key in Object]: string
                a: 'a'
              }
            `,
            code: dedent`
              interface Interface {
                a: 'a'
                [key in Object]: string
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                [key in Object]: string
                a: 'a'
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts multi-word keys by value`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'b-b',
                  right: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  left: 'd-d',
                  right: 'c',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                a: Value
                'b-b': string
                c: string
                'd-d': string
              }
            `,
            code: dedent`
              interface Interface {
                'b-b': string
                a: Value
                'd-d': string
                c: string
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                a: Value
                'b-b': string
                c: string
                'd-d': string
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with typescript index signature`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '[key: string]',
                  left: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                [key: string]: string
                a: string
                b: string
              }
            `,
            code: dedent`
              interface Interface {
                a: string
                [key: string]: string
                b: string
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                [key: string]: string
                a: string
                b: string
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with method and construct signatures`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'c()',
                  right: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  left: 'e()',
                  right: 'd',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                a: number
                b: () => void
                c(): number
                d: string
                e()
              }
            `,
            code: dedent`
              interface Interface {
                c(): number
                a: number
                b: () => void
                e()
                d: string
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                a: number
                b: () => void
                c(): number
                d: string
                e()
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with empty properties with empty values`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '[...other]',
                  left: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  right: '[v in V]',
                  left: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                [...other]
                [d in D]
                [v in V]?
                a: 10 | 20 | 30
                b: string
              }
            `,
            code: dedent`
              interface Interface {
                [d in D]
                a: 10 | 20 | 30
                [...other]
                b: string
                [v in V]?
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                [...other]
                [d in D]
                [v in V]?
                a: 10 | 20 | 30
                b: string
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break interface docs`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  right: 'c',
                  left: 'd',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                /**
                 * Comment A
                 */
                a: string
                /**
                 * Comment B
                 */
                b: Array
                /* Comment C */
                c: string | number
                // Comment D
                d: string
              }
            `,
            code: dedent`
              interface Interface {
                /**
                 * Comment B
                 */
                b: Array
                /**
                 * Comment A
                 */
                a: string
                // Comment D
                d: string
                /* Comment C */
                c: string | number
              }
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with comments on the same line`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                a: string | number // Comment A
                b: string // Comment B
              }
            `,
            code: dedent`
              interface Interface {
                b: string // Comment B
                a: string | number // Comment A
              }
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with semi and comments on the same line`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                a: 'aaa'; // Comment A
                b: 'b'; // Comment B
              }
            `,
            code: dedent`
              interface Interface {
                b: 'b'; // Comment B
                a: 'aaa'; // Comment A
              }
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): not sorts call signature declarations`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface Interface {
                <Parameters extends Record<string, number | string>>(
                  input: AFunction<[Parameters], string>
                ): Alternatives<Parameters>
                <A extends CountA>(input: Input): AFunction<
                  [number],
                  A[keyof A]
                >
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'multiline',
                  leftGroup: 'unknown',
                  right: 'd',
                  left: 'c',
                },
                messageId: 'unexpectedInterfacePropertiesGroupOrder',
              },
              {
                data: {
                  leftGroup: 'multiline',
                  rightGroup: 'g',
                  right: 'g',
                  left: 'd',
                },
                messageId: 'unexpectedInterfacePropertiesGroupOrder',
              },
            ],
            output: dedent`
              interface Interface {
                g: 'g'
                d: {
                  e: 'e'
                  f: 'f'
                }
                a: 'aaa'
                b: 'bb'
                c: 'c'
              }
            `,
            code: dedent`
              interface Interface {
                a: 'aaa'
                b: 'bb'
                c: 'c'
                d: {
                  e: 'e'
                  f: 'f'
                }
                g: 'g'
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  g: 'g',
                },
                groups: ['g', 'multiline', 'unknown'],
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                g: 'g'
                d: {
                  e: 'e'
                  f: 'f'
                }
                a: 'aaa'
                b: 'bb'
                c: 'c'
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  g: 'g',
                },
                groups: ['g', 'multiline', 'unknown'],
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex for custom groups`,
      rule,
      {
        valid: [
          {
            options: [
              {
                ...options,
                customGroups: {
                  elementsWithoutFoo: '^(?!.*Foo).*$',
                },
                groups: ['unknown', 'elementsWithoutFoo'],
              },
            ],
            code: dedent`
              interface Interface {
                  iHaveFooInMyName: string
                  meTooIHaveFoo: string
                  a: string
                  b: string
              }
            `,
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'e',
                  left: 'f',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  right: 'c',
                  left: 'd',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                e: 'eee'
                f: 'ff'
                g: 'g'

                a: 'aaa'

                b?: 'bbb'
                c: 'cc'
                d: 'd'
              }
            `,
            code: dedent`
              interface Interface {
                f: 'ff'
                e: 'eee'
                g: 'g'

                a: 'aaa'

                b?: 'bbb'
                d: 'd'
                c: 'cc'
              }
            `,
            options: [
              {
                ...options,
                partitionByNewLine: true,
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                e: 'eee'
                f: 'ff'
                g: 'g'

                a: 'aaa'

                b?: 'bbb'
                c: 'cc'
                d: 'd'
              }
            `,
            options: [
              {
                ...options,
                partitionByNewLine: true,
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
      invalid: [
        {
          output: dedent`
              interface Interface {
                a?: string
                c?: string
                d?: string
                e?(): void
                b: string
              }
            `,
          code: dedent`
              interface Interface {
                a?: string
                b: string
                c?: string
                d?: string
                e?(): void
              }
            `,
          errors: [
            {
              data: {
                right: 'c',
                left: 'b',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          options: [
            {
              ...options,
              groupKind: 'optional-first',
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
              interface Interface {
                a?: string
                [index: number]: string
              }
            `,
          options: [
            {
              ...options,
              groupKind: 'optional-first',
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'unknown',
                  leftGroup: 'last',
                  right: 'b',
                  left: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesGroupOrder',
              },
              {
                data: {
                  right: 'c',
                  left: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            options: [
              {
                ...options,
                customGroups: {
                  last: 'a',
                },
                groups: ['unknown', 'last'],
                groupKind: 'optional-first',
              },
            ],
            output: dedent`
              interface Interface {
                c?: string
                d?: string
                b: string
                e: string
                a: string
              }
            `,
            code: dedent`
              interface Interface {
                a: string
                b: string
                c?: string
                d?: string
                e: string
              }
            `,
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use partition comments`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              interface MyInterface {
                // Part: A
                // Not partition comment
                bbb: string;
                cc: string;
                d: string;
                // Part: B
                aaaa: string;
                e: string;
                // Part: C
                // Not partition comment
                fff: string;
                'gg': string;
              }
            `,
            code: dedent`
              interface MyInterface {
                // Part: A
                cc: string;
                d: string;
                // Not partition comment
                bbb: string;
                // Part: B
                aaaa: string;
                e: string;
                // Part: C
                'gg': string;
                // Not partition comment
                fff: string;
              }
            `,
            errors: [
              {
                data: {
                  right: 'bbb',
                  left: 'd',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  right: 'fff',
                  left: 'gg',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: '^Part*',
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use all comments as parts`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface MyInterface {
                // Comment
                bb: string;
                // Other comment
                a: string;
              }
            `,
            options: [
              {
                ...options,
                partitionByComment: true,
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use multiple partition comments`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              interface MyInterface {
                /* Partition Comment */
                // Part: A
                d: string;
                // Part: B
                aaa: string;
                bb: string;
                c: string;
                /* Other */
                e: string;
              }
            `,
            code: dedent`
              interface MyInterface {
                /* Partition Comment */
                // Part: A
                d: string;
                // Part: B
                aaa: string;
                c: string;
                bb: string;
                /* Other */
                e: string;
              }
            `,
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex for partition comments`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface MyInterface {
                e: string,
                f: string,
                // I am a partition comment because I don't have f o o
                a: string,
                b: string,
              }
            `,
            options: [
              {
                ...options,
                partitionByComment: ['^(?!.*foo).*$'],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface MyInterface {
                _a: string
                b: string
                _c: string
              }
            `,
            options: [
              {
                ...options,
                specialCharacters: 'trim',
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to remove special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface MyInterface {
                ab: string
                a_c: string
              }
            `,
            options: [
              {
                ...options,
                specialCharacters: 'remove',
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use locale`, rule, {
      valid: [
        {
          code: dedent`
              interface MyInterface {
                你好: string
                世界: string
                a: string
                A: string
                b: string
                B: string
              }
            `,
          options: [{ ...options, locales: 'zh-CN' }],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}(${type}): allows to use method group`, rule, {
      valid: [
        {
          code: dedent`
              interface Interface {
                b(): void
                c: () => void
                a: string
                d: string
              }
            `,
          options: [
            {
              ...options,
              groups: ['method', 'unknown'],
            },
          ],
        },
      ],
      invalid: [],
    })

    describe(`${ruleName}: newlinesBetween`, () => {
      ruleTester.run(
        `${ruleName}(${type}): removes newlines when never`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'y',
                    left: 'a',
                  },
                  messageId: 'extraSpacingBetweenInterfaceMembers',
                },
                {
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'unexpectedInterfacePropertiesOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'z',
                  },
                  messageId: 'extraSpacingBetweenInterfaceMembers',
                },
              ],
              code: dedent`
                interface Interface {
                  a: () => null,


                 y: "y",
                z: "z",

                    b: "b",
                }
              `,
              output: dedent`
                interface Interface {
                  a: () => null,
                 b: "b",
                y: "y",
                    z: "z",
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['method', 'unknown'],
                  newlinesBetween: 'never',
                },
              ],
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): keeps one newline when always`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'z',
                    left: 'a',
                  },
                  messageId: 'extraSpacingBetweenInterfaceMembers',
                },
                {
                  data: {
                    right: 'y',
                    left: 'z',
                  },
                  messageId: 'unexpectedInterfacePropertiesOrder',
                },
                {
                  data: {
                    right: 'b',
                    left: 'y',
                  },
                  messageId: 'missedSpacingBetweenInterfaceMembers',
                },
              ],
              output: dedent`
                interface Interface {
                  a: () => null,

                 y: "y",
                z: "z",

                    b: {
                      // Newline stuff
                    },
                }
                `,
              code: dedent`
                interface Interface {
                  a: () => null,


                 z: "z",
                y: "y",
                    b: {
                      // Newline stuff
                    },
                }
              `,
              options: [
                {
                  ...options,
                  groups: ['method', 'unknown', 'multiline'],
                  newlinesBetween: 'always',
                },
              ],
            },
          ],
          valid: [],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts inline elements correctly`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                a: string; b: string,
              }
            `,
            code: dedent`
              interface Interface {
                b: string, a: string
              }
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                a: string; b: string,
              }
            `,
            code: dedent`
              interface Interface {
                b: string, a: string;
              }
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                a: string, b: string,
              }
            `,
            code: dedent`
              interface Interface {
                b: string, a: string,
              }
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )
  })

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          output: dedent`
            interface Interface {
              a: string
              b: 'b1' | 'b2',
              c: string
            }
          `,
          code: dedent`
            interface Interface {
              a: string
              c: string
              b: 'b1' | 'b2',
            }
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            interface Interface {
              a: string
              b: 'b1' | 'b2',
              c: string
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with ts index signature`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '[key in Object]',
                  left: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                [key in Object]: string
                a: 'a'
              }
            `,
            code: dedent`
              interface Interface {
                a: 'a'
                [key in Object]: string
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                [key in Object]: string
                a: 'a'
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts multi-word keys by value`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'b-b',
                  right: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  left: 'd-d',
                  right: 'c',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                a: Value
                'b-b': string
                c: string
                'd-d': string
              }
            `,
            code: dedent`
              interface Interface {
                'b-b': string
                a: Value
                'd-d': string
                c: string
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                a: Value
                'b-b': string
                c: string
                'd-d': string
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with typescript index signature`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '[key: string]',
                  left: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                [key: string]: string
                a: string
                b: string
              }
            `,
            code: dedent`
              interface Interface {
                a: string
                [key: string]: string
                b: string
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                [key: string]: string
                a: string
                b: string
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with method and construct signatures`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'c()',
                  right: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  left: 'e()',
                  right: 'd',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                a: number
                b: () => void
                c(): number
                d: string
                e()
              }
            `,
            code: dedent`
              interface Interface {
                c(): number
                a: number
                b: () => void
                e()
                d: string
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                a: number
                b: () => void
                c(): number
                d: string
                e()
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with empty properties with empty values`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '[...other]',
                  left: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  right: '[v in V]',
                  left: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                [...other]
                [d in D]
                [v in V]?
                a: 10 | 20 | 30
                b: string
              }
            `,
            code: dedent`
              interface Interface {
                [d in D]
                a: 10 | 20 | 30
                [...other]
                b: string
                [v in V]?
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                [...other]
                [d in D]
                [v in V]?
                a: 10 | 20 | 30
                b: string
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break interface docs`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  right: 'c',
                  left: 'd',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                /**
                 * Comment A
                 */
                a: string
                /**
                 * Comment B
                 */
                b: Array
                /* Comment C */
                c: string | number
                // Comment D
                d: string
              }
            `,
            code: dedent`
              interface Interface {
                /**
                 * Comment B
                 */
                b: Array
                /**
                 * Comment A
                 */
                a: string
                // Comment D
                d: string
                /* Comment C */
                c: string | number
              }
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with comments on the same line`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                a: string | number // Comment A
                b: string // Comment B
              }
            `,
            code: dedent`
              interface Interface {
                b: string // Comment B
                a: string | number // Comment A
              }
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with semi and comments on the same line`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                a: 'aaa'; // Comment A
                b: 'b'; // Comment B
              }
            `,
            code: dedent`
              interface Interface {
                b: 'b'; // Comment B
                a: 'aaa'; // Comment A
              }
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): not sorts call signature declarations`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface Interface {
                <Parameters extends Record<string, number | string>>(
                  input: AFunction<[Parameters], string>
                ): Alternatives<Parameters>
                <A extends CountA>(input: Input): AFunction<
                  [number],
                  A[keyof A]
                >
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'e',
                  left: 'f',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  right: 'c',
                  left: 'd',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                e: 'eee'
                f: 'ff'
                g: 'g'

                a: 'aaa'

                b?: 'bbb'
                c: 'cc'
                d: 'd'
              }
            `,
            code: dedent`
              interface Interface {
                f: 'ff'
                e: 'eee'
                g: 'g'

                a: 'aaa'

                b?: 'bbb'
                d: 'd'
                c: 'cc'
              }
            `,
            options: [
              {
                ...options,
                partitionByNewLine: true,
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                e: 'eee'
                f: 'ff'
                g: 'g'

                a: 'aaa'

                b?: 'bbb'
                c: 'cc'
                d: 'd'
              }
            `,
            options: [
              {
                ...options,
                partitionByNewLine: true,
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
      invalid: [
        {
          output: dedent`
              interface Interface {
                a?: string
                c?: string
                d?: string
                e?(): void
                b: string
              }
            `,
          code: dedent`
              interface Interface {
                a?: string
                b: string
                c?: string
                d?: string
                e?(): void
              }
            `,
          errors: [
            {
              data: {
                right: 'c',
                left: 'b',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          options: [
            {
              ...options,
              groupKind: 'optional-first',
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
              interface Interface {
                a?: string
                [index: number]: string
              }
            `,
          options: [
            {
              ...options,
              groupKind: 'optional-first',
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use partition comments`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              interface MyInterface {
                // Part: A
                // Not partition comment
                bbb: boolean;
                cc: string;
                d: string;
                // Part: B
                aaaa: string;
                e: string;
                // Part: C
                // Not partition comment
                fff: string;
                'gg': string;
              }
            `,
            code: dedent`
              interface MyInterface {
                // Part: A
                cc: string;
                d: string;
                // Not partition comment
                bbb: boolean;
                // Part: B
                aaaa: string;
                e: string;
                // Part: C
                'gg': string;
                // Not partition comment
                fff: string;
              }
            `,
            errors: [
              {
                data: {
                  right: 'bbb',
                  left: 'd',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  right: 'fff',
                  left: 'gg',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: '^Part*',
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use all comments as parts`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface MyInterface {
                // Comment
                bb: string;
                // Other comment
                a: string;
              }
            `,
            options: [
              {
                ...options,
                partitionByComment: true,
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use multiple partition comments`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              interface MyInterface {
                /* Partition Comment */
                // Part: A
                d: string;
                // Part: B
                aaa: string;
                bb: string;
                c: string;
                /* Other */
                e: string;
              }
            `,
            code: dedent`
              interface MyInterface {
                /* Partition Comment */
                // Part: A
                d: string;
                // Part: B
                aaa: string;
                c: string;
                bb: string;
                /* Other */
                e: string;
              }
            `,
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use method group`, rule, {
      valid: [
        {
          code: dedent`
              interface Interface {
                b(): void
                c: () => void
                a: string
                d: string
              }
            `,
          options: [
            {
              ...options,
              groups: ['method', 'unknown'],
            },
          ],
        },
      ],
      invalid: [],
    })
  })

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          output: dedent`
            interface Interface {
              b: 'b1' | 'b2',
              a: string
              c: string
            }
          `,
          code: dedent`
            interface Interface {
              a: string
              c: string
              b: 'b1' | 'b2',
            }
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            interface Interface {
              b: 'b1' | 'b2',
              a: string
              c: string
            }
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): takes into account the presence of an optional operator`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'b',
                  left: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                b?: string
                a: string
              }
            `,
            code: dedent`
              interface Interface {
                a: string
                b?: string
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                a: string
                b: string
              }
            `,
            options: [options],
          },
          {
            code: dedent`
              interface Interface {
                b: string
                a: string
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with ts index signature`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: '[key in Object]',
                  left: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                [key in Object]: string
                a: 'a'
              }
            `,
            code: dedent`
              interface Interface {
                a: 'a'
                [key in Object]: string
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                [key in Object]: string
                a: 'a'
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with method and construct signatures`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'c()',
                  left: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                b: () => void
                c(): number
                d: string
                a: number
                e()
              }
            `,
            code: dedent`
              interface Interface {
                b: () => void
                d: string
                a: number
                c(): number
                e()
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                b: () => void
                c(): number
                a: number
                d: string
                e()
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with empty properties with empty values`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: '[d in D]',
                  right: 'a',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                a: 10 | 20 | 30
                [...other]
                b: string
                [v in V]?
                [d in D]
              }
            `,
            code: dedent`
              interface Interface {
                [d in D]
                a: 10 | 20 | 30
                [...other]
                b: string
                [v in V]?
              }
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                a: 10 | 20 | 30
                [...other]
                [v in V]?
                b: string
                [d in D]
              }
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break interface docs`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  right: 'c',
                  left: 'd',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                /* Comment C */
                c: string | number
                /**
                 * Comment A
                 */
                a: string
                // Comment D
                d: string
                /**
                 * Comment B
                 */
                b: Array
              }
            `,
            code: dedent`
              interface Interface {
                /**
                 * Comment B
                 */
                b: Array
                /**
                 * Comment A
                 */
                a: string
                // Comment D
                d: string
                /* Comment C */
                c: string | number
              }
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with comments on the same line`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                a: string | number // Comment A
                b: string // Comment B
              }
            `,
            code: dedent`
              interface Interface {
                b: string // Comment B
                a: string | number // Comment A
              }
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with semi and comments on the same line`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                a: 'aaa'; // Comment A
                b: 'b'; // Comment B
              }
            `,
            code: dedent`
              interface Interface {
                b: 'b'; // Comment B
                a: 'aaa'; // Comment A
              }
            `,
            options: [options],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): not sorts call signature declarations`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface Interface {
                <Parameters extends Record<string, number | string>>(
                  input: AFunction<[Parameters], string>
                ): Alternatives<Parameters>
                <A extends CountA>(input: Input): AFunction<
                  [number],
                  A[keyof A]
                >
              }
            `,
            options: [options],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'multiline',
                  leftGroup: 'unknown',
                  right: 'd',
                  left: 'c',
                },
                messageId: 'unexpectedInterfacePropertiesGroupOrder',
              },
              {
                data: {
                  leftGroup: 'multiline',
                  rightGroup: 'g',
                  right: 'g',
                  left: 'd',
                },
                messageId: 'unexpectedInterfacePropertiesGroupOrder',
              },
            ],
            output: dedent`
              interface Interface {
                g: 'g'
                d: {
                  e: 'e'
                  f: 'f'
                }
                a: 'aaa'
                b: 'bb'
                c: 'c'
              }
            `,
            code: dedent`
              interface Interface {
                a: 'aaa'
                b: 'bb'
                c: 'c'
                d: {
                  e: 'e'
                  f: 'f'
                }
                g: 'g'
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  g: 'g',
                },
                groups: ['g', 'multiline', 'unknown'],
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                g: 'g'
                d: {
                  e: 'e'
                  f: 'f'
                }
                a: 'aaa'
                b: 'bb'
                c: 'c'
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  g: 'g',
                },
                groups: ['g', 'multiline', 'unknown'],
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'e',
                  left: 'f',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  right: 'c',
                  left: 'd',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                e: 'eee'
                f: 'ff'
                g: 'g'

                a: 'aaa'

                b?: 'bbb'
                c: 'cc'
                d: 'd'
              }
            `,
            code: dedent`
              interface Interface {
                f: 'ff'
                e: 'eee'
                g: 'g'

                a: 'aaa'

                b?: 'bbb'
                d: 'd'
                c: 'cc'
              }
            `,
            options: [
              {
                ...options,
                partitionByNewLine: true,
              },
            ],
          },
        ],
        valid: [
          {
            code: dedent`
              interface Interface {
                e: 'eee'
                f: 'ff'
                g: 'g'

                a: 'aaa'

                b?: 'bbb'
                c: 'cc'
                d: 'd'
              }
            `,
            options: [
              {
                ...options,
                partitionByNewLine: true,
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
      invalid: [
        {
          output: dedent`
              interface Interface {
                a?: string
                c?: string
                d?: string
                e?(): void
                b: string
              }
            `,
          code: dedent`
              interface Interface {
                a?: string
                b: string
                c?: string
                d?: string
                e?(): void
              }
            `,
          errors: [
            {
              data: {
                right: 'c',
                left: 'b',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          options: [
            {
              ...options,
              groupKind: 'optional-first',
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
              interface Interface {
                a?: string
                [index: number]: string
              }
            `,
          options: [
            {
              ...options,
              groupKind: 'optional-first',
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                left: 'backgroundColor',
                right: 'label',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
            {
              data: {
                left: 'primary',
                right: 'size',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          output: dedent`
              interface ButtonProps {
                label: string
                size?: 'large' | 'medium' | 'small'
                backgroundColor?: string
                primary?: boolean
                onClick?(): void
              }
            `,
          code: dedent`
              interface ButtonProps {
                backgroundColor?: string
                label: string
                primary?: boolean
                size?: 'large' | 'medium' | 'small'
                onClick?(): void
              }
            `,
          options: [
            {
              ...options,
              groupKind: 'required-first',
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
              interface X {
                [index: number]: string
                a?: string
              }
            `,
          options: [
            {
              ...options,
              groupKind: 'required-first',
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'backgroundColor',
                  right: 'label',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  left: 'primary',
                  right: 'size',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface ButtonProps {
                label: string
                size?: 'large' | 'medium' | 'small'
                backgroundColor?: string
                primary?: boolean
                onClick?(): void
              }
            `,
            code: dedent`
              interface ButtonProps {
                backgroundColor?: string
                label: string
                primary?: boolean
                size?: 'large' | 'medium' | 'small'
                onClick?(): void
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  callback: '^on.+',
                },
                groups: ['unknown', 'callback'],
                groupKind: 'required-first',
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  left: 'firstName',
                  right: 'id',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  right: 'password',
                  left: 'lastName',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
              {
                data: {
                  right: 'createdAt',
                  left: 'avatarUrl',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface User {
                password: string
                username: string
                email: string
                id: number
                firstName?: string
                lastName?: string

                createdAt: Date
                updatedAt: Date
                biography?: string
                avatarUrl?: string
              }
            `,
            code: dedent`
              interface User {
                email: string
                firstName?: string
                id: number
                lastName?: string
                password: string
                username: string

                biography?: string
                avatarUrl?: string
                createdAt: Date
                updatedAt: Date
              }
            `,
            options: [
              {
                ...options,
                groupKind: 'required-first',
                partitionByNewLine: true,
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use partition comments`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              interface MyInterface {
                // Part: A
                // Not partition comment
                bbb: string;
                cc: string;
                d: string;
                // Part: B
                aaaa: string;
                e: string;
                // Part: C
                'gg': string;
                // Not partition comment
                fff: string;
              }
            `,
            code: dedent`
              interface MyInterface {
                // Part: A
                cc: string;
                d: string;
                // Not partition comment
                bbb: string;
                // Part: B
                aaaa: string;
                e: string;
                // Part: C
                'gg': string;
                // Not partition comment
                fff: string;
              }
            `,
            errors: [
              {
                data: {
                  right: 'bbb',
                  left: 'd',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: '^Part*',
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use all comments as parts`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface MyInterface {
                // Comment
                bb: string;
                // Other comment
                a: string;
              }
            `,
            options: [
              {
                ...options,
                partitionByComment: true,
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to use multiple partition comments`,
      rule,
      {
        invalid: [
          {
            output: dedent`
              interface MyInterface {
                /* Partition Comment */
                // Part: A
                d: string;
                // Part: B
                aaa: string;
                bb: string;
                c: string;
                /* Other */
                e: string;
              }
            `,
            code: dedent`
              interface MyInterface {
                /* Partition Comment */
                // Part: A
                d: string;
                // Part: B
                aaa: string;
                c: string;
                bb: string;
                /* Other */
                e: string;
              }
            `,
            errors: [
              {
                data: {
                  right: 'bb',
                  left: 'c',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            options: [
              {
                ...options,
                partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
              },
            ],
          },
        ],
        valid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use method group`, rule, {
      valid: [
        {
          code: dedent`
              interface Interface {
                c: () => void
                b(): void
                a: string
                d: string
              }
            `,
          options: [
            {
              ...options,
              groups: ['method', 'unknown'],
            },
          ],
        },
      ],
      invalid: [],
    })
  })

  describe(`${ruleName}: validating group configuration`, () => {
    ruleTester.run(
      `${ruleName}: allows predefined groups and defined custom groups`,
      rule,
      {
        valid: [
          {
            options: [
              {
                customGroups: {
                  myCustomGroup: 'x',
                },
                groups: ['multiline', 'unknown', 'myCustomGroup'],
              },
            ],
            code: dedent`
            interface Interface {
              a: string
              b: 'b1' | 'b2',
              c: string
            }
          `,
          },
        ],
        invalid: [],
      },
    )
  })

  describe(`${ruleName}: misc`, () => {
    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'a',
                  left: 'b',
                },
                messageId: 'unexpectedInterfacePropertiesOrder',
              },
            ],
            output: dedent`
              interface Interface {
                a: string
                b: string
              }
            `,
            code: dedent`
              interface Interface {
                b: string
                a: string
              }
            `,
          },
        ],
        valid: [
          dedent`
            interface Interface {
              a: string
              b: string
            }
          `,
          {
            code: dedent`
              interface Calculator {
                log: (x: number) => number,
                log10: (x: number) => number,
                log1p: (x: number) => number,
                log2: (x: number) => number,
              }
            `,
            options: [{}],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}: allows to ignore interfaces`, rule, {
      valid: [
        {
          options: [
            {
              ignorePattern: ['Ignore*'],
              type: 'line-length',
              order: 'desc',
            },
          ],
          code: dedent`
            interface IgnoreInterface {
              b: 'b'
              a: 'aaa'
            }
          `,
        },
      ],
      invalid: [],
    })

    let eslintDisableRuleTesterName = `${ruleName}: supports 'eslint-disable' for individual nodes`
    ruleTester.run(eslintDisableRuleTesterName, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          output: dedent`
            interface Interface {
              b: string
              c: string
              // eslint-disable-next-line
              a: string
            }
          `,
          code: dedent`
            interface Interface {
              c: string
              b: string
              // eslint-disable-next-line
              a: string
            }
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'c',
                left: 'd',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          output: dedent`
            interface Interface {
              b: string
              c: string
              // eslint-disable-next-line
              a: string
              d: string
            }
          `,
          code: dedent`
            interface Interface {
              d: string
              c: string
              // eslint-disable-next-line
              a: string
              b: string
            }
          `,
          options: [
            {
              partitionByComment: true,
            },
          ],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          output: dedent`
            interface Interface {
              b: string
              c: string
              a: string // eslint-disable-line
            }
          `,
          code: dedent`
            interface Interface {
              c: string
              b: string
              a: string // eslint-disable-line
            }
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          output: dedent`
            interface Interface {
              b: string
              c: string
              /* eslint-disable-next-line */
              a: string
            }
          `,
          code: dedent`
            interface Interface {
              c: string
              b: string
              /* eslint-disable-next-line */
              a: string
            }
          `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          output: dedent`
            interface Interface {
              b: string
              c: string
              a: string /* eslint-disable-line */
            }
          `,
          code: dedent`
            interface Interface {
              c: string
              b: string
              a: string /* eslint-disable-line */
            }
          `,
          options: [{}],
        },
        {
          output: dedent`
            interface Interface {
              a: string
              d: string
              /* eslint-disable */
              c: string
              b: string
              // Shouldn't move
              /* eslint-enable */
              e: string
            }
          `,
          code: dedent`
            interface Interface {
              d: string
              e: string
              /* eslint-disable */
              c: string
              b: string
              // Shouldn't move
              /* eslint-enable */
              a: string
            }
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            interface Interface {
              b: string
              c: string
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a: string
            }
          `,
          code: dedent`
            interface Interface {
              c: string
              b: string
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a: string
            }
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            interface Interface {
              b: string
              c: string
              a: string // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            }
          `,
          code: dedent`
            interface Interface {
              c: string
              b: string
              a: string // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            }
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            interface Interface {
              b: string
              c: string
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a: string
            }
          `,
          code: dedent`
            interface Interface {
              c: string
              b: string
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a: string
            }
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            interface Interface {
              b: string
              c: string
              a: string /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            }
          `,
          code: dedent`
            interface Interface {
              c: string
              b: string
              a: string /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            }
          `,
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          options: [{}],
        },
        {
          output: dedent`
            interface Interface {
              a: string
              d: string
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              c: string
              b: string
              // Shouldn't move
              /* eslint-enable */
              e: string
            }
          `,
          code: dedent`
            interface Interface {
              d: string
              e: string
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              c: string
              b: string
              // Shouldn't move
              /* eslint-enable */
              a: string
            }
          `,
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedInterfacePropertiesOrder',
            },
          ],
          options: [{}],
        },
      ],
      valid: [],
    })
  })
})
