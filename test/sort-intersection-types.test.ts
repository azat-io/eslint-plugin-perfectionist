import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-intersection-types'

let ruleName = 'sort-intersection-types'

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

    ruleTester.run(`${ruleName}(${type}: sorts intersection types`, rule, {
      valid: [
        {
          code: dedent`
            type Type = { label: 'aaa' } & { label: 'bb' } & { label: 'c' }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Type = { label: 'aaa' } & { label: 'c' } & { label: 'bb' }
          `,
          output: dedent`
            type Type = { label: 'aaa' } & { label: 'bb' } & { label: 'c' }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: "{ label: 'c' }",
                right: "{ label: 'bb' }",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts keyword intersection types`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Value =
              & { booleanValue: boolean }
              & { numberValue: number }
              & { stringValue: string }
              & { anyValue: any }
              & { unknownValue: unknown }
              & { nullValue: null }
              & { undefinedValue: undefined }
              & { neverValue: never }
              & { voidValue: void }
              & { bigintValue: bigint }
          `,
          output: dedent`
            type Value =
              & { anyValue: any }
              & { bigintValue: bigint }
              & { booleanValue: boolean }
              & { neverValue: never }
              & { nullValue: null }
              & { numberValue: number }
              & { stringValue: string }
              & { undefinedValue: undefined }
              & { unknownValue: unknown }
              & { voidValue: void }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: '{ stringValue: string }',
                right: '{ anyValue: any }',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: '{ unknownValue: unknown }',
                right: '{ nullValue: null }',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: '{ undefinedValue: undefined }',
                right: '{ neverValue: never }',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: '{ voidValue: void }',
                right: '{ bigintValue: bigint }',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: works with generics`, rule, {
      valid: [],
      invalid: [
        {
          code: 'Omit<T, B & AA>',
          output: 'Omit<T, AA & B>',
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'B',
                right: 'AA',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: works with type references`, rule, {
      valid: [],
      invalid: [
        {
          code: 'type Type = A & C & B',
          output: 'type Type = A & B & C',
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'C',
                right: 'B',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: works with type references`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Type =
              & { name: B, status: 'b' }
              & { name: A, status: 'aa' }
          `,
          output: dedent`
            type Type =
              & { name: A, status: 'aa' }
              & { name: B, status: 'b' }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: "{ name: B, status: 'b' }",
                right: "{ name: A, status: 'aa' }",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts intersections with parentheses`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Type = {
              t:
                & B
                & ((
                    A: () => void,
                  ) => B & C)
                & C
            }
          `,
          output: dedent`
            type Type = {
              t:
                & ((
                    A: () => void,
                  ) => B & C)
                & B
                & C
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'B',
                right: '( A: () => void, ) => B & C',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}: sorts intersections with comment at the end`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
            type Step =  { value1: 1 } & { value2: 2 } & { value4: 4 } & { value3: 3 } & { value5: 5 } & { value100: 100 }; // Comment
          `,
            output: dedent`
            type Step =  { value1: 1 } & { value100: 100 } & { value2: 2 } & { value3: 3 } & { value4: 4 } & { value5: 5 }; // Comment
          `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedIntersectionTypesOrder',
                data: {
                  left: '{ value4: 4 }',
                  right: '{ value3: 3 }',
                },
              },
              {
                messageId: 'unexpectedIntersectionTypesOrder',
                data: {
                  left: '{ value5: 5 }',
                  right: '{ value100: 100 }',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}: sorts intersections using groups`, rule, {
      valid: [
        {
          code: dedent`
            type Type =
              & A
              & intrinsic
              & SomeClass['name']
              & string[]
              & any
              & bigint
              & boolean
              & number
              & this
              & unknown
              & keyof { a: string; b: number }
              & keyof A
              & typeof B
              & 'aaa'
              & \`\${A}\`
              & 1
              & (new () => SomeClass)
              & (import('path'))
              & (A extends B ? C : D)
              & { [P in keyof T]: T[P] }
              & { name: 'a' }
              & [A, B, C]
              & (A & B)
              & (A | B)
              & null
          `,
          options: [
            {
              ...options,
              groups: [
                'named',
                'keyword',
                'operator',
                'literal',
                'function',
                'import',
                'conditional',
                'object',
                'tuple',
                'intersection',
                'union',
                'nullish',
              ],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Type =
              & any
              & { name: 'a' }
              & boolean
              & A
              & keyof A
              & bigint
              & typeof B
              & 'aaa'
              & (import('path'))
              & null
              & 1
              & (A extends B ? C : D)
              & [A, B, C]
              & (A | B)
              & (A & B)
          `,
          output: dedent`
            type Type =
              & A
              & any
              & bigint
              & boolean
              & keyof A
              & typeof B
              & 'aaa'
              & 1
              & (import('path'))
              & (A extends B ? C : D)
              & { name: 'a' }
              & [A, B, C]
              & (A & B)
              & (A | B)
              & null
          `,
          options: [
            {
              ...options,
              groups: [
                'named',
                'keyword',
                'operator',
                'literal',
                'function',
                'import',
                'conditional',
                'object',
                'tuple',
                'intersection',
                'union',
                'nullish',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesGroupOrder',
              data: {
                left: "{ name: 'a' }",
                leftGroup: 'object',
                right: 'boolean',
                rightGroup: 'keyword',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesGroupOrder',
              data: {
                left: 'boolean',
                leftGroup: 'keyword',
                right: 'A',
                rightGroup: 'named',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesGroupOrder',
              data: {
                left: 'keyof A',
                leftGroup: 'operator',
                right: 'bigint',
                rightGroup: 'keyword',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesGroupOrder',
              data: {
                left: 'null',
                leftGroup: 'nullish',
                right: '1',
                rightGroup: 'literal',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesGroupOrder',
              data: {
                left: 'A | B',
                leftGroup: 'union',
                right: 'A & B',
                rightGroup: 'intersection',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              type Type =
                D &
                A &

                C &

                E &
                B
            `,
            output: dedent`
              type Type =
                A &
                D &

                C &

                B &
                E
            `,
            options: [
              {
                type: 'alphabetical',
                partitionByNewLine: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedIntersectionTypesOrder',
                data: {
                  left: 'D',
                  right: 'A',
                },
              },
              {
                messageId: 'unexpectedIntersectionTypesOrder',
                data: {
                  left: 'E',
                  right: 'B',
                },
              },
            ],
          },
        ],
      },
    )

    describe('partition comments', () => {
      ruleTester.run(
        `${ruleName}(${type}): allows to use partition comments`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                type T =
                  // Part: A
                  CC &
                  D &
                  // Not partition comment
                  BBB &
                  // Part: B
                  AAA &
                  E &
                  // Part: C
                  GG &
                  // Not partition comment
                  FFF
              `,
              output: dedent`
                type T =
                  // Part: A
                  // Not partition comment
                  BBB &
                  CC &
                  D &
                  // Part: B
                  AAA &
                  E &
                  // Part: C
                  // Not partition comment
                  FFF &
                  GG
              `,
              options: [
                {
                  ...options,
                  partitionByComment: 'Part**',
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedIntersectionTypesOrder',
                  data: {
                    left: 'D',
                    right: 'BBB',
                  },
                },
                {
                  messageId: 'unexpectedIntersectionTypesOrder',
                  data: {
                    left: 'GG',
                    right: 'FFF',
                  },
                },
              ],
            },
            {
              code: dedent`
                type T =
                  // Part: A
                  & CC
                  & D
                  // Not partition comment
                  & BBB
                  // Part: B
                  & AAA
                  & E
                  // Part: C
                  & GG
                  // Not partition comment
                  & FFF
              `,
              output: dedent`
                type T =
                  // Part: A
                  & BBB
                  & CC
                  // Not partition comment
                  & D
                  // Part: B
                  & AAA
                  & E
                  // Part: C
                  & FFF
                  // Not partition comment
                  & GG
              `,
              options: [
                {
                  ...options,
                  partitionByComment: 'Part**',
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedIntersectionTypesOrder',
                  data: {
                    left: 'D',
                    right: 'BBB',
                  },
                },
                {
                  messageId: 'unexpectedIntersectionTypesOrder',
                  data: {
                    left: 'GG',
                    right: 'FFF',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use all comments as parts`,
        rule,
        {
          valid: [
            {
              code: dedent`
                type T =
                  // Comment
                  BB &
                  // Other comment
                  A
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
          valid: [],
          invalid: [
            {
              code: dedent`
                  type T =
                    /* Partition Comment */
                    // Part: A
                    D &
                    // Part: B
                    AAA &
                    C &
                    BB &
                    /* Other */
                    E
                `,
              output: dedent`
                  type T =
                    /* Partition Comment */
                    // Part: A
                    D &
                    // Part: B
                    AAA &
                    BB &
                    C &
                    /* Other */
                    E
                `,
              options: [
                {
                  ...options,
                  partitionByComment: ['Partition Comment', 'Part: *', 'Other'],
                },
              ],
              errors: [
                {
                  messageId: 'unexpectedIntersectionTypesOrder',
                  data: {
                    left: 'C',
                    right: 'BB',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use regex matcher for partition comments`,
        rule,
        {
          valid: [
            {
              code: dedent`
              type T =
                E &
                F &
                // I am a partition comment because I don't have f o o
                A &
                B
            `,
              options: [
                {
                  ...options,
                  matcher: 'regex',
                  partitionByComment: ['^(?!.*foo).*$'],
                },
              ],
            },
          ],
          invalid: [],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            code: dedent`
              type T =
                _A &
                B &
                _C
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
              type T =
                AB &
                A_C
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

    describe(`${ruleName}: newlinesBetween`, () => {
      ruleTester.run(
        `${ruleName}(${type}): removes newlines when never`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                type T =
                  (() => null)


                 & Y
                & Z

                    & B
              `,
              output: dedent`
                type T =
                  (() => null)
                 & B
                & Y
                    & Z
              `,
              options: [
                {
                  ...options,
                  newlinesBetween: 'never',
                  groups: ['function', 'unknown'],
                },
              ],
              errors: [
                {
                  messageId: 'extraSpacingBetweenIntersectionTypes',
                  data: {
                    left: '() => null',
                    right: 'Y',
                  },
                },
                {
                  messageId: 'unexpectedIntersectionTypesOrder',
                  data: {
                    left: 'Z',
                    right: 'B',
                  },
                },
                {
                  messageId: 'extraSpacingBetweenIntersectionTypes',
                  data: {
                    left: 'Z',
                    right: 'B',
                  },
                },
              ],
            },
          ],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): keeps one newline when always`,
        rule,
        {
          valid: [],
          invalid: [
            {
              code: dedent`
                type T =
                  (() => null)


                 & Z
                & Y
                    & "A"
              `,
              output: dedent`
                type T =
                  (() => null)

                 & Y
                & Z

                    & "A"
                `,
              options: [
                {
                  ...options,
                  newlinesBetween: 'always',
                  groups: ['function', 'unknown', 'literal'],
                },
              ],
              errors: [
                {
                  messageId: 'extraSpacingBetweenIntersectionTypes',
                  data: {
                    left: '() => null',
                    right: 'Z',
                  },
                },
                {
                  messageId: 'unexpectedIntersectionTypesOrder',
                  data: {
                    left: 'Z',
                    right: 'Y',
                  },
                },
                {
                  messageId: 'missedSpacingBetweenIntersectionTypes',
                  data: {
                    left: 'Y',
                    right: '"A"',
                  },
                },
              ],
            },
          ],
        },
      )
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts inline elements correctly`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              type T =
                & B & A
            `,
            output: dedent`
              type T =
                & A & B
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedIntersectionTypesOrder',
                data: {
                  left: 'B',
                  right: 'A',
                },
              },
            ],
          },
          {
            code: dedent`
              type T =
                B & A
            `,
            output: dedent`
              type T =
                A & B
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedIntersectionTypesOrder',
                data: {
                  left: 'B',
                  right: 'A',
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
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}: sorts intersection types`, rule, {
      valid: [
        {
          code: dedent`
            type Type = { label: 'aaa' } & { label: 'bb' } & { label: 'c' }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Type = { label: 'aaa' } & { label: 'c' } & { label: 'bb' }
          `,
          output: dedent`
            type Type = { label: 'aaa' } & { label: 'bb' } & { label: 'c' }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: "{ label: 'c' }",
                right: "{ label: 'bb' }",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts keyword intersection types`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Value =
              & boolean
              & number
              & string
              & any
              & unknown
              & null
              & undefined
              & never
              & void
              & bigint
          `,
          output: dedent`
            type Value =
              & any
              & bigint
              & boolean
              & never
              & null
              & number
              & string
              & undefined
              & unknown
              & void
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'string',
                right: 'any',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'unknown',
                right: 'null',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'undefined',
                right: 'never',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'void',
                right: 'bigint',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: works with generics`, rule, {
      valid: [],
      invalid: [
        {
          code: 'Omit<T, B & AA>',
          output: 'Omit<T, AA & B>',
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'B',
                right: 'AA',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: works with type references`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Type =
              & { name: B, status: 'b' }
              & { name: A, status: 'aa' }
          `,
          output: dedent`
            type Type =
              & { name: A, status: 'aa' }
              & { name: B, status: 'b' }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: "{ name: B, status: 'b' }",
                right: "{ name: A, status: 'aa' }",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts intersections with parentheses`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Type = {
              t:
                & B
                & ((
                    A: () => void,
                  ) => B & C)
                & C
            }
          `,
          output: dedent`
            type Type = {
              t:
                & ((
                    A: () => void,
                  ) => B & C)
                & B
                & C
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'B',
                right: '( A: () => void, ) => B & C',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}: sorts intersections with comment at the end`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
            type Step = { value1: 1 } & { value2: 2 } & { value4: 4 } & { value3: 3 } & { value5: 5 } & { value100: 100 }; // Comment
          `,
            output: dedent`
            type Step = { value1: 1 } & { value100: 100 } & { value2: 2 } & { value3: 3 } & { value4: 4 } & { value5: 5 }; // Comment
          `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedIntersectionTypesOrder',
                data: {
                  left: '{ value4: 4 }',
                  right: '{ value3: 3 }',
                },
              },
              {
                messageId: 'unexpectedIntersectionTypesOrder',
                data: {
                  left: '{ value5: 5 }',
                  right: '{ value100: 100 }',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}: sorts intersections using groups`, rule, {
      valid: [
        {
          code: dedent`
            type Type =
              & A
              & SomeClass['name']
              & string[]
              & any
              & bigint
              & boolean
              & keyof A
              & typeof B
              & 'aaa'
              & 1
              & (new () => SomeClass)
              & (import('path'))
              & (A extends B ? C : D)
              & { [P in keyof T]: T[P] }
              & { name: 'a' }
              & [A, B, C]
              & (A & B)
              & (A | B)
              & null
          `,
          options: [
            {
              ...options,
              groups: [
                'named',
                'keyword',
                'operator',
                'literal',
                'function',
                'import',
                'conditional',
                'object',
                'tuple',
                'intersection',
                'union',
                'nullish',
              ],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Type =
              & any
              & { name: 'a' }
              & boolean
              & A
              & keyof A
              & bigint
              & typeof B
              & 'aaa'
              & (import('path'))
              & null
              & 1
              & (A extends B ? C : D)
              & [A, B, C]
              & (A | B)
              & (A & B)
          `,
          output: dedent`
            type Type =
              & A
              & any
              & bigint
              & boolean
              & keyof A
              & typeof B
              & 'aaa'
              & 1
              & (import('path'))
              & (A extends B ? C : D)
              & { name: 'a' }
              & [A, B, C]
              & (A & B)
              & (A | B)
              & null
          `,
          options: [
            {
              ...options,
              groups: [
                'named',
                'keyword',
                'operator',
                'literal',
                'function',
                'import',
                'conditional',
                'object',
                'tuple',
                'intersection',
                'union',
                'nullish',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesGroupOrder',
              data: {
                left: "{ name: 'a' }",
                leftGroup: 'object',
                right: 'boolean',
                rightGroup: 'keyword',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesGroupOrder',
              data: {
                left: 'boolean',
                leftGroup: 'keyword',
                right: 'A',
                rightGroup: 'named',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesGroupOrder',
              data: {
                left: 'keyof A',
                leftGroup: 'operator',
                right: 'bigint',
                rightGroup: 'keyword',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesGroupOrder',
              data: {
                left: 'null',
                leftGroup: 'nullish',
                right: '1',
                rightGroup: 'literal',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesGroupOrder',
              data: {
                left: 'A | B',
                leftGroup: 'union',
                right: 'A & B',
                rightGroup: 'intersection',
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

    ruleTester.run(`${ruleName}(${type}: sorts intersection types`, rule, {
      valid: [
        {
          code: dedent`
            type Type = { label: 'aaa' } & { label: 'bb' } & { label: 'c' }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Type = { label: 'aaa' } & { label: 'c' } & { label: 'bb' }
          `,
          output: dedent`
            type Type = { label: 'aaa' } & { label: 'bb' } & { label: 'c' }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: "{ label: 'c' }",
                right: "{ label: 'bb' }",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts keyword intersection types`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Value =
              & boolean
              & number
              & string
              & any
              & unknown
              & null
              & undefined
              & never
              & void
              & bigint
          `,
          output: dedent`
            type Value =
              & undefined
              & boolean
              & unknown
              & number
              & string
              & bigint
              & never
              & null
              & void
              & any
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'any',
                right: 'unknown',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'null',
                right: 'undefined',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'void',
                right: 'bigint',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: works with generics`, rule, {
      valid: [],
      invalid: [
        {
          code: 'Omit<T, B & AA>',
          output: 'Omit<T, AA & B>',
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'B',
                right: 'AA',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: works with type references`, rule, {
      valid: [
        {
          code: 'type DemonSlayer = A & B & C',
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}: works with type references`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Type =
              & { name: B, status: 'b' }
              & { name: A, status: 'aa' }
          `,
          output: dedent`
            type Type =
              & { name: A, status: 'aa' }
              & { name: B, status: 'b' }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: "{ name: B, status: 'b' }",
                right: "{ name: A, status: 'aa' }",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts intersections with parentheses`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Type = {
              t:
                & B
                & ((
                    A: () => void,
                  ) => B & C)
                & C
            }
          `,
          output: dedent`
            type Type = {
              t:
                & ((
                    A: () => void,
                  ) => B & C)
                & B
                & C
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'B',
                right: '( A: () => void, ) => B & C',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}: sorts intersections with comment at the end`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
            type Step = { value1: 1 } & { value2: 2 } & { value4: 4 } & { value3: 3 } & { value5: 5 } & { value100: 100 }; // Comment
          `,
            output: dedent`
            type Step = { value100: 100 } & { value1: 1 } & { value2: 2 } & { value4: 4 } & { value3: 3 } & { value5: 5 }; // Comment
          `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedIntersectionTypesOrder',
                data: {
                  left: '{ value5: 5 }',
                  right: '{ value100: 100 }',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}: sorts intersections using groups`, rule, {
      valid: [
        {
          code: dedent`
            type Type =
              & SomeClass['name']
              & string[]
              & A
              & boolean
              & bigint
              & any
              & typeof B
              & keyof A
              & 'aaa'
              & 1
              & (new () => SomeClass)
              & (import('path'))
              & (A extends B ? C : D)
              & { [P in keyof T]: T[P] }
              & { name: 'a' }
              & [A, B, C]
              & (A & B)
              & (A | B)
              & null
          `,
          options: [
            {
              ...options,
              groups: [
                'named',
                'keyword',
                'operator',
                'literal',
                'function',
                'import',
                'conditional',
                'object',
                'tuple',
                'intersection',
                'union',
                'nullish',
              ],
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Type =
              & any
              & { name: 'a' }
              & boolean
              & A
              & keyof A
              & bigint
              & typeof B
              & 'aaa'
              & (import('path'))
              & null
              & 1
              & (A extends B ? C : D)
              & [A, B, C]
              & (A | B)
              & (A & B)
          `,
          output: dedent`
            type Type =
              & A
              & boolean
              & bigint
              & any
              & typeof B
              & keyof A
              & 'aaa'
              & 1
              & (import('path'))
              & (A extends B ? C : D)
              & { name: 'a' }
              & [A, B, C]
              & (A & B)
              & (A | B)
              & null
          `,
          options: [
            {
              ...options,
              groups: [
                'named',
                'keyword',
                'operator',
                'literal',
                'function',
                'import',
                'conditional',
                'object',
                'tuple',
                'intersection',
                'union',
                'nullish',
              ],
            },
          ],
          errors: [
            {
              messageId: 'unexpectedIntersectionTypesGroupOrder',
              data: {
                left: "{ name: 'a' }",
                leftGroup: 'object',
                right: 'boolean',
                rightGroup: 'keyword',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesGroupOrder',
              data: {
                left: 'boolean',
                leftGroup: 'keyword',
                right: 'A',
                rightGroup: 'named',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesGroupOrder',
              data: {
                left: 'keyof A',
                leftGroup: 'operator',
                right: 'bigint',
                rightGroup: 'keyword',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesGroupOrder',
              data: {
                left: 'null',
                leftGroup: 'nullish',
                right: '1',
                rightGroup: 'literal',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesGroupOrder',
              data: {
                left: 'A | B',
                leftGroup: 'union',
                right: 'A & B',
                rightGroup: 'intersection',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${ruleName}: validating group configuration`, () => {
    ruleTester.run(`${ruleName}: allows predefined groups`, rule, {
      valid: [
        {
          code: dedent`
            type Type = { label: 'aaa' } & { label: 'bb' } & { label: 'c' }
          `,
          options: [
            {
              groups: [
                'intersection',
                'conditional',
                'function',
                'operator',
                'keyword',
                'literal',
                'nullish',
                'unknown',
                'import',
                'object',
                'named',
                'tuple',
                'union',
              ],
            },
          ],
        },
      ],
      invalid: [],
    })
  })

  describe(`${ruleName}: misc`, () => {
    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          dedent`
            type SupportedNumberBase = NumberBase.BASE_10 & NumberBase.BASE_16 & NumberBase.BASE_2
          `,
          {
            code: dedent`
              type SupportedNumberBase = NumberBase.BASE_10 & NumberBase.BASE_16 & NumberBase.BASE_2
            `,
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
              type SupportedNumberBase = NumberBase.BASE_2 & NumberBase.BASE_10 & NumberBase.BASE_16
            `,
            output: dedent`
              type SupportedNumberBase = NumberBase.BASE_10 & NumberBase.BASE_16 & NumberBase.BASE_2
            `,
            errors: [
              {
                messageId: 'unexpectedIntersectionTypesOrder',
                data: {
                  left: 'NumberBase.BASE_2',
                  right: 'NumberBase.BASE_10',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}: should ignore whitespaces`, rule, {
      valid: [
        {
          code: dedent`
            type T =
            { a: string } &
            {  b: string }
          `,
          options: [{}],
        },
      ],
      invalid: [],
    })
  })
})
