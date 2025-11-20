import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import rule, {
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
} from '../../rules/sort-union-types'
import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { Alphabet } from '../../utils/alphabet'

describe('sort-union-types', () => {
  let { invalid, valid } = createRuleTester({
    name: 'sort-union-types',
    parser: typescriptParser,
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('sorts union types', async () => {
      await valid({
        code: dedent`
          type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: "'bbb'",
              left: "'cc'",
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
        `,
        code: dedent`
          type Type = 'aaaa' | 'cc' | 'bbb' | 'd'
        `,
        options: [options],
      })
    })

    it('sorts keyword union types', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: 'string',
              right: 'any',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              left: 'unknown',
              right: 'null',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              left: 'undefined',
              right: 'never',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'bigint',
              left: 'void',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('works with generics', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: "'aa'",
              left: "'b'",
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: "Omit<T, 'aa' | 'b'>",
        code: "Omit<T, 'b' | 'aa'>",
        options: [options],
      })
    })

    it('sorts type references', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'c',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'aaa',
              left: 'bb',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: 'type Type = aaa | bb | c',
        code: 'type Type = c | bb | aaa',
        options: [options],
      })
    })

    it('sorts unions with objects', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: "{ name: 'aa', status: 'success' }",
              left: "{ name: 'b', status: 'success' }",
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('sorts unions with parentheses', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: '( value: () => void, ) => D | E',
              left: 'A',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('preserves inline comments at the end of union', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: '3',
              left: '4',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: '100',
              left: '5',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type Step = 1 | 100 | 2 | 3 | 4 | 5; // Comment
        `,
        code: dedent`
          type Step = 1 | 2 | 4 | 3 | 5 | 100; // Comment
        `,
        options: [options],
      })
    })

    it('sorts unions by groups', async () => {
      await valid({
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
      })

      await invalid({
        errors: [
          {
            data: {
              left: "{ name: 'a' }",
              rightGroup: 'keyword',
              leftGroup: 'object',
              right: 'boolean',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
          {
            data: {
              leftGroup: 'keyword',
              rightGroup: 'named',
              left: 'boolean',
              right: 'A',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
          {
            data: {
              leftGroup: 'operator',
              rightGroup: 'keyword',
              left: 'keyof A',
              right: 'bigint',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
          {
            data: {
              rightGroup: 'literal',
              leftGroup: 'nullish',
              left: 'null',
              right: '1',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
          {
            data: {
              rightGroup: 'intersection',
              leftGroup: 'union',
              right: 'A & B',
              left: 'A | B',
            },
            messageId: GROUP_ORDER_ERROR_ID,
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
      })
    })

    it('sorts within partitions when separated by newlines', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'D',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'B',
              left: 'E',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('creates partitions based on matching comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'BBB',
              left: 'D',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'FFF',
              left: 'GG',
            },
            messageId: ORDER_ERROR_ID,
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
            partitionByComment: '^Part',
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'BBB',
              left: 'D',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'FFF',
              left: 'GG',
            },
            messageId: ORDER_ERROR_ID,
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
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('treats every comment as partition boundary when set to true', async () => {
      await valid({
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
      })
    })

    it('supports multiple partition comment patterns', async () => {
      await invalid({
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
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: ['Partition Comment', 'Part:', 'Other'],
          },
        ],
      })
    })

    it('supports regex patterns for partition comments', async () => {
      await valid({
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
      })
    })

    it('ignores block comments when line comments are specified', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('uses line comments as partition boundaries', async () => {
      await valid({
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
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
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
      })
    })

    it('supports regex patterns for line comments', async () => {
      await valid({
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
      })
    })

    it('ignores line comments when block comments are specified', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('uses block comments as partition boundaries', async () => {
      await valid({
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
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
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
      })
    })

    it('supports regex patterns for block comments', async () => {
      await valid({
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
      })
    })

    it('ignores special characters at start when trimming', async () => {
      await valid({
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
      })
    })

    it('ignores special characters completely when removing', async () => {
      await valid({
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
      })
    })

    it('sorts elements according to locale-specific rules', async () => {
      await valid({
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
      })
    })

    it('removes newlines between groups when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: '() => null',
              right: 'Y',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
          {
            data: {
              right: 'B',
              left: 'Z',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'B',
              left: 'Z',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
        ],
        options: [
          {
            ...options,
            groups: ['function', 'unknown'],
            newlinesBetween: 0,
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
      })
    })

    it('applies inline newline settings between specific groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: '{ a: string }',
              left: '() => void',
            },
            messageId: MISSED_SPACING_ERROR_ID,
          },
          {
            data: {
              left: '{ a: string }',
              right: 'A',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
          {
            data: {
              right: '[A]',
              left: 'A',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
        ],
        options: [
          {
            ...options,
            groups: [
              'function',
              { newlinesBetween: 1 },
              'object',
              { newlinesBetween: 1 },
              'named',
              { newlinesBetween: 0 },
              'tuple',
              { newlinesBetween: 'ignore' },
              'nullish',
            ],
            newlinesBetween: 1,
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
      })
    })

    it.each([
      [2, 0],
      [2, 'ignore'],
      [0, 2],
      ['ignore', 2],
    ])(
      'enforces 2 newlines when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              groups: [
                'named',
                'tuple',
                { newlinesBetween: groupNewlinesBetween },
                'nullish',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'null',
                left: 'A',
              },
              messageId: MISSED_SPACING_ERROR_ID,
            },
          ],
          output: dedent`
            type T =
              A |


              null
          `,
          code: dedent`
            type T =
              A |
              null
          `,
        })
      },
    )

    it.each([1, 2, 'ignore', 0])(
      'removes newlines when 0 overrides global %s between specific groups',
      async globalNewlinesBetween => {
        await invalid({
          options: [
            {
              ...options,
              groups: [
                'named',
                { newlinesBetween: 0 },
                'tuple',
                { newlinesBetween: 0 },
                'nullish',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'null',
                left: 'A',
              },
              messageId: EXTRA_SPACING_ERROR_ID,
            },
          ],
          output: dedent`
            type T =
              A |
              null
          `,
          code: dedent`
            type T =
              A |

              null
          `,
        })
      },
    )

    it.each([
      ['ignore', 0],
      [0, 'ignore'],
    ])(
      'accepts any spacing when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await valid({
          options: [
            {
              ...options,
              groups: [
                'named',
                'tuple',
                { newlinesBetween: groupNewlinesBetween },
                'nullish',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            type T =
              A |

              null
          `,
        })

        await valid({
          options: [
            {
              ...options,
              groups: [
                'named',
                'tuple',
                { newlinesBetween: groupNewlinesBetween },
                'nullish',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            type T =
              A |
              null
          `,
        })
      },
    )

    it('preserves inline comments when reordering elements', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'literal',
              leftGroup: 'named',
              right: "'a'",
              left: 'B',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        options: [
          {
            groups: ['literal', 'named'],
            newlinesBetween: 1,
          },
        ],
        output: dedent`
          type T =
            | 'a' // Comment after

            | B
            | C
        `,
        code: dedent`
          type T =
            | B
            | 'a' // Comment after

            | C
        `,
      })
    })

    it('preserves partition boundaries regardless of newlinesBetween 0', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'a',
                groupName: 'a',
              },
            ],
            groups: ['a', 'unknown'],
            partitionByComment: true,
            newlinesBetween: 0,
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type Type =
            | a

            // Partition comment

            | b
            | c
        `,
        code: dedent`
          type Type =
            | a

            // Partition comment

            | c
            | b
        `,
      })
    })

    it('sorts single-line union types correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: ORDER_ERROR_ID,
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
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('allows overriding options in groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: MISSED_SPACING_ERROR_ID,
          },
        ],
        options: [
          {
            groups: [
              {
                type: 'alphabetical',
                newlinesInside: 1,
                group: 'unknown',
                order: 'desc',
              },
            ],
            type: 'unsorted',
          },
        ],
        output: dedent`
          type T =
            | b

            | a
        `,
        code: dedent`
          type T =
            | a
            | b
        `,
      })
    })

    it('applies custom groups based on element selectors', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'namedElements',
              leftGroup: 'unknown',
              left: 'null',
              right: 'a',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'namedElements',
                selector: 'named',
              },
            ],
            groups: ['namedElements', 'unknown'],
          },
        ],
        output: dedent`
          type T =
            | a
            | null
        `,
        code: dedent`
          type T =
            | null
            | a
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array of patterns', ['noMatch', 'hello']],
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])(
      'groups elements by name pattern - %s',
      async (_, elementNamePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'namedStartingWithHello',
                  elementNamePattern,
                  selector: 'named',
                },
              ],
              groups: ['namedStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'namedStartingWithHello',
                leftGroup: 'unknown',
                right: 'helloNamed',
                left: 'undefined',
              },
              messageId: GROUP_ORDER_ERROR_ID,
            },
          ],
          output: dedent`
            type Type =
              | helloNamed
              | null
              | undefined
          `,
          code: dedent`
            type Type =
              | null
              | undefined
              | helloNamed
          `,
        })
      },
    )

    it('overrides sort type and order for specific groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              rightGroup: 'reversedNamedByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: "'m'",
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedNamedByLineLength',
                type: 'line-length',
                selector: 'named',
                order: 'desc',
              },
            ],
            groups: ['reversedNamedByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          type T =
            | dddd
            | ccc
            | eee
            | bb
            | ff
            | a
            | g
            | 'm'
            | 'o'
            | 'p'
        `,
        code: dedent`
          type T =
            | a
            | bb
            | ccc
            | dddd
            | 'm'
            | eee
            | ff
            | g
            | 'o'
            | 'p'
        `,
      })
    })

    it('applies fallback sort when primary sort results in tie', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                fallbackSort: {
                  type: 'alphabetical',
                  order: 'asc',
                },
                elementNamePattern: '^foo',
                type: 'line-length',
                groupName: 'foo',
                order: 'desc',
              },
            ],
            type: 'alphabetical',
            groups: ['foo'],
            order: 'asc',
          },
        ],
        errors: [
          {
            data: {
              right: 'fooBar',
              left: 'fooZar',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            | fooBar
            | fooZar
        `,
        code: dedent`
          type T =
            | fooZar
            | fooBar
        `,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedNamed',
                selector: 'named',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedNamed', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedNamed',
              leftGroup: 'unknown',
              left: "'m'",
              right: 'c',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            | b
            | a
            | d
            | e
            | c
            | 'm'
        `,
        code: dedent`
          type T =
            | b
            | a
            | d
            | e
            | 'm'
            | c
        `,
      })
    })

    it('combines multiple selectors with anyOf', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    elementNamePattern: 'foo|Foo',
                    selector: 'named',
                  },
                  {
                    elementNamePattern: 'foo|Foo',
                    selector: 'literal',
                  },
                ],
                groupName: 'elementsIncludingFoo',
              },
            ],
            groups: ['elementsIncludingFoo', 'unknown'],
            newlinesBetween: 1,
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'elementsIncludingFoo',
              leftGroup: 'unknown',
              right: "'foo'",
              left: 'null',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            | 'foo'
            | cFoo

            | null
        `,
        code: dedent`
          type T =
            | null
            | 'foo'
            | cFoo
        `,
      })
    })

    it('supports negative regex patterns in custom groups', async () => {
      await valid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
            type: 'alphabetical',
          },
        ],
        code: dedent`
          type T =
            iHaveFooInMyName
            meTooIHaveFoo
            a
            b
        `,
      })
    })

    it('adds newlines within groups when newlinesInside is 1', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'group1',
                selector: 'named',
                newlinesInside: 1,
              },
            ],
            groups: ['group1'],
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: MISSED_SPACING_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            | a

            | b
        `,
        code: dedent`
          type T =
            | a
            | b
        `,
      })
    })

    it('removes newlines within groups when newlinesInside is 0', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'group1',
                selector: 'named',
                newlinesInside: 0,
              },
            ],
            type: 'alphabetical',
            groups: ['group1'],
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            | a
            | b
        `,
        code: dedent`
          type T =
            | a

            | b
        `,
      })
    })
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('sorts union types', async () => {
      await valid({
        code: dedent`
          type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: "'bbb'",
              left: "'cc'",
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
        `,
        code: dedent`
          type Type = 'aaaa' | 'cc' | 'bbb' | 'd'
        `,
        options: [options],
      })
    })

    it('sorts keyword union types', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: 'string',
              right: 'any',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              left: 'unknown',
              right: 'null',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              left: 'undefined',
              right: 'never',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'bigint',
              left: 'void',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('works with generics', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: "'aa'",
              left: "'b'",
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: "Omit<T, 'aa' | 'b'>",
        code: "Omit<T, 'b' | 'aa'>",
        options: [options],
      })
    })

    it('sorts type references', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'c',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'aaa',
              left: 'bb',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: 'type Type = aaa | bb | c',
        code: 'type Type = c | bb | aaa',
        options: [options],
      })
    })

    it('sorts unions with objects', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: "{ name: 'aa', status: 'success' }",
              left: "{ name: 'b', status: 'success' }",
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('sorts unions with parentheses', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: '( value: () => void, ) => D | E',
              left: 'A',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('preserves inline comments at the end of union', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: '100',
              right: '2',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: '3',
              left: '4',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type Step = 1 | 2 | 3 | 4 | 5 | 100; // Comment
        `,
        code: dedent`
          type Step = 1 | 100 | 2 | 4 | 3 | 5; // Comment
        `,
        options: [options],
      })
    })

    it('sorts unions by groups', async () => {
      await valid({
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
            | keyof A
            | keyof { a: string; b: number }
            | typeof B
            | 1
            | 'aaa'
            | \`\${A}\`
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
      })

      await invalid({
        errors: [
          {
            data: {
              left: "{ name: 'a' }",
              rightGroup: 'keyword',
              leftGroup: 'object',
              right: 'boolean',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
          {
            data: {
              leftGroup: 'keyword',
              rightGroup: 'named',
              left: 'boolean',
              right: 'A',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
          {
            data: {
              leftGroup: 'operator',
              rightGroup: 'keyword',
              left: 'keyof A',
              right: 'bigint',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
          {
            data: {
              rightGroup: 'literal',
              leftGroup: 'nullish',
              left: 'null',
              right: '1',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
          {
            data: {
              rightGroup: 'intersection',
              leftGroup: 'union',
              right: 'A & B',
              left: 'A | B',
            },
            messageId: GROUP_ORDER_ERROR_ID,
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
      })
    })

    it('sorts within partitions when separated by newlines', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'D',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'B',
              left: 'E',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('creates partitions based on matching comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'BBB',
              left: 'D',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'FFF',
              left: 'GG',
            },
            messageId: ORDER_ERROR_ID,
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
            partitionByComment: '^Part',
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'BBB',
              left: 'D',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'FFF',
              left: 'GG',
            },
            messageId: ORDER_ERROR_ID,
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
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('treats every comment as partition boundary when set to true', async () => {
      await valid({
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
      })
    })

    it('supports multiple partition comment patterns', async () => {
      await invalid({
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
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: ['Partition Comment', 'Part:', 'Other'],
          },
        ],
      })
    })

    it('supports regex patterns for partition comments', async () => {
      await valid({
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
      })
    })

    it('ignores block comments when line comments are specified', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('uses line comments as partition boundaries', async () => {
      await valid({
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
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
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
      })
    })

    it('supports regex patterns for line comments', async () => {
      await valid({
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
      })
    })

    it('ignores line comments when block comments are specified', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('uses block comments as partition boundaries', async () => {
      await valid({
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
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
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
      })
    })

    it('supports regex patterns for block comments', async () => {
      await valid({
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
      })
    })

    it('ignores special characters at start when trimming', async () => {
      await valid({
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
      })
    })

    it('ignores special characters completely when removing', async () => {
      await valid({
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
      })
    })

    it('sorts elements according to locale-specific rules', async () => {
      await valid({
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
      })
    })

    it('removes newlines between groups when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: '() => null',
              right: 'Y',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
          {
            data: {
              right: 'B',
              left: 'Z',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'B',
              left: 'Z',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
        ],
        options: [
          {
            ...options,
            groups: ['function', 'unknown'],
            newlinesBetween: 0,
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
      })
    })

    it('applies inline newline settings between specific groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: '{ a: string }',
              left: '() => void',
            },
            messageId: MISSED_SPACING_ERROR_ID,
          },
          {
            data: {
              left: '{ a: string }',
              right: 'A',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
          {
            data: {
              right: '[A]',
              left: 'A',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
        ],
        options: [
          {
            ...options,
            groups: [
              'function',
              { newlinesBetween: 1 },
              'object',
              { newlinesBetween: 1 },
              'named',
              { newlinesBetween: 0 },
              'tuple',
              { newlinesBetween: 'ignore' },
              'nullish',
            ],
            newlinesBetween: 1,
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
      })
    })

    it.each([
      [2, 0],
      [2, 'ignore'],
      [0, 2],
      ['ignore', 2],
    ])(
      'enforces 2 newlines when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              groups: [
                'named',
                'tuple',
                { newlinesBetween: groupNewlinesBetween },
                'nullish',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'null',
                left: 'A',
              },
              messageId: MISSED_SPACING_ERROR_ID,
            },
          ],
          output: dedent`
            type T =
              A |


              null
          `,
          code: dedent`
            type T =
              A |
              null
          `,
        })
      },
    )

    it.each([1, 2, 'ignore', 0])(
      'removes newlines when 0 overrides global %s between specific groups',
      async globalNewlinesBetween => {
        await invalid({
          options: [
            {
              ...options,
              groups: [
                'named',
                { newlinesBetween: 0 },
                'tuple',
                { newlinesBetween: 0 },
                'nullish',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'null',
                left: 'A',
              },
              messageId: EXTRA_SPACING_ERROR_ID,
            },
          ],
          output: dedent`
            type T =
              A |
              null
          `,
          code: dedent`
            type T =
              A |

              null
          `,
        })
      },
    )

    it.each([
      ['ignore', 0],
      [0, 'ignore'],
    ])(
      'accepts any spacing when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await valid({
          options: [
            {
              ...options,
              groups: [
                'named',
                'tuple',
                { newlinesBetween: groupNewlinesBetween },
                'nullish',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            type T =
              A |

              null
          `,
        })

        await valid({
          options: [
            {
              ...options,
              groups: [
                'named',
                'tuple',
                { newlinesBetween: groupNewlinesBetween },
                'nullish',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            type T =
              A |
              null
          `,
        })
      },
    )

    it('preserves inline comments when reordering elements', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'literal',
              leftGroup: 'named',
              right: "'a'",
              left: 'B',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        options: [
          {
            groups: ['literal', 'named'],
            newlinesBetween: 1,
          },
        ],
        output: dedent`
          type T =
            | 'a' // Comment after

            | B
            | C
        `,
        code: dedent`
          type T =
            | B
            | 'a' // Comment after

            | C
        `,
      })
    })

    it('preserves partition boundaries regardless of newlinesBetween 0', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'a',
                groupName: 'a',
              },
            ],
            groups: ['a', 'unknown'],
            partitionByComment: true,
            newlinesBetween: 0,
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type Type =
            | a

            // Partition comment

            | b
            | c
        `,
        code: dedent`
          type Type =
            | a

            // Partition comment

            | c
            | b
        `,
      })
    })

    it('sorts single-line union types correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: ORDER_ERROR_ID,
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
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('applies custom groups based on element selectors', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'namedElements',
              leftGroup: 'unknown',
              left: 'null',
              right: 'a',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'namedElements',
                selector: 'named',
              },
            ],
            groups: ['namedElements', 'unknown'],
          },
        ],
        output: dedent`
          type T =
            | a
            | null
        `,
        code: dedent`
          type T =
            | null
            | a
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array of patterns', ['noMatch', 'hello']],
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])(
      'groups elements by name pattern - %s',
      async (_, elementNamePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'namedStartingWithHello',
                  elementNamePattern,
                  selector: 'named',
                },
              ],
              groups: ['namedStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'namedStartingWithHello',
                leftGroup: 'unknown',
                right: 'helloNamed',
                left: 'undefined',
              },
              messageId: GROUP_ORDER_ERROR_ID,
            },
          ],
          output: dedent`
            type Type =
              | helloNamed
              | null
              | undefined
          `,
          code: dedent`
            type Type =
              | null
              | undefined
              | helloNamed
          `,
        })
      },
    )

    it('overrides sort type and order for specific groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              rightGroup: 'reversedNamedByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: "'m'",
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedNamedByLineLength',
                type: 'line-length',
                selector: 'named',
                order: 'desc',
              },
            ],
            groups: ['reversedNamedByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          type T =
            | dddd
            | ccc
            | eee
            | bb
            | ff
            | a
            | g
            | 'm'
            | 'o'
            | 'p'
        `,
        code: dedent`
          type T =
            | a
            | bb
            | ccc
            | dddd
            | 'm'
            | eee
            | ff
            | g
            | 'o'
            | 'p'
        `,
      })
    })

    it('applies fallback sort when primary sort results in tie', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                fallbackSort: {
                  type: 'alphabetical',
                  order: 'asc',
                },
                elementNamePattern: '^foo',
                type: 'line-length',
                groupName: 'foo',
                order: 'desc',
              },
            ],
            type: 'alphabetical',
            groups: ['foo'],
            order: 'asc',
          },
        ],
        errors: [
          {
            data: {
              right: 'fooBar',
              left: 'fooZar',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            | fooBar
            | fooZar
        `,
        code: dedent`
          type T =
            | fooZar
            | fooBar
        `,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedNamed',
                selector: 'named',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedNamed', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedNamed',
              leftGroup: 'unknown',
              left: "'m'",
              right: 'c',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            | b
            | a
            | d
            | e
            | c
            | 'm'
        `,
        code: dedent`
          type T =
            | b
            | a
            | d
            | e
            | 'm'
            | c
        `,
      })
    })

    it('combines multiple selectors with anyOf', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    elementNamePattern: 'foo|Foo',
                    selector: 'named',
                  },
                  {
                    elementNamePattern: 'foo|Foo',
                    selector: 'literal',
                  },
                ],
                groupName: 'elementsIncludingFoo',
              },
            ],
            groups: ['elementsIncludingFoo', 'unknown'],
            newlinesBetween: 1,
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'elementsIncludingFoo',
              leftGroup: 'unknown',
              right: "'foo'",
              left: 'null',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            | 'foo'
            | cFoo

            | null
        `,
        code: dedent`
          type T =
            | null
            | 'foo'
            | cFoo
        `,
      })
    })

    it('supports negative regex patterns in custom groups', async () => {
      await valid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
            type: 'alphabetical',
          },
        ],
        code: dedent`
          type T =
            iHaveFooInMyName
            meTooIHaveFoo
            a
            b
        `,
      })
    })

    it('adds newlines within groups when newlinesInside is 1', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'group1',
                selector: 'named',
                newlinesInside: 1,
              },
            ],
            groups: ['group1'],
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: MISSED_SPACING_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            | a

            | b
        `,
        code: dedent`
          type T =
            | a
            | b
        `,
      })
    })

    it('removes newlines within groups when newlinesInside is 0', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'group1',
                selector: 'named',
                newlinesInside: 0,
              },
            ],
            type: 'alphabetical',
            groups: ['group1'],
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            | a
            | b
        `,
        code: dedent`
          type T =
            | a

            | b
        `,
      })
    })
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('sorts union types', async () => {
      await valid({
        code: dedent`
          type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: "'bbb'",
              left: "'cc'",
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
        `,
        code: dedent`
          type Type = 'aaaa' | 'cc' | 'bbb' | 'd'
        `,
        options: [options],
      })
    })

    it('sorts keyword union types', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'unknown',
              left: 'any',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'undefined',
              left: 'null',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'bigint',
              left: 'void',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('works with generics', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: "'aa'",
              left: "'b'",
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: "Omit<T, 'aa' | 'b'>",
        code: "Omit<T, 'b' | 'aa'>",
        options: [options],
      })
    })

    it('sorts type references', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'c',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'aaa',
              left: 'bb',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: 'type Type = aaa | bb | c',
        code: 'type Type = c | bb | aaa',
        options: [options],
      })
    })

    it('sorts unions with objects', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: "{ name: 'aa', status: 'success' }",
              left: "{ name: 'b', status: 'success' }",
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('sorts unions with parentheses', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: '( value: () => void, ) => D | E',
              left: 'A',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('preserves inline comments at the end of union', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: '100',
              left: '1',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type Step = 100 | 1 | 2 | 4 | 3 | 5; // Comment
        `,
        code: dedent`
          type Step = 1 | 100 | 2 | 4 | 3 | 5; // Comment
        `,
        options: [options],
      })
    })

    it('sorts unions by groups', async () => {
      await valid({
        code: dedent`
          type Type =
            | SomeClass['name']
            | intrinsic
            | string[]
            | A
            | boolean
            | unknown
            | bigint
            | number
            | this
            | any
            | keyof { a: string; b: number }
            | typeof B
            | keyof A
            | \`\${A}\`
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
      })

      await invalid({
        errors: [
          {
            data: {
              left: "{ name: 'a' }",
              rightGroup: 'keyword',
              leftGroup: 'object',
              right: 'boolean',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
          {
            data: {
              leftGroup: 'keyword',
              rightGroup: 'named',
              left: 'boolean',
              right: 'A',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
          {
            data: {
              leftGroup: 'operator',
              rightGroup: 'keyword',
              left: 'keyof A',
              right: 'bigint',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
          {
            data: {
              rightGroup: 'literal',
              leftGroup: 'nullish',
              left: 'null',
              right: '1',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
          {
            data: {
              rightGroup: 'intersection',
              leftGroup: 'union',
              right: 'A & B',
              left: 'A | B',
            },
            messageId: GROUP_ORDER_ERROR_ID,
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
      })
    })

    it('sorts within partitions when separated by newlines', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'D',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'B',
              left: 'E',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('creates partitions based on matching comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'BBB',
              left: 'D',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'FFF',
              left: 'GG',
            },
            messageId: ORDER_ERROR_ID,
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
            partitionByComment: '^Part',
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'BBB',
              left: 'D',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'FFF',
              left: 'GG',
            },
            messageId: ORDER_ERROR_ID,
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
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('treats every comment as partition boundary when set to true', async () => {
      await valid({
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
      })
    })

    it('supports multiple partition comment patterns', async () => {
      await invalid({
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
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: ['Partition Comment', 'Part:', 'Other'],
          },
        ],
      })
    })

    it('supports regex patterns for partition comments', async () => {
      await valid({
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
      })
    })

    it('ignores block comments when line comments are specified', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'AA',
              left: 'B',
            },
            messageId: ORDER_ERROR_ID,
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
            AA |
            B
        `,
        code: dedent`
          type Type =
            B |
            /* Comment */
            AA
        `,
      })
    })

    it('uses line comments as partition boundaries', async () => {
      await valid({
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
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
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
      })
    })

    it('supports regex patterns for line comments', async () => {
      await valid({
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
      })
    })

    it('ignores line comments when block comments are specified', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'AA',
              left: 'B',
            },
            messageId: ORDER_ERROR_ID,
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
            AA |
            B
        `,
        code: dedent`
          type Type =
            B |
            // Comment
            AA
        `,
      })
    })

    it('uses block comments as partition boundaries', async () => {
      await valid({
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
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
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
      })
    })

    it('supports regex patterns for block comments', async () => {
      await valid({
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
      })
    })

    it('ignores special characters at start when trimming', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
        code: dedent`
          type T =
            _A |
            BB |
            _C
        `,
      })
    })

    it('ignores special characters completely when removing', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          type T =
            ABC |
            A_C
        `,
      })
    })

    it('sorts elements according to locale-specific rules', async () => {
      await valid({
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
      })
    })

    it('removes newlines between groups when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: '() => null',
              right: 'YY',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
          {
            data: {
              right: 'BBB',
              left: 'Z',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'BBB',
              left: 'Z',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
        ],
        options: [
          {
            ...options,
            groups: ['function', 'unknown'],
            newlinesBetween: 0,
          },
        ],
        code: dedent`
          type T =
            (() => null)


           | YY
          | Z

              | BBB
        `,
        output: dedent`
          type T =
            (() => null)
           | BBB
          | YY
              | Z
        `,
      })
    })

    it('applies inline newline settings between specific groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: '{ a: string }',
              left: '() => void',
            },
            messageId: MISSED_SPACING_ERROR_ID,
          },
          {
            data: {
              left: '{ a: string }',
              right: 'A',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
          {
            data: {
              right: '[A]',
              left: 'A',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
        ],
        options: [
          {
            ...options,
            groups: [
              'function',
              { newlinesBetween: 1 },
              'object',
              { newlinesBetween: 1 },
              'named',
              { newlinesBetween: 0 },
              'tuple',
              { newlinesBetween: 'ignore' },
              'nullish',
            ],
            newlinesBetween: 1,
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
      })
    })

    it.each([
      [2, 0],
      [2, 'ignore'],
      [0, 2],
      ['ignore', 2],
    ])(
      'enforces 2 newlines when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              groups: [
                'named',
                'tuple',
                { newlinesBetween: groupNewlinesBetween },
                'nullish',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'null',
                left: 'A',
              },
              messageId: MISSED_SPACING_ERROR_ID,
            },
          ],
          output: dedent`
            type T =
              A |


              null
          `,
          code: dedent`
            type T =
              A |
              null
          `,
        })
      },
    )

    it.each([1, 2, 'ignore', 0])(
      'removes newlines when 0 overrides global %s between specific groups',
      async globalNewlinesBetween => {
        await invalid({
          options: [
            {
              ...options,
              groups: [
                'named',
                { newlinesBetween: 0 },
                'tuple',
                { newlinesBetween: 0 },
                'nullish',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'null',
                left: 'A',
              },
              messageId: EXTRA_SPACING_ERROR_ID,
            },
          ],
          output: dedent`
            type T =
              A |
              null
          `,
          code: dedent`
            type T =
              A |

              null
          `,
        })
      },
    )

    it.each([
      ['ignore', 0],
      [0, 'ignore'],
    ])(
      'accepts any spacing when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await valid({
          options: [
            {
              ...options,
              groups: [
                'named',
                'tuple',
                { newlinesBetween: groupNewlinesBetween },
                'nullish',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            type T =
              A |

              null
          `,
        })

        await valid({
          options: [
            {
              ...options,
              groups: [
                'named',
                'tuple',
                { newlinesBetween: groupNewlinesBetween },
                'nullish',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            type T =
              A |
              null
          `,
        })
      },
    )

    it('preserves inline comments when reordering elements', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'literal',
              leftGroup: 'named',
              right: "'a'",
              left: 'B',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        options: [
          {
            groups: ['literal', 'named'],
            newlinesBetween: 1,
          },
        ],
        output: dedent`
          type T =
            | 'a' // Comment after

            | B
            | C
        `,
        code: dedent`
          type T =
            | B
            | 'a' // Comment after

            | C
        `,
      })
    })

    it('preserves partition boundaries regardless of newlinesBetween 0', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'a',
                groupName: 'a',
              },
            ],
            groups: ['a', 'unknown'],
            partitionByComment: true,
            newlinesBetween: 0,
          },
        ],
        errors: [
          {
            data: {
              right: 'bb',
              left: 'c',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type Type =
            | a

            // Partition comment

            | bb
            | c
        `,
        code: dedent`
          type Type =
            | a

            // Partition comment

            | c
            | bb
        `,
      })
    })

    it('sorts single-line union types correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'AA',
              left: 'B',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            | AA | B
        `,
        code: dedent`
          type T =
            | B | AA
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'AA',
              left: 'B',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            AA | B
        `,
        code: dedent`
          type T =
            B | AA
        `,
        options: [options],
      })
    })

    it('applies custom groups based on element selectors', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'namedElements',
              leftGroup: 'unknown',
              left: 'null',
              right: 'a',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'namedElements',
                selector: 'named',
              },
            ],
            groups: ['namedElements', 'unknown'],
          },
        ],
        output: dedent`
          type T =
            | a
            | null
        `,
        code: dedent`
          type T =
            | null
            | a
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array of patterns', ['noMatch', 'hello']],
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])(
      'groups elements by name pattern - %s',
      async (_, elementNamePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'namedStartingWithHello',
                  elementNamePattern,
                  selector: 'named',
                },
              ],
              groups: ['namedStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'namedStartingWithHello',
                leftGroup: 'unknown',
                right: 'helloNamed',
                left: 'undefined',
              },
              messageId: GROUP_ORDER_ERROR_ID,
            },
          ],
          output: dedent`
            type Type =
              | helloNamed
              | null
              | undefined
          `,
          code: dedent`
            type Type =
              | null
              | undefined
              | helloNamed
          `,
        })
      },
    )

    it('overrides sort type and order for specific groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              rightGroup: 'reversedNamedByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: "'m'",
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedNamedByLineLength',
                type: 'line-length',
                selector: 'named',
                order: 'desc',
              },
            ],
            groups: ['reversedNamedByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          type T =
            | dddd
            | ccc
            | eee
            | bb
            | ff
            | a
            | g
            | 'm'
            | 'o'
            | 'p'
        `,
        code: dedent`
          type T =
            | a
            | bb
            | ccc
            | dddd
            | 'm'
            | eee
            | ff
            | g
            | 'o'
            | 'p'
        `,
      })
    })

    it('applies fallback sort when primary sort results in tie', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                fallbackSort: {
                  type: 'alphabetical',
                  order: 'asc',
                },
                elementNamePattern: '^foo',
                type: 'line-length',
                groupName: 'foo',
                order: 'desc',
              },
            ],
            type: 'alphabetical',
            groups: ['foo'],
            order: 'asc',
          },
        ],
        errors: [
          {
            data: {
              right: 'fooBar',
              left: 'fooZar',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            | fooBar
            | fooZar
        `,
        code: dedent`
          type T =
            | fooZar
            | fooBar
        `,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedNamed',
                selector: 'named',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedNamed', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedNamed',
              leftGroup: 'unknown',
              left: "'m'",
              right: 'c',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            | b
            | a
            | d
            | e
            | c
            | 'm'
        `,
        code: dedent`
          type T =
            | b
            | a
            | d
            | e
            | 'm'
            | c
        `,
      })
    })

    it('combines multiple selectors with anyOf', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    elementNamePattern: 'foo|Foo',
                    selector: 'named',
                  },
                  {
                    elementNamePattern: 'foo|Foo',
                    selector: 'literal',
                  },
                ],
                groupName: 'elementsIncludingFoo',
              },
            ],
            groups: ['elementsIncludingFoo', 'unknown'],
            newlinesBetween: 1,
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'elementsIncludingFoo',
              leftGroup: 'unknown',
              right: "'foo'",
              left: 'null',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            | 'foo'
            | cFoo

            | null
        `,
        code: dedent`
          type T =
            | null
            | 'foo'
            | cFoo
        `,
      })
    })

    it('supports negative regex patterns in custom groups', async () => {
      await valid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
            type: 'alphabetical',
          },
        ],
        code: dedent`
          type T =
            iHaveFooInMyName
            meTooIHaveFoo
            a
            b
        `,
      })
    })

    it('adds newlines within groups when newlinesInside is 1', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'group1',
                selector: 'named',
                newlinesInside: 1,
              },
            ],
            groups: ['group1'],
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: MISSED_SPACING_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            | a

            | b
        `,
        code: dedent`
          type T =
            | a
            | b
        `,
      })
    })

    it('removes newlines within groups when newlinesInside is 0', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'group1',
                selector: 'named',
                newlinesInside: 0,
              },
            ],
            type: 'alphabetical',
            groups: ['group1'],
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            | a
            | b
        `,
        code: dedent`
          type T =
            | a

            | b
        `,
      })
    })
  })

  describe('custom', () => {
    let alphabet = Alphabet.generateRecommendedAlphabet()
      .sortByLocaleCompare('en-US')
      .getCharacters()

    let options = {
      type: 'custom',
      order: 'asc',
      alphabet,
    } as const

    it('sorts union types', async () => {
      await valid({
        code: dedent`
          type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: "'bbb'",
              left: "'cc'",
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type Type = 'aaaa' | 'bbb' | 'cc' | 'd'
        `,
        code: dedent`
          type Type = 'aaaa' | 'cc' | 'bbb' | 'd'
        `,
        options: [options],
      })
    })
  })

  describe('unsorted', () => {
    let options = {
      type: 'unsorted',
      order: 'asc',
    } as const

    it('accepts any order with unsorted type', async () => {
      await valid({
        code: dedent`
          type Type =
            | B
            | C
            | A
        `,
        options: [options],
      })
    })

    it('enforces group ordering', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'literal',
              rightGroup: 'named',
              left: "'aa'",
              right: 'ba',
            },
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type Type =
            | ba
            | bb
            | 'ab'
            | 'aa'
        `,
        code: dedent`
          type Type =
            | 'ab'
            | 'aa'
            | ba
            | bb
        `,
        options: [
          {
            ...options,
            groups: ['named', 'literal'],
          },
        ],
      })
    })

    it('adds newlines between groups when configured', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: "'a'",
              left: 'b',
            },
            messageId: MISSED_SPACING_ERROR_ID,
          },
        ],
        options: [
          {
            ...options,
            groups: ['named', 'literal'],
            newlinesBetween: 1,
          },
        ],
        output: dedent`
          type Type =
            | b

            | 'a'
        `,
        code: dedent`
          type Type =
            | b
            | 'a'
        `,
      })
    })
  })

  describe('misc', () => {
    it('validates the JSON schema', async () => {
      await expect(
        validateRuleJsonSchema(rule.meta.schema),
      ).resolves.not.toThrow()
    })

    it('accepts predefined group configurations', async () => {
      await valid({
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
      })
    })

    it('sorts alphabetically in ascending order by default', async () => {
      await valid(
        dedent`
          type SupportedNumberBase = NumberBase.BASE_10 | NumberBase.BASE_16 | NumberBase.BASE_2
        `,
      )

      await valid({
        code: dedent`
          type SupportedNumberBase = NumberBase.BASE_10 | NumberBase.BASE_16 | NumberBase.BASE_2
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'NumberBase.BASE_10',
              left: 'NumberBase.BASE_2',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type SupportedNumberBase = NumberBase.BASE_10 | NumberBase.BASE_16 | NumberBase.BASE_2
        `,
        code: dedent`
          type SupportedNumberBase = NumberBase.BASE_2 | NumberBase.BASE_10 | NumberBase.BASE_16
        `,
      })
    })

    it('ignores whitespace differences when comparing', async () => {
      await valid({
        code: dedent`
          type T =
          { a: string } |
          {  b: string }
        `,
        options: [{}],
      })
    })

    it('preserves elements disabled with eslint-disable-next-line', async () => {
      await valid({
        code: dedent`
          type Type =
            | B
            | C
            // eslint-disable-next-line
            | A
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'B',
              left: 'C',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('partitions by eslint-disable comments when configured', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'C',
              left: 'D',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'B',
              left: 'A',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('preserves elements with inline eslint-disable-line', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'B',
              left: 'C',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('handles block eslint-disable comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'B',
              left: 'C',
            },
            messageId: ORDER_ERROR_ID,
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
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'B',
              left: 'C',
            },
            messageId: ORDER_ERROR_ID,
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
      })
    })

    it('respects eslint-disable/enable regions', async () => {
      await invalid({
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
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [{}],
      })
    })

    it('handles rule-specific eslint-disable comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'B',
              left: 'C',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            B
            | C
            // eslint-disable-next-line rule-to-test/sort-union-types
            | A
        `,
        code: dedent`
          type T =
            C
            | B
            // eslint-disable-next-line rule-to-test/sort-union-types
            | A
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'B',
              left: 'C',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            B
            | C
            | A // eslint-disable-line rule-to-test/sort-union-types
        `,
        code: dedent`
          type T =
            C
            | B
            | A // eslint-disable-line rule-to-test/sort-union-types
        `,
        options: [{}],
      })
    })

    it('handles rule-specific block eslint-disable comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'B',
              left: 'C',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            B
            | C
            /* eslint-disable-next-line rule-to-test/sort-union-types */
            | A
        `,
        code: dedent`
          type T =
            C
            | B
            /* eslint-disable-next-line rule-to-test/sort-union-types */
            | A
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'B',
              left: 'C',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          type T =
            B
            | C
            | A /* eslint-disable-line rule-to-test/sort-union-types */
        `,
        code: dedent`
          type T =
            C
            | B
            | A /* eslint-disable-line rule-to-test/sort-union-types */
        `,
        options: [{}],
      })
    })

    it('respects rule-specific eslint-disable/enable regions', async () => {
      await invalid({
        output: dedent`
          type Type =
            A
            | D
            /* eslint-disable rule-to-test/sort-union-types */
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
            /* eslint-disable rule-to-test/sort-union-types */
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
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [{}],
      })
    })
  })
})
