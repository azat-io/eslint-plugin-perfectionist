import typescriptParser from '@typescript-eslint/parser'
import { describe, it } from 'vitest'
import dedent from 'dedent'

import { createTypedRuleTester } from './create-typed-rule-tester'
import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-exports'

describe('sort-exports', () => {
  let { invalid, valid } = createTypedRuleTester({
    parser: typescriptParser,
    name: 'sort-exports',
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('sorts exports', async () => {
      await valid({
        code: dedent`
          export { a1 } from 'a'
          export { b1, b2 } from 'b'
          export { c1, c2, c3 } from 'c'
          export { d1, d2 } from 'd'
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
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { a1 } from 'a'
          export { b1, b2 } from 'b'
          export { c1, c2, c3 } from 'c'
          export { d1, d2 } from 'd'
        `,
        code: dedent`
          export { b1, b2 } from 'b'
          export { a1 } from 'a'
          export { d1, d2 } from 'd'
          export { c1, c2, c3 } from 'c'
        `,
        options: [options],
      })
    })

    it('sorts all-exports', async () => {
      await valid({
        code: dedent`
          export { a1 } from './a'
          export * as b from './b'
          export { c1, c2 } from './c'
          export { d } from './d'
          export * from 'e'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: './a',
              left: './b',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: './d',
              left: 'e',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { a1 } from './a'
          export * as b from './b'
          export { c1, c2 } from './c'
          export { d } from './d'
          export * from 'e'
        `,
        code: dedent`
          export * as b from './b'
          export { a1 } from './a'
          export { c1, c2 } from './c'
          export * from 'e'
          export { d } from './d'
        `,
        options: [options],
      })
    })

    it('works with export aliases', async () => {
      await valid({
        code: dedent`
          export { a1 as aX } from './a'
          export { default as b } from './b'
          export { c1, c2 } from './c'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: './b',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { a1 as aX } from './a'
          export { default as b } from './b'
          export { c1, c2 } from './c'
        `,
        code: dedent`
          export { a1 as aX } from './a'
          export { c1, c2 } from './c'
          export { default as b } from './b'
        `,
        options: [options],
      })
    })

    it('allows to use new line as partition', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: './organisms',
              right: './atoms',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              left: './second-folder',
              right: './folder',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export * from "./atoms";
          export * from "./organisms";
          export * from "./shared";

          export { Named } from './folder';
          export { AnotherNamed } from './second-folder';
        `,
        code: dedent`
          export * from "./organisms";
          export * from "./atoms";
          export * from "./shared";

          export { AnotherNamed } from './second-folder';
          export { Named } from './folder';
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
        output: dedent`
          // Part: A
          // Not partition comment
          export * from './bbb';
          export * from './cc';
          export * from './d';
          // Part: B
          export * from './aaaa';
          export * from './e';
          // Part: C
          // Not partition comment
          export * from './fff';
          export * from './gg';
        `,
        code: dedent`
          // Part: A
          export * from './cc';
          export * from './d';
          // Not partition comment
          export * from './bbb';
          // Part: B
          export * from './aaaa';
          export * from './e';
          // Part: C
          export * from './gg';
          // Not partition comment
          export * from './fff';
        `,
        errors: [
          {
            data: {
              right: './bbb',
              left: './d',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: './fff',
              left: './gg',
            },
            messageId: 'unexpectedExportsOrder',
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

    it('allows to use all comments as parts', async () => {
      await valid({
        code: dedent`
          // Comment
          export * from './bb';
          // Other comment
          export * from './a';
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
          /* Partition Comment */
          // Part: A
          export * from './d'
          // Part: B
          export * from './aaa'
          export * from './bb'
          export * from './c'
          /* Other */
          export * from './e'
        `,
        code: dedent`
          /* Partition Comment */
          // Part: A
          export * from './d'
          // Part: B
          export * from './aaa'
          export * from './c'
          export * from './bb'
          /* Other */
          export * from './e'
        `,
        errors: [
          {
            data: {
              right: './bb',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
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
          export * from './e'
          export * from './f'
          // I am a partition comment because I don't have f o o
          export * from './a'
          export * from './b'
        `,
        options: [
          {
            ...options,
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores line comments when using block comment partitions', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: './a',
              left: './b',
            },
            messageId: 'unexpectedExportsOrder',
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
          // Comment
          export * from './a'
          export * from './b'
        `,
        code: dedent`
          export * from './b'
          // Comment
          export * from './a'
        `,
      })
    })

    it('allows to use block comments as partition boundaries', async () => {
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
          export * from './b'
          /* Comment */
          export * from './a'
        `,
      })
    })

    it('allows to use multiple block comment patterns for partitions', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['a', 'b'],
            },
          },
        ],
        code: dedent`
          export * from './c'
          /* b */
          export * from './b'
          /* a */
          export * from './a'
        `,
      })
    })

    it('allows to use regex patterns for block comment partitions', async () => {
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
          export * from './b'
          /* I am a partition comment because I don't have f o o */
          export * from './a'
        `,
      })
    })

    it('sorts exports with values-first group kind', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: './d',
              left: './f',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: './c',
              left: './e',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: './a',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { A } from "./a";
          export { B } from "./b";
          export { C } from "./c";
          export type { D } from "./d";
          export type { E } from "./e";
          export type { F } from "./f";
        `,
        code: dedent`
          export type { F } from "./f";
          export type { D } from "./d";
          export type { E } from "./e";
          export { C } from "./c";
          export { A } from "./a";
          export { B } from "./b";
        `,
        options: [
          {
            ...options,
            groupKind: 'values-first',
          },
        ],
      })
    })

    it('sorts exports with types-first group kind', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: './a',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: './f',
              left: './b',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: './d',
              left: './f',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export type { D } from "./d";
          export type { E } from "./e";
          export type { F } from "./f";
          export { A } from "./a";
          export { B } from "./b";
          export { C } from "./c";
        `,
        code: dedent`
          export { C } from "./c";
          export { A } from "./a";
          export { B } from "./b";
          export type { F } from "./f";
          export type { D } from "./d";
          export type { E } from "./e";
        `,
        options: [
          {
            ...options,
            groupKind: 'types-first',
          },
        ],
      })
    })

    it('allows to trim special characters', async () => {
      await valid({
        code: dedent`
          export { a } from '_a'
          export { b } from 'b'
          export { c } from '_c'
        `,
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
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
          export { ab } from 'ab'
          export { ac } from 'a_c'
        `,
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          export { 你好 } from '你好'
          export { 世界 } from '世界'
          export { a } from 'a'
          export { A } from 'A'
          export { b } from 'b'
          export { B } from 'B'
        `,
        options: [{ ...options, locales: 'zh-CN' }],
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
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { a } from "a"; export { b } from "b";
        `,
        code: dedent`
          export { b } from "b"; export { a } from "a"
        `,
        options: [options],
      })
    })

    it('sorts inline elements with semicolons correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { a } from "a"; export { b } from "b";
        `,
        code: dedent`
          export { b } from "b"; export { a } from "a";
        `,
        options: [options],
      })
    })

    it('allows to use predefined groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'value-export',
              leftGroup: 'type-export',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['value-export', 'type-export'],
          },
        ],
        output: dedent`
          export { b } from 'b';
          export type { a } from 'a';
        `,
        code: dedent`
          export type { a } from 'a';
          export { b } from 'b';
        `,
      })
    })

    it('filters on modifier', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'valueExports',
              leftGroup: 'unknown',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'valueExports',
                modifiers: ['value'],
              },
            ],
            groups: ['valueExports', 'unknown'],
          },
        ],
        output: dedent`
          export { b } from 'b';
          export type { a } from 'a';
        `,
        code: dedent`
          export type { a } from 'a';
          export { b } from 'b';
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array pattern', ['noMatch', 'hello']],
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])(
      'filters on elementNamePattern - %s',
      async (_description, elementNamePattern) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                {
                  groupName: 'valuesStartingWithHello',
                  modifiers: ['value'],
                  elementNamePattern,
                },
              ],
              groups: ['valuesStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'valuesStartingWithHello',
                right: 'helloExport',
                leftGroup: 'unknown',
                left: 'b',
              },
              messageId: 'unexpectedExportsGroupOrder',
            },
          ],
          output: dedent`
            export { helloExport } from 'helloExport';
            export { a } from 'a';
            export { b } from 'b';
          `,
          code: dedent`
            export { a } from 'a';
            export { b } from 'b';
            export { helloExport } from 'helloExport';
          `,
        })
      },
    )

    it('handles complex regex in elementNamePattern', async () => {
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
          export { iHaveFooInMyName } from 'iHaveFooInMyName';
          export { meTooIHaveFoo } from 'meTooIHaveFoo';
          export { a } from 'a';
          export { b } from 'b';
        `,
      })
    })

    it('sort custom groups by overriding type and order', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              rightGroup: 'reversedValuesByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: 'm',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedValuesByLineLength',
                modifiers: ['value'],
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedValuesByLineLength', 'unknown'],
            type: 'alphabetical',
            groupKind: 'mixed',
            order: 'asc',
          },
        ],
        output: dedent`
          export { dddd } from 'dddd';
          export { ccc } from 'ccc';
          export { eee } from 'eee';
          export { bb } from 'bb';
          export { ff } from 'ff';
          export { a } from 'a';
          export { g } from 'g';
          export type { m } from 'm';
          export type { o } from 'o';
          export type { p } from 'p';
        `,
        code: dedent`
          export { a } from 'a';
          export { bb } from 'bb';
          export { ccc } from 'ccc';
          export { dddd } from 'dddd';
          export type { m } from 'm';
          export { eee } from 'eee';
          export { ff } from 'ff';
          export { g } from 'g';
          export type { o } from 'o';
          export type { p } from 'p';
        `,
      })
    })

    it('sort custom groups by overriding fallbackSort', async () => {
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
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { fooBar } from 'fooBar';
          export { fooZar } from 'fooZar';
        `,
        code: dedent`
          export { fooZar } from 'fooZar';
          export { fooBar } from 'fooBar';
        `,
      })
    })

    it('does not sort custom groups with unsorted type', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedValues',
                modifiers: ['value'],
                type: 'unsorted',
              },
            ],
            groups: ['unsortedValues', 'unknown'],
            groupKind: 'mixed',
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedValues',
              leftGroup: 'unknown',
              right: 'c',
              left: 'm',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        output: dedent`
          export { b } from 'b';
          export { a } from 'a';
          export { d } from 'd';
          export { e } from 'e';
          export { c } from 'c';
          export type { m } from 'm';
        `,
        code: dedent`
          export { b } from 'b';
          export { a } from 'a';
          export { d } from 'd';
          export { e } from 'e';
          export type { m } from 'm';
          export { c } from 'c';
        `,
      })
    })

    it('sort custom group blocks', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    elementNamePattern: 'foo|Foo',
                    modifiers: ['value'],
                  },
                  {
                    elementNamePattern: 'foo|Foo',
                    modifiers: ['type'],
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
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        output: dedent`
          export { cFoo } from 'cFoo';
          export type { foo } from 'foo';
          export { a } from 'a';
        `,
        code: dedent`
          export { a } from 'a';
          export { cFoo } from 'cFoo';
          export type { foo } from 'foo';
        `,
      })
    })

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'removes newlines when newlinesBetween is %s',
      async (_description, newlinesBetween) => {
        await invalid({
          errors: [
            {
              data: {
                right: 'y',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenExports',
            },
            {
              data: {
                right: 'b',
                left: 'z',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'z',
              },
              messageId: 'extraSpacingBetweenExports',
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
              export { a } from 'a'


             export { y } from 'y'
            export { z } from 'z'

                export { b } from 'b'
          `,
          output: dedent`
              export { a } from 'a'
             export { b } from 'b'
            export { y } from 'y'
                export { z } from 'z'
          `,
        })
      },
    )

    it('handles newlinesBetween between consecutive groups', async () => {
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
              {
                elementNamePattern: 'c',
                groupName: 'c',
              },
              {
                elementNamePattern: 'd',
                groupName: 'd',
              },
              {
                elementNamePattern: 'e',
                groupName: 'e',
              },
            ],
            groups: [
              'a',
              {
                newlinesBetween: 'always',
              },
              'b',
              {
                newlinesBetween: 'always',
              },
              'c',
              {
                newlinesBetween: 'never',
              },
              'd',
              {
                newlinesBetween: 'ignore',
              },
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
            messageId: 'missedSpacingBetweenExports',
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: 'extraSpacingBetweenExports',
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: 'extraSpacingBetweenExports',
          },
        ],
        output: dedent`
          export { a } from 'a'

          export { b } from 'b'

          export { c } from 'c'
          export { d } from 'd'


          export { e } from 'e'
        `,
        code: dedent`
          export { a } from 'a'
          export { b } from 'b'


          export { c } from 'c'

          export { d } from 'd'


          export { e } from 'e'
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
      'enforces newlines if the global option is %s and the group option is %s',
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
              messageId: 'missedSpacingBetweenExports',
            },
          ],
          output: dedent`
            export { a } from 'a'


            export { b } from 'b'
          `,
          code: dedent`
            export { a } from 'a'
            export { b } from 'b'
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
      'enforces no newline if the global option is %s and newlinesBetween: never exists between all groups',
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
              messageId: 'extraSpacingBetweenExports',
            },
          ],
          output: dedent`
            export { a } from 'a'
            export { b } from 'b'
          `,
          code: dedent`
            export { a } from 'a'

            export { b } from 'b'
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
      'does not enforce a newline if the global option is %s and the group option is %s',
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
            export { a } from 'a'

            export { b } from 'b'
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
            export { a } from 'a'
            export { b } from 'b'
          `,
        })
      },
    )

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'ignores newline fixes between different partitions when newlinesBetween is %s',
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
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { a } from 'a'

            // Partition comment

            export { b } from 'b'
            export { c } from 'c'
          `,
          code: dedent`
            export { a } from 'a'

            // Partition comment

            export { c } from 'c'
            export { b } from 'b'
          `,
        })
      },
    )

    it('reports missing comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Type exports',
              right: './a',
            },
            messageId: 'missedCommentAboveExport',
          },
          {
            data: {
              missedCommentAbove: 'Other exports',
              right: './b',
            },
            messageId: 'missedCommentAboveExport',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'Type exports' },
              'type-export',
              { commentAbove: 'Other exports' },
              'unknown',
            ],
          },
        ],
        output: dedent`
          // Type exports
          export type { a } from "./a";

          // Other exports
          export { b } from "./b";
        `,
        code: dedent`
          export type { a } from "./a";

          export { b } from "./b";
        `,
      })
    })

    it('reports missing comments for single nodes', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Comment above',
              right: 'a',
            },
            messageId: 'missedCommentAboveExport',
          },
        ],
        options: [
          {
            ...options,
            groups: [{ commentAbove: 'Comment above' }, 'unknown'],
          },
        ],
        output: dedent`
          // Comment above
          export { a } from "a";
        `,
        code: dedent`
          export { a } from "a";
        `,
      })
    })

    it('ignores shebangs and comments at the top of the file', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Comment above',
              right: './b',
            },
            messageId: 'missedCommentAboveExport',
          },
          {
            data: {
              right: './a',
              left: './b',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above
          export { a } from "./a";
          export { b } from "./b";
        `,
        code: dedent`
          #!/usr/bin/node
          // Some disclaimer

          export { b } from "./b";
          export { a } from "./a";
        `,
        options: [
          {
            ...options,
            groups: [{ commentAbove: 'Comment above' }, 'unknown'],
          },
        ],
      })
    })

    it.each([
      '//   Comment above  ',
      '//   comment above  ',
      dedent`
        /**
         * Comment above
         */
      `,
      dedent`
        /**
         * Something before
         * CoMmEnT ABoVe
         * Something after
         */
      `,
    ])(
      'detects existing comments correctly with comment: %s',
      async comment => {
        await valid({
          options: [
            {
              ...options,
              groups: [
                'value-export',
                { commentAbove: 'Comment above' },
                'unknown',
              ],
            },
          ],
          code: dedent`
            export { a } from "a";

            ${comment}
            export type { b } from "./b";
          `,
        })
      },
    )

    it('deletes invalid auto-added comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Type exports',
              right: './c',
            },
            messageId: 'missedCommentAboveExport',
          },
          {
            data: {
              right: './b',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              rightGroup: 'value-export',
              leftGroup: 'type-export',
              right: './a',
              left: './b',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'Value exports' },
              'value-export',
              { commentAbove: 'Type exports' },
              'type-export',
            ],
          },
        ],
        output: dedent`
          // Value exports
          export { a } from './a';
          // Type exports
          export type { b } from './b';
          export type { c } from './c';
        `,
        code: dedent`
          export type { c } from './c';
          // Value exports
          export type { b } from './b';
          // Type exports
          export { a } from './a';
        `,
      })
    })

    it('works with other errors', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Type exports',
              right: './b',
            },
            messageId: 'missedCommentAboveExport',
          },
          {
            data: {
              rightGroup: 'value-export',
              leftGroup: 'type-export',
              right: './a',
              left: './b',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'Value exports' },
              'value-export',
              {
                commentAbove: 'Type exports',
                newlinesBetween: 'always',
              },
              ['type-export'],
            ],
            newlinesBetween: 'never',
          },
        ],
        output: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above a
          // Value exports
          export { a } from "./a"; // Comment after a

          // Type exports
          // Comment above b
          export type { b } from './b'; // Comment after b
        `,
        code: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above b
          // Value exports
          export type { b } from './b'; // Comment after b
          // Comment above a
          // Type exports
          export { a } from "./a"; // Comment after a
        `,
      })
    })
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('sorts exports', async () => {
      await valid({
        code: dedent`
          export { a1 } from 'a'
          export { b1, b2 } from 'b'
          export { c1, c2, c3 } from 'c'
          export { d1, d2 } from 'd'
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
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { a1 } from 'a'
          export { b1, b2 } from 'b'
          export { c1, c2, c3 } from 'c'
          export { d1, d2 } from 'd'
        `,
        code: dedent`
          export { b1, b2 } from 'b'
          export { a1 } from 'a'
          export { d1, d2 } from 'd'
          export { c1, c2, c3 } from 'c'
        `,
        options: [options],
      })
    })

    it('sorts all-exports', async () => {
      await valid({
        code: dedent`
          export { a1 } from './a'
          export * as b from './b'
          export { c1, c2 } from './c'
          export { d } from './d'
          export * from 'e'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: './a',
              left: './b',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: './d',
              left: 'e',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { a1 } from './a'
          export * as b from './b'
          export { c1, c2 } from './c'
          export { d } from './d'
          export * from 'e'
        `,
        code: dedent`
          export * as b from './b'
          export { a1 } from './a'
          export { c1, c2 } from './c'
          export * from 'e'
          export { d } from './d'
        `,
        options: [options],
      })
    })

    it('works with export aliases', async () => {
      await valid({
        code: dedent`
          export { a1 as aX } from './a'
          export { default as b } from './b'
          export { c1, c2 } from './c'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: './b',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { a1 as aX } from './a'
          export { default as b } from './b'
          export { c1, c2 } from './c'
        `,
        code: dedent`
          export { a1 as aX } from './a'
          export { c1, c2 } from './c'
          export { default as b } from './b'
        `,
        options: [options],
      })
    })

    it('allows to use new line as partition', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: './organisms',
              right: './atoms',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              left: './second-folder',
              right: './folder',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export * from "./atoms";
          export * from "./organisms";
          export * from "./shared";

          export { Named } from './folder';
          export { AnotherNamed } from './second-folder';
        `,
        code: dedent`
          export * from "./organisms";
          export * from "./atoms";
          export * from "./shared";

          export { AnotherNamed } from './second-folder';
          export { Named } from './folder';
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
        output: dedent`
          // Part: A
          // Not partition comment
          export * from './bbb';
          export * from './cc';
          export * from './d';
          // Part: B
          export * from './aaaa';
          export * from './e';
          // Part: C
          // Not partition comment
          export * from './fff';
          export * from './gg';
        `,
        code: dedent`
          // Part: A
          export * from './cc';
          export * from './d';
          // Not partition comment
          export * from './bbb';
          // Part: B
          export * from './aaaa';
          export * from './e';
          // Part: C
          export * from './gg';
          // Not partition comment
          export * from './fff';
        `,
        errors: [
          {
            data: {
              right: './bbb',
              left: './d',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: './fff',
              left: './gg',
            },
            messageId: 'unexpectedExportsOrder',
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

    it('allows to use all comments as parts', async () => {
      await valid({
        code: dedent`
          // Comment
          export * from './bb';
          // Other comment
          export * from './a';
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
          /* Partition Comment */
          // Part: A
          export * from './d'
          // Part: B
          export * from './aaa'
          export * from './bb'
          export * from './c'
          /* Other */
          export * from './e'
        `,
        code: dedent`
          /* Partition Comment */
          // Part: A
          export * from './d'
          // Part: B
          export * from './aaa'
          export * from './c'
          export * from './bb'
          /* Other */
          export * from './e'
        `,
        errors: [
          {
            data: {
              right: './bb',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
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
          export * from './e'
          export * from './f'
          // I am a partition comment because I don't have f o o
          export * from './a'
          export * from './b'
        `,
        options: [
          {
            ...options,
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores line comments when using block comment partitions', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: './a',
              left: './b',
            },
            messageId: 'unexpectedExportsOrder',
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
          // Comment
          export * from './a'
          export * from './b'
        `,
        code: dedent`
          export * from './b'
          // Comment
          export * from './a'
        `,
      })
    })

    it('allows to use block comments as partition boundaries', async () => {
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
          export * from './b'
          /* Comment */
          export * from './a'
        `,
      })
    })

    it('allows to use multiple block comment patterns for partitions', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['a', 'b'],
            },
          },
        ],
        code: dedent`
          export * from './c'
          /* b */
          export * from './b'
          /* a */
          export * from './a'
        `,
      })
    })

    it('allows to use regex patterns for block comment partitions', async () => {
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
          export * from './b'
          /* I am a partition comment because I don't have f o o */
          export * from './a'
        `,
      })
    })

    it('sorts exports with values-first group kind', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: './d',
              left: './f',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: './c',
              left: './e',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: './a',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { A } from "./a";
          export { B } from "./b";
          export { C } from "./c";
          export type { D } from "./d";
          export type { E } from "./e";
          export type { F } from "./f";
        `,
        code: dedent`
          export type { F } from "./f";
          export type { D } from "./d";
          export type { E } from "./e";
          export { C } from "./c";
          export { A } from "./a";
          export { B } from "./b";
        `,
        options: [
          {
            ...options,
            groupKind: 'values-first',
          },
        ],
      })
    })

    it('sorts exports with types-first group kind', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: './a',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: './f',
              left: './b',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: './d',
              left: './f',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export type { D } from "./d";
          export type { E } from "./e";
          export type { F } from "./f";
          export { A } from "./a";
          export { B } from "./b";
          export { C } from "./c";
        `,
        code: dedent`
          export { C } from "./c";
          export { A } from "./a";
          export { B } from "./b";
          export type { F } from "./f";
          export type { D } from "./d";
          export type { E } from "./e";
        `,
        options: [
          {
            ...options,
            groupKind: 'types-first',
          },
        ],
      })
    })

    it('allows to trim special characters', async () => {
      await valid({
        code: dedent`
          export { a } from '_a'
          export { b } from 'b'
          export { c } from '_c'
        `,
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
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
          export { ab } from 'ab'
          export { ac } from 'a_c'
        `,
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          export { 你好 } from '你好'
          export { 世界 } from '世界'
          export { a } from 'a'
          export { A } from 'A'
          export { b } from 'b'
          export { B } from 'B'
        `,
        options: [{ ...options, locales: 'zh-CN' }],
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
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { a } from "a"; export { b } from "b";
        `,
        code: dedent`
          export { b } from "b"; export { a } from "a"
        `,
        options: [options],
      })
    })

    it('sorts inline elements with semicolons correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { a } from "a"; export { b } from "b";
        `,
        code: dedent`
          export { b } from "b"; export { a } from "a";
        `,
        options: [options],
      })
    })

    it('allows to use predefined groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'value-export',
              leftGroup: 'type-export',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['value-export', 'type-export'],
          },
        ],
        output: dedent`
          export { b } from 'b';
          export type { a } from 'a';
        `,
        code: dedent`
          export type { a } from 'a';
          export { b } from 'b';
        `,
      })
    })

    it('filters on modifier', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'valueExports',
              leftGroup: 'unknown',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'valueExports',
                modifiers: ['value'],
              },
            ],
            groups: ['valueExports', 'unknown'],
          },
        ],
        output: dedent`
          export { b } from 'b';
          export type { a } from 'a';
        `,
        code: dedent`
          export type { a } from 'a';
          export { b } from 'b';
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array pattern', ['noMatch', 'hello']],
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])(
      'filters on elementNamePattern - %s',
      async (_description, elementNamePattern) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                {
                  groupName: 'valuesStartingWithHello',
                  modifiers: ['value'],
                  elementNamePattern,
                },
              ],
              groups: ['valuesStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'valuesStartingWithHello',
                right: 'helloExport',
                leftGroup: 'unknown',
                left: 'b',
              },
              messageId: 'unexpectedExportsGroupOrder',
            },
          ],
          output: dedent`
            export { helloExport } from 'helloExport';
            export { a } from 'a';
            export { b } from 'b';
          `,
          code: dedent`
            export { a } from 'a';
            export { b } from 'b';
            export { helloExport } from 'helloExport';
          `,
        })
      },
    )

    it('handles complex regex in elementNamePattern', async () => {
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
          export { iHaveFooInMyName } from 'iHaveFooInMyName';
          export { meTooIHaveFoo } from 'meTooIHaveFoo';
          export { a } from 'a';
          export { b } from 'b';
        `,
      })
    })

    it('sort custom groups by overriding type and order', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              rightGroup: 'reversedValuesByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: 'm',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedValuesByLineLength',
                modifiers: ['value'],
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedValuesByLineLength', 'unknown'],
            type: 'alphabetical',
            groupKind: 'mixed',
            order: 'asc',
          },
        ],
        output: dedent`
          export { dddd } from 'dddd';
          export { ccc } from 'ccc';
          export { eee } from 'eee';
          export { bb } from 'bb';
          export { ff } from 'ff';
          export { a } from 'a';
          export { g } from 'g';
          export type { m } from 'm';
          export type { o } from 'o';
          export type { p } from 'p';
        `,
        code: dedent`
          export { a } from 'a';
          export { bb } from 'bb';
          export { ccc } from 'ccc';
          export { dddd } from 'dddd';
          export type { m } from 'm';
          export { eee } from 'eee';
          export { ff } from 'ff';
          export { g } from 'g';
          export type { o } from 'o';
          export type { p } from 'p';
        `,
      })
    })

    it('sort custom groups by overriding fallbackSort', async () => {
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
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { fooBar } from 'fooBar';
          export { fooZar } from 'fooZar';
        `,
        code: dedent`
          export { fooZar } from 'fooZar';
          export { fooBar } from 'fooBar';
        `,
      })
    })

    it('does not sort custom groups with unsorted type', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedValues',
                modifiers: ['value'],
                type: 'unsorted',
              },
            ],
            groups: ['unsortedValues', 'unknown'],
            groupKind: 'mixed',
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedValues',
              leftGroup: 'unknown',
              right: 'c',
              left: 'm',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        output: dedent`
          export { b } from 'b';
          export { a } from 'a';
          export { d } from 'd';
          export { e } from 'e';
          export { c } from 'c';
          export type { m } from 'm';
        `,
        code: dedent`
          export { b } from 'b';
          export { a } from 'a';
          export { d } from 'd';
          export { e } from 'e';
          export type { m } from 'm';
          export { c } from 'c';
        `,
      })
    })

    it('sort custom group blocks', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    elementNamePattern: 'foo|Foo',
                    modifiers: ['value'],
                  },
                  {
                    elementNamePattern: 'foo|Foo',
                    modifiers: ['type'],
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
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        output: dedent`
          export { cFoo } from 'cFoo';
          export type { foo } from 'foo';
          export { a } from 'a';
        `,
        code: dedent`
          export { a } from 'a';
          export { cFoo } from 'cFoo';
          export type { foo } from 'foo';
        `,
      })
    })

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'removes newlines when newlinesBetween is %s',
      async (_description, newlinesBetween) => {
        await invalid({
          errors: [
            {
              data: {
                right: 'y',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenExports',
            },
            {
              data: {
                right: 'b',
                left: 'z',
              },
              messageId: 'unexpectedExportsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'z',
              },
              messageId: 'extraSpacingBetweenExports',
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
              export { a } from 'a'


             export { y } from 'y'
            export { z } from 'z'

                export { b } from 'b'
          `,
          output: dedent`
              export { a } from 'a'
             export { b } from 'b'
            export { y } from 'y'
                export { z } from 'z'
          `,
        })
      },
    )

    it('handles newlinesBetween between consecutive groups', async () => {
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
              {
                elementNamePattern: 'c',
                groupName: 'c',
              },
              {
                elementNamePattern: 'd',
                groupName: 'd',
              },
              {
                elementNamePattern: 'e',
                groupName: 'e',
              },
            ],
            groups: [
              'a',
              {
                newlinesBetween: 'always',
              },
              'b',
              {
                newlinesBetween: 'always',
              },
              'c',
              {
                newlinesBetween: 'never',
              },
              'd',
              {
                newlinesBetween: 'ignore',
              },
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
            messageId: 'missedSpacingBetweenExports',
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: 'extraSpacingBetweenExports',
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: 'extraSpacingBetweenExports',
          },
        ],
        output: dedent`
          export { a } from 'a'

          export { b } from 'b'

          export { c } from 'c'
          export { d } from 'd'


          export { e } from 'e'
        `,
        code: dedent`
          export { a } from 'a'
          export { b } from 'b'


          export { c } from 'c'

          export { d } from 'd'


          export { e } from 'e'
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
      'enforces newlines if the global option is %s and the group option is %s',
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
              messageId: 'missedSpacingBetweenExports',
            },
          ],
          output: dedent`
            export { a } from 'a'


            export { b } from 'b'
          `,
          code: dedent`
            export { a } from 'a'
            export { b } from 'b'
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
      'enforces no newline if the global option is %s and newlinesBetween: never exists between all groups',
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
              messageId: 'extraSpacingBetweenExports',
            },
          ],
          output: dedent`
            export { a } from 'a'
            export { b } from 'b'
          `,
          code: dedent`
            export { a } from 'a'

            export { b } from 'b'
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
      'does not enforce a newline if the global option is %s and the group option is %s',
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
            export { a } from 'a'

            export { b } from 'b'
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
            export { a } from 'a'
            export { b } from 'b'
          `,
        })
      },
    )

    it.each([
      [2, 'never' as const],
      [2, 0 as const],
      [2, 'ignore' as const],
      ['never' as const, 2],
      [0 as const, 2],
      ['ignore' as const, 2],
    ])(
      'enforces newlines if the global option is %s and the group option is %s',
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
              messageId: 'missedSpacingBetweenExports',
            },
          ],
          output: dedent`
            export { a } from 'a'


            export { b } from 'b'
          `,
          code: dedent`
            export { a } from 'a'
            export { b } from 'b'
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
      'enforces no newline if the global option is %s and newlinesBetween: never exists between all groups',
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
              messageId: 'extraSpacingBetweenExports',
            },
          ],
          output: dedent`
            export { a } from 'a'
            export { b } from 'b'
          `,
          code: dedent`
            export { a } from 'a'

            export { b } from 'b'
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
      'does not enforce a newline if the global option is %s and the group option is %s',
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
            export { a } from 'a'

            export { b } from 'b'
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
            export { a } from 'a'
            export { b } from 'b'
          `,
        })
      },
    )

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'ignores newline fixes between different partitions when newlinesBetween is %s',
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
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { a } from 'a'

            // Partition comment

            export { b } from 'b'
            export { c } from 'c'
          `,
          code: dedent`
            export { a } from 'a'

            // Partition comment

            export { c } from 'c'
            export { b } from 'b'
          `,
        })
      },
    )

    it('reports missing comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Type exports',
              right: './a',
            },
            messageId: 'missedCommentAboveExport',
          },
          {
            data: {
              missedCommentAbove: 'Other exports',
              right: './b',
            },
            messageId: 'missedCommentAboveExport',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'Type exports' },
              'type-export',
              { commentAbove: 'Other exports' },
              'unknown',
            ],
          },
        ],
        output: dedent`
          // Type exports
          export type { a } from "./a";

          // Other exports
          export { b } from "./b";
        `,
        code: dedent`
          export type { a } from "./a";

          export { b } from "./b";
        `,
      })
    })

    it('reports missing comments for single nodes', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Comment above',
              right: 'a',
            },
            messageId: 'missedCommentAboveExport',
          },
        ],
        options: [
          {
            ...options,
            groups: [{ commentAbove: 'Comment above' }, 'unknown'],
          },
        ],
        output: dedent`
          // Comment above
          export { a } from "a";
        `,
        code: dedent`
          export { a } from "a";
        `,
      })
    })

    it('ignores shebangs and comments at the top of the file', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Comment above',
              right: './b',
            },
            messageId: 'missedCommentAboveExport',
          },
          {
            data: {
              right: './a',
              left: './b',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above
          export { a } from "./a";
          export { b } from "./b";
        `,
        code: dedent`
          #!/usr/bin/node
          // Some disclaimer

          export { b } from "./b";
          export { a } from "./a";
        `,
        options: [
          {
            ...options,
            groups: [{ commentAbove: 'Comment above' }, 'unknown'],
          },
        ],
      })
    })

    it.each([
      '//   Comment above  ',
      '//   comment above  ',
      dedent`
        /**
         * Comment above
         */
      `,
      dedent`
        /**
         * Something before
         * CoMmEnT ABoVe
         * Something after
         */
      `,
    ])(
      'detects existing comments correctly with comment: %s',
      async comment => {
        await valid({
          options: [
            {
              ...options,
              groups: [
                'value-export',
                { commentAbove: 'Comment above' },
                'unknown',
              ],
            },
          ],
          code: dedent`
            export { a } from "a";

            ${comment}
            export type { b } from "./b";
          `,
        })
      },
    )

    it('deletes invalid auto-added comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Type exports',
              right: './c',
            },
            messageId: 'missedCommentAboveExport',
          },
          {
            data: {
              right: './b',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              rightGroup: 'value-export',
              leftGroup: 'type-export',
              right: './a',
              left: './b',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'Value exports' },
              'value-export',
              { commentAbove: 'Type exports' },
              'type-export',
            ],
          },
        ],
        output: dedent`
          // Value exports
          export { a } from './a';
          // Type exports
          export type { b } from './b';
          export type { c } from './c';
        `,
        code: dedent`
          export type { c } from './c';
          // Value exports
          export type { b } from './b';
          // Type exports
          export { a } from './a';
        `,
      })
    })

    it('works with other errors', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Type exports',
              right: './b',
            },
            messageId: 'missedCommentAboveExport',
          },
          {
            data: {
              rightGroup: 'value-export',
              leftGroup: 'type-export',
              right: './a',
              left: './b',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'Value exports' },
              'value-export',
              {
                commentAbove: 'Type exports',
                newlinesBetween: 'always',
              },
              ['type-export'],
            ],
            newlinesBetween: 'never',
          },
        ],
        output: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above a
          // Value exports
          export { a } from "./a"; // Comment after a

          // Type exports
          // Comment above b
          export type { b } from './b'; // Comment after b
        `,
        code: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above b
          // Value exports
          export type { b } from './b'; // Comment after b
          // Comment above a
          // Type exports
          export { a } from "./a"; // Comment after a
        `,
      })
    })
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('sorts exports', async () => {
      await valid({
        code: dedent`
          export { c1, c2, c3 } from 'c'
          export { d1, d2 } from 'd'
          export { b1, b2 } from 'b'
          export { a1 } from 'a'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'd',
              left: 'a',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { c1, c2, c3 } from 'c'
          export { b1, b2 } from 'b'
          export { d1, d2 } from 'd'
          export { a1 } from 'a'
        `,
        code: dedent`
          export { b1, b2 } from 'b'
          export { a1 } from 'a'
          export { d1, d2 } from 'd'
          export { c1, c2, c3 } from 'c'
        `,
        options: [options],
      })
    })

    it('sorts all-exports', async () => {
      await valid({
        code: dedent`
          export { c1, c2 } from './c'
          export { a1 } from './a'
          export * as b from './b'
          export { d } from './d'
          export * from 'e'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: './c',
              left: './a',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: './d',
              left: 'e',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { c1, c2 } from './c'
          export * as b from './b'
          export { a1 } from './a'
          export { d } from './d'
          export * from 'e'
        `,
        code: dedent`
          export * as b from './b'
          export { a1 } from './a'
          export { c1, c2 } from './c'
          export * from 'e'
          export { d } from './d'
        `,
        options: [options],
      })
    })

    it('works with export aliases', async () => {
      await valid({
        code: dedent`
          export { default as b } from './b'
          export { a1 as aX } from './a'
          export { c1, c2 } from './c'
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: './b',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { default as b } from './b'
          export { a1 as aX } from './a'
          export { c1, c2 } from './c'
        `,
        code: dedent`
          export { a1 as aX } from './a'
          export { c1, c2 } from './c'
          export { default as b } from './b'
        `,
        options: [options],
      })
    })

    it('allows to use new line as partition', async () => {
      await invalid({
        output: dedent`
          export * from "./organisms";
          export * from "./shared";
          export * from "./atoms";

          export { AnotherNamed } from './second-folder';
          export { Named } from './folder';
        `,
        code: dedent`
          export * from "./organisms";
          export * from "./atoms";
          export * from "./shared";

          export { AnotherNamed } from './second-folder';
          export { Named } from './folder';
        `,
        errors: [
          {
            data: {
              right: './shared',
              left: './atoms',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
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
        output: dedent`
          // Part: A
          // Not partition comment
          export * from './bbb';
          export * from './cc';
          export * from './d';
          // Part: B
          export * from './aaaa';
          export * from './e';
          // Part: C
          // Not partition comment
          export * from './fff';
          export * from './gg';
        `,
        code: dedent`
          // Part: A
          export * from './cc';
          export * from './d';
          // Not partition comment
          export * from './bbb';
          // Part: B
          export * from './aaaa';
          export * from './e';
          // Part: C
          export * from './gg';
          // Not partition comment
          export * from './fff';
        `,
        errors: [
          {
            data: {
              right: './bbb',
              left: './d',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: './fff',
              left: './gg',
            },
            messageId: 'unexpectedExportsOrder',
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

    it('allows to use all comments as parts', async () => {
      await valid({
        code: dedent`
          // Comment
          export * from './bb';
          // Other comment
          export * from './a';
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
          /* Partition Comment */
          // Part: A
          export * from './d'
          // Part: B
          export * from './aaa'
          export * from './bb'
          export * from './c'
          /* Other */
          export * from './e'
        `,
        code: dedent`
          /* Partition Comment */
          // Part: A
          export * from './d'
          // Part: B
          export * from './aaa'
          export * from './c'
          export * from './bb'
          /* Other */
          export * from './e'
        `,
        errors: [
          {
            data: {
              right: './bb',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
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
          export * from './ee'
          export * from './f'
          // I am a partition comment because I don't have f o o
          export * from './aaaa'
          export * from './bbb'
        `,
        options: [
          {
            ...options,
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores line comments when using block comment partitions', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: './aa',
              left: './b',
            },
            messageId: 'unexpectedExportsOrder',
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
          // Comment
          export * from './aa'
          export * from './b'
        `,
        code: dedent`
          export * from './b'
          // Comment
          export * from './aa'
        `,
      })
    })

    it('allows to use block comments as partition boundaries', async () => {
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
          export * from './b'
          /* Comment */
          export * from './a'
        `,
      })
    })

    it('allows to use multiple block comment patterns for partitions', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              block: ['a', 'b'],
            },
          },
        ],
        code: dedent`
          export * from './c'
          /* b */
          export * from './b'
          /* a */
          export * from './a'
        `,
      })
    })

    it('allows to use regex patterns for block comment partitions', async () => {
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
          export * from './b'
          /* I am a partition comment because I don't have f o o */
          export * from './a'
        `,
      })
    })

    it('sorts exports with values-first group kind', async () => {
      await invalid({
        output: dedent`
          export { C } from "./c";
          export { A } from "./a";
          export { B } from "./b";
          export type { F } from "./f";
          export type { D } from "./d";
          export type { E } from "./e";
        `,
        code: dedent`
          export type { F } from "./f";
          export type { D } from "./d";
          export type { E } from "./e";
          export { C } from "./c";
          export { A } from "./a";
          export { B } from "./b";
        `,
        errors: [
          {
            data: {
              right: './c',
              left: './e',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        options: [
          {
            ...options,
            groupKind: 'values-first',
          },
        ],
      })
    })

    it('sorts exports with types-first group kind', async () => {
      await invalid({
        output: dedent`
          export type { F } from "./f";
          export type { D } from "./d";
          export type { E } from "./e";
          export { C } from "./c";
          export { A } from "./a";
          export { B } from "./b";
        `,
        code: dedent`
          export { C } from "./c";
          export { A } from "./a";
          export { B } from "./b";
          export type { F } from "./f";
          export type { D } from "./d";
          export type { E } from "./e";
        `,
        errors: [
          {
            data: {
              right: './f',
              left: './b',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        options: [
          {
            ...options,
            groupKind: 'types-first',
          },
        ],
      })
    })

    it('allows to trim special characters', async () => {
      await valid({
        code: dedent`
          export { a } from '_a'
          export { c } from '_c'
          export { b } from 'b'
        `,
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
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
          export { ac } from 'a_c'
          export { ab } from 'ab'
        `,
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          export { 你好 } from '你好'
          export { 世界 } from '世界'
          export { a } from 'a'
          export { A } from 'A'
          export { b } from 'b'
          export { B } from 'B'
        `,
        options: [{ ...options, locales: 'zh-CN' }],
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
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { a } from "aa"; export { b } from "b";
        `,
        code: dedent`
          export { b } from "b"; export { a } from "aa"
        `,
        options: [options],
      })
    })

    it('sorts inline elements with semicolons correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { a } from "aa"; export { b } from "b";
        `,
        code: dedent`
          export { b } from "b"; export { a } from "aa";
        `,
        options: [options],
      })
    })

    it('allows to use predefined groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'value-export',
              leftGroup: 'type-export',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['value-export', 'type-export'],
          },
        ],
        output: dedent`
          export { b } from 'b';
          export type { a } from 'a';
        `,
        code: dedent`
          export type { a } from 'a';
          export { b } from 'b';
        `,
      })
    })

    it('filters on modifier', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'valueExports',
              leftGroup: 'unknown',
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'valueExports',
                modifiers: ['value'],
              },
            ],
            groups: ['valueExports', 'unknown'],
          },
        ],
        output: dedent`
          export { b } from 'b';
          export type { a } from 'a';
        `,
        code: dedent`
          export type { a } from 'a';
          export { b } from 'b';
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array pattern', ['noMatch', 'hello']],
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])(
      'filters on elementNamePattern - %s',
      async (_description, elementNamePattern) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                {
                  groupName: 'valuesStartingWithHello',
                  modifiers: ['value'],
                  elementNamePattern,
                },
              ],
              groups: ['valuesStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'valuesStartingWithHello',
                right: 'helloExport',
                leftGroup: 'unknown',
                left: 'b',
              },
              messageId: 'unexpectedExportsGroupOrder',
            },
          ],
          output: dedent`
            export { helloExport } from 'helloExport';
            export { a } from 'a';
            export { b } from 'b';
          `,
          code: dedent`
            export { a } from 'a';
            export { b } from 'b';
            export { helloExport } from 'helloExport';
          `,
        })
      },
    )

    it('handles complex regex in elementNamePattern', async () => {
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
          export { iHaveFooInMyName } from 'iHaveFooInMyName';
          export { meTooIHaveFoo } from 'meTooIHaveFoo';
          export { a } from 'a';
          export { b } from 'b';
        `,
      })
    })

    it('sort custom groups by overriding type and order', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              rightGroup: 'reversedValuesByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: 'm',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedValuesByLineLength',
                modifiers: ['value'],
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedValuesByLineLength', 'unknown'],
            type: 'alphabetical',
            groupKind: 'mixed',
            order: 'asc',
          },
        ],
        output: dedent`
          export { dddd } from 'dddd';
          export { ccc } from 'ccc';
          export { eee } from 'eee';
          export { bb } from 'bb';
          export { ff } from 'ff';
          export { a } from 'a';
          export { g } from 'g';
          export type { m } from 'm';
          export type { o } from 'o';
          export type { p } from 'p';
        `,
        code: dedent`
          export { a } from 'a';
          export { bb } from 'bb';
          export { ccc } from 'ccc';
          export { dddd } from 'dddd';
          export type { m } from 'm';
          export { eee } from 'eee';
          export { ff } from 'ff';
          export { g } from 'g';
          export type { o } from 'o';
          export type { p } from 'p';
        `,
      })
    })

    it('sort custom groups by overriding fallbackSort', async () => {
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
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { fooBar } from 'fooBar';
          export { fooZar } from 'fooZar';
        `,
        code: dedent`
          export { fooZar } from 'fooZar';
          export { fooBar } from 'fooBar';
        `,
      })
    })

    it('does not sort custom groups with unsorted type', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedValues',
                modifiers: ['value'],
                type: 'unsorted',
              },
            ],
            groups: ['unsortedValues', 'unknown'],
            groupKind: 'mixed',
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedValues',
              leftGroup: 'unknown',
              right: 'c',
              left: 'm',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        output: dedent`
          export { b } from 'b';
          export { a } from 'a';
          export { d } from 'd';
          export { e } from 'e';
          export { c } from 'c';
          export type { m } from 'm';
        `,
        code: dedent`
          export { b } from 'b';
          export { a } from 'a';
          export { d } from 'd';
          export { e } from 'e';
          export type { m } from 'm';
          export { c } from 'c';
        `,
      })
    })

    it('sort custom group blocks', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    elementNamePattern: 'foo|Foo',
                    modifiers: ['value'],
                  },
                  {
                    elementNamePattern: 'foo|Foo',
                    modifiers: ['type'],
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
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        output: dedent`
          export { cFoo } from 'cFoo';
          export type { foo } from 'foo';
          export { a } from 'a';
        `,
        code: dedent`
          export { a } from 'a';
          export { cFoo } from 'cFoo';
          export type { foo } from 'foo';
        `,
      })
    })

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'removes newlines when newlinesBetween is %s',
      async (_description, newlinesBetween) => {
        await invalid({
          errors: [
            {
              data: {
                right: 'y',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenExports',
            },
            {
              data: {
                right: 'b',
                left: 'z',
              },
              messageId: 'extraSpacingBetweenExports',
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
              export { a } from 'a'


             export { y } from 'y'
            export { z } from 'z'

                export { b } from 'b'
          `,
          output: dedent`
              export { a } from 'a'
             export { y } from 'y'
            export { z } from 'z'
                export { b } from 'b'
          `,
        })
      },
    )

    it('handles newlinesBetween between consecutive groups', async () => {
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
              {
                elementNamePattern: 'c',
                groupName: 'c',
              },
              {
                elementNamePattern: 'd',
                groupName: 'd',
              },
              {
                elementNamePattern: 'e',
                groupName: 'e',
              },
            ],
            groups: [
              'a',
              {
                newlinesBetween: 'always',
              },
              'b',
              {
                newlinesBetween: 'always',
              },
              'c',
              {
                newlinesBetween: 'never',
              },
              'd',
              {
                newlinesBetween: 'ignore',
              },
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
            messageId: 'missedSpacingBetweenExports',
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: 'extraSpacingBetweenExports',
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: 'extraSpacingBetweenExports',
          },
        ],
        output: dedent`
          export { a } from 'a'

          export { b } from 'b'

          export { c } from 'c'
          export { d } from 'd'


          export { e } from 'e'
        `,
        code: dedent`
          export { a } from 'a'
          export { b } from 'b'


          export { c } from 'c'

          export { d } from 'd'


          export { e } from 'e'
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
      'enforces newlines if the global option is %s and the group option is %s',
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
              messageId: 'missedSpacingBetweenExports',
            },
          ],
          output: dedent`
            export { a } from 'a'


            export { b } from 'b'
          `,
          code: dedent`
            export { a } from 'a'
            export { b } from 'b'
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
      'enforces no newline if the global option is %s and newlinesBetween: never exists between all groups',
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
              messageId: 'extraSpacingBetweenExports',
            },
          ],
          output: dedent`
            export { a } from 'a'
            export { b } from 'b'
          `,
          code: dedent`
            export { a } from 'a'

            export { b } from 'b'
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
      'does not enforce a newline if the global option is %s and the group option is %s',
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
            export { a } from 'a'

            export { b } from 'b'
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
            export { a } from 'a'
            export { b } from 'b'
          `,
        })
      },
    )

    it.each([
      [2, 'never' as const],
      [2, 0 as const],
      [2, 'ignore' as const],
      ['never' as const, 2],
      [0 as const, 2],
      ['ignore' as const, 2],
    ])(
      'enforces newlines if the global option is %s and the group option is %s',
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
              messageId: 'missedSpacingBetweenExports',
            },
          ],
          output: dedent`
            export { a } from 'a'


            export { b } from 'b'
          `,
          code: dedent`
            export { a } from 'a'
            export { b } from 'b'
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
      'enforces no newline if the global option is %s and newlinesBetween: never exists between all groups',
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
              messageId: 'extraSpacingBetweenExports',
            },
          ],
          output: dedent`
            export { a } from 'a'
            export { b } from 'b'
          `,
          code: dedent`
            export { a } from 'a'

            export { b } from 'b'
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
      'does not enforce a newline if the global option is %s and the group option is %s',
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
            export { a } from 'a'

            export { b } from 'b'
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
            export { a } from 'a'
            export { b } from 'b'
          `,
        })
      },
    )

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'ignores newline fixes between different partitions when newlinesBetween is %s',
      async (_description, newlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'aaaa',
                  groupName: 'aaaa',
                },
              ],
              groups: ['aaaa', 'unknown'],
              partitionByComment: true,
              newlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'bbb',
                left: 'cc',
              },
              messageId: 'unexpectedExportsOrder',
            },
          ],
          output: dedent`
            export { a } from 'aaaa'

            // Partition comment

            export { b } from 'bbb'
            export { c } from 'cc'
          `,
          code: dedent`
            export { a } from 'aaaa'

            // Partition comment

            export { c } from 'cc'
            export { b } from 'bbb'
          `,
        })
      },
    )

    it('reports missing comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Type exports',
              right: './a',
            },
            messageId: 'missedCommentAboveExport',
          },
          {
            data: {
              missedCommentAbove: 'Other exports',
              right: './b',
            },
            messageId: 'missedCommentAboveExport',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'Type exports' },
              'type-export',
              { commentAbove: 'Other exports' },
              'unknown',
            ],
          },
        ],
        output: dedent`
          // Type exports
          export type { a } from "./a";

          // Other exports
          export { b } from "./b";
        `,
        code: dedent`
          export type { a } from "./a";

          export { b } from "./b";
        `,
      })
    })

    it('reports missing comments for single nodes', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Comment above',
              right: 'a',
            },
            messageId: 'missedCommentAboveExport',
          },
        ],
        options: [
          {
            ...options,
            groups: [{ commentAbove: 'Comment above' }, 'unknown'],
          },
        ],
        output: dedent`
          // Comment above
          export { a } from "a";
        `,
        code: dedent`
          export { a } from "a";
        `,
      })
    })

    it('ignores shebangs and comments at the top of the file', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Comment above',
              right: './b',
            },
            messageId: 'missedCommentAboveExport',
          },
          {
            data: {
              right: './aa',
              left: './b',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above
          export { a } from "./aa";
          export { b } from "./b";
        `,
        code: dedent`
          #!/usr/bin/node
          // Some disclaimer

          export { b } from "./b";
          export { a } from "./aa";
        `,
        options: [
          {
            ...options,
            groups: [{ commentAbove: 'Comment above' }, 'unknown'],
          },
        ],
      })
    })

    it.each([
      '//   Comment above  ',
      '//   comment above  ',
      dedent`
        /**
         * Comment above
         */
      `,
      dedent`
        /**
         * Something before
         * CoMmEnT ABoVe
         * Something after
         */
      `,
    ])(
      'detects existing comments correctly with comment: %s',
      async comment => {
        await valid({
          options: [
            {
              ...options,
              groups: [
                'value-export',
                { commentAbove: 'Comment above' },
                'unknown',
              ],
            },
          ],
          code: dedent`
            export { a } from "a";

            ${comment}
            export type { b } from "./b";
          `,
        })
      },
    )

    it('deletes invalid auto-added comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Type exports',
              right: './c',
            },
            messageId: 'missedCommentAboveExport',
          },
          {
            data: {
              right: './bb',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              rightGroup: 'value-export',
              leftGroup: 'type-export',
              right: './aaa',
              left: './bb',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'Value exports' },
              'value-export',
              { commentAbove: 'Type exports' },
              'type-export',
            ],
          },
        ],
        output: dedent`
          // Value exports
          export { a } from './aaa';
          // Type exports
          export type { b } from './bb';
          export type { c } from './c';
        `,
        code: dedent`
          export type { c } from './c';
          // Value exports
          export type { b } from './bb';
          // Type exports
          export { a } from './aaa';
        `,
      })
    })

    it('works with other errors', async () => {
      await invalid({
        errors: [
          {
            data: {
              missedCommentAbove: 'Type exports',
              right: './b',
            },
            messageId: 'missedCommentAboveExport',
          },
          {
            data: {
              rightGroup: 'value-export',
              leftGroup: 'type-export',
              right: './a',
              left: './b',
            },
            messageId: 'unexpectedExportsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: [
              { commentAbove: 'Value exports' },
              'value-export',
              {
                commentAbove: 'Type exports',
                newlinesBetween: 'always',
              },
              ['type-export'],
            ],
            newlinesBetween: 'never',
          },
        ],
        output: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above a
          // Value exports
          export { a } from "./a"; // Comment after a

          // Type exports
          // Comment above b
          export type { b } from './b'; // Comment after b
        `,
        code: dedent`
          #!/usr/bin/node
          // Some disclaimer

          // Comment above b
          // Value exports
          export type { b } from './b'; // Comment after b
          // Comment above a
          // Type exports
          export { a } from "./a"; // Comment after a
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

    it('sorts exports', async () => {
      await valid({
        code: dedent`
          export { a1 } from 'a'
          export { b1, b2 } from 'b'
          export { c1, c2, c3 } from 'c'
          export { d1, d2 } from 'd'
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
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { a1 } from 'a'
          export { b1, b2 } from 'b'
          export { c1, c2, c3 } from 'c'
          export { d1, d2 } from 'd'
        `,
        code: dedent`
          export { b1, b2 } from 'b'
          export { a1 } from 'a'
          export { d1, d2 } from 'd'
          export { c1, c2, c3 } from 'c'
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
          export * from 'b'
          export * from 'c'
          export * from 'a'
        `,
        options: [options],
      })
    })

    it('enforces newlines between', async () => {
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
            messageId: 'missedSpacingBetweenExports',
          },
        ],
        output: dedent`
          export { b } from 'b'

          export { a } from 'a'
        `,
        code: dedent`
          export { b } from 'b'
          export { a } from 'a'
        `,
      })
    })
  })

  describe('misc', () => {
    it('sets alphabetical asc sorting as default', async () => {
      await valid(
        dedent`
          export { a } from '~/a'
          export { b } from '~/b'
          export { c } from '~/c'
          export { d } from '~/d'
        `,
      )

      await valid({
        code: dedent`
          export { log } from './log'
          export { log10 } from './log10'
          export { log1p } from './log1p'
          export { log2 } from './log2'
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: '~/b',
              left: '~/c',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { a } from '~/a'
          export { b } from '~/b'
          export { c } from '~/c'
          export { d } from '~/d'
        `,
        code: dedent`
          export { a } from '~/a'
          export { c } from '~/c'
          export { b } from '~/b'
          export { d } from '~/d'
        `,
      })
    })

    it('ignores exported variables or functions', async () => {
      await valid(
        dedent`
          export let a = () => {
            // ...
          }

          export let b = () => {
            // ...
          }

          export let c = ''
        `,
      )
    })

    it('handles eslint-disable-next-line comments', async () => {
      await valid({
        code: dedent`
          export { b } from "./b"
          export { c } from "./c"
          // eslint-disable-next-line
          export { a } from "./a"
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              right: './b',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { b } from './b'
          export { c } from './c'
          // eslint-disable-next-line
          export { a } from './a'
        `,
        code: dedent`
          export { c } from './c'
          export { b } from './b'
          // eslint-disable-next-line
          export { a } from './a'
        `,
        options: [{}],
      })
    })

    it('handles eslint-disable-next-line with partitionByComment', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: './c',
              left: './d',
            },
            messageId: 'unexpectedExportsOrder',
          },
          {
            data: {
              right: './b',
              left: './a',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { b } from './b'
          export { c } from './c'
          // eslint-disable-next-line
          export { a } from './a'
          export { d } from './d'
        `,
        code: dedent`
          export { d } from './d'
          export { c } from './c'
          // eslint-disable-next-line
          export { a } from './a'
          export { b } from './b'
        `,
        options: [
          {
            partitionByComment: true,
          },
        ],
      })
    })

    it('handles eslint-disable-line comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: './b',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { b } from './b'
          export { c } from './c'
          export { a } from './a' // eslint-disable-line
        `,
        code: dedent`
          export { c } from './c'
          export { b } from './b'
          export { a } from './a' // eslint-disable-line
        `,
        options: [{}],
      })
    })

    it('handles block eslint-disable-next-line comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: './b',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { b } from './b'
          export { c } from './c'
          /* eslint-disable-next-line */
          export { a } from './a'
        `,
        code: dedent`
          export { c } from './c'
          export { b } from './b'
          /* eslint-disable-next-line */
          export { a } from './a'
        `,
        options: [{}],
      })
    })

    it('handles block eslint-disable-line comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: './b',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { b } from './b'
          export { c } from './c'
          export { a } from './a' /* eslint-disable-line */
        `,
        code: dedent`
          export { c } from './c'
          export { b } from './b'
          export { a } from './a' /* eslint-disable-line */
        `,
        options: [{}],
      })
    })

    it('handles eslint-disable/enable blocks', async () => {
      await invalid({
        output: dedent`
          export { a } from './a'
          export { d } from './d'
          /* eslint-disable */
          export { c } from './c'
          export { b } from './b'
          // Shouldn't move
          /* eslint-enable */
          export { e } from './e'
        `,
        code: dedent`
          export { d } from './d'
          export { e } from './e'
          /* eslint-disable */
          export { c } from './c'
          export { b } from './b'
          // Shouldn't move
          /* eslint-enable */
          export { a } from './a'
        `,
        errors: [
          {
            data: {
              right: './a',
              left: './b',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        options: [{}],
      })
    })

    it('handles rule-specific eslint-disable-next-line comments', async () => {
      await invalid({
        output: dedent`
          export { b } from './b'
          export { c } from './c'
          // eslint-disable-next-line rule-to-test/sort-exports
          export { a } from './a'
        `,
        code: dedent`
          export { c } from './c'
          export { b } from './b'
          // eslint-disable-next-line rule-to-test/sort-exports
          export { a } from './a'
        `,
        errors: [
          {
            data: {
              right: './b',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        options: [{}],
      })
    })

    it('handles rule-specific eslint-disable-line comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: './b',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { b } from './b'
          export { c } from './c'
          export { a } from './a' // eslint-disable-line rule-to-test/sort-exports
        `,
        code: dedent`
          export { c } from './c'
          export { b } from './b'
          export { a } from './a' // eslint-disable-line rule-to-test/sort-exports
        `,
        options: [{}],
      })
    })

    it('handles rule-specific block eslint-disable-next-line comments', async () => {
      await invalid({
        output: dedent`
          export { b } from './b'
          export { c } from './c'
          /* eslint-disable-next-line rule-to-test/sort-exports */
          export { a } from './a'
        `,
        code: dedent`
          export { c } from './c'
          export { b } from './b'
          /* eslint-disable-next-line rule-to-test/sort-exports */
          export { a } from './a'
        `,
        errors: [
          {
            data: {
              right: './b',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        options: [{}],
      })
    })

    it('handles rule-specific block eslint-disable-line comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: './b',
              left: './c',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        output: dedent`
          export { b } from './b'
          export { c } from './c'
          export { a } from './a' /* eslint-disable-line rule-to-test/sort-exports */
        `,
        code: dedent`
          export { c } from './c'
          export { b } from './b'
          export { a } from './a' /* eslint-disable-line rule-to-test/sort-exports */
        `,
        options: [{}],
      })
    })

    it('handles rule-specific eslint-disable/enable blocks', async () => {
      await invalid({
        output: dedent`
          export { a } from './a'
          export { d } from './d'
          /* eslint-disable rule-to-test/sort-exports */
          export { c } from './c'
          export { b } from './b'
          // Shouldn't move
          /* eslint-enable */
          export { e } from './e'
        `,
        code: dedent`
          export { d } from './d'
          export { e } from './e'
          /* eslint-disable rule-to-test/sort-exports */
          export { c } from './c'
          export { b } from './b'
          // Shouldn't move
          /* eslint-enable */
          export { a } from './a'
        `,
        errors: [
          {
            data: {
              right: './a',
              left: './b',
            },
            messageId: 'unexpectedExportsOrder',
          },
        ],
        options: [{}],
      })
    })
  })
})
