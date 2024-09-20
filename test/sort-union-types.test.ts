import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule from '../rules/sort-union-types'

let ruleName = 'sort-union-types'

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

    ruleTester.run(`${ruleName}(${type}: sorts union types`, rule, {
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

    ruleTester.run(`${ruleName}: sorts keyword union types`, rule, {
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

    ruleTester.run(`${ruleName}: works with generics`, rule, {
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

    ruleTester.run(`${ruleName}: works with type references`, rule, {
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

    ruleTester.run(`${ruleName}: works with type references`, rule, {
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

    ruleTester.run(`${ruleName}: sorts unions with parentheses`, rule, {
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

    ruleTester.run(`${ruleName}: sorts unions with comment at the end`, rule, {
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

    ruleTester.run(`${ruleName}: sorts unions using groups`, rule, {
      valid: [
        {
          code: dedent`
            type Type =
              | A
              | SomeClass['name']
              | string[]
              | any
              | bigint
              | boolean
              | keyof A
              | typeof B
              | 'aaa'
              | 1
              | (new () => SomeClass)
              | (import('path'))
              | (A extends B ? C : D)
              | { [P in keyof T]: T[P] }
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
              messageId: 'unexpectedUnionTypesGroupOrder',
              data: {
                left: "{ name: 'a' }",
                leftGroup: 'object',
                right: 'boolean',
                rightGroup: 'keyword',
              },
            },
            {
              messageId: 'unexpectedUnionTypesGroupOrder',
              data: {
                left: 'boolean',
                leftGroup: 'keyword',
                right: 'A',
                rightGroup: 'named',
              },
            },
            {
              messageId: 'unexpectedUnionTypesGroupOrder',
              data: {
                left: 'keyof A',
                leftGroup: 'operator',
                right: 'bigint',
                rightGroup: 'keyword',
              },
            },
            {
              messageId: 'unexpectedUnionTypesGroupOrder',
              data: {
                left: 'null',
                leftGroup: 'nullish',
                right: '1',
                rightGroup: 'literal',
              },
            },
            {
              messageId: 'unexpectedUnionTypesGroupOrder',
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

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}: sorts union types`, rule, {
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

    ruleTester.run(`${ruleName}: sorts keyword union types`, rule, {
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

    ruleTester.run(`${ruleName}: works with generics`, rule, {
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

    ruleTester.run(`${ruleName}: works with type references`, rule, {
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

    ruleTester.run(`${ruleName}: works with type references`, rule, {
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

    ruleTester.run(`${ruleName}: sorts unions with parentheses`, rule, {
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

    ruleTester.run(`${ruleName}: sorts unions with comment at the end`, rule, {
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

    ruleTester.run(`${ruleName}: sorts unions using groups`, rule, {
      valid: [
        {
          code: dedent`
            type Type =
              | A
              | SomeClass['name']
              | string[]
              | any
              | bigint
              | boolean
              | keyof A
              | typeof B
              | 'aaa'
              | 1
              | (new () => SomeClass)
              | (import('path'))
              | (A extends B ? C : D)
              | { [P in keyof T]: T[P] }
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
              messageId: 'unexpectedUnionTypesGroupOrder',
              data: {
                left: "{ name: 'a' }",
                leftGroup: 'object',
                right: 'boolean',
                rightGroup: 'keyword',
              },
            },
            {
              messageId: 'unexpectedUnionTypesGroupOrder',
              data: {
                left: 'boolean',
                leftGroup: 'keyword',
                right: 'A',
                rightGroup: 'named',
              },
            },
            {
              messageId: 'unexpectedUnionTypesGroupOrder',
              data: {
                left: 'keyof A',
                leftGroup: 'operator',
                right: 'bigint',
                rightGroup: 'keyword',
              },
            },
            {
              messageId: 'unexpectedUnionTypesGroupOrder',
              data: {
                left: 'null',
                leftGroup: 'nullish',
                right: '1',
                rightGroup: 'literal',
              },
            },
            {
              messageId: 'unexpectedUnionTypesGroupOrder',
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

    ruleTester.run(`${ruleName}(${type}: sorts union types`, rule, {
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

    ruleTester.run(`${ruleName}: sorts keyword union types`, rule, {
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

    ruleTester.run(`${ruleName}: works with generics`, rule, {
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

    ruleTester.run(`${ruleName}: works with type references`, rule, {
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

    ruleTester.run(`${ruleName}: works with type references`, rule, {
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

    ruleTester.run(`${ruleName}: sorts unions with parentheses`, rule, {
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

    ruleTester.run(`${ruleName}: sorts unions with comment at the end`, rule, {
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

    ruleTester.run(`${ruleName}: sorts intersections using groups`, rule, {
      valid: [
        {
          code: dedent`
            type Type =
              | SomeClass['name']
              | string[]
              | A
              | boolean
              | bigint
              | any
              | typeof B
              | keyof A
              | 'aaa'
              | 1
              | (new () => SomeClass)
              | (import('path'))
              | (A extends B ? C : D)
              | { [P in keyof T]: T[P] }
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
              messageId: 'unexpectedUnionTypesGroupOrder',
              data: {
                left: "{ name: 'a' }",
                leftGroup: 'object',
                right: 'boolean',
                rightGroup: 'keyword',
              },
            },
            {
              messageId: 'unexpectedUnionTypesGroupOrder',
              data: {
                left: 'boolean',
                leftGroup: 'keyword',
                right: 'A',
                rightGroup: 'named',
              },
            },
            {
              messageId: 'unexpectedUnionTypesGroupOrder',
              data: {
                left: 'keyof A',
                leftGroup: 'operator',
                right: 'bigint',
                rightGroup: 'keyword',
              },
            },
            {
              messageId: 'unexpectedUnionTypesGroupOrder',
              data: {
                left: 'null',
                leftGroup: 'nullish',
                right: '1',
                rightGroup: 'literal',
              },
            },
            {
              messageId: 'unexpectedUnionTypesGroupOrder',
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
            type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
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

    ruleTester.run(
      `${ruleName}: should ignore unknown group if not referenced in groups`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              type Type = 0 | D | 1 | C | 2
            `,
            output: dedent`
              type Type = 0 | C | 1 | D | 2
            `,
            options: [
              {
                type: 'alphabetical',
                groups: ['named'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedUnionTypesGroupOrder',
                data: {
                  left: 'D',
                  leftGroup: 'named',
                  right: '1',
                  rightGroup: 'unknown',
                },
              },
              {
                messageId: 'unexpectedUnionTypesGroupOrder',
                data: {
                  left: '1',
                  leftGroup: 'unknown',
                  right: 'C',
                  rightGroup: 'named',
                },
              },
            ],
          },
        ],
      },
    )
  })
})
