import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import dedent from 'dedent'

import rule from '../../rules/sort-union-types'
import { Alphabet } from '../../utils/alphabet'

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
      invalid: [
        {
          errors: [
            {
              data: {
                right: "'bbb'",
                left: "'cc'",
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
            type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
          `,
          code: dedent`
            type Type = 'aaaa' | 'cc' | 'bbb' | 'd'
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts keyword union types`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                left: 'string',
                right: 'any',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
            {
              data: {
                left: 'unknown',
                right: 'null',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
            {
              data: {
                left: 'undefined',
                right: 'never',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
            {
              data: {
                right: 'bigint',
                left: 'void',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
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
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: works with generics`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: "'aa'",
                left: "'b'",
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: "Omit<T, 'aa' | 'b'>",
          code: "Omit<T, 'b' | 'aa'>",
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: works with type references`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'bb',
                left: 'c',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
            {
              data: {
                right: 'aaa',
                left: 'bb',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: 'type Type = aaa | bb | c',
          code: 'type Type = c | bb | aaa',
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: works with type references`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: "{ name: 'aa', status: 'success' }",
                left: "{ name: 'b', status: 'success' }",
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
            type Type =
              | { name: 'aa', status: 'success' }
              | { name: 'b', status: 'success' }
          `,
          code: dedent`
            type Type =
              | { name: 'b', status: 'success' }
              | { name: 'aa', status: 'success' }
          `,
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: sorts unions with parentheses`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '( value: () => void, ) => D | E',
                left: 'A',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
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
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: sorts unions with comment at the end`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '3',
                left: '4',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
            {
              data: {
                right: '100',
                left: '5',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
            type Step = 1 | 100 | 2 | 3 | 4 | 5; // Comment
          `,
          code: dedent`
            type Step = 1 | 2 | 4 | 3 | 5 | 100; // Comment
          `,
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: sorts unions using groups`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                left: "{ name: 'a' }",
                rightGroup: 'keyword',
                leftGroup: 'object',
                right: 'boolean',
              },
              messageId: 'unexpectedUnionTypesGroupOrder',
            },
            {
              data: {
                leftGroup: 'keyword',
                rightGroup: 'named',
                left: 'boolean',
                right: 'A',
              },
              messageId: 'unexpectedUnionTypesGroupOrder',
            },
            {
              data: {
                leftGroup: 'operator',
                rightGroup: 'keyword',
                left: 'keyof A',
                right: 'bigint',
              },
              messageId: 'unexpectedUnionTypesGroupOrder',
            },
            {
              data: {
                rightGroup: 'literal',
                leftGroup: 'nullish',
                left: 'null',
                right: '1',
              },
              messageId: 'unexpectedUnionTypesGroupOrder',
            },
            {
              data: {
                rightGroup: 'intersection',
                leftGroup: 'union',
                right: 'A & B',
                left: 'A | B',
              },
              messageId: 'unexpectedUnionTypesGroupOrder',
            },
          ],
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
        },
      ],
      valid: [
        {
          code: dedent`
            type Type =
              | A
              | intrinsic
              | SomeClass['name']
              | string[]
              | any
              | bigint
              | boolean
              | number
              | this
              | unknown
              | keyof { a: string; b: number }
              | keyof A
              | typeof B
              | 'aaa'
              | \`\${A}\`
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
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'A',
                  left: 'D',
                },
                messageId: 'unexpectedUnionTypesOrder',
              },
              {
                data: {
                  right: 'B',
                  left: 'E',
                },
                messageId: 'unexpectedUnionTypesOrder',
              },
            ],
            output: dedent`
              type Type =
                A |
                D |

                C |

                B |
                E
            `,
            code: dedent`
              type Type =
                D |
                A |

                C |

                E |
                B
            `,
            options: [
              {
                partitionByNewLine: true,
                type: 'alphabetical',
              },
            ],
          },
        ],
        valid: [],
      },
    )

    describe('partition comments', () => {
      ruleTester.run(
        `${ruleName}(${type}): allows to use partition comments`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'BBB',
                    left: 'D',
                  },
                  messageId: 'unexpectedUnionTypesOrder',
                },
                {
                  data: {
                    right: 'FFF',
                    left: 'GG',
                  },
                  messageId: 'unexpectedUnionTypesOrder',
                },
              ],
              output: dedent`
                type T =
                  // Part: A
                  // Not partition comment
                  BBB |
                  CC |
                  D |
                  // Part: B
                  AAA |
                  E |
                  // Part: C
                  // Not partition comment
                  FFF |
                  GG
              `,
              code: dedent`
                type T =
                  // Part: A
                  CC |
                  D |
                  // Not partition comment
                  BBB |
                  // Part: B
                  AAA |
                  E |
                  // Part: C
                  GG |
                  // Not partition comment
                  FFF
              `,
              options: [
                {
                  ...options,
                  partitionByComment: '^Part*',
                },
              ],
            },
            {
              errors: [
                {
                  data: {
                    right: 'BBB',
                    left: 'D',
                  },
                  messageId: 'unexpectedUnionTypesOrder',
                },
                {
                  data: {
                    right: 'FFF',
                    left: 'GG',
                  },
                  messageId: 'unexpectedUnionTypesOrder',
                },
              ],
              output: dedent`
                type T =
                  // Part: A
                  | BBB
                  | CC
                  // Not partition comment
                  | D
                  // Part: B
                  | AAA
                  | E
                  // Part: C
                  | FFF
                  // Not partition comment
                  | GG
              `,
              code: dedent`
                type T =
                  // Part: A
                  | CC
                  | D
                  // Not partition comment
                  | BBB
                  // Part: B
                  | AAA
                  | E
                  // Part: C
                  | GG
                  // Not partition comment
                  | FFF
              `,
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
                type T =
                  // Comment
                  BB |
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
          invalid: [
            {
              output: dedent`
                  type T =
                    /* Partition Comment */
                    // Part: A
                    D |
                    // Part: B
                    AAA |
                    BB |
                    C |
                    /* Other */
                    E
                `,
              code: dedent`
                  type T =
                    /* Partition Comment */
                    // Part: A
                    D |
                    // Part: B
                    AAA |
                    C |
                    BB |
                    /* Other */
                    E
                `,
              errors: [
                {
                  data: {
                    right: 'BB',
                    left: 'C',
                  },
                  messageId: 'unexpectedUnionTypesOrder',
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
              type T =
                E |
                F |
                // I am a partition comment because I don't have f o o
                A |
                B
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

      describe(`${ruleName}(${type}): allows to use "partitionByComment.line"`, () => {
        ruleTester.run(`${ruleName}(${type}): ignores block comments`, rule, {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'A',
                    left: 'B',
                  },
                  messageId: 'unexpectedUnionTypesOrder',
                },
              ],
              options: [
                {
                  ...options,
                  partitionByComment: {
                    line: true,
                  },
                },
              ],
              output: dedent`
                type Type =
                  /* Comment */
                  A |
                  B
              `,
              code: dedent`
                type Type =
                  B |
                  /* Comment */
                  A
              `,
            },
          ],
          valid: [],
        })

        ruleTester.run(
          `${ruleName}(${type}): allows to use all comments as parts`,
          rule,
          {
            valid: [
              {
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      line: true,
                    },
                  },
                ],
                code: dedent`
                  type Type =
                    B |
                    // Comment
                    A
                `,
              },
            ],
            invalid: [],
          },
        )

        ruleTester.run(
          `${ruleName}(${type}): allows to use multiple partition comments`,
          rule,
          {
            valid: [
              {
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      line: ['A', 'B'],
                    },
                  },
                ],
                code: dedent`
                  type Type =
                    C |
                    // B
                    B |
                    // A
                    A
                  `,
              },
            ],
            invalid: [],
          },
        )

        ruleTester.run(
          `${ruleName}(${type}): allows to use regex for partition comments`,
          rule,
          {
            valid: [
              {
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      line: ['^(?!.*foo).*$'],
                    },
                  },
                ],
                code: dedent`
                  type Type =
                    B |
                    // I am a partition comment because I don't have f o o
                    A
                `,
              },
            ],
            invalid: [],
          },
        )
      })

      describe(`${ruleName}(${type}): allows to use "partitionByComment.block"`, () => {
        ruleTester.run(`${ruleName}(${type}): ignores line comments`, rule, {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: 'A',
                    left: 'B',
                  },
                  messageId: 'unexpectedUnionTypesOrder',
                },
              ],
              options: [
                {
                  ...options,
                  partitionByComment: {
                    block: true,
                  },
                },
              ],
              output: dedent`
                type Type =
                  // Comment
                  A |
                  B
              `,
              code: dedent`
                type Type =
                  B |
                  // Comment
                  A
             `,
            },
          ],
          valid: [],
        })

        ruleTester.run(
          `${ruleName}(${type}): allows to use all comments as parts`,
          rule,
          {
            valid: [
              {
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      block: true,
                    },
                  },
                ],
                code: dedent`
                  type Type =
                    B |
                    /* Comment */
                    A
                `,
              },
            ],
            invalid: [],
          },
        )

        ruleTester.run(
          `${ruleName}(${type}): allows to use multiple partition comments`,
          rule,
          {
            valid: [
              {
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      block: ['A', 'B'],
                    },
                  },
                ],
                code: dedent`
                  type Type =
                    C |
                    /* B */
                    B |
                    /* A */
                    A
                `,
              },
            ],
            invalid: [],
          },
        )

        ruleTester.run(
          `${ruleName}(${type}): allows to use regex for partition comments`,
          rule,
          {
            valid: [
              {
                options: [
                  {
                    ...options,
                    partitionByComment: {
                      block: ['^(?!.*foo).*$'],
                    },
                  },
                ],
                code: dedent`
                  type Type =
                    B |
                    /* I am a partition comment because I don't have f o o */
                    A
                `,
              },
            ],
            invalid: [],
          },
        )
      })
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
            options: [
              {
                ...options,
                specialCharacters: 'trim',
              },
            ],
            code: dedent`
              type T =
                _A |
                B |
                _C
            `,
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
            options: [
              {
                ...options,
                specialCharacters: 'remove',
              },
            ],
            code: dedent`
              type T =
                AB |
                A_C
            `,
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use locale`, rule, {
      valid: [
        {
          code: dedent`
              type T =
                你好 |
                世界 |
                a |
                A |
                b |
                B
            `,
          options: [{ ...options, locales: 'zh-CN' }],
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
                    left: '() => null',
                    right: 'Y',
                  },
                  messageId: 'extraSpacingBetweenUnionTypes',
                },
                {
                  data: {
                    right: 'B',
                    left: 'Z',
                  },
                  messageId: 'unexpectedUnionTypesOrder',
                },
                {
                  data: {
                    right: 'B',
                    left: 'Z',
                  },
                  messageId: 'extraSpacingBetweenUnionTypes',
                },
              ],
              options: [
                {
                  ...options,
                  groups: ['function', 'unknown'],
                  newlinesBetween: 'never',
                },
              ],
              code: dedent`
                type T =
                  (() => null)


                 | Y
                | Z

                    | B
              `,
              output: dedent`
                type T =
                  (() => null)
                 | B
                | Y
                    | Z
              `,
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
                    left: '() => null',
                    right: 'Z',
                  },
                  messageId: 'extraSpacingBetweenUnionTypes',
                },
                {
                  data: {
                    right: 'Y',
                    left: 'Z',
                  },
                  messageId: 'unexpectedUnionTypesOrder',
                },
                {
                  data: {
                    right: '"A"',
                    left: 'Y',
                  },
                  messageId: 'missedSpacingBetweenUnionTypes',
                },
              ],
              options: [
                {
                  ...options,
                  groups: ['function', 'unknown', 'literal'],
                  newlinesBetween: 'always',
                },
              ],
              output: dedent`
                type T =
                  (() => null)

                 | Y
                | Z

                    | "A"
                `,
              code: dedent`
                type T =
                  (() => null)


                 | Z
                | Y
                    | "A"
              `,
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): allows to use "newlinesBetween" inside groups`,
        rule,
        {
          invalid: [
            {
              errors: [
                {
                  data: {
                    right: '{ a: string }',
                    left: '() => void',
                  },
                  messageId: 'missedSpacingBetweenUnionTypes',
                },
                {
                  data: {
                    left: '{ a: string }',
                    right: 'A',
                  },
                  messageId: 'extraSpacingBetweenUnionTypes',
                },
                {
                  data: {
                    right: '[A]',
                    left: 'A',
                  },
                  messageId: 'extraSpacingBetweenUnionTypes',
                },
              ],
              options: [
                {
                  ...options,
                  groups: [
                    'function',
                    { newlinesBetween: 'always' },
                    'object',
                    { newlinesBetween: 'always' },
                    'named',
                    { newlinesBetween: 'never' },
                    'tuple',
                    { newlinesBetween: 'ignore' },
                    'nullish',
                  ],
                  newlinesBetween: 'always',
                },
              ],
              output: dedent`
                type Type =
                  (() => void) |

                  { a: string } |

                  A |
                  [A] |


                  null
              `,
              code: dedent`
                type Type =
                  (() => void) |
                  { a: string } |


                  A |

                  [A] |


                  null
              `,
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
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedUnionTypesOrder',
              },
            ],
            output: dedent`
              type T =
                | A | B
            `,
            code: dedent`
              type T =
                | B | A
            `,
            options: [options],
          },
          {
            errors: [
              {
                data: {
                  right: 'A',
                  left: 'B',
                },
                messageId: 'unexpectedUnionTypesOrder',
              },
            ],
            output: dedent`
              type T =
                A | B
            `,
            code: dedent`
              type T =
                B | A
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

    ruleTester.run(`${ruleName}(${type}: sorts union types`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: "'bbb'",
                left: "'cc'",
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
            type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
          `,
          code: dedent`
            type Type = 'aaaa' | 'cc' | 'bbb' | 'd'
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts keyword union types`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                left: 'string',
                right: 'any',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
            {
              data: {
                left: 'unknown',
                right: 'null',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
            {
              data: {
                left: 'undefined',
                right: 'never',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
            {
              data: {
                right: 'bigint',
                left: 'void',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
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
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: works with generics`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: "'aa'",
                left: "'b'",
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: "Omit<T, 'aa' | 'b'>",
          code: "Omit<T, 'b' | 'aa'>",
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: works with type references`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'bb',
                left: 'c',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
            {
              data: {
                right: 'aaa',
                left: 'bb',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: 'type Type = aaa | bb | c',
          code: 'type Type = c | bb | aaa',
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: works with type references`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: "{ name: 'aa', status: 'success' }",
                left: "{ name: 'b', status: 'success' }",
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
            type Type =
              | { name: 'aa', status: 'success' }
              | { name: 'b', status: 'success' }
          `,
          code: dedent`
            type Type =
              | { name: 'b', status: 'success' }
              | { name: 'aa', status: 'success' }
          `,
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: sorts unions with parentheses`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '( value: () => void, ) => D | E',
                left: 'A',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
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
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: sorts unions with comment at the end`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '3',
                left: '4',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
            type Step = 1 | 2 | 3 | 4 | 5 | 100; // Comment
          `,
          code: dedent`
            type Step = 1 | 2 | 4 | 3 | 5 | 100; // Comment
          `,
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: sorts unions using groups`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                left: "{ name: 'a' }",
                rightGroup: 'keyword',
                leftGroup: 'object',
                right: 'boolean',
              },
              messageId: 'unexpectedUnionTypesGroupOrder',
            },
            {
              data: {
                leftGroup: 'keyword',
                rightGroup: 'named',
                left: 'boolean',
                right: 'A',
              },
              messageId: 'unexpectedUnionTypesGroupOrder',
            },
            {
              data: {
                leftGroup: 'operator',
                rightGroup: 'keyword',
                left: 'keyof A',
                right: 'bigint',
              },
              messageId: 'unexpectedUnionTypesGroupOrder',
            },
            {
              data: {
                rightGroup: 'literal',
                leftGroup: 'nullish',
                left: 'null',
                right: '1',
              },
              messageId: 'unexpectedUnionTypesGroupOrder',
            },
            {
              data: {
                rightGroup: 'intersection',
                leftGroup: 'union',
                right: 'A & B',
                left: 'A | B',
              },
              messageId: 'unexpectedUnionTypesGroupOrder',
            },
          ],
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
          output: dedent`
            type Type =
              | A
              | any
              | bigint
              | boolean
              | keyof A
              | typeof B
              | 1
              | 'aaa'
              | (import('path'))
              | (A extends B ? C : D)
              | { name: 'a' }
              | [A, B, C]
              | (A & B)
              | (A | B)
              | null
          `,
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
        },
      ],
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
              | 1
              | 'aaa'
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
    })
  })

  describe(`${ruleName}: sorts by custom alphabet`, () => {
    let type = 'custom'

    let alphabet = Alphabet.generateRecommendedAlphabet()
      .sortByLocaleCompare('en-US')
      .getCharacters()
    let options = {
      type: 'custom',
      order: 'asc',
      alphabet,
    } as const

    ruleTester.run(`${ruleName}(${type}: sorts union types`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: "'bbb'",
                left: "'cc'",
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
            type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
          `,
          code: dedent`
            type Type = 'aaaa' | 'cc' | 'bbb' | 'd'
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
          `,
          options: [options],
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
      invalid: [
        {
          errors: [
            {
              data: {
                right: "'bbb'",
                left: "'cc'",
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
            type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
          `,
          code: dedent`
            type Type = 'aaaa' | 'cc' | 'bbb' | 'd'
          `,
          options: [options],
        },
      ],
      valid: [
        {
          code: dedent`
            type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
          `,
          options: [options],
        },
      ],
    })

    ruleTester.run(`${ruleName}: sorts keyword union types`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'unknown',
                left: 'any',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
            {
              data: {
                right: 'undefined',
                left: 'null',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
            {
              data: {
                right: 'bigint',
                left: 'void',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
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
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: works with generics`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: "'aa'",
                left: "'b'",
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: "Omit<T, 'aa' | 'b'>",
          code: "Omit<T, 'b' | 'aa'>",
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: works with type references`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: 'bb',
                left: 'c',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
            {
              data: {
                right: 'aaa',
                left: 'bb',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: 'type Type = aaa | bb | c',
          code: 'type Type = c | bb | aaa',
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: works with type references`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: "{ name: 'aa', status: 'success' }",
                left: "{ name: 'b', status: 'success' }",
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
            type Type =
              | { name: 'aa', status: 'success' }
              | { name: 'b', status: 'success' }
          `,
          code: dedent`
            type Type =
              | { name: 'b', status: 'success' }
              | { name: 'aa', status: 'success' }
          `,
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: sorts unions with parentheses`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '( value: () => void, ) => D | E',
                left: 'A',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
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
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: sorts unions with comment at the end`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                right: '100',
                left: '5',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
            type Step = 100 | 1 | 2 | 4 | 3 | 5; // Comment
          `,
          code: dedent`
            type Step = 1 | 2 | 4 | 3 | 5 | 100; // Comment
          `,
          options: [options],
        },
      ],
      valid: [],
    })

    ruleTester.run(`${ruleName}: sorts intersections using groups`, rule, {
      invalid: [
        {
          errors: [
            {
              data: {
                left: "{ name: 'a' }",
                rightGroup: 'keyword',
                leftGroup: 'object',
                right: 'boolean',
              },
              messageId: 'unexpectedUnionTypesGroupOrder',
            },
            {
              data: {
                leftGroup: 'keyword',
                rightGroup: 'named',
                left: 'boolean',
                right: 'A',
              },
              messageId: 'unexpectedUnionTypesGroupOrder',
            },
            {
              data: {
                leftGroup: 'operator',
                rightGroup: 'keyword',
                left: 'keyof A',
                right: 'bigint',
              },
              messageId: 'unexpectedUnionTypesGroupOrder',
            },
            {
              data: {
                rightGroup: 'literal',
                leftGroup: 'nullish',
                left: 'null',
                right: '1',
              },
              messageId: 'unexpectedUnionTypesGroupOrder',
            },
            {
              data: {
                rightGroup: 'intersection',
                leftGroup: 'union',
                right: 'A & B',
                left: 'A | B',
              },
              messageId: 'unexpectedUnionTypesGroupOrder',
            },
          ],
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
        },
      ],
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
    })
  })

  describe(`${ruleName}: validating group configuration`, () => {
    ruleTester.run(`${ruleName}: allows predefined groups`, rule, {
      valid: [
        {
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
          code: dedent`
            type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
          `,
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
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'NumberBase.BASE_10',
                  left: 'NumberBase.BASE_2',
                },
                messageId: 'unexpectedUnionTypesOrder',
              },
            ],
            output: dedent`
              type SupportedNumberBase = NumberBase.BASE_10 | NumberBase.BASE_16 | NumberBase.BASE_2
            `,
            code: dedent`
              type SupportedNumberBase = NumberBase.BASE_2 | NumberBase.BASE_10 | NumberBase.BASE_16
            `,
          },
        ],
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
      },
    )

    ruleTester.run(`${ruleName}: should ignore whitespaces`, rule, {
      valid: [
        {
          code: dedent`
            type T =
            { a: string } |
            {  b: string }
          `,
          options: [{}],
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
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
          type T =
            B
            | C
            // eslint-disable-next-line
            | A
          `,
          code: dedent`
          type T =
            C
            | B
            // eslint-disable-next-line
            | A
        `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'C',
                left: 'D',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
            {
              data: {
                right: 'B',
                left: 'A',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
            type T =
              B
              | C
              // eslint-disable-next-line
              | A
              | D
          `,
          code: dedent`
            type T =
              D
              | C
              // eslint-disable-next-line
              | A
              | B
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
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
          type T =
            B
            | C
            | A // eslint-disable-line
          `,
          code: dedent`
          type T =
            C
            | B
            | A // eslint-disable-line
        `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
          type T =
            B
            | C
            /* eslint-disable-next-line */
            | A
          `,
          code: dedent`
          type T =
            C
            | B
            /* eslint-disable-next-line */
            | A
        `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
          type T =
            B
            | C
            | A /* eslint-disable-line */
          `,
          code: dedent`
          type T =
            C
            | B
            | A /* eslint-disable-line */
        `,
          options: [{}],
        },
        {
          output: dedent`
            type Type =
              A
              | D
              /* eslint-disable */
              | C
              | B
              // Shouldn't move
              /* eslint-enable */
              | E
          `,
          code: dedent`
            type Type =
              D
              | E
              /* eslint-disable */
              | C
              | B
              // Shouldn't move
              /* eslint-enable */
              | A
          `,
          errors: [
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
          type T =
            B
            | C
            // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
            | A
          `,
          code: dedent`
          type T =
            C
            | B
            // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
            | A
        `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
          type T =
            B
            | C
            | A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
          `,
          code: dedent`
          type T =
            C
            | B
            | A // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
        `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
          type T =
            B
            | C
            /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
            | A
          `,
          code: dedent`
          type T =
            C
            | B
            /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
            | A
        `,
          options: [{}],
        },
        {
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          output: dedent`
          type T =
            B
            | C
            | A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
          `,
          code: dedent`
          type T =
            C
            | B
            | A /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
        `,
          options: [{}],
        },
        {
          output: dedent`
            type Type =
              A
              | D
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              | C
              | B
              // Shouldn't move
              /* eslint-enable */
              | E
          `,
          code: dedent`
            type Type =
              D
              | E
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
              | C
              | B
              // Shouldn't move
              /* eslint-enable */
              | A
          `,
          errors: [
            {
              data: {
                right: 'A',
                left: 'B',
              },
              messageId: 'unexpectedUnionTypesOrder',
            },
          ],
          options: [{}],
        },
      ],
      valid: [],
    })
  })
})
