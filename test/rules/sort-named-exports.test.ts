import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import rule, {
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
} from '../../rules/sort-named-exports'
import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { Alphabet } from '../../utils/alphabet'

describe('sort-named-exports', () => {
  let { invalid, valid } = createRuleTester({
    name: 'sort-named-exports',
    parser: typescriptParser,
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it(`sorts named exports`, async () => {
      await valid({
        code: 'export { a }',
        options: [options],
      })

      await valid({
        code: 'export { aaa, bb, c }',
        options: [options],
      })

      await invalid({
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
          export {
            aaa,
            bb,
            c
          }
        `,
        code: dedent`
          export {
            aaa,
            c,
            bb
          }
        `,
        options: [options],
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
          export {
            A,
            D,

            C,

            B,
            E,
          }
        `,
        code: dedent`
          export {
            D,
            A,

            C,

            E,
            B,
          }
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
              rightGroup: 'type-export',
              leftGroup: 'unknown',
              left: 'CC',
              right: 'D',
            },
            messageId: GROUP_ORDER_ERROR_ID,
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
          export {
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
          }
        `,
        code: dedent`
          export {
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
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: '^Part',
            groups: ['type-export'],
          },
        ],
      })
    })

    it('allows to use all comments as parts', async () => {
      await valid({
        code: dedent`
          export {
            // Comment
            BB,
            // Other comment
            A,
          }
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
          export {
            /* Partition Comment */
            // Part: A
            D,
            // Part: B
            AAA,
            BB,
            C,
            /* Other */
            E,
          }
        `,
        code: dedent`
          export {
            /* Partition Comment */
            // Part: A
            D,
            // Part: B
            AAA,
            C,
            BB,
            /* Other */
            E,
          }
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

    it('allows to use regex for partition comments', async () => {
      await valid({
        code: dedent`
          export {
            E,
            F,
            // I am a partition comment because I don't have f o o
            A,
            B,
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores block comments when partitioning by line comments', async () => {
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
          export {
            /* Comment */
            A,
            B,
          }
        `,
        code: dedent`
          export {
            B,
            /* Comment */
            A,
          }
        `,
      })
    })

    it('treats all line comments as partitions with object config', async () => {
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
          export {
            B,
            // Comment
            A,
          }
        `,
      })
    })

    it('uses specific line comments as partitions with object config', async () => {
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
          export {
            C,
            // B
            B,
            // A
            A,
          }
        `,
      })
    })

    it('matches line comments by regex with object config', async () => {
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
          export {
            B,
            // I am a partition comment because I don't have f o o
            A,
          }
        `,
      })
    })

    it('ignores line comments when partitioning by block comments', async () => {
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
          export {
            // Comment
            A,
            B,
          }
        `,
        code: dedent`
          export {
            B,
            // Comment
            A,
          }
        `,
      })
    })

    it('treats all block comments as partitions with object config', async () => {
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
          export {
            B,
            /* Comment */
            A,
          }
        `,
      })
    })

    it('uses specific block comments as partitions with object config', async () => {
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
          export {
            C,
            /* B */
            B,
            /* A */
            A,
          }
        `,
      })
    })

    it('matches block comments by regex with object config', async () => {
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
          export {
            B,
            /* I am a partition comment because I don't have f o o */
            A,
          }
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
          export { _a, b, _c }
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
          export { ab, a_c }
        `,
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          export { 你好, 世界, a, A, b, B }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('works with arbitrary names', async () => {
      await valid({
        code: dedent`
          export { a as "A", b as "B" };
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
          export { a as "A", b as "B" };
        `,
        code: dedent`
          export { b as "B", a as "A" };
        `,
        options: [options],
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
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            a, b
          }
        `,
        code: dedent`
          export {
            b, a
          }
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
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            a, b,
          }
        `,
        code: dedent`
          export {
            b, a,
          }
        `,
        options: [options],
      })
    })

    it('handles "ignoreAlias" option', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
        output: dedent`
          export {
            a as b,
            b as a,
          }
        `,
        code: dedent`
          export {
            b as a,
            a as b,
          }
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            'a' as b,
            'b' as a,
          } from './module'
        `,
        code: dedent`
          export {
            'b' as a,
            'a' as b,
          } from './module'
        `,
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
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
          export {
            b,

            a,
          }
        `,
        code: dedent`
          export {
            a,
            b,
          }
        `,
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
            messageId: GROUP_ORDER_ERROR_ID,
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
          export {
            type b,
            a,
          }
        `,
        code: dedent`
          export {
            a,
            type b,
          }
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array with string pattern', ['noMatch', 'hello']],
      ['object pattern with flags', { pattern: 'HELLO', flags: 'i' }],
      [
        'array with object pattern',
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ],
    ])(
      'filters on elementNamePattern with %s',
      async (_description, elementNamePattern) => {
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
              messageId: GROUP_ORDER_ERROR_ID,
            },
          ],
          output: dedent`
            export {
              type helloType,
              a,
              b,
            }
          `,
          code: dedent`
            export {
              a,
              b,
              type helloType,
            }
          `,
        })
      },
    )

    it('sorts custom groups by overriding type and order', async () => {
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
              rightGroup: 'reversedTypesByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: 'm',
            },
            messageId: GROUP_ORDER_ERROR_ID,
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
          export {
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
          }
        `,
        code: dedent`
          export {
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
          }
        `,
      })
    })

    it('sorts custom groups by overriding fallbackSort', async () => {
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
          export {
            fooBar,
            fooZar,
          }
        `,
        code: dedent`
          export {
            fooZar,
            fooBar,
          }
        `,
      })
    })

    it('does not sort custom groups with unsorted type', async () => {
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
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            type b,
            type a,
            type d,
            type e,
            type c,
            m,
          }
        `,
        code: dedent`
          export {
            type b,
            type a,
            type d,
            type e,
            m,
            type c,
          }
        `,
      })
    })

    it('sorts custom group blocks', async () => {
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
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            type cFoo,
            foo,
            type a,
          }
        `,
        code: dedent`
          export {
            type a,
            type cFoo,
            foo,
          }
        `,
      })
    })

    it('allows to use regex for element names in custom groups', async () => {
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
          export {
            iHaveFooInMyName,
            meTooIHaveFoo,
            a,
            b,
          }
        `,
      })
    })

    it('removes newlines when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'y',
              left: 'a',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
          {
            data: {
              right: 'b',
              left: 'z',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'b',
              left: 'z',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
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
          export {
              a,


             y,
            z,

                b,
          }
        `,
        output: dedent`
          export {
              a,
             b,
            y,
                z,
          }
        `,
      })
    })

    it('handles newlinesBetween between consecutive groups', async () => {
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
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: MISSED_SPACING_ERROR_ID,
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
        ],
        code: dedent`
            export {
            a,
            b,


            c,

            d,


            e,
          }
        `,
        output: dedent`
          export {
            a,

            b,

            c,
            d,


            e,
          }
        `,
      })
    })

    it.each([
      ['2 and 0', 2, 0],
      ['2 and ignore', 2, 'ignore'],
      ['0 and 2', 0, 2],
      ['ignore and 2', 'ignore', 2],
    ])(
      'enforces newlines when global option is %s',
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
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: MISSED_SPACING_ERROR_ID,
            },
          ],
          output: dedent`
            export {
              a,


              b,
            }
          `,
          code: dedent`
            export {
              a,
              b,
            }
          `,
        })
      },
    )

    it.each([
      ['1', 1],
      ['2', 2],
      ['ignore', 'ignore'],
      ['0', 0],
    ])(
      'enforces no newline when global option is %s and 0 exists between all groups',
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
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: EXTRA_SPACING_ERROR_ID,
            },
          ],
          output: dedent`
            export {
              a,
              b,
            }
          `,
          code: dedent`
            export {
              a,

              b,
            }
          `,
        })
      },
    )

    it.each([
      ['ignore and 0', 'ignore', 0],
      ['0 and ignore', 0, 'ignore'],
    ])(
      'does not enforce newlines when global option is %s',
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
            export {
              a,

              b,
            }
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
            export {
              a,
              b,
            }
          `,
        })
      },
    )

    it('handles newlines and comment after fixes', async () => {
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
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            a, // Comment after

            b,
            c,
          }
        `,
        code: dedent`
          export {
            b,
            a, // Comment after

            c,
          }
        `,
      })
    })

    it('ignores newline fixes between different partitions when newlinesBetween is 0', async () => {
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
          export {
            a,

            // Partition comment

            b,
            c,
          } from 'module'
        `,
        code: dedent`
          export {
            a,

            // Partition comment

            c,
            b,
          } from 'module'
        `,
      })
    })
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it(`sorts named exports`, async () => {
      await valid({
        code: 'export { a }',
        options: [options],
      })

      await valid({
        code: 'export { aaa, bb, c }',
        options: [options],
      })

      await invalid({
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
          export {
            aaa,
            bb,
            c
          }
        `,
        code: dedent`
          export {
            aaa,
            c,
            bb
          }
        `,
        options: [options],
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
          export {
            A,
            D,

            C,

            B,
            E,
          }
        `,
        code: dedent`
          export {
            D,
            A,

            C,

            E,
            B,
          }
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
              rightGroup: 'type-export',
              leftGroup: 'unknown',
              left: 'CC',
              right: 'D',
            },
            messageId: GROUP_ORDER_ERROR_ID,
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
          export {
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
          }
        `,
        code: dedent`
          export {
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
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: '^Part',
            groups: ['type-export'],
          },
        ],
      })
    })

    it('allows to use all comments as parts', async () => {
      await valid({
        code: dedent`
          export {
            // Comment
            BB,
            // Other comment
            A,
          }
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
          export {
            /* Partition Comment */
            // Part: A
            D,
            // Part: B
            AAA,
            BB,
            C,
            /* Other */
            E,
          }
        `,
        code: dedent`
          export {
            /* Partition Comment */
            // Part: A
            D,
            // Part: B
            AAA,
            C,
            BB,
            /* Other */
            E,
          }
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

    it('allows to use regex for partition comments', async () => {
      await valid({
        code: dedent`
          export {
            E,
            F,
            // I am a partition comment because I don't have f o o
            A,
            B,
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores block comments when partitioning by line comments', async () => {
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
          export {
            /* Comment */
            A,
            B,
          }
        `,
        code: dedent`
          export {
            B,
            /* Comment */
            A,
          }
        `,
      })
    })

    it('treats all line comments as partitions with object config', async () => {
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
          export {
            B,
            // Comment
            A,
          }
        `,
      })
    })

    it('uses specific line comments as partitions with object config', async () => {
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
          export {
            C,
            // B
            B,
            // A
            A,
          }
        `,
      })
    })

    it('matches line comments by regex with object config', async () => {
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
          export {
            B,
            // I am a partition comment because I don't have f o o
            A,
          }
        `,
      })
    })

    it('ignores line comments when partitioning by block comments', async () => {
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
          export {
            // Comment
            A,
            B,
          }
        `,
        code: dedent`
          export {
            B,
            // Comment
            A,
          }
        `,
      })
    })

    it('treats all block comments as partitions with object config', async () => {
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
          export {
            B,
            /* Comment */
            A,
          }
        `,
      })
    })

    it('uses specific block comments as partitions with object config', async () => {
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
          export {
            C,
            /* B */
            B,
            /* A */
            A,
          }
        `,
      })
    })

    it('matches block comments by regex with object config', async () => {
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
          export {
            B,
            /* I am a partition comment because I don't have f o o */
            A,
          }
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
          export { _a, b, _c }
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
          export { ab, a_c }
        `,
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          export { 你好, 世界, a, A, b, B }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('works with arbitrary names', async () => {
      await valid({
        code: dedent`
          export { a as "A", b as "B" };
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
          export { a as "A", b as "B" };
        `,
        code: dedent`
          export { b as "B", a as "A" };
        `,
        options: [options],
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
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            a, b
          }
        `,
        code: dedent`
          export {
            b, a
          }
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
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            a, b,
          }
        `,
        code: dedent`
          export {
            b, a,
          }
        `,
        options: [options],
      })
    })

    it('handles "ignoreAlias" option', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
        output: dedent`
          export {
            a as b,
            b as a,
          }
        `,
        code: dedent`
          export {
            b as a,
            a as b,
          }
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            'a' as b,
            'b' as a,
          } from './module'
        `,
        code: dedent`
          export {
            'b' as a,
            'a' as b,
          } from './module'
        `,
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
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
            messageId: GROUP_ORDER_ERROR_ID,
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
          export {
            type b,
            a,
          }
        `,
        code: dedent`
          export {
            a,
            type b,
          }
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array with string pattern', ['noMatch', 'hello']],
      ['object pattern with flags', { pattern: 'HELLO', flags: 'i' }],
      [
        'array with object pattern',
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ],
    ])(
      'filters on elementNamePattern with %s',
      async (_description, elementNamePattern) => {
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
              messageId: GROUP_ORDER_ERROR_ID,
            },
          ],
          output: dedent`
            export {
              type helloType,
              a,
              b,
            }
          `,
          code: dedent`
            export {
              a,
              b,
              type helloType,
            }
          `,
        })
      },
    )

    it('sorts custom groups by overriding type and order', async () => {
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
              rightGroup: 'reversedTypesByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: 'm',
            },
            messageId: GROUP_ORDER_ERROR_ID,
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
          export {
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
          }
        `,
        code: dedent`
          export {
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
          }
        `,
      })
    })

    it('sorts custom groups by overriding fallbackSort', async () => {
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
          export {
            fooBar,
            fooZar,
          }
        `,
        code: dedent`
          export {
            fooZar,
            fooBar,
          }
        `,
      })
    })

    it('does not sort custom groups with unsorted type', async () => {
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
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            type b,
            type a,
            type d,
            type e,
            type c,
            m,
          }
        `,
        code: dedent`
          export {
            type b,
            type a,
            type d,
            type e,
            m,
            type c,
          }
        `,
      })
    })

    it('sorts custom group blocks', async () => {
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
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            type cFoo,
            foo,
            type a,
          }
        `,
        code: dedent`
          export {
            type a,
            type cFoo,
            foo,
          }
        `,
      })
    })

    it('allows to use regex for element names in custom groups', async () => {
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
          export {
            iHaveFooInMyName,
            meTooIHaveFoo,
            a,
            b,
          }
        `,
      })
    })

    it('removes newlines when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'y',
              left: 'a',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
          {
            data: {
              right: 'b',
              left: 'z',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'b',
              left: 'z',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
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
          export {
              a,


             y,
            z,

                b,
          }
        `,
        output: dedent`
          export {
              a,
             b,
            y,
                z,
          }
        `,
      })
    })

    it('handles newlinesBetween between consecutive groups', async () => {
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
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: MISSED_SPACING_ERROR_ID,
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
        ],
        code: dedent`
            export {
            a,
            b,


            c,

            d,


            e,
          }
        `,
        output: dedent`
          export {
            a,

            b,

            c,
            d,


            e,
          }
        `,
      })
    })

    it.each([
      ['2 and 0', 2, 0],
      ['2 and ignore', 2, 'ignore'],
      ['0 and 2', 0, 2],
      ['ignore and 2', 'ignore', 2],
    ])(
      'enforces newlines when global option is %s',
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
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: MISSED_SPACING_ERROR_ID,
            },
          ],
          output: dedent`
            export {
              a,


              b,
            }
          `,
          code: dedent`
            export {
              a,
              b,
            }
          `,
        })
      },
    )

    it.each([
      ['1', 1],
      ['2', 2],
      ['ignore', 'ignore'],
      ['0', 0],
    ])(
      'enforces no newline when global option is %s and 0 exists between all groups',
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
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: EXTRA_SPACING_ERROR_ID,
            },
          ],
          output: dedent`
            export {
              a,
              b,
            }
          `,
          code: dedent`
            export {
              a,

              b,
            }
          `,
        })
      },
    )

    it.each([
      ['ignore and 0', 'ignore', 0],
      ['0 and ignore', 0, 'ignore'],
    ])(
      'does not enforce newlines when global option is %s',
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
            export {
              a,

              b,
            }
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
            export {
              a,
              b,
            }
          `,
        })
      },
    )

    it('handles newlines and comment after fixes', async () => {
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
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            a, // Comment after

            b,
            c,
          }
        `,
        code: dedent`
          export {
            b,
            a, // Comment after

            c,
          }
        `,
      })
    })

    it('ignores newline fixes between different partitions when newlinesBetween is 0', async () => {
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
          export {
            a,

            // Partition comment

            b,
            c,
          } from 'module'
        `,
        code: dedent`
          export {
            a,

            // Partition comment

            c,
            b,
          } from 'module'
        `,
      })
    })
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it(`sorts named exports`, async () => {
      await valid({
        code: 'export { a }',
        options: [options],
      })

      await valid({
        code: 'export { aaa, bb, c }',
        options: [options],
      })

      await invalid({
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
          export {
            aaa,
            bb,
            c
          }
        `,
        code: dedent`
          export {
            aaa,
            c,
            bb
          }
        `,
        options: [options],
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
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'BBBB',
              left: 'E',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            AAAAA,
            DD,

            CCC,

            BBBB,
            E,
          }
        `,
        code: dedent`
          export {
            DD,
            AAAAA,

            CCC,

            E,
            BBBB,
          }
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
              rightGroup: 'type-export',
              leftGroup: 'unknown',
              left: 'CC',
              right: 'D',
            },
            messageId: GROUP_ORDER_ERROR_ID,
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
          export {
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
          }
        `,
        code: dedent`
          export {
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
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: '^Part',
            groups: ['type-export'],
          },
        ],
      })
    })

    it('allows to use all comments as parts', async () => {
      await valid({
        code: dedent`
          export {
            // Comment
            BB,
            // Other comment
            A,
          }
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
          export {
            /* Partition Comment */
            // Part: A
            D,
            // Part: B
            AAA,
            BB,
            C,
            /* Other */
            E,
          }
        `,
        code: dedent`
          export {
            /* Partition Comment */
            // Part: A
            D,
            // Part: B
            AAA,
            C,
            BB,
            /* Other */
            E,
          }
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

    it('allows to use regex for partition comments', async () => {
      await valid({
        code: dedent`
          export {
            E,
            F,
            // I am a partition comment because I don't have f o o
            A,
            B,
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores block comments when partitioning by line comments', async () => {
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
          export {
            /* Comment */
            AA,
            B,
          }
        `,
        code: dedent`
          export {
            B,
            /* Comment */
            AA,
          }
        `,
      })
    })

    it('treats all line comments as partitions with object config', async () => {
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
          export {
            B,
            // Comment
            A,
          }
        `,
      })
    })

    it('uses specific line comments as partitions with object config', async () => {
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
          export {
            C,
            // B
            B,
            // A
            A,
          }
        `,
      })
    })

    it('matches line comments by regex with object config', async () => {
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
          export {
            B,
            // I am a partition comment because I don't have f o o
            A,
          }
        `,
      })
    })

    it('ignores line comments when partitioning by block comments', async () => {
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
          export {
            // Comment
            AA,
            B,
          }
        `,
        code: dedent`
          export {
            B,
            // Comment
            AA,
          }
        `,
      })
    })

    it('treats all block comments as partitions with object config', async () => {
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
          export {
            B,
            /* Comment */
            A,
          }
        `,
      })
    })

    it('uses specific block comments as partitions with object config', async () => {
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
          export {
            C,
            /* B */
            B,
            /* A */
            A,
          }
        `,
      })
    })

    it('matches block comments by regex with object config', async () => {
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
          export {
            B,
            /* I am a partition comment because I don't have f o o */
            A,
          }
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
          export { _aa, bbb, _c }
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
          export { abc, a_c }
        `,
      })
    })

    it('allows to use locale', async () => {
      await valid({
        code: dedent`
          export { 你好, 世界, a, A, b, B }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('works with arbitrary names', async () => {
      await valid({
        code: dedent`
          export { a as "A", b as "B" };
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
          export { a as "AA", b as "B" };
        `,
        code: dedent`
          export { b as "B", a as "AA" };
        `,
        options: [options],
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
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            aa, b
          }
        `,
        code: dedent`
          export {
            b, aa
          }
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
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            aa, b,
          }
        `,
        code: dedent`
          export {
            b, aa,
          }
        `,
        options: [options],
      })
    })

    it('handles "ignoreAlias" option', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
        output: dedent`
          export {
            aa as b,
            b as a,
          }
        `,
        code: dedent`
          export {
            b as a,
            aa as b,
          }
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            'aa' as b,
            'b' as a,
          } from './module'
        `,
        code: dedent`
          export {
            'b' as a,
            'aa' as b,
          } from './module'
        `,
        options: [
          {
            ...options,
            ignoreAlias: true,
          },
        ],
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
            messageId: GROUP_ORDER_ERROR_ID,
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
          export {
            type b,
            a,
          }
        `,
        code: dedent`
          export {
            a,
            type b,
          }
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array with string pattern', ['noMatch', 'hello']],
      ['object pattern with flags', { pattern: 'HELLO', flags: 'i' }],
      [
        'array with object pattern',
        ['noMatch', { pattern: 'HELLO', flags: 'i' }],
      ],
    ])(
      'filters on elementNamePattern with %s',
      async (_description, elementNamePattern) => {
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
              messageId: GROUP_ORDER_ERROR_ID,
            },
          ],
          output: dedent`
            export {
              type helloType,
              a,
              b,
            }
          `,
          code: dedent`
            export {
              a,
              b,
              type helloType,
            }
          `,
        })
      },
    )

    it('sorts custom groups by overriding type and order', async () => {
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
              rightGroup: 'reversedTypesByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: 'm',
            },
            messageId: GROUP_ORDER_ERROR_ID,
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
          export {
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
          }
        `,
        code: dedent`
          export {
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
          }
        `,
      })
    })

    it('sorts custom groups by overriding fallbackSort', async () => {
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
          export {
            fooBar,
            fooZar,
          }
        `,
        code: dedent`
          export {
            fooZar,
            fooBar,
          }
        `,
      })
    })

    it('does not sort custom groups with unsorted type', async () => {
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
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            type b,
            type a,
            type d,
            type e,
            type c,
            m,
          }
        `,
        code: dedent`
          export {
            type b,
            type a,
            type d,
            type e,
            m,
            type c,
          }
        `,
      })
    })

    it('sorts custom group blocks', async () => {
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
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            type cFoo,
            foo,
            type a,
          }
        `,
        code: dedent`
          export {
            type a,
            type cFoo,
            foo,
          }
        `,
      })
    })

    it('allows to use regex for element names in custom groups', async () => {
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
          export {
            iHaveFooInMyName,
            meTooIHaveFoo,
            a,
            b,
          }
        `,
      })
    })

    it('removes newlines when newlinesBetween is 0', async () => {
      await invalid({
        errors: [
          {
            data: {
              left: 'aaaa',
              right: 'yy',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
          {
            data: {
              right: 'bbb',
              left: 'z',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'bbb',
              left: 'z',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
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
            newlinesBetween: 0,
          },
        ],
        code: dedent`
          export {
              aaaa,


             yy,
            z,

                bbb,
          }
        `,
        output: dedent`
          export {
              aaaa,
             bbb,
            yy,
                z,
          }
        `,
      })
    })

    it('handles newlinesBetween between consecutive groups', async () => {
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
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: MISSED_SPACING_ERROR_ID,
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: EXTRA_SPACING_ERROR_ID,
          },
        ],
        code: dedent`
            export {
            a,
            b,


            c,

            d,


            e,
          }
        `,
        output: dedent`
          export {
            a,

            b,

            c,
            d,


            e,
          }
        `,
      })
    })

    it.each([
      ['2 and 0', 2, 0],
      ['2 and ignore', 2, 'ignore'],
      ['0 and 2', 0, 2],
      ['ignore and 2', 'ignore', 2],
    ])(
      'enforces newlines when global option is %s',
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
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: MISSED_SPACING_ERROR_ID,
            },
          ],
          output: dedent`
            export {
              a,


              b,
            }
          `,
          code: dedent`
            export {
              a,
              b,
            }
          `,
        })
      },
    )

    it.each([
      ['1', 1],
      ['2', 2],
      ['ignore', 'ignore'],
      ['0', 0],
    ])(
      'enforces no newline when global option is %s and 0 exists between all groups',
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
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: EXTRA_SPACING_ERROR_ID,
            },
          ],
          output: dedent`
            export {
              a,
              b,
            }
          `,
          code: dedent`
            export {
              a,

              b,
            }
          `,
        })
      },
    )

    it.each([
      ['ignore and 0', 'ignore', 0],
      ['0 and ignore', 0, 'ignore'],
    ])(
      'does not enforce newlines when global option is %s',
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
            export {
              a,

              b,
            }
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
            export {
              a,
              b,
            }
          `,
        })
      },
    )

    it('handles newlines and comment after fixes', async () => {
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
            messageId: GROUP_ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            a, // Comment after

            b,
            c,
          }
        `,
        code: dedent`
          export {
            b,
            a, // Comment after

            c,
          }
        `,
      })
    })

    it('ignores newline fixes between different partitions when newlinesBetween is 0', async () => {
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
          export {
            aaa,

            // Partition comment

            bb,
            c,
          } from 'module'
        `,
        code: dedent`
          export {
            aaa,

            // Partition comment

            c,
            bb,
          } from 'module'
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

    it('sorts named exports', async () => {
      await valid({
        code: 'export { a }',
        options: [options],
      })

      await valid({
        code: 'export { aaa, bb, c }',
        options: [options],
      })

      await invalid({
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
          export {
            aaa,
            bb,
            c
          }
        `,
        code: dedent`
          export {
            aaa,
            c,
            bb
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

    it('does not enforce sorting', async () => {
      await valid({
        code: dedent`
          export {
            b,
            c,
            a,
          }
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
            newlinesBetween: 1,
            groups: ['b', 'a'],
          },
        ],
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: MISSED_SPACING_ERROR_ID,
          },
        ],
        output: dedent`
          export {
              b,

              a,
          }
        `,
        code: dedent`
          export {
              b,
              a,
          }
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
      await valid('export { A, B }')

      await valid({
        code: 'export { log, log10, log1p, log2 }',
        options: [{}],
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
          export { A, B }
        `,
        code: dedent`
          export { B, A }
        `,
      })
    })

    it('respects eslint-disable-next-line comments', async () => {
      await valid({
        code: dedent`
          export {
            b,
            c,
            // eslint-disable-next-line
            a
          }
        `,
      })

      await invalid({
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
          export {
            b,
            c,
            // eslint-disable-next-line
            a
          }
        `,
        code: dedent`
          export {
            c,
            b,
            // eslint-disable-next-line
            a
          }
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
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            b,
            c,
            /* eslint-disable-next-line */
            a
          }
        `,
        code: dedent`
          export {
            c,
            b,
            /* eslint-disable-next-line */
            a
          }
        `,
        options: [{}],
      })
    })

    it('respects eslint-disable-line comments', async () => {
      await invalid({
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
          export {
            b,
            c,
            a // eslint-disable-line
          }
        `,
        code: dedent`
          export {
            c,
            b,
            a // eslint-disable-line
          }
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
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            b,
            c,
            a /* eslint-disable-line */
          }
        `,
        code: dedent`
          export {
            c,
            b,
            a /* eslint-disable-line */
          }
        `,
        options: [{}],
      })
    })

    it('respects eslint-disable-next-line with specific rule', async () => {
      await invalid({
        output: dedent`
          export {
            b,
            c,
            // eslint-disable-next-line rule-to-test/sort-named-exports
            a
          }
        `,
        code: dedent`
          export {
            c,
            b,
            // eslint-disable-next-line rule-to-test/sort-named-exports
            a
          }
        `,
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          export {
            b,
            c,
            /* eslint-disable-next-line rule-to-test/sort-named-exports */
            a
          }
        `,
        code: dedent`
          export {
            c,
            b,
            /* eslint-disable-next-line rule-to-test/sort-named-exports */
            a
          }
        `,
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [{}],
      })
    })

    it('respects eslint-disable-line with specific rule', async () => {
      await invalid({
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
          export {
            b,
            c,
            a // eslint-disable-line rule-to-test/sort-named-exports
          }
        `,
        code: dedent`
          export {
            c,
            b,
            a // eslint-disable-line rule-to-test/sort-named-exports
          }
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
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            b,
            c,
            a /* eslint-disable-line rule-to-test/sort-named-exports */
          }
        `,
        code: dedent`
          export {
            c,
            b,
            a /* eslint-disable-line rule-to-test/sort-named-exports */
          }
        `,
        options: [{}],
      })
    })

    it('respects eslint-disable/enable block comments', async () => {
      await invalid({
        output: dedent`
          export {
            a,
            d,
            /* eslint-disable */
            c,
            b,
            // Shouldn't move
            /* eslint-enable */
            e,
          }
        `,
        code: dedent`
          export {
            d,
            e,
            /* eslint-disable */
            c,
            b,
            // Shouldn't move
            /* eslint-enable */
            a,
          }
        `,
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          export {
            a,
            d,
            /* eslint-disable rule-to-test/sort-named-exports */
            c,
            b,
            // Shouldn't move
            /* eslint-enable */
            e,
          }
        `,
        code: dedent`
          export {
            d,
            e,
            /* eslint-disable rule-to-test/sort-named-exports */
            c,
            b,
            // Shouldn't move
            /* eslint-enable */
            a,
          }
        `,
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        options: [{}],
      })
    })

    it('handles eslint-disable with partitionByComment', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: ORDER_ERROR_ID,
          },
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: ORDER_ERROR_ID,
          },
        ],
        output: dedent`
          export {
            b,
            c,
            // eslint-disable-next-line
            a,
            d
          }
        `,
        code: dedent`
          export {
            d,
            c,
            // eslint-disable-next-line
            a,
            b
          }
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
