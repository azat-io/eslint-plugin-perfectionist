import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import rule from '../../rules/sort-intersection-types'
import { Alphabet } from '../../utils/alphabet'

describe('sort-intersection-types', () => {
  let { invalid, valid } = createRuleTester({
    name: 'sort-intersection-types',
    parser: typescriptParser,
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it(`sorts intersection types`, async () => {
      await valid({
        code: dedent`
          type Type = { label: 'aaa' } & { label: 'bb' } & { label: 'c' }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: "{ label: 'bb' }", left: "{ label: 'c' }" },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type Type = { label: 'aaa' } & { label: 'bb' } & { label: 'c' }
        `,
        code: dedent`
          type Type = { label: 'aaa' } & { label: 'c' } & { label: 'bb' }
        `,
        options: [options],
      })
    })

    it('sorts keyword intersection types', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: '{ stringValue: string }',
              right: '{ anyValue: any }',
            },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: {
              left: '{ unknownValue: unknown }',
              right: '{ nullValue: null }',
            },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: {
              left: '{ undefinedValue: undefined }',
              right: '{ neverValue: never }',
            },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: {
              right: '{ bigintValue: bigint }',
              left: '{ voidValue: void }',
            },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
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
        options: [options],
      })
    })

    it('works with generics', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'AA', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: 'Omit<T, AA & B>',
        code: 'Omit<T, B & AA>',
        options: [options],
      })
    })

    it('works with type references', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'B', left: 'C' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: 'type Type = A & B & C',
        code: 'type Type = A & C & B',
        options: [options],
      })
    })

    it('sorts intersections with named properties', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: "{ name: A, status: 'aa' }",
              left: "{ name: B, status: 'b' }",
            },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type Type =
            & { name: A, status: 'aa' }
            & { name: B, status: 'b' }
        `,
        code: dedent`
          type Type =
            & { name: B, status: 'b' }
            & { name: A, status: 'aa' }
        `,
        options: [options],
      })
    })

    it('sorts intersections with parentheses', async () => {
      await invalid({
        errors: [
          {
            data: { right: '( A: () => void, ) => B & C', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
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
        options: [options],
      })
    })

    it('sorts intersections with comment at the end', async () => {
      await invalid({
        errors: [
          {
            data: { right: '{ value3: 3 }', left: '{ value4: 4 }' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: '{ value100: 100 }', left: '{ value5: 5 }' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type Step =  { value1: 1 } & { value100: 100 } & { value2: 2 } & { value3: 3 } & { value4: 4 } & { value5: 5 }; // Comment
        `,
        code: dedent`
          type Step =  { value1: 1 } & { value2: 2 } & { value4: 4 } & { value3: 3 } & { value5: 5 } & { value100: 100 }; // Comment
        `,
        options: [options],
      })
    })

    it('sorts intersections using groups', async () => {
      await valid({
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
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
          {
            data: {
              leftGroup: 'keyword',
              rightGroup: 'named',
              left: 'boolean',
              right: 'A',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
          {
            data: {
              leftGroup: 'operator',
              rightGroup: 'keyword',
              left: 'keyof A',
              right: 'bigint',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
          {
            data: {
              rightGroup: 'literal',
              leftGroup: 'nullish',
              left: 'null',
              right: '1',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
          {
            data: {
              rightGroup: 'intersection',
              leftGroup: 'union',
              right: 'A & B',
              left: 'A | B',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
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
      })
    })

    it('allows to use new line as partition', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'A', left: 'D' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'B', left: 'E' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type Type =
            A &
            D &

            C &

            B &
            E
        `,
        code: dedent`
          type Type =
            D &
            A &

            C &

            E &
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

    it('allows to use partition comments', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'BBB', left: 'D' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'FFF', left: 'GG' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
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
            data: { right: 'BBB', left: 'D' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'FFF', left: 'GG' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
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
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('allows to use all comments as parts', async () => {
      await valid({
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
      })
    })

    it('allows to use multiple partition comments', async () => {
      await invalid({
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
        errors: [
          {
            data: { right: 'BB', left: 'C' },
            messageId: 'unexpectedIntersectionTypesOrder',
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

    it('allows to use regex for partition comments', async () => {
      await valid({
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
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores block comments when line comments are specified', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'A', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
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
            A &
            B
        `,
        code: dedent`
          type Type =
            B &
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
            B &
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
            C &
            // B
            B &
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
            B &
            // I am a partition comment because I don't have f o o
            A
        `,
      })
    })

    it('ignores line comments when block comments are specified', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'A', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
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
            A &
            B
        `,
        code: dedent`
          type Type =
            B &
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
            B &
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
            C &
            /* B */
            B &
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
            B &
            /* I am a partition comment because I don't have f o o */
            A
        `,
      })
    })

    it('allows to trim special characters', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
        code: dedent`
          type T =
            _A &
            B &
            _C
        `,
      })
    })

    it('allows to remove special characters', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          type T =
            AB &
            A_C
        `,
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          type T =
            你好 &
            世界 &
            a &
            A &
            b &
            B
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('removes newlines when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: '() => null',
              right: 'Y',
            },
            messageId: 'extraSpacingBetweenIntersectionTypes',
          },
          {
            data: { right: 'B', left: 'Z' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'B', left: 'Z' },
            messageId: 'extraSpacingBetweenIntersectionTypes',
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
      })
    })

    it('handles newlinesBetween between consecutive groups', async () => {
      await invalid({
        errors: [
          {
            data: { right: '{ a: string }', left: '() => void' },
            messageId: 'missedSpacingBetweenIntersectionTypes',
          },
          {
            data: {
              left: '{ a: string }',
              right: 'A',
            },
            messageId: 'extraSpacingBetweenIntersectionTypes',
          },
          {
            data: { right: '[A]', left: 'A' },
            messageId: 'extraSpacingBetweenIntersectionTypes',
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
            (() => void) &

            { a: string } &

            A &
            [A] &


            null
        `,
        code: dedent`
          type Type =
            (() => void) &
            { a: string } &


            A &

            [A] &


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
              data: { right: 'null', left: 'A' },
              messageId: 'missedSpacingBetweenIntersectionTypes',
            },
          ],
          output: dedent`
            type T =
              A &


              null
          `,
          code: dedent`
            type T =
              A &
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
              data: { right: 'null', left: 'A' },
              messageId: 'extraSpacingBetweenIntersectionTypes',
            },
          ],
          output: dedent`
            type T =
              A &
              null
          `,
          code: dedent`
            type T =
              A &

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
              A &

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
              A &
              null
          `,
        })
      },
    )

    it('handles newlines and comment after fixes', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'literal',
              leftGroup: 'named',
              right: "'a'",
              left: 'B',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
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
            & 'a' // Comment after

            & B
            & C
        `,
        code: dedent`
          type T =
            & B
            & 'a' // Comment after

            & C
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
            data: { right: 'b', left: 'c' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type Type =
            & a

            // Partition comment

            & b
            & c
        `,
        code: dedent`
          type Type =
            & a

            // Partition comment

            & c
            & b
        `,
      })
    })

    it('sorts inline elements correctly', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'A', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
            & A & B
        `,
        code: dedent`
          type T =
            & B & A
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'A', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
            A & B
        `,
        code: dedent`
          type T =
            B & A
        `,
        options: [options],
      })
    })

    it('allows overriding options in groups', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'b', left: 'a' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'b', left: 'a' },
            messageId: 'missedSpacingBetweenIntersectionTypes',
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
            & b

            & a
        `,
        code: dedent`
          type T =
            & a
            & b
        `,
      })
    })

    it('filters on selector', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'namedElements',
              leftGroup: 'unknown',
              left: 'null',
              right: 'a',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
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
            & a
            & null
        `,
        code: dedent`
          type T =
            & null
            & a
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
              messageId: 'unexpectedIntersectionTypesGroupOrder',
            },
          ],
          output: dedent`
            type Type =
              & helloNamed
              & null
              & undefined
          `,
          code: dedent`
            type Type =
              & null
              & undefined
              & helloNamed
          `,
        })
      },
    )

    it('overrides sort type and order for specific groups', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'bb', left: 'a' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'ccc', left: 'bb' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'dddd', left: 'ccc' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: {
              rightGroup: 'reversedNamedByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: "'m'",
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
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
            & dddd
            & ccc
            & eee
            & bb
            & ff
            & a
            & g
            & 'm'
            & 'o'
            & 'p'
        `,
        code: dedent`
          type T =
            & a
            & bb
            & ccc
            & dddd
            & 'm'
            & eee
            & ff
            & g
            & 'o'
            & 'p'
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
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
            & fooBar
            & fooZar
        `,
        code: dedent`
          type T =
            & fooZar
            & fooBar
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
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
        ],
        output: dedent`
          type T =
            & b
            & a
            & d
            & e
            & c
            & 'm'
        `,
        code: dedent`
          type T =
            & b
            & a
            & d
            & e
            & 'm'
            & c
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
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
        ],
        output: dedent`
          type T =
            & 'foo'
            & cFoo

            & null
        `,
        code: dedent`
          type T =
            & null
            & 'foo'
            & cFoo
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

    it('enforces newlines within groups when newlinesInside is 1', async () => {
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
            data: { right: 'b', left: 'a' },
            messageId: 'missedSpacingBetweenIntersectionTypes',
          },
        ],
        output: dedent`
          type T =
            & a

            & b
        `,
        code: dedent`
          type T =
            & a
            & b
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
            data: { right: 'b', left: 'a' },
            messageId: 'extraSpacingBetweenIntersectionTypes',
          },
        ],
        output: dedent`
          type T =
            & a
            & b
        `,
        code: dedent`
          type T =
            & a

            & b
        `,
      })
    })
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it(`sorts intersection types`, async () => {
      await valid({
        code: dedent`
          type Type = { label: 'aaa' } & { label: 'bb' } & { label: 'c' }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: "{ label: 'bb' }", left: "{ label: 'c' }" },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type Type = { label: 'aaa' } & { label: 'bb' } & { label: 'c' }
        `,
        code: dedent`
          type Type = { label: 'aaa' } & { label: 'c' } & { label: 'bb' }
        `,
        options: [options],
      })
    })

    it('sorts keyword intersection types', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: '{ stringValue: string }',
              right: '{ anyValue: any }',
            },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: {
              left: '{ unknownValue: unknown }',
              right: '{ nullValue: null }',
            },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: {
              left: '{ undefinedValue: undefined }',
              right: '{ neverValue: never }',
            },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: {
              right: '{ bigintValue: bigint }',
              left: '{ voidValue: void }',
            },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
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
        options: [options],
      })
    })

    it('works with generics', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'AA', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: 'Omit<T, AA & B>',
        code: 'Omit<T, B & AA>',
        options: [options],
      })
    })

    it('works with type references', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'B', left: 'C' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: 'type Type = A & B & C',
        code: 'type Type = A & C & B',
        options: [options],
      })
    })

    it('sorts intersections with named properties', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: "{ name: A, status: 'aa' }",
              left: "{ name: B, status: 'b' }",
            },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type Type =
            & { name: A, status: 'aa' }
            & { name: B, status: 'b' }
        `,
        code: dedent`
          type Type =
            & { name: B, status: 'b' }
            & { name: A, status: 'aa' }
        `,
        options: [options],
      })
    })

    it('sorts intersections with parentheses', async () => {
      await invalid({
        errors: [
          {
            data: { right: '( A: () => void, ) => B & C', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
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
        options: [options],
      })
    })

    it('sorts intersections with comment at the end', async () => {
      await invalid({
        errors: [
          {
            data: { right: '{ value3: 3 }', left: '{ value4: 4 }' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type Step =  { value1: 1 } & { value2: 2 } & { value3: 3 } & { value4: 4 } & { value5: 5 } & { value100: 100 }; // Comment
        `,
        code: dedent`
          type Step =  { value1: 1 } & { value2: 2 } & { value4: 4 } & { value3: 3 } & { value5: 5 } & { value100: 100 }; // Comment
        `,
        options: [options],
      })
    })

    it('sorts intersections using groups', async () => {
      await valid({
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
            & keyof A
            & keyof { a: string; b: number }
            & typeof B
            & 1
            & 'aaa'
            & \`\${A}\`
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
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
          {
            data: {
              leftGroup: 'keyword',
              rightGroup: 'named',
              left: 'boolean',
              right: 'A',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
          {
            data: {
              leftGroup: 'operator',
              rightGroup: 'keyword',
              left: 'keyof A',
              right: 'bigint',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
          {
            data: {
              rightGroup: 'literal',
              leftGroup: 'nullish',
              left: 'null',
              right: '1',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
          {
            data: {
              rightGroup: 'intersection',
              leftGroup: 'union',
              right: 'A & B',
              left: 'A | B',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
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
            & A
            & any
            & bigint
            & boolean
            & keyof A
            & typeof B
            & 1
            & 'aaa'
            & (import('path'))
            & (A extends B ? C : D)
            & { name: 'a' }
            & [A, B, C]
            & (A & B)
            & (A | B)
            & null
        `,
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
      })
    })

    it('allows to use new line as partition', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'A', left: 'D' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'B', left: 'E' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type Type =
            A &
            D &

            C &

            B &
            E
        `,
        code: dedent`
          type Type =
            D &
            A &

            C &

            E &
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

    it('allows to use partition comments', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'BBB', left: 'D' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'FFF', left: 'GG' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
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
            data: { right: 'BBB', left: 'D' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'FFF', left: 'GG' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
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
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('allows to use all comments as parts', async () => {
      await valid({
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
      })
    })

    it('allows to use multiple partition comments', async () => {
      await invalid({
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
        errors: [
          {
            data: { right: 'BB', left: 'C' },
            messageId: 'unexpectedIntersectionTypesOrder',
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

    it('allows to use regex for partition comments', async () => {
      await valid({
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
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores block comments when line comments are specified', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'A', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
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
            A &
            B
        `,
        code: dedent`
          type Type =
            B &
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
            B &
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
            C &
            // B
            B &
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
            B &
            // I am a partition comment because I don't have f o o
            A
        `,
      })
    })

    it('ignores line comments when block comments are specified', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'A', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
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
            A &
            B
        `,
        code: dedent`
          type Type =
            B &
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
            B &
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
            C &
            /* B */
            B &
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
            B &
            /* I am a partition comment because I don't have f o o */
            A
        `,
      })
    })

    it('allows to trim special characters', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
        code: dedent`
          type T =
            _A &
            B &
            _C
        `,
      })
    })

    it('allows to remove special characters', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          type T =
            AB &
            A_C
        `,
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          type T =
            你好 &
            世界 &
            a &
            A &
            b &
            B
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('removes newlines when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: '() => null',
              right: 'Y',
            },
            messageId: 'extraSpacingBetweenIntersectionTypes',
          },
          {
            data: { right: 'B', left: 'Z' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'B', left: 'Z' },
            messageId: 'extraSpacingBetweenIntersectionTypes',
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
      })
    })

    it('handles newlinesBetween between consecutive groups', async () => {
      await invalid({
        errors: [
          {
            data: { right: '{ a: string }', left: '() => void' },
            messageId: 'missedSpacingBetweenIntersectionTypes',
          },
          {
            data: {
              left: '{ a: string }',
              right: 'A',
            },
            messageId: 'extraSpacingBetweenIntersectionTypes',
          },
          {
            data: { right: '[A]', left: 'A' },
            messageId: 'extraSpacingBetweenIntersectionTypes',
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
            (() => void) &

            { a: string } &

            A &
            [A] &


            null
        `,
        code: dedent`
          type Type =
            (() => void) &
            { a: string } &


            A &

            [A] &


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
              data: { right: 'null', left: 'A' },
              messageId: 'missedSpacingBetweenIntersectionTypes',
            },
          ],
          output: dedent`
            type T =
              A &


              null
          `,
          code: dedent`
            type T =
              A &
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
              data: { right: 'null', left: 'A' },
              messageId: 'extraSpacingBetweenIntersectionTypes',
            },
          ],
          output: dedent`
            type T =
              A &
              null
          `,
          code: dedent`
            type T =
              A &

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
              A &

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
              A &
              null
          `,
        })
      },
    )

    it('handles newlines and comment after fixes', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'literal',
              leftGroup: 'named',
              right: "'a'",
              left: 'B',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
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
            & 'a' // Comment after

            & B
            & C
        `,
        code: dedent`
          type T =
            & B
            & 'a' // Comment after

            & C
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
            data: { right: 'b', left: 'c' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type Type =
            & a

            // Partition comment

            & b
            & c
        `,
        code: dedent`
          type Type =
            & a

            // Partition comment

            & c
            & b
        `,
      })
    })

    it('sorts inline elements correctly', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'A', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
            & A & B
        `,
        code: dedent`
          type T =
            & B & A
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'A', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
            A & B
        `,
        code: dedent`
          type T =
            B & A
        `,
        options: [options],
      })
    })

    it('filters on selector', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'namedElements',
              leftGroup: 'unknown',
              left: 'null',
              right: 'a',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
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
            & a
            & null
        `,
        code: dedent`
          type T =
            & null
            & a
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
              messageId: 'unexpectedIntersectionTypesGroupOrder',
            },
          ],
          output: dedent`
            type Type =
              & helloNamed
              & null
              & undefined
          `,
          code: dedent`
            type Type =
              & null
              & undefined
              & helloNamed
          `,
        })
      },
    )

    it('overrides sort type and order for specific groups', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'bb', left: 'a' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'ccc', left: 'bb' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'dddd', left: 'ccc' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: {
              rightGroup: 'reversedNamedByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: "'m'",
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
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
            & dddd
            & ccc
            & eee
            & bb
            & ff
            & a
            & g
            & 'm'
            & 'o'
            & 'p'
        `,
        code: dedent`
          type T =
            & a
            & bb
            & ccc
            & dddd
            & 'm'
            & eee
            & ff
            & g
            & 'o'
            & 'p'
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
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
            & fooBar
            & fooZar
        `,
        code: dedent`
          type T =
            & fooZar
            & fooBar
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
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
        ],
        output: dedent`
          type T =
            & b
            & a
            & d
            & e
            & c
            & 'm'
        `,
        code: dedent`
          type T =
            & b
            & a
            & d
            & e
            & 'm'
            & c
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
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
        ],
        output: dedent`
          type T =
            & 'foo'
            & cFoo

            & null
        `,
        code: dedent`
          type T =
            & null
            & 'foo'
            & cFoo
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

    it('enforces newlines within groups when newlinesInside is 1', async () => {
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
            data: { right: 'b', left: 'a' },
            messageId: 'missedSpacingBetweenIntersectionTypes',
          },
        ],
        output: dedent`
          type T =
            & a

            & b
        `,
        code: dedent`
          type T =
            & a
            & b
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
            data: { right: 'b', left: 'a' },
            messageId: 'extraSpacingBetweenIntersectionTypes',
          },
        ],
        output: dedent`
          type T =
            & a
            & b
        `,
        code: dedent`
          type T =
            & a

            & b
        `,
      })
    })
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it(`sorts intersection types`, async () => {
      await valid({
        code: dedent`
          type Type = { label: 'aaa' } & { label: 'bb' } & { label: 'c' }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: "{ label: 'bb' }", left: "{ label: 'c' }" },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type Type = { label: 'aaa' } & { label: 'bb' } & { label: 'c' }
        `,
        code: dedent`
          type Type = { label: 'aaa' } & { label: 'c' } & { label: 'bb' }
        `,
        options: [options],
      })
    })

    it('sorts keyword intersection types', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: '{ unknownValue: unknown }',
              left: '{ anyValue: any }',
            },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: {
              right: '{ undefinedValue: undefined }',
              left: '{ nullValue: null }',
            },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: {
              right: '{ bigintValue: bigint }',
              left: '{ voidValue: void }',
            },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type Value =
            & { undefinedValue: undefined }
            & { booleanValue: boolean }
            & { unknownValue: unknown }
            & { numberValue: number }
            & { stringValue: string }
            & { bigintValue: bigint }
            & { neverValue: never }
            & { nullValue: null }
            & { voidValue: void }
            & { anyValue: any }
        `,
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
        options: [options],
      })
    })

    it('works with generics', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'AA', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: 'Omit<T, AA & B>',
        code: 'Omit<T, B & AA>',
        options: [options],
      })
    })

    it('works with type references', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'BB', left: 'C' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: 'type Type = AAA & BB & C',
        code: 'type Type = AAA & C & BB',
        options: [options],
      })
    })

    it('sorts intersections with named properties', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: "{ name: A, status: 'aa' }",
              left: "{ name: B, status: 'b' }",
            },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type Type =
            & { name: A, status: 'aa' }
            & { name: B, status: 'b' }
        `,
        code: dedent`
          type Type =
            & { name: B, status: 'b' }
            & { name: A, status: 'aa' }
        `,
        options: [options],
      })
    })

    it('sorts intersections with parentheses', async () => {
      await invalid({
        errors: [
          {
            data: { right: '( A: () => void, ) => B & C', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
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
        options: [options],
      })
    })

    it('sorts intersections with comment at the end', async () => {
      await invalid({
        errors: [
          {
            data: { right: '{ value100: 100 }', left: '{ value5: 5 }' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type Step =  { value100: 100 } & { value1: 1 } & { value2: 2 } & { value4: 4 } & { value3: 3 } & { value5: 5 }; // Comment
        `,
        code: dedent`
          type Step =  { value1: 1 } & { value2: 2 } & { value4: 4 } & { value3: 3 } & { value5: 5 } & { value100: 100 }; // Comment
        `,
        options: [options],
      })
    })

    it('sorts intersections using groups', async () => {
      await valid({
        code: dedent`
          type Type =
            & SomeClass['name']
            & intrinsic
            & string[]
            & A
            & boolean
            & unknown
            & bigint
            & number
            & this
            & any
            & keyof { a: string; b: number }
            & typeof B
            & keyof A
            & \`\${A}\`
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
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
          {
            data: {
              leftGroup: 'keyword',
              rightGroup: 'named',
              left: 'boolean',
              right: 'A',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
          {
            data: {
              leftGroup: 'operator',
              rightGroup: 'keyword',
              left: 'keyof A',
              right: 'bigint',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
          {
            data: {
              rightGroup: 'literal',
              leftGroup: 'nullish',
              left: 'null',
              right: '1',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
          {
            data: {
              rightGroup: 'intersection',
              leftGroup: 'union',
              right: 'A & B',
              left: 'A | B',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
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
      })
    })

    it('allows to use new line as partition', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'A', left: 'D' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'B', left: 'E' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type Type =
            A &
            D &

            C &

            B &
            E
        `,
        code: dedent`
          type Type =
            D &
            A &

            C &

            E &
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

    it('allows to use partition comments', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'BBB', left: 'D' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'FFF', left: 'GG' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
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
            data: { right: 'BBB', left: 'D' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'FFF', left: 'GG' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
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
        options: [
          {
            ...options,
            partitionByComment: '^Part',
          },
        ],
      })
    })

    it('allows to use all comments as parts', async () => {
      await valid({
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
      })
    })

    it('allows to use multiple partition comments', async () => {
      await invalid({
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
        errors: [
          {
            data: { right: 'BB', left: 'C' },
            messageId: 'unexpectedIntersectionTypesOrder',
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

    it('allows to use regex for partition comments', async () => {
      await valid({
        code: dedent`
          type T =
            E &
            F &
            // I am a partition comment because I don't have f o o
            AAA &
            BB
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
            data: { right: 'AA', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
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
            AA &
            B
        `,
        code: dedent`
          type Type =
            B &
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
            B &
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
            C &
            // B
            B &
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
            B &
            // I am a partition comment because I don't have f o o
            A
        `,
      })
    })

    it('ignores line comments when block comments are specified', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'AA', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
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
            AA &
            B
        `,
        code: dedent`
          type Type =
            B &
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
            B &
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
            C &
            /* B */
            B &
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
            B &
            /* I am a partition comment because I don't have f o o */
            A
        `,
      })
    })

    it('allows to trim special characters', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
        code: dedent`
          type T =
            _AA &
            BB &
            _C
        `,
      })
    })

    it('allows to remove special characters', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          type T =
            ABC &
            A_C
        `,
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          type T =
            你好 &
            世界 &
            a &
            A &
            b &
            B
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('removes newlines when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: '() => null',
              right: 'YY',
            },
            messageId: 'extraSpacingBetweenIntersectionTypes',
          },
          {
            data: { right: 'BBB', left: 'Z' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'BBB', left: 'Z' },
            messageId: 'extraSpacingBetweenIntersectionTypes',
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


           & YY
          & Z

              & BBB
        `,
        output: dedent`
          type T =
            (() => null)
           & BBB
          & YY
              & Z
        `,
      })
    })

    it('handles newlinesBetween between consecutive groups', async () => {
      await invalid({
        errors: [
          {
            data: { right: '{ a: string }', left: '() => void' },
            messageId: 'missedSpacingBetweenIntersectionTypes',
          },
          {
            data: {
              left: '{ a: string }',
              right: 'A',
            },
            messageId: 'extraSpacingBetweenIntersectionTypes',
          },
          {
            data: { right: '[A]', left: 'A' },
            messageId: 'extraSpacingBetweenIntersectionTypes',
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
            (() => void) &

            { a: string } &

            A &
            [A] &


            null
        `,
        code: dedent`
          type Type =
            (() => void) &
            { a: string } &


            A &

            [A] &


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
              data: { right: 'null', left: 'A' },
              messageId: 'missedSpacingBetweenIntersectionTypes',
            },
          ],
          output: dedent`
            type T =
              A &


              null
          `,
          code: dedent`
            type T =
              A &
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
              data: { right: 'null', left: 'A' },
              messageId: 'extraSpacingBetweenIntersectionTypes',
            },
          ],
          output: dedent`
            type T =
              A &
              null
          `,
          code: dedent`
            type T =
              A &

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
              A &

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
              A &
              null
          `,
        })
      },
    )

    it('handles newlines and comment after fixes', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'literal',
              leftGroup: 'named',
              right: "'a'",
              left: 'B',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
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
            & 'a' // Comment after

            & B
            & C
        `,
        code: dedent`
          type T =
            & B
            & 'a' // Comment after

            & C
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
            data: { right: 'bb', left: 'c' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type Type =
            & aaa

            // Partition comment

            & bb
            & c
        `,
        code: dedent`
          type Type =
            & aaa

            // Partition comment

            & c
            & bb
        `,
      })
    })

    it('sorts inline elements correctly', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'AA', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
            & AA & B
        `,
        code: dedent`
          type T =
            & B & AA
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: 'AA', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
            AA & B
        `,
        code: dedent`
          type T =
            B & AA
        `,
        options: [options],
      })
    })

    it('filters on selector', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'namedElements',
              leftGroup: 'unknown',
              left: 'null',
              right: 'a',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
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
            & a
            & null
        `,
        code: dedent`
          type T =
            & null
            & a
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
              messageId: 'unexpectedIntersectionTypesGroupOrder',
            },
          ],
          output: dedent`
            type Type =
              & helloNamed
              & null
              & undefined
          `,
          code: dedent`
            type Type =
              & null
              & undefined
              & helloNamed
          `,
        })
      },
    )

    it('overrides sort type and order for specific groups', async () => {
      await invalid({
        errors: [
          {
            data: { right: 'bb', left: 'a' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'ccc', left: 'bb' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'dddd', left: 'ccc' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: {
              rightGroup: 'reversedNamedByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: "'m'",
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
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
            & dddd
            & ccc
            & eee
            & bb
            & ff
            & a
            & g
            & 'm'
            & 'o'
            & 'p'
        `,
        code: dedent`
          type T =
            & a
            & bb
            & ccc
            & dddd
            & 'm'
            & eee
            & ff
            & g
            & 'o'
            & 'p'
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
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
            & fooBar
            & fooZar
        `,
        code: dedent`
          type T =
            & fooZar
            & fooBar
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
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
        ],
        output: dedent`
          type T =
            & b
            & a
            & d
            & e
            & c
            & 'm'
        `,
        code: dedent`
          type T =
            & b
            & a
            & d
            & e
            & 'm'
            & c
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
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
        ],
        output: dedent`
          type T =
            & 'foo'
            & cFoo

            & null
        `,
        code: dedent`
          type T =
            & null
            & 'foo'
            & cFoo
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

    it('enforces newlines within groups when newlinesInside is 1', async () => {
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
            data: { right: 'b', left: 'a' },
            messageId: 'missedSpacingBetweenIntersectionTypes',
          },
        ],
        output: dedent`
          type T =
            & a

            & b
        `,
        code: dedent`
          type T =
            & a
            & b
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
            data: { right: 'b', left: 'a' },
            messageId: 'extraSpacingBetweenIntersectionTypes',
          },
        ],
        output: dedent`
          type T =
            & a
            & b
        `,
        code: dedent`
          type T =
            & a

            & b
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

    it('sorts intersection types', async () => {
      await valid({
        code: dedent`
          type Type = { label: 'aaa' } & { label: 'bb' } & { label: 'c' }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: "{ label: 'bb' }", left: "{ label: 'c' }" },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type Type = { label: 'aaa' } & { label: 'bb' } & { label: 'c' }
        `,
        code: dedent`
          type Type = { label: 'aaa' } & { label: 'c' } & { label: 'bb' }
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

    it('does not enforce sorting', async () => {
      await valid({
        code: dedent`
          type Type =
            & B
            & C
            & A
        `,
        options: [options],
      })
    })

    it('enforces grouping', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'literal',
              rightGroup: 'named',
              left: "'aa'",
              right: 'ba',
            },
            messageId: 'unexpectedIntersectionTypesGroupOrder',
          },
        ],
        output: dedent`
          type Type =
            & ba
            & bb
            & 'ab'
            & 'aa'
        `,
        code: dedent`
          type Type =
            & 'ab'
            & 'aa'
            & ba
            & bb
        `,
        options: [
          {
            ...options,
            groups: ['named', 'literal'],
          },
        ],
      })
    })

    it('enforces newlines between groups', async () => {
      await invalid({
        errors: [
          {
            data: { right: "'a'", left: 'b' },
            messageId: 'missedSpacingBetweenIntersectionTypes',
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
            & b

            & 'a'
        `,
        code: dedent`
          type Type =
            & b
            & 'a'
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

    it('allows predefined groups', async () => {
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
          type Type = { label: 'aaa' } & { label: 'bb' } & { label: 'c' }
        `,
      })
    })

    it('sets alphabetical asc sorting as default', async () => {
      await valid(
        dedent`
          type SupportedNumberBase = NumberBase.BASE_10 & NumberBase.BASE_16 & NumberBase.BASE_2
        `,
      )

      await valid({
        code: dedent`
          type SupportedNumberBase = NumberBase.BASE_10 & NumberBase.BASE_16 & NumberBase.BASE_2
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: { right: 'NumberBase.BASE_10', left: 'NumberBase.BASE_2' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type SupportedNumberBase = NumberBase.BASE_10 & NumberBase.BASE_16 & NumberBase.BASE_2
        `,
        code: dedent`
          type SupportedNumberBase = NumberBase.BASE_2 & NumberBase.BASE_10 & NumberBase.BASE_16
        `,
      })
    })

    it('ignores whitespaces', async () => {
      await valid({
        code: dedent`
          type T =
          { a: string } &
          {  b: string }
        `,
        options: [{}],
      })
    })

    it('respects eslint-disable comments', async () => {
      await valid({
        code: dedent`
          type Type =
            & B
            & C
            // eslint-disable-next-line
            & A
        `,
      })

      await invalid({
        errors: [
          {
            data: { right: 'B', left: 'C' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
            B
            & C
            // eslint-disable-next-line
            & A
        `,
        code: dedent`
          type T =
            C
            & B
            // eslint-disable-next-line
            & A
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: { right: 'C', left: 'D' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
          {
            data: { right: 'B', left: 'A' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
            B
            & C
            // eslint-disable-next-line
            & A
            & D
        `,
        code: dedent`
          type T =
            D
            & C
            // eslint-disable-next-line
            & A
            & B
        `,
        options: [
          {
            partitionByComment: true,
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: { right: 'B', left: 'C' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
            B
            & C
            & A // eslint-disable-line
        `,
        code: dedent`
          type T =
            C
            & B
            & A // eslint-disable-line
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: { right: 'B', left: 'C' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
            B
            & C
            /* eslint-disable-next-line */
            & A
        `,
        code: dedent`
          type T =
            C
            & B
            /* eslint-disable-next-line */
            & A
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: { right: 'B', left: 'C' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
            B
            & C
            & A /* eslint-disable-line */
        `,
        code: dedent`
          type T =
            C
            & B
            & A /* eslint-disable-line */
        `,
        options: [{}],
      })

      await invalid({
        output: dedent`
          type Type =
            A
            & D
            /* eslint-disable */
            & C
            & B
            // Shouldn't move
            /* eslint-enable */
            & E
        `,
        code: dedent`
          type Type =
            D
            & E
            /* eslint-disable */
            & C
            & B
            // Shouldn't move
            /* eslint-enable */
            & A
        `,
        errors: [
          {
            data: { right: 'A', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: { right: 'B', left: 'C' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
            B
            & C
            // eslint-disable-next-line rule-to-test/sort-intersection-types
            & A
        `,
        code: dedent`
          type T =
            C
            & B
            // eslint-disable-next-line rule-to-test/sort-intersection-types
            & A
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: { right: 'B', left: 'C' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
            B
            & C
            & A // eslint-disable-line rule-to-test/sort-intersection-types
        `,
        code: dedent`
          type T =
            C
            & B
            & A // eslint-disable-line rule-to-test/sort-intersection-types
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: { right: 'B', left: 'C' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
              B
              & C
              /* eslint-disable-next-line rule-to-test/sort-intersection-types */
              & A
        `,
        code: dedent`
          type T =
              C
              & B
              /* eslint-disable-next-line rule-to-test/sort-intersection-types */
              & A
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: { right: 'B', left: 'C' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        output: dedent`
          type T =
            B
            & C
            & A /* eslint-disable-line rule-to-test/sort-intersection-types */
        `,
        code: dedent`
          type T =
            C
            & B
            & A /* eslint-disable-line rule-to-test/sort-intersection-types */
        `,
        options: [{}],
      })

      await invalid({
        output: dedent`
          type Type =
            A
            & D
            /* eslint-disable rule-to-test/sort-intersection-types */
            & C
            & B
            // Shouldn't move
            /* eslint-enable */
            & E
        `,
        code: dedent`
          type Type =
            D
            & E
            /* eslint-disable rule-to-test/sort-intersection-types */
            & C
            & B
            // Shouldn't move
            /* eslint-enable */
            & A
        `,
        errors: [
          {
            data: { right: 'A', left: 'B' },
            messageId: 'unexpectedIntersectionTypesOrder',
          },
        ],
        options: [{}],
      })
    })
  })
})
