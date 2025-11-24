import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import rule from '../../rules/sort-union-types'
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
            data: { right: "'bbb'", left: "'cc'" },
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
            data: { right: 'bigint', left: 'void' },
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
      })
    })

    it('works with generics', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: "'aa'", left: "'b'" },
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'bb', left: 'c' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'aaa', left: 'bb' },
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
      })
    })

    it('sorts unions with parentheses', async () => {
      await invalid({
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
        errors: [
          {
            data: { right: '( value: () => void, ) => D | E', left: 'A' },
            messageId: 'unexpectedUnionTypesOrder',
          },
        ],
        options: [options],
      })
    })

    it('preserves inline comments at the end of union', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: '3', left: '4' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: '100', left: '5' },
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
      })
    })

    it('sorts within partitions when separated by newlines', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'A', left: 'D' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'B', left: 'E' },
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
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'BBB', left: 'D' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'FFF', left: 'GG' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })

      await invalid({
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
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'BBB', left: 'D' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'FFF', left: 'GG' },
          },
        ],
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'BB', left: 'C' },
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
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'A', left: 'B' },
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
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'A', left: 'B' },
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
            messageId: 'extraSpacingBetweenUnionTypes',
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'B', left: 'Z' },
          },
          {
            messageId: 'extraSpacingBetweenUnionTypes',
            data: { right: 'B', left: 'Z' },
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
            data: { right: '{ a: string }', left: '() => void' },
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
            messageId: 'extraSpacingBetweenUnionTypes',
            data: { right: '[A]', left: 'A' },
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
              messageId: 'missedSpacingBetweenUnionTypes',
              data: { right: 'null', left: 'A' },
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
              messageId: 'extraSpacingBetweenUnionTypes',
              data: { right: 'null', left: 'A' },
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
            messageId: 'unexpectedUnionTypesGroupOrder',
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'b', left: 'c' },
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'A', left: 'B' },
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'A', left: 'B' },
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
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'missedSpacingBetweenUnionTypes',
            data: { right: 'b', left: 'a' },
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
            messageId: 'unexpectedUnionTypesGroupOrder',
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
              messageId: 'unexpectedUnionTypesGroupOrder',
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'dddd', left: 'ccc' },
          },
          {
            data: {
              rightGroup: 'reversedNamedByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: "'m'",
            },
            messageId: 'unexpectedUnionTypesGroupOrder',
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
            data: { right: 'fooBar', left: 'fooZar' },
            messageId: 'unexpectedUnionTypesOrder',
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
            messageId: 'unexpectedUnionTypesGroupOrder',
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
            messageId: 'unexpectedUnionTypesGroupOrder',
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
            messageId: 'missedSpacingBetweenUnionTypes',
            data: { right: 'b', left: 'a' },
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
            messageId: 'extraSpacingBetweenUnionTypes',
            data: { right: 'b', left: 'a' },
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
            data: { right: "'bbb'", left: "'cc'" },
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
            data: { right: 'bigint', left: 'void' },
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
      })
    })

    it('works with generics', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: "'aa'", left: "'b'" },
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'bb', left: 'c' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'aaa', left: 'bb' },
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
      })
    })

    it('sorts unions with parentheses', async () => {
      await invalid({
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
        errors: [
          {
            data: { right: '( value: () => void, ) => D | E', left: 'A' },
            messageId: 'unexpectedUnionTypesOrder',
          },
        ],
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
            messageId: 'unexpectedUnionTypesOrder',
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: '3', left: '4' },
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
      })
    })

    it('sorts within partitions when separated by newlines', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'A', left: 'D' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'B', left: 'E' },
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
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'BBB', left: 'D' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'FFF', left: 'GG' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })

      await invalid({
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
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'BBB', left: 'D' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'FFF', left: 'GG' },
          },
        ],
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'BB', left: 'C' },
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
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'A', left: 'B' },
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
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'A', left: 'B' },
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
            messageId: 'extraSpacingBetweenUnionTypes',
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'B', left: 'Z' },
          },
          {
            messageId: 'extraSpacingBetweenUnionTypes',
            data: { right: 'B', left: 'Z' },
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
            data: { right: '{ a: string }', left: '() => void' },
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
            messageId: 'extraSpacingBetweenUnionTypes',
            data: { right: '[A]', left: 'A' },
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
              messageId: 'missedSpacingBetweenUnionTypes',
              data: { right: 'null', left: 'A' },
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
              messageId: 'extraSpacingBetweenUnionTypes',
              data: { right: 'null', left: 'A' },
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
            messageId: 'unexpectedUnionTypesGroupOrder',
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'b', left: 'c' },
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'A', left: 'B' },
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'A', left: 'B' },
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
            messageId: 'unexpectedUnionTypesGroupOrder',
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
              messageId: 'unexpectedUnionTypesGroupOrder',
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'dddd', left: 'ccc' },
          },
          {
            data: {
              rightGroup: 'reversedNamedByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: "'m'",
            },
            messageId: 'unexpectedUnionTypesGroupOrder',
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
            data: { right: 'fooBar', left: 'fooZar' },
            messageId: 'unexpectedUnionTypesOrder',
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
            messageId: 'unexpectedUnionTypesGroupOrder',
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
            messageId: 'unexpectedUnionTypesGroupOrder',
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
            messageId: 'missedSpacingBetweenUnionTypes',
            data: { right: 'b', left: 'a' },
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
            messageId: 'extraSpacingBetweenUnionTypes',
            data: { right: 'b', left: 'a' },
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
            data: { right: "'bbb'", left: "'cc'" },
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
      })
    })

    it('sorts keyword union types', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'unknown', left: 'any' },
            messageId: 'unexpectedUnionTypesOrder',
          },
          {
            data: { right: 'undefined', left: 'null' },
            messageId: 'unexpectedUnionTypesOrder',
          },
          {
            data: { right: 'bigint', left: 'void' },
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
      })
    })

    it('works with generics', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: "'aa'", left: "'b'" },
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'bb', left: 'c' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'aaa', left: 'bb' },
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
      })
    })

    it('sorts unions with parentheses', async () => {
      await invalid({
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
        errors: [
          {
            data: { right: '( value: () => void, ) => D | E', left: 'A' },
            messageId: 'unexpectedUnionTypesOrder',
          },
        ],
        options: [options],
      })
    })

    it('preserves inline comments at the end of union', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: '100', left: '1' },
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
      })
    })

    it('sorts within partitions when separated by newlines', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'A', left: 'D' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'B', left: 'E' },
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
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'BBB', left: 'D' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'FFF', left: 'GG' },
          },
        ],
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })

      await invalid({
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
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'BBB', left: 'D' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'FFF', left: 'GG' },
          },
        ],
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'BB', left: 'C' },
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
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'AA', left: 'B' },
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
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'AA', left: 'B' },
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
            messageId: 'extraSpacingBetweenUnionTypes',
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'BBB', left: 'Z' },
          },
          {
            messageId: 'extraSpacingBetweenUnionTypes',
            data: { right: 'BBB', left: 'Z' },
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
            data: { right: '{ a: string }', left: '() => void' },
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
            messageId: 'extraSpacingBetweenUnionTypes',
            data: { right: '[A]', left: 'A' },
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
              messageId: 'missedSpacingBetweenUnionTypes',
              data: { right: 'null', left: 'A' },
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
              messageId: 'extraSpacingBetweenUnionTypes',
              data: { right: 'null', left: 'A' },
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
            messageId: 'unexpectedUnionTypesGroupOrder',
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'bb', left: 'c' },
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'AA', left: 'B' },
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'AA', left: 'B' },
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
            messageId: 'unexpectedUnionTypesGroupOrder',
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
              messageId: 'unexpectedUnionTypesGroupOrder',
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'dddd', left: 'ccc' },
          },
          {
            data: {
              rightGroup: 'reversedNamedByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: "'m'",
            },
            messageId: 'unexpectedUnionTypesGroupOrder',
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
            data: { right: 'fooBar', left: 'fooZar' },
            messageId: 'unexpectedUnionTypesOrder',
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
            messageId: 'unexpectedUnionTypesGroupOrder',
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
            messageId: 'unexpectedUnionTypesGroupOrder',
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
            messageId: 'missedSpacingBetweenUnionTypes',
            data: { right: 'b', left: 'a' },
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
            messageId: 'extraSpacingBetweenUnionTypes',
            data: { right: 'b', left: 'a' },
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
            data: { right: "'bbb'", left: "'cc'" },
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
            messageId: 'unexpectedUnionTypesGroupOrder',
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
            messageId: 'missedSpacingBetweenUnionTypes',
            data: { right: "'a'", left: 'b' },
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
            data: { right: 'NumberBase.BASE_10', left: 'NumberBase.BASE_2' },
            messageId: 'unexpectedUnionTypesOrder',
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'B', left: 'C' },
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'C', left: 'D' },
          },
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'B', left: 'A' },
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'B', left: 'C' },
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'B', left: 'C' },
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'B', left: 'C' },
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        options: [{}],
      })
    })

    it('handles rule-specific eslint-disable comments', async () => {
      await invalid({
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
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'B', left: 'C' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          type T =
            B
            | C
            | A // eslint-disable-line rule-to-test/sort-union-types
        `,
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'B', left: 'C' },
          },
        ],
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
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'B', left: 'C' },
          },
        ],
        options: [{}],
      })

      await invalid({
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
        errors: [
          {
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'B', left: 'C' },
          },
        ],
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
            messageId: 'unexpectedUnionTypesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        options: [{}],
      })
    })
  })
})
