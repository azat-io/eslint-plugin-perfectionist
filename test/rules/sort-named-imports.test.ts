import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import rule from '../../rules/sort-named-imports'
import { Alphabet } from '../../utils/alphabet'

describe('sort-named-imports', () => {
  let { invalid, valid } = createRuleTester({
    name: 'sort-named-imports',
    parser: typescriptParser,
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('sorts named imports', async () => {
      await valid({
        code: dedent`
          import { AAA, BB, C } from 'module'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'AAA',
              left: 'BB',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import { AAA, BB, C } from 'module'
        `,
        code: dedent`
          import { BB, AAA, C } from 'module'
        `,
        options: [options],
      })
    })

    it('sorts named multiline imports', async () => {
      await valid({
        code: dedent`
          import {
            AAAA,
            BBB,
            CC,
            D,
          } from 'module'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'BBB',
              left: 'CC',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            AAAA,
            BBB,
            CC,
            D,
          } from 'module'
        `,
        code: dedent`
          import {
            AAAA,
            CC,
            BBB,
            D,
          } from 'module'
        `,
        options: [options],
      })
    })

    it('sorts named imports with aliases', async () => {
      await valid({
        code: dedent`
          import {
            C,
            BB as X0,
            A as X1
          } from 'module'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'X0',
              left: 'X1',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              left: 'X0',
              right: 'C',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            C,
            BB as X0,
            A as X1
          } from 'module'
        `,
        code: dedent`
          import {
            A as X1,
            BB as X0,
            C
          } from 'module'
        `,
        options: [options],
      })
    })

    it('does not sort default specifiers', async () => {
      await valid({
        code: dedent`
          import C, { b as A } from 'module'
        `,
        options: [options],
      })
    })

    it('sorts imports with aliases', async () => {
      await valid({
        code: dedent`
          import U, {
            aaa as A,
            B,
            cc as C,
            d as D,
          } from 'module'
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
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              right: 'C',
              left: 'D',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import U, {
            aaa as A,
            B,
            cc as C,
            d as D,
          } from 'module'
        `,
        code: dedent`
          import U, {
            B,
            aaa as A,
            d as D,
            cc as C,
          } from 'module'
        `,
        options: [options],
      })
    })

    it('allows to ignore import aliases', async () => {
      await valid({
        code: dedent`
          import {
              x as a,
              y as b,
              c,
            } from 'module'
        `,
        options: [
          {
            ...options,
            ignoreAlias: false,
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'c',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            x as a,
            y as b,
            c,
          } from 'module'
        `,
        code: dedent`
          import {
            c,
            x as a,
            y as b,
          } from 'module'
        `,
        options: [
          {
            ...options,
            ignoreAlias: false,
          },
        ],
      })
    })

    it('allows to use original import names', async () => {
      await valid({
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
        code: dedent`
          import { A as B, B as A } from 'module'
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
        output: dedent`
          import { A as B, B as A } from 'module'
        `,
        code: dedent`
          import { B as A, A as B } from 'module'
        `,
      })
    })

    it('allows to use new line as partition', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'D',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              right: 'B',
              left: 'E',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            A,
            D,

            C,

            B,
            E,
          } from 'module'
        `,
        code: dedent`
          import {
            D,
            A,

            C,

            E,
            B,
          } from 'module'
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('allows to use partition comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: 'CC',
              right: 'D',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              right: 'FFF',
              left: 'GG',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            // Part: A
            type D,
            // Not partition comment
            BBB,
            CC,
            // Part: B
            AAAA,
            E,
            // Part: C
            // Not partition comment
            FFF,
            GG,
          } from 'module'
        `,
        code: dedent`
          import {
            // Part: A
            CC,
            type D,
            // Not partition comment
            BBB,
            // Part: B
            AAAA,
            E,
            // Part: C
            GG,
            // Not partition comment
            FFF,
          } from 'module'
        `,
        options: [
          {
            ...options,
            partitionByComment: '^Part',
            groupKind: 'types-first',
          },
        ],
      })
    })

    it('allows to use all comments as partitions', async () => {
      await valid({
        code: dedent`
          import {
            // Comment
            BB,
            // Other comment
            A,
          } from 'module'
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
          import {
            /* Partition Comment */
            // Part: A
            D,
            // Part: B
            AAA,
            BB,
            C,
            /* Other */
            E,
          } from 'module'
        `,
        code: dedent`
          import {
            /* Partition Comment */
            // Part: A
            D,
            // Part: B
            AAA,
            C,
            BB,
            /* Other */
            E,
          } from 'module'
        `,
        errors: [
          {
            data: {
              right: 'BB',
              left: 'C',
            },
            messageId: 'unexpectedNamedImportsOrder',
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

    it('ignores block comments when line comments are used for partitions', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedNamedImportsOrder',
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
          import {
            /* Comment */
            A,
            B,
          } from 'module'
        `,
        code: dedent`
          import {
            B,
            /* Comment */
            A,
          } from 'module'
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
          import {
            B,
            // Comment
            A,
          } from 'module'
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
          import {
            C,
            // B
            B,
            // A
            A,
          } from 'module'
        `,
      })
    })

    it('supports regex patterns for line comments', async () => {
      await valid({
        code: dedent`
          import {
            B,
            // I am a partition comment because I don't have f o o
            A,
          } from 'module'
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['^(?!.*foo).*$'],
            },
          },
        ],
      })
    })

    it('ignores line comments when block comments are used for partitions', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedNamedImportsOrder',
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
          import {
            // Comment
            A,
            B,
          } from 'module'
        `,
        code: dedent`
          import {
            B,
            // Comment
            A,
          } from 'module'
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
          import {
            B,
            /* Comment */
            A,
          } from 'module'
        `,
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        code: dedent`
          import {
            C,
            /* B */
            B,
            /* A */
            A,
          } from 'module'
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['A', 'B'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for block comments', async () => {
      await valid({
        code: dedent`
          import {
            B,
            /* I am a partition comment because I don't have f o o */
            A,
          } from 'module'
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['^(?!.*foo).*$'],
            },
          },
        ],
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
          import { _a, b, _c } from 'module'
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
          import { ab, a_c } from 'module'
        `,
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          import { 你好, 世界, a, A, b, B } from 'module'
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('works with arbitrary names', async () => {
      await valid({
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
        code: dedent`
          import { "A" as a, "B" as b } from 'module';
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
        output: dedent`
          import { "A" as a, "B" as b } from 'module';
        `,
        code: dedent`
          import { "B" as b, "A" as a } from 'module';
        `,
      })
    })

    it('sorts inline elements correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            a, b
          } from 'module'
        `,
        code: dedent`
          import {
            b, a
          } from 'module'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            a, b,
          } from 'module'
        `,
        code: dedent`
          import {
            b, a,
          } from 'module'
        `,
        options: [options],
      })
    })

    it('filters on modifier', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'typeElements',
              leftGroup: 'unknown',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'typeElements',
                modifiers: ['type'],
              },
            ],
            groups: ['typeElements', 'unknown'],
          },
        ],
        output: dedent`
          import {
            type b,
            a,
          } from 'module'
        `,
        code: dedent`
          import {
            a,
            type b,
          } from 'module'
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array of patterns', ['noMatch', 'hello']],
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])('filters on elementNamePattern - %s', async (_, elementNamePattern) => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'typesStartingWithHello',
                modifiers: ['type'],
                elementNamePattern,
              },
            ],
            groups: ['typesStartingWithHello', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'typesStartingWithHello',
              leftGroup: 'unknown',
              right: 'helloType',
              left: 'b',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        output: dedent`
          import {
            type helloType,
            a,
            b,
          } from 'module'
        `,
        code: dedent`
          import {
            a,
            b,
            type helloType,
          } from 'module'
        `,
      })
    })

    it('overrides sort type and order for custom groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              rightGroup: 'reversedTypesByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: 'm',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedTypesByLineLength',
                modifiers: ['type'],
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedTypesByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          import {
            type dddd,
            type ccc,
            type eee,
            type bb,
            type ff,
            type a,
            type g,
            m,
            o,
            p,
          } from 'module'
        `,
        code: dedent`
          import {
            type a,
            type bb,
            type ccc,
            type dddd,
            m,
            type eee,
            type ff,
            type g,
            o,
            p,
          } from 'module'
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
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            fooBar,
            fooZar,
          } from 'module'
        `,
        code: dedent`
          import {
            fooZar,
            fooBar,
          } from 'module'
        `,
      })
    })

    it('preserves original order for unsorted custom groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedTypes',
                modifiers: ['type'],
                type: 'unsorted',
              },
            ],
            groups: ['unsortedTypes', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedTypes',
              leftGroup: 'unknown',
              right: 'c',
              left: 'm',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        output: dedent`
          import {
            type b,
            type a,
            type d,
            type e,
            type c,
            m,
          } from 'module'
        `,
        code: dedent`
          import {
            type b,
            type a,
            type d,
            type e,
            m,
            type c,
          } from 'module'
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
                    modifiers: ['type'],
                  },
                  {
                    elementNamePattern: 'foo|Foo',
                  },
                ],
                groupName: 'elementsIncludingFoo',
              },
            ],
            groups: ['elementsIncludingFoo', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'elementsIncludingFoo',
              leftGroup: 'unknown',
              right: 'cFoo',
              left: 'a',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        output: dedent`
          import {
            type cFoo,
            foo,
            type a,
          } from 'module'
        `,
        code: dedent`
          import {
            type a,
            type cFoo,
            foo,
          } from 'module'
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
          import {
            iHaveFooInMyName,
            meTooIHaveFoo,
            a,
            b,
          } from 'module'
        `,
      })
    })

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'removes newlines between groups when newlinesBetween is %s',
      async (_, newlinesBetween) => {
        await invalid({
          errors: [
            {
              data: {
                right: 'y',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenNamedImports',
            },
            {
              data: {
                right: 'b',
                left: 'z',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'z',
              },
              messageId: 'extraSpacingBetweenNamedImports',
            },
          ],
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
              newlinesBetween,
            },
          ],
          code: dedent`
            import {
                a,


               y,
              z,

                  b,
            } from 'module'
          `,
          output: dedent`
            import {
                a,
               b,
              y,
                  z,
            } from 'module'
          `,
        })
      },
    )

    it('applies inline newline settings between specific groups', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              { elementNamePattern: 'a', groupName: 'a' },
              { elementNamePattern: 'b', groupName: 'b' },
              { elementNamePattern: 'c', groupName: 'c' },
              { elementNamePattern: 'd', groupName: 'd' },
              { elementNamePattern: 'e', groupName: 'e' },
            ],
            groups: [
              'a',
              { newlinesBetween: 'always' },
              'b',
              { newlinesBetween: 'always' },
              'c',
              { newlinesBetween: 'never' },
              'd',
              { newlinesBetween: 'ignore' },
              'e',
            ],
            newlinesBetween: 'always',
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenNamedImports',
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: 'extraSpacingBetweenNamedImports',
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: 'extraSpacingBetweenNamedImports',
          },
        ],
        output: dedent`
          import {
            a,

            b,

            c,
            d,


            e,
          } from 'module'
        `,
        code: dedent`
          import {
            a,
            b,


            c,

            d,


            e,
          } from 'module'
        `,
      })
    })

    it.each([
      [2, 'never' as const],
      [2, 0 as const],
      [2, 'ignore' as const],
      ['never' as const, 2],
      [0 as const, 2],
      ['ignore' as const, 2],
    ])(
      'enforces 2 newlines when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'missedSpacingBetweenNamedImports',
            },
          ],
          output: dedent`
            import {
              a,


              b,
            } from 'module'
          `,
          code: dedent`
            import {
              a,
              b,
            } from 'module'
          `,
        })
      },
    )

    it.each([
      'always' as const,
      2 as const,
      'ignore' as const,
      'never' as const,
      0 as const,
    ])(
      'removes newlines when "never" overrides global %s between specific groups',
      async globalNewlinesBetween => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { elementNamePattern: 'c', groupName: 'c' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                { newlinesBetween: 'never' },
                'unusedGroup',
                { newlinesBetween: 'never' },
                'b',
                { newlinesBetween: 'always' },
                'c',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenNamedImports',
            },
          ],
          output: dedent`
            import {
              a,
              b,
            } from 'module'
          `,
          code: dedent`
            import {
              a,

              b,
            } from 'module'
          `,
        })
      },
    )

    it.each([
      ['ignore' as const, 'never' as const],
      ['ignore' as const, 0 as const],
      ['never' as const, 'ignore' as const],
      [0 as const, 'ignore' as const],
    ])(
      'accepts any spacing when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await valid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            import {
              a,

              b,
            } from 'module'
          `,
        })

        await valid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            import {
              a,
              b,
            } from 'module'
          `,
        })
      },
    )

    it('preserves inline comments when reordering elements with newlines', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: 'b|c',
                groupName: 'b|c',
              },
            ],
            groups: ['unknown', 'b|c'],
            newlinesBetween: 'always',
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unknown',
              leftGroup: 'b|c',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        output: dedent`
          import {
            a, // Comment after

            b,
            c,
          } from 'module'
        `,
        code: dedent`
          import {
            b,
            a, // Comment after

            c,
          } from 'module'
        `,
      })
    })

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'preserves partition boundaries regardless of newlinesBetween %s',
      async (_description, newlinesBetween) => {
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
              newlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              a,

              // Partition comment

              b,
              c,
            } from 'module'
          `,
          code: dedent`
            import {
              a,

              // Partition comment

              c,
              b,
            } from 'module'
          `,
        })
      },
    )
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('sorts named imports', async () => {
      await valid({
        code: dedent`
          import { AAA, BB, C } from 'module'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'AAA',
              left: 'BB',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import { AAA, BB, C } from 'module'
        `,
        code: dedent`
          import { BB, AAA, C } from 'module'
        `,
        options: [options],
      })
    })

    it('sorts named multiline imports', async () => {
      await valid({
        code: dedent`
          import {
            AAAA,
            BBB,
            CC,
            D,
          } from 'module'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'BBB',
              left: 'CC',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            AAAA,
            BBB,
            CC,
            D,
          } from 'module'
        `,
        code: dedent`
          import {
            AAAA,
            CC,
            BBB,
            D,
          } from 'module'
        `,
        options: [options],
      })
    })

    it('sorts named imports with aliases', async () => {
      await valid({
        code: dedent`
          import {
            C,
            BB as X0,
            A as X1
          } from 'module'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'X0',
              left: 'X1',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              left: 'X0',
              right: 'C',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            C,
            BB as X0,
            A as X1
          } from 'module'
        `,
        code: dedent`
          import {
            A as X1,
            BB as X0,
            C
          } from 'module'
        `,
        options: [options],
      })
    })

    it('does not sort default specifiers', async () => {
      await valid({
        code: dedent`
          import C, { b as A } from 'module'
        `,
        options: [options],
      })
    })

    it('sorts imports with aliases', async () => {
      await valid({
        code: dedent`
          import U, {
            aaa as A,
            B,
            cc as C,
            d as D,
          } from 'module'
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
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              right: 'C',
              left: 'D',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import U, {
            aaa as A,
            B,
            cc as C,
            d as D,
          } from 'module'
        `,
        code: dedent`
          import U, {
            B,
            aaa as A,
            d as D,
            cc as C,
          } from 'module'
        `,
        options: [options],
      })
    })

    it('allows to ignore import aliases', async () => {
      await valid({
        code: dedent`
          import {
              x as a,
              y as b,
              c,
            } from 'module'
        `,
        options: [
          {
            ...options,
            ignoreAlias: false,
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'c',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            x as a,
            y as b,
            c,
          } from 'module'
        `,
        code: dedent`
          import {
            c,
            x as a,
            y as b,
          } from 'module'
        `,
        options: [
          {
            ...options,
            ignoreAlias: false,
          },
        ],
      })
    })

    it('allows to use original import names', async () => {
      await valid({
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
        code: dedent`
          import { A as B, B as A } from 'module'
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
        output: dedent`
          import { A as B, B as A } from 'module'
        `,
        code: dedent`
          import { B as A, A as B } from 'module'
        `,
      })
    })

    it('allows to use new line as partition', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'D',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              right: 'B',
              left: 'E',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            A,
            D,

            C,

            B,
            E,
          } from 'module'
        `,
        code: dedent`
          import {
            D,
            A,

            C,

            E,
            B,
          } from 'module'
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('allows to use partition comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: 'CC',
              right: 'D',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              right: 'FFF',
              left: 'GG',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            // Part: A
            type D,
            // Not partition comment
            BBB,
            CC,
            // Part: B
            AAAA,
            E,
            // Part: C
            // Not partition comment
            FFF,
            GG,
          } from 'module'
        `,
        code: dedent`
          import {
            // Part: A
            CC,
            type D,
            // Not partition comment
            BBB,
            // Part: B
            AAAA,
            E,
            // Part: C
            GG,
            // Not partition comment
            FFF,
          } from 'module'
        `,
        options: [
          {
            ...options,
            partitionByComment: '^Part',
            groupKind: 'types-first',
          },
        ],
      })
    })

    it('allows to use all comments as partitions', async () => {
      await valid({
        code: dedent`
          import {
            // Comment
            BB,
            // Other comment
            A,
          } from 'module'
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
          import {
            /* Partition Comment */
            // Part: A
            D,
            // Part: B
            AAA,
            BB,
            C,
            /* Other */
            E,
          } from 'module'
        `,
        code: dedent`
          import {
            /* Partition Comment */
            // Part: A
            D,
            // Part: B
            AAA,
            C,
            BB,
            /* Other */
            E,
          } from 'module'
        `,
        errors: [
          {
            data: {
              right: 'BB',
              left: 'C',
            },
            messageId: 'unexpectedNamedImportsOrder',
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

    it('ignores block comments when line comments are used for partitions', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedNamedImportsOrder',
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
          import {
            /* Comment */
            A,
            B,
          } from 'module'
        `,
        code: dedent`
          import {
            B,
            /* Comment */
            A,
          } from 'module'
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
          import {
            B,
            // Comment
            A,
          } from 'module'
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
          import {
            C,
            // B
            B,
            // A
            A,
          } from 'module'
        `,
      })
    })

    it('supports regex patterns for line comments', async () => {
      await valid({
        code: dedent`
          import {
            B,
            // I am a partition comment because I don't have f o o
            A,
          } from 'module'
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['^(?!.*foo).*$'],
            },
          },
        ],
      })
    })

    it('ignores line comments when block comments are used for partitions', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedNamedImportsOrder',
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
          import {
            // Comment
            A,
            B,
          } from 'module'
        `,
        code: dedent`
          import {
            B,
            // Comment
            A,
          } from 'module'
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
          import {
            B,
            /* Comment */
            A,
          } from 'module'
        `,
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        code: dedent`
          import {
            C,
            /* B */
            B,
            /* A */
            A,
          } from 'module'
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['A', 'B'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for block comments', async () => {
      await valid({
        code: dedent`
          import {
            B,
            /* I am a partition comment because I don't have f o o */
            A,
          } from 'module'
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['^(?!.*foo).*$'],
            },
          },
        ],
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
          import { _a, b, _c } from 'module'
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
          import { ab, a_c } from 'module'
        `,
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          import { 你好, 世界, a, A, b, B } from 'module'
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('works with arbitrary names', async () => {
      await valid({
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
        code: dedent`
          import { "A" as a, "B" as b } from 'module';
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
        output: dedent`
          import { "A" as a, "B" as b } from 'module';
        `,
        code: dedent`
          import { "B" as b, "A" as a } from 'module';
        `,
      })
    })

    it('sorts inline elements correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            a, b
          } from 'module'
        `,
        code: dedent`
          import {
            b, a
          } from 'module'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            a, b,
          } from 'module'
        `,
        code: dedent`
          import {
            b, a,
          } from 'module'
        `,
        options: [options],
      })
    })

    it('filters on modifier', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'typeElements',
              leftGroup: 'unknown',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'typeElements',
                modifiers: ['type'],
              },
            ],
            groups: ['typeElements', 'unknown'],
          },
        ],
        output: dedent`
          import {
            type b,
            a,
          } from 'module'
        `,
        code: dedent`
          import {
            a,
            type b,
          } from 'module'
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array of patterns', ['noMatch', 'hello']],
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])('filters on elementNamePattern - %s', async (_, elementNamePattern) => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'typesStartingWithHello',
                modifiers: ['type'],
                elementNamePattern,
              },
            ],
            groups: ['typesStartingWithHello', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'typesStartingWithHello',
              leftGroup: 'unknown',
              right: 'helloType',
              left: 'b',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        output: dedent`
          import {
            type helloType,
            a,
            b,
          } from 'module'
        `,
        code: dedent`
          import {
            a,
            b,
            type helloType,
          } from 'module'
        `,
      })
    })

    it('overrides sort type and order for custom groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              rightGroup: 'reversedTypesByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: 'm',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedTypesByLineLength',
                modifiers: ['type'],
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedTypesByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          import {
            type dddd,
            type ccc,
            type eee,
            type bb,
            type ff,
            type a,
            type g,
            m,
            o,
            p,
          } from 'module'
        `,
        code: dedent`
          import {
            type a,
            type bb,
            type ccc,
            type dddd,
            m,
            type eee,
            type ff,
            type g,
            o,
            p,
          } from 'module'
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
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            fooBar,
            fooZar,
          } from 'module'
        `,
        code: dedent`
          import {
            fooZar,
            fooBar,
          } from 'module'
        `,
      })
    })

    it('preserves original order for unsorted custom groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedTypes',
                modifiers: ['type'],
                type: 'unsorted',
              },
            ],
            groups: ['unsortedTypes', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedTypes',
              leftGroup: 'unknown',
              right: 'c',
              left: 'm',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        output: dedent`
          import {
            type b,
            type a,
            type d,
            type e,
            type c,
            m,
          } from 'module'
        `,
        code: dedent`
          import {
            type b,
            type a,
            type d,
            type e,
            m,
            type c,
          } from 'module'
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
                    modifiers: ['type'],
                  },
                  {
                    elementNamePattern: 'foo|Foo',
                  },
                ],
                groupName: 'elementsIncludingFoo',
              },
            ],
            groups: ['elementsIncludingFoo', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'elementsIncludingFoo',
              leftGroup: 'unknown',
              right: 'cFoo',
              left: 'a',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        output: dedent`
          import {
            type cFoo,
            foo,
            type a,
          } from 'module'
        `,
        code: dedent`
          import {
            type a,
            type cFoo,
            foo,
          } from 'module'
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
          import {
            iHaveFooInMyName,
            meTooIHaveFoo,
            a,
            b,
          } from 'module'
        `,
      })
    })

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'removes newlines between groups when newlinesBetween is %s',
      async (_, newlinesBetween) => {
        await invalid({
          errors: [
            {
              data: {
                right: 'y',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenNamedImports',
            },
            {
              data: {
                right: 'b',
                left: 'z',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'z',
              },
              messageId: 'extraSpacingBetweenNamedImports',
            },
          ],
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
              newlinesBetween,
            },
          ],
          code: dedent`
            import {
                a,


               y,
              z,

                  b,
            } from 'module'
          `,
          output: dedent`
            import {
                a,
               b,
              y,
                  z,
            } from 'module'
          `,
        })
      },
    )

    it('applies inline newline settings between specific groups', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              { elementNamePattern: 'a', groupName: 'a' },
              { elementNamePattern: 'b', groupName: 'b' },
              { elementNamePattern: 'c', groupName: 'c' },
              { elementNamePattern: 'd', groupName: 'd' },
              { elementNamePattern: 'e', groupName: 'e' },
            ],
            groups: [
              'a',
              { newlinesBetween: 'always' },
              'b',
              { newlinesBetween: 'always' },
              'c',
              { newlinesBetween: 'never' },
              'd',
              { newlinesBetween: 'ignore' },
              'e',
            ],
            newlinesBetween: 'always',
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenNamedImports',
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: 'extraSpacingBetweenNamedImports',
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: 'extraSpacingBetweenNamedImports',
          },
        ],
        output: dedent`
          import {
            a,

            b,

            c,
            d,


            e,
          } from 'module'
        `,
        code: dedent`
          import {
            a,
            b,


            c,

            d,


            e,
          } from 'module'
        `,
      })
    })

    it.each([
      [2, 'never' as const],
      [2, 0 as const],
      [2, 'ignore' as const],
      ['never' as const, 2],
      [0 as const, 2],
      ['ignore' as const, 2],
    ])(
      'enforces 2 newlines when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'missedSpacingBetweenNamedImports',
            },
          ],
          output: dedent`
            import {
              a,


              b,
            } from 'module'
          `,
          code: dedent`
            import {
              a,
              b,
            } from 'module'
          `,
        })
      },
    )

    it.each([
      'always' as const,
      2 as const,
      'ignore' as const,
      'never' as const,
      0 as const,
    ])(
      'removes newlines when "never" overrides global %s between specific groups',
      async globalNewlinesBetween => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { elementNamePattern: 'c', groupName: 'c' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                { newlinesBetween: 'never' },
                'unusedGroup',
                { newlinesBetween: 'never' },
                'b',
                { newlinesBetween: 'always' },
                'c',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenNamedImports',
            },
          ],
          output: dedent`
            import {
              a,
              b,
            } from 'module'
          `,
          code: dedent`
            import {
              a,

              b,
            } from 'module'
          `,
        })
      },
    )

    it.each([
      ['ignore' as const, 'never' as const],
      ['ignore' as const, 0 as const],
      ['never' as const, 'ignore' as const],
      [0 as const, 'ignore' as const],
    ])(
      'accepts any spacing when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await valid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            import {
              a,

              b,
            } from 'module'
          `,
        })

        await valid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            import {
              a,
              b,
            } from 'module'
          `,
        })
      },
    )

    it('preserves inline comments when reordering elements with newlines', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: 'b|c',
                groupName: 'b|c',
              },
            ],
            groups: ['unknown', 'b|c'],
            newlinesBetween: 'always',
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unknown',
              leftGroup: 'b|c',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        output: dedent`
          import {
            a, // Comment after

            b,
            c,
          } from 'module'
        `,
        code: dedent`
          import {
            b,
            a, // Comment after

            c,
          } from 'module'
        `,
      })
    })

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'preserves partition boundaries regardless of newlinesBetween %s',
      async (_description, newlinesBetween) => {
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
              newlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              a,

              // Partition comment

              b,
              c,
            } from 'module'
          `,
          code: dedent`
            import {
              a,

              // Partition comment

              c,
              b,
            } from 'module'
          `,
        })
      },
    )
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('sorts named imports', async () => {
      await valid({
        code: dedent`
          import { AAA, BB, C } from 'module'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'AAA',
              left: 'BB',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import { AAA, BB, C } from 'module'
        `,
        code: dedent`
          import { BB, AAA, C } from 'module'
        `,
        options: [options],
      })
    })

    it('sorts named multiline imports', async () => {
      await valid({
        code: dedent`
          import {
            AAAA,
            BBB,
            CC,
            D,
          } from 'module'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'BBB',
              left: 'CC',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            AAAA,
            BBB,
            CC,
            D,
          } from 'module'
        `,
        code: dedent`
          import {
            AAAA,
            CC,
            BBB,
            D,
          } from 'module'
        `,
        options: [options],
      })
    })

    it('sorts named imports with aliases', async () => {
      await valid({
        code: dedent`
          import {
            BB as X0,
            A as X1,
            C
          } from 'module'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'X0',
              left: 'X1',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            BB as X0,
            A as X1,
            C
          } from 'module'
        `,
        code: dedent`
          import {
            A as X1,
            BB as X0,
            C
          } from 'module'
        `,
        options: [options],
      })
    })

    it('does not sort default specifiers', async () => {
      await valid({
        code: dedent`
          import C, { b as A } from 'module'
        `,
        options: [options],
      })
    })

    it('sorts imports with aliases', async () => {
      await valid({
        code: dedent`
          import U, {
            aaa as A,
            cc as C,
            d as D,
            B,
          } from 'module'
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
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              right: 'C',
              left: 'D',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import U, {
            aaa as A,
            cc as C,
            d as D,
            B,
          } from 'module'
        `,
        code: dedent`
          import U, {
            B,
            aaa as A,
            d as D,
            cc as C,
          } from 'module'
        `,
        options: [options],
      })
    })

    it('allows to ignore import aliases', async () => {
      await valid({
        code: dedent`
          import {
              x as a,
              y as b,
              c,
            } from 'module'
        `,
        options: [
          {
            ...options,
            ignoreAlias: false,
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'c',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            x as a,
            y as b,
            c,
          } from 'module'
        `,
        code: dedent`
          import {
            c,
            x as a,
            y as b,
          } from 'module'
        `,
        options: [
          {
            ...options,
            ignoreAlias: false,
          },
        ],
      })
    })

    it('allows to use original import names', async () => {
      await valid({
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
        code: dedent`
          import { AA as B, B as A } from 'module'
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'AA',
              left: 'B',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
        output: dedent`
          import { AA as B, B as A } from 'module'
        `,
        code: dedent`
          import { B as A, AA as B } from 'module'
        `,
      })
    })

    it('allows to use new line as partition', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'AAAAA',
              left: 'DD',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              right: 'BBBB',
              left: 'E',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            AAAAA,
            DD,

            CCC,

            BBBB,
            E,
          } from 'module'
        `,
        code: dedent`
          import {
            DD,
            AAAAA,

            CCC,

            E,
            BBBB,
          } from 'module'
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('allows to use partition comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: 'CC',
              right: 'D',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              right: 'FFF',
              left: 'GG',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            // Part: A
            type D,
            // Not partition comment
            BBB,
            CC,
            // Part: B
            AAAA,
            E,
            // Part: C
            // Not partition comment
            FFF,
            GG,
          } from 'module'
        `,
        code: dedent`
          import {
            // Part: A
            CC,
            type D,
            // Not partition comment
            BBB,
            // Part: B
            AAAA,
            E,
            // Part: C
            GG,
            // Not partition comment
            FFF,
          } from 'module'
        `,
        options: [
          {
            ...options,
            partitionByComment: '^Part',
            groupKind: 'types-first',
          },
        ],
      })
    })

    it('allows to use all comments as partitions', async () => {
      await valid({
        code: dedent`
          import {
            // Comment
            BB,
            // Other comment
            A,
          } from 'module'
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
          import {
            /* Partition Comment */
            // Part: A
            D,
            // Part: B
            AAA,
            BB,
            C,
            /* Other */
            E,
          } from 'module'
        `,
        code: dedent`
          import {
            /* Partition Comment */
            // Part: A
            D,
            // Part: B
            AAA,
            C,
            BB,
            /* Other */
            E,
          } from 'module'
        `,
        errors: [
          {
            data: {
              right: 'BB',
              left: 'C',
            },
            messageId: 'unexpectedNamedImportsOrder',
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

    it('ignores block comments when line comments are used for partitions', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'AA',
              left: 'B',
            },
            messageId: 'unexpectedNamedImportsOrder',
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
          import {
            /* Comment */
            AA,
            B,
          } from 'module'
        `,
        code: dedent`
          import {
            B,
            /* Comment */
            AA,
          } from 'module'
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
          import {
            B,
            // Comment
            A,
          } from 'module'
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
          import {
            C,
            // B
            B,
            // A
            A,
          } from 'module'
        `,
      })
    })

    it('supports regex patterns for line comments', async () => {
      await valid({
        code: dedent`
          import {
            B,
            // I am a partition comment because I don't have f o o
            A,
          } from 'module'
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['^(?!.*foo).*$'],
            },
          },
        ],
      })
    })

    it('ignores line comments when block comments are used for partitions', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'AA',
              left: 'B',
            },
            messageId: 'unexpectedNamedImportsOrder',
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
          import {
            // Comment
            AA,
            B,
          } from 'module'
        `,
        code: dedent`
          import {
            B,
            // Comment
            AA,
          } from 'module'
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
          import {
            B,
            /* Comment */
            A,
          } from 'module'
        `,
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        code: dedent`
          import {
            C,
            /* B */
            B,
            /* A */
            A,
          } from 'module'
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['A', 'B'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for block comments', async () => {
      await valid({
        code: dedent`
          import {
            B,
            /* I am a partition comment because I don't have f o o */
            A,
          } from 'module'
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['^(?!.*foo).*$'],
            },
          },
        ],
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
          import { _aa, bb, _c } from 'module'
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
          import { abc, a_c } from 'module'
        `,
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          import { 你好, 世界, a, A, b, B } from 'module'
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('works with arbitrary names', async () => {
      await valid({
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
        code: dedent`
          import { "AA" as a, "B" as b } from 'module';
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'AA',
              left: 'B',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
        output: dedent`
          import { "AA" as a, "B" as b } from 'module';
        `,
        code: dedent`
          import { "B" as b, "AA" as a } from 'module';
        `,
      })
    })

    it('sorts inline elements correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            aa, b
          } from 'module'
        `,
        code: dedent`
          import {
            b, aa
          } from 'module'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            aa, b,
          } from 'module'
        `,
        code: dedent`
          import {
            b, aa,
          } from 'module'
        `,
        options: [options],
      })
    })

    it('filters on modifier', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'typeElements',
              leftGroup: 'unknown',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'typeElements',
                modifiers: ['type'],
              },
            ],
            groups: ['typeElements', 'unknown'],
          },
        ],
        output: dedent`
          import {
            type b,
            a,
          } from 'module'
        `,
        code: dedent`
          import {
            a,
            type b,
          } from 'module'
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array of patterns', ['noMatch', 'hello']],
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])('filters on elementNamePattern - %s', async (_, elementNamePattern) => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'typesStartingWithHello',
                modifiers: ['type'],
                elementNamePattern,
              },
            ],
            groups: ['typesStartingWithHello', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'typesStartingWithHello',
              leftGroup: 'unknown',
              right: 'helloType',
              left: 'b',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        output: dedent`
          import {
            type helloType,
            a,
            b,
          } from 'module'
        `,
        code: dedent`
          import {
            a,
            b,
            type helloType,
          } from 'module'
        `,
      })
    })

    it('overrides sort type and order for custom groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              rightGroup: 'reversedTypesByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: 'm',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedTypesByLineLength',
                modifiers: ['type'],
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedTypesByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          import {
            type dddd,
            type ccc,
            type eee,
            type bb,
            type ff,
            type a,
            type g,
            m,
            o,
            p,
          } from 'module'
        `,
        code: dedent`
          import {
            type a,
            type bb,
            type ccc,
            type dddd,
            m,
            type eee,
            type ff,
            type g,
            o,
            p,
          } from 'module'
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
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            fooBar,
            fooZar,
          } from 'module'
        `,
        code: dedent`
          import {
            fooZar,
            fooBar,
          } from 'module'
        `,
      })
    })

    it('preserves original order for unsorted custom groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedTypes',
                modifiers: ['type'],
                type: 'unsorted',
              },
            ],
            groups: ['unsortedTypes', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedTypes',
              leftGroup: 'unknown',
              right: 'c',
              left: 'm',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        output: dedent`
          import {
            type b,
            type a,
            type d,
            type e,
            type c,
            m,
          } from 'module'
        `,
        code: dedent`
          import {
            type b,
            type a,
            type d,
            type e,
            m,
            type c,
          } from 'module'
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
                    modifiers: ['type'],
                  },
                  {
                    elementNamePattern: 'foo|Foo',
                  },
                ],
                groupName: 'elementsIncludingFoo',
              },
            ],
            groups: ['elementsIncludingFoo', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'elementsIncludingFoo',
              leftGroup: 'unknown',
              right: 'cFoo',
              left: 'a',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        output: dedent`
          import {
            type cFoo,
            foo,
            type a,
          } from 'module'
        `,
        code: dedent`
          import {
            type a,
            type cFoo,
            foo,
          } from 'module'
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
          import {
            iHaveFooInMyName,
            meTooIHaveFoo,
            a,
            b,
          } from 'module'
        `,
      })
    })

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'removes newlines between groups when newlinesBetween is %s',
      async (_, newlinesBetween) => {
        await invalid({
          errors: [
            {
              data: {
                left: 'aaaa',
                right: 'yy',
              },
              messageId: 'extraSpacingBetweenNamedImports',
            },
            {
              data: {
                right: 'bbb',
                left: 'z',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
            {
              data: {
                right: 'bbb',
                left: 'z',
              },
              messageId: 'extraSpacingBetweenNamedImports',
            },
          ],
          options: [
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'aaaa',
                  groupName: 'a',
                },
              ],
              groups: ['a', 'unknown'],
              newlinesBetween,
            },
          ],
          code: dedent`
            import {
                aaaa,


               yy,
              z,

                  bbb,
            } from 'module'
          `,
          output: dedent`
            import {
                aaaa,
               bbb,
              yy,
                  z,
            } from 'module'
          `,
        })
      },
    )

    it('applies inline newline settings between specific groups', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              { elementNamePattern: 'a', groupName: 'a' },
              { elementNamePattern: 'b', groupName: 'b' },
              { elementNamePattern: 'c', groupName: 'c' },
              { elementNamePattern: 'd', groupName: 'd' },
              { elementNamePattern: 'e', groupName: 'e' },
            ],
            groups: [
              'a',
              { newlinesBetween: 'always' },
              'b',
              { newlinesBetween: 'always' },
              'c',
              { newlinesBetween: 'never' },
              'd',
              { newlinesBetween: 'ignore' },
              'e',
            ],
            newlinesBetween: 'always',
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenNamedImports',
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: 'extraSpacingBetweenNamedImports',
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: 'extraSpacingBetweenNamedImports',
          },
        ],
        output: dedent`
          import {
            a,

            b,

            c,
            d,


            e,
          } from 'module'
        `,
        code: dedent`
          import {
            a,
            b,


            c,

            d,


            e,
          } from 'module'
        `,
      })
    })

    it.each([
      [2, 'never' as const],
      [2, 0 as const],
      [2, 'ignore' as const],
      ['never' as const, 2],
      [0 as const, 2],
      ['ignore' as const, 2],
    ])(
      'enforces 2 newlines when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'missedSpacingBetweenNamedImports',
            },
          ],
          output: dedent`
            import {
              a,


              b,
            } from 'module'
          `,
          code: dedent`
            import {
              a,
              b,
            } from 'module'
          `,
        })
      },
    )

    it.each([
      'always' as const,
      2 as const,
      'ignore' as const,
      'never' as const,
      0 as const,
    ])(
      'removes newlines when "never" overrides global %s between specific groups',
      async globalNewlinesBetween => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { elementNamePattern: 'c', groupName: 'c' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                { newlinesBetween: 'never' },
                'unusedGroup',
                { newlinesBetween: 'never' },
                'b',
                { newlinesBetween: 'always' },
                'c',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenNamedImports',
            },
          ],
          output: dedent`
            import {
              a,
              b,
            } from 'module'
          `,
          code: dedent`
            import {
              a,

              b,
            } from 'module'
          `,
        })
      },
    )

    it.each([
      ['ignore' as const, 'never' as const],
      ['ignore' as const, 0 as const],
      ['never' as const, 'ignore' as const],
      [0 as const, 'ignore' as const],
    ])(
      'accepts any spacing when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await valid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            import {
              a,

              b,
            } from 'module'
          `,
        })

        await valid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            import {
              a,
              b,
            } from 'module'
          `,
        })
      },
    )

    it('preserves inline comments when reordering elements with newlines', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: 'b|c',
                groupName: 'b|c',
              },
            ],
            groups: ['unknown', 'b|c'],
            newlinesBetween: 'always',
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unknown',
              leftGroup: 'b|c',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedNamedImportsGroupOrder',
          },
        ],
        output: dedent`
          import {
            a, // Comment after

            b,
            c,
          } from 'module'
        `,
        code: dedent`
          import {
            b,
            a, // Comment after

            c,
          } from 'module'
        `,
      })
    })

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'preserves partition boundaries regardless of newlinesBetween %s',
      async (_description, newlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'aaa',
                  groupName: 'a',
                },
              ],
              groups: ['a', 'unknown'],
              partitionByComment: true,
              newlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'bb',
                left: 'c',
              },
              messageId: 'unexpectedNamedImportsOrder',
            },
          ],
          output: dedent`
            import {
              aaa,

              // Partition comment

              bb,
              c,
            } from 'module'
          `,
          code: dedent`
            import {
              aaa,

              // Partition comment

              c,
              bb,
            } from 'module'
          `,
        })
      },
    )
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

    it('sorts named imports', async () => {
      await valid({
        code: dedent`
          import { AAA, BB, C } from 'module'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'AAA',
              left: 'BB',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import { AAA, BB, C } from 'module'
        `,
        code: dedent`
          import { BB, AAA, C } from 'module'
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
          import {
            b,
            c,
            a,
          } from 'module'
        `,
        options: [options],
      })
    })

    it('enforces newlines between groups', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'a',
                groupName: 'a',
              },
              {
                elementNamePattern: 'b',
                groupName: 'b',
              },
            ],
            newlinesBetween: 'always',
            groups: ['b', 'a'],
          },
        ],
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'missedSpacingBetweenNamedImports',
          },
        ],
        output: dedent`
          import {
              b,

              a,
          } from 'module'
        `,
        code: dedent`
          import {
              b,
              a,
          } from 'module'
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

    it('sets alphabetical asc sorting as default', async () => {
      await valid("import { A, B, C } from 'module'")

      await valid({
        code: "import { log, log10, log1p, log2 } from 'module'",
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'C',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import { A, B, C } from 'module'
        `,
        code: dedent`
          import { B, C, A } from 'module'
        `,
      })
    })

    it('handles eslint-disable comments correctly', async () => {
      await valid({
        code: dedent`
          import {
            b,
            c,
            // eslint-disable-next-line
            a
          } from 'module'
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            b,
            c,
            // eslint-disable-next-line
            a
          } from 'module'
        `,
        code: dedent`
          import {
            c,
            b,
            // eslint-disable-next-line
            a
          } from 'module'
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            b,
            c,
            // eslint-disable-next-line
            a,
            d
          } from 'module'
        `,
        code: dedent`
          import {
            d,
            c,
            // eslint-disable-next-line
            a,
            b
          } from 'module'
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
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            b,
            c,
            a // eslint-disable-line
          } from 'module'
        `,
        code: dedent`
          import {
            c,
            b,
            a // eslint-disable-line
          } from 'module'
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            b,
            c,
            /* eslint-disable-next-line */
            a
          } from 'module'
        `,
        code: dedent`
          import {
            c,
            b,
            /* eslint-disable-next-line */
            a
          } from 'module'
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            b,
            c,
            a /* eslint-disable-line */
          } from 'module'
        `,
        code: dedent`
          import {
            c,
            b,
            a /* eslint-disable-line */
          } from 'module'
        `,
        options: [{}],
      })

      await invalid({
        output: dedent`
          import {
            a,
            d,
            /* eslint-disable */
            c,
            b,
            // Shouldn't move
            /* eslint-enable */
            e,
          } from 'module'
        `,
        code: dedent`
          import {
            d,
            e,
            /* eslint-disable */
            c,
            b,
            // Shouldn't move
            /* eslint-enable */
            a,
          } from 'module'
        `,
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          import {
            b,
            c,
            // eslint-disable-next-line rule-to-test/sort-named-imports
            a
          } from 'module'
        `,
        code: dedent`
          import {
            c,
            b,
            // eslint-disable-next-line rule-to-test/sort-named-imports
            a
          } from 'module'
        `,
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            b,
            c,
            a // eslint-disable-line rule-to-test/sort-named-imports
          } from 'module'
        `,
        code: dedent`
          import {
            c,
            b,
            a // eslint-disable-line rule-to-test/sort-named-imports
          } from 'module'
        `,
        options: [{}],
      })

      await invalid({
        output: dedent`
          import {
            b,
            c,
            /* eslint-disable-next-line rule-to-test/sort-named-imports */
            a
          } from 'module'
        `,
        code: dedent`
          import {
            c,
            b,
            /* eslint-disable-next-line rule-to-test/sort-named-imports */
            a
          } from 'module'
        `,
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        output: dedent`
          import {
            b,
            c,
            a /* eslint-disable-line rule-to-test/sort-named-imports */
          } from 'module'
        `,
        code: dedent`
          import {
            c,
            b,
            a /* eslint-disable-line rule-to-test/sort-named-imports */
          } from 'module'
        `,
        options: [{}],
      })

      await invalid({
        output: dedent`
          import {
            a,
            d,
            /* eslint-disable rule-to-test/sort-named-imports */
            c,
            b,
            // Shouldn't move
            /* eslint-enable */
            e,
          } from 'module'
        `,
        code: dedent`
          import {
            d,
            e,
            /* eslint-disable rule-to-test/sort-named-imports */
            c,
            b,
            // Shouldn't move
            /* eslint-enable */
            a,
          } from 'module'
        `,
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedNamedImportsOrder',
          },
        ],
        options: [{}],
      })
    })
  })
})
