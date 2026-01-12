import { createRuleTester } from 'eslint-vitest-rule-tester'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import rule from '../../rules/sort-array-includes'
import { Alphabet } from '../../utils/alphabet'

describe('sort-array-includes', () => {
  let { invalid, valid } = createRuleTester({
    name: 'sort-array-includes',
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('accepts sorted arrays in includes() calls', async () => {
      await valid({
        code: dedent`
          ['aaa', 'bb', 'c'].includes('aaa')
        `,
        options: [options],
      })
    })

    it('reports error when array in includes() is not sorted', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'aaa', left: 'c' },
          },
        ],
        output: dedent`
          ['aaa', 'bb', 'c'].includes('aaa')
        `,
        code: dedent`
          ['bb', 'c', 'aaa'].includes('aaa')
        `,
        options: [options],
      })
    })

    it('preserves array structure when fixing sort order', async () => {
      await valid({
        code: dedent`
          [
            'a',
            'b',
            'c',
            'd',
            'e',
            ...other,
          ].includes(value)
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          [
            'a',
            'b',
            'c',
            'd',
            'e',
            ...other,
          ].includes(value)
        `,
        code: dedent`
          [
            'a',
            'c',
            'b',
            'd',
            'e',
            ...other,
          ].includes(value)
        `,
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [options],
      })
    })

    it('sorts spread elements in includes() calls', async () => {
      await valid({
        code: dedent`
          [
            ...aaa,
            ...bbbb,
            ...ccc,
          ].includes(value)
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: '...bbbb', left: '...ccc' },
            messageId: 'unexpectedArrayIncludesOrder',
          },
        ],
        output: dedent`
          [
            ...aaa,
            ...bbbb,
            ...ccc,
          ].includes(value)
        `,
        code: dedent`
          [
            ...aaa,
            ...ccc,
            ...bbbb,
          ].includes(value)
        `,
        options: [options],
      })
    })

    it('handles arrays with empty slots correctly', async () => {
      await valid({
        code: dedent`
          ['a', 'b', 'c',, 'd'].includes(value)
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          ['a', 'b', 'c',, 'd'].includes(value)
        `,
        code: dedent`
          ['b', 'a', 'c',, 'd'].includes(value)
        `,
        options: [options],
      })
    })

    it('sorts elements in Array constructor calls', async () => {
      await valid({
        code: dedent`
          new Array(
            'a',
            'b',
            'c',
            'd',
          ).includes(value)
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          new Array(
            'a',
            'b',
            'c',
            'd',
          ).includes(value)
        `,
        code: dedent`
          new Array(
            'a',
            'c',
            'b',
            'd',
          ).includes(value)
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
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'a', left: 'd' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'b', left: 'e' },
          },
        ],
        output: dedent`
          [
            'a',
            'd',

            'c',

            'b',
            'e',
          ].includes(value)
        `,
        code: dedent`
          [
            'd',
            'a',

            'c',

            'e',
            'b',
          ].includes(value)
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
          {
            data: {
              rightGroup: 'spread',
              leftGroup: 'unknown',
              right: '...b',
              left: 'a',
            },
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            ...d,
            'c',

            ...b,
            'a',
          ].includes(value)
        `,
        code: dedent`
          [
            'c',
            ...d,

            'a',
            ...b,
          ].includes(value)
        `,
        options: partitionWithGroupOptions,
      })
    })

    it('applies grouping rules within each partition separately', async () => {
      let partitionWithGroupOptions = [
        {
          ...options,
          partitionByNewLine: true,
          groups: ['spread'],
        },
      ]

      await valid({
        code: dedent`
          [
            ...a,
            ...b,
            'c',
            'd',

            ...e,
            'f',
          ].includes(value)
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
        output: dedent`
          [
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
          ].includes(value)
        `,
        code: dedent`
          [
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
          ].includes(value)
        `,
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'bbb', left: 'd' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'fff', left: 'gg' },
          },
        ],
        options: partitionOptions,
      })
    })

    it('treats every comment as partition boundary when set to true', async () => {
      await valid({
        code: dedent`
          [
            // Comment
            'bb',
            // Other comment
            'a',
          ].includes(value)
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
          [
            /* Partition Comment */
            // Part: A
            'd',
            // Part: B
            'aaa',
            'bb',
            'c',
            /* Other */
            'e',
          ].includes(value)
        `,
        code: dedent`
          [
            /* Partition Comment */
            // Part: A
            'd',
            // Part: B
            'aaa',
            'c',
            'bb',
            /* Other */
            'e',
          ].includes(value)
        `,
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        options: multiplePatternOptions,
      })
    })

    it('applies grouping within comment-defined partitions', async () => {
      let partitionWithGroupOptions = [
        {
          ...options,
          partitionByComment: '^Part:',
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
          {
            data: {
              rightGroup: 'spread',
              leftGroup: 'unknown',
              right: '...b',
              left: 'a',
            },
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            ...d,
            'c',
            // Part: 1
            ...b,
            'a',
          ].includes(value)
        `,
        code: dedent`
          [
            'c',
            ...d,
            // Part: 1
            'a',
            ...b,
          ].includes(value)
        `,
        options: partitionWithGroupOptions,
      })
    })

    it('ignores block comments when line comments are specified', async () => {
      let lineCommentsOnlyOptions = [
        {
          ...options,
          partitionByComment: {
            line: true,
          },
        },
      ]

      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            /* Comment */
            'a',
            'b'
          ].includes(value)
        `,
        code: dedent`
          [
            'b',
            /* Comment */
            'a'
          ].includes(value)
        `,
        options: lineCommentsOnlyOptions,
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
          [
            'b',
            // Comment
            'a'
          ].includes(value)
        `,
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['a', 'b'],
            },
          },
        ],
        code: dedent`
          [
            'c',
            // b
            'b',
            // a
            'a'
          ].includes(value)
        `,
      })
    })

    it('supports regex patterns for line comments', async () => {
      await valid({
        code: dedent`
          [
            'b',
            // I am a partition comment because I don't have f o o
            'a'
          ].includes(value)
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
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            // Comment
            'a',
            'b'
          ].includes(value)
        `,
        code: dedent`
          [
            'b',
            // Comment
            'a'
          ].includes(value)
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
          [
            'b',
            /* Comment */
            'a'
          ].includes(value)
        `,
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        code: dedent`
          [
            'c',
            /* b */
            'b',
            /* a */
            'a'
          ].includes(value)
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
          [
            'b',
            /* I am a partition comment because I don't have f o o */
            'a'
          ].includes(value)
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

    it('supports regex patterns for partition comments', async () => {
      await valid({
        code: dedent`
          [
            'e',
            'f',
            // I am a partition comment because I don't have f o o
            'a',
            'b',
          ].includes(value)
        `,
        options: [
          {
            ...options,
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores special characters at start when trimming', async () => {
      await valid({
        code: dedent`
          [
            '$a',
            'b',
            '$c',
          ].includes(value)
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
          [
            'ab',
            'a$c',
          ].includes(value)
        `,
      })
    })

    it('sorts elements according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          [
            '你好',
            '世界',
            'a',
            'A',
            'b',
            'B'
          ].includes(value)
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts single-line arrays correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            a, b
          ].includes(value)
        `,
        code: dedent`
          [
            b, a
          ].includes(value)
        `,
        options: [options],
      })
    })

    it('handles trailing commas in single-line arrays', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            a, b,
          ].includes(value)
        `,
        code: dedent`
          [
            b, a,
          ].includes(value)
        `,
        options: [options],
      })
    })

    it('allows overriding options in groups', async () => {
      await invalid({
        options: [
          {
            ...options,
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
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'missedSpacingBetweenArrayIncludesMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          [
            'b',

            'a',
          ].includes(value)
        `,
        code: dedent`
          [
            'a',
            'b',
          ].includes(value)
        `,
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            ...b,
            'a',
            'c'
          ].includes(value)
        `,
        code: dedent`
          [
            'c',
            ...b,
            'a'
          ].includes(value)
        `,
        options: [
          {
            ...options,
            groups: ['spread', 'literal'],
          },
        ],
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            'a',
            ...b,
          ].includes(value)
        `,
        code: dedent`
          [
            ...b,
            'a',
          ].includes(value)
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
              messageId: 'unexpectedArrayIncludesGroupOrder',
            },
          ],
          output: dedent`
            [
              'helloLiteral',
              'a',
              'b',
            ].includes(value)
          `,
          code: dedent`
            [
              'a',
              'b',
              'helloLiteral',
            ].includes(value)
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
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'dddd', left: 'ccc' },
          },
          {
            data: {
              rightGroup: 'reversedLiteralsByLineLength',
              leftGroup: 'unknown',
              left: '...m',
              right: 'eee',
            },
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
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
          ].includes(value)
        `,
        code: dedent`
          [
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
          ].includes(value)
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
            data: { right: 'fooBar', left: 'fooZar' },
            messageId: 'unexpectedArrayIncludesOrder',
          },
        ],
        output: dedent`
          [
            'fooBar',
            'fooZar',
          ].includes(value)
        `,
        code: dedent`
          [
            'fooZar',
            'fooBar',
          ].includes(value)
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            'b',
            'a',
            'd',
            'e',
            'c',
            ...m,
          ].includes(value)
        `,
        code: dedent`
          [
            'b',
            'a',
            'd',
            'e',
            ...m,
            'c',
          ].includes(value)
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            '...foo',
            'cFoo',
            'a',
          ].includes(value)
        `,
        code: dedent`
          [
            'a',
            '...foo',
            'cFoo',
          ].includes(value)
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
          [
            'iHaveFooInMyName',
            'meTooIHaveFoo',
            'a',
            'b',
          ].includes(value)
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
              messageId: 'unexpectedArrayIncludesGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedArrayIncludesGroupOrder',
            },
          ],
          output: dedent`
            [
              'r',
              'g',
              'b',
            ].includes(value)
          `,
          code: dedent`
            [
              'b',
              'g',
              'r',
            ].includes(value)
          `,
          options: conditionalOptions,
        })
      },
    )

    it('removes newlines between and inside groups by default when "newlinesBetween" is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenArrayIncludesMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenArrayIncludesMembers',
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
          [
            'a',


           'y',
          'z',

              'b'
          ].includes(value)
        `,
        output: dedent`
          [
            'a',
           'b',
          'y',
              'z'
          ].includes(value)
        `,
      })
    })

    it('removes newlines inside groups when newlinesInside is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenArrayIncludesMembers',
            data: { right: 'b', left: 'z' },
          },
        ],
        options: {
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
        output: dedent`
          [
            'a',


           'b',
          'y',
              'z'
          ].includes(value)
        `,
        code: dedent`
          [
            'a',


           'y',
          'z',

              'b'
          ].includes(value)
        `,
      })
    })

    it('removes newlines between groups when newlinesBetween is 0', async () => {
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
          newlinesInside: 'ignore',
          newlinesBetween: 0,
        },
      ]

      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenArrayIncludesMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'b', left: 'z' },
          },
        ],
        code: dedent`
          [
            'a',


           'y',
          'z',

              'b'
          ].includes(value)
        `,
        output: dedent`
          [
            'a',
           'b',
          'y',

              'z'
          ].includes(value)
        `,
        options: newlinesOptions,
      })
    })

    it('adds newlines between multiple groups', async () => {
      let multiGroupOptions = [
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
      ]

      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenArrayIncludesMembers',
            data: { right: 'z', left: 'a' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'y', left: 'z' },
          },
          {
            messageId: 'missedSpacingBetweenArrayIncludesMembers',
            data: { right: 'b', left: 'y' },
          },
        ],
        output: dedent`
          [
            'a',

           'y',
          'z',

              'b',
          ].includes(value)
        `,
        code: dedent`
          [
            'a',


           'z',
          'y',
              'b',
          ].includes(value)
        `,
        options: multiGroupOptions,
      })
    })

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
              newlinesBetween: 1,
            },
            'b',
            {
              newlinesBetween: 1,
            },
            'c',
            {
              newlinesBetween: 0,
            },
            'd',
            {
              newlinesBetween: 'ignore',
            },
            'e',
          ],
          newlinesBetween: 1,
        },
      ]

      await invalid({
        errors: [
          {
            messageId: 'missedSpacingBetweenArrayIncludesMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenArrayIncludesMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenArrayIncludesMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          [
            'a',

            'b',

            'c',
            'd',


            'e'
          ].includes(value)
        `,
        code: dedent`
          [
            'a',
            'b',


            'c',

            'd',


            'e'
          ].includes(value)
        `,
        options: inlineNewlineOptions,
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
              messageId: 'missedSpacingBetweenArrayIncludesMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            [
              a,


              b,
            ].includes(value)
          `,
          code: dedent`
            [
              a,
              b,
            ].includes(value)
          `,
          options: mixedNewlineOptions,
        })
      },
    )

    it.each([1, 2, 'ignore', 0])(
      'removes newlines when 0 overrides global %s between specific groups',
      async globalNewlinesBetween => {
        let noNewlineBetweenGroupsOptions = [
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
        ]

        await invalid({
          errors: [
            {
              messageId: 'extraSpacingBetweenArrayIncludesMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            [
              a,
              b,
            ].includes(value)
          `,
          code: dedent`
            [
              a,

              b,
            ].includes(value)
          `,
          options: noNewlineBetweenGroupsOptions,
        })
      },
    )

    it.each([
      ['ignore', 0],
      [0, 'ignore'],
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
            [
              a,

              b,
            ].includes(value)
          `,
          options: ignoreNewlineOptions,
        })

        await valid({
          code: dedent`
            [
              a,
              b,
            ].includes(value)
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
          newlinesBetween: 1,
          newlinesInside: 0,
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            'a', // Comment after

            'b',
            'c'
          ].includes(value)
        `,
        code: dedent`
          [
            'b',
            'a', // Comment after

            'c'
          ].includes(value)
        `,
        options: commentOptions,
      })
    })

    it('preserves partition boundaries regardless of newlinesBetween 0', async () => {
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
          newlinesBetween: 0,
        },
      ]

      await invalid({
        output: dedent`
          [
            'a',

            // Partition comment

            'b',
            'c',
          ].includes(value)
        `,
        code: dedent`
          [
            'a',

            // Partition comment

            'c',
            'b',
          ].includes(value)
        `,
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: partitionOptions,
      })
    })
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('accepts sorted arrays in includes() calls', async () => {
      await valid({
        code: dedent`
          ['aaa', 'bb', 'c'].includes('aaa')
        `,
        options: [options],
      })
    })

    it('reports error when array in includes() is not sorted', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'aaa', left: 'c' },
          },
        ],
        output: dedent`
          ['aaa', 'bb', 'c'].includes('aaa')
        `,
        code: dedent`
          ['bb', 'c', 'aaa'].includes('aaa')
        `,
        options: [options],
      })
    })

    it('preserves array structure when fixing sort order', async () => {
      await valid({
        code: dedent`
          [
            'a',
            'b',
            'c',
            'd',
            'e',
            ...other,
          ].includes(value)
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          [
            'a',
            'b',
            'c',
            'd',
            'e',
            ...other,
          ].includes(value)
        `,
        code: dedent`
          [
            'a',
            'c',
            'b',
            'd',
            'e',
            ...other,
          ].includes(value)
        `,
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [options],
      })
    })

    it('sorts spread elements in includes() calls', async () => {
      await valid({
        code: dedent`
          [
            ...aaa,
            ...bbbb,
            ...ccc,
          ].includes(value)
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: '...bbbb', left: '...ccc' },
            messageId: 'unexpectedArrayIncludesOrder',
          },
        ],
        output: dedent`
          [
            ...aaa,
            ...bbbb,
            ...ccc,
          ].includes(value)
        `,
        code: dedent`
          [
            ...aaa,
            ...ccc,
            ...bbbb,
          ].includes(value)
        `,
        options: [options],
      })
    })

    it('handles arrays with empty slots correctly', async () => {
      await valid({
        code: dedent`
          ['a', 'b', 'c',, 'd'].includes(value)
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          ['a', 'b', 'c',, 'd'].includes(value)
        `,
        code: dedent`
          ['b', 'a', 'c',, 'd'].includes(value)
        `,
        options: [options],
      })
    })

    it('sorts elements in Array constructor calls', async () => {
      await valid({
        code: dedent`
          new Array(
            'a',
            'b',
            'c',
            'd',
          ).includes(value)
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          new Array(
            'a',
            'b',
            'c',
            'd',
          ).includes(value)
        `,
        code: dedent`
          new Array(
            'a',
            'c',
            'b',
            'd',
          ).includes(value)
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
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'a', left: 'd' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'b', left: 'e' },
          },
        ],
        output: dedent`
          [
            'a',
            'd',

            'c',

            'b',
            'e',
          ].includes(value)
        `,
        code: dedent`
          [
            'd',
            'a',

            'c',

            'e',
            'b',
          ].includes(value)
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
          {
            data: {
              rightGroup: 'spread',
              leftGroup: 'unknown',
              right: '...b',
              left: 'a',
            },
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            ...d,
            'c',

            ...b,
            'a',
          ].includes(value)
        `,
        code: dedent`
          [
            'c',
            ...d,

            'a',
            ...b,
          ].includes(value)
        `,
        options: partitionWithGroupOptions,
      })
    })

    it('applies grouping rules within each partition separately', async () => {
      let partitionWithGroupOptions = [
        {
          ...options,
          partitionByNewLine: true,
          groups: ['spread'],
        },
      ]

      await valid({
        code: dedent`
          [
            ...a,
            ...b,
            'c',
            'd',

            ...e,
            'f',
          ].includes(value)
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
        output: dedent`
          [
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
          ].includes(value)
        `,
        code: dedent`
          [
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
          ].includes(value)
        `,
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'bbb', left: 'd' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'fff', left: 'gg' },
          },
        ],
        options: partitionOptions,
      })
    })

    it('treats every comment as partition boundary when set to true', async () => {
      await valid({
        code: dedent`
          [
            // Comment
            'bb',
            // Other comment
            'a',
          ].includes(value)
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
          [
            /* Partition Comment */
            // Part: A
            'd',
            // Part: B
            'aaa',
            'bb',
            'c',
            /* Other */
            'e',
          ].includes(value)
        `,
        code: dedent`
          [
            /* Partition Comment */
            // Part: A
            'd',
            // Part: B
            'aaa',
            'c',
            'bb',
            /* Other */
            'e',
          ].includes(value)
        `,
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        options: multiplePatternOptions,
      })
    })

    it('applies grouping within comment-defined partitions', async () => {
      let partitionWithGroupOptions = [
        {
          ...options,
          partitionByComment: '^Part:',
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
          {
            data: {
              rightGroup: 'spread',
              leftGroup: 'unknown',
              right: '...b',
              left: 'a',
            },
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            ...d,
            'c',
            // Part: 1
            ...b,
            'a',
          ].includes(value)
        `,
        code: dedent`
          [
            'c',
            ...d,
            // Part: 1
            'a',
            ...b,
          ].includes(value)
        `,
        options: partitionWithGroupOptions,
      })
    })

    it('ignores block comments when line comments are specified', async () => {
      let lineCommentsOnlyOptions = [
        {
          ...options,
          partitionByComment: {
            line: true,
          },
        },
      ]

      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            /* Comment */
            'a',
            'b'
          ].includes(value)
        `,
        code: dedent`
          [
            'b',
            /* Comment */
            'a'
          ].includes(value)
        `,
        options: lineCommentsOnlyOptions,
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
          [
            'b',
            // Comment
            'a'
          ].includes(value)
        `,
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['a', 'b'],
            },
          },
        ],
        code: dedent`
          [
            'c',
            // b
            'b',
            // a
            'a'
          ].includes(value)
        `,
      })
    })

    it('supports regex patterns for line comments', async () => {
      await valid({
        code: dedent`
          [
            'b',
            // I am a partition comment because I don't have f o o
            'a'
          ].includes(value)
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
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            // Comment
            'a',
            'b'
          ].includes(value)
        `,
        code: dedent`
          [
            'b',
            // Comment
            'a'
          ].includes(value)
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
          [
            'b',
            /* Comment */
            'a'
          ].includes(value)
        `,
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        code: dedent`
          [
            'c',
            /* b */
            'b',
            /* a */
            'a'
          ].includes(value)
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
          [
            'b',
            /* I am a partition comment because I don't have f o o */
            'a'
          ].includes(value)
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

    it('supports regex patterns for partition comments', async () => {
      await valid({
        code: dedent`
          [
            'e',
            'f',
            // I am a partition comment because I don't have f o o
            'a',
            'b',
          ].includes(value)
        `,
        options: [
          {
            ...options,
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores special characters at start when trimming', async () => {
      await valid({
        code: dedent`
          [
            '$a',
            'b',
            '$c',
          ].includes(value)
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
          [
            'ab',
            'a$c',
          ].includes(value)
        `,
      })
    })

    it('sorts elements according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          [
            '你好',
            '世界',
            'a',
            'A',
            'b',
            'B'
          ].includes(value)
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts single-line arrays correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            a, b
          ].includes(value)
        `,
        code: dedent`
          [
            b, a
          ].includes(value)
        `,
        options: [options],
      })
    })

    it('handles trailing commas in single-line arrays', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            a, b,
          ].includes(value)
        `,
        code: dedent`
          [
            b, a,
          ].includes(value)
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            ...b,
            'a',
            'c'
          ].includes(value)
        `,
        code: dedent`
          [
            'c',
            ...b,
            'a'
          ].includes(value)
        `,
        options: [
          {
            ...options,
            groups: ['spread', 'literal'],
          },
        ],
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            'a',
            ...b,
          ].includes(value)
        `,
        code: dedent`
          [
            ...b,
            'a',
          ].includes(value)
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
              messageId: 'unexpectedArrayIncludesGroupOrder',
            },
          ],
          output: dedent`
            [
              'helloLiteral',
              'a',
              'b',
            ].includes(value)
          `,
          code: dedent`
            [
              'a',
              'b',
              'helloLiteral',
            ].includes(value)
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
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'dddd', left: 'ccc' },
          },
          {
            data: {
              rightGroup: 'reversedLiteralsByLineLength',
              leftGroup: 'unknown',
              left: '...m',
              right: 'eee',
            },
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
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
          ].includes(value)
        `,
        code: dedent`
          [
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
          ].includes(value)
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
            data: { right: 'fooBar', left: 'fooZar' },
            messageId: 'unexpectedArrayIncludesOrder',
          },
        ],
        output: dedent`
          [
            'fooBar',
            'fooZar',
          ].includes(value)
        `,
        code: dedent`
          [
            'fooZar',
            'fooBar',
          ].includes(value)
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            'b',
            'a',
            'd',
            'e',
            'c',
            ...m,
          ].includes(value)
        `,
        code: dedent`
          [
            'b',
            'a',
            'd',
            'e',
            ...m,
            'c',
          ].includes(value)
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            '...foo',
            'cFoo',
            'a',
          ].includes(value)
        `,
        code: dedent`
          [
            'a',
            '...foo',
            'cFoo',
          ].includes(value)
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
          [
            'iHaveFooInMyName',
            'meTooIHaveFoo',
            'a',
            'b',
          ].includes(value)
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
              messageId: 'unexpectedArrayIncludesGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedArrayIncludesGroupOrder',
            },
          ],
          output: dedent`
            [
              'r',
              'g',
              'b',
            ].includes(value)
          `,
          code: dedent`
            [
              'b',
              'g',
              'r',
            ].includes(value)
          `,
          options: conditionalOptions,
        })
      },
    )

    it('removes newlines between groups when newlinesBetween is 0', async () => {
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
          newlinesInside: 'ignore',
          newlinesBetween: 0,
        },
      ]

      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenArrayIncludesMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'b', left: 'z' },
          },
        ],
        code: dedent`
          [
            'a',


           'y',
          'z',

              'b'
          ].includes(value)
        `,
        output: dedent`
          [
            'a',
           'b',
          'y',

              'z'
          ].includes(value)
        `,
        options: newlinesOptions,
      })
    })

    it('adds newlines between multiple groups', async () => {
      let multiGroupOptions = [
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
      ]

      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenArrayIncludesMembers',
            data: { right: 'z', left: 'a' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'y', left: 'z' },
          },
          {
            messageId: 'missedSpacingBetweenArrayIncludesMembers',
            data: { right: 'b', left: 'y' },
          },
        ],
        output: dedent`
          [
            'a',

           'y',
          'z',

              'b',
          ].includes(value)
        `,
        code: dedent`
          [
            'a',


           'z',
          'y',
              'b',
          ].includes(value)
        `,
        options: multiGroupOptions,
      })
    })

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
              newlinesBetween: 1,
            },
            'b',
            {
              newlinesBetween: 1,
            },
            'c',
            {
              newlinesBetween: 0,
            },
            'd',
            {
              newlinesBetween: 'ignore',
            },
            'e',
          ],
          newlinesBetween: 1,
        },
      ]

      await invalid({
        errors: [
          {
            messageId: 'missedSpacingBetweenArrayIncludesMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenArrayIncludesMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenArrayIncludesMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          [
            'a',

            'b',

            'c',
            'd',


            'e'
          ].includes(value)
        `,
        code: dedent`
          [
            'a',
            'b',


            'c',

            'd',


            'e'
          ].includes(value)
        `,
        options: inlineNewlineOptions,
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
              messageId: 'missedSpacingBetweenArrayIncludesMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            [
              a,


              b,
            ].includes(value)
          `,
          code: dedent`
            [
              a,
              b,
            ].includes(value)
          `,
          options: mixedNewlineOptions,
        })
      },
    )

    it.each([1, 2, 'ignore', 0])(
      'removes newlines when 0 overrides global %s between specific groups',
      async globalNewlinesBetween => {
        let noNewlineBetweenGroupsOptions = [
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
        ]

        await invalid({
          errors: [
            {
              messageId: 'extraSpacingBetweenArrayIncludesMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            [
              a,
              b,
            ].includes(value)
          `,
          code: dedent`
            [
              a,

              b,
            ].includes(value)
          `,
          options: noNewlineBetweenGroupsOptions,
        })
      },
    )

    it.each([
      ['ignore', 0],
      [0, 'ignore'],
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
            [
              a,

              b,
            ].includes(value)
          `,
          options: ignoreNewlineOptions,
        })

        await valid({
          code: dedent`
            [
              a,
              b,
            ].includes(value)
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
          newlinesBetween: 1,
          newlinesInside: 0,
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            'a', // Comment after

            'b',
            'c'
          ].includes(value)
        `,
        code: dedent`
          [
            'b',
            'a', // Comment after

            'c'
          ].includes(value)
        `,
        options: commentOptions,
      })
    })

    it('preserves partition boundaries regardless of newlinesBetween 0', async () => {
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
          newlinesBetween: 0,
        },
      ]

      await invalid({
        output: dedent`
          [
            'a',

            // Partition comment

            'b',
            'c',
          ].includes(value)
        `,
        code: dedent`
          [
            'a',

            // Partition comment

            'c',
            'b',
          ].includes(value)
        `,
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: partitionOptions,
      })
    })
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('accepts sorted arrays in includes() calls', async () => {
      await valid({
        code: dedent`
          ['aaa', 'bb', 'c'].includes('aaa')
        `,
        options: [options],
      })
    })

    it('reports error when array in includes() is not sorted', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'aaa', left: 'c' },
          },
        ],
        output: dedent`
          ['aaa', 'bb', 'c'].includes('aaa')
        `,
        code: dedent`
          ['bb', 'c', 'aaa'].includes('aaa')
        `,
        options: [options],
      })
    })

    it('preserves array structure when fixing sort order', async () => {
      await valid({
        code: dedent`
          [
            'aaaaa',
            'bbbb',
            'ccc',
            'dd',
            'e',
            ...other,
          ].includes(value)
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          [
            'aaaaa',
            'bbbb',
            'ccc',
            'dd',
            'e',
            ...other,
          ].includes(value)
        `,
        code: dedent`
          [
            'aaaaa',
            'ccc',
            'bbbb',
            'dd',
            'e',
            ...other,
          ].includes(value)
        `,
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'bbbb', left: 'ccc' },
          },
        ],
        options: [options],
      })
    })

    it('sorts spread elements in includes() calls', async () => {
      await valid({
        code: dedent`
          [
            ...bbbb,
            ...aaa,
            ...ccc,
          ].includes(value)
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: { right: '...bbbb', left: '...aaa' },
            messageId: 'unexpectedArrayIncludesOrder',
          },
        ],
        output: dedent`
          [
            ...bbbb,
            ...aaa,
            ...ccc,
          ].includes(value)
        `,
        code: dedent`
          [
            ...aaa,
            ...bbbb,
            ...ccc,
          ].includes(value)
        `,
        options: [options],
      })
    })

    it('handles arrays with empty slots correctly', async () => {
      await valid({
        code: dedent`
          ['a', 'b', 'c',, 'd'].includes(value)
        `,
        options: [options],
      })
    })

    it('sorts elements in Array constructor calls', async () => {
      await valid({
        code: dedent`
          new Array(
            'aaaa',
            'bbb',
            'cc',
            'd',
          ).includes(value)
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          new Array(
            'aaaa',
            'bbb',
            'cc',
            'd',
          ).includes(value)
        `,
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'bbb', left: 'cc' },
          },
        ],
        code: dedent`
          new Array(
            'aaaa',
            'cc',
            'bbb',
            'd',
          ).includes(value)
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
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'aaaaa', left: 'dd' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'bbbb', left: 'e' },
          },
        ],
        output: dedent`
          [
            'aaaaa',
            'dd',

            'ccc',

            'bbbb',
            'e',
          ].includes(value)
        `,
        code: dedent`
          [
            'dd',
            'aaaaa',

            'ccc',

            'e',
            'bbbb',
          ].includes(value)
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
          {
            data: {
              rightGroup: 'spread',
              leftGroup: 'unknown',
              right: '...b',
              left: 'a',
            },
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            ...d,
            'c',

            ...b,
            'a',
          ].includes(value)
        `,
        code: dedent`
          [
            'c',
            ...d,

            'a',
            ...b,
          ].includes(value)
        `,
        options: partitionWithGroupOptions,
      })
    })

    it('applies grouping rules within each partition separately', async () => {
      let partitionWithGroupOptions = [
        {
          ...options,
          partitionByNewLine: true,
          groups: ['spread'],
        },
      ]

      await valid({
        code: dedent`
          [
            ...a,
            ...b,
            'c',
            'd',

            ...e,
            'f',
          ].includes(value)
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
        output: dedent`
          [
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
          ].includes(value)
        `,
        code: dedent`
          [
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
          ].includes(value)
        `,
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'bbb', left: 'd' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'fff', left: 'gg' },
          },
        ],
        options: partitionOptions,
      })
    })

    it('treats every comment as partition boundary when set to true', async () => {
      await valid({
        code: dedent`
          [
            // Comment
            'bb',
            // Other comment
            'a',
          ].includes(value)
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
          [
            /* Partition Comment */
            // Part: A
            'd',
            // Part: B
            'aaa',
            'bb',
            'c',
            /* Other */
            'e',
          ].includes(value)
        `,
        code: dedent`
          [
            /* Partition Comment */
            // Part: A
            'd',
            // Part: B
            'aaa',
            'c',
            'bb',
            /* Other */
            'e',
          ].includes(value)
        `,
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        options: multiplePatternOptions,
      })
    })

    it('applies grouping within comment-defined partitions', async () => {
      let partitionWithGroupOptions = [
        {
          ...options,
          partitionByComment: '^Part:',
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
          {
            data: {
              rightGroup: 'spread',
              leftGroup: 'unknown',
              right: '...b',
              left: 'a',
            },
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            ...d,
            'c',
            // Part: 1
            ...b,
            'a',
          ].includes(value)
        `,
        code: dedent`
          [
            'c',
            ...d,
            // Part: 1
            'a',
            ...b,
          ].includes(value)
        `,
        options: partitionWithGroupOptions,
      })
    })

    it('ignores block comments when line comments are specified', async () => {
      let lineCommentsOnlyOptions = [
        {
          ...options,
          partitionByComment: {
            line: true,
          },
        },
      ]

      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          [
            /* Comment */
            'aa',
            'b'
          ].includes(value)
        `,
        code: dedent`
          [
            'b',
            /* Comment */
            'aa'
          ].includes(value)
        `,
        options: lineCommentsOnlyOptions,
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
          [
            'b',
            // Comment
            'a'
          ].includes(value)
        `,
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
        options: [
          {
            ...options,
            partitionByComment: {
              line: ['a', 'b'],
            },
          },
        ],
        code: dedent`
          [
            'c',
            // b
            'b',
            // a
            'a'
          ].includes(value)
        `,
      })
    })

    it('supports regex patterns for line comments', async () => {
      await valid({
        code: dedent`
          [
            'b',
            // I am a partition comment because I don't have f o o
            'a'
          ].includes(value)
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
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          [
            // Comment
            'aa',
            'b'
          ].includes(value)
        `,
        code: dedent`
          [
            'b',
            // Comment
            'aa'
          ].includes(value)
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
          [
            'b',
            /* Comment */
            'a'
          ].includes(value)
        `,
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        code: dedent`
          [
            'c',
            /* b */
            'b',
            /* a */
            'a'
          ].includes(value)
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
          [
            'b',
            /* I am a partition comment because I don't have f o o */
            'a'
          ].includes(value)
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

    it('supports regex patterns for partition comments', async () => {
      await valid({
        code: dedent`
          [
            'e',
            'f',
            // I am a partition comment because I don't have f o o
            'a',
            'b',
          ].includes(value)
        `,
        options: [
          {
            ...options,
            partitionByComment: ['^(?!.*foo).*$'],
          },
        ],
      })
    })

    it('ignores special characters at start when trimming', async () => {
      await valid({
        code: dedent`
          [
            '$aa',
            'bb',
            '$c',
          ].includes(value)
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
          [
            'abc',
            'a$c',
          ].includes(value)
        `,
      })
    })

    it('sorts elements according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          [
            '你好',
            '世界',
            'a',
            'A',
            'b',
            'B'
          ].includes(value)
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts single-line arrays correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          [
            aa, b
          ].includes(value)
        `,
        code: dedent`
          [
            b, aa
          ].includes(value)
        `,
        options: [options],
      })
    })

    it('handles trailing commas in single-line arrays', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          [
            aa, b,
          ].includes(value)
        `,
        code: dedent`
          [
            b, aa,
          ].includes(value)
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            ...b,
            'aa',
            'c'
          ].includes(value)
        `,
        code: dedent`
          [
            'c',
            ...b,
            'aa'
          ].includes(value)
        `,
        options: [
          {
            ...options,
            groups: ['spread', 'literal'],
          },
        ],
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            'a',
            ...b,
          ].includes(value)
        `,
        code: dedent`
          [
            ...b,
            'a',
          ].includes(value)
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
              messageId: 'unexpectedArrayIncludesGroupOrder',
            },
          ],
          output: dedent`
            [
              'helloLiteral',
              'a',
              'b',
            ].includes(value)
          `,
          code: dedent`
            [
              'a',
              'b',
              'helloLiteral',
            ].includes(value)
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
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'dddd', left: 'ccc' },
          },
          {
            data: {
              rightGroup: 'reversedLiteralsByLineLength',
              leftGroup: 'unknown',
              left: '...m',
              right: 'eee',
            },
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
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
          ].includes(value)
        `,
        code: dedent`
          [
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
          ].includes(value)
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
            data: { right: 'fooBar', left: 'fooZar' },
            messageId: 'unexpectedArrayIncludesOrder',
          },
        ],
        output: dedent`
          [
            'fooBar',
            'fooZar',
          ].includes(value)
        `,
        code: dedent`
          [
            'fooZar',
            'fooBar',
          ].includes(value)
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            'b',
            'a',
            'd',
            'e',
            'c',
            ...m,
          ].includes(value)
        `,
        code: dedent`
          [
            'b',
            'a',
            'd',
            'e',
            ...m,
            'c',
          ].includes(value)
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            '...foo',
            'cFoo',
            'a',
          ].includes(value)
        `,
        code: dedent`
          [
            'a',
            '...foo',
            'cFoo',
          ].includes(value)
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
          [
            'iHaveFooInMyName',
            'meTooIHaveFoo',
            'a',
            'b',
          ].includes(value)
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
              messageId: 'unexpectedArrayIncludesGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedArrayIncludesGroupOrder',
            },
          ],
          output: dedent`
            [
              'r',
              'g',
              'b',
            ].includes(value)
          `,
          code: dedent`
            [
              'b',
              'g',
              'r',
            ].includes(value)
          `,
          options: conditionalOptions,
        })
      },
    )

    it('removes newlines between groups when newlinesBetween is 0', async () => {
      let newlinesOptions = [
        {
          ...options,
          customGroups: [
            {
              elementNamePattern: 'aa',
              groupName: 'aa',
            },
          ],
          groups: ['aa', 'unknown'],
          newlinesInside: 'ignore',
          newlinesBetween: 0,
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              left: 'aaaa',
              right: 'yy',
            },
            messageId: 'extraSpacingBetweenArrayIncludesMembers',
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'bbb', left: 'z' },
          },
        ],
        code: dedent`
          [
            'aaaa',


           'yy',
          'z',

              'bbb'
          ].includes(value)
        `,
        output: dedent`
          [
            'aaaa',
           'bbb',
          'yy',

              'z'
          ].includes(value)
        `,
        options: newlinesOptions,
      })
    })

    it('adds newlines between multiple groups', async () => {
      let multiGroupOptions = [
        {
          ...options,
          customGroups: [
            {
              elementNamePattern: 'aa',
              groupName: 'aa',
            },
            {
              elementNamePattern: 'b',
              groupName: 'b',
            },
          ],
          groups: ['aa', 'unknown', 'b'],
          newlinesBetween: 1,
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              left: 'aaaa',
              right: 'z',
            },
            messageId: 'extraSpacingBetweenArrayIncludesMembers',
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'yy', left: 'z' },
          },
          {
            messageId: 'missedSpacingBetweenArrayIncludesMembers',
            data: { right: 'bbb', left: 'yy' },
          },
        ],
        output: dedent`
          [
            'aaaa',

           'yy',
          'z',

              'bbb',
          ].includes(value)
        `,
        code: dedent`
          [
            'aaaa',


           'z',
          'yy',
              'bbb',
          ].includes(value)
        `,
        options: multiGroupOptions,
      })
    })

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
              newlinesBetween: 1,
            },
            'b',
            {
              newlinesBetween: 1,
            },
            'c',
            {
              newlinesBetween: 0,
            },
            'd',
            {
              newlinesBetween: 'ignore',
            },
            'e',
          ],
          newlinesBetween: 1,
        },
      ]

      await invalid({
        errors: [
          {
            messageId: 'missedSpacingBetweenArrayIncludesMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenArrayIncludesMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenArrayIncludesMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          [
            'a',

            'b',

            'c',
            'd',


            'e'
          ].includes(value)
        `,
        code: dedent`
          [
            'a',
            'b',


            'c',

            'd',


            'e'
          ].includes(value)
        `,
        options: inlineNewlineOptions,
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
              messageId: 'missedSpacingBetweenArrayIncludesMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            [
              a,


              b,
            ].includes(value)
          `,
          code: dedent`
            [
              a,
              b,
            ].includes(value)
          `,
          options: mixedNewlineOptions,
        })
      },
    )

    it.each([1, 2, 'ignore', 0])(
      'removes newlines when 0 overrides global %s between specific groups',
      async globalNewlinesBetween => {
        let noNewlineBetweenGroupsOptions = [
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
        ]

        await invalid({
          errors: [
            {
              messageId: 'extraSpacingBetweenArrayIncludesMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            [
              a,
              b,
            ].includes(value)
          `,
          code: dedent`
            [
              a,

              b,
            ].includes(value)
          `,
          options: noNewlineBetweenGroupsOptions,
        })
      },
    )

    it.each([
      ['ignore', 0],
      [0, 'ignore'],
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
            [
              a,

              b,
            ].includes(value)
          `,
          options: ignoreNewlineOptions,
        })

        await valid({
          code: dedent`
            [
              a,
              b,
            ].includes(value)
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
          newlinesBetween: 1,
          newlinesInside: 0,
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            'a', // Comment after

            'b',
            'c'
          ].includes(value)
        `,
        code: dedent`
          [
            'b',
            'a', // Comment after

            'c'
          ].includes(value)
        `,
        options: commentOptions,
      })
    })

    it('preserves partition boundaries regardless of newlinesBetween 0', async () => {
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
          newlinesBetween: 0,
        },
      ]

      await invalid({
        output: dedent`
          [
            'aaa',

            // Partition comment

            'bb',
            'c',
          ].includes(value)
        `,
        code: dedent`
          [
            'aaa',

            // Partition comment

            'c',
            'bb',
          ].includes(value)
        `,
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        options: partitionOptions,
      })
    })
  })

  describe('custom', () => {
    it('sorts elements according to custom alphabet order', async () => {
      let alphabet = Alphabet.generateRecommendedAlphabet()
        .sortByLocaleCompare('en-US')
        .getCharacters()

      let customAlphabetOptions = [
        {
          type: 'custom' as const,
          order: 'asc' as const,
          alphabet,
        },
      ]

      await valid({
        code: dedent`
          [
            'a',
            'b',
            'c',
            'd',
          ].includes(value)
        `,
        options: customAlphabetOptions,
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          [
            'a',
            'b',
            'c',
            'd',
          ].includes(value)
        `,
        code: dedent`
          [
            'a',
            'c',
            'b',
            'd',
          ].includes(value)
        `,
        options: customAlphabetOptions,
      })
    })
  })

  describe('subgroup-order', () => {
    let options = {
      fallbackSort: {
        type: 'subgroup-order',
        order: 'asc',
      },
      type: 'line-length',
      order: 'desc',
    }

    it('fallback sorts by subgroup order', async () => {
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
            groups: [['a', 'b'], 'unknown'],
          },
        ],
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'bb', left: 'b' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'aa', left: 'a' },
          },
        ],
        output: dedent`
          [
            'aa',
            'bb',
            'a',
            'b',
          ].includes(value)
        `,
        code: dedent`
          [
            'b',
            'bb',
            'a',
            'aa',
          ].includes(value)
        `,
      })
    })

    it('fallback sorts by subgroup order through overriding groups option', async () => {
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
            groups: [{ group: ['a', 'b'], newlinesInside: 0 }, 'unknown'],
          },
        ],
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'bb', left: 'b' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'aa', left: 'a' },
          },
        ],
        output: dedent`
          [
            'aa',
            'bb',
            'a',
            'b',
          ].includes(value)
        `,
        code: dedent`
          [
            'b',
            'bb',
            'a',
            'aa',
          ].includes(value)
        `,
      })
    })
  })

  describe('unsorted', () => {
    let unsortedOptions = {
      type: 'unsorted' as const,
      order: 'asc' as const,
    }

    it('allows any order when type is unsorted', async () => {
      await valid({
        code: dedent`
          [
            'b',
            'c',
            'a'
          ].includes(value)
        `,
        options: [unsortedOptions],
      })
    })

    it('enforces grouping even with unsorted type', async () => {
      let groupingOptions = [
        {
          ...unsortedOptions,
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
            messageId: 'unexpectedArrayIncludesGroupOrder',
          },
        ],
        output: dedent`
          [
            'ba',
            'bb',
            'ab',
            'aa',
          ].includes(value)
        `,
        code: dedent`
          [
            'ab',
            'aa',
            'ba',
            'bb',
          ].includes(value)
        `,
        options: groupingOptions,
      })
    })

    it('enforces newlines between groups with unsorted type', async () => {
      let newlinesOptions = [
        {
          ...unsortedOptions,
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
      ]

      await invalid({
        errors: [
          {
            messageId: 'missedSpacingBetweenArrayIncludesMembers',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            'b',

            'a',
          ].includes(value)
        `,
        code: dedent`
          [
            'b',
            'a',
          ].includes(value)
        `,
        options: newlinesOptions,
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
      await valid({
        code: dedent`
          [
            'a',
            'b',
            'c',
            'd',
          ].includes(value)
        `,
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'a', left: 'b' },
          },
          {
            messageId: 'unexpectedArrayIncludesOrder',
            data: { right: 'c', left: 'd' },
          },
        ],
        output: dedent`
          [
            'a',
            'b',
            'c',
            'd',
          ].includes(value)
        `,
        code: dedent`
          [
            'b',
            'a',
            'd',
            'c',
          ].includes(value)
        `,
      })
    })

    it('respects natural sorting with numbers', async () => {
      await valid({
        code: dedent`
          [
            'v1.png',
            'v10.png',
            'v12.png',
            'v2.png',
          ].includes(value)
        `,
        options: [
          {
            ignoreCase: false,
          },
        ],
      })
    })

    it('handles empty arrays and single-element arrays', async () => {
      await valid({
        code: '[].includes(value)',
      })

      await valid({
        code: "['a'].includes(value)",
      })
    })

    it('treats different quote styles as equivalent', async () => {
      await valid({
        code: dedent`
          ['a', "b", 'c'].includes(value)
        `,
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
          [
            ccc,
            bb,
            a,
          ].includes(value)
        `,
        options: [{}],
        settings,
      })

      await valid({
        code: dedent`
          [
            a,
            bb,
            ccc,
          ].includes(value)
        `,
        options: [{ type: 'alphabetical', order: 'asc' }],
        settings,
      })
    })

    describe('with eslint-disable comments', () => {
      it('excludes disabled elements from sorting', async () => {
        await valid({
          code: dedent`
            [
              'b',
              'c',
              // eslint-disable-next-line
              'a',
            ].includes(value)
          `,
        })

        await invalid({
          output: dedent`
            [
              'b',
              'c',
              // eslint-disable-next-line
              'a',
            ].includes(value)
          `,
          code: dedent`
            [
              'c',
              'b',
              // eslint-disable-next-line
              'a',
            ].includes(value)
          `,
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
              data: { right: 'b', left: 'c' },
            },
          ],
          options: [{}],
        })
      })

      it('handles inline eslint-disable comments', async () => {
        await invalid({
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
              data: { right: 'b', left: 'c' },
            },
          ],
          output: dedent`
            [
              'b',
              'c',
              'a', // eslint-disable-line
            ].includes(value)
          `,
          code: dedent`
            [
              'c',
              'b',
              'a', // eslint-disable-line
            ].includes(value)
          `,
          options: [{}],
        })
      })

      it('respects eslint-disable blocks', async () => {
        await invalid({
          output: dedent`
            [
              'a',
              'd',
              /* eslint-disable */
              'c',
              'b',
              // Shouldn't move
              /* eslint-enable */
              'e',
            ].includes(value)
          `,
          code: dedent`
            [
              'd',
              'e',
              /* eslint-disable */
              'c',
              'b',
              // Shouldn't move
              /* eslint-enable */
              'a',
            ].includes(value)
          `,
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
              data: { right: 'a', left: 'b' },
            },
          ],
          options: [{}],
        })
      })

      it('handles rule-specific eslint-disable comments', async () => {
        await invalid({
          output: dedent`
            [
              'b',
              'c',
              // eslint-disable-next-line rule-to-test/sort-array-includes
              'a',
            ].includes(value)
          `,
          code: dedent`
            [
              'c',
              'b',
              // eslint-disable-next-line rule-to-test/sort-array-includes
              'a',
            ].includes(value)
          `,
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
              data: { right: 'b', left: 'c' },
            },
          ],
          options: [{}],
        })
      })

      it('ignores arrays with other methods', async () => {
        await valid({
          code: dedent`
            ['c', 'b', 'a'].map(x => x)
          `,
        })

        await valid({
          code: dedent`
            ['c', 'b', 'a'].filter(x => x)
          `,
        })

        await valid({
          code: dedent`
            ['c', 'b', 'a'].forEach(x => console.log(x))
          `,
        })
      })

      it('ignores computed property access', async () => {
        await valid({
          code: dedent`
            ['c', 'b', 'a']['includes']('a')
          `,
        })
      })
    })
  })
})
