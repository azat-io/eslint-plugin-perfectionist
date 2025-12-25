import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-maps'

describe('sort-maps', () => {
  let { invalid, valid } = createRuleTester({
    parser: typescriptParser,
    name: 'sort-maps',
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('preserves spread elements position when sorting map entries', async () => {
      await valid({
        code: dedent`
          new Map([
            ['a', 'a'],
          ])
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          new Map([
            ['c', 'cc'],
            ['d', 'd'],
            ...rest,
            ['a', 'aa'],
            ['b', 'b'],
          ])
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          new Map([
            ['c', 'cc'],
            ['d', 'd'],
            ...rest,
            ['a', 'aa'],
            ['b', 'b'],
          ])
        `,
        code: dedent`
          new Map([
            ['c', 'cc'],
            ['d', 'd'],
            ...rest,
            ['b', 'b'],
            ['a', 'aa'],
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: "'a'", left: "'b'" },
          },
        ],
        options: [options],
      })
    })

    it('allows any order for spread elements', async () => {
      await valid({
        code: dedent`
          new Map([
            ...aaa,
            ...bb,
          ])
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          new Map([
            ...bb,
            ...aaa,
          ])
        `,
        options: [options],
      })
    })

    it('sorts entries with variable identifiers as keys', async () => {
      await valid({
        code: dedent`
          new Map([
            [aa, aa],
            [b, b],
          ])
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          new Map([
            [aa, aa],
            [b, b],
          ])
        `,
        code: dedent`
          new Map([
            [b, b],
            [aa, aa],
          ])
        `,
        options: [options],
      })
    })

    it('sorts entries with numeric keys', async () => {
      await valid({
        code: dedent`
          new Map([
            [1, 'one'],
            [2, 'two'],
            [3, 'three'],
          ])
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: '1', left: '2' },
          },
        ],
        output: dedent`
          new Map([
            [1, 'one'],
            [2, 'two'],
            [3, 'three'],
          ])
        `,
        code: dedent`
          new Map([
            [2, 'two'],
            [1, 'one'],
            [3, 'three'],
          ])
        `,
        options: [options],
      })
    })

    it('sorts variable identifiers without array notation', async () => {
      await valid({
        code: dedent`
          new Map([
            aaaa,
            bbb,
            cc,
            d,
          ])
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'cc', left: 'd' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'bbb', left: 'cc' },
          },
        ],
        output: dedent`
          new Map([
            aaaa,
            bbb,
            cc,
            d,
          ])
        `,
        code: dedent`
          new Map([
            aaaa,
            d,
            cc,
            bbb,
          ])
        `,
        options: [options],
      })
    })

    it('sorts entries within newline-separated groups independently', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'a', left: 'd' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'e' },
          },
        ],
        output: dedent`
          new Map([
            [a, 'a'],
            [d, 'd'],

            [c, 'c'],

            [b, 'b'],
            [e, 'e'],
          ])
        `,
        code: dedent`
          new Map([
            [d, 'd'],
            [a, 'a'],

            [c, 'c'],

            [e, 'e'],
            [b, 'b'],
          ])
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('creates partitions based on matching comments', async () => {
      await invalid({
        output: dedent`
          new Map([
            // Part: A
            // Not partition comment
            [bbb, 'bbb'],
            [cc, 'cc'],
            [d, 'd'],
            // Part: B
            [aaaa, 'aaaa'],
            [e, 'e'],
            // Part: C
            // Not partition comment
            [fff, 'fff'],
            [gg, 'gg'],
          ])
        `,
        code: dedent`
          new Map([
            // Part: A
            [cc, 'cc'],
            [d, 'd'],
            // Not partition comment
            [bbb, 'bbb'],
            // Part: B
            [aaaa, 'aaaa'],
            [e, 'e'],
            // Part: C
            [gg, 'gg'],
            // Not partition comment
            [fff, 'fff'],
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'bbb', left: 'd' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'fff', left: 'gg' },
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
          new Map([
            // Comment
            [bb, 'bb'],
            // Other comment
            [a, 'a'],
          ])
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
          new Map([
            /* Partition Comment */
            // Part: A
            [d, 'd'],
            // Part: B
            [aaa, 'aaa'],
            [bb, 'bb'],
            [c, 'c'],
            /* Other */
            [e, 'e'],
          ])
        `,
        code: dedent`
          new Map([
            /* Partition Comment */
            // Part: A
            [d, 'd'],
            // Part: B
            [aaa, 'aaa'],
            [c, 'c'],
            [bb, 'bb'],
            /* Other */
            [e, 'e'],
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'bb', left: 'c' },
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
          new Map([
            ['e', 'e'],
            ['f', 'f'],
            // I am a partition comment because I don't have f o o
            ['a', 'a'],
            ['b', 'b'],
          ])
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
            messageId: 'unexpectedMapElementsOrder',
            data: { right: "'a'", left: "'b'" },
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
          new Map([
            /* Comment */
            ['a', 'a'],
            ['b', 'b'],
          ])
        `,
        code: dedent`
          new Map([
            ['b', 'b'],
            /* Comment */
            ['a', 'a'],
          ])
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
          new Map([
            ['b', 'b'],
            // Comment
            ['a', 'a'],
          ])
        `,
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
        code: dedent`
          new Map([
            ['c', 'c'],
            // b
            ['b', 'b'],
            // a
            ['a', 'a'],
          ])
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for line comments', async () => {
      await valid({
        code: dedent`
          new Map([
            ['b', 'b'],
            // I am a partition comment because I don't have f o o
            ['a', 'a'],
          ])
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

    it('ignores line comments when block comments are specified', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: "'a'", left: "'b'" },
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
          new Map([
            // Comment
            ['a', 'a'],
            ['b', 'b'],
          ])
        `,
        code: dedent`
          new Map([
            ['b', 'b'],
            // Comment
            ['a', 'a'],
          ])
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
          new Map([
            ['b', 'b'],
            /* Comment */
            ['a', 'a'],
          ])
        `,
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        code: dedent`
          new Map([
            ['c', 'c'],
            /* b */
            ['b', 'b'],
            /* a */
            ['a', 'a'],
          ])
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for block comments', async () => {
      await valid({
        code: dedent`
          new Map([
            ['b', 'b'],
            /* I am a partition comment because I don't have f o o */
            ['a', 'a'],
          ])
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

    it('ignores special characters at start when trimming', async () => {
      await valid({
        code: dedent`
          new Map([
            [_a, 'a'],
            [b, 'b'],
            [_c, 'c'],
          ])
        `,
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
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
          new Map([
            [ab, 'ab'],
            [a_c, 'ac'],
          ])
        `,
      })
    })

    it('sorts elements according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          new Map([
            [你好, '你好'],
            [世界, '世界'],
            [a, 'a'],
            [A, 'A'],
            [b, 'b'],
            [B, 'B'],
          ])
        `,
        options: [{ ...options, locales: 'zh-CN' }],
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
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'missedSpacingBetweenMapElementsMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          new Map([
            [b, 2],

            [a, 1],
          ])
        `,
        code: dedent`
          new Map([
            [a, 1],
            [b, 2],
          ])
        `,
      })
    })

    it('applies custom groups based on element name patterns', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'keysStartingWithHello',
              leftGroup: 'unknown',
              right: "'helloKey'",
              left: "'b'",
            },
            messageId: 'unexpectedMapElementsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'keysStartingWithHello',
                elementNamePattern: 'hello',
              },
            ],
            groups: ['keysStartingWithHello', 'unknown'],
          },
        ],
        output: dedent`
          new Map([
            ['helloKey', 3],
            ['a', 1],
            ['b', 2]
          ])
        `,
        code: dedent`
          new Map([
            ['a', 1],
            ['b', 2],
            ['helloKey', 3]
          ])
        `,
      })
    })

    it('overrides sort type and order for specific groups', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: '_bb', left: '_a' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: '_ccc', left: '_bb' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: '_dddd', left: '_ccc' },
          },
          {
            data: {
              rightGroup: 'reversedStartingWith_ByLineLength',
              leftGroup: 'unknown',
              right: '_eee',
              left: 'm',
            },
            messageId: 'unexpectedMapElementsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedStartingWith_ByLineLength',
                elementNamePattern: '_',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedStartingWith_ByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          new Map([
            [_dddd, null],
            [_ccc, null],
            [_eee, null],
            [_bb, null],
            [_ff, null],
            [_a, null],
            [_g, null],
            [m, null],
            [o, null],
            [p, null]
          ])
        `,
        code: dedent`
          new Map([
            [_a, null],
            [_bb, null],
            [_ccc, null],
            [_dddd, null],
            [m, null],
            [_eee, null],
            [_ff, null],
            [_g, null],
            [o, null],
            [p, null]
          ])
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
            messageId: 'unexpectedMapElementsOrder',
          },
        ],
        output: dedent`
          new Map([
            [fooBar, fooBar],
            [fooZar, fooZar],
          ])
        `,
        code: dedent`
          new Map([
            [fooZar, fooZar],
            [fooBar, fooBar],
          ])
        `,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedStartingWith_',
                elementNamePattern: '_',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedStartingWith_', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedStartingWith_',
              leftGroup: 'unknown',
              right: "'_c'",
              left: "'m'",
            },
            messageId: 'unexpectedMapElementsGroupOrder',
          },
        ],
        output: dedent`
          new Map([
            ['_b', null],
            ['_a', null],
            ['_d', null],
            ['_e', null],
            ['_c', null],
            ['m', null]
          ])
        `,
        code: dedent`
          new Map([
            ['_b', null],
            ['_a', null],
            ['_d', null],
            ['_e', null],
            ['m', null],
            ['_c', null]
          ])
        `,
      })
    })

    it('combines multiple patterns with anyOf', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    elementNamePattern: 'foo',
                  },
                  {
                    elementNamePattern: 'Foo',
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
              right: "'...foo'",
              left: "'a'",
            },
            messageId: 'unexpectedMapElementsGroupOrder',
          },
        ],
        output: dedent`
          new Map([
            ['...foo', null],
            ['cFoo', null],
            ['a', null]
          ])
        `,
        code: dedent`
          new Map([
            ['a', null],
            ['...foo', null],
            ['cFoo', null]
          ])
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
          new Map([
            ['iHaveFooInMyName', null],
            ['meTooIHaveFoo', null],
            ['a', null],
            ['b', null]
          ])
        `,
      })
    })

    it('removes newlines between and inside groups by default when "newlinesBetween" is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenMapElementsMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenMapElementsMembers',
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
          new Map([
            [a, null],


           [y, null],
          [z, null],

              [b, null]
          ])
        `,
        output: dedent`
          new Map([
            [a, null],
           [b, null],
          [y, null],
              [z, null]
          ])
        `,
      })
    })

    it('removes extra newlines inside groups when newlinesInside is 0', async () => {
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
            newlinesInside: 0,
          },
        ],
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenMapElementsMembers',
            data: { right: 'b', left: 'z' },
          },
        ],
        output: dedent`
          new Map([
            [a, null],


           [b, null],
          [y, null],
              [z, null]
          ])
        `,
        code: dedent`
          new Map([
            [a, null],


           [y, null],
          [z, null],

              [b, null]
          ])
        `,
      })
    })

    it('removes extra newlines between groups when newlinesBetween is 0', async () => {
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
            newlinesInside: 'ignore',
            newlinesBetween: 0,
          },
        ],
        errors: [
          {
            messageId: 'extraSpacingBetweenMapElementsMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'z' },
          },
        ],
        code: dedent`
          new Map([
            [a, null],


           [y, null],
          [z, null],

              [b, null]
          ])
        `,
        output: dedent`
          new Map([
            [a, null],
           [b, null],
          [y, null],

              [z, null]
          ])
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
            messageId: 'missedSpacingBetweenMapElementsMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenMapElementsMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenMapElementsMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          new Map([
            [a, null],

            [b, null],

            [c, null],
            [d, null],


            [e, null]
          ])
        `,
        code: dedent`
          new Map([
            [a, null],
            [b, null],


            [c, null],

            [d, null],


            [e, null]
          ])
        `,
      })
    })

    it.each([
      ['2 spaces globally with 0 in group', 2, 0],
      ['2 spaces globally with ignore in group', 2, 'ignore'],
      ['0 globally with 2 spaces in group', 0, 2],
      ['ignore globally with 2 spaces in group', 'ignore', 2],
    ])(
      'adds newlines between groups when %s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
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
              messageId: 'missedSpacingBetweenMapElementsMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            new Map([
              [a, 'a'],


              [b, 'b'],
            ])
          `,
          code: dedent`
            new Map([
              [a, 'a'],
              [b, 'b'],
            ])
          `,
        })
      },
    )

    it.each([
      ['1 space', 1],
      ['2 spaces', 2],
      ['ignore', 'ignore'],
      ['0', 0],
    ])(
      'removes newlines when 0 is between groups despite %s global setting',
      async (_description, globalNewlinesBetween) => {
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
              messageId: 'extraSpacingBetweenMapElementsMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            new Map([
              [a, 'a'],
              [b, 'b'],
            ])
          `,
          code: dedent`
            new Map([
              [a, 'a'],

              [b, 'b'],
            ])
          `,
        })
      },
    )

    it.each([
      ['ignore globally with 0 in group', 'ignore', 0],
      ['0 globally with ignore in group', 0, 'ignore'],
    ])(
      'allows any spacing when %s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
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
            new Map([
              [a, 'a'],

              [b, 'b'],
            ])
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
            new Map([
              [a, 'a'],
              [b, 'b'],
            ])
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
            newlinesInside: 0,
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
            messageId: 'unexpectedMapElementsGroupOrder',
          },
        ],
        output: dedent`
          new Map([
            [a, null], // Comment after

            [b, null],
            [c, null]
          ])
        `,
        code: dedent`
          new Map([
            [b, null],
            [a, null], // Comment after

            [c, null]
          ])
        `,
      })
    })

    it('preserves partition boundaries when newlinesBetween is 0', async () => {
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
          new Map([
            [a, 'a'],

            // Partition comment

            [b, 'b'],
            [c, 'c'],
          ])
        `,
        code: dedent`
          new Map([
            [a, 'a'],

            // Partition comment

            [c, 'c'],
            [b, 'b'],
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
      })
    })

    it.each([
      ['string pattern', 'foo'],
      ['array with string patterns', ['noMatch', 'foo']],
      ['regex pattern object', { pattern: 'FOO', flags: 'i' }],
      [
        'array with regex pattern object',
        ['noMatch', { pattern: 'FOO', flags: 'i' }],
      ],
    ])(
      'applies conditional configuration when all names match %s',
      async (_description, allNamesMatchPattern) => {
        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                allNamesMatchPattern,
              },
            },
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: '^r$',
                  groupName: 'r',
                },
                {
                  elementNamePattern: '^g$',
                  groupName: 'g',
                },
                {
                  elementNamePattern: '^b$',
                  groupName: 'b',
                },
              ],
              useConfigurationIf: {
                allNamesMatchPattern: '^r|g|b$',
              },
              groups: ['r', 'g', 'b'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'g',
                leftGroup: 'b',
                right: 'g',
                left: 'b',
              },
              messageId: 'unexpectedMapElementsGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedMapElementsGroupOrder',
            },
          ],
          output: dedent`
            new Map([
              [r, null],
              [g, null],
              [b, null]
            ])
          `,
          code: dedent`
            new Map([
              [b, null],
              [g, null],
              [r, null]
            ])
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

    it('preserves spread elements position when sorting map entries', async () => {
      await valid({
        code: dedent`
          new Map([
            ['a', 'a'],
          ])
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          new Map([
            ['c', 'cc'],
            ['d', 'd'],
            ...rest,
            ['a', 'aa'],
            ['b', 'b'],
          ])
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          new Map([
            ['c', 'cc'],
            ['d', 'd'],
            ...rest,
            ['a', 'aa'],
            ['b', 'b'],
          ])
        `,
        code: dedent`
          new Map([
            ['c', 'cc'],
            ['d', 'd'],
            ...rest,
            ['b', 'b'],
            ['a', 'aa'],
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: "'a'", left: "'b'" },
          },
        ],
        options: [options],
      })
    })

    it('allows any order for spread elements', async () => {
      await valid({
        code: dedent`
          new Map([
            ...aaa,
            ...bb,
          ])
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          new Map([
            ...bb,
            ...aaa,
          ])
        `,
        options: [options],
      })
    })

    it('sorts entries with variable identifiers as keys', async () => {
      await valid({
        code: dedent`
          new Map([
            [aa, aa],
            [b, b],
          ])
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          new Map([
            [aa, aa],
            [b, b],
          ])
        `,
        code: dedent`
          new Map([
            [b, b],
            [aa, aa],
          ])
        `,
        options: [options],
      })
    })

    it('sorts entries with numeric keys', async () => {
      await valid({
        code: dedent`
          new Map([
            [1, 'one'],
            [2, 'two'],
            [3, 'three'],
          ])
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: '1', left: '2' },
          },
        ],
        output: dedent`
          new Map([
            [1, 'one'],
            [2, 'two'],
            [3, 'three'],
          ])
        `,
        code: dedent`
          new Map([
            [2, 'two'],
            [1, 'one'],
            [3, 'three'],
          ])
        `,
        options: [options],
      })
    })

    it('sorts variable identifiers without array notation', async () => {
      await valid({
        code: dedent`
          new Map([
            aaaa,
            bbb,
            cc,
            d,
          ])
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'cc', left: 'd' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'bbb', left: 'cc' },
          },
        ],
        output: dedent`
          new Map([
            aaaa,
            bbb,
            cc,
            d,
          ])
        `,
        code: dedent`
          new Map([
            aaaa,
            d,
            cc,
            bbb,
          ])
        `,
        options: [options],
      })
    })

    it('sorts entries within newline-separated groups independently', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'a', left: 'd' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'e' },
          },
        ],
        output: dedent`
          new Map([
            [a, 'a'],
            [d, 'd'],

            [c, 'c'],

            [b, 'b'],
            [e, 'e'],
          ])
        `,
        code: dedent`
          new Map([
            [d, 'd'],
            [a, 'a'],

            [c, 'c'],

            [e, 'e'],
            [b, 'b'],
          ])
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('creates partitions based on matching comments', async () => {
      await invalid({
        output: dedent`
          new Map([
            // Part: A
            // Not partition comment
            [bbb, 'bbb'],
            [cc, 'cc'],
            [d, 'd'],
            // Part: B
            [aaaa, 'aaaa'],
            [e, 'e'],
            // Part: C
            // Not partition comment
            [fff, 'fff'],
            [gg, 'gg'],
          ])
        `,
        code: dedent`
          new Map([
            // Part: A
            [cc, 'cc'],
            [d, 'd'],
            // Not partition comment
            [bbb, 'bbb'],
            // Part: B
            [aaaa, 'aaaa'],
            [e, 'e'],
            // Part: C
            [gg, 'gg'],
            // Not partition comment
            [fff, 'fff'],
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'bbb', left: 'd' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'fff', left: 'gg' },
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
          new Map([
            // Comment
            [bb, 'bb'],
            // Other comment
            [a, 'a'],
          ])
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
          new Map([
            /* Partition Comment */
            // Part: A
            [d, 'd'],
            // Part: B
            [aaa, 'aaa'],
            [bb, 'bb'],
            [c, 'c'],
            /* Other */
            [e, 'e'],
          ])
        `,
        code: dedent`
          new Map([
            /* Partition Comment */
            // Part: A
            [d, 'd'],
            // Part: B
            [aaa, 'aaa'],
            [c, 'c'],
            [bb, 'bb'],
            /* Other */
            [e, 'e'],
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'bb', left: 'c' },
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
          new Map([
            ['e', 'e'],
            ['f', 'f'],
            // I am a partition comment because I don't have f o o
            ['a', 'a'],
            ['b', 'b'],
          ])
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
            messageId: 'unexpectedMapElementsOrder',
            data: { right: "'a'", left: "'b'" },
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
          new Map([
            /* Comment */
            ['a', 'a'],
            ['b', 'b'],
          ])
        `,
        code: dedent`
          new Map([
            ['b', 'b'],
            /* Comment */
            ['a', 'a'],
          ])
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
          new Map([
            ['b', 'b'],
            // Comment
            ['a', 'a'],
          ])
        `,
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
        code: dedent`
          new Map([
            ['c', 'c'],
            // b
            ['b', 'b'],
            // a
            ['a', 'a'],
          ])
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for line comments', async () => {
      await valid({
        code: dedent`
          new Map([
            ['b', 'b'],
            // I am a partition comment because I don't have f o o
            ['a', 'a'],
          ])
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

    it('ignores line comments when block comments are specified', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: "'a'", left: "'b'" },
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
          new Map([
            // Comment
            ['a', 'a'],
            ['b', 'b'],
          ])
        `,
        code: dedent`
          new Map([
            ['b', 'b'],
            // Comment
            ['a', 'a'],
          ])
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
          new Map([
            ['b', 'b'],
            /* Comment */
            ['a', 'a'],
          ])
        `,
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        code: dedent`
          new Map([
            ['c', 'c'],
            /* b */
            ['b', 'b'],
            /* a */
            ['a', 'a'],
          ])
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for block comments', async () => {
      await valid({
        code: dedent`
          new Map([
            ['b', 'b'],
            /* I am a partition comment because I don't have f o o */
            ['a', 'a'],
          ])
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

    it('ignores special characters at start when trimming', async () => {
      await valid({
        code: dedent`
          new Map([
            [_a, 'a'],
            [b, 'b'],
            [_c, 'c'],
          ])
        `,
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
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
          new Map([
            [ab, 'ab'],
            [a_c, 'ac'],
          ])
        `,
      })
    })

    it('sorts elements according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          new Map([
            [你好, '你好'],
            [世界, '世界'],
            [a, 'a'],
            [A, 'A'],
            [b, 'b'],
            [B, 'B'],
          ])
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('applies custom groups based on element name patterns', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'keysStartingWithHello',
              leftGroup: 'unknown',
              right: "'helloKey'",
              left: "'b'",
            },
            messageId: 'unexpectedMapElementsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'keysStartingWithHello',
                elementNamePattern: 'hello',
              },
            ],
            groups: ['keysStartingWithHello', 'unknown'],
          },
        ],
        output: dedent`
          new Map([
            ['helloKey', 3],
            ['a', 1],
            ['b', 2]
          ])
        `,
        code: dedent`
          new Map([
            ['a', 1],
            ['b', 2],
            ['helloKey', 3]
          ])
        `,
      })
    })

    it('overrides sort type and order for specific groups', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: '_bb', left: '_a' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: '_ccc', left: '_bb' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: '_dddd', left: '_ccc' },
          },
          {
            data: {
              rightGroup: 'reversedStartingWith_ByLineLength',
              leftGroup: 'unknown',
              right: '_eee',
              left: 'm',
            },
            messageId: 'unexpectedMapElementsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedStartingWith_ByLineLength',
                elementNamePattern: '_',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedStartingWith_ByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          new Map([
            [_dddd, null],
            [_ccc, null],
            [_eee, null],
            [_bb, null],
            [_ff, null],
            [_a, null],
            [_g, null],
            [m, null],
            [o, null],
            [p, null]
          ])
        `,
        code: dedent`
          new Map([
            [_a, null],
            [_bb, null],
            [_ccc, null],
            [_dddd, null],
            [m, null],
            [_eee, null],
            [_ff, null],
            [_g, null],
            [o, null],
            [p, null]
          ])
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
            messageId: 'unexpectedMapElementsOrder',
          },
        ],
        output: dedent`
          new Map([
            [fooBar, fooBar],
            [fooZar, fooZar],
          ])
        `,
        code: dedent`
          new Map([
            [fooZar, fooZar],
            [fooBar, fooBar],
          ])
        `,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedStartingWith_',
                elementNamePattern: '_',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedStartingWith_', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedStartingWith_',
              leftGroup: 'unknown',
              right: "'_c'",
              left: "'m'",
            },
            messageId: 'unexpectedMapElementsGroupOrder',
          },
        ],
        output: dedent`
          new Map([
            ['_b', null],
            ['_a', null],
            ['_d', null],
            ['_e', null],
            ['_c', null],
            ['m', null]
          ])
        `,
        code: dedent`
          new Map([
            ['_b', null],
            ['_a', null],
            ['_d', null],
            ['_e', null],
            ['m', null],
            ['_c', null]
          ])
        `,
      })
    })

    it('combines multiple patterns with anyOf', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    elementNamePattern: 'foo',
                  },
                  {
                    elementNamePattern: 'Foo',
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
              right: "'...foo'",
              left: "'a'",
            },
            messageId: 'unexpectedMapElementsGroupOrder',
          },
        ],
        output: dedent`
          new Map([
            ['...foo', null],
            ['cFoo', null],
            ['a', null]
          ])
        `,
        code: dedent`
          new Map([
            ['a', null],
            ['...foo', null],
            ['cFoo', null]
          ])
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
          new Map([
            ['iHaveFooInMyName', null],
            ['meTooIHaveFoo', null],
            ['a', null],
            ['b', null]
          ])
        `,
      })
    })

    it('removes extra newlines between groups when newlinesBetween is 0', async () => {
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
            newlinesInside: 'ignore',
            newlinesBetween: 0,
          },
        ],
        errors: [
          {
            messageId: 'extraSpacingBetweenMapElementsMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'z' },
          },
        ],
        code: dedent`
          new Map([
            [a, null],


           [y, null],
          [z, null],

              [b, null]
          ])
        `,
        output: dedent`
          new Map([
            [a, null],
           [b, null],
          [y, null],

              [z, null]
          ])
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
            messageId: 'missedSpacingBetweenMapElementsMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenMapElementsMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenMapElementsMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          new Map([
            [a, null],

            [b, null],

            [c, null],
            [d, null],


            [e, null]
          ])
        `,
        code: dedent`
          new Map([
            [a, null],
            [b, null],


            [c, null],

            [d, null],


            [e, null]
          ])
        `,
      })
    })

    it.each([
      ['2 spaces globally with 0 in group', 2, 0],
      ['2 spaces globally with ignore in group', 2, 'ignore'],
      ['0 globally with 2 spaces in group', 0, 2],
      ['ignore globally with 2 spaces in group', 'ignore', 2],
    ])(
      'adds newlines between groups when %s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
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
              messageId: 'missedSpacingBetweenMapElementsMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            new Map([
              [a, 'a'],


              [b, 'b'],
            ])
          `,
          code: dedent`
            new Map([
              [a, 'a'],
              [b, 'b'],
            ])
          `,
        })
      },
    )

    it.each([
      ['1 space', 1],
      ['2 spaces', 2],
      ['ignore', 'ignore'],
      ['0', 0],
    ])(
      'removes newlines when 0 is between groups despite %s global setting',
      async (_description, globalNewlinesBetween) => {
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
              messageId: 'extraSpacingBetweenMapElementsMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            new Map([
              [a, 'a'],
              [b, 'b'],
            ])
          `,
          code: dedent`
            new Map([
              [a, 'a'],

              [b, 'b'],
            ])
          `,
        })
      },
    )

    it.each([
      ['ignore globally with 0 in group', 'ignore', 0],
      ['0 globally with ignore in group', 0, 'ignore'],
    ])(
      'allows any spacing when %s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
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
            new Map([
              [a, 'a'],

              [b, 'b'],
            ])
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
            new Map([
              [a, 'a'],
              [b, 'b'],
            ])
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
            newlinesInside: 0,
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
            messageId: 'unexpectedMapElementsGroupOrder',
          },
        ],
        output: dedent`
          new Map([
            [a, null], // Comment after

            [b, null],
            [c, null]
          ])
        `,
        code: dedent`
          new Map([
            [b, null],
            [a, null], // Comment after

            [c, null]
          ])
        `,
      })
    })

    it('preserves partition boundaries when newlinesBetween is 0', async () => {
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
          new Map([
            [a, 'a'],

            // Partition comment

            [b, 'b'],
            [c, 'c'],
          ])
        `,
        code: dedent`
          new Map([
            [a, 'a'],

            // Partition comment

            [c, 'c'],
            [b, 'b'],
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
      })
    })

    it.each([
      ['string pattern', 'foo'],
      ['array with string patterns', ['noMatch', 'foo']],
      ['regex pattern object', { pattern: 'FOO', flags: 'i' }],
      [
        'array with regex pattern object',
        ['noMatch', { pattern: 'FOO', flags: 'i' }],
      ],
    ])(
      'applies conditional configuration when all names match %s',
      async (_description, allNamesMatchPattern) => {
        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                allNamesMatchPattern,
              },
            },
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: '^r$',
                  groupName: 'r',
                },
                {
                  elementNamePattern: '^g$',
                  groupName: 'g',
                },
                {
                  elementNamePattern: '^b$',
                  groupName: 'b',
                },
              ],
              useConfigurationIf: {
                allNamesMatchPattern: '^r|g|b$',
              },
              groups: ['r', 'g', 'b'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'g',
                leftGroup: 'b',
                right: 'g',
                left: 'b',
              },
              messageId: 'unexpectedMapElementsGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedMapElementsGroupOrder',
            },
          ],
          output: dedent`
            new Map([
              [r, null],
              [g, null],
              [b, null]
            ])
          `,
          code: dedent`
            new Map([
              [b, null],
              [g, null],
              [r, null]
            ])
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

    it('preserves spread elements position when sorting map entries', async () => {
      await valid({
        code: dedent`
          new Map([
            ['a', 'a'],
          ])
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          new Map([
            ['c', 'cc'],
            ['d', 'd'],
            ...rest,
            ['a', 'aa'],
            ['b', 'b'],
          ])
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          new Map([
            ['c', 'cc'],
            ['d', 'd'],
            ...rest,
            ['a', 'aa'],
            ['b', 'b'],
          ])
        `,
        code: dedent`
          new Map([
            ['c', 'cc'],
            ['d', 'd'],
            ...rest,
            ['b', 'b'],
            ['a', 'aa'],
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: "'a'", left: "'b'" },
          },
        ],
        options: [options],
      })
    })

    it('allows any order for spread elements', async () => {
      await valid({
        code: dedent`
          new Map([
            ...aaa,
            ...bb,
          ])
        `,
        options: [options],
      })

      await valid({
        code: dedent`
          new Map([
            ...bb,
            ...aaa,
          ])
        `,
        options: [options],
      })
    })

    it('sorts entries with variable identifiers as keys', async () => {
      await valid({
        code: dedent`
          new Map([
            [aa, aa],
            [b, b],
          ])
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          new Map([
            [aa, aa],
            [b, b],
          ])
        `,
        code: dedent`
          new Map([
            [b, b],
            [aa, aa],
          ])
        `,
        options: [options],
      })
    })

    it('sorts entries with numeric keys', async () => {
      await valid({
        code: dedent`
          new Map([
            [3, 'three'],
            [1, 'one'],
            [2, 'two'],
          ])
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: '3', left: '1' },
          },
        ],
        output: dedent`
          new Map([
            [3, 'three'],
            [2, 'two'],
            [1, 'one'],
          ])
        `,
        code: dedent`
          new Map([
            [2, 'two'],
            [1, 'one'],
            [3, 'three'],
          ])
        `,
        options: [options],
      })
    })

    it('sorts variable identifiers without array notation', async () => {
      await valid({
        code: dedent`
          new Map([
            aaaa,
            bbb,
            cc,
            d,
          ])
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'cc', left: 'd' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'bbb', left: 'cc' },
          },
        ],
        output: dedent`
          new Map([
            aaaa,
            bbb,
            cc,
            d,
          ])
        `,
        code: dedent`
          new Map([
            aaaa,
            d,
            cc,
            bbb,
          ])
        `,
        options: [options],
      })
    })

    it('sorts entries within newline-separated groups independently', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'a', left: 'd' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'e' },
          },
        ],
        output: dedent`
          new Map([
            [a, 'aaaaa'],
            [d, 'dd'],

            [c, 'ccc'],

            [b, 'bbbb'],
            [e, 'e'],
          ])
        `,
        code: dedent`
          new Map([
            [d, 'dd'],
            [a, 'aaaaa'],

            [c, 'ccc'],

            [e, 'e'],
            [b, 'bbbb'],
          ])
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
      })
    })

    it('creates partitions based on matching comments', async () => {
      await invalid({
        output: dedent`
          new Map([
            // Part: A
            // Not partition comment
            [bbb, 'bbb'],
            [cc, 'cc'],
            [d, 'd'],
            // Part: B
            [aaaa, 'aaaa'],
            [e, 'e'],
            // Part: C
            // Not partition comment
            [fff, 'fff'],
            [gg, 'gg'],
          ])
        `,
        code: dedent`
          new Map([
            // Part: A
            [cc, 'cc'],
            [d, 'd'],
            // Not partition comment
            [bbb, 'bbb'],
            // Part: B
            [aaaa, 'aaaa'],
            [e, 'e'],
            // Part: C
            [gg, 'gg'],
            // Not partition comment
            [fff, 'fff'],
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'bbb', left: 'd' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'fff', left: 'gg' },
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
          new Map([
            // Comment
            [bb, 'bb'],
            // Other comment
            [a, 'a'],
          ])
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
          new Map([
            /* Partition Comment */
            // Part: A
            [d, 'd'],
            // Part: B
            [aaa, 'aaa'],
            [bb, 'bb'],
            [c, 'c'],
            /* Other */
            [e, 'e'],
          ])
        `,
        code: dedent`
          new Map([
            /* Partition Comment */
            // Part: A
            [d, 'd'],
            // Part: B
            [aaa, 'aaa'],
            [c, 'c'],
            [bb, 'bb'],
            /* Other */
            [e, 'e'],
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'bb', left: 'c' },
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
          new Map([
            ['e', 'e'],
            ['f', 'f'],
            // I am a partition comment because I don't have f o o
            ['a', 'a'],
            ['b', 'b'],
          ])
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
            messageId: 'unexpectedMapElementsOrder',
            data: { right: "'aa'", left: "'b'" },
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
          new Map([
            /* Comment */
            ['aa', 'a'],
            ['b', 'b'],
          ])
        `,
        code: dedent`
          new Map([
            ['b', 'b'],
            /* Comment */
            ['aa', 'a'],
          ])
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
          new Map([
            ['b', 'b'],
            // Comment
            ['a', 'a'],
          ])
        `,
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
        code: dedent`
          new Map([
            ['c', 'c'],
            // b
            ['b', 'b'],
            // a
            ['a', 'a'],
          ])
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for line comments', async () => {
      await valid({
        code: dedent`
          new Map([
            ['b', 'b'],
            // I am a partition comment because I don't have f o o
            ['a', 'a'],
          ])
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

    it('ignores line comments when block comments are specified', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: "'aa'", left: "'b'" },
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
          new Map([
            // Comment
            ['aa', 'a'],
            ['b', 'b'],
          ])
        `,
        code: dedent`
          new Map([
            ['b', 'b'],
            // Comment
            ['aa', 'a'],
          ])
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
          new Map([
            ['b', 'b'],
            /* Comment */
            ['a', 'a'],
          ])
        `,
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        code: dedent`
          new Map([
            ['c', 'c'],
            /* b */
            ['b', 'b'],
            /* a */
            ['a', 'a'],
          ])
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['a', 'b'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for block comments', async () => {
      await valid({
        code: dedent`
          new Map([
            ['b', 'b'],
            /* I am a partition comment because I don't have f o o */
            ['a', 'a'],
          ])
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

    it('ignores special characters at start when trimming', async () => {
      await valid({
        code: dedent`
          new Map([
            [_aa, 'a'],
            [bb, 'b'],
            [_c, 'c'],
          ])
        `,
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
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
          new Map([
            [abc, 'ab'],
            [a_c, 'ac'],
          ])
        `,
      })
    })

    it('sorts elements according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          new Map([
            [你好, '你好'],
            [世界, '世界'],
            [a, 'a'],
            [A, 'A'],
            [b, 'b'],
            [B, 'B'],
          ])
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('applies custom groups based on element name patterns', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'keysStartingWithHello',
              leftGroup: 'unknown',
              right: "'helloKey'",
              left: "'b'",
            },
            messageId: 'unexpectedMapElementsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'keysStartingWithHello',
                elementNamePattern: 'hello',
              },
            ],
            groups: ['keysStartingWithHello', 'unknown'],
          },
        ],
        output: dedent`
          new Map([
            ['helloKey', 3],
            ['a', 1],
            ['b', 2]
          ])
        `,
        code: dedent`
          new Map([
            ['a', 1],
            ['b', 2],
            ['helloKey', 3]
          ])
        `,
      })
    })

    it('overrides sort type and order for specific groups', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: '_bb', left: '_a' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: '_ccc', left: '_bb' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: '_dddd', left: '_ccc' },
          },
          {
            data: {
              rightGroup: 'reversedStartingWith_ByLineLength',
              leftGroup: 'unknown',
              right: '_eee',
              left: 'm',
            },
            messageId: 'unexpectedMapElementsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedStartingWith_ByLineLength',
                elementNamePattern: '_',
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedStartingWith_ByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          new Map([
            [_dddd, null],
            [_ccc, null],
            [_eee, null],
            [_bb, null],
            [_ff, null],
            [_a, null],
            [_g, null],
            [m, null],
            [o, null],
            [p, null]
          ])
        `,
        code: dedent`
          new Map([
            [_a, null],
            [_bb, null],
            [_ccc, null],
            [_dddd, null],
            [m, null],
            [_eee, null],
            [_ff, null],
            [_g, null],
            [o, null],
            [p, null]
          ])
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
            messageId: 'unexpectedMapElementsOrder',
          },
        ],
        output: dedent`
          new Map([
            [fooBar, fooBar],
            [fooZar, fooZar],
          ])
        `,
        code: dedent`
          new Map([
            [fooZar, fooZar],
            [fooBar, fooBar],
          ])
        `,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedStartingWith_',
                elementNamePattern: '_',
                type: 'unsorted',
              },
            ],
            groups: ['unsortedStartingWith_', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedStartingWith_',
              leftGroup: 'unknown',
              right: "'_c'",
              left: "'m'",
            },
            messageId: 'unexpectedMapElementsGroupOrder',
          },
        ],
        output: dedent`
          new Map([
            ['_b', null],
            ['_a', null],
            ['_d', null],
            ['_e', null],
            ['_c', null],
            ['m', null]
          ])
        `,
        code: dedent`
          new Map([
            ['_b', null],
            ['_a', null],
            ['_d', null],
            ['_e', null],
            ['m', null],
            ['_c', null]
          ])
        `,
      })
    })

    it('combines multiple patterns with anyOf', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    elementNamePattern: 'foo',
                  },
                  {
                    elementNamePattern: 'Foo',
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
              right: "'...foo'",
              left: "'a'",
            },
            messageId: 'unexpectedMapElementsGroupOrder',
          },
        ],
        output: dedent`
          new Map([
            ['...foo', null],
            ['cFoo', null],
            ['a', null]
          ])
        `,
        code: dedent`
          new Map([
            ['a', null],
            ['...foo', null],
            ['cFoo', null]
          ])
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
          new Map([
            ['iHaveFooInMyName', null],
            ['meTooIHaveFoo', null],
            ['a', null],
            ['b', null]
          ])
        `,
      })
    })

    it('removes extra newlines between groups when newlinesBetween is 0', async () => {
      await invalid({
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
            newlinesInside: 'ignore',
            newlinesBetween: 0,
          },
        ],
        errors: [
          {
            data: {
              left: 'aaaa',
              right: 'yy',
            },
            messageId: 'extraSpacingBetweenMapElementsMembers',
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'bbb', left: 'z' },
          },
        ],
        code: dedent`
          new Map([
            [aaaa, null],


           [yy, null],
          [z, null],

              [bbb, null]
          ])
        `,
        output: dedent`
          new Map([
            [aaaa, null],
           [bbb, null],
          [yy, null],

              [z, null]
          ])
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
            messageId: 'missedSpacingBetweenMapElementsMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenMapElementsMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenMapElementsMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          new Map([
            [a, null],

            [b, null],

            [c, null],
            [d, null],


            [e, null]
          ])
        `,
        code: dedent`
          new Map([
            [a, null],
            [b, null],


            [c, null],

            [d, null],


            [e, null]
          ])
        `,
      })
    })

    it.each([
      ['2 spaces globally with 0 in group', 2, 0],
      ['2 spaces globally with ignore in group', 2, 'ignore'],
      ['0 globally with 2 spaces in group', 0, 2],
      ['ignore globally with 2 spaces in group', 'ignore', 2],
    ])(
      'adds newlines between groups when %s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
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
              messageId: 'missedSpacingBetweenMapElementsMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            new Map([
              [a, 'a'],


              [b, 'b'],
            ])
          `,
          code: dedent`
            new Map([
              [a, 'a'],
              [b, 'b'],
            ])
          `,
        })
      },
    )

    it.each([
      ['1 space', 1],
      ['2 spaces', 2],
      ['ignore', 'ignore'],
      ['0', 0],
    ])(
      'removes newlines when 0 is between groups despite %s global setting',
      async (_description, globalNewlinesBetween) => {
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
              messageId: 'extraSpacingBetweenMapElementsMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            new Map([
              [a, 'a'],
              [b, 'b'],
            ])
          `,
          code: dedent`
            new Map([
              [a, 'a'],

              [b, 'b'],
            ])
          `,
        })
      },
    )

    it.each([
      ['ignore globally with 0 in group', 'ignore', 0],
      ['0 globally with ignore in group', 0, 'ignore'],
    ])(
      'allows any spacing when %s',
      async (_description, globalNewlinesBetween, groupNewlinesBetween) => {
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
            new Map([
              [a, 'a'],

              [b, 'b'],
            ])
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
            new Map([
              [a, 'a'],
              [b, 'b'],
            ])
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
            newlinesInside: 0,
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
            messageId: 'unexpectedMapElementsGroupOrder',
          },
        ],
        output: dedent`
          new Map([
            [a, null], // Comment after

            [b, null],
            [c, null]
          ])
        `,
        code: dedent`
          new Map([
            [b, null],
            [a, null], // Comment after

            [c, null]
          ])
        `,
      })
    })

    it('preserves partition boundaries when newlinesBetween is 0', async () => {
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
            newlinesBetween: 0,
          },
        ],
        output: dedent`
          new Map([
            [aaa, 'a'],

            // Partition comment

            [bb, 'b'],
            [c, 'c'],
          ])
        `,
        code: dedent`
          new Map([
            [aaa, 'a'],

            // Partition comment

            [c, 'c'],
            [bb, 'b'],
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
      })
    })

    it.each([
      ['string pattern', 'foo'],
      ['array with string patterns', ['noMatch', 'foo']],
      ['regex pattern object', { pattern: 'FOO', flags: 'i' }],
      [
        'array with regex pattern object',
        ['noMatch', { pattern: 'FOO', flags: 'i' }],
      ],
    ])(
      'applies conditional configuration when all names match %s',
      async (_description, allNamesMatchPattern) => {
        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                allNamesMatchPattern,
              },
            },
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: '^r$',
                  groupName: 'r',
                },
                {
                  elementNamePattern: '^g$',
                  groupName: 'g',
                },
                {
                  elementNamePattern: '^b$',
                  groupName: 'b',
                },
              ],
              useConfigurationIf: {
                allNamesMatchPattern: '^r|g|b$',
              },
              groups: ['r', 'g', 'b'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'g',
                leftGroup: 'b',
                right: 'g',
                left: 'b',
              },
              messageId: 'unexpectedMapElementsGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedMapElementsGroupOrder',
            },
          ],
          output: dedent`
            new Map([
              [r, null],
              [g, null],
              [b, null]
            ])
          `,
          code: dedent`
            new Map([
              [b, null],
              [g, null],
              [r, null]
            ])
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

    it('sorts entries with variable identifiers as keys', async () => {
      await valid({
        code: dedent`
          new Map([
            [aa, aa],
            [b, b],
          ])
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          new Map([
            [aa, aa],
            [b, b],
          ])
        `,
        code: dedent`
          new Map([
            [b, b],
            [aa, aa],
          ])
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

    it('allows any order when type is unsorted', async () => {
      await valid({
        code: dedent`
          new Map([
            [b, b],
            [c, c],
            [a, a],
          ])
        `,
        options: [options],
      })
    })

    it('enforces grouping even with unsorted type', async () => {
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
            messageId: 'unexpectedMapElementsGroupOrder',
          },
        ],
        output: dedent`
          new Map([
            [ba, ba],
            [bb, bb],
            [ab, ab],
            [aa, aa],
          ])
        `,
        code: dedent`
          new Map([
            [ab, ab],
            [aa, aa],
            [ba, ba],
            [bb, bb],
          ])
        `,
      })
    })

    it('enforces newlines between groups with unsorted type', async () => {
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
            newlinesBetween: 1,
            groups: ['b', 'a'],
          },
        ],
        errors: [
          {
            messageId: 'missedSpacingBetweenMapElementsMembers',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          new Map([
            [b, b],

            [a, a],
          ])
        `,
        code: dedent`
          new Map([
            [b, b],
            [a, a],
          ])
        `,
      })
    })
  })

  describe('misc', () => {
    it('validates the JSON schema', async () => {
      await expect(
        validateRuleJsonSchema(rule.meta.schema),
      ).resolves.not.toThrowError()
    })

    it('uses alphabetical ascending order by default', async () => {
      await valid(
        dedent`
          new Map([
            ['CNY', 'Renminbi'],
            ['EUR', 'Euro'],
            ['GBP', 'Sterling'],
            ['RUB', 'Russian ruble'],
            ['USD', 'United States dollar'],
          ])
        `,
      )

      await valid({
        code: dedent`
          new Map([
            ['img1.png', '/img1.png'],
            ['img10.png', '/img10.png'],
            ['img12.png', '/img12.png'],
            ['img2.png', '/img2.png']
          ])
        `,
        options: [{}],
      })

      await invalid({
        output: dedent`
          new Map([
            ['CNY', 'Renminbi'],
            ['EUR', 'Euro'],
            ['GBP', 'Sterling'],
            ['RUB', 'Russian ruble'],
            ['USD', 'United States dollar'],
          ])
        `,
        code: dedent`
          new Map([
            ['CNY', 'Renminbi'],
            ['RUB', 'Russian ruble'],
            ['USD', 'United States dollar'],
            ['EUR', 'Euro'],
            ['GBP', 'Sterling'],
          ])
        `,
        errors: [
          {
            data: { right: "'EUR'", left: "'USD'" },
            messageId: 'unexpectedMapElementsOrder',
          },
        ],
      })
    })

    it('handles empty maps and single-element maps', async () => {
      await valid('new Map([[], []])')
      await valid('new Map()')
    })

    it('respects natural sorting with numeric separators', async () => {
      await valid({
        code: dedent`
           new Map([
            [1, "first"],
            [2, "second"],
            [3, "third"],
            [100, "hundredth"],
            [1_000, "thousandth"],
            [1_000_000, "millionth"]
          ])
        `,
        options: [
          {
            type: 'natural',
            order: 'asc',
          },
        ],
      })

      await invalid({
        output: dedent`
           new Map([
            [1, "first"],
            [2, "second"],
            [3, "third"],
            [100, "hundredth"],
            [1_000, "thousandth"],
            [1_000_000, "millionth"]
          ])
        `,
        code: dedent`
           new Map([
            [1, "first"],
            [2, "second"],
            [3, "third"],
            [1_000, "thousandth"],
            [100, "hundredth"],
            [1_000_000, "millionth"]
          ])
        `,
        errors: [
          {
            data: {
              left: '1_000',
              right: '100',
            },
            messageId: 'unexpectedMapElementsOrder',
          },
        ],
        options: [
          {
            type: 'natural',
            order: 'asc',
          },
        ],
      })
    })

    it('respects the global settings configuration', async () => {
      let settings = {
        perfectionist: {
          type: 'line-length',
          order: 'desc',
        },
      }

      await valid({
        code: dedent`
          new Map([
            [ccc, 'ccc'],
            [bb, 'bb'],
            [a, 'a']
          ])
        `,
        options: [{}],
        settings,
      })

      await valid({
        code: dedent`
          new Map([
            [a, 'a'],
            [bb, 'bb'],
            [ccc, 'ccc'],
          ])
        `,
        options: [{ type: 'alphabetical', order: 'asc' }],
        settings,
      })
    })

    it('excludes disabled elements from sorting', async () => {
      await valid({
        code: dedent`
          new Map([
            [b, 'b'],
            [c, 'c'],
            // eslint-disable-next-line
            [a, 'a'],
          ])
        `,
      })
    })

    it('handles inline eslint-disable comments', async () => {
      await invalid({
        output: dedent`
          new Map([
            [b, 'b'],
            [c, 'c'],
            // eslint-disable-next-line
            [a, 'a']
          ])
        `,
        code: dedent`
          new Map([
            [c, 'c'],
            [b, 'b'],
            // eslint-disable-next-line
            [a, 'a']
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          new Map([
            [b, 'b'],
            [c, 'c'],
            [a, 'a'] // eslint-disable-line
          ])
        `,
        code: dedent`
          new Map([
            [c, 'c'],
            [b, 'b'],
            [a, 'a'] // eslint-disable-line
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          new Map([
            [b, 'b'],
            [c, 'c'],
            /* eslint-disable-next-line */
            [a, 'a']
          ])
        `,
        code: dedent`
          new Map([
            [c, 'c'],
            [b, 'b'],
            /* eslint-disable-next-line */
            [a, 'a']
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          new Map([
            [b, 'b'],
            [c, 'c'],
            [a, 'a'] /* eslint-disable-line */
          ])
        `,
        code: dedent`
          new Map([
            [c, 'c'],
            [b, 'b'],
            [a, 'a'] /* eslint-disable-line */
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })
    })

    it('respects eslint-disable blocks', async () => {
      await invalid({
        output: dedent`
          new Map([
            [a, 'a'],
            [d, 'd'],
            /* eslint-disable */
            [c, 'c'],
            [b, 'b'],
            // Shouldn't move
            /* eslint-enable */
            [e, 'e'],
          ])
        `,
        code: dedent`
          new Map([
            [d, 'd'],
            [e, 'e'],
            /* eslint-disable */
            [c, 'c'],
            [b, 'b'],
            // Shouldn't move
            /* eslint-enable */
            [a, 'a'],
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [{}],
      })
    })

    it('handles rule-specific eslint-disable comments', async () => {
      await invalid({
        output: dedent`
          new Map([
            [b, 'b'],
            [c, 'c'],
            // eslint-disable-next-line rule-to-test/sort-maps
            [a, 'a']
          ])
        `,
        code: dedent`
          new Map([
            [c, 'c'],
            [b, 'b'],
            // eslint-disable-next-line rule-to-test/sort-maps
            [a, 'a']
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          new Map([
            [b, 'b'],
            [c, 'c'],
            [a, 'a'] // eslint-disable-line rule-to-test/sort-maps
          ])
        `,
        code: dedent`
          new Map([
            [c, 'c'],
            [b, 'b'],
            [a, 'a'] // eslint-disable-line rule-to-test/sort-maps
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          new Map([
            [b, 'b'],
            [c, 'c'],
            /* eslint-disable-next-line rule-to-test/sort-maps */
            [a, 'a']
          ])
        `,
        code: dedent`
          new Map([
            [c, 'c'],
            [b, 'b'],
            /* eslint-disable-next-line rule-to-test/sort-maps */
            [a, 'a']
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          new Map([
            [b, 'b'],
            [c, 'c'],
            [a, 'a'] /* eslint-disable-line rule-to-test/sort-maps */
          ])
        `,
        code: dedent`
          new Map([
            [c, 'c'],
            [b, 'b'],
            [a, 'a'] /* eslint-disable-line rule-to-test/sort-maps */
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          new Map([
            [a, 'a'],
            [d, 'd'],
            /* eslint-disable rule-to-test/sort-maps */
            [c, 'c'],
            [b, 'b'],
            // Shouldn't move
            /* eslint-enable */
            [e, 'e'],
          ])
        `,
        code: dedent`
          new Map([
            [d, 'd'],
            [e, 'e'],
            /* eslint-disable rule-to-test/sort-maps */
            [c, 'c'],
            [b, 'b'],
            // Shouldn't move
            /* eslint-enable */
            [a, 'a'],
          ])
        `,
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [{}],
      })
    })

    it('handles eslint-disable with partitionByComment', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'c', left: 'd' },
          },
          {
            messageId: 'unexpectedMapElementsOrder',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          new Map([
            [b, 'b'],
            [c, 'c'],
            // eslint-disable-next-line
            [a, 'a'],
            [d, 'd']
          ])
        `,
        code: dedent`
          new Map([
            [d, 'd'],
            [c, 'c'],
            // eslint-disable-next-line
            [a, 'a'],
            [b, 'b']
          ])
        `,
        options: [
          {
            partitionByComment: true,
          },
        ],
      })
    })
  })
})
