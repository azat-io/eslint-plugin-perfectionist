import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

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

    let options = {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
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
      invalid: [
        {
          code: dedent`
            interface Interface {
              a: string
              c: string
              b: 'b1' | 'b2',
            }
          `,
          output: dedent`
            interface Interface {
              a: string
              b: 'b1' | 'b2',
              c: string
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedInterfacePropertiesOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with ts index signature`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              interface Interface {
                a: 'a'
                [key in Object]: string
              }
            `,
            output: dedent`
              interface Interface {
                [key in Object]: string
                a: 'a'
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'a',
                  right: '[key in Object]',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts multi-word keys by value`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              interface Interface {
                'b-b': string
                a: Value
                'd-d': string
                c: string
              }
            `,
            output: dedent`
              interface Interface {
                a: Value
                'b-b': string
                c: string
                'd-d': string
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'b-b',
                  right: 'a',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'd-d',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with typescript index signature`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              interface Interface {
                a: string
                [key: string]: string
                b: string
              }
            `,
            output: dedent`
              interface Interface {
                [key: string]: string
                a: string
                b: string
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'a',
                  right: '[key: string]',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with method and construct signatures`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              interface Interface {
                c(): number
                a: number
                b: () => void
                e()
                d: string
              }
            `,
            output: dedent`
              interface Interface {
                a: number
                b: () => void
                c(): number
                d: string
                e()
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'c()',
                  right: 'a',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'e()',
                  right: 'd',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with empty properties with empty values`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              interface Interface {
                [d in D]
                a: 10 | 20 | 30
                [...other]
                b: string
                [v in V]?
              }
            `,
            output: dedent`
              interface Interface {
                [...other]
                [d in D]
                [v in V]?
                a: 10 | 20 | 30
                b: string
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'a',
                  right: '[...other]',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'b',
                  right: '[v in V]',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break interface docs`,
      rule,
      {
        valid: [],
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'd',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              interface Interface {
                b: string // Comment B
                a: string | number // Comment A
              }
            `,
            output: dedent`
              interface Interface {
                a: string | number // Comment A
                b: string // Comment B
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with semi and comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              interface Interface {
                b: 'b'; // Comment B
                a: 'aaa'; // Comment A
              }
            `,
            output: dedent`
              interface Interface {
                a: 'aaa'; // Comment A
                b: 'b'; // Comment B
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
        ],
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
                groups: ['g', 'multiline', 'unknown'],
                customGroups: {
                  g: 'g',
                },
              },
            ],
          },
        ],
        invalid: [
          {
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
            options: [
              {
                ...options,
                groups: ['g', 'multiline', 'unknown'],
                customGroups: {
                  g: 'g',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'c',
                  right: 'd',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'd',
                  right: 'g',
                },
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
        invalid: [
          {
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
            options: [
              {
                ...options,
                partitionByNewLine: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'f',
                  right: 'e',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'd',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
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
      invalid: [
        {
          code: dedent`
              interface Interface {
                a?: string
                b: string
                c?: string
                d?: string
                e?(): void
              }
            `,
          output: dedent`
              interface Interface {
                a?: string
                c?: string
                d?: string
                e?(): void
                b: string
              }
            `,
          options: [
            {
              ...options,
              groupKind: 'optional-first',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedInterfacePropertiesOrder',
              data: {
                left: 'b',
                right: 'c',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              interface Interface {
                a: string
                b: string
                c?: string
                d?: string
                e: string
              }
            `,
            output: dedent`
              interface Interface {
                c?: string
                d?: string
                b: string
                e: string
                a: string
              }
            `,
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
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'a',
                  right: 'b',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'b',
                  right: 'c',
                },
              },
            ],
          },
        ],
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
      invalid: [
        {
          code: dedent`
            interface Interface {
              a: string
              c: string
              b: 'b1' | 'b2',
            }
          `,
          output: dedent`
            interface Interface {
              a: string
              b: 'b1' | 'b2',
              c: string
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedInterfacePropertiesOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): works with ts index signature`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              interface Interface {
                a: 'a'
                [key in Object]: string
              }
            `,
            output: dedent`
              interface Interface {
                [key in Object]: string
                a: 'a'
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'a',
                  right: '[key in Object]',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts multi-word keys by value`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              interface Interface {
                'b-b': string
                a: Value
                'd-d': string
                c: string
              }
            `,
            output: dedent`
              interface Interface {
                a: Value
                'b-b': string
                c: string
                'd-d': string
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'b-b',
                  right: 'a',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'd-d',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with typescript index signature`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              interface Interface {
                a: string
                [key: string]: string
                b: string
              }
            `,
            output: dedent`
              interface Interface {
                [key: string]: string
                a: string
                b: string
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'a',
                  right: '[key: string]',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with method and construct signatures`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              interface Interface {
                c(): number
                a: number
                b: () => void
                e()
                d: string
              }
            `,
            output: dedent`
              interface Interface {
                a: number
                b: () => void
                c(): number
                d: string
                e()
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'c()',
                  right: 'a',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'e()',
                  right: 'd',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with empty properties with empty values`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              interface Interface {
                [d in D]
                a: 10 | 20 | 30
                [...other]
                b: string
                [v in V]?
              }
            `,
            output: dedent`
              interface Interface {
                [...other]
                [d in D]
                [v in V]?
                a: 10 | 20 | 30
                b: string
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'a',
                  right: '[...other]',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'b',
                  right: '[v in V]',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break interface docs`,
      rule,
      {
        valid: [],
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'd',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              interface Interface {
                b: string // Comment B
                a: string | number // Comment A
              }
            `,
            output: dedent`
              interface Interface {
                a: string | number // Comment A
                b: string // Comment B
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with semi and comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              interface Interface {
                b: 'b'; // Comment B
                a: 'aaa'; // Comment A
              }
            `,
            output: dedent`
              interface Interface {
                a: 'aaa'; // Comment A
                b: 'b'; // Comment B
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
        ],
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
        invalid: [
          {
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
            options: [
              {
                ...options,
                partitionByNewLine: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'f',
                  right: 'e',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'd',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
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
      invalid: [
        {
          code: dedent`
              interface Interface {
                a?: string
                b: string
                c?: string
                d?: string
                e?(): void
              }
            `,
          output: dedent`
              interface Interface {
                a?: string
                c?: string
                d?: string
                e?(): void
                b: string
              }
            `,
          options: [
            {
              ...options,
              groupKind: 'optional-first',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedInterfacePropertiesOrder',
              data: {
                left: 'b',
                right: 'c',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
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
      invalid: [
        {
          code: dedent`
            interface Interface {
              a: string
              c: string
              b: 'b1' | 'b2',
            }
          `,
          output: dedent`
            interface Interface {
              b: 'b1' | 'b2',
              a: string
              c: string
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedInterfacePropertiesOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): takes into account the presence of an optional operator`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              interface Interface {
                a: string
                b?: string
              }
            `,
            output: dedent`
              interface Interface {
                b?: string
                a: string
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'a',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with ts index signature`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              interface Interface {
                a: 'a'
                [key in Object]: string
              }
            `,
            output: dedent`
              interface Interface {
                [key in Object]: string
                a: 'a'
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'a',
                  right: '[key in Object]',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with method and construct signatures`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              interface Interface {
                b: () => void
                d: string
                a: number
                c(): number
                e()
              }
            `,
            output: dedent`
              interface Interface {
                b: () => void
                c(): number
                d: string
                a: number
                e()
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'a',
                  right: 'c()',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with empty properties with empty values`,
      rule,
      {
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
        invalid: [
          {
            code: dedent`
              interface Interface {
                [d in D]
                a: 10 | 20 | 30
                [...other]
                b: string
                [v in V]?
              }
            `,
            output: dedent`
              interface Interface {
                a: 10 | 20 | 30
                [...other]
                b: string
                [v in V]?
                [d in D]
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: '[d in D]',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break interface docs`,
      rule,
      {
        valid: [],
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'd',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              interface Interface {
                b: string // Comment B
                a: string | number // Comment A
              }
            `,
            output: dedent`
              interface Interface {
                a: string | number // Comment A
                b: string // Comment B
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): sorts interfaces with semi and comments on the same line`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              interface Interface {
                b: 'b'; // Comment B
                a: 'aaa'; // Comment A
              }
            `,
            output: dedent`
              interface Interface {
                a: 'aaa'; // Comment A
                b: 'b'; // Comment B
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
        ],
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
                groups: ['g', 'multiline', 'unknown'],
                customGroups: {
                  g: 'g',
                },
              },
            ],
          },
        ],
        invalid: [
          {
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
            options: [
              {
                ...options,
                groups: ['g', 'multiline', 'unknown'],
                customGroups: {
                  g: 'g',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'c',
                  right: 'd',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'd',
                  right: 'g',
                },
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
        invalid: [
          {
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
            options: [
              {
                ...options,
                partitionByNewLine: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'f',
                  right: 'e',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'd',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
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
      invalid: [
        {
          code: dedent`
              interface Interface {
                a?: string
                b: string
                c?: string
                d?: string
                e?(): void
              }
            `,
          output: dedent`
              interface Interface {
                a?: string
                c?: string
                d?: string
                e?(): void
                b: string
              }
            `,
          options: [
            {
              ...options,
              groupKind: 'optional-first',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedInterfacePropertiesOrder',
              data: {
                left: 'b',
                right: 'c',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): sorts interface properties`, rule, {
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
      invalid: [
        {
          code: dedent`
              interface ButtonProps {
                backgroundColor?: string
                label: string
                primary?: boolean
                size?: 'large' | 'medium' | 'small'
                onClick?(): void
              }
            `,
          output: dedent`
              interface ButtonProps {
                label: string
                size?: 'large' | 'medium' | 'small'
                backgroundColor?: string
                primary?: boolean
                onClick?(): void
              }
            `,
          options: [
            {
              ...options,
              groupKind: 'required-first',
            },
          ],
          errors: [
            {
              messageId: 'unexpectedInterfacePropertiesOrder',
              data: {
                left: 'backgroundColor',
                right: 'label',
              },
            },
            {
              messageId: 'unexpectedInterfacePropertiesOrder',
              data: {
                left: 'primary',
                right: 'size',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to set groups for sorting`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              interface ButtonProps {
                backgroundColor?: string
                label: string
                primary?: boolean
                size?: 'large' | 'medium' | 'small'
                onClick?(): void
              }
            `,
            output: dedent`
              interface ButtonProps {
                label: string
                size?: 'large' | 'medium' | 'small'
                backgroundColor?: string
                primary?: boolean
                onClick?(): void
              }
            `,
            options: [
              {
                ...options,
                customGroups: {
                  callback: 'on*',
                },
                groups: ['unknown', 'callback'],
                groupKind: 'required-first',
              },
            ],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'backgroundColor',
                  right: 'label',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'primary',
                  right: 'size',
                },
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
        valid: [],
        invalid: [
          {
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
            options: [
              {
                ...options,
                groupKind: 'required-first',
                partitionByNewLine: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'firstName',
                  right: 'id',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'lastName',
                  right: 'password',
                },
              },
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'avatarUrl',
                  right: 'createdAt',
                },
              },
            ],
          },
        ],
      },
    )
  })

  describe(`${ruleName}: validating group configuration`, () => {
    ruleTester.run(
      `${ruleName}: allows predefined groups and defined custom groups`,
      rule,
      {
        valid: [
          {
            code: dedent`
            interface Interface {
              a: string
              b: 'b1' | 'b2',
              c: string
            }
          `,
            options: [
              {
                groups: ['multiline', 'unknown', 'myCustomGroup'],
                customGroups: {
                  myCustomGroup: 'x',
                },
              },
            ],
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
        invalid: [
          {
            code: dedent`
              interface Interface {
                b: string
                a: string
              }
            `,
            output: dedent`
              interface Interface {
                a: string
                b: string
              }
            `,
            errors: [
              {
                messageId: 'unexpectedInterfacePropertiesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}: allows to ignore interfaces`, rule, {
      valid: [
        {
          code: dedent`
            interface IgnoreInterface {
              b: 'b'
              a: 'aaa'
            }
          `,
          options: [
            {
              ignorePattern: ['Ignore*'],
              type: 'line-length',
              order: 'desc',
            },
          ],
        },
      ],
      invalid: [],
    })
  })
})
