import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import rule from '../../rules/sort-heritage-clauses'
import { Alphabet } from '../../utils/alphabet'

describe('sort-heritage-clauses', () => {
  let { invalid, valid } = createRuleTester({
    name: 'sort-heritage-clauses',
    parser: typescriptParser,
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('accepts sorted heritage clauses', async () => {
      await valid({
        code: dedent`
          interface Interface extends
            a,
            b,
            c {
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          interface Interface extends
            a {
          }
        `,
        options: [options],
      })
    })

    it('sorts simple heritage clauses', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          interface Interface extends
            a,
            b,
            c {
          }
        `,
        code: dedent`
          interface Interface extends
            a,
            c,
            b {
          }
        `,
        options: [options],
      })
    })

    it('sorts namespaced heritage clauses', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          interface Interface extends
            A.a,
            B.b,
            C.c {
          }
        `,
        code: dedent`
          interface Interface extends
            A.a,
            C.c,
            B.b {
          }
        `,
        options: [options],
      })
    })

    it('preserves comments when sorting heritage clauses', async () => {
      await invalid({
        output: dedent`
          interface Interface extends
            /**
             * Comment A
             */
            a,
            /**
             * Comment B
             */
            b,
            /* Comment C */
            c,
            // Comment D
            d {
          }
        `,
        code: dedent`
          interface Interface extends
            /**
             * Comment B
             */
            b,
            /**
             * Comment A
             */
            a,
            // Comment D
            d,
            /* Comment C */
            c {
          }
        `,
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'a', left: 'b' },
          },
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'c', left: 'd' },
          },
        ],
        options: [options],
      })
    })

    it('sorts heritage clauses with inline comments', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          interface Interface extends
            a // Comment A
            , b // Comment B
            {
          }
        `,
        code: dedent`
          interface Interface extends
            b // Comment B
            , a // Comment A
            {
          }
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
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'missedSpacingBetweenHeritageClauses',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          interface Interface extends
              b,

              a {}
        `,
        code: dedent`
          interface Interface extends
              a,
              b {}
        `,
      })
    })

    it('supports regex patterns in custom groups for heritage clauses', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          interface Interface extends
              iHaveFooInMyName,
              meTooIHaveFoo,
              a,
              b {
          }
        `,
      })
    })

    it('trims special characters in heritage clauses', async () => {
      await valid({
        code: dedent`
          interface MyInterface extends
            _a,
            b,
            _c {
          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
      })
    })

    it('removes special characters in heritage clauses', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          interface MyInterface extends
            ab,
            a_c {
          }
        `,
      })
    })

    it('sorts heritage clauses according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          interface MyInterface extends
            你好,
            世界,
            a,
            A,
            b,
            B {
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts inline heritage clauses in interfaces', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          interface Interface extends
            A, B
          {}
        `,
        code: dedent`
          interface Interface extends
            B, A
          {}
        `,
        options: [options],
      })
    })

    it('sorts inline heritage clauses in classes', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          class Class implements
            A, B
          {}
        `,
        code: dedent`
          class Class implements
            B, A
          {}
        `,
        options: [options],
      })
    })

    it.each([
      ['string pattern', 'Hello'],
      ['array of patterns', ['noMatch', 'Hello']],
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])(
      'groups elements by name pattern - %s',
      async (_, elementNamePattern) => {
        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'heritageClausesContainingHello',
                right: 'HelloInterface',
                leftGroup: 'unknown',
                left: 'B',
              },
              messageId: 'unexpectedHeritageClausesGroupOrder',
            },
          ],
          options: [
            {
              customGroups: [
                {
                  groupName: 'heritageClausesContainingHello',
                  elementNamePattern,
                },
              ],
              groups: ['heritageClausesContainingHello', 'unknown'],
            },
          ],
          output: dedent`
            class Class implements
              HelloInterface, A, B
            {}
          `,
          code: dedent`
            class Class implements
              A, B, HelloInterface
            {}
          `,
        })
      },
    )

    it('overrides sort type and order for specific groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'reversedContainingFooByLineLength',
              leftGroup: 'unknown',
              right: 'aFoo',
              left: 'p',
            },
            messageId: 'unexpectedHeritageClausesGroupOrder',
          },
          {
            data: {
              rightGroup: 'reversedContainingFooByLineLength',
              leftGroup: 'unknown',
              right: 'bbFoo',
              left: 'oo',
            },
            messageId: 'unexpectedHeritageClausesGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedContainingFooByLineLength',
                elementNamePattern: 'Foo',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedContainingFooByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          class Class implements
            bbFoo, aFoo, oo, p
          {}
        `,
        code: dedent`
          class Class implements
            p, aFoo, oo, bbFoo
          {}
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
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'fooBar', left: 'fooZar' },
          },
        ],
        output: dedent`
          class Class implements
            fooBar, fooZar
          {}
        `,
        code: dedent`
          class Class implements
            fooZar, fooBar
          {}
        `,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedContainingFoo',
                elementNamePattern: 'Foo',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedContainingFoo', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedContainingFoo',
              leftGroup: 'unknown',
              right: 'cFoo',
              left: 'm',
            },
            messageId: 'unexpectedHeritageClausesGroupOrder',
          },
        ],
        output: dedent`
          class Class implements
            bFoo, aFoo, dFoo, eFoo, cFoo, m
          {}
        `,
        code: dedent`
          class Class implements
            bFoo, aFoo, dFoo, eFoo, m, cFoo
          {}
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
          class Class implements
            iHaveFooInMyName, meTooIHaveFoo, a, b
          {}
        `,
      })
    })

    it('removes newlines between groups when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenHeritageClauses',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenHeritageClauses',
            data: { right: 'b', left: 'z' },
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
            newlinesBetween: 0,
          },
        ],
        code: dedent`
          class Class implements
              a,


             y,
            z,

                b
          {}
        `,
        output: dedent`
          class Class implements
              a,
             b,
            y,
                z
          {}
        `,
      })
    })

    it('adds newlines between groups when newlinesBetween is 1', async () => {
      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenHeritageClauses',
            data: { right: 'z', left: 'a' },
          },
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'y', left: 'z' },
          },
          {
            messageId: 'missedSpacingBetweenHeritageClauses',
            data: { right: 'b', left: 'y' },
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
              {
                elementNamePattern: 'b',
                groupName: 'b',
              },
            ],
            groups: ['a', 'unknown', 'b'],
            newlinesBetween: 1,
          },
        ],
        output: dedent`
          class Class implements
              a,

             y,
            z,

                b
          {}
        `,
        code: dedent`
          class Class implements
              a,


             z,
            y,
                b
          {}
        `,
      })
    })

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
              { newlinesBetween: 1 },
              'b',
              { newlinesBetween: 1 },
              'c',
              { newlinesBetween: 0 },
              'd',
              { newlinesBetween: 'ignore' },
              'e',
            ],
            newlinesBetween: 1,
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenHeritageClauses',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenHeritageClauses',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenHeritageClauses',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          class Class implements
            a,

            b,

            c,
            d,


            e
          {}
        `,
        code: dedent`
          class Class implements
            a,
            b,


            c,

            d,


            e
          {}
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
              messageId: 'missedSpacingBetweenHeritageClauses',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            class Class implements
              a,


              b
            {}
          `,
          code: dedent`
            class Class implements
              a,
              b
            {}
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
              customGroups: [
                { elementNamePattern: 'a', groupName: 'a' },
                { elementNamePattern: 'b', groupName: 'b' },
                { elementNamePattern: 'c', groupName: 'c' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'a',
                { newlinesBetween: 0 },
                'unusedGroup',
                { newlinesBetween: 0 },
                'b',
                { newlinesBetween: 1 },
                'c',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              messageId: 'extraSpacingBetweenHeritageClauses',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            class Class implements
              a,
              b
            {}
          `,
          code: dedent`
            class Class implements
              a,

              b
            {}
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
            class Class implements

              a,

              b
            {}
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
            class Class implements
              a,
              b
            {}
          `,
        })
      },
    )

    it('preserves inline comments when reordering elements', async () => {
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
            newlinesBetween: 1,
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
            messageId: 'unexpectedHeritageClausesGroupOrder',
          },
        ],
        output: dedent`
          class Class implements
            a, // Comment after

            b,
            c
          {}
        `,
        code: dedent`
          class Class implements
            b,
            a, // Comment after

            c
          {}
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
        output: dedent`
          class Class implements
            a,

            // Partition comment

            b,
            c
          {}
        `,
        code: dedent`
          class Class implements
            a,

            // Partition comment

            c,
            b
          {}
        `,
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
      })
    })

    it('allows to use newlinesInside: 1', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: '.*',
                groupName: 'group1',
                newlinesInside: 1,
              },
            ],
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenHeritageClauses',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          class Class implements
            a,

            b
          {}
        `,
        code: dedent`
          class Class implements
            a,
            b
          {}
        `,
      })
    })

    it('allows to use newlinesInside: 0', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: '.*',
                groupName: 'group1',
                newlinesInside: 0,
              },
            ],
            type: 'alphabetical',
            groups: ['group1'],
          },
        ],
        errors: [
          {
            messageId: 'extraSpacingBetweenHeritageClauses',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          class Class implements
            a,
            b
          {}
        `,
        code: dedent`
          class Class implements
            a,

            b
          {}
        `,
      })
    })

    it('sorts within newline-separated partitions', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'a', left: 'd' },
          },
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'b', left: 'e' },
          },
        ],
        output: dedent`
          class Class implements
            a,
            d,

            c,

            b,
            e
          {}
        `,
        code: dedent`
          class Class implements
            d,
            a,

            c,

            e,
            b
          {}
        `,
        options: [
          {
            partitionByNewLine: true,
            type: 'alphabetical',
          },
        ],
      })
    })

    it('sorts heritageClauses within partition comment boundaries', async () => {
      await invalid({
        output: dedent`
          class Class implements
            // Part: A
            // Not partition comment
            Bbb,
            Cc,
            D,
            // Part: B
            Aaaa,
            E,
            // Part: C
            // Not partition comment
            Fff,
            Gg
          {}
        `,
        code: dedent`
          class Class implements
            // Part: A
            Cc,
            D,
            // Not partition comment
            Bbb,
            // Part: B
            Aaaa,
            E,
            // Part: C
            Gg,
            // Not partition comment
            Fff
          {}
        `,
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'Bbb', left: 'D' },
          },
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'Fff', left: 'Gg' },
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

    it('treats all comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          class Class implements
            // Comment
            bb,
            // Other comment
            a
          {}
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
          class Class implements
            /* Partition Comment */
            // Part: A
            D,
            // Part: B
            Aaa,
            Bb,
            C,
            /* Other */
            E
          {}
        `,
        code: dedent`
          class Class implements
            /* Partition Comment */
            // Part: A
            D,
            // Part: B
            Aaa,
            C,
            Bb,
            /* Other */
            E
          {}
        `,
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'Bb', left: 'C' },
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
          class Class implements
            E,
            F,
            // I am a partition comment because I don't have f o o
            A,
            B
          {}
        `,
        options: [
          {
            ...options,
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores block comments when line comments are partition boundaries', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'A', left: 'B' },
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
          class Class implements
            /* Comment */
            A,
            B
          {}
        `,
        code: dedent`
          class Class implements
            B,
            /* Comment */
            A
          {}
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
          class Class implements
            B,
            // Comment
            A
          {}
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
          class Class implements
            C,
            // B
            B,
            // A
            A
          {}
        `,
      })
    })

    it('supports regex patterns for line comment partitions', async () => {
      await valid({
        code: dedent`
          class Class implements
            B,
            // I am a partition comment because I don't have f o o
            A
          {}
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

    it('ignores line comments when block comments are partition boundaries', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'A', left: 'B' },
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
          class Class implements
            // Comment
            A,
            B
          {}
        `,
        code: dedent`
          class Class implements
            B,
            // Comment
            A
          {}
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
          class Class implements
            B,
            /* Comment */
            A
          {}
        `,
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        code: dedent`
          class Class implements
            C,
            /* B */
            B,
            /* A */
            A
          {}
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

    it('supports regex patterns for block comment partitions', async () => {
      await valid({
        code: dedent`
          class Class implements
            B,
            /* I am a partition comment because I don't have f o o */
            A
          {}
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
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('accepts sorted heritage clauses', async () => {
      await valid({
        code: dedent`
          interface Interface extends
            a,
            b,
            c {
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          interface Interface extends
            a {
          }
        `,
        options: [options],
      })
    })

    it('sorts simple heritage clauses', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          interface Interface extends
            a,
            b,
            c {
          }
        `,
        code: dedent`
          interface Interface extends
            a,
            c,
            b {
          }
        `,
        options: [options],
      })
    })

    it('sorts namespaced heritage clauses', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          interface Interface extends
            A.a,
            B.b,
            C.c {
          }
        `,
        code: dedent`
          interface Interface extends
            A.a,
            C.c,
            B.b {
          }
        `,
        options: [options],
      })
    })

    it('preserves comments when sorting heritage clauses', async () => {
      await invalid({
        output: dedent`
          interface Interface extends
            /**
             * Comment A
             */
            a,
            /**
             * Comment B
             */
            b,
            /* Comment C */
            c,
            // Comment D
            d {
          }
        `,
        code: dedent`
          interface Interface extends
            /**
             * Comment B
             */
            b,
            /**
             * Comment A
             */
            a,
            // Comment D
            d,
            /* Comment C */
            c {
          }
        `,
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'a', left: 'b' },
          },
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'c', left: 'd' },
          },
        ],
        options: [options],
      })
    })

    it('sorts heritage clauses with inline comments', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          interface Interface extends
            a // Comment A
            , b // Comment B
            {
          }
        `,
        code: dedent`
          interface Interface extends
            b // Comment B
            , a // Comment A
            {
          }
        `,
        options: [options],
      })
    })

    it('supports regex patterns in custom groups for heritage clauses', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          interface Interface extends
              iHaveFooInMyName,
              meTooIHaveFoo,
              a,
              b {
          }
        `,
      })
    })

    it('trims special characters in heritage clauses', async () => {
      await valid({
        code: dedent`
          interface MyInterface extends
            _a,
            b,
            _c {
          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
      })
    })

    it('removes special characters in heritage clauses', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          interface MyInterface extends
            ab,
            a_c {
          }
        `,
      })
    })

    it('sorts heritage clauses according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          interface MyInterface extends
            你好,
            世界,
            a,
            A,
            b,
            B {
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts inline heritage clauses in interfaces', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          interface Interface extends
            A, B
          {}
        `,
        code: dedent`
          interface Interface extends
            B, A
          {}
        `,
        options: [options],
      })
    })

    it('sorts inline heritage clauses in classes', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'A', left: 'B' },
          },
        ],
        output: dedent`
          class Class implements
            A, B
          {}
        `,
        code: dedent`
          class Class implements
            B, A
          {}
        `,
        options: [options],
      })
    })
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('accepts sorted heritage clauses', async () => {
      await valid({
        code: dedent`
          interface Interface extends
            a,
            b,
            c {
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          interface Interface extends
            a {
          }
        `,
        options: [options],
      })
    })

    it('sorts simple heritage clauses', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        output: dedent`
          interface Interface extends
            aaa,
            bb,
            c {
          }
        `,
        code: dedent`
          interface Interface extends
            aaa,
            c,
            bb {
          }
        `,
        options: [options],
      })
    })

    it('sorts namespaced heritage clauses', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        output: dedent`
          interface Interface extends
            A.aaa,
            B.bb,
            C.c {
          }
        `,
        code: dedent`
          interface Interface extends
            A.aaa,
            C.c,
            B.bb {
          }
        `,
        options: [options],
      })
    })

    it('preserves comments when sorting heritage clauses', async () => {
      await invalid({
        output: dedent`
          interface Interface extends
            /**
             * Comment A
             */
            aaaa,
            /**
             * Comment B
             */
            bbb,
            /* Comment C */
            cc,
            // Comment D
            d {
          }
        `,
        code: dedent`
          interface Interface extends
            /**
             * Comment B
             */
            bbb,
            /**
             * Comment A
             */
            aaaa,
            // Comment D
            d,
            /* Comment C */
            cc {
          }
        `,
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'aaaa', left: 'bbb' },
          },
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'cc', left: 'd' },
          },
        ],
        options: [options],
      })
    })

    it('sorts heritage clauses with inline comments', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          interface Interface extends
            aa // Comment A
            , b // Comment B
            {
          }
        `,
        code: dedent`
          interface Interface extends
            b // Comment B
            , aa // Comment A
            {
          }
        `,
        options: [options],
      })
    })

    it('supports regex patterns in custom groups for heritage clauses', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^(?!.*Foo).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          interface Interface extends
              iHaveFooInMyName,
              meTooIHaveFoo,
              a,
              b {
          }
        `,
      })
    })

    it('trims special characters in heritage clauses', async () => {
      await valid({
        code: dedent`
          interface MyInterface extends
            _aaa,
            bb,
            _c {
          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
      })
    })

    it('removes special characters in heritage clauses', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          interface MyInterface extends
            abc,
            a_c {
          }
        `,
      })
    })

    it('sorts heritage clauses according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          interface MyInterface extends
            你好,
            世界,
            a,
            A,
            b,
            B {
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts inline heritage clauses in interfaces', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'AA', left: 'B' },
          },
        ],
        output: dedent`
          interface Interface extends
            AA, B
          {}
        `,
        code: dedent`
          interface Interface extends
            B, AA
          {}
        `,
        options: [options],
      })
    })

    it('sorts inline heritage clauses in classes', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'AA', left: 'B' },
          },
        ],
        output: dedent`
          class Class implements
            AA, B
          {}
        `,
        code: dedent`
          class Class implements
            B, AA
          {}
        `,
        options: [options],
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

    it('accepts sorted heritage clauses', async () => {
      await valid({
        code: dedent`
          interface Interface extends
            a,
            b,
            c {
          }
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          interface Interface extends
            a {
          }
        `,
        options: [options],
      })
    })

    it('sorts simple heritage clauses', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          interface Interface extends
            a,
            b,
            c {
          }
        `,
        code: dedent`
          interface Interface extends
            a,
            c,
            b {
          }
        `,
        options: [options],
      })
    })

    it('sorts namespaced heritage clauses', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          interface Interface extends
            A.a,
            B.b,
            C.c {
          }
        `,
        code: dedent`
          interface Interface extends
            A.a,
            C.c,
            B.b {
          }
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

    it('allows unsorted heritage clauses when sorting is not configured', async () => {
      await valid({
        code: dedent`
          interface Interface extends
            b,
            c,
            a
          {}
        `,
        options: [options],
      })
    })

    it('enforces custom group ordering in heritage clauses', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^a',
                groupName: 'a',
              },
              {
                elementNamePattern: '^b',
                groupName: 'b',
              },
            ],
            groups: ['b', 'a'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'b',
              leftGroup: 'a',
              right: 'ba',
              left: 'aa',
            },
            messageId: 'unexpectedHeritageClausesGroupOrder',
          },
        ],
        output: dedent`
          interface Interface extends
            ba,
            bb,
            ab,
            aa
          {}
        `,
        code: dedent`
          interface Interface extends
            ab,
            aa,
            ba,
            bb
          {}
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

    it('uses default sorting configuration', async () => {
      await valid(
        dedent`
          interface Interface extends
            a,
            b {
          }
        `,
      )

      await invalid({
        errors: [
          {
            messageId: 'unexpectedHeritageClausesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          interface Interface extends
            a,
            b {
          }
        `,
        code: dedent`
          interface Interface extends
            b,
            a {
          }
        `,
      })
    })

    describe('handles eslint-disable comments', () => {
      it('accepts heritage clauses with eslint-disable-next-line comments', async () => {
        await valid({
          code: dedent`
            class Class implements
              B,
              C,
              // eslint-disable-next-line
              A
            {}
          `,
        })
      })

      it('sorts heritage clauses with eslint-disable-next-line comments', async () => {
        await invalid({
          output: dedent`
            interface Interface extends
              B,
              C,
              // eslint-disable-next-line
              A
            {}
          `,
          code: dedent`
            interface Interface extends
              C,
              B,
              // eslint-disable-next-line
              A
            {}
          `,
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: { right: 'B', left: 'C' },
            },
          ],
          options: [{}],
        })

        await invalid({
          output: dedent`
            interface Interface extends
              B,
              C,
              /* eslint-disable-next-line */
              A
            {}
          `,
          code: dedent`
            interface Interface extends
              C,
              B,
              /* eslint-disable-next-line */
              A
            {}
          `,
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: { right: 'B', left: 'C' },
            },
          ],
          options: [{}],
        })
      })

      it('sorts heritage clauses with eslint-disable-line comments', async () => {
        await invalid({
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: { right: 'B', left: 'C' },
            },
          ],
          output: dedent`
            interface Interface extends
              B,
              C,
              A // eslint-disable-line
            {}
          `,
          code: dedent`
            interface Interface extends
              C,
              B,
              A // eslint-disable-line
            {}
          `,
          options: [{}],
        })

        await invalid({
          output: dedent`
            interface Interface extends
              B,
              C,
              A /* eslint-disable-line */
            {}
          `,
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: { right: 'B', left: 'C' },
            },
          ],
          code: dedent`
            interface Interface extends
              C,
              B,
              A /* eslint-disable-line */
            {}
          `,
          options: [{}],
        })
      })

      it('sorts heritage clauses with multiple eslint-disable comments', async () => {
        await invalid({
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: { right: 'C', left: 'D' },
            },
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: { right: 'B', left: 'A' },
            },
          ],
          output: dedent`
            interface Interface extends
              B,
              C,
              // eslint-disable-next-line
              A,
              D
            {}
          `,
          code: dedent`
            interface Interface extends
              D,
              C,
              // eslint-disable-next-line
              A,
              B
            {}
          `,
          options: [{}],
        })
      })

      it('respects eslint-disable/enable comment blocks', async () => {
        await invalid({
          output: dedent`
            interface Interface extends
              A,
              D,
              /* eslint-disable */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              E
            {}
          `,
          code: dedent`
            interface Interface extends
              D,
              E,
              /* eslint-disable */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              A
            {}
          `,
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: { right: 'A', left: 'B' },
            },
          ],
          options: [{}],
        })
      })

      it.each([
        ['interface extends', 'interface Interface extends'],
        ['class implements', 'class Class implements'],
      ])(
        'sorts %s with rule-specific eslint-disable comments',
        async (_description, declaration) => {
          await invalid({
            output: dedent`
              ${declaration}
                B,
                C,
                // eslint-disable-next-line rule-to-test/sort-heritage-clauses
                A
              {}
            `,
            code: dedent`
              ${declaration}
                C,
                B,
                // eslint-disable-next-line rule-to-test/sort-heritage-clauses
                A
              {}
            `,
            errors: [
              {
                messageId: 'unexpectedHeritageClausesOrder',
                data: { right: 'B', left: 'C' },
              },
            ],
            options: [{}],
          })

          await invalid({
            output: dedent`
              ${declaration}
                B,
                C,
                A // eslint-disable-line rule-to-test/sort-heritage-clauses
              {}
            `,
            code: dedent`
              ${declaration}
                C,
                B,
                A // eslint-disable-line rule-to-test/sort-heritage-clauses
              {}
            `,
            errors: [
              {
                messageId: 'unexpectedHeritageClausesOrder',
                data: { right: 'B', left: 'C' },
              },
            ],
            options: [{}],
          })

          await invalid({
            output: dedent`
              ${declaration}
                B,
                C,
                /* eslint-disable-next-line rule-to-test/sort-heritage-clauses */
                A
              {}
            `,
            code: dedent`
              ${declaration}
                C,
                B,
                /* eslint-disable-next-line rule-to-test/sort-heritage-clauses */
                A
              {}
            `,
            errors: [
              {
                messageId: 'unexpectedHeritageClausesOrder',
                data: { right: 'B', left: 'C' },
              },
            ],
            options: [{}],
          })

          await invalid({
            output: dedent`
              ${declaration}
                B,
                C,
                A /* eslint-disable-line rule-to-test/sort-heritage-clauses */
              {}
            `,
            code: dedent`
              ${declaration}
                C,
                B,
                A /* eslint-disable-line rule-to-test/sort-heritage-clauses */
              {}
            `,
            errors: [
              {
                messageId: 'unexpectedHeritageClausesOrder',
                data: { right: 'B', left: 'C' },
              },
            ],
            options: [{}],
          })
        },
      )

      it('respects rule-specific eslint-disable/enable blocks', async () => {
        await invalid({
          output: dedent`
            interface Interface extends
              A,
              D,
              /* eslint-disable rule-to-test/sort-heritage-clauses */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              E
            {}
          `,
          code: dedent`
            interface Interface extends
              D,
              E,
              /* eslint-disable rule-to-test/sort-heritage-clauses */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              A
            {}
          `,
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: { right: 'A', left: 'B' },
            },
          ],
          options: [{}],
        })

        await invalid({
          output: dedent`
            class Class implements
              A,
              D,
              /* eslint-disable rule-to-test/sort-heritage-clauses */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              E
            {}
          `,
          code: dedent`
            class Class implements
              D,
              E,
              /* eslint-disable rule-to-test/sort-heritage-clauses */
              C,
              B,
              // Shouldn't move
              /* eslint-enable */
              A
            {}
          `,
          errors: [
            {
              messageId: 'unexpectedHeritageClausesOrder',
              data: { right: 'A', left: 'B' },
            },
          ],
          options: [{}],
        })
      })
    })
  })
})
