import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-sets'

describe('sort-sets', () => {
  let { invalid, valid } = createRuleTester({
    parser: typescriptParser,
    name: 'sort-sets',
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('preserves set structure when fixing sort order', async () => {
      await valid({
        code: dedent`
          new Set([
            'a',
            'b',
            'c',
            'd',
            'e',
            ...other,
          ])
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'a',
            'b',
            'c',
            'd',
            'e',
            ...other,
          ])
        `,
        code: dedent`
          new Set([
            'a',
            'c',
            'b',
            'd',
            'e',
            ...other,
          ])
        `,
        options: [options],
      })
    })

    it('sorts spread elements in sets', async () => {
      await valid({
        code: dedent`
          new Set([
            ...aaa,
            ...bbbb,
            ...ccc,
          ])
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: '...bbbb',
              left: '...ccc',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            ...aaa,
            ...bbbb,
            ...ccc,
          ])
        `,
        code: dedent`
          new Set([
            ...aaa,
            ...ccc,
            ...bbbb,
          ])
        `,
        options: [options],
      })
    })

    it('handles sets with empty slots correctly', async () => {
      await valid({
        code: dedent`
          new Set(['a', 'b', 'c',, 'd'])
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
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set(['a', 'b', 'c',, 'd'])
        `,
        code: dedent`
          new Set(['b', 'a', 'c',, 'd'])
        `,
        options: [options],
      })
    })

    it('sorts elements in Set with Array constructor', async () => {
      await valid({
        code: dedent`
          new Set(new Array(
            'a',
            'b',
            'c',
            'd',
          ))
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set(new Array(
            'a',
            'b',
            'c',
            'd',
          ))
        `,
        code: dedent`
          new Set(new Array(
            'a',
            'c',
            'b',
            'd',
          ))
        `,
        options: [options],
      })
    })

    it('sorts elements within newline-separated groups independently', async () => {
      let partitionOptions = [
        {
          ...options,
          partitionByNewLine: true,
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'd',
            },
            messageId: 'unexpectedSetsOrder',
          },
          {
            data: {
              right: 'b',
              left: 'e',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'a',
            'd',

            'c',

            'b',
            'e',
          ])
        `,
        code: dedent`
          new Set([
            'd',
            'a',

            'c',

            'e',
            'b',
          ])
        `,
        options: partitionOptions,
      })
    })

    it('treats each newline-separated section as independent partition', async () => {
      let partitionWithGroupOptions = [
        {
          ...options,
          partitionByNewLine: true,
          groups: ['spread'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'spread',
              leftGroup: 'unknown',
              right: '...d',
              left: 'c',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
          {
            data: {
              rightGroup: 'spread',
              leftGroup: 'unknown',
              right: '...b',
              left: 'a',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        output: dedent`
          new Set([
            ...d,
            'c',

            ...b,
            'a',
          ])
        `,
        code: dedent`
          new Set([
            'c',
            ...d,

            'a',
            ...b,
          ])
        `,
        options: partitionWithGroupOptions,
      })
    })

    it('creates partitions based on matching comments', async () => {
      let partitionOptions = [
        {
          ...options,
          partitionByComment: '^Part',
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'bbb',
              left: 'd',
            },
            messageId: 'unexpectedSetsOrder',
          },
          {
            data: {
              right: 'fff',
              left: 'gg',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            // Part: A
            // Not partition comment
            'bbb',
            'cc',
            'd',
            // Part: B
            'aaaa',
            'e',
            // Part: C
            // Not partition comment
            'fff',
            'gg',
          ])
        `,
        code: dedent`
          new Set([
            // Part: A
            'cc',
            'd',
            // Not partition comment
            'bbb',
            // Part: B
            'aaaa',
            'e',
            // Part: C
            'gg',
            // Not partition comment
            'fff',
          ])
        `,
        options: partitionOptions,
      })
    })

    it('treats every comment as partition boundary when set to true', async () => {
      await valid({
        code: dedent`
          new Set([
            // Comment
            'bb',
            // Other comment
            'a',
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
      let multiplePatternOptions = [
        {
          ...options,
          partitionByComment: ['Partition Comment', 'Part:', 'Other'],
        },
      ]

      await invalid({
        output: dedent`
          new Set([
            /* Partition Comment */
            // Part: A
            'd',
            // Part: B
            'aaa',
            'bb',
            'c',
            /* Other */
            'e',
          ])
        `,
        code: dedent`
          new Set([
            /* Partition Comment */
            // Part: A
            'd',
            // Part: B
            'aaa',
            'c',
            'bb',
            /* Other */
            'e',
          ])
        `,
        errors: [
          {
            data: {
              right: 'bb',
              left: 'c',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        options: multiplePatternOptions,
      })
    })

    it('supports regex patterns for partition comments', async () => {
      await valid({
        code: dedent`
          new Set([
            'e',
            'f',
            // I am a partition comment because I don't have f o o
            'a',
            'b',
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

    it('ignores line comments when block comments are specified', async () => {
      let blockCommentsOnlyOptions = [
        {
          ...options,
          partitionByComment: {
            block: true,
          },
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            // Comment
            'a',
            'b'
          ])
        `,
        code: dedent`
          new Set([
            'b',
            // Comment
            'a'
          ])
        `,
        options: blockCommentsOnlyOptions,
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
          new Set([
            'b',
            /* Comment */
            'a'
          ])
        `,
      })
    })

    it('matches specific block comment patterns', async () => {
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
          new Set([
            'c',
            /* b */
            'b',
            /* a */
            'a'
          ])
        `,
      })
    })

    it('supports regex patterns for block comments', async () => {
      await valid({
        code: dedent`
          new Set([
            'b',
            /* I am a partition comment because I don't have f o o */
            'a'
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
          new Set([
            '$a',
            'b',
            '$c',
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
          new Set([
            'ab',
            'a$c',
          ])
        `,
      })
    })

    it('sorts elements according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          new Set([
            '你好',
            '世界',
            'a',
            'A',
            'b',
            'B',
          ])
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts single-line sets correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            a, b
          ])
        `,
        code: dedent`
          new Set([
            b, a
          ])
        `,
        options: [options],
      })
    })

    it('handles trailing commas in single-line sets', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            a, b,
          ])
        `,
        code: dedent`
          new Set([
            b, a,
          ])
        `,
        options: [options],
      })
    })

    it('enforces custom group ordering', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'spread',
              leftGroup: 'literal',
              right: '...b',
              left: 'c',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['spread', 'literal'],
          },
        ],
        output: dedent`
          new Set([
            ...b,
            'a',
            'c'
          ])
        `,
        code: dedent`
          new Set([
            'c',
            ...b,
            'a'
          ])
        `,
      })
    })

    it('applies custom groups based on element selectors', async () => {
      let customGroupOptions = [
        {
          customGroups: [
            {
              groupName: 'literalElements',
              selector: 'literal',
            },
          ],
          groups: ['literalElements', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'literalElements',
              leftGroup: 'unknown',
              left: '...b',
              right: 'a',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        output: dedent`
          new Set([
            'a',
            ...b,
          ])
        `,
        code: dedent`
          new Set([
            ...b,
            'a',
          ])
        `,
        options: customGroupOptions,
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
        let customGroupOptions = [
          {
            customGroups: [
              {
                groupName: 'literalsStartingWithHello',
                selector: 'literal',
                elementNamePattern,
              },
            ],
            groups: ['literalsStartingWithHello', 'unknown'],
          },
        ]

        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'literalsStartingWithHello',
                right: 'helloLiteral',
                leftGroup: 'unknown',
                left: 'b',
              },
              messageId: 'unexpectedSetsGroupOrder',
            },
          ],
          output: dedent`
            new Set([
              'helloLiteral',
              'a',
              'b',
            ])
          `,
          code: dedent`
            new Set([
              'a',
              'b',
              'helloLiteral',
            ])
          `,
          options: customGroupOptions,
        })
      },
    )

    it('overrides sort type and order for specific groups', async () => {
      let customSortOptions = [
        {
          customGroups: [
            {
              groupName: 'reversedLiteralsByLineLength',
              selector: 'literal',
              type: 'line-length',
              order: 'desc',
            },
          ],
          groups: ['reversedLiteralsByLineLength', 'unknown'],
          type: 'alphabetical',
          order: 'asc',
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedSetsOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedSetsOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedSetsOrder',
          },
          {
            data: {
              rightGroup: 'reversedLiteralsByLineLength',
              leftGroup: 'unknown',
              left: '...m',
              right: 'eee',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        output: dedent`
          new Set([
            'dddd',
            'ccc',
            'eee',
            'bb',
            'ff',
            'a',
            'g',
            ...m,
            ...o,
            ...p,
          ])
        `,
        code: dedent`
          new Set([
            'a',
            'bb',
            'ccc',
            'dddd',
            ...m,
            'eee',
            'ff',
            'g',
            ...o,
            ...p,
          ])
        `,
        options: customSortOptions,
      })
    })

    it('applies fallback sort when primary sort results in tie', async () => {
      let fallbackSortOptions = [
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
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'fooBar',
              left: 'fooZar',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'fooBar',
            'fooZar',
          ])
        `,
        code: dedent`
          new Set([
            'fooZar',
            'fooBar',
          ])
        `,
        options: fallbackSortOptions,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      let unsortedGroupOptions = [
        {
          customGroups: [
            {
              groupName: 'unsortedLiterals',
              selector: 'literal',
              type: 'unsorted',
            },
          ],
          groups: ['unsortedLiterals', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'unsortedLiterals',
              leftGroup: 'unknown',
              left: '...m',
              right: 'c',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        output: dedent`
          new Set([
            'b',
            'a',
            'd',
            'e',
            'c',
            ...m,
          ])
        `,
        code: dedent`
          new Set([
            'b',
            'a',
            'd',
            'e',
            ...m,
            'c',
          ])
        `,
        options: unsortedGroupOptions,
      })
    })

    it('combines multiple selectors with anyOf', async () => {
      let anyOfOptions = [
        {
          customGroups: [
            {
              anyOf: [
                {
                  elementNamePattern: 'foo|Foo',
                  selector: 'literal',
                },
                {
                  elementNamePattern: 'foo|Foo',
                  selector: 'spread',
                },
              ],
              groupName: 'elementsIncludingFoo',
            },
          ],
          groups: ['elementsIncludingFoo', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'elementsIncludingFoo',
              leftGroup: 'unknown',
              right: '...foo',
              left: 'a',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        output: dedent`
          new Set([
            '...foo',
            'cFoo',
            'a',
          ])
        `,
        code: dedent`
          new Set([
            'a',
            '...foo',
            'cFoo',
          ])
        `,
        options: anyOfOptions,
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
          new Set([
            'iHaveFooInMyName',
            'meTooIHaveFoo',
            'a',
            'b',
          ])
        `,
      })
    })

    it.each([
      ['string pattern', 'foo'],
      ['array of patterns', ['noMatch', 'foo']],
      ['case-insensitive regex', { pattern: 'FOO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'foo', flags: 'i' }]],
    ])(
      'applies configuration when all names match pattern - %s',
      async (_, allNamesMatchPattern) => {
        let conditionalOptions = [
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
        ]

        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'g',
                leftGroup: 'b',
                right: 'g',
                left: 'b',
              },
              messageId: 'unexpectedSetsGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedSetsGroupOrder',
            },
          ],
          output: dedent`
            new Set([
              'r',
              'g',
              'b',
            ])
          `,
          code: dedent`
            new Set([
              'b',
              'g',
              'r',
            ])
          `,
          options: conditionalOptions,
        })
      },
    )

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'removes newlines between groups when newlinesBetween is %s',
      async (_description, newlinesBetween) => {
        let newlinesOptions = [
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
        ]

        await invalid({
          errors: [
            {
              data: {
                right: 'y',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenSetsMembers',
            },
            {
              data: {
                right: 'b',
                left: 'z',
              },
              messageId: 'unexpectedSetsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'z',
              },
              messageId: 'extraSpacingBetweenSetsMembers',
            },
          ],
          code: dedent`
            new Set([
              'a',


             'y',
            'z',

                'b'
            ])
          `,
          output: dedent`
            new Set([
              'a',
             'b',
            'y',
                'z'
            ])
          `,
          options: newlinesOptions,
        })
      },
    )

    it('applies inline newline settings between specific groups', async () => {
      let inlineNewlineOptions = [
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
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenSetsMembers',
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: 'extraSpacingBetweenSetsMembers',
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: 'extraSpacingBetweenSetsMembers',
          },
        ],
        output: dedent`
          new Set([
            'a',

            'b',

            'c',
            'd',


            'e'
          ])
        `,
        code: dedent`
          new Set([
            'a',
            'b',


            'c',

            'd',


            'e'
          ])
        `,
        options: inlineNewlineOptions,
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
        let mixedNewlineOptions = [
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
        ]

        await invalid({
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'missedSpacingBetweenSetsMembers',
            },
          ],
          output: dedent`
            new Set([
              a,


              b,
            ])
          `,
          code: dedent`
            new Set([
              a,
              b,
            ])
          `,
          options: mixedNewlineOptions,
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
        let neverBetweenGroupsOptions = [
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
        ]

        await invalid({
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenSetsMembers',
            },
          ],
          output: dedent`
            new Set([
              a,
              b,
            ])
          `,
          code: dedent`
            new Set([
              a,

              b,
            ])
          `,
          options: neverBetweenGroupsOptions,
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
        let ignoreNewlineOptions = [
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
        ]

        await valid({
          code: dedent`
            new Set([
              a,

              b,
            ])
          `,
          options: ignoreNewlineOptions,
        })

        await valid({
          code: dedent`
            new Set([
              a,
              b,
            ])
          `,
          options: ignoreNewlineOptions,
        })
      },
    )

    it('preserves inline comments when reordering elements', async () => {
      let commentOptions = [
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
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'unknown',
              leftGroup: 'b|c',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],

        output: dedent`
          new Set([
            'a', // Comment after

            'b',
            'c'
          ])
        `,
        code: dedent`
          new Set([
            'b',
            'a', // Comment after

            'c'
          ])
        `,
        options: commentOptions,
      })
    })

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'preserves partition boundaries regardless of newlinesBetween %s',
      async (_description, newlinesBetween) => {
        let partitionOptions = [
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
        ]

        await invalid({
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              'a',

              // Partition comment

              'b',
              'c',
            ])
          `,
          code: dedent`
            new Set([
              'a',

              // Partition comment

              'c',
              'b',
            ])
          `,
          options: partitionOptions,
        })
      },
    )
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('preserves set structure when fixing sort order', async () => {
      await valid({
        code: dedent`
          new Set([
            'a',
            'b',
            'c',
            'd',
            'e',
            ...other,
          ])
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'a',
            'b',
            'c',
            'd',
            'e',
            ...other,
          ])
        `,
        code: dedent`
          new Set([
            'a',
            'c',
            'b',
            'd',
            'e',
            ...other,
          ])
        `,
        options: [options],
      })
    })

    it('sorts spread elements in sets', async () => {
      await valid({
        code: dedent`
          new Set([
            ...aaa,
            ...bbbb,
            ...ccc,
          ])
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: '...bbbb',
              left: '...ccc',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            ...aaa,
            ...bbbb,
            ...ccc,
          ])
        `,
        code: dedent`
          new Set([
            ...aaa,
            ...ccc,
            ...bbbb,
          ])
        `,
        options: [options],
      })
    })

    it('handles sets with empty slots correctly', async () => {
      await valid({
        code: dedent`
          new Set(['a', 'b', 'c',, 'd'])
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
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set(['a', 'b', 'c',, 'd'])
        `,
        code: dedent`
          new Set(['b', 'a', 'c',, 'd'])
        `,
        options: [options],
      })
    })

    it('sorts elements in Set with Array constructor', async () => {
      await valid({
        code: dedent`
          new Set(new Array(
            'a',
            'b',
            'c',
            'd',
          ))
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set(new Array(
            'a',
            'b',
            'c',
            'd',
          ))
        `,
        code: dedent`
          new Set(new Array(
            'a',
            'c',
            'b',
            'd',
          ))
        `,
        options: [options],
      })
    })

    it('sorts elements within newline-separated groups independently', async () => {
      let partitionOptions = [
        {
          ...options,
          partitionByNewLine: true,
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'd',
            },
            messageId: 'unexpectedSetsOrder',
          },
          {
            data: {
              right: 'b',
              left: 'e',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'a',
            'd',

            'c',

            'b',
            'e',
          ])
        `,
        code: dedent`
          new Set([
            'd',
            'a',

            'c',

            'e',
            'b',
          ])
        `,
        options: partitionOptions,
      })
    })

    it('treats each newline-separated section as independent partition', async () => {
      let partitionWithGroupOptions = [
        {
          ...options,
          partitionByNewLine: true,
          groups: ['spread'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'spread',
              leftGroup: 'unknown',
              right: '...d',
              left: 'c',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
          {
            data: {
              rightGroup: 'spread',
              leftGroup: 'unknown',
              right: '...b',
              left: 'a',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        output: dedent`
          new Set([
            ...d,
            'c',

            ...b,
            'a',
          ])
        `,
        code: dedent`
          new Set([
            'c',
            ...d,

            'a',
            ...b,
          ])
        `,
        options: partitionWithGroupOptions,
      })
    })

    it('creates partitions based on matching comments', async () => {
      let partitionOptions = [
        {
          ...options,
          partitionByComment: '^Part',
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'bbb',
              left: 'd',
            },
            messageId: 'unexpectedSetsOrder',
          },
          {
            data: {
              right: 'fff',
              left: 'gg',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            // Part: A
            // Not partition comment
            'bbb',
            'cc',
            'd',
            // Part: B
            'aaaa',
            'e',
            // Part: C
            // Not partition comment
            'fff',
            'gg',
          ])
        `,
        code: dedent`
          new Set([
            // Part: A
            'cc',
            'd',
            // Not partition comment
            'bbb',
            // Part: B
            'aaaa',
            'e',
            // Part: C
            'gg',
            // Not partition comment
            'fff',
          ])
        `,
        options: partitionOptions,
      })
    })

    it('treats every comment as partition boundary when set to true', async () => {
      await valid({
        code: dedent`
          new Set([
            // Comment
            'bb',
            // Other comment
            'a',
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
      let multiplePatternOptions = [
        {
          ...options,
          partitionByComment: ['Partition Comment', 'Part:', 'Other'],
        },
      ]

      await invalid({
        output: dedent`
          new Set([
            /* Partition Comment */
            // Part: A
            'd',
            // Part: B
            'aaa',
            'bb',
            'c',
            /* Other */
            'e',
          ])
        `,
        code: dedent`
          new Set([
            /* Partition Comment */
            // Part: A
            'd',
            // Part: B
            'aaa',
            'c',
            'bb',
            /* Other */
            'e',
          ])
        `,
        errors: [
          {
            data: {
              right: 'bb',
              left: 'c',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        options: multiplePatternOptions,
      })
    })

    it('supports regex patterns for partition comments', async () => {
      await valid({
        code: dedent`
          new Set([
            'e',
            'f',
            // I am a partition comment because I don't have f o o
            'a',
            'b',
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

    it('ignores line comments when block comments are specified', async () => {
      let blockCommentsOnlyOptions = [
        {
          ...options,
          partitionByComment: {
            block: true,
          },
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            // Comment
            'a',
            'b'
          ])
        `,
        code: dedent`
          new Set([
            'b',
            // Comment
            'a'
          ])
        `,
        options: blockCommentsOnlyOptions,
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
          new Set([
            'b',
            /* Comment */
            'a'
          ])
        `,
      })
    })

    it('matches specific block comment patterns', async () => {
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
          new Set([
            'c',
            /* b */
            'b',
            /* a */
            'a'
          ])
        `,
      })
    })

    it('supports regex patterns for block comments', async () => {
      await valid({
        code: dedent`
          new Set([
            'b',
            /* I am a partition comment because I don't have f o o */
            'a'
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
          new Set([
            '$a',
            'b',
            '$c',
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
          new Set([
            'ab',
            'a$c',
          ])
        `,
      })
    })

    it('sorts elements according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          new Set([
            '你好',
            '世界',
            'a',
            'A',
            'b',
            'B',
          ])
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts single-line sets correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            a, b
          ])
        `,
        code: dedent`
          new Set([
            b, a
          ])
        `,
        options: [options],
      })
    })

    it('handles trailing commas in single-line sets', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            a, b,
          ])
        `,
        code: dedent`
          new Set([
            b, a,
          ])
        `,
        options: [options],
      })
    })

    it('enforces custom group ordering', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'spread',
              leftGroup: 'literal',
              right: '...b',
              left: 'c',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['spread', 'literal'],
          },
        ],
        output: dedent`
          new Set([
            ...b,
            'a',
            'c'
          ])
        `,
        code: dedent`
          new Set([
            'c',
            ...b,
            'a'
          ])
        `,
      })
    })

    it('applies custom groups based on element selectors', async () => {
      let customGroupOptions = [
        {
          customGroups: [
            {
              groupName: 'literalElements',
              selector: 'literal',
            },
          ],
          groups: ['literalElements', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'literalElements',
              leftGroup: 'unknown',
              left: '...b',
              right: 'a',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        output: dedent`
          new Set([
            'a',
            ...b,
          ])
        `,
        code: dedent`
          new Set([
            ...b,
            'a',
          ])
        `,
        options: customGroupOptions,
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
        let customGroupOptions = [
          {
            customGroups: [
              {
                groupName: 'literalsStartingWithHello',
                selector: 'literal',
                elementNamePattern,
              },
            ],
            groups: ['literalsStartingWithHello', 'unknown'],
          },
        ]

        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'literalsStartingWithHello',
                right: 'helloLiteral',
                leftGroup: 'unknown',
                left: 'b',
              },
              messageId: 'unexpectedSetsGroupOrder',
            },
          ],
          output: dedent`
            new Set([
              'helloLiteral',
              'a',
              'b',
            ])
          `,
          code: dedent`
            new Set([
              'a',
              'b',
              'helloLiteral',
            ])
          `,
          options: customGroupOptions,
        })
      },
    )

    it('overrides sort type and order for specific groups', async () => {
      let customSortOptions = [
        {
          customGroups: [
            {
              groupName: 'reversedLiteralsByLineLength',
              selector: 'literal',
              type: 'line-length',
              order: 'desc',
            },
          ],
          groups: ['reversedLiteralsByLineLength', 'unknown'],
          type: 'alphabetical',
          order: 'asc',
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedSetsOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedSetsOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedSetsOrder',
          },
          {
            data: {
              rightGroup: 'reversedLiteralsByLineLength',
              leftGroup: 'unknown',
              left: '...m',
              right: 'eee',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        output: dedent`
          new Set([
            'dddd',
            'ccc',
            'eee',
            'bb',
            'ff',
            'a',
            'g',
            ...m,
            ...o,
            ...p,
          ])
        `,
        code: dedent`
          new Set([
            'a',
            'bb',
            'ccc',
            'dddd',
            ...m,
            'eee',
            'ff',
            'g',
            ...o,
            ...p,
          ])
        `,
        options: customSortOptions,
      })
    })

    it('applies fallback sort when primary sort results in tie', async () => {
      let fallbackSortOptions = [
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
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'fooBar',
              left: 'fooZar',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'fooBar',
            'fooZar',
          ])
        `,
        code: dedent`
          new Set([
            'fooZar',
            'fooBar',
          ])
        `,
        options: fallbackSortOptions,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      let unsortedGroupOptions = [
        {
          customGroups: [
            {
              groupName: 'unsortedLiterals',
              selector: 'literal',
              type: 'unsorted',
            },
          ],
          groups: ['unsortedLiterals', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'unsortedLiterals',
              leftGroup: 'unknown',
              left: '...m',
              right: 'c',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        output: dedent`
          new Set([
            'b',
            'a',
            'd',
            'e',
            'c',
            ...m,
          ])
        `,
        code: dedent`
          new Set([
            'b',
            'a',
            'd',
            'e',
            ...m,
            'c',
          ])
        `,
        options: unsortedGroupOptions,
      })
    })

    it('combines multiple selectors with anyOf', async () => {
      let anyOfOptions = [
        {
          customGroups: [
            {
              anyOf: [
                {
                  elementNamePattern: 'foo|Foo',
                  selector: 'literal',
                },
                {
                  elementNamePattern: 'foo|Foo',
                  selector: 'spread',
                },
              ],
              groupName: 'elementsIncludingFoo',
            },
          ],
          groups: ['elementsIncludingFoo', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'elementsIncludingFoo',
              leftGroup: 'unknown',
              right: '...foo',
              left: 'a',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        output: dedent`
          new Set([
            '...foo',
            'cFoo',
            'a',
          ])
        `,
        code: dedent`
          new Set([
            'a',
            '...foo',
            'cFoo',
          ])
        `,
        options: anyOfOptions,
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
          new Set([
            'iHaveFooInMyName',
            'meTooIHaveFoo',
            'a',
            'b',
          ])
        `,
      })
    })

    it.each([
      ['string pattern', 'foo'],
      ['array of patterns', ['noMatch', 'foo']],
      ['case-insensitive regex', { pattern: 'FOO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'foo', flags: 'i' }]],
    ])(
      'applies configuration when all names match pattern - %s',
      async (_, allNamesMatchPattern) => {
        let conditionalOptions = [
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
        ]

        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'g',
                leftGroup: 'b',
                right: 'g',
                left: 'b',
              },
              messageId: 'unexpectedSetsGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedSetsGroupOrder',
            },
          ],
          output: dedent`
            new Set([
              'r',
              'g',
              'b',
            ])
          `,
          code: dedent`
            new Set([
              'b',
              'g',
              'r',
            ])
          `,
          options: conditionalOptions,
        })
      },
    )

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'removes newlines between groups when newlinesBetween is %s',
      async (_description, newlinesBetween) => {
        let newlinesOptions = [
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
        ]

        await invalid({
          errors: [
            {
              data: {
                right: 'y',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenSetsMembers',
            },
            {
              data: {
                right: 'b',
                left: 'z',
              },
              messageId: 'unexpectedSetsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'z',
              },
              messageId: 'extraSpacingBetweenSetsMembers',
            },
          ],
          code: dedent`
            new Set([
              'a',


             'y',
            'z',

                'b'
            ])
          `,
          output: dedent`
            new Set([
              'a',
             'b',
            'y',
                'z'
            ])
          `,
          options: newlinesOptions,
        })
      },
    )

    it('applies inline newline settings between specific groups', async () => {
      let inlineNewlineOptions = [
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
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenSetsMembers',
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: 'extraSpacingBetweenSetsMembers',
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: 'extraSpacingBetweenSetsMembers',
          },
        ],
        output: dedent`
          new Set([
            'a',

            'b',

            'c',
            'd',


            'e'
          ])
        `,
        code: dedent`
          new Set([
            'a',
            'b',


            'c',

            'd',


            'e'
          ])
        `,
        options: inlineNewlineOptions,
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
        let mixedNewlineOptions = [
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
        ]

        await invalid({
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'missedSpacingBetweenSetsMembers',
            },
          ],
          output: dedent`
            new Set([
              a,


              b,
            ])
          `,
          code: dedent`
            new Set([
              a,
              b,
            ])
          `,
          options: mixedNewlineOptions,
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
        let neverBetweenGroupsOptions = [
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
        ]

        await invalid({
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenSetsMembers',
            },
          ],
          output: dedent`
            new Set([
              a,
              b,
            ])
          `,
          code: dedent`
            new Set([
              a,

              b,
            ])
          `,
          options: neverBetweenGroupsOptions,
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
        let ignoreNewlineOptions = [
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
        ]

        await valid({
          code: dedent`
            new Set([
              a,

              b,
            ])
          `,
          options: ignoreNewlineOptions,
        })

        await valid({
          code: dedent`
            new Set([
              a,
              b,
            ])
          `,
          options: ignoreNewlineOptions,
        })
      },
    )

    it('preserves inline comments when reordering elements', async () => {
      let commentOptions = [
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
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'unknown',
              leftGroup: 'b|c',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],

        output: dedent`
          new Set([
            'a', // Comment after

            'b',
            'c'
          ])
        `,
        code: dedent`
          new Set([
            'b',
            'a', // Comment after

            'c'
          ])
        `,
        options: commentOptions,
      })
    })

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'preserves partition boundaries regardless of newlinesBetween %s',
      async (_description, newlinesBetween) => {
        let partitionOptions = [
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
        ]

        await invalid({
          errors: [
            {
              data: {
                right: 'b',
                left: 'c',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              'a',

              // Partition comment

              'b',
              'c',
            ])
          `,
          code: dedent`
            new Set([
              'a',

              // Partition comment

              'c',
              'b',
            ])
          `,
          options: partitionOptions,
        })
      },
    )
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('preserves set structure when fixing sort order', async () => {
      await valid({
        code: dedent`
          new Set([
            'aaaaa',
            'bbbb',
            'ccc',
            'dd',
            'e',
            ...other,
          ])
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'bbbb',
              left: 'ccc',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'aaaaa',
            'bbbb',
            'ccc',
            'dd',
            'e',
            ...other,
          ])
        `,
        code: dedent`
          new Set([
            'aaaaa',
            'ccc',
            'bbbb',
            'dd',
            'e',
            ...other,
          ])
        `,
        options: [options],
      })
    })

    it('sorts spread elements in sets', async () => {
      await valid({
        code: dedent`
          new Set([
            ...aaa,
            ...bb,
            ...c,
          ])
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: '...bb',
              left: '...c',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            ...aaa,
            ...bb,
            ...c,
          ])
        `,
        code: dedent`
          new Set([
            ...aaa,
            ...c,
            ...bb,
          ])
        `,
        options: [options],
      })
    })

    it('handles sets with empty slots correctly', async () => {
      await valid({
        code: dedent`
          new Set(['aaaa', 'bbb', 'cc',, 'd'])
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'aaaa',
              left: 'bbb',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set(['aaaa', 'bbb', 'cc',, 'd'])
        `,
        code: dedent`
          new Set(['bbb', 'aaaa', 'cc',, 'd'])
        `,
        options: [options],
      })
    })

    it('sorts elements in Set with Array constructor', async () => {
      await valid({
        code: dedent`
          new Set(new Array(
            'aaaa',
            'bbb',
            'cc',
            'd',
          ))
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
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set(new Array(
            'aaaa',
            'bbb',
            'cc',
            'd',
          ))
        `,
        code: dedent`
          new Set(new Array(
            'aaaa',
            'cc',
            'bbb',
            'd',
          ))
        `,
        options: [options],
      })
    })

    it('sorts elements within newline-separated groups independently', async () => {
      let partitionOptions = [
        {
          ...options,
          partitionByNewLine: true,
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'aaaaa',
              left: 'dd',
            },
            messageId: 'unexpectedSetsOrder',
          },
          {
            data: {
              right: 'bbbb',
              left: 'e',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'aaaaa',
            'dd',

            'ccc',

            'bbbb',
            'e',
          ])
        `,
        code: dedent`
          new Set([
            'dd',
            'aaaaa',

            'ccc',

            'e',
            'bbbb',
          ])
        `,
        options: partitionOptions,
      })
    })

    it('treats each newline-separated section as independent partition', async () => {
      let partitionWithGroupOptions = [
        {
          ...options,
          partitionByNewLine: true,
          groups: ['spread'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'spread',
              leftGroup: 'unknown',
              right: '...d',
              left: 'c',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
          {
            data: {
              rightGroup: 'spread',
              leftGroup: 'unknown',
              right: '...b',
              left: 'a',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        output: dedent`
          new Set([
            ...d,
            'c',

            ...b,
            'a',
          ])
        `,
        code: dedent`
          new Set([
            'c',
            ...d,

            'a',
            ...b,
          ])
        `,
        options: partitionWithGroupOptions,
      })
    })

    it('creates partitions based on matching comments', async () => {
      let partitionOptions = [
        {
          ...options,
          partitionByComment: '^Part',
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'bbb',
              left: 'd',
            },
            messageId: 'unexpectedSetsOrder',
          },
          {
            data: {
              right: 'fff',
              left: 'gg',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            // Part: A
            // Not partition comment
            'bbb',
            'cc',
            'd',
            // Part: B
            'aaaa',
            'e',
            // Part: C
            // Not partition comment
            'fff',
            'gg',
          ])
        `,
        code: dedent`
          new Set([
            // Part: A
            'cc',
            'd',
            // Not partition comment
            'bbb',
            // Part: B
            'aaaa',
            'e',
            // Part: C
            'gg',
            // Not partition comment
            'fff',
          ])
        `,
        options: partitionOptions,
      })
    })

    it('treats every comment as partition boundary when set to true', async () => {
      await valid({
        code: dedent`
          new Set([
            // Comment
            'bb',
            // Other comment
            'a',
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
      let multiplePatternOptions = [
        {
          ...options,
          partitionByComment: ['Partition Comment', 'Part:', 'Other'],
        },
      ]

      await invalid({
        output: dedent`
          new Set([
            /* Partition Comment */
            // Part: A
            'd',
            // Part: B
            'aaa',
            'bb',
            'c',
            /* Other */
            'e',
          ])
        `,
        code: dedent`
          new Set([
            /* Partition Comment */
            // Part: A
            'd',
            // Part: B
            'aaa',
            'c',
            'bb',
            /* Other */
            'e',
          ])
        `,
        errors: [
          {
            data: {
              right: 'bb',
              left: 'c',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        options: multiplePatternOptions,
      })
    })

    it('supports regex patterns for partition comments', async () => {
      await valid({
        code: dedent`
          new Set([
            'e',
            'f',
            // I am a partition comment because I don't have f o o
            'a',
            'b',
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

    it('ignores line comments when block comments are specified', async () => {
      let blockCommentsOnlyOptions = [
        {
          ...options,
          partitionByComment: {
            block: true,
          },
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            // Comment
            'aa',
            'b'
          ])
        `,
        code: dedent`
          new Set([
            'b',
            // Comment
            'aa'
          ])
        `,
        options: blockCommentsOnlyOptions,
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
          new Set([
            'b',
            /* Comment */
            'a'
          ])
        `,
      })
    })

    it('matches specific block comment patterns', async () => {
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
          new Set([
            'c',
            /* b */
            'b',
            /* a */
            'a'
          ])
        `,
      })
    })

    it('supports regex patterns for block comments', async () => {
      await valid({
        code: dedent`
          new Set([
            'b',
            /* I am a partition comment because I don't have f o o */
            'a'
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
          new Set([
            '$a',
            'bb',
            '$c',
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
          new Set([
            'abc',
            'a$c',
          ])
        `,
      })
    })

    it('sorts elements according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          new Set([
            '你好',
            '世界',
            'a',
            'A',
            'b',
            'B',
          ])
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts single-line sets correctly', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            aa, b
          ])
        `,
        code: dedent`
          new Set([
            b, aa
          ])
        `,
        options: [options],
      })
    })

    it('handles trailing commas in single-line sets', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'aa',
              left: 'b',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            aa, b,
          ])
        `,
        code: dedent`
          new Set([
            b, aa,
          ])
        `,
        options: [options],
      })
    })

    it('enforces custom group ordering', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'spread',
              leftGroup: 'literal',
              right: '...b',
              left: 'c',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            groups: ['spread', 'literal'],
          },
        ],
        output: dedent`
          new Set([
            ...b,
            'c',
            'a'
          ])
        `,
        code: dedent`
          new Set([
            'c',
            ...b,
            'a'
          ])
        `,
      })
    })

    it('applies custom groups based on element selectors', async () => {
      let customGroupOptions = [
        {
          customGroups: [
            {
              groupName: 'literalElements',
              selector: 'literal',
            },
          ],
          groups: ['literalElements', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'literalElements',
              leftGroup: 'unknown',
              left: '...b',
              right: 'a',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        output: dedent`
          new Set([
            'a',
            ...b,
          ])
        `,
        code: dedent`
          new Set([
            ...b,
            'a',
          ])
        `,
        options: customGroupOptions,
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
        let customGroupOptions = [
          {
            customGroups: [
              {
                groupName: 'literalsStartingWithHello',
                selector: 'literal',
                elementNamePattern,
              },
            ],
            groups: ['literalsStartingWithHello', 'unknown'],
          },
        ]

        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'literalsStartingWithHello',
                right: 'helloLiteral',
                leftGroup: 'unknown',
                left: 'b',
              },
              messageId: 'unexpectedSetsGroupOrder',
            },
          ],
          output: dedent`
            new Set([
              'helloLiteral',
              'a',
              'b',
            ])
          `,
          code: dedent`
            new Set([
              'a',
              'b',
              'helloLiteral',
            ])
          `,
          options: customGroupOptions,
        })
      },
    )

    it('overrides sort type and order for specific groups', async () => {
      let customSortOptions = [
        {
          customGroups: [
            {
              groupName: 'reversedLiteralsByLineLength',
              selector: 'literal',
              type: 'line-length',
              order: 'desc',
            },
          ],
          groups: ['reversedLiteralsByLineLength', 'unknown'],
          type: 'alphabetical',
          order: 'asc',
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedSetsOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedSetsOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedSetsOrder',
          },
          {
            data: {
              rightGroup: 'reversedLiteralsByLineLength',
              leftGroup: 'unknown',
              left: '...m',
              right: 'eee',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        output: dedent`
          new Set([
            'dddd',
            'ccc',
            'eee',
            'bb',
            'ff',
            'a',
            'g',
            ...m,
            ...o,
            ...p,
          ])
        `,
        code: dedent`
          new Set([
            'a',
            'bb',
            'ccc',
            'dddd',
            ...m,
            'eee',
            'ff',
            'g',
            ...o,
            ...p,
          ])
        `,
        options: customSortOptions,
      })
    })

    it('applies fallback sort when primary sort results in tie', async () => {
      let fallbackSortOptions = [
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
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'fooBar',
              left: 'fooZar',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'fooBar',
            'fooZar',
          ])
        `,
        code: dedent`
          new Set([
            'fooZar',
            'fooBar',
          ])
        `,
        options: fallbackSortOptions,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      let unsortedGroupOptions = [
        {
          customGroups: [
            {
              groupName: 'unsortedLiterals',
              selector: 'literal',
              type: 'unsorted',
            },
          ],
          groups: ['unsortedLiterals', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'unsortedLiterals',
              leftGroup: 'unknown',
              left: '...m',
              right: 'c',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        output: dedent`
          new Set([
            'b',
            'a',
            'd',
            'e',
            'c',
            ...m,
          ])
        `,
        code: dedent`
          new Set([
            'b',
            'a',
            'd',
            'e',
            ...m,
            'c',
          ])
        `,
        options: unsortedGroupOptions,
      })
    })

    it('combines multiple selectors with anyOf', async () => {
      let anyOfOptions = [
        {
          customGroups: [
            {
              anyOf: [
                {
                  elementNamePattern: 'foo|Foo',
                  selector: 'literal',
                },
                {
                  elementNamePattern: 'foo|Foo',
                  selector: 'spread',
                },
              ],
              groupName: 'elementsIncludingFoo',
            },
          ],
          groups: ['elementsIncludingFoo', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'elementsIncludingFoo',
              leftGroup: 'unknown',
              right: '...foo',
              left: 'a',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        output: dedent`
          new Set([
            '...foo',
            'cFoo',
            'a',
          ])
        `,
        code: dedent`
          new Set([
            'a',
            '...foo',
            'cFoo',
          ])
        `,
        options: anyOfOptions,
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
          new Set([
            'iHaveFooInMyName',
            'meTooIHaveFoo',
            'a',
            'b',
          ])
        `,
      })
    })

    it.each([
      ['string pattern', 'foo'],
      ['array of patterns', ['noMatch', 'foo']],
      ['case-insensitive regex', { pattern: 'FOO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'foo', flags: 'i' }]],
    ])(
      'applies configuration when all names match pattern - %s',
      async (_, allNamesMatchPattern) => {
        let conditionalOptions = [
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
        ]

        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'g',
                leftGroup: 'b',
                right: 'g',
                left: 'b',
              },
              messageId: 'unexpectedSetsGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedSetsGroupOrder',
            },
          ],
          output: dedent`
            new Set([
              'r',
              'g',
              'b',
            ])
          `,
          code: dedent`
            new Set([
              'b',
              'g',
              'r',
            ])
          `,
          options: conditionalOptions,
        })
      },
    )

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'removes newlines between groups when newlinesBetween is %s',
      async (_description, newlinesBetween) => {
        let newlinesOptions = [
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
        ]

        await invalid({
          errors: [
            {
              data: {
                left: 'aaaa',
                right: 'yy',
              },
              messageId: 'extraSpacingBetweenSetsMembers',
            },
            {
              data: {
                right: 'bbb',
                left: 'z',
              },
              messageId: 'unexpectedSetsOrder',
            },
            {
              data: {
                right: 'bbb',
                left: 'z',
              },
              messageId: 'extraSpacingBetweenSetsMembers',
            },
          ],
          code: dedent`
            new Set([
              'aaaa',


             'yy',
            'z',

                'bbb'
            ])
          `,
          output: dedent`
            new Set([
              'aaaa',
             'bbb',
            'yy',
                'z'
            ])
          `,
          options: newlinesOptions,
        })
      },
    )

    it('applies inline newline settings between specific groups', async () => {
      let inlineNewlineOptions = [
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
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenSetsMembers',
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: 'extraSpacingBetweenSetsMembers',
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: 'extraSpacingBetweenSetsMembers',
          },
        ],
        output: dedent`
          new Set([
            'a',

            'b',

            'c',
            'd',


            'e'
          ])
        `,
        code: dedent`
          new Set([
            'a',
            'b',


            'c',

            'd',


            'e'
          ])
        `,
        options: inlineNewlineOptions,
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
        let mixedNewlineOptions = [
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
        ]

        await invalid({
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'missedSpacingBetweenSetsMembers',
            },
          ],
          output: dedent`
            new Set([
              a,


              b,
            ])
          `,
          code: dedent`
            new Set([
              a,
              b,
            ])
          `,
          options: mixedNewlineOptions,
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
        let neverBetweenGroupsOptions = [
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
        ]

        await invalid({
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenSetsMembers',
            },
          ],
          output: dedent`
            new Set([
              a,
              b,
            ])
          `,
          code: dedent`
            new Set([
              a,

              b,
            ])
          `,
          options: neverBetweenGroupsOptions,
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
        let ignoreNewlineOptions = [
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
        ]

        await valid({
          code: dedent`
            new Set([
              a,

              b,
            ])
          `,
          options: ignoreNewlineOptions,
        })

        await valid({
          code: dedent`
            new Set([
              a,
              b,
            ])
          `,
          options: ignoreNewlineOptions,
        })
      },
    )

    it('preserves inline comments when reordering elements', async () => {
      let commentOptions = [
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
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'unknown',
              leftGroup: 'b|c',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],

        output: dedent`
          new Set([
            'a', // Comment after

            'b',
            'c'
          ])
        `,
        code: dedent`
          new Set([
            'b',
            'a', // Comment after

            'c'
          ])
        `,
        options: commentOptions,
      })
    })

    it.each([
      ['never', 'never' as const],
      ['0', 0 as const],
    ])(
      'preserves partition boundaries regardless of newlinesBetween %s',
      async (_description, newlinesBetween) => {
        let partitionOptions = [
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
        ]

        await invalid({
          errors: [
            {
              data: {
                right: 'bb',
                left: 'c',
              },
              messageId: 'unexpectedSetsOrder',
            },
          ],
          output: dedent`
            new Set([
              'aaa',

              // Partition comment

              'bb',
              'c',
            ])
          `,
          code: dedent`
            new Set([
              'aaa',

              // Partition comment

              'c',
              'bb',
            ])
          `,
          options: partitionOptions,
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

    it('sorts elements in sets', async () => {
      await valid({
        code: dedent`
          new Set(
            'a',
            'b',
            'c',
            'd',
          )
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'a',
            'b',
            'c',
            'd',
          ])
        `,
        code: dedent`
          new Set([
            'a',
            'c',
            'b',
            'd',
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

    it('accepts unsorted sets', async () => {
      await valid({
        code: dedent`
          new Set([
            'b',
            'c',
            'a'
          ])
        `,
        options: [options],
      })
    })

    it('enforces custom group ordering', async () => {
      let customGroupOptions = [
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
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'b',
              leftGroup: 'a',
              right: 'ba',
              left: 'aa',
            },
            messageId: 'unexpectedSetsGroupOrder',
          },
        ],
        output: dedent`
          new Set([
            'ba',
            'bb',
            'ab',
            'aa',
          ])
        `,
        code: dedent`
          new Set([
            'ab',
            'aa',
            'ba',
            'bb',
          ])
        `,
        options: customGroupOptions,
      })
    })

    it('adds required newlines between groups', async () => {
      let newlineGroupOptions = [
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
      ]

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'missedSpacingBetweenSetsMembers',
          },
        ],
        output: dedent`
          new Set([
            'b',

            'a',
          ])
        `,
        code: dedent`
          new Set([
            'b',
            'a',
          ])
        `,
        options: newlineGroupOptions,
      })
    })
  })

  describe('misc', () => {
    it('validates the JSON schema', async () => {
      await expect(
        validateRuleJsonSchema(rule.meta.schema),
      ).resolves.not.toThrow()
    })

    it('uses alphabetical ascending order by default', async () => {
      await valid(
        dedent`
          new Set([
            'a',
            'b',
            'c',
            'd',
          ])
        `,
      )

      await valid({
        code: dedent`
          new Set([
            'v1.png',
            'v10.png',
            'v12.png',
            'v2.png',
          ])
        `,
        options: [
          {
            ignoreCase: false,
          },
        ],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedSetsOrder',
          },
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'a',
            'b',
            'c',
            'd',
          ])
        `,
        code: dedent`
          new Set([
            'b',
            'a',
            'd',
            'c',
          ])
        `,
      })
    })

    it('handles empty and single-element sets', async () => {
      await valid('new Set([])')
      await valid("new Set(['a'])")
    })

    it('treats different quote styles as equivalent', async () => {
      await valid(
        dedent`
          new Set(['a', "b", 'c'])
        `,
      )
    })

    it('respects eslint-disable-next-line comments', async () => {
      await valid({
        code: dedent`
          new Set([
            'b',
            'c',
            // eslint-disable-next-line
            'a',
          ])
        `,
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'b',
            'c',
            // eslint-disable-next-line
            'a',
          ])
        `,
        code: dedent`
          new Set([
            'c',
            'b',
            // eslint-disable-next-line
            'a',
          ])
        `,
        options: [{}],
      })
    })

    it('handles eslint-disable with partition comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: 'unexpectedSetsOrder',
          },
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'b',
            'c',
            // eslint-disable-next-line
            'a',
            'd'
          ])
        `,
        code: dedent`
          new Set([
            'd',
            'c',
            // eslint-disable-next-line
            'a',
            'b'
          ])
        `,
        options: [
          {
            partitionByComment: true,
          },
        ],
      })
    })

    it('handles inline eslint-disable-line comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'b',
            'c',
            'a', // eslint-disable-line
          ])
        `,
        code: dedent`
          new Set([
            'c',
            'b',
            'a', // eslint-disable-line
          ])
        `,
        options: [{}],
      })
    })

    it('handles block-style eslint-disable comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'b',
            'c',
            /* eslint-disable-next-line */
            'a',
          ])
        `,
        code: dedent`
          new Set([
            'c',
            'b',
            /* eslint-disable-next-line */
            'a',
          ])
        `,
        options: [{}],
      })
    })

    it('handles inline block-style eslint-disable comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'b',
            'c',
            'a', /* eslint-disable-line */
          ])
        `,
        code: dedent`
          new Set([
            'c',
            'b',
            'a', /* eslint-disable-line */
          ])
        `,
        options: [{}],
      })
    })

    it('respects eslint-disable/enable block regions', async () => {
      await invalid({
        output: dedent`
          new Set([
            'a',
            'd',
            /* eslint-disable */
            'c',
            'b',
            // Shouldn't move
            /* eslint-enable */
            'e',
          ])
        `,
        code: dedent`
          new Set([
            'd',
            'e',
            /* eslint-disable */
            'c',
            'b',
            // Shouldn't move
            /* eslint-enable */
            'a',
          ])
        `,
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedSetsOrder',
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
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'b',
            'c',
            // eslint-disable-next-line rule-to-test/sort-sets
            'a',
          ])
        `,
        code: dedent`
          new Set([
            'c',
            'b',
            // eslint-disable-next-line rule-to-test/sort-sets
            'a',
          ])
        `,
        options: [{}],
      })
    })

    it('handles inline rule-specific eslint-disable comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'b',
            'c',
            'a', // eslint-disable-line rule-to-test/sort-sets
          ])
        `,
        code: dedent`
          new Set([
            'c',
            'b',
            'a', // eslint-disable-line rule-to-test/sort-sets
          ])
        `,
        options: [{}],
      })
    })

    it('handles block-style rule-specific eslint-disable comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'b',
            'c',
            /* eslint-disable-next-line rule-to-test/sort-sets */
            'a',
          ])
        `,
        code: dedent`
          new Set([
            'c',
            'b',
            /* eslint-disable-next-line rule-to-test/sort-sets */
            'a',
          ])
        `,
        options: [{}],
      })
    })

    it('handles inline block-style rule-specific eslint-disable comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        output: dedent`
          new Set([
            'b',
            'c',
            'a', /* eslint-disable-line rule-to-test/sort-sets */
          ])
        `,
        code: dedent`
          new Set([
            'c',
            'b',
            'a', /* eslint-disable-line rule-to-test/sort-sets */
          ])
        `,
        options: [{}],
      })
    })

    it('respects rule-specific eslint-disable/enable regions', async () => {
      await invalid({
        output: dedent`
          new Set([
            'a',
            'd',
            /* eslint-disable rule-to-test/sort-sets */
            'c',
            'b',
            // Shouldn't move
            /* eslint-enable */
            'e',
          ])
        `,
        code: dedent`
          new Set([
            'd',
            'e',
            /* eslint-disable rule-to-test/sort-sets */
            'c',
            'b',
            // Shouldn't move
            /* eslint-enable */
            'a',
          ])
        `,
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedSetsOrder',
          },
        ],
        options: [{}],
      })
    })
  })
})
