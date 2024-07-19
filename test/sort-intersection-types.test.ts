import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-intersection-types'

describe(RULE_NAME, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    let options = {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}: sorts intersection types`, rule, {
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

    ruleTester.run(`${RULE_NAME}: sorts keyword intersection types`, rule, {
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

    ruleTester.run(`${RULE_NAME}: works with generics`, rule, {
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

    ruleTester.run(`${RULE_NAME}: works with type references`, rule, {
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

    ruleTester.run(`${RULE_NAME}: works with type references`, rule, {
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

    ruleTester.run(`${RULE_NAME}: sorts intersections with parentheses`, rule, {
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
      `${RULE_NAME}: sorts intersections with comment at the end`,
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

    ruleTester.run(`${RULE_NAME}: sorts intersections using groups`, rule, {
      valid: [
        {
          code: dedent`
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
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: "{ name: 'a' }",
                right: 'boolean',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'boolean',
                right: 'A',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'keyof A',
                right: 'bigint',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'null',
                right: '1',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'A | B',
                right: 'A & B',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}: sorts intersection types`, rule, {
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

    ruleTester.run(`${RULE_NAME}: sorts keyword intersection types`, rule, {
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

    ruleTester.run(`${RULE_NAME}: works with generics`, rule, {
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

    ruleTester.run(`${RULE_NAME}: works with type references`, rule, {
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

    ruleTester.run(`${RULE_NAME}: sorts intersections with parentheses`, rule, {
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
      `${RULE_NAME}: sorts intersections with comment at the end`,
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

    ruleTester.run(`${RULE_NAME}: sorts intersections using groups`, rule, {
      valid: [
        {
          code: dedent`
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
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: "{ name: 'a' }",
                right: 'boolean',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'boolean',
                right: 'A',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'keyof A',
                right: 'bigint',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'null',
                right: '1',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'A | B',
                right: 'A & B',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}: sorts intersection types`, rule, {
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

    ruleTester.run(`${RULE_NAME}: sorts keyword intersection types`, rule, {
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

    ruleTester.run(`${RULE_NAME}: works with generics`, rule, {
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

    ruleTester.run(`${RULE_NAME}: works with type references`, rule, {
      valid: [
        {
          code: 'type DemonSlayer = A & B & C',
          options: [options],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${RULE_NAME}: works with type references`, rule, {
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

    ruleTester.run(`${RULE_NAME}: sorts intersections with parentheses`, rule, {
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
      `${RULE_NAME}: sorts intersections with comment at the end`,
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

    ruleTester.run(`${RULE_NAME}: sorts intersections using groups`, rule, {
      valid: [
        {
          code: dedent`
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
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: "{ name: 'a' }",
                right: 'boolean',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'boolean',
                right: 'A',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'keyof A',
                right: 'bigint',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'null',
                right: '1',
              },
            },
            {
              messageId: 'unexpectedIntersectionTypesOrder',
              data: {
                left: 'A | B',
                right: 'A & B',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: misc`, () => {
    ruleTester.run(
      `${RULE_NAME}: sets alphabetical asc sorting as default`,
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
  })
})
