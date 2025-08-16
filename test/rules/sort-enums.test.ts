import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { createTypedRuleTester } from './create-typed-rule-tester'
import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-enums'

describe('sort-enums', () => {
  let { invalid, valid } = createTypedRuleTester({
    parser: typescriptParser,
    name: 'sort-enums',
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('sorts enum members', async () => {
      await valid({
        code: dedent`
          enum Enum {
            aaaa = 'a',
            bbb = 'b',
            cc = 'c',
            d = 'd',
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'bbb',
              left: 'cc',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            aaaa = 'a',
            bbb = 'b',
            cc = 'c',
            d = 'd',
          }
        `,
        code: dedent`
          enum Enum {
            aaaa = 'a',
            cc = 'c',
            bbb = 'b',
            d = 'd',
          }
        `,
        options: [options],
      })
    })

    it('sorts enum members with number keys', async () => {
      await valid({
        code: dedent`
          enum Enum {
            1 = 'a',
            12 = 'b',
            2 = 'c',
            8 = 'c',
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: '12',
              left: '8',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            1 = 'a',
            12 = 'b',
            2 = 'c',
            8 = 'c',
          }
        `,
        code: dedent`
          enum Enum {
            1 = 'a',
            2 = 'c',
            8 = 'c',
            12 = 'b',
          }
        `,
        options: [options],
      })
    })

    it('preserves enum members without initializer', async () => {
      await valid({
        code: dedent`
          enum Enum {
            aaa,
            bb = 'bb',
            c,
          }
        `,
        options: [options],
      })
    })

    it('sorts enum members with boolean identifiers', async () => {
      await valid({
        code: dedent`
          enum Enum {
            false = 'b',
            true = 'a',
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'false',
              left: 'true',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            false = 'b',
            true = 'a',
          }
        `,
        code: dedent`
          enum Enum {
            true = 'a',
            false = 'b',
          }
        `,
        options: [options],
      })
    })

    it('preserves documentation comments when sorting', async () => {
      await invalid({
        output: dedent`
          enum Enum {
            /**
             * Comment A
             */
            'aaa' = 'a',
            /**
             * Comment B
             */
            b = 'b',
          }
        `,
        code: dedent`
          enum Enum {
            /**
             * Comment B
             */
            b = 'b',
            /**
             * Comment A
             */
            'aaa' = 'a',
          }
        `,
        errors: [
          {
            data: {
              right: 'aaa',
              left: 'b',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        options: [options],
      })
    })

    it('preserves implicit values in enums', async () => {
      await valid({
        code: dedent`
          export enum Enum {
            d, // implicit value: 0
            cc, // implicit value: 1
            bbb, // implicit value: 2
            aaaa, // implicit value: 3
          }
        `,
        options: [options],
      })
    })

    it('sorts within partition comments', async () => {
      await invalid({
        output: dedent`
          enum Enum {
            // Part: A
            // Not partition comment
            bbb = 'b',
            cc = 'c',
            d = 'd',
            // Part: B
            aaaa = 'a',
            e = 'e',
            // Part: C
            // Not partition comment
            fff = 'f',
            'gg' = 'g',
          }
        `,
        code: dedent`
          enum Enum {
            // Part: A
            cc = 'c',
            d = 'd',
            // Not partition comment
            bbb = 'b',
            // Part: B
            aaaa = 'a',
            e = 'e',
            // Part: C
            'gg' = 'g',
            // Not partition comment
            fff = 'f',
          }
        `,
        errors: [
          {
            data: {
              right: 'bbb',
              left: 'd',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'fff',
              left: 'gg',
            },
            messageId: 'unexpectedEnumsOrder',
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

    it('treats all comments as partition delimiters', async () => {
      await valid({
        code: dedent`
          enum Enum {
            // Comment
            bb = 'b',
            // Other comment
            a = 'a',
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

    it('handles multiple partition comment patterns', async () => {
      await invalid({
        output: dedent`
          enum Enum {
            /* Partition Comment */
            // Part: A
            d = 'd',
            // Part: B
            aaa = 'a',
            bb = 'b',
            c = 'c',
            /* Other */
            e = 'e',
          }
        `,
        code: dedent`
          enum Enum {
            /* Partition Comment */
            // Part: A
            d = 'd',
            // Part: B
            aaa = 'a',
            c = 'c',
            bb = 'b',
            /* Other */
            e = 'e',
          }
        `,
        errors: [
          {
            data: {
              right: 'bb',
              left: 'c',
            },
            messageId: 'unexpectedEnumsOrder',
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
          enum Enum {
            E = 'E',
            F = 'F',
            // I am a partition comment because I don't have f o o
            A = 'A',
            B = 'B',
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

    it('ignores block comments when line partition is enabled', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedEnumsOrder',
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
          enum Enum {
            /* Comment */
            A = "A",
            B = "B",
          }
        `,
        code: dedent`
          enum Enum {
            B = "B",
            /* Comment */
            A = "A",
          }
        `,
      })
    })

    it('treats line comments as partition delimiters', async () => {
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
          enum Enum {
            B = "B",
            // Comment
            A = "A",
          }
        `,
      })
    })

    it('handles multiple line comment patterns', async () => {
      await valid({
        code: dedent`
          enum Enum {
             C = "C",
             // B
             B = "B",
             // A
             A = "A",
           }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['A', 'B'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for line comments', async () => {
      await valid({
        code: dedent`
          enum Enum {
            B = 'B',
            // I am a partition comment because I don't have f o o
            A = 'A',
          }
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

    it('ignores line comments when block partition is enabled', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedEnumsOrder',
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
          enum Enum {
            // Comment
            A = "A",
            B = "B",
          }
        `,
        code: dedent`
          enum Enum {
            B = "B",
            // Comment
            A = "A",
          }
        `,
      })
    })

    it('treats block comments as partition delimiters', async () => {
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
          enum Enum {
            B = "B",
            /* Comment */
            A = "A",
          }
        `,
      })
    })

    it('handles multiple block comment patterns', async () => {
      await valid({
        code: dedent`
          enum Enum {
             C = "C",
             /* B */
             B = "B",
             /* A */
             A = "A",
           }
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
          enum Enum {
            B = 'B',
            /* I am a partition comment because I don't have f o o */
            A = 'A',
          }
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

    it('sorts enum members by their values', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'e',
              left: 'd',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'f',
              left: 'e',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'g',
              left: 'f',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'h',
              left: 'g',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'i',
              left: 'h',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'j',
              left: 'i',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            'j' = null,
            'k' = undefined,
            'i' = 'a',
            'h' = 'b',
            'g' = 'c',
            'f' = 'd',
            'e' = 'e',
            'd' = 'f',
            'c' = 'g',
            'b' = 'h',
            'a' = 'i',
          }
        `,
        code: dedent`
          enum Enum {
            'a' = 'i',
            'b' = 'h',
            'c' = 'g',
            'd' = 'f',
            'e' = 'e',
            'f' = 'd',
            'g' = 'c',
            'h' = 'b',
            'i' = 'a',
            'j' = null,
            'k' = undefined,
          }
        `,
        options: [
          {
            ...options,
            sortByValue: true,
          },
        ],
      })
    })

    it('trims special characters when sorting', async () => {
      await valid({
        code: dedent`
          enum Enum {
            _A = 'A',
            B = 'B',
            _C = 'C',
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

    it('removes special characters when sorting', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          enum Enum {
            AB = 'AB',
            A_C = 'AC',
          }
        `,
      })
    })

    it('sorts using specified locale', async () => {
      await valid({
        code: dedent`
          enum Enum {
            你好 = '你好',
            世界 = '世界',
            a = 'a',
            A = 'A',
            b = 'b',
            B = 'B',
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts inline enum members correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            A = "A", B = "B"
          }
        `,
        code: dedent`
          enum Enum {
            B = "B", A = "A"
          }
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
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            A = "A", B = "B",
          }
        `,
        code: dedent`
          enum Enum {
            B = "B", A = "A",
          }
        `,
        options: [options],
      })
    })

    it.each([
      ['string pattern', 'HELLO'],
      ['array with string pattern', ['noMatch', 'HELLO']],
      ['object pattern with flags', { pattern: 'hello', flags: 'i' }],
      [
        'array with object pattern',
        ['noMatch', { pattern: 'hello', flags: 'i' }],
      ],
    ])(
      'groups enum members by name pattern (%s)',
      async (_description, elementNamePattern) => {
        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'keysStartingWithHello',
                leftGroup: 'unknown',
                right: 'HELLO_KEY',
                left: 'B',
              },
              messageId: 'unexpectedEnumsGroupOrder',
            },
          ],
          options: [
            {
              customGroups: [
                {
                  groupName: 'keysStartingWithHello',
                  elementNamePattern,
                },
              ],
              groups: ['keysStartingWithHello', 'unknown'],
            },
          ],
          output: dedent`
            enum Enum {
              HELLO_KEY = 3,
              A = 1,
              B = 2,
            }
          `,
          code: dedent`
            enum Enum {
              A = 1,
              B = 2,
              HELLO_KEY = 3,
            }
          `,
        })
      },
    )

    it.each([
      ['string pattern', 'HELLO'],
      ['array with string pattern', ['noMatch', 'HELLO']],
      ['object pattern with flags', { pattern: 'hello', flags: 'i' }],
      [
        'array with object pattern',
        ['noMatch', { pattern: 'hello', flags: 'i' }],
      ],
    ])(
      'groups enum members by value pattern (%s)',
      async (_description, elementValuePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'valuesStartingWithHello',
                  elementValuePattern,
                },
              ],
              groups: ['valuesStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'valuesStartingWithHello',
                leftGroup: 'unknown',
                right: 'Z',
                left: 'B',
              },
              messageId: 'unexpectedEnumsGroupOrder',
            },
          ],
          output: dedent`
            enum Enum {
              Z = 'HELLO_KEY',
              A = 'A',
              B = 'B',
            }
          `,
          code: dedent`
            enum Enum {
              A = 'A',
              B = 'B',
              Z = 'HELLO_KEY',
            }
          `,
        })
      },
    )

    it('overrides sorting type and order for custom groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: '_BB',
              left: '_A',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: '_CCC',
              left: '_BB',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: '_DDDD',
              left: '_CCC',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              rightGroup: 'reversedStartingWith_ByLineLength',
              leftGroup: 'unknown',
              right: '_EEE',
              left: 'M',
            },
            messageId: 'unexpectedEnumsGroupOrder',
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
          enum Enum {
            _DDDD = null,
            _CCC = null,
            _EEE = null,
            _BB = null,
            _FF = null,
            _A = null,
            _G = null,
            M = null,
            O = null,
            P = null,
          }
        `,
        code: dedent`
          enum Enum {
            _A = null,
            _BB = null,
            _CCC = null,
            _DDDD = null,
            M = null,
            _EEE = null,
            _FF = null,
            _G = null,
            O = null,
            P = null,
          }
        `,
      })
    })

    it('applies fallback sorting within custom groups', async () => {
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
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            fooBar = 'fooBar',
            fooZar = 'fooZar',
          }
        `,
        code: dedent`
          enum Enum {
            fooZar = 'fooZar',
            fooBar = 'fooBar',
          }
        `,
      })
    })

    it('preserves original order for unsorted custom groups', async () => {
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
              right: '_C',
              left: 'M',
            },
            messageId: 'unexpectedEnumsGroupOrder',
          },
        ],
        output: dedent`
          enum Enum {
            _B = null,
            _A = null,
            _D = null,
            _E = null,
            _C = null,
            M = null,
          }
        `,
        code: dedent`
          enum Enum {
            _B = null,
            _A = null,
            _D = null,
            _E = null,
            M = null,
            _C = null,
          }
        `,
      })
    })

    it('groups elements matching any pattern in anyOf block', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    elementNamePattern: 'FOO',
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
              right: 'C_FOO',
              left: 'A',
            },
            messageId: 'unexpectedEnumsGroupOrder',
          },
        ],
        output: dedent`
          enum Enum {
            C_FOO = null,
            FOO = null,
            A = null,
          }
        `,
        code: dedent`
          enum Enum {
            A = null,
            C_FOO = null,
            FOO = null,
          }
        `,
      })
    })

    it('supports negative regex patterns in custom groups', async () => {
      await valid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: '^(?!.*FOO).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
            type: 'alphabetical',
          },
        ],
        code: dedent`
          enum Enum {
            I_HAVE_FOO_IN_MY_NAME = null,
            ME_TOO_I_HAVE_FOO = null,
            A = null,
            B = null,
          }
        `,
      })
    })

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'removes newlines between groups when newlinesBetween is %s',
      async (_description, newlinesBetween) => {
        await invalid({
          errors: [
            {
              data: {
                right: 'Y',
                left: 'A',
              },
              messageId: 'extraSpacingBetweenEnumsMembers',
            },
            {
              data: {
                right: 'B',
                left: 'Z',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'B',
                left: 'Z',
              },
              messageId: 'extraSpacingBetweenEnumsMembers',
            },
          ],
          options: [
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'A',
                  groupName: 'a',
                },
              ],
              groups: ['a', 'unknown'],
              newlinesBetween,
            },
          ],
          code: dedent`
            enum Enum {
              A = null,


             Y = null,
            Z = null,

                B = null,
            }
          `,
          output: dedent`
            enum Enum {
              A = null,
             B = null,
            Y = null,
                Z = null,
            }
          `,
        })
      },
    )

    it.each([
      ['always', 'always' as const],
      ['1', 1 as const],
    ])(
      'enforces single newline between groups when newlinesBetween is %s',
      async (_description, newlinesBetween) => {
        await invalid({
          errors: [
            {
              data: {
                right: 'Z',
                left: 'A',
              },
              messageId: 'extraSpacingBetweenEnumsMembers',
            },
            {
              data: {
                right: 'Y',
                left: 'Z',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'B',
                left: 'Y',
              },
              messageId: 'missedSpacingBetweenEnumsMembers',
            },
          ],
          options: [
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'A',
                  groupName: 'a',
                },
                {
                  elementNamePattern: 'B',
                  groupName: 'b',
                },
              ],
              groups: ['a', 'unknown', 'b'],
              newlinesBetween,
            },
          ],
          output: dedent`
            enum Enum {
              A = null,

             Y = null,
            Z = null,

                B = null,
            }
          `,
          code: dedent`
            enum Enum {
              A = null,


             Z = null,
            Y = null,
                B = null,
            }
          `,
        })
      },
    )

    it('applies newlinesBetween rules between consecutive groups', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'A',
                groupName: 'a',
              },
              {
                elementNamePattern: 'B',
                groupName: 'b',
              },
              {
                elementNamePattern: 'C',
                groupName: 'c',
              },
              {
                elementNamePattern: 'D',
                groupName: 'd',
              },
              {
                elementNamePattern: 'E',
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
              right: 'B',
              left: 'A',
            },
            messageId: 'missedSpacingBetweenEnumsMembers',
          },
          {
            data: {
              right: 'C',
              left: 'B',
            },
            messageId: 'extraSpacingBetweenEnumsMembers',
          },
          {
            data: {
              right: 'D',
              left: 'C',
            },
            messageId: 'extraSpacingBetweenEnumsMembers',
          },
        ],
        output: dedent`
          enum Enum {
            A = null,

            B = null,

            C = null,
            D = null,


            E = null,
          }
        `,
        code: dedent`
          enum Enum {
            A = null,
            B = null,


            C = null,

            D = null,


            E = null,
          }
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
      'enforces newlines between non-consecutive groups when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'A', groupName: 'A' },
                { elementNamePattern: 'B', groupName: 'B' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'A',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'B',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'B',
                left: 'A',
              },
              messageId: 'missedSpacingBetweenEnumsMembers',
            },
          ],
          output: dedent`
            enum Enum {
              A = 'A',


              B = 'B',
            }
          `,
          code: dedent`
            enum Enum {
              A = 'A',
              B = 'B',
            }
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
      'removes newlines when never is set between all groups (global: %s)',
      async globalNewlinesBetween => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'A', groupName: 'a' },
                { elementNamePattern: 'B', groupName: 'b' },
                { elementNamePattern: 'C', groupName: 'c' },
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
                right: 'B',
                left: 'A',
              },
              messageId: 'extraSpacingBetweenEnumsMembers',
            },
          ],
          output: dedent`
            enum Enum {
              A = 'A',
              B = 'B',
            }
          `,
          code: dedent`
            enum Enum {
              A = 'A',

              B = 'B',
            }
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
      'allows any spacing when both options allow flexibility (global: %s, group: %s)',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await valid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'A', groupName: 'A' },
                { elementNamePattern: 'B', groupName: 'B' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'A',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'B',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            enum Enum {
              A = 'A',

              B = 'B',
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
            enum Enum {
              A = 'A',
              B = 'B',
            }
          `,
        })
      },
    )

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'preserves partition boundaries regardless of newlinesBetween setting (%s)',
      async (_description, newlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'A',
                  groupName: 'A',
                },
              ],
              groups: ['A', 'unknown'],
              partitionByComment: true,
              newlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          output: dedent`
            enum Enum {
              A = 'A',

              // Partition comment

              B = 'B',
              C = 'C',
            }
          `,
          code: dedent`
            enum Enum {
              A = 'A',

              // Partition comment

              C = 'C',
              B = 'B',
            }
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

    it('sorts enum members', async () => {
      await valid({
        code: dedent`
          enum Enum {
            aaaa = 'a',
            bbb = 'b',
            cc = 'c',
            d = 'd',
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'bbb',
              left: 'cc',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            aaaa = 'a',
            bbb = 'b',
            cc = 'c',
            d = 'd',
          }
        `,
        code: dedent`
          enum Enum {
            aaaa = 'a',
            cc = 'c',
            bbb = 'b',
            d = 'd',
          }
        `,
        options: [options],
      })
    })

    it('sorts enum members with number keys', async () => {
      await valid({
        code: dedent`
          enum Enum {
            1 = 'a',
            2 = 'c',
            8 = 'c',
            12 = 'b',
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: '8',
              left: '12',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            1 = 'a',
            2 = 'c',
            8 = 'c',
            12 = 'b',
          }
        `,
        code: dedent`
          enum Enum {
            1 = 'a',
            2 = 'c',
            12 = 'b',
            8 = 'c',
          }
        `,
        options: [options],
      })
    })

    it('preserves enum members without initializer', async () => {
      await valid({
        code: dedent`
          enum Enum {
            aaa,
            bb = 'bb',
            c,
          }
        `,
        options: [options],
      })
    })

    it('sorts enum members with boolean identifiers', async () => {
      await valid({
        code: dedent`
          enum Enum {
            false = 'b',
            true = 'a',
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'false',
              left: 'true',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            false = 'b',
            true = 'a',
          }
        `,
        code: dedent`
          enum Enum {
            true = 'a',
            false = 'b',
          }
        `,
        options: [options],
      })
    })

    it('preserves documentation comments when sorting', async () => {
      await invalid({
        output: dedent`
          enum Enum {
            /**
             * Comment A
             */
            'aaa' = 'a',
            /**
             * Comment B
             */
            b = 'b',
          }
        `,
        code: dedent`
          enum Enum {
            /**
             * Comment B
             */
            b = 'b',
            /**
             * Comment A
             */
            'aaa' = 'a',
          }
        `,
        errors: [
          {
            data: {
              right: 'aaa',
              left: 'b',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        options: [options],
      })
    })

    it('preserves implicit values in enums', async () => {
      await valid({
        code: dedent`
          export enum Enum {
            d, // implicit value: 0
            cc, // implicit value: 1
            bbb, // implicit value: 2
            aaaa, // implicit value: 3
          }
        `,
        options: [options],
      })
    })

    it('sorts within partition comments', async () => {
      await invalid({
        output: dedent`
          enum Enum {
            // Part: A
            // Not partition comment
            bbb = 'b',
            cc = 'c',
            d = 'd',
            // Part: B
            aaaa = 'a',
            e = 'e',
            // Part: C
            // Not partition comment
            fff = 'f',
            'gg' = 'g',
          }
        `,
        code: dedent`
          enum Enum {
            // Part: A
            cc = 'c',
            d = 'd',
            // Not partition comment
            bbb = 'b',
            // Part: B
            aaaa = 'a',
            e = 'e',
            // Part: C
            'gg' = 'g',
            // Not partition comment
            fff = 'f',
          }
        `,
        errors: [
          {
            data: {
              right: 'bbb',
              left: 'd',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'fff',
              left: 'gg',
            },
            messageId: 'unexpectedEnumsOrder',
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

    it('treats all comments as partition delimiters', async () => {
      await valid({
        code: dedent`
          enum Enum {
            // Comment
            bb = 'b',
            // Other comment
            a = 'a',
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

    it('handles multiple partition comment patterns', async () => {
      await invalid({
        output: dedent`
          enum Enum {
            /* Partition Comment */
            // Part: A
            d = 'd',
            // Part: B
            aaa = 'a',
            bb = 'b',
            c = 'c',
            /* Other */
            e = 'e',
          }
        `,
        code: dedent`
          enum Enum {
            /* Partition Comment */
            // Part: A
            d = 'd',
            // Part: B
            aaa = 'a',
            c = 'c',
            bb = 'b',
            /* Other */
            e = 'e',
          }
        `,
        errors: [
          {
            data: {
              right: 'bb',
              left: 'c',
            },
            messageId: 'unexpectedEnumsOrder',
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
          enum Enum {
            E = 'E',
            F = 'F',
            // I am a partition comment because I don't have f o o
            A = 'A',
            B = 'B',
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

    it('ignores block comments when line partition is enabled', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedEnumsOrder',
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
          enum Enum {
            /* Comment */
            A = "A",
            B = "B",
          }
        `,
        code: dedent`
          enum Enum {
            B = "B",
            /* Comment */
            A = "A",
          }
        `,
      })
    })

    it('treats line comments as partition delimiters', async () => {
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
          enum Enum {
            B = "B",
            // Comment
            A = "A",
          }
        `,
      })
    })

    it('handles multiple line comment patterns', async () => {
      await valid({
        code: dedent`
          enum Enum {
             C = "C",
             // B
             B = "B",
             // A
             A = "A",
           }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['A', 'B'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for line comments', async () => {
      await valid({
        code: dedent`
          enum Enum {
            B = 'B',
            // I am a partition comment because I don't have f o o
            A = 'A',
          }
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

    it('ignores line comments when block partition is enabled', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedEnumsOrder',
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
          enum Enum {
            // Comment
            A = "A",
            B = "B",
          }
        `,
        code: dedent`
          enum Enum {
            B = "B",
            // Comment
            A = "A",
          }
        `,
      })
    })

    it('treats block comments as partition delimiters', async () => {
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
          enum Enum {
            B = "B",
            /* Comment */
            A = "A",
          }
        `,
      })
    })

    it('handles multiple block comment patterns', async () => {
      await valid({
        code: dedent`
          enum Enum {
             C = "C",
             /* B */
             B = "B",
             /* A */
             A = "A",
           }
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
          enum Enum {
            B = 'B',
            /* I am a partition comment because I don't have f o o */
            A = 'A',
          }
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

    it('sorts enum members by their values', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'e',
              left: 'd',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'f',
              left: 'e',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'g',
              left: 'f',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'h',
              left: 'g',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'i',
              left: 'h',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'j',
              left: 'i',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            'j' = null,
            'k' = undefined,
            'i' = 'a',
            'h' = 'b',
            'g' = 'c',
            'f' = 'd',
            'e' = 'e',
            'd' = 'f',
            'c' = 'g',
            'b' = 'h',
            'a' = 'i',
          }
        `,
        code: dedent`
          enum Enum {
            'a' = 'i',
            'b' = 'h',
            'c' = 'g',
            'd' = 'f',
            'e' = 'e',
            'f' = 'd',
            'g' = 'c',
            'h' = 'b',
            'i' = 'a',
            'j' = null,
            'k' = undefined,
          }
        `,
        options: [
          {
            ...options,
            sortByValue: true,
          },
        ],
      })
    })

    it('trims special characters when sorting', async () => {
      await valid({
        code: dedent`
          enum Enum {
            _A = 'A',
            B = 'B',
            _C = 'C',
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

    it('removes special characters when sorting', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          enum Enum {
            AB = 'AB',
            A_C = 'AC',
          }
        `,
      })
    })

    it('sorts using specified locale', async () => {
      await valid({
        code: dedent`
          enum Enum {
            你好 = '你好',
            世界 = '世界',
            a = 'a',
            A = 'A',
            b = 'b',
            B = 'B',
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts inline enum members correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            A = "A", B = "B"
          }
        `,
        code: dedent`
          enum Enum {
            B = "B", A = "A"
          }
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
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            A = "A", B = "B",
          }
        `,
        code: dedent`
          enum Enum {
            B = "B", A = "A",
          }
        `,
        options: [options],
      })
    })

    it.each([
      ['string pattern', 'HELLO'],
      ['array with string pattern', ['noMatch', 'HELLO']],
      ['object pattern with flags', { pattern: 'hello', flags: 'i' }],
      [
        'array with object pattern',
        ['noMatch', { pattern: 'hello', flags: 'i' }],
      ],
    ])(
      'groups enum members by name pattern (%s)',
      async (_description, elementNamePattern) => {
        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'keysStartingWithHello',
                leftGroup: 'unknown',
                right: 'HELLO_KEY',
                left: 'B',
              },
              messageId: 'unexpectedEnumsGroupOrder',
            },
          ],
          options: [
            {
              customGroups: [
                {
                  groupName: 'keysStartingWithHello',
                  elementNamePattern,
                },
              ],
              groups: ['keysStartingWithHello', 'unknown'],
            },
          ],
          output: dedent`
            enum Enum {
              HELLO_KEY = 3,
              A = 1,
              B = 2,
            }
          `,
          code: dedent`
            enum Enum {
              A = 1,
              B = 2,
              HELLO_KEY = 3,
            }
          `,
        })
      },
    )

    it.each([
      ['string pattern', 'HELLO'],
      ['array with string pattern', ['noMatch', 'HELLO']],
      ['object pattern with flags', { pattern: 'hello', flags: 'i' }],
      [
        'array with object pattern',
        ['noMatch', { pattern: 'hello', flags: 'i' }],
      ],
    ])(
      'groups enum members by value pattern (%s)',
      async (_description, elementValuePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'valuesStartingWithHello',
                  elementValuePattern,
                },
              ],
              groups: ['valuesStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'valuesStartingWithHello',
                leftGroup: 'unknown',
                right: 'Z',
                left: 'B',
              },
              messageId: 'unexpectedEnumsGroupOrder',
            },
          ],
          output: dedent`
            enum Enum {
              Z = 'HELLO_KEY',
              A = 'A',
              B = 'B',
            }
          `,
          code: dedent`
            enum Enum {
              A = 'A',
              B = 'B',
              Z = 'HELLO_KEY',
            }
          `,
        })
      },
    )

    it('overrides sorting type and order for custom groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: '_BB',
              left: '_A',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: '_CCC',
              left: '_BB',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: '_DDDD',
              left: '_CCC',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              rightGroup: 'reversedStartingWith_ByLineLength',
              leftGroup: 'unknown',
              right: '_EEE',
              left: 'M',
            },
            messageId: 'unexpectedEnumsGroupOrder',
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
          enum Enum {
            _DDDD = null,
            _CCC = null,
            _EEE = null,
            _BB = null,
            _FF = null,
            _A = null,
            _G = null,
            M = null,
            O = null,
            P = null,
          }
        `,
        code: dedent`
          enum Enum {
            _A = null,
            _BB = null,
            _CCC = null,
            _DDDD = null,
            M = null,
            _EEE = null,
            _FF = null,
            _G = null,
            O = null,
            P = null,
          }
        `,
      })
    })

    it('applies fallback sorting within custom groups', async () => {
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
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            fooBar = 'fooBar',
            fooZar = 'fooZar',
          }
        `,
        code: dedent`
          enum Enum {
            fooZar = 'fooZar',
            fooBar = 'fooBar',
          }
        `,
      })
    })

    it('preserves original order for unsorted custom groups', async () => {
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
              right: '_C',
              left: 'M',
            },
            messageId: 'unexpectedEnumsGroupOrder',
          },
        ],
        output: dedent`
          enum Enum {
            _B = null,
            _A = null,
            _D = null,
            _E = null,
            _C = null,
            M = null,
          }
        `,
        code: dedent`
          enum Enum {
            _B = null,
            _A = null,
            _D = null,
            _E = null,
            M = null,
            _C = null,
          }
        `,
      })
    })

    it('groups elements matching any pattern in anyOf block', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    elementNamePattern: 'FOO',
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
              right: 'C_FOO',
              left: 'A',
            },
            messageId: 'unexpectedEnumsGroupOrder',
          },
        ],
        output: dedent`
          enum Enum {
            C_FOO = null,
            FOO = null,
            A = null,
          }
        `,
        code: dedent`
          enum Enum {
            A = null,
            C_FOO = null,
            FOO = null,
          }
        `,
      })
    })

    it('supports negative regex patterns in custom groups', async () => {
      await valid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: '^(?!.*FOO).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
            type: 'alphabetical',
          },
        ],
        code: dedent`
          enum Enum {
            I_HAVE_FOO_IN_MY_NAME = null,
            ME_TOO_I_HAVE_FOO = null,
            A = null,
            B = null,
          }
        `,
      })
    })

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'removes newlines between groups when newlinesBetween is %s',
      async (_description, newlinesBetween) => {
        await invalid({
          errors: [
            {
              data: {
                right: 'Y',
                left: 'A',
              },
              messageId: 'extraSpacingBetweenEnumsMembers',
            },
            {
              data: {
                right: 'B',
                left: 'Z',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'B',
                left: 'Z',
              },
              messageId: 'extraSpacingBetweenEnumsMembers',
            },
          ],
          options: [
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'A',
                  groupName: 'a',
                },
              ],
              groups: ['a', 'unknown'],
              newlinesBetween,
            },
          ],
          code: dedent`
            enum Enum {
              A = null,


             Y = null,
            Z = null,

                B = null,
            }
          `,
          output: dedent`
            enum Enum {
              A = null,
             B = null,
            Y = null,
                Z = null,
            }
          `,
        })
      },
    )

    it.each([
      ['always', 'always' as const],
      ['1', 1 as const],
    ])(
      'enforces single newline between groups when newlinesBetween is %s',
      async (_description, newlinesBetween) => {
        await invalid({
          errors: [
            {
              data: {
                right: 'Z',
                left: 'A',
              },
              messageId: 'extraSpacingBetweenEnumsMembers',
            },
            {
              data: {
                right: 'Y',
                left: 'Z',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'B',
                left: 'Y',
              },
              messageId: 'missedSpacingBetweenEnumsMembers',
            },
          ],
          options: [
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'A',
                  groupName: 'a',
                },
                {
                  elementNamePattern: 'B',
                  groupName: 'b',
                },
              ],
              groups: ['a', 'unknown', 'b'],
              newlinesBetween,
            },
          ],
          output: dedent`
            enum Enum {
              A = null,

             Y = null,
            Z = null,

                B = null,
            }
          `,
          code: dedent`
            enum Enum {
              A = null,


             Z = null,
            Y = null,
                B = null,
            }
          `,
        })
      },
    )

    it('applies newlinesBetween rules between consecutive groups', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'A',
                groupName: 'a',
              },
              {
                elementNamePattern: 'B',
                groupName: 'b',
              },
              {
                elementNamePattern: 'C',
                groupName: 'c',
              },
              {
                elementNamePattern: 'D',
                groupName: 'd',
              },
              {
                elementNamePattern: 'E',
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
              right: 'B',
              left: 'A',
            },
            messageId: 'missedSpacingBetweenEnumsMembers',
          },
          {
            data: {
              right: 'C',
              left: 'B',
            },
            messageId: 'extraSpacingBetweenEnumsMembers',
          },
          {
            data: {
              right: 'D',
              left: 'C',
            },
            messageId: 'extraSpacingBetweenEnumsMembers',
          },
        ],
        output: dedent`
          enum Enum {
            A = null,

            B = null,

            C = null,
            D = null,


            E = null,
          }
        `,
        code: dedent`
          enum Enum {
            A = null,
            B = null,


            C = null,

            D = null,


            E = null,
          }
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
      'enforces newlines between non-consecutive groups when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'A', groupName: 'A' },
                { elementNamePattern: 'B', groupName: 'B' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'A',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'B',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'B',
                left: 'A',
              },
              messageId: 'missedSpacingBetweenEnumsMembers',
            },
          ],
          output: dedent`
            enum Enum {
              A = 'A',


              B = 'B',
            }
          `,
          code: dedent`
            enum Enum {
              A = 'A',
              B = 'B',
            }
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
      'removes newlines when never is set between all groups (global: %s)',
      async globalNewlinesBetween => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'A', groupName: 'a' },
                { elementNamePattern: 'B', groupName: 'b' },
                { elementNamePattern: 'C', groupName: 'c' },
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
                right: 'B',
                left: 'A',
              },
              messageId: 'extraSpacingBetweenEnumsMembers',
            },
          ],
          output: dedent`
            enum Enum {
              A = 'A',
              B = 'B',
            }
          `,
          code: dedent`
            enum Enum {
              A = 'A',

              B = 'B',
            }
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
      'allows any spacing when both options allow flexibility (global: %s, group: %s)',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await valid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'A', groupName: 'A' },
                { elementNamePattern: 'B', groupName: 'B' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'A',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'B',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            enum Enum {
              A = 'A',

              B = 'B',
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
            enum Enum {
              A = 'A',
              B = 'B',
            }
          `,
        })
      },
    )

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'preserves partition boundaries regardless of newlinesBetween setting (%s)',
      async (_description, newlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'A',
                  groupName: 'A',
                },
              ],
              groups: ['A', 'unknown'],
              partitionByComment: true,
              newlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'B',
                left: 'C',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          output: dedent`
            enum Enum {
              A = 'A',

              // Partition comment

              B = 'B',
              C = 'C',
            }
          `,
          code: dedent`
            enum Enum {
              A = 'A',

              // Partition comment

              C = 'C',
              B = 'B',
            }
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

    it('sorts enum members', async () => {
      await valid({
        code: dedent`
          enum Enum {
            aaaa = 'a',
            bbb = 'b',
            cc = 'c',
            d = 'd',
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'bbb',
              left: 'cc',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            aaaa = 'a',
            bbb = 'b',
            cc = 'c',
            d = 'd',
          }
        `,
        code: dedent`
          enum Enum {
            aaaa = 'a',
            cc = 'c',
            bbb = 'b',
            d = 'd',
          }
        `,
        options: [options],
      })
    })

    it('sorts enum members with number keys', async () => {
      await valid({
        code: dedent`
          enum Enum {
            12 = 'b',
            1 = 'a',
            2 = 'c',
            8 = 'c',
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: '12',
              left: '8',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            12 = 'b',
            1 = 'a',
            2 = 'c',
            8 = 'c',
          }
        `,
        code: dedent`
          enum Enum {
            1 = 'a',
            2 = 'c',
            8 = 'c',
            12 = 'b',
          }
        `,
        options: [options],
      })
    })

    it('preserves enum members without initializer', async () => {
      await valid({
        code: dedent`
          enum Enum {
            aaa,
            bb = 'bb',
            c,
          }
        `,
        options: [options],
      })
    })

    it('sorts enum members with boolean identifiers', async () => {
      await valid({
        code: dedent`
          enum Enum {
            false = 'b',
            true = 'a',
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'false',
              left: 'true',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            false = 'b',
            true = 'a',
          }
        `,
        code: dedent`
          enum Enum {
            true = 'a',
            false = 'b',
          }
        `,
        options: [options],
      })
    })

    it('preserves documentation comments when sorting', async () => {
      await invalid({
        output: dedent`
          enum Enum {
            /**
             * Comment A
             */
            'aaa' = 'a',
            /**
             * Comment B
             */
            b = 'b',
          }
        `,
        code: dedent`
          enum Enum {
            /**
             * Comment B
             */
            b = 'b',
            /**
             * Comment A
             */
            'aaa' = 'a',
          }
        `,
        errors: [
          {
            data: {
              right: 'aaa',
              left: 'b',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        options: [options],
      })
    })

    it('preserves implicit values in enums', async () => {
      await valid({
        code: dedent`
          export enum Enum {
            d, // implicit value: 0
            cc, // implicit value: 1
            bbb, // implicit value: 2
            aaaa, // implicit value: 3
          }
        `,
        options: [options],
      })
    })

    it('sorts within partition comments', async () => {
      await invalid({
        output: dedent`
          enum Enum {
            // Part: A
            // Not partition comment
            bbb = 'b',
            cc = 'c',
            d = 'd',
            // Part: B
            aaaa = 'a',
            e = 'e',
            // Part: C
            'gg' = 'g',
            // Not partition comment
            fff = 'f',
          }
        `,
        code: dedent`
          enum Enum {
            // Part: A
            cc = 'c',
            d = 'd',
            // Not partition comment
            bbb = 'b',
            // Part: B
            aaaa = 'a',
            e = 'e',
            // Part: C
            'gg' = 'g',
            // Not partition comment
            fff = 'f',
          }
        `,
        errors: [
          {
            data: {
              right: 'bbb',
              left: 'd',
            },
            messageId: 'unexpectedEnumsOrder',
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

    it('treats all comments as partition delimiters', async () => {
      await valid({
        code: dedent`
          enum Enum {
            // Comment
            bb = 'b',
            // Other comment
            a = 'a',
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

    it('handles multiple partition comment patterns', async () => {
      await invalid({
        output: dedent`
          enum Enum {
            /* Partition Comment */
            // Part: A
            d = 'd',
            // Part: B
            aaa = 'a',
            bb = 'b',
            c = 'c',
            /* Other */
            e = 'e',
          }
        `,
        code: dedent`
          enum Enum {
            /* Partition Comment */
            // Part: A
            d = 'd',
            // Part: B
            aaa = 'a',
            c = 'c',
            bb = 'b',
            /* Other */
            e = 'e',
          }
        `,
        errors: [
          {
            data: {
              right: 'bb',
              left: 'c',
            },
            messageId: 'unexpectedEnumsOrder',
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
          enum Enum {
            E = 'E',
            F = 'F',
            // I am a partition comment because I don't have f o o
            A = 'A',
            B = 'B',
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

    it('ignores block comments when line partition is enabled', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'AA',
              left: 'B',
            },
            messageId: 'unexpectedEnumsOrder',
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
          enum Enum {
            /* Comment */
            AA = "AA",
            B = "B",
          }
        `,
        code: dedent`
          enum Enum {
            B = "B",
            /* Comment */
            AA = "AA",
          }
        `,
      })
    })

    it('treats line comments as partition delimiters', async () => {
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
          enum Enum {
            B = "B",
            // Comment
            A = "A",
          }
        `,
      })
    })

    it('handles multiple line comment patterns', async () => {
      await valid({
        code: dedent`
          enum Enum {
             C = "C",
             // B
             B = "B",
             // A
             A = "A",
           }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['A', 'B'],
            },
          },
        ],
      })
    })

    it('supports regex patterns for line comments', async () => {
      await valid({
        code: dedent`
          enum Enum {
            B = 'B',
            // I am a partition comment because I don't have f o o
            A = 'A',
          }
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

    it('ignores line comments when block partition is enabled', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'AA',
              left: 'B',
            },
            messageId: 'unexpectedEnumsOrder',
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
          enum Enum {
            // Comment
            AA = "AA",
            B = "B",
          }
        `,
        code: dedent`
          enum Enum {
            B = "B",
            // Comment
            AA = "AA",
          }
        `,
      })
    })

    it('treats block comments as partition delimiters', async () => {
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
          enum Enum {
            B = "B",
            /* Comment */
            A = "A",
          }
        `,
      })
    })

    it('handles multiple block comment patterns', async () => {
      await valid({
        code: dedent`
          enum Enum {
             C = "C",
             /* B */
             B = "B",
             /* A */
             A = "A",
           }
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
          enum Enum {
            B = 'B',
            /* I am a partition comment because I don't have f o o */
            A = 'A',
          }
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

    it('sorts enum members by their values', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'j',
              left: 'i',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'k',
              left: 'j',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            'k' = undefined,
            'j' = null,
            'a' = 'i',
            'b' = 'h',
            'c' = 'g',
            'd' = 'f',
            'e' = 'e',
            'f' = 'd',
            'g' = 'c',
            'h' = 'b',
            'i' = 'a',
          }
        `,
        code: dedent`
          enum Enum {
            'a' = 'i',
            'b' = 'h',
            'c' = 'g',
            'd' = 'f',
            'e' = 'e',
            'f' = 'd',
            'g' = 'c',
            'h' = 'b',
            'i' = 'a',
            'j' = null,
            'k' = undefined,
          }
        `,
        options: [
          {
            ...options,
            sortByValue: true,
          },
        ],
      })
    })

    it('trims special characters when sorting', async () => {
      await valid({
        code: dedent`
          enum Enum {
            _A = 'A',
            BB = 'B',
            _C = 'C',
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

    it('removes special characters when sorting', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
        code: dedent`
          enum Enum {
            A_C = 'AC',
            AB = 'AB',
          }
        `,
      })
    })

    it('sorts using specified locale', async () => {
      await valid({
        code: dedent`
          enum Enum {
            你好 = '你好',
            世界 = '世界',
            a = 'a',
            A = 'A',
            b = 'b',
            B = 'B',
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts inline enum members correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'AA',
              left: 'B',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            AA = "AA", B = "B"
          }
        `,
        code: dedent`
          enum Enum {
            B = "B", AA = "AA"
          }
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
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            AA = "AA", B = "B",
          }
        `,
        code: dedent`
          enum Enum {
            B = "B", AA = "AA",
          }
        `,
        options: [options],
      })
    })

    it.each([
      ['string pattern', 'HELLO'],
      ['array with string pattern', ['noMatch', 'HELLO']],
      ['object pattern with flags', { pattern: 'hello', flags: 'i' }],
      [
        'array with object pattern',
        ['noMatch', { pattern: 'hello', flags: 'i' }],
      ],
    ])(
      'groups enum members by name pattern (%s)',
      async (_description, elementNamePattern) => {
        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'keysStartingWithHello',
                leftGroup: 'unknown',
                right: 'HELLO_KEY',
                left: 'B',
              },
              messageId: 'unexpectedEnumsGroupOrder',
            },
          ],
          options: [
            {
              customGroups: [
                {
                  groupName: 'keysStartingWithHello',
                  elementNamePattern,
                },
              ],
              groups: ['keysStartingWithHello', 'unknown'],
            },
          ],
          output: dedent`
            enum Enum {
              HELLO_KEY = 3,
              A = 1,
              B = 2,
            }
          `,
          code: dedent`
            enum Enum {
              A = 1,
              B = 2,
              HELLO_KEY = 3,
            }
          `,
        })
      },
    )

    it.each([
      ['string pattern', 'HELLO'],
      ['array with string pattern', ['noMatch', 'HELLO']],
      ['object pattern with flags', { pattern: 'hello', flags: 'i' }],
      [
        'array with object pattern',
        ['noMatch', { pattern: 'hello', flags: 'i' }],
      ],
    ])(
      'groups enum members by value pattern (%s)',
      async (_description, elementValuePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'valuesStartingWithHello',
                  elementValuePattern,
                },
              ],
              groups: ['valuesStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'valuesStartingWithHello',
                leftGroup: 'unknown',
                right: 'Z',
                left: 'B',
              },
              messageId: 'unexpectedEnumsGroupOrder',
            },
          ],
          output: dedent`
            enum Enum {
              Z = 'HELLO_KEY',
              A = 'A',
              B = 'B',
            }
          `,
          code: dedent`
            enum Enum {
              A = 'A',
              B = 'B',
              Z = 'HELLO_KEY',
            }
          `,
        })
      },
    )

    it('overrides sorting type and order for custom groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: '_BB',
              left: '_A',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: '_CCC',
              left: '_BB',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: '_DDDD',
              left: '_CCC',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              rightGroup: 'reversedStartingWith_ByLineLength',
              leftGroup: 'unknown',
              right: '_EEE',
              left: 'M',
            },
            messageId: 'unexpectedEnumsGroupOrder',
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
          enum Enum {
            _DDDD = null,
            _CCC = null,
            _EEE = null,
            _BB = null,
            _FF = null,
            _A = null,
            _G = null,
            M = null,
            O = null,
            P = null,
          }
        `,
        code: dedent`
          enum Enum {
            _A = null,
            _BB = null,
            _CCC = null,
            _DDDD = null,
            M = null,
            _EEE = null,
            _FF = null,
            _G = null,
            O = null,
            P = null,
          }
        `,
      })
    })

    it('applies fallback sorting within custom groups', async () => {
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
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            fooBar = 'fooBar',
            fooZar = 'fooZar',
          }
        `,
        code: dedent`
          enum Enum {
            fooZar = 'fooZar',
            fooBar = 'fooBar',
          }
        `,
      })
    })

    it('preserves original order for unsorted custom groups', async () => {
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
              right: '_C',
              left: 'M',
            },
            messageId: 'unexpectedEnumsGroupOrder',
          },
        ],
        output: dedent`
          enum Enum {
            _B = null,
            _A = null,
            _D = null,
            _E = null,
            _C = null,
            M = null,
          }
        `,
        code: dedent`
          enum Enum {
            _B = null,
            _A = null,
            _D = null,
            _E = null,
            M = null,
            _C = null,
          }
        `,
      })
    })

    it('groups elements matching any pattern in anyOf block', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                anyOf: [
                  {
                    elementNamePattern: 'FOO',
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
              right: 'C_FOO',
              left: 'A',
            },
            messageId: 'unexpectedEnumsGroupOrder',
          },
        ],
        output: dedent`
          enum Enum {
            C_FOO = null,
            FOO = null,
            A = null,
          }
        `,
        code: dedent`
          enum Enum {
            A = null,
            C_FOO = null,
            FOO = null,
          }
        `,
      })
    })

    it('supports negative regex patterns in custom groups', async () => {
      await valid({
        options: [
          {
            customGroups: [
              {
                elementNamePattern: '^(?!.*FOO).*$',
                groupName: 'elementsWithoutFoo',
              },
            ],
            groups: ['unknown', 'elementsWithoutFoo'],
            type: 'alphabetical',
          },
        ],
        code: dedent`
          enum Enum {
            I_HAVE_FOO_IN_MY_NAME = null,
            ME_TOO_I_HAVE_FOO = null,
            A = null,
            B = null,
          }
        `,
      })
    })

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'removes newlines between groups when newlinesBetween is %s',
      async (_description, newlinesBetween) => {
        await invalid({
          errors: [
            {
              data: {
                left: 'AAAA',
                right: 'YY',
              },
              messageId: 'extraSpacingBetweenEnumsMembers',
            },
            {
              data: {
                right: 'BBB',
                left: 'Z',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'BBB',
                left: 'Z',
              },
              messageId: 'extraSpacingBetweenEnumsMembers',
            },
          ],
          options: [
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'AAAA',
                  groupName: 'a',
                },
              ],
              groups: ['a', 'unknown'],
              newlinesBetween,
            },
          ],
          code: dedent`
            enum Enum {
              AAAA = null,


             YY = null,
            Z = null,

                BBB = null,
            }
          `,
          output: dedent`
            enum Enum {
              AAAA = null,
             BBB = null,
            YY = null,
                Z = null,
            }
          `,
        })
      },
    )

    it.each([
      ['always', 'always' as const],
      ['1', 1 as const],
    ])(
      'enforces single newline between groups when newlinesBetween is %s',
      async (_description, newlinesBetween) => {
        await invalid({
          errors: [
            {
              data: {
                left: 'AAAA',
                right: 'Z',
              },
              messageId: 'extraSpacingBetweenEnumsMembers',
            },
            {
              data: {
                right: 'YY',
                left: 'Z',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'BBB',
                left: 'YY',
              },
              messageId: 'missedSpacingBetweenEnumsMembers',
            },
          ],
          options: [
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'AAAA',
                  groupName: 'a',
                },
                {
                  elementNamePattern: 'BBB',
                  groupName: 'b',
                },
              ],
              groups: ['a', 'unknown', 'b'],
              newlinesBetween,
            },
          ],
          output: dedent`
            enum Enum {
              AAAA = null,

             YY = null,
            Z = null,

                BBB = null,
            }
          `,
          code: dedent`
            enum Enum {
              AAAA = null,


             Z = null,
            YY = null,
                BBB = null,
            }
          `,
        })
      },
    )

    it('applies newlinesBetween rules between consecutive groups', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: 'A',
                groupName: 'a',
              },
              {
                elementNamePattern: 'B',
                groupName: 'b',
              },
              {
                elementNamePattern: 'C',
                groupName: 'c',
              },
              {
                elementNamePattern: 'D',
                groupName: 'd',
              },
              {
                elementNamePattern: 'E',
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
              right: 'B',
              left: 'A',
            },
            messageId: 'missedSpacingBetweenEnumsMembers',
          },
          {
            data: {
              right: 'C',
              left: 'B',
            },
            messageId: 'extraSpacingBetweenEnumsMembers',
          },
          {
            data: {
              right: 'D',
              left: 'C',
            },
            messageId: 'extraSpacingBetweenEnumsMembers',
          },
        ],
        output: dedent`
          enum Enum {
            A = null,

            B = null,

            C = null,
            D = null,


            E = null,
          }
        `,
        code: dedent`
          enum Enum {
            A = null,
            B = null,


            C = null,

            D = null,


            E = null,
          }
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
      'enforces newlines between non-consecutive groups when global is %s and group is %s',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'A', groupName: 'A' },
                { elementNamePattern: 'B', groupName: 'B' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'A',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'B',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'B',
                left: 'A',
              },
              messageId: 'missedSpacingBetweenEnumsMembers',
            },
          ],
          output: dedent`
            enum Enum {
              A = 'A',


              B = 'B',
            }
          `,
          code: dedent`
            enum Enum {
              A = 'A',
              B = 'B',
            }
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
      'removes newlines when never is set between all groups (global: %s)',
      async globalNewlinesBetween => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'A', groupName: 'a' },
                { elementNamePattern: 'B', groupName: 'b' },
                { elementNamePattern: 'C', groupName: 'c' },
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
                right: 'B',
                left: 'A',
              },
              messageId: 'extraSpacingBetweenEnumsMembers',
            },
          ],
          output: dedent`
            enum Enum {
              A = 'A',
              B = 'B',
            }
          `,
          code: dedent`
            enum Enum {
              A = 'A',

              B = 'B',
            }
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
      'allows any spacing when both options allow flexibility (global: %s, group: %s)',
      async (globalNewlinesBetween, groupNewlinesBetween) => {
        await valid({
          options: [
            {
              ...options,
              customGroups: [
                { elementNamePattern: 'A', groupName: 'A' },
                { elementNamePattern: 'B', groupName: 'B' },
                { groupName: 'unusedGroup', elementNamePattern: 'X' },
              ],
              groups: [
                'A',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'B',
              ],
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          code: dedent`
            enum Enum {
              A = 'A',

              B = 'B',
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
            enum Enum {
              A = 'A',
              B = 'B',
            }
          `,
        })
      },
    )

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'preserves partition boundaries regardless of newlinesBetween setting (%s)',
      async (_description, newlinesBetween) => {
        await invalid({
          options: [
            {
              ...options,
              customGroups: [
                {
                  elementNamePattern: 'AAA',
                  groupName: 'AAA',
                },
              ],
              groups: ['AAA', 'unknown'],
              partitionByComment: true,
              newlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'BB',
                left: 'C',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          output: dedent`
            enum Enum {
              AAA = 'AAA',

              // Partition comment

              BB = 'BB',
              C = 'C',
            }
          `,
          code: dedent`
            enum Enum {
              AAA = 'AAA',

              // Partition comment

              C = 'C',
              BB = 'BB',
            }
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

    it('sorts enum members', async () => {
      await valid({
        code: dedent`
          enum Enum {
            aaaa = 'a',
            bbb = 'b',
            cc = 'c',
            d = 'd',
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'bbb',
              left: 'cc',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            aaaa = 'a',
            bbb = 'b',
            cc = 'c',
            d = 'd',
          }
        `,
        code: dedent`
          enum Enum {
            aaaa = 'a',
            cc = 'c',
            bbb = 'b',
            d = 'd',
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

    it('preserves original order when sorting is disabled', async () => {
      await valid({
        code: dedent`
          enum Enum {
            b = 'b',
            c = 'c',
            a = 'a',
          }
        `,
        options: [options],
      })
    })

    it('enforces custom group ordering', async () => {
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
            messageId: 'unexpectedEnumsGroupOrder',
          },
        ],
        output: dedent`
          enum Enum {
            ba = 'ba',
            bb = 'bb',
            ab = 'ab',
            aa = 'aa',
          }
        `,
        code: dedent`
          enum Enum {
            ab = 'ab',
            aa = 'aa',
            ba = 'ba',
            bb = 'bb',
          }
        `,
      })
    })

    it('adds newlines between groups when required', async () => {
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
            messageId: 'missedSpacingBetweenEnumsMembers',
          },
        ],
        output: dedent`
          enum Enum {
            b = 'b',

            a = 'a',
          }
        `,
        code: dedent`
          enum Enum {
            b = 'b',
            a = 'a',
          }
        `,
      })
    })

    it('respects dependencies between enum members', async () => {
      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'a',
              right: 'b',
            },
            messageId: 'unexpectedEnumsDependencyOrder',
          },
        ],
        output: dedent`
          enum Enum {
            b = 1,
            a = b,
          }
        `,
        code: dedent`
          enum Enum {
            a = b,
            b = 1,
          }
        `,
        options: [options],
      })
    })
  })

  describe('misc', () => {
    it('validates the JSON schema', async () => {
      await expect(
        validateRuleJsonSchema(rule.meta.schema),
      ).resolves.not.toThrow()
    })

    it('detects numeric enums correctly', async () => {
      await valid({
        code: dedent`
          enum Enum {
            'a' = '1',
            'b' = 2,
            'c' = 0,
          }
        `,
        options: [
          {
            forceNumericSort: true,
          },
        ],
      })

      await valid({
        code: dedent`
          enum Enum {
              'a' = 1,
              'b' = 2,
              'c' = 0,
              d,
            }
        `,
        options: [
          {
            forceNumericSort: true,
          },
        ],
      })

      await valid({
        code: dedent`
          enum Enum {
              'a' = 1,
              'b' = 2,
              'c' = 0,
              d = undefined,
            }
        `,
        options: [
          {
            forceNumericSort: true,
          },
        ],
      })

      await valid({
        code: dedent`
          enum Enum {
              'a' = 1,
              'b' = 2,
              'c' = 0,
              d = null,
            }
        `,
        options: [
          {
            forceNumericSort: true,
          },
        ],
      })

      await valid({
        code: dedent`
          enum Enum {
              'i' = ~2, // -3
              'k' = -1,
              'j' = - 0.1,
              'e' = - (((1 + 1) * 2) ** 2) / 4 % 2, // 0
              'f' = 0,
              'h' = +1,
              'g' = 3 - 1, // 2
              'b' = 5^6, // 3
              'l' = 1 + 3, // 4
              'm' = 2.1 ** 2, // 4.41
              'a' = 20 >> 2, // 5
              'm' = 7 & 6, // 6
              'c' = 5 | 6, // 7
              'd' = 2 << 2, // 8
            }
        `,
        options: [
          {
            forceNumericSort: true,
          },
        ],
      })
    })

    it.each(['alphabetical', 'line-length', 'natural'] as const)(
      'sorts numeric enums by value when sortByValue is enabled (type: %s)',
      async type => {
        await invalid({
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'c',
                left: 'a',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          output: dedent`
            enum Enum {
              'c' = 0,
              'a' = 1,
              'b' = 2,
            }
          `,
          code: dedent`
            enum Enum {
              'b' = 2,
              'a' = 1,
              'c' = 0,
            }
          `,
          options: [
            {
              sortByValue: true,
              type,
            },
          ],
        })
      },
    )

    it.each(['alphabetical', 'line-length', 'natural'] as const)(
      'forces numeric sorting when forceNumericSort is enabled (type: %s)',
      async type => {
        await invalid({
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedEnumsOrder',
            },
            {
              data: {
                right: 'c',
                left: 'a',
              },
              messageId: 'unexpectedEnumsOrder',
            },
          ],
          output: dedent`
            enum Enum {
              'c' = 0,
              'a' = 1,
              'b' = 2,
            }
          `,
          code: dedent`
            enum Enum {
              'b' = 2,
              'a' = 1,
              'c' = 0,
            }
          `,
          options: [
            {
              forceNumericSort: true,
              type,
            },
          ],
        })
      },
    )

    it('applies default alphabetical ascending order', async () => {
      await valid(
        dedent`
          enum Enum {
            'a' = 'a',
            'b' = 'b',
            'c' = 'c',
          }
        `,
      )

      await valid({
        code: dedent`
          enum NumberBase {
            BASE_10 = 10,
            BASE_16 = 16,
            BASE_2 = 2,
            BASE_8 = 8
          }
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            'a' = 'a',
            'b' = 'b',
            'c' = 'c',
          }
        `,
        code: dedent`
          enum Enum {
            'b' = 'b',
            'a' = 'a',
            'c' = 'c',
          }
        `,
      })
    })

    it('handles dependencies between enum members', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'B',
              left: 'C',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            B = 0,
            A = B,
            C = 'C',
          }
        `,
        code: dedent`
          enum Enum {
            C = 'C',
            B = 0,
            A = B,
          }
        `,
        options: [
          {
            type: 'alphabetical',
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'B',
              left: 'C',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            B = 0,
            A = Enum.B,
            C = 'C',
          }
        `,
        code: dedent`
          enum Enum {
            C = 'C',
            B = 0,
            A = Enum.B,
          }
        `,
        options: [
          {
            type: 'alphabetical',
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'B',
              left: 'C',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            B = 0,
            A = 1 | 2 | B | Enum.B,
            C = 3,
          }
        `,
        code: dedent`
          enum Enum {
            C = 3,
            B = 0,
            A = 1 | 2 | B | Enum.B,
          }
        `,
        options: [
          {
            type: 'alphabetical',
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            A = AnotherEnum.B,
            B = 'B',
            C = 'C',
          }
        `,
        code: dedent`
          enum Enum {
            B = 'B',
            A = AnotherEnum.B,
            C = 'C',
          }
        `,
        options: [
          {
            type: 'alphabetical',
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'A',
              right: 'C',
            },
            messageId: 'unexpectedEnumsDependencyOrder',
          },
        ],
        output: dedent`
          enum Enum {
            C = 10,
            A = Enum.C,
            B = 10,
          }
        `,
        code: dedent`
          enum Enum {
            A = Enum.C,
            B = 10,
            C = 10,
          }
        `,
        options: [
          {
            type: 'alphabetical',
          },
        ],
      })
    })

    it('detects dependencies in template literal expressions', async () => {
      await valid({
        code: dedent`
          enum Enum {
            A = \`\${AnotherEnum.D}\`,
            D = 'D',
            B = \`\${Enum.D}\`,
            C = \`\${D}\`,
          }
        `,
        options: [
          {
            type: 'alphabetical',
          },
        ],
      })
    })

    it('ignores circular dependencies when sorting', async () => {
      await invalid({
        output: dedent`
          enum Enum {
            A = 'A',
            B = F,
            C = 'C',
            D = B,
            E = 'E',
            F = D
          }
        `,
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        code: dedent`
          enum Enum {
            B = F,
            A = 'A',
            C = 'C',
            D = B,
            E = 'E',
            F = D
          }
        `,
        options: [
          {
            type: 'alphabetical',
          },
        ],
      })
    })

    it('prioritizes dependencies over partition comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              nodeDependentOnRight: 'B',
              right: 'A',
            },
            messageId: 'unexpectedEnumsDependencyOrder',
          },
        ],
        output: dedent`
          enum Enum {
            A = 'A',
            // Part: 1
            B = A,
          }
        `,
        options: [
          {
            partitionByComment: '^Part',
            type: 'alphabetical',
          },
        ],
        code: dedent`
          enum Enum {
            B = A,
            // Part: 1
            A = 'A',
          }
        `,
      })
    })

    it('prioritizes dependencies over custom groups', async () => {
      await valid({
        options: [
          {
            customGroups: [
              {
                groupName: 'attributesStartingWithA',
                elementNamePattern: 'A',
              },
              {
                groupName: 'attributesStartingWithB',
                elementNamePattern: 'B',
              },
            ],
            groups: ['attributesStartingWithA', 'attributesStartingWithB'],
          },
        ],
        code: dedent`
          enum Enum {
            B = 'B',
            A = B,
          }
        `,
      })
    })

    it('preserves comments with their associated nodes', async () => {
      await invalid({
        output: dedent`
          enum Enum {
            // Ignore this comment

            // A3
            /**
              * A2
              */
            // A1
            A = 'A',

            // Ignore this comment

            // B2
            /**
              * B1
              */
            B = 'B',
          }
        `,
        code: dedent`
          enum Enum {
            // Ignore this comment

            // B2
            /**
              * B1
              */
            B = 'B',

            // Ignore this comment

            // A3
            /**
              * A2
              */
            // A1
            A = 'A',
          }
        `,
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        options: [
          {
            type: 'alphabetical',
          },
        ],
      })
    })

    it('handles partition comments correctly', async () => {
      await invalid({
        output: dedent`
          enum Enum {
            // Ignore this comment

            // B2
            /**
              * B1
              */
            B = 'B',

            // C2
            // C1
            C = 'C',

            // Above a partition comment ignore me
            // PartitionComment: 1
            A = 'A',

            /**
              * D2
              */
            // D1
            D = 'D',
          }
        `,
        code: dedent`
          enum Enum {
            // Ignore this comment

            // C2
            // C1
            C = 'C',

            // B2
            /**
              * B1
              */
            B = 'B',

            // Above a partition comment ignore me
            // PartitionComment: 1
            /**
              * D2
              */
            // D1
            D = 'D',

            A = 'A',
          }
        `,
        errors: [
          {
            data: {
              right: 'B',
              left: 'C',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'A',
              left: 'D',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        options: [
          {
            partitionByComment: 'PartitionComment:',
            type: 'alphabetical',
          },
        ],
      })
    })

    it('uses new lines as partition boundaries', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'C',
              left: 'D',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'A',
              left: 'E',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            C = 'C',
            D = 'D',

            B = 'B',

            A = 'A',
            E = 'E',
          }
        `,
        code: dedent`
          enum Enum {
            D = 'D',
            C = 'C',

            B = 'B',

            E = 'E',
            A = 'A',
          }
        `,
        options: [
          {
            partitionByNewLine: true,
            type: 'alphabetical',
          },
        ],
      })
    })

    it('supports eslint-disable comments for individual nodes', async () => {
      await valid({
        code: dedent`
          enum Enum {
            B = 'B',
            C = 'C',
            // eslint-disable-next-line
            A = 'A',
          }
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'B',
              left: 'C',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            B = 'B',
            C = 'C',
            // eslint-disable-next-line
            A = 'A'
          }
        `,
        code: dedent`
          enum Enum {
            C = 'C',
            B = 'B',
            // eslint-disable-next-line
            A = 'A'
          }
        `,
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'C',
              left: 'D',
            },
            messageId: 'unexpectedEnumsOrder',
          },
          {
            data: {
              right: 'B',
              left: 'A',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            B = 'B',
            C = 'C',
            // eslint-disable-next-line
            A = 'A',
            D = 'D'
          }
        `,
        code: dedent`
          enum Enum {
            D = 'D',
            C = 'C',
            // eslint-disable-next-line
            A = 'A',
            B = 'B'
          }
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
              right: 'B',
              left: 'C',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            B = A,
            C = 'C',
            // eslint-disable-next-line
            A = 'A'
          }
        `,
        code: dedent`
          enum Enum {
            C = 'C',
            B = A,
            // eslint-disable-next-line
            A = 'A'
          }
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
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            B = 'B',
            C = 'C',
            A = 'A' // eslint-disable-line
          }
        `,
        code: dedent`
          enum Enum {
            C = 'C',
            B = 'B',
            A = 'A' // eslint-disable-line
          }
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
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            B = 'B',
            C = 'C',
            /* eslint-disable-next-line */
            A = 'A'
          }
        `,
        code: dedent`
          enum Enum {
            C = 'C',
            B = 'B',
            /* eslint-disable-next-line */
            A = 'A'
          }
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
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            B = 'B',
            C = 'C',
            A = 'A' /* eslint-disable-line */
          }
        `,
        code: dedent`
          enum Enum {
            C = 'C',
            B = 'B',
            A = 'A' /* eslint-disable-line */
          }
        `,
        options: [{}],
      })

      await invalid({
        output: dedent`
          enum Enum {
            A = 'A',
            D = 'D',
            /* eslint-disable */
            C = 'C',
            B = 'B',
            // Shouldn't move
            /* eslint-enable */
            E = 'E'
          }
        `,
        code: dedent`
          enum Enum {
            D = 'D',
            E = 'E',
            /* eslint-disable */
            C = 'C',
            B = 'B',
            // Shouldn't move
            /* eslint-enable */
            A = 'A'
          }
        `,
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        options: [{}],
      })

      await invalid({
        output: dedent`
          enum Enum {
            B = 'B',
            C = 'C',
            // eslint-disable-next-line rule-to-test/sort-enums
            A = 'A'
          }
        `,
        code: dedent`
          enum Enum {
            C = 'C',
            B = 'B',
            // eslint-disable-next-line rule-to-test/sort-enums
            A = 'A'
          }
        `,
        errors: [
          {
            data: {
              right: 'B',
              left: 'C',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'B',
              left: 'C',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            B = 'B',
            C = 'C',
            A = 'A' // eslint-disable-line rule-to-test/sort-enums
          }
        `,
        code: dedent`
          enum Enum {
            C = 'C',
            B = 'B',
            A = 'A' // eslint-disable-line rule-to-test/sort-enums
          }
        `,
        options: [{}],
      })

      await invalid({
        output: dedent`
          enum Enum {
            B = 'B',
            C = 'C',
            /* eslint-disable-next-line rule-to-test/sort-enums */
            A = 'A'
          }
        `,
        code: dedent`
          enum Enum {
            C = 'C',
            B = 'B',
            /* eslint-disable-next-line rule-to-test/sort-enums */
            A = 'A'
          }
        `,
        errors: [
          {
            data: {
              right: 'B',
              left: 'C',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        options: [{}],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'B',
              left: 'C',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        output: dedent`
          enum Enum {
            B = 'B',
            C = 'C',
            A = 'A' /* eslint-disable-line rule-to-test/sort-enums */
          }
        `,
        code: dedent`
          enum Enum {
            C = 'C',
            B = 'B',
            A = 'A' /* eslint-disable-line rule-to-test/sort-enums */
          }
        `,
        options: [{}],
      })

      await invalid({
        output: dedent`
          enum Enum {
            A = 'A',
            D = 'D',
            /* eslint-disable rule-to-test/sort-enums */
            C = 'C',
            B = 'B',
            // Shouldn't move
            /* eslint-enable */
            E = 'E'
          }
        `,
        code: dedent`
          enum Enum {
            D = 'D',
            E = 'E',
            /* eslint-disable rule-to-test/sort-enums */
            C = 'C',
            B = 'B',
            // Shouldn't move
            /* eslint-enable */
            A = 'A'
          }
        `,
        errors: [
          {
            data: {
              right: 'A',
              left: 'B',
            },
            messageId: 'unexpectedEnumsOrder',
          },
        ],
        options: [{}],
      })
    })
  })
})
