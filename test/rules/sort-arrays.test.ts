import { createRuleTester } from 'eslint-vitest-rule-tester'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { buildOxlintRuleTester } from './build-oxlint-rule-tester'
import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-arrays'

describe('sort-arrays', () => {
  let { invalid, valid } = createRuleTester({
    name: 'sort-arrays',
    rule,
  })
  let oxlintRuleTester = buildOxlintRuleTester(rule)

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('accepts sorted arrays', async () => {
      await valid({
        code: dedent`
          ['aaa', 'bb', 'c']
        `,
        options: [options],
      })
    })

    it('reports error when array is not sorted', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'aaa', left: 'c' },
          },
        ],
        output: dedent`
          ['aaa', 'bb', 'c']
        `,
        code: dedent`
          ['bb', 'c', 'aaa']
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
          ]
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
          ]
        `,
        code: dedent`
          [
            'a',
            'c',
            'b',
            'd',
            'e',
            ...other,
          ]
        `,
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [options],
      })
    })

    it('does not sort spread elements', async () => {
      await valid({
        code: dedent`
          [
            ...aaa,
            ...ccc,
            ...bbbb,
          ]
        `,
        options: [options],
      })
    })

    it('treats spread elements as partition boundaries', async () => {
      await valid({
        code: dedent`
          [
            'a',
            'b',
            ...spread1,
            'd',
            'e',
            ...spread2,
            'g',
            'h',
          ]
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          [
            'a',
            'b',
            ...spread,
            'c',
            'd',
          ]
        `,
        code: dedent`
          [
            'b',
            'a',
            ...spread,
            'c',
            'd',
          ]
        `,
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [options],
      })
    })

    it('handles arrays with empty slots correctly', async () => {
      await valid({
        code: dedent`
          ['a', 'b', 'c',, 'd']
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          ['a', 'b', 'c',, 'd']
        `,
        code: dedent`
          ['b', 'a', 'c',, 'd']
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
          )
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          new Array(
            'a',
            'b',
            'c',
            'd',
          )
        `,
        code: dedent`
          new Array(
            'a',
            'c',
            'b',
            'd',
          )
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
            messageId: 'unexpectedArraysOrder',
            data: { right: 'a', left: 'd' },
          },
          {
            messageId: 'unexpectedArraysOrder',
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
          ]
        `,
        code: dedent`
          [
            'd',
            'a',

            'c',

            'e',
            'b',
          ]
        `,
        options: partitionOptions,
      })
    })

    it('treats each newline-separated section as independent partition', async () => {
      let partitionWithGroupOptions = [
        {
          ...options,
          customGroups: [
            {
              elementNamePattern: '^top',
              groupName: 'top',
            },
          ],
          groups: ['top', 'unknown'],
          partitionByNewLine: true,
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top2',
              left: 'c',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top1',
              left: 'a',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'top2',
            'c',

            'top1',
            'a',
          ]
        `,
        code: dedent`
          [
            'c',
            'top2',

            'a',
            'top1',
          ]
        `,
        options: partitionWithGroupOptions,
      })
    })

    it('applies grouping rules within each partition separately', async () => {
      let partitionWithGroupOptions = [
        {
          ...options,
          partitionByNewLine: true,
        },
      ]

      await valid({
        code: dedent`
          [
            'a',
            'b',

            'c',
            'd',
          ]
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
          ]
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
          ]
        `,
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'bbb', left: 'd' },
          },
          {
            messageId: 'unexpectedArraysOrder',
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
          ]
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
          ]
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
          ]
        `,
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
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
          customGroups: [
            {
              elementNamePattern: '^top',
              groupName: 'top',
            },
          ],
          partitionByComment: '^Part:',
          groups: ['top', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top2',
              left: 'c',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top1',
              left: 'a',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'top2',
            'c',
            // Part: 1
            'top1',
            'a',
          ]
        `,
        code: dedent`
          [
            'c',
            'top2',
            // Part: 1
            'a',
            'top1',
          ]
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
            messageId: 'unexpectedArraysOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            /* Comment */
            'a',
            'b'
          ]
        `,
        code: dedent`
          [
            'b',
            /* Comment */
            'a'
          ]
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
          ]
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
          ]
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
          [
            'b',
            // I am a partition comment because I don't have f o o
            'a'
          ]
        `,
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
            messageId: 'unexpectedArraysOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            // Comment
            'a',
            'b'
          ]
        `,
        code: dedent`
          [
            'b',
            // Comment
            'a'
          ]
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
          ]
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
          [
            'c',
            /* b */
            'b',
            /* a */
            'a'
          ]
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
          [
            'b',
            /* I am a partition comment because I don't have f o o */
            'a'
          ]
        `,
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
          ]
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
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
        code: dedent`
          [
            '$a',
            'b',
            '$c',
          ]
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
          [
            'ab',
            'a$c',
          ]
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
          ]
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts single-line arrays correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            a, b
          ]
        `,
        code: dedent`
          [
            b, a
          ]
        `,
        options: [options],
      })
    })

    it('handles trailing commas in single-line arrays', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            a, b,
          ]
        `,
        code: dedent`
          [
            b, a,
          ]
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
            messageId: 'unexpectedArraysOrder',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'missedSpacingBetweenArraysMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          [
            'b',

            'a',
          ]
        `,
        code: dedent`
          [
            'a',
            'b',
          ]
        `,
      })
    })

    it('enforces custom group ordering', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^top',
                groupName: 'top',
              },
            ],
            groups: ['top', 'literal'],
          },
        ],
        errors: [
          {
            data: {
              leftGroup: 'literal',
              rightGroup: 'top',
              right: 'top1',
              left: 'c',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'top1',
            'a',
            'c'
          ]
        `,
        code: dedent`
          [
            'c',
            'top1',
            'a'
          ]
        `,
      })
    })

    it('applies custom groups based on element selectors', async () => {
      let customGroupOptions = [
        {
          customGroups: [
            {
              elementNamePattern: '^top',
              groupName: 'topElements',
            },
          ],
          groups: ['topElements', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'topElements',
              leftGroup: 'unknown',
              right: 'top1',
              left: 'b',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'top1',
            'b',
          ]
        `,
        code: dedent`
          [
            'b',
            'top1',
          ]
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
              messageId: 'unexpectedArraysGroupOrder',
            },
          ],
          output: dedent`
            [
              'helloLiteral',
              'a',
              'b',
            ]
          `,
          code: dedent`
            [
              'a',
              'b',
              'helloLiteral',
            ]
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
            messageId: 'unexpectedArraysOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            data: { right: 'dddd', left: 'ccc' },
            messageId: 'unexpectedArraysOrder',
          },
        ],
        output: dedent`
          [
            'dddd',
            'ccc',
            'bb',
            'a',
            ...m,
            'eee',
            'ff',
            'g',
            ...o,
            ...p,
          ]
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
          ]
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
            messageId: 'unexpectedArraysOrder',
          },
        ],
        output: dedent`
          [
            'fooBar',
            'fooZar',
          ]
        `,
        code: dedent`
          [
            'fooZar',
            'fooBar',
          ]
        `,
        options: fallbackSortOptions,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      let unsortedGroupOptions = [
        {
          customGroups: [
            {
              elementNamePattern: '^top',
              groupName: 'unsortedTop',
              type: 'unsorted',
            },
          ],
          groups: ['unsortedTop', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'unsortedTop',
              leftGroup: 'unknown',
              right: 'top3',
              left: 'm',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'top2',
            'top1',
            'top4',
            'top5',
            'top3',
            'm',
          ]
        `,
        code: dedent`
          [
            'top2',
            'top1',
            'top4',
            'top5',
            'm',
            'top3',
          ]
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
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'elementsIncludingFoo',
              leftGroup: 'unknown',
              right: 'bFoo',
              left: 'a',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'bFoo',
            'cFoo',
            'a',
          ]
        `,
        code: dedent`
          [
            'a',
            'bFoo',
            'cFoo',
          ]
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
          ]
        `,
      })
    })

    describe('useConfigurationIf.allNamesMatchPattern', () => {
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
                allNamesMatchPattern: '^[rgb]$',
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
                messageId: 'unexpectedArraysGroupOrder',
              },
              {
                data: {
                  rightGroup: 'r',
                  leftGroup: 'g',
                  right: 'r',
                  left: 'g',
                },
                messageId: 'unexpectedArraysGroupOrder',
              },
            ],
            output: dedent`
              [
                'r',
                'g',
                'b',
              ]
            `,
            code: dedent`
              [
                'b',
                'g',
                'r',
              ]
            `,
            options: conditionalOptions,
          })
        },
      )
    })

    describe('useConfigurationIf.matchesAstSelector', () => {
      it('skips config when selector does not match the sorted node type', async () => {
        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'VariableDeclarator',
              },
              type: 'unsorted',
            },
          ],
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedArraysOrder',
            },
          ],
          output: dedent`
            const array = [
              a,
              b,
            ]
          `,
          code: dedent`
            const array = [
              b,
              a,
            ]
          `,
        })
      })

      it('applies config when selector matches the sorted node type', async () => {
        await valid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'ArrayExpression',
              },
              type: 'unsorted',
            },
          ],
          code: dedent`
            [
              b,
              a,
            ]
          `,
        })

        await valid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'ArrayExpression',
              },
              type: 'unsorted',
            },
          ],
          code: dedent`
            [
              b,
              a,
            ]
          `,
        })
      })

      it('falls through to next matching config when not matching', async () => {
        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: '* > ArrayExpression',
                allNamesMatchPattern: '^[ac]$',
              },
              type: 'unsorted',
            },
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'ArrayExpression',
              },
              type: 'alphabetical',
            },
            {
              type: 'unsorted',
            },
          ],
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedArraysOrder',
            },
          ],
          output: dedent`
            [
              a,
              b,
            ]
          `,
          code: dedent`
            [
              b,
              a,
            ]
          `,
        })

        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'ArrayExpression',
                allNamesMatchPattern: '^[ac]$',
              },
              type: 'unsorted',
            },
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'ArrayExpression',
              },
              type: 'alphabetical',
            },
            {
              type: 'unsorted',
            },
          ],
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedArraysOrder',
            },
          ],
          output: dedent`
            [
              a,
              b,
            ]
          `,
          code: dedent`
            [
              b,
              a,
            ]
          `,
        })

        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'ArrayExpression',
                allNamesMatchPattern: '^[ac]$',
              },
              type: 'unsorted',
            },
            {
              ...options,
              useConfigurationIf: {
                allNamesMatchPattern: '^[ab]$',
              },
              type: 'alphabetical',
              order: 'desc',
            },
            {
              type: 'unsorted',
            },
          ],
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedArraysOrder',
            },
          ],
          output: dedent`
            const a = [
              b,
              a,
            ]
          `,
          code: dedent`
            const a = [
              a,
              b,
            ]
          `,
        })
      })

      it('applies first matching option when selectors overlap', async () => {
        await valid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'ArrayExpression',
              },
              type: 'unsorted',
            },
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: '* > ArrayExpression',
              },
              type: 'alphabetical',
            },
          ],
          code: dedent`
            [
              b,
              a,
            ]
          `,
        })

        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'ArrayExpression',
              },
              type: 'alphabetical',
            },
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: '* > ArrayExpression',
              },
              type: 'unsorted',
            },
          ],
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedArraysOrder',
            },
          ],
          output: dedent`
            [
              a,
              b,
            ]
          `,
          code: dedent`
            [
              b,
              a,
            ]
          `,
        })
      })

      it('picks the first matching option when multiple options match', async () => {
        await invalid({
          options: [
            {
              ...options,
              type: 'alphabetical',
            },
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'ArrayExpression',
              },
              type: 'unsorted',
            },
          ],
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedArraysOrder',
            },
          ],
          output: dedent`
            [
              a,
              b,
            ]
          `,
          code: dedent`
            [
              b,
              a,
            ]
          `,
        })
      })
    })

    it('removes newlines between and inside groups by default when "newlinesBetween" is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenArraysMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenArraysMembers',
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
          ]
        `,
        output: dedent`
          [
            'a',
           'b',
          'y',
              'z'
          ]
        `,
      })
    })

    it('removes newlines inside groups when newlinesInside is 0', async () => {
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
            messageId: 'unexpectedArraysOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenArraysMembers',
            data: { right: 'b', left: 'z' },
          },
        ],
        output: dedent`
          [
            'a',


           'b',
          'y',
              'z'
          ]
        `,
        code: dedent`
          [
            'a',


           'y',
          'z',

              'b'
          ]
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
            messageId: 'extraSpacingBetweenArraysMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'b', left: 'z' },
          },
        ],
        code: dedent`
          [
            'a',


           'y',
          'z',

              'b'
          ]
        `,
        output: dedent`
          [
            'a',
           'b',
          'y',

              'z'
          ]
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
            messageId: 'extraSpacingBetweenArraysMembers',
            data: { right: 'z', left: 'a' },
          },
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'y', left: 'z' },
          },
          {
            messageId: 'missedSpacingBetweenArraysMembers',
            data: { right: 'b', left: 'y' },
          },
        ],
        output: dedent`
          [
            'a',

           'y',
          'z',

              'b',
          ]
        `,
        code: dedent`
          [
            'a',


           'z',
          'y',
              'b',
          ]
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
            messageId: 'missedSpacingBetweenArraysMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenArraysMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenArraysMembers',
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
          ]
        `,
        code: dedent`
          [
            'a',
            'b',


            'c',

            'd',


            'e'
          ]
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
              messageId: 'missedSpacingBetweenArraysMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            [
              a,


              b,
            ]
          `,
          code: dedent`
            [
              a,
              b,
            ]
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
              messageId: 'extraSpacingBetweenArraysMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            [
              a,
              b,
            ]
          `,
          code: dedent`
            [
              a,

              b,
            ]
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
            ]
          `,
          options: ignoreNewlineOptions,
        })

        await valid({
          code: dedent`
            [
              a,
              b,
            ]
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
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'a', // Comment after

            'b',
            'c'
          ]
        `,
        code: dedent`
          [
            'b',
            'a', // Comment after

            'c'
          ]
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
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          [
            'a',

            // Partition comment

            'b',
            'c',
          ]
        `,
        code: dedent`
          [
            'a',

            // Partition comment

            'c',
            'b',
          ]
        `,
        options: partitionOptions,
      })
    })
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('accepts sorted arrays', async () => {
      await valid({
        code: dedent`
          ['aaa', 'bb', 'c']
        `,
        options: [options],
      })
    })

    it('reports error when array is not sorted', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'aaa', left: 'c' },
          },
        ],
        output: dedent`
          ['aaa', 'bb', 'c']
        `,
        code: dedent`
          ['bb', 'c', 'aaa']
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
          ]
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
          ]
        `,
        code: dedent`
          [
            'a',
            'c',
            'b',
            'd',
            'e',
            ...other,
          ]
        `,
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [options],
      })
    })

    it('does not sort spread elements', async () => {
      await valid({
        code: dedent`
          [
            ...aaa,
            ...ccc,
            ...bbbb,
          ]
        `,
        options: [options],
      })
    })

    it('treats spread elements as partition boundaries', async () => {
      await valid({
        code: dedent`
          [
            'a',
            'b',
            ...spread1,
            'd',
            'e',
            ...spread2,
            'g',
            'h',
          ]
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          [
            'a',
            'b',
            ...spread,
            'c',
            'd',
          ]
        `,
        code: dedent`
          [
            'b',
            'a',
            ...spread,
            'c',
            'd',
          ]
        `,
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [options],
      })
    })

    it('handles arrays with empty slots correctly', async () => {
      await valid({
        code: dedent`
          ['a', 'b', 'c',, 'd']
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          ['a', 'b', 'c',, 'd']
        `,
        code: dedent`
          ['b', 'a', 'c',, 'd']
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
          )
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          new Array(
            'a',
            'b',
            'c',
            'd',
          )
        `,
        code: dedent`
          new Array(
            'a',
            'c',
            'b',
            'd',
          )
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
            messageId: 'unexpectedArraysOrder',
            data: { right: 'a', left: 'd' },
          },
          {
            messageId: 'unexpectedArraysOrder',
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
          ]
        `,
        code: dedent`
          [
            'd',
            'a',

            'c',

            'e',
            'b',
          ]
        `,
        options: partitionOptions,
      })
    })

    it('treats each newline-separated section as independent partition', async () => {
      let partitionWithGroupOptions = [
        {
          ...options,
          customGroups: [
            {
              elementNamePattern: '^top',
              groupName: 'top',
            },
          ],
          groups: ['top', 'unknown'],
          partitionByNewLine: true,
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top2',
              left: 'c',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top1',
              left: 'a',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'top2',
            'c',

            'top1',
            'a',
          ]
        `,
        code: dedent`
          [
            'c',
            'top2',

            'a',
            'top1',
          ]
        `,
        options: partitionWithGroupOptions,
      })
    })

    it('applies grouping rules within each partition separately', async () => {
      let partitionWithGroupOptions = [
        {
          ...options,
          partitionByNewLine: true,
        },
      ]

      await valid({
        code: dedent`
          [
            'a',
            'b',

            'c',
            'd',
          ]
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
          ]
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
          ]
        `,
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'bbb', left: 'd' },
          },
          {
            messageId: 'unexpectedArraysOrder',
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
          ]
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
          ]
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
          ]
        `,
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
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
          customGroups: [
            {
              elementNamePattern: '^top',
              groupName: 'top',
            },
          ],
          partitionByComment: '^Part:',
          groups: ['top', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top2',
              left: 'c',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top1',
              left: 'a',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'top2',
            'c',
            // Part: 1
            'top1',
            'a',
          ]
        `,
        code: dedent`
          [
            'c',
            'top2',
            // Part: 1
            'a',
            'top1',
          ]
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
            messageId: 'unexpectedArraysOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            /* Comment */
            'a',
            'b'
          ]
        `,
        code: dedent`
          [
            'b',
            /* Comment */
            'a'
          ]
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
          ]
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
          ]
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
          [
            'b',
            // I am a partition comment because I don't have f o o
            'a'
          ]
        `,
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
            messageId: 'unexpectedArraysOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            // Comment
            'a',
            'b'
          ]
        `,
        code: dedent`
          [
            'b',
            // Comment
            'a'
          ]
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
          ]
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
          [
            'c',
            /* b */
            'b',
            /* a */
            'a'
          ]
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
          [
            'b',
            /* I am a partition comment because I don't have f o o */
            'a'
          ]
        `,
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
          ]
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
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
        code: dedent`
          [
            '$a',
            'b',
            '$c',
          ]
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
          [
            'ab',
            'a$c',
          ]
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
          ]
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts single-line arrays correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            a, b
          ]
        `,
        code: dedent`
          [
            b, a
          ]
        `,
        options: [options],
      })
    })

    it('handles trailing commas in single-line arrays', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            a, b,
          ]
        `,
        code: dedent`
          [
            b, a,
          ]
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
                elementNamePattern: '^top',
                groupName: 'top',
              },
            ],
            groups: ['top', 'literal'],
          },
        ],
        errors: [
          {
            data: {
              leftGroup: 'literal',
              rightGroup: 'top',
              right: 'top1',
              left: 'c',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'top1',
            'a',
            'c'
          ]
        `,
        code: dedent`
          [
            'c',
            'top1',
            'a'
          ]
        `,
      })
    })

    it('applies custom groups based on element selectors', async () => {
      let customGroupOptions = [
        {
          customGroups: [
            {
              elementNamePattern: '^top',
              groupName: 'topElements',
            },
          ],
          groups: ['topElements', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'topElements',
              leftGroup: 'unknown',
              right: 'top1',
              left: 'b',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'top1',
            'b',
          ]
        `,
        code: dedent`
          [
            'b',
            'top1',
          ]
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
              messageId: 'unexpectedArraysGroupOrder',
            },
          ],
          output: dedent`
            [
              'helloLiteral',
              'a',
              'b',
            ]
          `,
          code: dedent`
            [
              'a',
              'b',
              'helloLiteral',
            ]
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
            messageId: 'unexpectedArraysOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            data: { right: 'dddd', left: 'ccc' },
            messageId: 'unexpectedArraysOrder',
          },
        ],
        output: dedent`
          [
            'dddd',
            'ccc',
            'bb',
            'a',
            ...m,
            'eee',
            'ff',
            'g',
            ...o,
            ...p,
          ]
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
          ]
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
            messageId: 'unexpectedArraysOrder',
          },
        ],
        output: dedent`
          [
            'fooBar',
            'fooZar',
          ]
        `,
        code: dedent`
          [
            'fooZar',
            'fooBar',
          ]
        `,
        options: fallbackSortOptions,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      let unsortedGroupOptions = [
        {
          customGroups: [
            {
              elementNamePattern: '^top',
              groupName: 'unsortedTop',
              type: 'unsorted',
            },
          ],
          groups: ['unsortedTop', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'unsortedTop',
              leftGroup: 'unknown',
              right: 'top3',
              left: 'm',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'top2',
            'top1',
            'top4',
            'top5',
            'top3',
            'm',
          ]
        `,
        code: dedent`
          [
            'top2',
            'top1',
            'top4',
            'top5',
            'm',
            'top3',
          ]
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
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'elementsIncludingFoo',
              leftGroup: 'unknown',
              right: 'bFoo',
              left: 'a',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'bFoo',
            'cFoo',
            'a',
          ]
        `,
        code: dedent`
          [
            'a',
            'bFoo',
            'cFoo',
          ]
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
          ]
        `,
      })
    })

    describe('useConfigurationIf.allNamesMatchPattern', () => {
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
                allNamesMatchPattern: '^[rgb]$',
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
                messageId: 'unexpectedArraysGroupOrder',
              },
              {
                data: {
                  rightGroup: 'r',
                  leftGroup: 'g',
                  right: 'r',
                  left: 'g',
                },
                messageId: 'unexpectedArraysGroupOrder',
              },
            ],
            output: dedent`
              [
                'r',
                'g',
                'b',
              ]
            `,
            code: dedent`
              [
                'b',
                'g',
                'r',
              ]
            `,
            options: conditionalOptions,
          })
        },
      )
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
            messageId: 'extraSpacingBetweenArraysMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'b', left: 'z' },
          },
        ],
        code: dedent`
          [
            'a',


           'y',
          'z',

              'b'
          ]
        `,
        output: dedent`
          [
            'a',
           'b',
          'y',

              'z'
          ]
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
            messageId: 'extraSpacingBetweenArraysMembers',
            data: { right: 'z', left: 'a' },
          },
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'y', left: 'z' },
          },
          {
            messageId: 'missedSpacingBetweenArraysMembers',
            data: { right: 'b', left: 'y' },
          },
        ],
        output: dedent`
          [
            'a',

           'y',
          'z',

              'b',
          ]
        `,
        code: dedent`
          [
            'a',


           'z',
          'y',
              'b',
          ]
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
            messageId: 'missedSpacingBetweenArraysMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenArraysMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenArraysMembers',
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
          ]
        `,
        code: dedent`
          [
            'a',
            'b',


            'c',

            'd',


            'e'
          ]
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
              messageId: 'missedSpacingBetweenArraysMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            [
              a,


              b,
            ]
          `,
          code: dedent`
            [
              a,
              b,
            ]
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
              messageId: 'extraSpacingBetweenArraysMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            [
              a,
              b,
            ]
          `,
          code: dedent`
            [
              a,

              b,
            ]
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
            ]
          `,
          options: ignoreNewlineOptions,
        })

        await valid({
          code: dedent`
            [
              a,
              b,
            ]
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
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'a', // Comment after

            'b',
            'c'
          ]
        `,
        code: dedent`
          [
            'b',
            'a', // Comment after

            'c'
          ]
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
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          [
            'a',

            // Partition comment

            'b',
            'c',
          ]
        `,
        code: dedent`
          [
            'a',

            // Partition comment

            'c',
            'b',
          ]
        `,
        options: partitionOptions,
      })
    })
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('accepts sorted arrays', async () => {
      await valid({
        code: dedent`
          ['aaa', 'bb', 'c']
        `,
        options: [options],
      })
    })

    it('reports error when array is not sorted', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'aaa', left: 'c' },
          },
        ],
        output: dedent`
          ['aaa', 'bb', 'c']
        `,
        code: dedent`
          ['bb', 'c', 'aaa']
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
          ]
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
          ]
        `,
        code: dedent`
          [
            'aaaaa',
            'ccc',
            'bbbb',
            'dd',
            'e',
            ...other,
          ]
        `,
        errors: [
          {
            data: { right: 'bbbb', left: 'ccc' },
            messageId: 'unexpectedArraysOrder',
          },
        ],
        options: [options],
      })
    })

    it('does not sort spread elements', async () => {
      await valid({
        code: dedent`
          [
            ...aaa,
            ...bbbb,
            ...ccc,
          ]
        `,
        options: [options],
      })
    })

    it('treats spread elements as partition boundaries', async () => {
      await valid({
        code: dedent`
          [
            'aa',
            'b',
            ...spread1,
            'dd',
            'e',
            ...spread2,
            'gg',
            'h',
          ]
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          [
            'aa',
            'b',
            ...spread,
            'cc',
            'd',
          ]
        `,
        code: dedent`
          [
            'b',
            'aa',
            ...spread,
            'cc',
            'd',
          ]
        `,
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        options: [options],
      })
    })

    it('handles arrays with empty slots correctly', async () => {
      await valid({
        code: dedent`
          ['a', 'b', 'c',, 'd']
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
          )
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'bbb', left: 'cc' },
          },
        ],
        output: dedent`
          new Array(
            'aaaa',
            'bbb',
            'cc',
            'd',
          )
        `,
        code: dedent`
          new Array(
            'aaaa',
            'cc',
            'bbb',
            'd',
          )
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
            data: { right: 'aaaaa', left: 'dd' },
            messageId: 'unexpectedArraysOrder',
          },
          {
            messageId: 'unexpectedArraysOrder',
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
          ]
        `,
        code: dedent`
          [
            'dd',
            'aaaaa',

            'ccc',

            'e',
            'bbbb',
          ]
        `,
        options: partitionOptions,
      })
    })

    it('treats each newline-separated section as independent partition', async () => {
      let partitionWithGroupOptions = [
        {
          ...options,
          customGroups: [
            {
              elementNamePattern: '^top',
              groupName: 'top',
            },
          ],
          groups: ['top', 'unknown'],
          partitionByNewLine: true,
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top2',
              left: 'c',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top1',
              left: 'a',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'top2',
            'c',

            'top1',
            'a',
          ]
        `,
        code: dedent`
          [
            'c',
            'top2',

            'a',
            'top1',
          ]
        `,
        options: partitionWithGroupOptions,
      })
    })

    it('applies grouping rules within each partition separately', async () => {
      let partitionWithGroupOptions = [
        {
          ...options,
          partitionByNewLine: true,
        },
      ]

      await valid({
        code: dedent`
          [
            'a',
            'b',

            'c',
            'd',
          ]
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
          ]
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
          ]
        `,
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'bbb', left: 'd' },
          },
          {
            messageId: 'unexpectedArraysOrder',
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
          ]
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
          ]
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
          ]
        `,
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
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
          customGroups: [
            {
              elementNamePattern: '^top',
              groupName: 'top',
            },
          ],
          partitionByComment: '^Part:',
          groups: ['top', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top2',
              left: 'c',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top1',
              left: 'a',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'top2',
            'c',
            // Part: 1
            'top1',
            'a',
          ]
        `,
        code: dedent`
          [
            'c',
            'top2',
            // Part: 1
            'a',
            'top1',
          ]
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
            messageId: 'unexpectedArraysOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          [
            /* Comment */
            'aa',
            'b'
          ]
        `,
        code: dedent`
          [
            'b',
            /* Comment */
            'aa'
          ]
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
          ]
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
          ]
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
          [
            'b',
            // I am a partition comment because I don't have f o o
            'a'
          ]
        `,
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
            messageId: 'unexpectedArraysOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          [
            // Comment
            'aa',
            'b'
          ]
        `,
        code: dedent`
          [
            'b',
            // Comment
            'aa'
          ]
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
          ]
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
          [
            'c',
            /* b */
            'b',
            /* a */
            'a'
          ]
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
          [
            'b',
            /* I am a partition comment because I don't have f o o */
            'a'
          ]
        `,
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
          ]
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
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
        code: dedent`
          [
            '$aa',
            'bb',
            '$c',
          ]
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
          [
            'abc',
            'a$c',
          ]
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
          ]
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts single-line arrays correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          [
            aa, b
          ]
        `,
        code: dedent`
          [
            b, aa
          ]
        `,
        options: [options],
      })
    })

    it('handles trailing commas in single-line arrays', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          [
            aa, b,
          ]
        `,
        code: dedent`
          [
            b, aa,
          ]
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
                elementNamePattern: '^top',
                groupName: 'top',
              },
            ],
            groups: ['top', 'literal'],
          },
        ],
        errors: [
          {
            data: {
              leftGroup: 'literal',
              rightGroup: 'top',
              right: 'top1',
              left: 'c',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'top1',
            'aa',
            'c'
          ]
        `,
        code: dedent`
          [
            'c',
            'top1',
            'aa'
          ]
        `,
      })
    })

    it('applies custom groups based on element selectors', async () => {
      let customGroupOptions = [
        {
          customGroups: [
            {
              elementNamePattern: '^top',
              groupName: 'topElements',
            },
          ],
          groups: ['topElements', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'topElements',
              leftGroup: 'unknown',
              right: 'top1',
              left: 'b',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'top1',
            'b',
          ]
        `,
        code: dedent`
          [
            'b',
            'top1',
          ]
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
              messageId: 'unexpectedArraysGroupOrder',
            },
          ],
          output: dedent`
            [
              'helloLiteral',
              'a',
              'b',
            ]
          `,
          code: dedent`
            [
              'a',
              'b',
              'helloLiteral',
            ]
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
            messageId: 'unexpectedArraysOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            data: { right: 'dddd', left: 'ccc' },
            messageId: 'unexpectedArraysOrder',
          },
        ],
        output: dedent`
          [
            'dddd',
            'ccc',
            'bb',
            'a',
            ...m,
            'eee',
            'ff',
            'g',
            ...o,
            ...p,
          ]
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
          ]
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
            messageId: 'unexpectedArraysOrder',
          },
        ],
        output: dedent`
          [
            'fooBar',
            'fooZar',
          ]
        `,
        code: dedent`
          [
            'fooZar',
            'fooBar',
          ]
        `,
        options: fallbackSortOptions,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      let unsortedGroupOptions = [
        {
          customGroups: [
            {
              elementNamePattern: '^top',
              groupName: 'unsortedTop',
              type: 'unsorted',
            },
          ],
          groups: ['unsortedTop', 'unknown'],
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'unsortedTop',
              leftGroup: 'unknown',
              right: 'top3',
              left: 'm',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'top2',
            'top1',
            'top4',
            'top5',
            'top3',
            'm',
          ]
        `,
        code: dedent`
          [
            'top2',
            'top1',
            'top4',
            'top5',
            'm',
            'top3',
          ]
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
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'elementsIncludingFoo',
              leftGroup: 'unknown',
              right: 'bFoo',
              left: 'a',
            },
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'bFoo',
            'cFoo',
            'a',
          ]
        `,
        code: dedent`
          [
            'a',
            'bFoo',
            'cFoo',
          ]
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
          ]
        `,
      })
    })

    describe('useConfigurationIf.allNamesMatchPattern', () => {
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
                allNamesMatchPattern: '^[rgb]$',
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
                messageId: 'unexpectedArraysGroupOrder',
              },
              {
                data: {
                  rightGroup: 'r',
                  leftGroup: 'g',
                  right: 'r',
                  left: 'g',
                },
                messageId: 'unexpectedArraysGroupOrder',
              },
            ],
            output: dedent`
              [
                'r',
                'g',
                'b',
              ]
            `,
            code: dedent`
              [
                'b',
                'g',
                'r',
              ]
            `,
            options: conditionalOptions,
          })
        },
      )
    })

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
            messageId: 'extraSpacingBetweenArraysMembers',
          },
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'bbb', left: 'z' },
          },
        ],
        code: dedent`
          [
            'aaaa',


           'yy',
          'z',

              'bbb'
          ]
        `,
        output: dedent`
          [
            'aaaa',
           'bbb',
          'yy',

              'z'
          ]
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
            messageId: 'extraSpacingBetweenArraysMembers',
          },
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'yy', left: 'z' },
          },
          {
            messageId: 'missedSpacingBetweenArraysMembers',
            data: { right: 'bbb', left: 'yy' },
          },
        ],
        output: dedent`
          [
            'aaaa',

           'yy',
          'z',

              'bbb',
          ]
        `,
        code: dedent`
          [
            'aaaa',


           'z',
          'yy',
              'bbb',
          ]
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
            messageId: 'missedSpacingBetweenArraysMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenArraysMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenArraysMembers',
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
          ]
        `,
        code: dedent`
          [
            'a',
            'b',


            'c',

            'd',


            'e'
          ]
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
              messageId: 'missedSpacingBetweenArraysMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            [
              a,


              b,
            ]
          `,
          code: dedent`
            [
              a,
              b,
            ]
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
              messageId: 'extraSpacingBetweenArraysMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            [
              a,
              b,
            ]
          `,
          code: dedent`
            [
              a,

              b,
            ]
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
            ]
          `,
          options: ignoreNewlineOptions,
        })

        await valid({
          code: dedent`
            [
              a,
              b,
            ]
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
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'a', // Comment after

            'b',
            'c'
          ]
        `,
        code: dedent`
          [
            'b',
            'a', // Comment after

            'c'
          ]
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
          ]
        `,
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        code: dedent`
          [
            'aaa',

            // Partition comment

            'c',
            'bb',
          ]
        `,
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
          ]
        `,
        options: customAlphabetOptions,
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        output: dedent`
          [
            'a',
            'b',
            'c',
            'd',
          ]
        `,
        code: dedent`
          [
            'a',
            'c',
            'b',
            'd',
          ]
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
            messageId: 'unexpectedArraysOrder',
            data: { right: 'bb', left: 'b' },
          },
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'aa', left: 'a' },
          },
        ],
        output: dedent`
          [
            'aa',
            'bb',
            'a',
            'b',
          ]
        `,
        code: dedent`
          [
            'b',
            'bb',
            'a',
            'aa',
          ]
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
            messageId: 'unexpectedArraysOrder',
            data: { right: 'bb', left: 'b' },
          },
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'aa', left: 'a' },
          },
        ],
        output: dedent`
          [
            'aa',
            'bb',
            'a',
            'b',
          ]
        `,
        code: dedent`
          [
            'b',
            'bb',
            'a',
            'aa',
          ]
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
          ]
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
            messageId: 'unexpectedArraysGroupOrder',
          },
        ],
        output: dedent`
          [
            'ba',
            'bb',
            'ab',
            'aa',
          ]
        `,
        code: dedent`
          [
            'ab',
            'aa',
            'ba',
            'bb',
          ]
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
            messageId: 'missedSpacingBetweenArraysMembers',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          [
            'b',

            'a',
          ]
        `,
        code: dedent`
          [
            'b',
            'a',
          ]
        `,
        options: newlinesOptions,
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
      await valid({
        code: dedent`
          [
            'a',
            'b',
            'c',
            'd',
          ]
        `,
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'a', left: 'b' },
          },
          {
            messageId: 'unexpectedArraysOrder',
            data: { right: 'c', left: 'd' },
          },
        ],
        output: dedent`
          [
            'a',
            'b',
            'c',
            'd',
          ]
        `,
        code: dedent`
          [
            'b',
            'a',
            'd',
            'c',
          ]
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
          ]
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
        code: '[]',
      })

      await valid({
        code: "['a']",
      })
    })

    it('treats different quote styles as equivalent', async () => {
      await valid({
        code: dedent`
          ['a', "b", 'c']
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
          ]
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
          ]
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
            ]
          `,
        })

        await invalid({
          output: dedent`
            [
              'b',
              'c',
              // eslint-disable-next-line
              'a',
            ]
          `,
          code: dedent`
            [
              'c',
              'b',
              // eslint-disable-next-line
              'a',
            ]
          `,
          errors: [
            {
              messageId: 'unexpectedArraysOrder',
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
              messageId: 'unexpectedArraysOrder',
              data: { right: 'b', left: 'c' },
            },
          ],
          output: dedent`
            [
              'b',
              'c',
              'a', // eslint-disable-line
            ]
          `,
          code: dedent`
            [
              'c',
              'b',
              'a', // eslint-disable-line
            ]
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
            ]
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
            ]
          `,
          errors: [
            {
              messageId: 'unexpectedArraysOrder',
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
              // eslint-disable-next-line rule-to-test/sort-arrays
              'a',
            ]
          `,
          code: dedent`
            [
              'c',
              'b',
              // eslint-disable-next-line rule-to-test/sort-arrays
              'a',
            ]
          `,
          errors: [
            {
              messageId: 'unexpectedArraysOrder',
              data: { right: 'b', left: 'c' },
            },
          ],
          options: [{}],
        })
      })
    })

    describe('oxlint', () => {
      oxlintRuleTester.run('supports oxlint', {
        invalid: [
          {
            errors: [
              {
                messageId: 'unexpectedArraysOrder',
                data: { right: 'a', left: 'b' },
              },
            ],
            output: dedent`
              [
                'a',
                'b',
              ]
            `,
            code: dedent`
              [
                'b',
                'a',
              ]
            `,
            options: [{ type: 'alphabetical', order: 'asc' }],
          },
        ],
        valid: [
          {
            code: dedent`
              [
                'a',
                'b',
              ]
            `,
            options: [{ type: 'alphabetical', order: 'asc' }],
          },
        ],
      })
    })
  })
})
