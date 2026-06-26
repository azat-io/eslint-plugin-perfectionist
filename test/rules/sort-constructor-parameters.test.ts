import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import rule from '../../rules/sort-constructor-parameters'
import { Alphabet } from '../../utils/alphabet'

describe('sort-constructors-parameters', () => {
  let { invalid, valid } = createRuleTester({
    name: 'sort-constructors-parameters',
    parser: typescriptParser,
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      useConfigurationIf: {},
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('accepts sorted constructor parameters', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(aaa, bb, c) {}
          }
        `,
        options: [options],
      })
    })

    it('does not apply a fallback configuration', async () => {
      await valid({
        options: [
          {
            ...options,
            useConfigurationIf: {
              allNamesMatchPattern: 'noMatch',
            },
          },
        ],
        code: dedent`
          class Foo {
            constructor(b, c, a) {}
          }
        `,
      })
    })

    it('reports error when constructor is not sorted', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'aaa', left: 'c' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(aaa, bb, c) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(bb, c, aaa) {}
          }
        `,
        options: [options],
      })
    })

    it('preserves constructor structure when fixing sort order', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              a,
              b,
              c,
              d,
              e,
              ...other
            ) {}
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          class Foo {
            constructor(
              a,
              b,
              c,
              d,
              e,
              ...other
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,
              c,
              b,
              d,
              e,
              ...other
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [options],
      })
    })

    it('does not sort non-constructor methods', async () => {
      await valid({
        code: dedent`
          class Foo {
            myMethod(b, a) {}
          }
        `,
        options: [options],
      })
    })

    it('sorts TypeScript parameter properties', async () => {
      await invalid({
        output: dedent`
          class Foo {
            constructor(
              private aService: AService,
              private bService: BService,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              private bService: BService,
              private aService: AService,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'aService', left: 'bService' },
          },
        ],
        options: [options],
      })
    })

    it('sorts parameters with default values', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(a = 'x', b = 'y') {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(b = 'y', a = 'x') {}
          }
        `,
        options: [options],
      })
    })

    it('sorts destructured parameters', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: '{ aaa }', left: '{ bb }' },
          },
        ],
        output: dedent`
          class Foo {
            constructor({ aaa }, { bb }) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor({ bb }, { aaa }) {}
          }
        `,
        options: [options],
      })
    })

    it('does not sort rest elements', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              a,
              b,
              ...rest
            ) {}
          }
        `,
        options: [options],
      })
    })

    it('treats rest elements as partition boundaries', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              a,
              b,
              ...rest
            ) {}
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          class Foo {
            constructor(
              a,
              b,
              ...rest
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              a,
              ...rest
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
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
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'a', left: 'd' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'b', left: 'e' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              a,
              d,

              c,

              b,
              e,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              d,
              a,

              c,

              e,
              b,
            ) {}
          }
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
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top1',
              left: 'a',
            },
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              top2,
              c,

              top1,
              a,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              c,
              top2,

              a,
              top1,
            ) {}
          }
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
          class Foo {
            constructor(
              a,
              b,

              c,
              d,
            ) {}
          }
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
          class Foo {
            constructor(
              // Part: A
              // Not partition comment
              bbb,
              cc,
              d,
              // Part: B
              aaaa,
              e,
              // Part: C
              // Not partition comment
              fff,
              gg,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              // Part: A
              cc,
              d,
              // Not partition comment
              bbb,
              // Part: B
              aaaa,
              e,
              // Part: C
              gg,
              // Not partition comment
              fff,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'bbb', left: 'd' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'fff', left: 'gg' },
          },
        ],
        options: partitionOptions,
      })
    })

    it('treats every comment as partition boundary when set to true', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              // Comment
              bb,
              // Other comment
              a,
            ) {}
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

    it('supports multiple partition comment patterns', async () => {
      let multiplePatternOptions = [
        {
          ...options,
          partitionByComment: ['Partition Comment', 'Part:', 'Other'],
        },
      ]

      await invalid({
        output: dedent`
          class Foo {
            constructor(
              /* Partition Comment */
              // Part: A
              d,
              // Part: B
              aaa,
              bb,
              c,
              /* Other */
              e,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              /* Partition Comment */
              // Part: A
              d,
              // Part: B
              aaa,
              c,
              bb,
              /* Other */
              e,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
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
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top1',
              left: 'a',
            },
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              top2,
              c,
              // Part: 1
              top1,
              a,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              c,
              top2,
              // Part: 1
              a,
              top1,
            ) {}
          }
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
        output: dedent`
          class Foo {
            constructor(
              /* Comment */
              a,
              b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              /* Comment */
              a,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: lineCommentsOnlyOptions,
      })
    })

    it('uses line comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              b,
              // Comment
              a,
            ) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              c,
              // b
              b,
              // a
              a,
            ) {}
          }
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
          class Foo {
            constructor(
              b,
              // I am a partition comment because I don't have f o o
              a,
            ) {}
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
        output: dedent`
          class Foo {
            constructor(
              // Comment
              a,
              b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              // Comment
              a,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: blockCommentsOnlyOptions,
      })
    })

    it('uses block comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              b,
              /* Comment */
              a,
            ) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              c,
              /* b */
              b,
              /* a */
              a,
            ) {}
          }
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
          class Foo {
            constructor(
              b,
              /* I am a partition comment because I don't have f o o */
              a,
            ) {}
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

    it('supports regex patterns for partition comments', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              e,
              f,
              // I am a partition comment because I don't have f o o
              a,
              b,
            ) {}
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

    it('ignores special characters at start when trimming', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              $a,
              b,
              $c,
            ) {}
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

    it('ignores special characters completely when removing', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              ab,
              a$c,
            ) {}
          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
      })
    })

    it('sorts parameters according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              你好,
              世界,
              a,
              A,
              b,
              B,
            ) {}
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts single-line constructor parameters correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              a, b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b, a,
            ) {}
          }
        `,
        options: [options],
      })
    })

    it('handles trailing commas in constructor parameters', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              a, b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b, a,
            ) {}
          }
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
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'missedSpacingBetweenConstructorParametersMembers',
            data: { right: 'b', left: 'a' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              b,

              a,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,
              b,
            ) {}
          }
        `,
      })
    })

    it('enforces custom group ordering', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'parameter',
              rightGroup: 'top',
              right: 'top1',
              left: 'c',
            },
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^top',
                groupName: 'top',
              },
            ],
            groups: ['top', 'parameter'],
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              top1,
              a,
              c,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              c,
              top1,
              a,
            ) {}
          }
        `,
      })
    })

    it('applies custom groups based on element selectors', async () => {
      let customGroupOptions = [
        {
          customGroups: [
            {
              elementNamePattern: '^top',
              groupName: 'topParams',
            },
          ],
          groups: ['topParams', 'unknown'],
          useConfigurationIf: {},
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'topParams',
              leftGroup: 'unknown',
              right: 'top1',
              left: 'b',
            },
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              top1,
              b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              top1,
            ) {}
          }
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
                groupName: 'parametersStartingWithHello',
                selector: 'parameter',
                elementNamePattern,
              },
            ],
            groups: ['parametersStartingWithHello', 'unknown'],
            useConfigurationIf: {},
          },
        ]

        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'parametersStartingWithHello',
                leftGroup: 'unknown',
                right: 'helloParam',
                left: 'b',
              },
              messageId: 'unexpectedConstructorParametersGroupOrder',
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                helloParam,
                a,
                b,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                a,
                b,
                helloParam,
              ) {}
            }
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
              groupName: 'reversedParametersByLineLength',
              selector: 'parameter',
              type: 'line-length',
              order: 'desc',
            },
          ],
          groups: ['reversedParametersByLineLength', 'unknown'],
          useConfigurationIf: {},
          type: 'alphabetical',
          order: 'asc',
        },
      ]

      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'dddd', left: 'ccc' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              dddd,
              ccc,
              bb,
              a,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,
              bb,
              ccc,
              dddd,
            ) {}
          }
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
          useConfigurationIf: {},
          type: 'alphabetical',
          groups: ['foo'],
          order: 'asc',
        },
      ]

      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'fooBar', left: 'fooZar' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              fooBar,
              fooZar,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              fooZar,
              fooBar,
            ) {}
          }
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
          useConfigurationIf: {},
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
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              top2,
              top1,
              top4,
              top5,
              top3,
              m,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              top2,
              top1,
              top4,
              top5,
              m,
              top3,
            ) {}
          }
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
              groupName: 'parametersIncludingFoo',
            },
          ],
          groups: ['parametersIncludingFoo', 'unknown'],
          useConfigurationIf: {},
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'parametersIncludingFoo',
              leftGroup: 'unknown',
              right: 'bFoo',
              left: 'a',
            },
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              bFoo,
              cFoo,
              a,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,
              bFoo,
              cFoo,
            ) {}
          }
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
                groupName: 'parametersWithoutFoo',
              },
            ],
            groups: ['unknown', 'parametersWithoutFoo'],
            useConfigurationIf: {},
            type: 'alphabetical',
          },
        ],
        code: dedent`
          class Foo {
            constructor(
              iHaveFooInMyName,
              meTooIHaveFoo,
              a,
              b,
            ) {}
          }
        `,
      })
    })

    describe('dependency detection', () => {
      it('detects dependencies between constructor parameters', async () => {
        await invalid({
          output: dedent`
            class Foo {
              constructor(
                b,
                a = b,
                c,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                c,
                b,
                a = b,
              ) {}
            }
          `,
          errors: [
            {
              messageId: 'unexpectedConstructorParametersOrder',
              data: { right: 'b', left: 'c' },
            },
          ],
          options: [options],
        })

        await invalid({
          errors: [
            {
              messageId: 'unexpectedConstructorParametersDependencyOrder',
              data: { nodeDependentOnRight: 'a', right: 'c' },
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                c,
                a = c,
                b,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                a = c,
                b,
                c,
              ) {}
            }
          `,
          options: [options],
        })
      })

      it('detects dependencies in template literal expressions', async () => {
        await valid({
          code: dedent`
            class Foo {
              constructor(
                b,
                a = \`\${b}\`,
              ) {}
            }
          `,
          options: [options],
        })
      })

      it('detects dependencies in objects', async () => {
        await valid({
          code: dedent`
            class Foo {
              constructor(
                b,
                a = f({ key: b }),
              ) {}
            }
          `,
          options: [options],
        })

        await valid({
          code: dedent`
            class Foo {
              constructor(
                b,
                a = f({ [b]: 1 }),
              ) {}
            }
          `,
          options: [options],
        })
      })

      it('detects dependencies in arrays', async () => {
        await valid({
          code: dedent`
            class Foo {
              constructor(
                b,
                a = [b][0],
              ) {}
            }
          `,
          options: [options],
        })

        await valid({
          code: dedent`
            class Foo {
              constructor(
                b,
                a = [...[b]][0],
              ) {}
            }
          `,
          options: [options],
        })
      })

      it('detects dependencies in function calls', async () => {
        await valid({
          code: dedent`
            class Foo {
              constructor(
                b,
                a = Math.max(b, 0),
              ) {}
            }
          `,
          options: [options],
        })
      })

      it('detects dependencies in conditional expressions', async () => {
        await valid({
          code: dedent`
            class Foo {
              constructor(
                b,
                a = condition ? b : 0,
              ) {}
            }
          `,
          options: [options],
        })

        await valid({
          code: dedent`
            class Foo {
              constructor(
                b,
                a = condition ? 0 : b,
              ) {}
            }
          `,
          options: [options],
        })
      })

      it('ignores circular dependencies when sorting', async () => {
        await invalid({
          output: dedent`
            class Foo {
              constructor(
                a,
                b = f,
                c,
                d = b,
                e,
                f = d,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                b = f,
                a,
                c,
                d = b,
                e,
                f = d,
              ) {}
            }
          `,
          errors: [
            {
              messageId: 'unexpectedConstructorParametersOrder',
              data: { right: 'a', left: 'b' },
            },
          ],
          options: [options],
        })
      })

      it('prioritizes dependencies over partition comments', async () => {
        await invalid({
          errors: [
            {
              messageId: 'unexpectedConstructorParametersDependencyOrder',
              data: { nodeDependentOnRight: 'b', right: 'a' },
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                a,
                // Part: 1
                b = a,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                b = a,
                // Part: 1
                a,
              ) {}
            }
          `,
          options: [
            {
              ...options,
              partitionByComment: '^Part',
            },
          ],
        })
      })

      it('prioritizes dependencies over partition by new line', async () => {
        await invalid({
          errors: [
            {
              messageId: 'unexpectedConstructorParametersDependencyOrder',
              data: { nodeDependentOnRight: 'b', right: 'a' },
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                a,

                b = a,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                b = a,

                a,
              ) {}
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

      it('prioritizes dependencies over custom groups', async () => {
        await valid({
          options: [
            {
              ...options,
              customGroups: [
                {
                  groupName: 'parametersStartingWithA',
                  elementNamePattern: 'a',
                },
                {
                  groupName: 'parametersStartingWithB',
                  elementNamePattern: 'b',
                },
              ],
              groups: ['parametersStartingWithA', 'parametersStartingWithB'],
            },
          ],
          code: dedent`
            class Foo {
              constructor(
                b,
                a = b,
              ) {}
            }
          `,
        })
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
                messageId: 'unexpectedConstructorParametersGroupOrder',
              },
              {
                data: {
                  rightGroup: 'r',
                  leftGroup: 'g',
                  right: 'r',
                  left: 'g',
                },
                messageId: 'unexpectedConstructorParametersGroupOrder',
              },
            ],
            output: dedent`
              class Foo {
                constructor(
                  r,
                  g,
                  b,
                ) {}
              }
            `,
            code: dedent`
              class Foo {
                constructor(
                  b,
                  g,
                  r,
                ) {}
              }
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
                matchesAstSelector: 'ExpressionStatement',
              },
              type: 'unsorted',
            },
            {
              useConfigurationIf: {},
            },
          ],
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedConstructorParametersOrder',
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                a,
                b,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                b,
                a,
              ) {}
            }
          `,
        })
      })

      it('applies config when selector matches the sorted node type', async () => {
        await valid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'MethodDefinition',
              },
              type: 'unsorted',
            },
          ],
          code: dedent`
            class Foo {
              constructor(
                b,
                a,
              ) {}
            }
          `,
        })

        await valid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'MethodDefinition',
              },
              type: 'unsorted',
            },
          ],
          code: dedent`
            class Foo {
              constructor(
                b,
                a,
              ) {}
            }
          `,
        })
      })

      it('falls through to next matching config when not matching', async () => {
        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'ClassBody > MethodDefinition',
                allNamesMatchPattern: '^[ac]$',
              },
              type: 'unsorted',
            },
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'MethodDefinition',
              },
              type: 'alphabetical',
            },
          ],
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedConstructorParametersOrder',
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                a,
                b,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                b,
                a,
              ) {}
            }
          `,
        })

        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'MethodDefinition',
                allNamesMatchPattern: '^[ac]$',
              },
              type: 'unsorted',
            },
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'MethodDefinition',
              },
              type: 'alphabetical',
            },
          ],
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedConstructorParametersOrder',
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                a,
                b,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                b,
                a,
              ) {}
            }
          `,
        })

        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'MethodDefinition',
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
          ],
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'unexpectedConstructorParametersOrder',
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                b,
                a,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                a,
                b,
              ) {}
            }
          `,
        })
      })

      it('applies first matching option when selectors overlap', async () => {
        await valid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'MethodDefinition',
              },
              type: 'unsorted',
            },
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'ClassBody > MethodDefinition',
              },
              type: 'alphabetical',
            },
          ],
          code: dedent`
            class Foo {
              constructor(
                b,
                a,
              ) {}
            }
          `,
        })

        await invalid({
          options: [
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'MethodDefinition',
              },
              type: 'alphabetical',
            },
            {
              ...options,
              useConfigurationIf: {
                matchesAstSelector: 'ClassBody > MethodDefinition',
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
              messageId: 'unexpectedConstructorParametersOrder',
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                a,
                b,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                b,
                a,
              ) {}
            }
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
                matchesAstSelector: 'MethodDefinition',
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
              messageId: 'unexpectedConstructorParametersOrder',
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                a,
                b,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                b,
                a,
              ) {}
            }
          `,
        })
      })
    })

    it('removes newlines between and inside groups by default when "newlinesBetween" is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: 'extraSpacingBetweenConstructorParametersMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenConstructorParametersMembers',
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
          class Foo {
            constructor(
              a,


             y,
            z,

                b,
            ) {}
          }
        `,
        output: dedent`
          class Foo {
            constructor(
              a,
             b,
            y,
                z,
            ) {}
          }
        `,
      })
    })

    it('removes newlines inside groups when newlinesInside is 0', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'b', left: 'z' },
          },
          {
            messageId: 'extraSpacingBetweenConstructorParametersMembers',
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
            newlinesInside: 0,
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              a,


             b,
            y,
                z,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,


             y,
            z,

                b,
            ) {}
          }
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
            messageId: 'extraSpacingBetweenConstructorParametersMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'b', left: 'z' },
          },
        ],
        code: dedent`
          class Foo {
            constructor(
              a,


             y,
            z,

                b,
            ) {}
          }
        `,
        output: dedent`
          class Foo {
            constructor(
              a,
             b,
            y,

                z,
            ) {}
          }
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
            messageId: 'extraSpacingBetweenConstructorParametersMembers',
            data: { right: 'z', left: 'a' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'y', left: 'z' },
          },
          {
            messageId: 'missedSpacingBetweenConstructorParametersMembers',
            data: { right: 'b', left: 'y' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              a,

             y,
            z,

                b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,


             z,
            y,
                b,
            ) {}
          }
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
            messageId: 'missedSpacingBetweenConstructorParametersMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenConstructorParametersMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenConstructorParametersMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              a,

              b,

              c,
              d,


              e,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,
              b,


              c,

              d,


              e,
            ) {}
          }
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
              messageId: 'missedSpacingBetweenConstructorParametersMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                a,


                b,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                a,
                b,
              ) {}
            }
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
              messageId: 'extraSpacingBetweenConstructorParametersMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                a,
                b,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                a,

                b,
              ) {}
            }
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
            class Foo {
              constructor(
                a,

                b,
              ) {}
            }
          `,
          options: ignoreNewlineOptions,
        })

        await valid({
          code: dedent`
            class Foo {
              constructor(
                a,
                b,
              ) {}
            }
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
          useConfigurationIf: {},
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
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              a, // Comment after

              b,
              c,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              a, // Comment after

              c,
            ) {}
          }
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
          class Foo {
            constructor(
              a,

              // Partition comment

              b,
              c,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,

              // Partition comment

              c,
              b,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: partitionOptions,
      })
    })

    it('sorts decorators correctly', async () => {
      await invalid({
        output: dedent`
          class Foo {
            constructor(
              @A(a)
              private readonly a,

              @B b
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              @B b,

              @A(a)
              private readonly a
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [options],
      })

      await invalid({
        output: dedent`
          class Foo {
            constructor(
              // Comment above @A
              @A
              /* Comment below @A */
              private readonly a,

              /* Comment
               * above
               * @B
               */
              @B b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              /* Comment
               * above
               * @B
               */
              @B b,

              // Comment above @A
              @A
              /* Comment below @A */
              private readonly a,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: [options],
      })
    })
  })

  describe('natural', () => {
    let options = {
      useConfigurationIf: {},
      type: 'natural',
      order: 'asc',
    } as const

    it('accepts sorted constructor parameters', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(aaa, bb, c) {}
          }
        `,
        options: [options],
      })
    })

    it('reports error when constructor is not sorted', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'aaa', left: 'c' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(aaa, bb, c) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(bb, c, aaa) {}
          }
        `,
        options: [options],
      })
    })

    it('preserves constructor structure when fixing sort order', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              a,
              b,
              c,
              d,
              e,
              ...other
            ) {}
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          class Foo {
            constructor(
              a,
              b,
              c,
              d,
              e,
              ...other
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,
              c,
              b,
              d,
              e,
              ...other
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: [options],
      })
    })

    it('does not sort rest elements', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              a,
              b,
              ...rest
            ) {}
          }
        `,
        options: [options],
      })
    })

    it('treats rest elements as partition boundaries', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              a,
              b,
              ...rest
            ) {}
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          class Foo {
            constructor(
              a,
              b,
              ...rest
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              a,
              ...rest
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
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
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'a', left: 'd' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'b', left: 'e' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              a,
              d,

              c,

              b,
              e,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              d,
              a,

              c,

              e,
              b,
            ) {}
          }
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
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top1',
              left: 'a',
            },
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              top2,
              c,

              top1,
              a,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              c,
              top2,

              a,
              top1,
            ) {}
          }
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
          class Foo {
            constructor(
              a,
              b,

              c,
              d,
            ) {}
          }
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
          class Foo {
            constructor(
              // Part: A
              // Not partition comment
              bbb,
              cc,
              d,
              // Part: B
              aaaa,
              e,
              // Part: C
              // Not partition comment
              fff,
              gg,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              // Part: A
              cc,
              d,
              // Not partition comment
              bbb,
              // Part: B
              aaaa,
              e,
              // Part: C
              gg,
              // Not partition comment
              fff,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'bbb', left: 'd' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'fff', left: 'gg' },
          },
        ],
        options: partitionOptions,
      })
    })

    it('treats every comment as partition boundary when set to true', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              // Comment
              bb,
              // Other comment
              a,
            ) {}
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

    it('supports multiple partition comment patterns', async () => {
      let multiplePatternOptions = [
        {
          ...options,
          partitionByComment: ['Partition Comment', 'Part:', 'Other'],
        },
      ]

      await invalid({
        output: dedent`
          class Foo {
            constructor(
              /* Partition Comment */
              // Part: A
              d,
              // Part: B
              aaa,
              bb,
              c,
              /* Other */
              e,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              /* Partition Comment */
              // Part: A
              d,
              // Part: B
              aaa,
              c,
              bb,
              /* Other */
              e,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
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
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top1',
              left: 'a',
            },
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              top2,
              c,
              // Part: 1
              top1,
              a,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              c,
              top2,
              // Part: 1
              a,
              top1,
            ) {}
          }
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
        output: dedent`
          class Foo {
            constructor(
              /* Comment */
              a,
              b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              /* Comment */
              a,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: lineCommentsOnlyOptions,
      })
    })

    it('uses line comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              b,
              // Comment
              a,
            ) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              c,
              // b
              b,
              // a
              a,
            ) {}
          }
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
          class Foo {
            constructor(
              b,
              // I am a partition comment because I don't have f o o
              a,
            ) {}
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
        output: dedent`
          class Foo {
            constructor(
              // Comment
              a,
              b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              // Comment
              a,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        options: blockCommentsOnlyOptions,
      })
    })

    it('uses block comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              b,
              /* Comment */
              a,
            ) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              c,
              /* b */
              b,
              /* a */
              a,
            ) {}
          }
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
          class Foo {
            constructor(
              b,
              /* I am a partition comment because I don't have f o o */
              a,
            ) {}
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

    it('supports regex patterns for partition comments', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              e,
              f,
              // I am a partition comment because I don't have f o o
              a,
              b,
            ) {}
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

    it('ignores special characters at start when trimming', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              $a,
              b,
              $c,
            ) {}
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

    it('ignores special characters completely when removing', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              ab,
              a$c,
            ) {}
          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
      })
    })

    it('sorts parameters according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              你好,
              世界,
              a,
              A,
              b,
              B,
            ) {}
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts single-line constructor parameters correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              a, b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b, a,
            ) {}
          }
        `,
        options: [options],
      })
    })

    it('handles trailing commas in constructor parameters', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              a, b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b, a,
            ) {}
          }
        `,
        options: [options],
      })
    })

    it('enforces custom group ordering', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'parameter',
              rightGroup: 'top',
              right: 'top1',
              left: 'c',
            },
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^top',
                groupName: 'top',
              },
            ],
            groups: ['top', 'parameter'],
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              top1,
              a,
              c,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              c,
              top1,
              a,
            ) {}
          }
        `,
      })
    })

    it('applies custom groups based on element selectors', async () => {
      let customGroupOptions = [
        {
          customGroups: [
            {
              elementNamePattern: '^top',
              groupName: 'topParams',
            },
          ],
          groups: ['topParams', 'unknown'],
          useConfigurationIf: {},
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'topParams',
              leftGroup: 'unknown',
              right: 'top1',
              left: 'b',
            },
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              top1,
              b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              top1,
            ) {}
          }
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
                groupName: 'parametersStartingWithHello',
                selector: 'parameter',
                elementNamePattern,
              },
            ],
            groups: ['parametersStartingWithHello', 'unknown'],
            useConfigurationIf: {},
          },
        ]

        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'parametersStartingWithHello',
                leftGroup: 'unknown',
                right: 'helloParam',
                left: 'b',
              },
              messageId: 'unexpectedConstructorParametersGroupOrder',
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                helloParam,
                a,
                b,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                a,
                b,
                helloParam,
              ) {}
            }
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
              groupName: 'reversedParametersByLineLength',
              selector: 'parameter',
              type: 'line-length',
              order: 'desc',
            },
          ],
          groups: ['reversedParametersByLineLength', 'unknown'],
          useConfigurationIf: {},
          type: 'alphabetical',
          order: 'asc',
        },
      ]

      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'dddd', left: 'ccc' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              dddd,
              ccc,
              bb,
              a,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,
              bb,
              ccc,
              dddd,
            ) {}
          }
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
          useConfigurationIf: {},
          type: 'alphabetical',
          groups: ['foo'],
          order: 'asc',
        },
      ]

      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'fooBar', left: 'fooZar' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              fooBar,
              fooZar,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              fooZar,
              fooBar,
            ) {}
          }
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
          useConfigurationIf: {},
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
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              top2,
              top1,
              top4,
              top5,
              top3,
              m,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              top2,
              top1,
              top4,
              top5,
              m,
              top3,
            ) {}
          }
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
              groupName: 'parametersIncludingFoo',
            },
          ],
          groups: ['parametersIncludingFoo', 'unknown'],
          useConfigurationIf: {},
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'parametersIncludingFoo',
              leftGroup: 'unknown',
              right: 'bFoo',
              left: 'a',
            },
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              bFoo,
              cFoo,
              a,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,
              bFoo,
              cFoo,
            ) {}
          }
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
                groupName: 'parametersWithoutFoo',
              },
            ],
            groups: ['unknown', 'parametersWithoutFoo'],
            useConfigurationIf: {},
            type: 'alphabetical',
          },
        ],
        code: dedent`
          class Foo {
            constructor(
              iHaveFooInMyName,
              meTooIHaveFoo,
              a,
              b,
            ) {}
          }
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
                messageId: 'unexpectedConstructorParametersGroupOrder',
              },
              {
                data: {
                  rightGroup: 'r',
                  leftGroup: 'g',
                  right: 'r',
                  left: 'g',
                },
                messageId: 'unexpectedConstructorParametersGroupOrder',
              },
            ],
            output: dedent`
              class Foo {
                constructor(
                  r,
                  g,
                  b,
                ) {}
              }
            `,
            code: dedent`
              class Foo {
                constructor(
                  b,
                  g,
                  r,
                ) {}
              }
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
            messageId: 'extraSpacingBetweenConstructorParametersMembers',
            data: { right: 'y', left: 'a' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'b', left: 'z' },
          },
        ],
        code: dedent`
          class Foo {
            constructor(
              a,


             y,
            z,

                b,
            ) {}
          }
        `,
        output: dedent`
          class Foo {
            constructor(
              a,
             b,
            y,

                z,
            ) {}
          }
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
            messageId: 'extraSpacingBetweenConstructorParametersMembers',
            data: { right: 'z', left: 'a' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'y', left: 'z' },
          },
          {
            messageId: 'missedSpacingBetweenConstructorParametersMembers',
            data: { right: 'b', left: 'y' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              a,

             y,
            z,

                b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,


             z,
            y,
                b,
            ) {}
          }
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
            messageId: 'missedSpacingBetweenConstructorParametersMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenConstructorParametersMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenConstructorParametersMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              a,

              b,

              c,
              d,


              e,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,
              b,


              c,

              d,


              e,
            ) {}
          }
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
              messageId: 'missedSpacingBetweenConstructorParametersMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                a,


                b,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                a,
                b,
              ) {}
            }
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
              messageId: 'extraSpacingBetweenConstructorParametersMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                a,
                b,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                a,

                b,
              ) {}
            }
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
            class Foo {
              constructor(
                a,

                b,
              ) {}
            }
          `,
          options: ignoreNewlineOptions,
        })

        await valid({
          code: dedent`
            class Foo {
              constructor(
                a,
                b,
              ) {}
            }
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
          useConfigurationIf: {},
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
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              a, // Comment after

              b,
              c,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              a, // Comment after

              c,
            ) {}
          }
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
          class Foo {
            constructor(
              a,

              // Partition comment

              b,
              c,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,

              // Partition comment

              c,
              b,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
        options: partitionOptions,
      })
    })
  })

  describe('line-length', () => {
    let options = {
      useConfigurationIf: {},
      type: 'line-length',
      order: 'desc',
    } as const

    it('accepts sorted constructor parameters', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(aaa, bb, c) {}
          }
        `,
        options: [options],
      })
    })

    it('reports error when constructor is not sorted', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'aaa', left: 'c' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(aaa, bb, c) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(bb, c, aaa) {}
          }
        `,
        options: [options],
      })
    })

    it('preserves constructor structure when fixing sort order', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              aaaaa,
              bbbb,
              ccc,
              dd,
              e,
              ...other
            ) {}
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          class Foo {
            constructor(
              aaaaa,
              bbbb,
              ccc,
              dd,
              e,
              ...other
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              aaaaa,
              ccc,
              bbbb,
              dd,
              e,
              ...other
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'bbbb', left: 'ccc' },
          },
        ],
        options: [options],
      })
    })

    it('does not sort rest elements', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              a,
              b,
              ...rest
            ) {}
          }
        `,
        options: [options],
      })
    })

    it('treats rest elements as partition boundaries', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              aa,
              b,
              ...rest
            ) {}
          }
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          class Foo {
            constructor(
              aa,
              b,
              ...rest
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              aa,
              ...rest
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
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
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'aaaaa', left: 'dd' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'bbbb', left: 'e' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              aaaaa,
              dd,

              ccc,

              bbbb,
              e,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              dd,
              aaaaa,

              ccc,

              e,
              bbbb,
            ) {}
          }
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
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top1',
              left: 'a',
            },
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              top2,
              c,

              top1,
              a,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              c,
              top2,

              a,
              top1,
            ) {}
          }
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
          class Foo {
            constructor(
              a,
              b,

              c,
              d,
            ) {}
          }
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
          class Foo {
            constructor(
              // Part: A
              // Not partition comment
              bbb,
              cc,
              d,
              // Part: B
              aaaa,
              e,
              // Part: C
              // Not partition comment
              fff,
              gg,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              // Part: A
              cc,
              d,
              // Not partition comment
              bbb,
              // Part: B
              aaaa,
              e,
              // Part: C
              gg,
              // Not partition comment
              fff,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'bbb', left: 'd' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'fff', left: 'gg' },
          },
        ],
        options: partitionOptions,
      })
    })

    it('treats every comment as partition boundary when set to true', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              // Comment
              bb,
              // Other comment
              a,
            ) {}
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

    it('supports multiple partition comment patterns', async () => {
      let multiplePatternOptions = [
        {
          ...options,
          partitionByComment: ['Partition Comment', 'Part:', 'Other'],
        },
      ]

      await invalid({
        output: dedent`
          class Foo {
            constructor(
              /* Partition Comment */
              // Part: A
              d,
              // Part: B
              aaa,
              bb,
              c,
              /* Other */
              e,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              /* Partition Comment */
              // Part: A
              d,
              // Part: B
              aaa,
              c,
              bb,
              /* Other */
              e,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
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
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'top1',
              left: 'a',
            },
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              top2,
              c,
              // Part: 1
              top1,
              a,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              c,
              top2,
              // Part: 1
              a,
              top1,
            ) {}
          }
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
        output: dedent`
          class Foo {
            constructor(
              /* Comment */
              aa,
              b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              /* Comment */
              aa,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        options: lineCommentsOnlyOptions,
      })
    })

    it('uses line comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              b,
              // Comment
              a,
            ) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              line: true,
            },
          },
        ],
      })
    })

    it('matches specific line comment patterns', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              c,
              // b
              b,
              // a
              a,
            ) {}
          }
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
          class Foo {
            constructor(
              b,
              // I am a partition comment because I don't have f o o
              a,
            ) {}
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
        output: dedent`
          class Foo {
            constructor(
              // Comment
              aa,
              b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              // Comment
              aa,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        options: blockCommentsOnlyOptions,
      })
    })

    it('uses block comments as partition boundaries', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              b,
              /* Comment */
              a,
            ) {}
          }
        `,
        options: [
          {
            ...options,
            partitionByComment: {
              block: true,
            },
          },
        ],
      })
    })

    it('matches specific block comment patterns', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              c,
              /* b */
              b,
              /* a */
              a,
            ) {}
          }
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
          class Foo {
            constructor(
              b,
              /* I am a partition comment because I don't have f o o */
              a,
            ) {}
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

    it('supports regex patterns for partition comments', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              e,
              f,
              // I am a partition comment because I don't have f o o
              a,
              b,
            ) {}
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

    it('ignores special characters at start when trimming', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              $aa,
              bb,
              $c,
            ) {}
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

    it('ignores special characters completely when removing', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              abc,
              a$c,
            ) {}
          }
        `,
        options: [
          {
            ...options,
            specialCharacters: 'remove',
          },
        ],
      })
    })

    it('sorts parameters according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              你好,
              世界,
              a,
              A,
              b,
              B,
            ) {}
          }
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts single-line constructor parameters correctly', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              aa, b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b, aa,
            ) {}
          }
        `,
        options: [options],
      })
    })

    it('handles trailing commas in constructor parameters', async () => {
      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'aa', left: 'b' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              aa, b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b, aa,
            ) {}
          }
        `,
        options: [options],
      })
    })

    it('enforces custom group ordering', async () => {
      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'parameter',
              rightGroup: 'top',
              right: 'top1',
              left: 'c',
            },
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            customGroups: [
              {
                elementNamePattern: '^top',
                groupName: 'top',
              },
            ],
            groups: ['top', 'parameter'],
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              top1,
              aa,
              c,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              c,
              top1,
              aa,
            ) {}
          }
        `,
      })
    })

    it('applies custom groups based on element selectors', async () => {
      let customGroupOptions = [
        {
          customGroups: [
            {
              elementNamePattern: '^top',
              groupName: 'topParams',
            },
          ],
          groups: ['topParams', 'unknown'],
          useConfigurationIf: {},
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'topParams',
              leftGroup: 'unknown',
              right: 'top1',
              left: 'b',
            },
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              top1,
              b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              top1,
            ) {}
          }
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
                groupName: 'parametersStartingWithHello',
                selector: 'parameter',
                elementNamePattern,
              },
            ],
            groups: ['parametersStartingWithHello', 'unknown'],
            useConfigurationIf: {},
          },
        ]

        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'parametersStartingWithHello',
                leftGroup: 'unknown',
                right: 'helloParam',
                left: 'b',
              },
              messageId: 'unexpectedConstructorParametersGroupOrder',
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                helloParam,
                a,
                b,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                a,
                b,
                helloParam,
              ) {}
            }
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
              groupName: 'reversedParametersByLineLength',
              selector: 'parameter',
              type: 'line-length',
              order: 'desc',
            },
          ],
          groups: ['reversedParametersByLineLength', 'unknown'],
          useConfigurationIf: {},
          type: 'alphabetical',
          order: 'asc',
        },
      ]

      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'bb', left: 'a' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'ccc', left: 'bb' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'dddd', left: 'ccc' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              dddd,
              ccc,
              bb,
              a,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,
              bb,
              ccc,
              dddd,
            ) {}
          }
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
          useConfigurationIf: {},
          type: 'alphabetical',
          groups: ['foo'],
          order: 'asc',
        },
      ]

      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'fooBar', left: 'fooZar' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              fooBar,
              fooZar,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              fooZar,
              fooBar,
            ) {}
          }
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
          useConfigurationIf: {},
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
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              top2,
              top1,
              top4,
              top5,
              top3,
              m,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              top2,
              top1,
              top4,
              top5,
              m,
              top3,
            ) {}
          }
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
              groupName: 'parametersIncludingFoo',
            },
          ],
          groups: ['parametersIncludingFoo', 'unknown'],
          useConfigurationIf: {},
        },
      ]

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'parametersIncludingFoo',
              leftGroup: 'unknown',
              right: 'bFoo',
              left: 'a',
            },
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              bFoo,
              cFoo,
              a,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,
              bFoo,
              cFoo,
            ) {}
          }
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
                groupName: 'parametersWithoutFoo',
              },
            ],
            groups: ['unknown', 'parametersWithoutFoo'],
            useConfigurationIf: {},
            type: 'alphabetical',
          },
        ],
        code: dedent`
          class Foo {
            constructor(
              iHaveFooInMyName,
              meTooIHaveFoo,
              a,
              b,
            ) {}
          }
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
                messageId: 'unexpectedConstructorParametersGroupOrder',
              },
              {
                data: {
                  rightGroup: 'r',
                  leftGroup: 'g',
                  right: 'r',
                  left: 'g',
                },
                messageId: 'unexpectedConstructorParametersGroupOrder',
              },
            ],
            output: dedent`
              class Foo {
                constructor(
                  r,
                  g,
                  b,
                ) {}
              }
            `,
            code: dedent`
              class Foo {
                constructor(
                  b,
                  g,
                  r,
                ) {}
              }
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
            messageId: 'extraSpacingBetweenConstructorParametersMembers',
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'bbb', left: 'z' },
          },
        ],
        code: dedent`
          class Foo {
            constructor(
              aaaa,


             yy,
            z,

                bbb,
            ) {}
          }
        `,
        output: dedent`
          class Foo {
            constructor(
              aaaa,
             bbb,
            yy,

                z,
            ) {}
          }
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
            messageId: 'extraSpacingBetweenConstructorParametersMembers',
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'yy', left: 'z' },
          },
          {
            messageId: 'missedSpacingBetweenConstructorParametersMembers',
            data: { right: 'bbb', left: 'yy' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              aaaa,

             yy,
            z,

                bbb,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              aaaa,


             z,
            yy,
                bbb,
            ) {}
          }
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
            messageId: 'missedSpacingBetweenConstructorParametersMembers',
            data: { right: 'b', left: 'a' },
          },
          {
            messageId: 'extraSpacingBetweenConstructorParametersMembers',
            data: { right: 'c', left: 'b' },
          },
          {
            messageId: 'extraSpacingBetweenConstructorParametersMembers',
            data: { right: 'd', left: 'c' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              a,

              b,

              c,
              d,


              e,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,
              b,


              c,

              d,


              e,
            ) {}
          }
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
              messageId: 'missedSpacingBetweenConstructorParametersMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                a,


                b,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                a,
                b,
              ) {}
            }
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
              messageId: 'extraSpacingBetweenConstructorParametersMembers',
              data: { right: 'b', left: 'a' },
            },
          ],
          output: dedent`
            class Foo {
              constructor(
                a,
                b,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                a,

                b,
              ) {}
            }
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
            class Foo {
              constructor(
                a,

                b,
              ) {}
            }
          `,
          options: ignoreNewlineOptions,
        })

        await valid({
          code: dedent`
            class Foo {
              constructor(
                a,
                b,
              ) {}
            }
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
          useConfigurationIf: {},
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
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              a, // Comment after

              b,
              c,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              a, // Comment after

              c,
            ) {}
          }
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
          class Foo {
            constructor(
              aaa,

              // Partition comment

              bb,
              c,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              aaa,

              // Partition comment

              c,
              bb,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'bb', left: 'c' },
          },
        ],
        options: partitionOptions,
      })
    })
  })

  describe('custom', () => {
    it('sorts constructor parameters according to custom alphabet order', async () => {
      let alphabet = Alphabet.generateRecommendedAlphabet()
        .sortByLocaleCompare('en-US')
        .getCharacters()

      let customAlphabetOptions = [
        {
          type: 'custom' as const,
          useConfigurationIf: {},
          order: 'asc' as const,
          alphabet,
        },
      ]

      await valid({
        code: dedent`
          class Foo {
            constructor(
              a,
              b,
              c,
              d,
            ) {}
          }
        `,
        options: customAlphabetOptions,
      })

      await invalid({
        output: dedent`
          class Foo {
            constructor(
              a,
              b,
              c,
              d,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              a,
              c,
              b,
              d,
            ) {}
          }
        `,
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'b', left: 'c' },
          },
        ],
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
      useConfigurationIf: {},
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
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'bb', left: 'b' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'aa', left: 'a' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              aa,
              bb,
              a,
              b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              bb,
              a,
              aa,
            ) {}
          }
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
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'bb', left: 'b' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'aa', left: 'a' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              aa,
              bb,
              a,
              b,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              bb,
              a,
              aa,
            ) {}
          }
        `,
      })
    })
  })

  describe('unsorted', () => {
    let unsortedOptions = {
      type: 'unsorted' as const,
      useConfigurationIf: {},
      order: 'asc' as const,
    }

    it('allows any order when type is unsorted', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              b,
              c,
              a,
            ) {}
          }
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
            messageId: 'unexpectedConstructorParametersGroupOrder',
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              ba,
              bb,
              ab,
              aa,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              ab,
              aa,
              ba,
              bb,
            ) {}
          }
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
            messageId: 'missedSpacingBetweenConstructorParametersMembers',
            data: { right: 'a', left: 'b' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              b,

              a,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              a,
            ) {}
          }
        `,
        options: newlinesOptions,
      })
    })
  })

  describe('misc', () => {
    let options = {
      useConfigurationIf: {},
    }

    it('validates the JSON schema', async () => {
      await expect(
        validateRuleJsonSchema(rule.meta.schema),
      ).resolves.not.toThrow()
    })

    it('uses alphabetical ascending order by default', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              a,
              b,
              c,
              d,
            ) {}
          }
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'a', left: 'b' },
          },
          {
            messageId: 'unexpectedConstructorParametersOrder',
            data: { right: 'c', left: 'd' },
          },
        ],
        output: dedent`
          class Foo {
            constructor(
              a,
              b,
              c,
              d,
            ) {}
          }
        `,
        code: dedent`
          class Foo {
            constructor(
              b,
              a,
              d,
              c,
            ) {}
          }
        `,
        options: [options],
      })
    })

    it('respects natural sorting with numbers', async () => {
      await valid({
        code: dedent`
          class Foo {
            constructor(
              v1,
              v10,
              v12,
              v2,
            ) {}
          }
        `,
        options: [
          {
            ...options,
            ignoreCase: false,
          },
        ],
      })
    })

    it('handles empty constructors and single-parameter constructors', async () => {
      await valid({
        code: 'class Foo { constructor() {} }',
      })

      await valid({
        code: 'class Foo { constructor(a) {} }',
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
          class Foo {
            constructor(
              ccc,
              bb,
              a,
            ) {}
          }
        `,
        options: [options],
        settings,
      })

      await valid({
        code: dedent`
          class Foo {
            constructor(
              a,
              bb,
              ccc,
            ) {}
          }
        `,
        options: [
          {
            ...options,
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        settings,
      })
    })

    describe('with eslint-disable comments', () => {
      it('excludes disabled elements from sorting', async () => {
        await valid({
          code: dedent`
            class Foo {
              constructor(
                b,
                c,
                // eslint-disable-next-line
                a,
              ) {}
            }
          `,
          options: [options],
        })

        await invalid({
          output: dedent`
            class Foo {
              constructor(
                b,
                c,
                // eslint-disable-next-line
                a,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                c,
                b,
                // eslint-disable-next-line
                a,
              ) {}
            }
          `,
          errors: [
            {
              messageId: 'unexpectedConstructorParametersOrder',
              data: { right: 'b', left: 'c' },
            },
          ],
          options: [options],
        })
      })

      it('handles inline eslint-disable comments', async () => {
        await invalid({
          output: dedent`
            class Foo {
              constructor(
                b,
                c,
                a, // eslint-disable-line
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                c,
                b,
                a, // eslint-disable-line
              ) {}
            }
          `,
          errors: [
            {
              messageId: 'unexpectedConstructorParametersOrder',
              data: { right: 'b', left: 'c' },
            },
          ],
          options: [options],
        })
      })

      it('respects eslint-disable blocks', async () => {
        await invalid({
          output: dedent`
            class Foo {
              constructor(
                a,
                d,
                /* eslint-disable */
                c,
                b,
                // Shouldn't move
                /* eslint-enable */
                e,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                d,
                e,
                /* eslint-disable */
                c,
                b,
                // Shouldn't move
                /* eslint-enable */
                a,
              ) {}
            }
          `,
          errors: [
            {
              messageId: 'unexpectedConstructorParametersOrder',
              data: { right: 'a', left: 'b' },
            },
          ],
          options: [options],
        })
      })

      it('handles rule-specific eslint-disable comments', async () => {
        await invalid({
          output: dedent`
            class Foo {
              constructor(
                b,
                c,
                // eslint-disable-next-line rule-to-test/sort-constructors-parameters
                a,
              ) {}
            }
          `,
          code: dedent`
            class Foo {
              constructor(
                c,
                b,
                // eslint-disable-next-line rule-to-test/sort-constructors-parameters
                a,
              ) {}
            }
          `,
          errors: [
            {
              messageId: 'unexpectedConstructorParametersOrder',
              data: { right: 'b', left: 'c' },
            },
          ],
          options: [options],
        })
      })
    })
  })
})
