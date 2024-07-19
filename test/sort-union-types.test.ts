import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-union-types'

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

    ruleTester.run(`${RULE_NAME}(${type}: sorts union types`, rule, {
      valid: [
        {
          code: dedent`
            type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Type = 'aaaa' | 'cc' | 'bbb' | 'd'
          `,
          output: dedent`
            type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "'cc'",
                right: "'bbb'",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts keyword union types`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Value =
              | boolean
              | number
              | string
              | any
              | unknown
              | null
              | undefined
              | never
              | void
              | bigint
          `,
          output: dedent`
            type Value =
              | any
              | bigint
              | boolean
              | never
              | null
              | number
              | string
              | undefined
              | unknown
              | void
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'string',
                right: 'any',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'unknown',
                right: 'null',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'undefined',
                right: 'never',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
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
          code: "Omit<T, 'b' | 'aa'>",
          output: "Omit<T, 'aa' | 'b'>",
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "'b'",
                right: "'aa'",
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
          code: 'type Type = c | bb | aaa',
          output: 'type Type = aaa | bb | c',
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'c',
                right: 'bb',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'bb',
                right: 'aaa',
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
              | { name: 'b', status: 'success' }
              | { name: 'aa', status: 'success' }
          `,
          output: dedent`
            type Type =
              | { name: 'aa', status: 'success' }
              | { name: 'b', status: 'success' }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "{ name: 'b', status: 'success' }",
                right: "{ name: 'aa', status: 'success' }",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts unions with parentheses`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Type = {
              x:
                | A
                | ((
                    value: () => void,
                  ) => D | E)
                | B[]
            }
          `,
          output: dedent`
            type Type = {
              x:
                | ((
                    value: () => void,
                  ) => D | E)
                | A
                | B[]
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'A',
                right: '( value: () => void, ) => D | E',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts unions with comment at the end`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Step = 1 | 2 | 4 | 3 | 5 | 100; // Comment
          `,
          output: dedent`
            type Step = 1 | 100 | 2 | 3 | 4 | 5; // Comment
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: '4',
                right: '3',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: '5',
                right: '100',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts unions using groups`, rule, {
      valid: [
        {
          code: dedent`
            type Type =
              | A
              | any
              | bigint
              | boolean
              | keyof A
              | typeof B
              | 'aaa'
              | 1
              | (import('path'))
              | (A extends B ? C : D)
              | { name: 'a' }
              | [A, B, C]
              | (A & B)
              | (A | B)
              | null
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
              | any
              | { name: 'a' }
              | boolean
              | A
              | keyof A
              | bigint
              | typeof B
              | 'aaa'
              | (import('path'))
              | null
              | 1
              | (A extends B ? C : D)
              | [A, B, C]
              | (A | B)
              | (A & B)
          `,
          output: dedent`
            type Type =
              | A
              | any
              | bigint
              | boolean
              | keyof A
              | typeof B
              | 'aaa'
              | 1
              | (import('path'))
              | (A extends B ? C : D)
              | { name: 'a' }
              | [A, B, C]
              | (A & B)
              | (A | B)
              | null
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
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "{ name: 'a' }",
                right: 'boolean',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'boolean',
                right: 'A',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'keyof A',
                right: 'bigint',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'null',
                right: '1',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
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
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}: sorts union types`, rule, {
      valid: [
        {
          code: dedent`
            type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Type = 'aaaa' | 'cc' | 'bbb' | 'd'
          `,
          output: dedent`
            type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "'cc'",
                right: "'bbb'",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts keyword union types`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Value =
              | boolean
              | number
              | string
              | any
              | unknown
              | null
              | undefined
              | never
              | void
              | bigint
          `,
          output: dedent`
            type Value =
              | any
              | bigint
              | boolean
              | never
              | null
              | number
              | string
              | undefined
              | unknown
              | void
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'string',
                right: 'any',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'unknown',
                right: 'null',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'undefined',
                right: 'never',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
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
          code: "Omit<T, 'b' | 'aa'>",
          output: "Omit<T, 'aa' | 'b'>",
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "'b'",
                right: "'aa'",
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
          code: 'type Type = c | bb | aaa',
          output: 'type Type = aaa | bb | c',
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'c',
                right: 'bb',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'bb',
                right: 'aaa',
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
              | { name: 'b', status: 'success' }
              | { name: 'aa', status: 'success' }
          `,
          output: dedent`
            type Type =
              | { name: 'aa', status: 'success' }
              | { name: 'b', status: 'success' }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "{ name: 'b', status: 'success' }",
                right: "{ name: 'aa', status: 'success' }",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts unions with parentheses`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Type = {
              x:
                | A
                | ((
                    value: () => void,
                  ) => D | E)
                | B[]
            }
          `,
          output: dedent`
            type Type = {
              x:
                | ((
                    value: () => void,
                  ) => D | E)
                | A
                | B[]
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'A',
                right: '( value: () => void, ) => D | E',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts unions with comment at the end`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Step = 1 | 2 | 4 | 3 | 5 | 100; // Comment
          `,
          output: dedent`
            type Step = 1 | 2 | 3 | 4 | 5 | 100; // Comment
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: '4',
                right: '3',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts unions using groups`, rule, {
      valid: [
        {
          code: dedent`
            type Type =
              | A
              | any
              | bigint
              | boolean
              | keyof A
              | typeof B
              | 'aaa'
              | 1
              | (import('path'))
              | (A extends B ? C : D)
              | { name: 'a' }
              | [A, B, C]
              | (A & B)
              | (A | B)
              | null
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
              | any
              | { name: 'a' }
              | boolean
              | A
              | keyof A
              | bigint
              | typeof B
              | 'aaa'
              | (import('path'))
              | null
              | 1
              | (A extends B ? C : D)
              | [A, B, C]
              | (A | B)
              | (A & B)
          `,
          output: dedent`
            type Type =
              | A
              | any
              | bigint
              | boolean
              | keyof A
              | typeof B
              | 'aaa'
              | 1
              | (import('path'))
              | (A extends B ? C : D)
              | { name: 'a' }
              | [A, B, C]
              | (A & B)
              | (A | B)
              | null
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
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "{ name: 'a' }",
                right: 'boolean',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'boolean',
                right: 'A',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'keyof A',
                right: 'bigint',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'null',
                right: '1',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
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

    ruleTester.run(`${RULE_NAME}(${type}: sorts union types`, rule, {
      valid: [
        {
          code: dedent`
            type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Type = 'aaaa' | 'cc' | 'bbb' | 'd'
          `,
          output: dedent`
            type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "'cc'",
                right: "'bbb'",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts keyword union types`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Value =
              | boolean
              | number
              | string
              | any
              | unknown
              | null
              | undefined
              | never
              | void
              | bigint
          `,
          output: dedent`
            type Value =
              | undefined
              | boolean
              | unknown
              | number
              | string
              | bigint
              | never
              | null
              | void
              | any
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'any',
                right: 'unknown',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'null',
                right: 'undefined',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
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
          code: "Omit<T, 'b' | 'aa'>",
          output: "Omit<T, 'aa' | 'b'>",
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "'b'",
                right: "'aa'",
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
          code: 'type Type = c | bb | aaa',
          output: 'type Type = aaa | bb | c',
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'c',
                right: 'bb',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'bb',
                right: 'aaa',
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
              | { name: 'b', status: 'success' }
              | { name: 'aa', status: 'success' }
          `,
          output: dedent`
            type Type =
              | { name: 'aa', status: 'success' }
              | { name: 'b', status: 'success' }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "{ name: 'b', status: 'success' }",
                right: "{ name: 'aa', status: 'success' }",
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts unions with parentheses`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Type = {
              x:
                | A
                | ((
                    value: () => void,
                  ) => D | E)
                | B[]
            }
          `,
          output: dedent`
            type Type = {
              x:
                | ((
                    value: () => void,
                  ) => D | E)
                | B[]
                | A
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'A',
                right: '( value: () => void, ) => D | E',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts unions with comment at the end`, rule, {
      valid: [],
      invalid: [
        {
          code: dedent`
            type Step = 1 | 2 | 4 | 3 | 5 | 100; // Comment
          `,
          output: dedent`
            type Step = 100 | 1 | 2 | 4 | 3 | 5; // Comment
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: '5',
                right: '100',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}: sorts intersections using groups`, rule, {
      valid: [
        {
          code: dedent`
            type Type =
              | A
              | boolean
              | bigint
              | any
              | typeof B
              | keyof A
              | 'aaa'
              | 1
              | (import('path'))
              | (A extends B ? C : D)
              | { name: 'a' }
              | [A, B, C]
              | (A & B)
              | (A | B)
              | null
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
              | any
              | { name: 'a' }
              | boolean
              | A
              | keyof A
              | bigint
              | typeof B
              | 'aaa'
              | (import('path'))
              | null
              | 1
              | (A extends B ? C : D)
              | [A, B, C]
              | (A | B)
              | (A & B)
          `,
          output: dedent`
            type Type =
              | A
              | boolean
              | bigint
              | any
              | typeof B
              | keyof A
              | 'aaa'
              | 1
              | (import('path'))
              | (A extends B ? C : D)
              | { name: 'a' }
              | [A, B, C]
              | (A & B)
              | (A | B)
              | null
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
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: "{ name: 'a' }",
                right: 'boolean',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'boolean',
                right: 'A',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'keyof A',
                right: 'bigint',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
              data: {
                left: 'null',
                right: '1',
              },
            },
            {
              messageId: 'unexpectedUnionTypesOrder',
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
            type SupportedNumberBase = NumberBase.BASE_10 | NumberBase.BASE_16 | NumberBase.BASE_2
          `,
          {
            code: dedent`
              type SupportedNumberBase = NumberBase.BASE_10 | NumberBase.BASE_16 | NumberBase.BASE_2
            `,
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
              type SupportedNumberBase = NumberBase.BASE_2 | NumberBase.BASE_10 | NumberBase.BASE_16
            `,
            output: dedent`
              type SupportedNumberBase = NumberBase.BASE_10 | NumberBase.BASE_16 | NumberBase.BASE_2
            `,
            errors: [
              {
                messageId: 'unexpectedUnionTypesOrder',
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
