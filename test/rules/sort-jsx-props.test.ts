import { createRuleTester } from 'eslint-vitest-rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { describe, expect, it } from 'vitest'
import path from 'node:path'
import dedent from 'dedent'

import { validateRuleJsonSchema } from '../utils/validate-rule-json-schema'
import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-jsx-props'

describe('sort-jsx-props', () => {
  let { invalid, valid } = createRuleTester({
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: path.join(import.meta.dirname, '../fixtures'),
        extraFileExtensions: ['.svelte', '.astro', '.vue'],
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
        parser: typescriptParser,
      },
    },
    name: 'sort-jsx-props',
    rule,
  })

  describe('alphabetical', () => {
    let options = {
      type: 'alphabetical',
      order: 'asc',
    } as const

    it('sorts jsx props', async () => {
      await valid({
        code: dedent`
          let Component = () => (
            <Element
              a="aaa"
              b="bb"
              c="c"
            >
              Value
            </Element>
          )
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Component = () => (
            <Element
              a="aaa"
              b="bb"
              c="c"
            >
              Value
            </Element>
          )
        `,
        code: dedent`
          let Component = () => (
            <Element
              a="aaa"
              c="c"
              b="bb"
            >
              Value
            </Element>
          )
        `,
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        options: [options],
      })
    })

    it('sorts jsx props with namespaced names', async () => {
      await valid({
        code: dedent`
          let Component = () => (
            <Element
              a="aaa"
              b="bb"
              c="c"
              d:e="d"
            />
          )
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Component = () => (
            <Element
              a="aaa"
              b="bb"
              c="c"
              d:e="d"
            />
          )
        `,
        code: dedent`
          let Component = () => (
            <Element
              a="aaa"
              d:e="d"
              b="bb"
              c="c"
            />
          )
        `,
        errors: [
          {
            data: {
              left: 'd:e',
              right: 'b',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        options: [options],
      })
    })

    it('preserves spread elements between jsx props groups', async () => {
      await valid({
        code: dedent`
          let Component = () => (
            <Element
              d
              e="e"
              f="f"
              {...data}
              a="a"
              b="b"
              c="c"
            />
          )
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'd',
              left: 'e',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        output: dedent`
          let Component = () => (
            <Element
              d
              e="e"
              f="f"
              {...data}
              a="a"
              b="b"
              c="c"
            />
          )
        `,
        code: dedent`
          let Component = () => (
            <Element
              e="e"
              d
              f="f"
              {...data}
              b="b"
              a="a"
              c="c"
            />
          )
        `,
        options: [options],
      })
    })

    it('positions shorthand props according to group configuration', async () => {
      let shorthandOptions = {
        ...options,
        groups: ['unknown', 'shorthand-prop'],
      }

      await valid({
        code: dedent`
          let Component = () => (
            <Element
              b="b"
              c="c"
              d="d"
              aaaaaa
            />
          )
        `,
        options: [shorthandOptions],
      })

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'shorthand-prop',
              rightGroup: 'unknown',
              left: 'aaaaaa',
              right: 'b',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        output: dedent`
          let Component = () => (
            <Element
              b="b"
              c="c"
              d="d"
              aaaaaa
            />
          )
        `,
        code: dedent`
          let Component = () => (
            <Element
              aaaaaa
              b="b"
              c="c"
              d="d"
            />
          )
        `,
        options: [shorthandOptions],
      })
    })

    it('positions callback props according to custom group pattern', async () => {
      let callbackOptions = {
        ...options,
        customGroups: { callback: 'on' },
        groups: ['unknown', 'callback'],
      }

      await valid({
        code: dedent`
          <Element
            a="a"
            b="b"
            onChange={handleChange}
          />
        `,
        options: [callbackOptions],
      })

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'callback',
              rightGroup: 'unknown',
              left: 'onChange',
              right: 'a',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        output: dedent`
          <Element
            a="a"
            b="b"
            onChange={handleChange}
          />
        `,
        code: dedent`
          <Element
            onChange={handleChange}
            a="a"
            b="b"
          />
        `,
        options: [callbackOptions],
      })
    })

    it('positions multiline props according to group configuration', async () => {
      let multilineOptions = {
        ...options,
        groups: ['multiline-prop', 'unknown'],
      }

      await valid({
        code: dedent`
          <Element
            d={() => {
              fn()
            }}
            e={{
              f: 'f',
              g: 'g',
            }}
            a="aaa"
            b="bb"
            c="c"
          />
        `,
        options: [multilineOptions],
      })

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'multiline-prop',
              leftGroup: 'unknown',
              right: 'd',
              left: 'c',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        output: dedent`
          <Element
            d={() => {
              fn()
            }}
            e={{
              f: 'f',
              g: 'g',
            }}
            a="aaa"
            b="bb"
            c="c"
          />
        `,
        code: dedent`
          <Element
            a="aaa"
            b="bb"
            c="c"
            d={() => {
              fn()
            }}
            e={{
              f: 'f',
              g: 'g',
            }}
          />
        `,
        options: [multilineOptions],
      })
    })

    it('prioritizes props in custom top group', async () => {
      let topGroupOptions = {
        ...options,
        customGroups: { top: ['d', 'e'] },
        groups: ['top', 'unknown'],
      }

      await valid({
        code: dedent`
          <Element
            d="ddd"
            e="ee"
            a="aaaa"
            b="bbb"
            c="cc"
          />
        `,
        options: [topGroupOptions],
      })

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'd',
              left: 'c',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        output: dedent`
          <Element
            d="ddd"
            e="ee"
            a="aaaa"
            b="bbb"
            c="cc"
          />
        `,
        code: dedent`
          <Element
            a="aaaa"
            b="bbb"
            c="cc"
            d="ddd"
            e="ee"
          />
        `,
        options: [topGroupOptions],
      })
    })

    it('matches props using regex patterns in custom groups', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: {
              elementsWithoutFoo: '^(?!.*Foo).*$',
            },
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          <Element
            iHaveFooInMyName="iHaveFooInMyName"
            meTooIHaveFoo="meTooIHaveFoo"
            a="a"
            b="b"
          />
        `,
      })
    })

    it('ignores special characters when trimming', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
        code: dedent`
          <Element
            $a
            b="b"
            $c
          />
        `,
      })
    })

    it('groups props by shorthand modifier', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'shorthandElements',
              leftGroup: 'unknown',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'shorthandElements',
                modifiers: ['shorthand'],
              },
            ],
            groups: ['shorthandElements', 'unknown'],
          },
        ],
        output: dedent`
          <Element
            a
            b="b"
          />
        `,
        code: dedent`
          <Element
            b="b"
            a
          />
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array of patterns', ['noMatch', 'hello']],
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])(
      'groups props by element name pattern - %s',
      async (_description, elementNamePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'shorthandsStartingWithHello',
                  modifiers: ['shorthand'],
                  elementNamePattern,
                },
              ],
              groups: ['shorthandsStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'shorthandsStartingWithHello',
                right: 'helloShorthand',
                leftGroup: 'unknown',
                left: 'b',
              },
              messageId: 'unexpectedJSXPropsGroupOrder',
            },
          ],
          output: dedent`
            <Element
              helloShorthand
              a="a"
              b="b"
            />
          `,
          code: dedent`
            <Element
              a="a"
              b="b"
              helloShorthand
            />
          `,
        })
      },
    )

    it.each([
      ['string pattern', 'HELLO'],
      ['array of patterns', ['noMatch', 'HELLO']],
      ['case-insensitive regex', { pattern: 'hello', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'hello', flags: 'i' }]],
    ])(
      'groups props by element value pattern - %s',
      async (_description, elementValuePattern) => {
        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'valuesStartingWithHello',
                leftGroup: 'unknown',
                right: 'z',
                left: 'b',
              },
              messageId: 'unexpectedJSXPropsGroupOrder',
            },
          ],
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
          output: dedent`
            <Element
              z="HELLO_VALUE"
              a="a"
              b
            />
          `,
          code: dedent`
            <Element
              a="a"
              b
              z="HELLO_VALUE"
            />
          `,
        })
      },
    )

    it('overrides sort type and order for custom groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
          {
            data: {
              rightGroup: 'reversedShorthandsByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: 'm',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedShorthandsByLineLength',
                modifiers: ['shorthand'],
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedShorthandsByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          <Element
            dddd
            ccc
            eee
            bb
            ff
            a
            g
            m="m"
            o="o"
            p="p"
          />
        `,
        code: dedent`
          <Element
            a
            bb
            ccc
            dddd
            m="m"
            eee
            ff
            g
            o="o"
            p="p"
          />
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
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        output: dedent`
          <Element
            fooBar
            fooZar
          />
        `,
        code: dedent`
          <Element
            fooZar
            fooBar
          />
        `,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedShorthands',
                modifiers: ['shorthand'],
                type: 'unsorted',
              },
            ],
            groups: ['unsortedShorthands', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedShorthands',
              leftGroup: 'unknown',
              right: 'c',
              left: 'm',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        output: dedent`
          <Element
            b
            a
            d
            e
            c
            m="m"
          />
        `,
        code: dedent`
          <Element
            b
            a
            d
            e
            m="m"
            c
          />
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
                    modifiers: ['shorthand'],
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
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        output: dedent`
          <Element
            cFoo
            foo="foo"
            a
          />
        `,
        code: dedent`
          <Element
            a
            cFoo
            foo="foo"
          />
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
          <Element
            iHaveFooInMyName
            meTooIHaveFoo
            a
            b
          />
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
          <Component
            ab
            a$c
          />
        `,
      })
    })

    it('sorts props according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          <Component
            你好
            世界
            a
            A
            b
            B
          />
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts props within newline-separated groups independently', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'd',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
          {
            data: {
              right: 'b',
              left: 'e',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        output: dedent`
          <Component
            a
            d

            c

            b
            e
          />
        `,
        code: dedent`
          <Component
            d
            a

            c

            e
            b
          />
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
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
                right: 'y',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenJSXPropsMembers',
            },
            {
              data: {
                right: 'b',
                left: 'z',
              },
              messageId: 'unexpectedJSXPropsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'z',
              },
              messageId: 'extraSpacingBetweenJSXPropsMembers',
            },
          ],
          options: [
            {
              ...options,
              customGroups: { a: 'a' },
              groups: ['a', 'unknown'],
              newlinesBetween,
            },
          ],
          code: dedent`
            <Component
              a


             y
            z

                b
            />
          `,
          output: dedent`
            <Component
              a
             b
            y
                z
            />
          `,
        })
      },
    )

    it.each([
      ['always', 'always' as const],
      ['1', 1 as const],
    ])(
      'adds newlines between groups when newlinesBetween is %s',
      async (_description, newlinesBetween) => {
        await invalid({
          errors: [
            {
              data: {
                right: 'z',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenJSXPropsMembers',
            },
            {
              data: {
                right: 'y',
                left: 'z',
              },
              messageId: 'unexpectedJSXPropsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'y',
              },
              messageId: 'missedSpacingBetweenJSXPropsMembers',
            },
          ],
          options: [
            {
              ...options,
              customGroups: {
                a: 'a',
                b: 'b',
              },
              groups: ['a', 'unknown', 'b'],
              newlinesBetween,
            },
          ],
          output: dedent`
            <Component
              a

             y
            z

                b
            />
          `,
          code: dedent`
            <Component
              a


             z
            y
                b
            />
          `,
        })
      },
    )

    it('applies inline newline settings between specific groups', async () => {
      await invalid({
        options: [
          {
            ...options,
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
            customGroups: {
              a: 'a',
              b: 'b',
              c: 'c',
              d: 'd',
              e: 'e',
            },
            newlinesBetween: 'always',
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenJSXPropsMembers',
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: 'extraSpacingBetweenJSXPropsMembers',
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: 'extraSpacingBetweenJSXPropsMembers',
          },
        ],
        output: dedent`
          <Component
            a

            b

            c
            d


            e
          />
        `,
        code: dedent`
          <Component
            a
            b


            c

            d


            e
          />
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
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              customGroups: {
                unusedGroup: 'X',
                a: 'a',
                b: 'b',
              },
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'missedSpacingBetweenJSXPropsMembers',
            },
          ],
          output: dedent`
            <Component
              a


              b
            />
          `,
          code: dedent`
            <Component
              a
              b
            />
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
              messageId: 'extraSpacingBetweenJSXPropsMembers',
            },
          ],
          output: dedent`
            <Component
              a
              b
            />
          `,
          code: dedent`
            <Component
              a

              b
            />
          `,
        })
      },
    )

    it('preserves inline comments when reordering props', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'unknown',
              leftGroup: 'b|c',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: {
              'b|c': 'b|c',
            },
            groups: ['unknown', 'b|c'],
            newlinesBetween: 'always',
          },
        ],
        output: dedent`
          <Component
            a // Comment after

            b
            c
          />
        `,
        code: dedent`
          <Component
            b
            a // Comment after

            c
          />
        `,
      })
    })

    it.each([
      ['string pattern', '^r|g|b$'],
      ['array of patterns', ['noMatch', '^r|g|b$']],
      ['case-insensitive regex', { pattern: '^R|G|B$', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: '^R|G|B$', flags: 'i' }]],
    ])(
      'applies configuration when all names match pattern - %s',
      async (_description, allNamesMatchPattern) => {
        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'g',
                leftGroup: 'b',
                right: 'g',
                left: 'b',
              },
              messageId: 'unexpectedJSXPropsGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedJSXPropsGroupOrder',
            },
          ],
          options: [
            {
              ...options,
              useConfigurationIf: {
                allNamesMatchPattern: 'foo',
              },
            },
            {
              ...options,
              customGroups: {
                r: 'r',
                g: 'g',
                b: 'b',
              },
              useConfigurationIf: {
                allNamesMatchPattern,
              },
              groups: ['r', 'g', 'b'],
            },
          ],
          output: dedent`
            <Component
              r
              g
              b
            />
          `,
          code: dedent`
            <Component
              b
              g
              r
            />
          `,
        })
      },
    )

    it.each([
      ['string pattern', '^Component$'],
      ['array of patterns', ['noMatch', '^Component']],
      ['case-insensitive regex', { pattern: '^COMPONENT$', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: '^COMPONENT', flags: 'i' }]],
    ])(
      'applies different configuration based on tag name pattern - %s',
      async (_description, tagMatchesPattern) => {
        let conditionalOptions = [
          {
            useConfigurationIf: {
              tagMatchesPattern,
            },
            type: 'unsorted',
          },
          options,
        ]

        await valid({
          code: dedent`
            <Component
              b
              c
              a
            />
          `,
          options: conditionalOptions,
        })

        await invalid({
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedJSXPropsOrder',
            },
          ],
          output: dedent`
            <OtherComponent
              a
              b
            />
          `,
          code: dedent`
            <OtherComponent
              b
              a
            />
          `,
          options: conditionalOptions,
        })
      },
    )
  })

  describe('natural', () => {
    let options = {
      type: 'natural',
      order: 'asc',
    } as const

    it('sorts jsx props', async () => {
      await valid({
        code: dedent`
          let Component = () => (
            <Element
              a="aaa"
              b="bb"
              c="c"
            >
              Value
            </Element>
          )
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Component = () => (
            <Element
              a="aaa"
              b="bb"
              c="c"
            >
              Value
            </Element>
          )
        `,
        code: dedent`
          let Component = () => (
            <Element
              a="aaa"
              c="c"
              b="bb"
            >
              Value
            </Element>
          )
        `,
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        options: [options],
      })
    })

    it('sorts jsx props with namespaced names', async () => {
      await valid({
        code: dedent`
          let Component = () => (
            <Element
              a="aaa"
              b="bb"
              c="c"
              d:e="d"
            />
          )
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Component = () => (
            <Element
              a="aaa"
              b="bb"
              c="c"
              d:e="d"
            />
          )
        `,
        code: dedent`
          let Component = () => (
            <Element
              a="aaa"
              d:e="d"
              b="bb"
              c="c"
            />
          )
        `,
        errors: [
          {
            data: {
              left: 'd:e',
              right: 'b',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        options: [options],
      })
    })

    it('preserves spread elements between jsx props groups', async () => {
      await valid({
        code: dedent`
          let Component = () => (
            <Element
              d
              e="e"
              f="f"
              {...data}
              a="a"
              b="b"
              c="c"
            />
          )
        `,
        options: [options],
      })

      await invalid({
        errors: [
          {
            data: {
              right: 'd',
              left: 'e',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        output: dedent`
          let Component = () => (
            <Element
              d
              e="e"
              f="f"
              {...data}
              a="a"
              b="b"
              c="c"
            />
          )
        `,
        code: dedent`
          let Component = () => (
            <Element
              e="e"
              d
              f="f"
              {...data}
              b="b"
              a="a"
              c="c"
            />
          )
        `,
        options: [options],
      })
    })

    it('positions shorthand props according to group configuration', async () => {
      let shorthandOptions = {
        ...options,
        groups: ['unknown', 'shorthand-prop'],
      }

      await valid({
        code: dedent`
          let Component = () => (
            <Element
              b="b"
              c="c"
              d="d"
              aaaaaa
            />
          )
        `,
        options: [shorthandOptions],
      })

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'shorthand-prop',
              rightGroup: 'unknown',
              left: 'aaaaaa',
              right: 'b',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        output: dedent`
          let Component = () => (
            <Element
              b="b"
              c="c"
              d="d"
              aaaaaa
            />
          )
        `,
        code: dedent`
          let Component = () => (
            <Element
              aaaaaa
              b="b"
              c="c"
              d="d"
            />
          )
        `,
        options: [shorthandOptions],
      })
    })

    it('positions callback props according to custom group pattern', async () => {
      let callbackOptions = {
        ...options,
        customGroups: { callback: 'on' },
        groups: ['unknown', 'callback'],
      }

      await valid({
        code: dedent`
          <Element
            a="a"
            b="b"
            onChange={handleChange}
          />
        `,
        options: [callbackOptions],
      })

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'callback',
              rightGroup: 'unknown',
              left: 'onChange',
              right: 'a',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        output: dedent`
          <Element
            a="a"
            b="b"
            onChange={handleChange}
          />
        `,
        code: dedent`
          <Element
            onChange={handleChange}
            a="a"
            b="b"
          />
        `,
        options: [callbackOptions],
      })
    })

    it('positions multiline props according to group configuration', async () => {
      let multilineOptions = {
        ...options,
        groups: ['multiline-prop', 'unknown'],
      }

      await valid({
        code: dedent`
          <Element
            d={() => {
              fn()
            }}
            e={{
              f: 'f',
              g: 'g',
            }}
            a="aaa"
            b="bb"
            c="c"
          />
        `,
        options: [multilineOptions],
      })

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'multiline-prop',
              leftGroup: 'unknown',
              right: 'd',
              left: 'c',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        output: dedent`
          <Element
            d={() => {
              fn()
            }}
            e={{
              f: 'f',
              g: 'g',
            }}
            a="aaa"
            b="bb"
            c="c"
          />
        `,
        code: dedent`
          <Element
            a="aaa"
            b="bb"
            c="c"
            d={() => {
              fn()
            }}
            e={{
              f: 'f',
              g: 'g',
            }}
          />
        `,
        options: [multilineOptions],
      })
    })

    it('prioritizes props in custom top group', async () => {
      let topGroupOptions = {
        ...options,
        customGroups: { top: ['d', 'e'] },
        groups: ['top', 'unknown'],
      }

      await valid({
        code: dedent`
          <Element
            d="ddd"
            e="ee"
            a="aaaa"
            b="bbb"
            c="cc"
          />
        `,
        options: [topGroupOptions],
      })

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'd',
              left: 'c',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        output: dedent`
          <Element
            d="ddd"
            e="ee"
            a="aaaa"
            b="bbb"
            c="cc"
          />
        `,
        code: dedent`
          <Element
            a="aaaa"
            b="bbb"
            c="cc"
            d="ddd"
            e="ee"
          />
        `,
        options: [topGroupOptions],
      })
    })

    it('matches props using regex patterns in custom groups', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: {
              elementsWithoutFoo: '^(?!.*Foo).*$',
            },
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          <Element
            iHaveFooInMyName="iHaveFooInMyName"
            meTooIHaveFoo="meTooIHaveFoo"
            a="a"
            b="b"
          />
        `,
      })
    })

    it('ignores special characters when trimming', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
        code: dedent`
          <Element
            $a
            b="b"
            $c
          />
        `,
      })
    })

    it('groups props by shorthand modifier', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'shorthandElements',
              leftGroup: 'unknown',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'shorthandElements',
                modifiers: ['shorthand'],
              },
            ],
            groups: ['shorthandElements', 'unknown'],
          },
        ],
        output: dedent`
          <Element
            a
            b="b"
          />
        `,
        code: dedent`
          <Element
            b="b"
            a
          />
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array of patterns', ['noMatch', 'hello']],
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])(
      'groups props by element name pattern - %s',
      async (_description, elementNamePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'shorthandsStartingWithHello',
                  modifiers: ['shorthand'],
                  elementNamePattern,
                },
              ],
              groups: ['shorthandsStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'shorthandsStartingWithHello',
                right: 'helloShorthand',
                leftGroup: 'unknown',
                left: 'b',
              },
              messageId: 'unexpectedJSXPropsGroupOrder',
            },
          ],
          output: dedent`
            <Element
              helloShorthand
              a="a"
              b="b"
            />
          `,
          code: dedent`
            <Element
              a="a"
              b="b"
              helloShorthand
            />
          `,
        })
      },
    )

    it.each([
      ['string pattern', 'HELLO'],
      ['array of patterns', ['noMatch', 'HELLO']],
      ['case-insensitive regex', { pattern: 'hello', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'hello', flags: 'i' }]],
    ])(
      'groups props by element value pattern - %s',
      async (_description, elementValuePattern) => {
        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'valuesStartingWithHello',
                leftGroup: 'unknown',
                right: 'z',
                left: 'b',
              },
              messageId: 'unexpectedJSXPropsGroupOrder',
            },
          ],
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
          output: dedent`
            <Element
              z="HELLO_VALUE"
              a="a"
              b
            />
          `,
          code: dedent`
            <Element
              a="a"
              b
              z="HELLO_VALUE"
            />
          `,
        })
      },
    )

    it('overrides sort type and order for custom groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
          {
            data: {
              rightGroup: 'reversedShorthandsByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: 'm',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedShorthandsByLineLength',
                modifiers: ['shorthand'],
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedShorthandsByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          <Element
            dddd
            ccc
            eee
            bb
            ff
            a
            g
            m="m"
            o="o"
            p="p"
          />
        `,
        code: dedent`
          <Element
            a
            bb
            ccc
            dddd
            m="m"
            eee
            ff
            g
            o="o"
            p="p"
          />
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
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        output: dedent`
          <Element
            fooBar
            fooZar
          />
        `,
        code: dedent`
          <Element
            fooZar
            fooBar
          />
        `,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedShorthands',
                modifiers: ['shorthand'],
                type: 'unsorted',
              },
            ],
            groups: ['unsortedShorthands', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedShorthands',
              leftGroup: 'unknown',
              right: 'c',
              left: 'm',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        output: dedent`
          <Element
            b
            a
            d
            e
            c
            m="m"
          />
        `,
        code: dedent`
          <Element
            b
            a
            d
            e
            m="m"
            c
          />
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
                    modifiers: ['shorthand'],
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
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        output: dedent`
          <Element
            cFoo
            foo="foo"
            a
          />
        `,
        code: dedent`
          <Element
            a
            cFoo
            foo="foo"
          />
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
          <Element
            iHaveFooInMyName
            meTooIHaveFoo
            a
            b
          />
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
          <Component
            ab
            a$c
          />
        `,
      })
    })

    it('sorts props according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          <Component
            你好
            世界
            a
            A
            b
            B
          />
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts props within newline-separated groups independently', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'a',
              left: 'd',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
          {
            data: {
              right: 'b',
              left: 'e',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        output: dedent`
          <Component
            a
            d

            c

            b
            e
          />
        `,
        code: dedent`
          <Component
            d
            a

            c

            e
            b
          />
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
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
                right: 'y',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenJSXPropsMembers',
            },
            {
              data: {
                right: 'b',
                left: 'z',
              },
              messageId: 'unexpectedJSXPropsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'z',
              },
              messageId: 'extraSpacingBetweenJSXPropsMembers',
            },
          ],
          options: [
            {
              ...options,
              customGroups: { a: 'a' },
              groups: ['a', 'unknown'],
              newlinesBetween,
            },
          ],
          code: dedent`
            <Component
              a


             y
            z

                b
            />
          `,
          output: dedent`
            <Component
              a
             b
            y
                z
            />
          `,
        })
      },
    )

    it.each([
      ['always', 'always' as const],
      ['1', 1 as const],
    ])(
      'adds newlines between groups when newlinesBetween is %s',
      async (_description, newlinesBetween) => {
        await invalid({
          errors: [
            {
              data: {
                right: 'z',
                left: 'a',
              },
              messageId: 'extraSpacingBetweenJSXPropsMembers',
            },
            {
              data: {
                right: 'y',
                left: 'z',
              },
              messageId: 'unexpectedJSXPropsOrder',
            },
            {
              data: {
                right: 'b',
                left: 'y',
              },
              messageId: 'missedSpacingBetweenJSXPropsMembers',
            },
          ],
          options: [
            {
              ...options,
              customGroups: {
                a: 'a',
                b: 'b',
              },
              groups: ['a', 'unknown', 'b'],
              newlinesBetween,
            },
          ],
          output: dedent`
            <Component
              a

             y
            z

                b
            />
          `,
          code: dedent`
            <Component
              a


             z
            y
                b
            />
          `,
        })
      },
    )

    it('applies inline newline settings between specific groups', async () => {
      await invalid({
        options: [
          {
            ...options,
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
            customGroups: {
              a: 'a',
              b: 'b',
              c: 'c',
              d: 'd',
              e: 'e',
            },
            newlinesBetween: 'always',
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenJSXPropsMembers',
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: 'extraSpacingBetweenJSXPropsMembers',
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: 'extraSpacingBetweenJSXPropsMembers',
          },
        ],
        output: dedent`
          <Component
            a

            b

            c
            d


            e
          />
        `,
        code: dedent`
          <Component
            a
            b


            c

            d


            e
          />
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
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              customGroups: {
                unusedGroup: 'X',
                a: 'a',
                b: 'b',
              },
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'missedSpacingBetweenJSXPropsMembers',
            },
          ],
          output: dedent`
            <Component
              a


              b
            />
          `,
          code: dedent`
            <Component
              a
              b
            />
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
              messageId: 'extraSpacingBetweenJSXPropsMembers',
            },
          ],
          output: dedent`
            <Component
              a
              b
            />
          `,
          code: dedent`
            <Component
              a

              b
            />
          `,
        })
      },
    )

    it('preserves inline comments when reordering props', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'unknown',
              leftGroup: 'b|c',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: {
              'b|c': 'b|c',
            },
            groups: ['unknown', 'b|c'],
            newlinesBetween: 'always',
          },
        ],
        output: dedent`
          <Component
            a // Comment after

            b
            c
          />
        `,
        code: dedent`
          <Component
            b
            a // Comment after

            c
          />
        `,
      })
    })

    it.each([
      ['string pattern', '^r|g|b$'],
      ['array of patterns', ['noMatch', '^r|g|b$']],
      ['case-insensitive regex', { pattern: '^R|G|B$', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: '^R|G|B$', flags: 'i' }]],
    ])(
      'applies configuration when all names match pattern - %s',
      async (_description, allNamesMatchPattern) => {
        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'g',
                leftGroup: 'b',
                right: 'g',
                left: 'b',
              },
              messageId: 'unexpectedJSXPropsGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedJSXPropsGroupOrder',
            },
          ],
          options: [
            {
              ...options,
              useConfigurationIf: {
                allNamesMatchPattern: 'foo',
              },
            },
            {
              ...options,
              customGroups: {
                r: 'r',
                g: 'g',
                b: 'b',
              },
              useConfigurationIf: {
                allNamesMatchPattern,
              },
              groups: ['r', 'g', 'b'],
            },
          ],
          output: dedent`
            <Component
              r
              g
              b
            />
          `,
          code: dedent`
            <Component
              b
              g
              r
            />
          `,
        })
      },
    )

    it.each([
      ['string pattern', '^Component$'],
      ['array of patterns', ['noMatch', '^Component']],
      ['case-insensitive regex', { pattern: '^COMPONENT$', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: '^COMPONENT', flags: 'i' }]],
    ])(
      'applies different configuration based on tag name pattern - %s',
      async (_description, tagMatchesPattern) => {
        let conditionalOptions = [
          {
            useConfigurationIf: {
              tagMatchesPattern,
            },
            type: 'unsorted',
          },
          options,
        ]

        await valid({
          code: dedent`
            <Component
              b
              c
              a
            />
          `,
          options: conditionalOptions,
        })

        await invalid({
          errors: [
            {
              data: {
                right: 'a',
                left: 'b',
              },
              messageId: 'unexpectedJSXPropsOrder',
            },
          ],
          output: dedent`
            <OtherComponent
              a
              b
            />
          `,
          code: dedent`
            <OtherComponent
              b
              a
            />
          `,
          options: conditionalOptions,
        })
      },
    )
  })

  describe('line-length', () => {
    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    it('sorts jsx props', async () => {
      await valid({
        code: dedent`
          let Component = () => (
            <Element
              a="aaa"
              b="bb"
              c="c"
            >
              Value
            </Element>
          )
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Component = () => (
            <Element
              a="aaa"
              b="bb"
              c="c"
            >
              Value
            </Element>
          )
        `,
        code: dedent`
          let Component = () => (
            <Element
              a="aaa"
              c="c"
              b="bb"
            >
              Value
            </Element>
          )
        `,
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        options: [options],
      })
    })

    it('sorts jsx props with namespaced names', async () => {
      await valid({
        code: dedent`
          let Component = () => (
            <Element
              a="aaa"
              d:e="d"
              b="bb"
              c="c"
            />
          )
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Component = () => (
            <Element
              a="aaa"
              d:e="d"
              b="bb"
              c="c"
            />
          )
        `,
        code: dedent`
          let Component = () => (
            <Element
              a="aaa"
              b="bb"
              d:e="d"
              c="c"
            />
          )
        `,
        errors: [
          {
            data: {
              right: 'd:e',
              left: 'b',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        options: [options],
      })
    })

    it('preserves spread elements between jsx props groups', async () => {
      await valid({
        code: dedent`
          let Component = () => (
            <Element
              e="e"
              f="f"
              d
              {...data}
              a="a"
              b="b"
              c="c"
            />
          )
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Component = () => (
            <Element
              e="e"
              f="f"
              d
              {...data}
              b="b"
              a="a"
              c="c"
            />
          )
        `,
        code: dedent`
          let Component = () => (
            <Element
              e="e"
              d
              f="f"
              {...data}
              b="b"
              a="a"
              c="c"
            />
          )
        `,
        errors: [
          {
            data: {
              right: 'f',
              left: 'd',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        options: [options],
      })
    })

    it('positions shorthand props according to group configuration', async () => {
      let shorthandOptions = {
        ...options,
        groups: ['unknown', 'shorthand-prop'],
      }

      await valid({
        code: dedent`
          let Component = () => (
            <Element
              b="b"
              c="c"
              d="d"
              aaaaaa
            />
          )
        `,
        options: [shorthandOptions],
      })

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'shorthand-prop',
              rightGroup: 'unknown',
              left: 'aaaaaa',
              right: 'b',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        output: dedent`
          let Component = () => (
            <Element
              b="b"
              c="c"
              d="d"
              aaaaaa
            />
          )
        `,
        code: dedent`
          let Component = () => (
            <Element
              aaaaaa
              b="b"
              c="c"
              d="d"
            />
          )
        `,
        options: [shorthandOptions],
      })
    })

    it('positions callback props according to custom group pattern', async () => {
      let callbackOptions = {
        ...options,
        customGroups: { callback: 'on' },
        groups: ['unknown', 'callback'],
      }

      await valid({
        code: dedent`
          <Element
            a="a"
            b="b"
            onChange={handleChange}
          />
        `,
        options: [callbackOptions],
      })

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'callback',
              rightGroup: 'unknown',
              left: 'onChange',
              right: 'a',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        output: dedent`
          <Element
            a="a"
            b="b"
            onChange={handleChange}
          />
        `,
        code: dedent`
          <Element
            onChange={handleChange}
            a="a"
            b="b"
          />
        `,
        options: [callbackOptions],
      })
    })

    it('positions multiline props according to group configuration', async () => {
      let multilineOptions = {
        ...options,
        groups: ['multiline-prop', 'unknown'],
      }

      await valid({
        code: dedent`
          <Element
            e={{
              f: 'f',
              g: 'g',
            }}
            d={() => {
              fn()
            }}
            a="aaa"
            b="bb"
            c="c"
          />
        `,
        options: [multilineOptions],
      })

      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'multiline-prop',
              leftGroup: 'unknown',
              right: 'd',
              left: 'c',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
          {
            data: {
              right: 'e',
              left: 'd',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        output: dedent`
          <Element
            e={{
              f: 'f',
              g: 'g',
            }}
            d={() => {
              fn()
            }}
            a="aaa"
            b="bb"
            c="c"
          />
        `,
        code: dedent`
          <Element
            a="aaa"
            b="bb"
            c="c"
            d={() => {
              fn()
            }}
            e={{
              f: 'f',
              g: 'g',
            }}
          />
        `,
        options: [multilineOptions],
      })
    })

    it('prioritizes props in custom top group', async () => {
      let topGroupOptions = {
        ...options,
        customGroups: { top: ['d', 'e'] },
        groups: ['top', 'unknown'],
      }

      await valid({
        code: dedent`
          <Element
            d="ddd"
            e="ee"
            a="aaaa"
            b="bbb"
            c="cc"
          />
        `,
        options: [topGroupOptions],
      })

      await invalid({
        errors: [
          {
            data: {
              leftGroup: 'unknown',
              rightGroup: 'top',
              right: 'd',
              left: 'c',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        output: dedent`
          <Element
            d="ddd"
            e="ee"
            a="aaaa"
            b="bbb"
            c="cc"
          />
        `,
        code: dedent`
          <Element
            a="aaaa"
            b="bbb"
            c="cc"
            d="ddd"
            e="ee"
          />
        `,
        options: [topGroupOptions],
      })
    })

    it('matches props using regex patterns in custom groups', async () => {
      await valid({
        options: [
          {
            ...options,
            customGroups: {
              elementsWithoutFoo: '^(?!.*Foo).*$',
            },
            groups: ['unknown', 'elementsWithoutFoo'],
          },
        ],
        code: dedent`
          <Element
            iHaveFooInMyName="iHaveFooInMyName"
            meTooIHaveFoo="meTooIHaveFoo"
            a="a"
            b="b"
          />
        `,
      })
    })

    it('ignores special characters when trimming', async () => {
      await valid({
        options: [
          {
            ...options,
            specialCharacters: 'trim',
          },
        ],
        code: dedent`
          <Element
            b="b"
            $a
            $c
          />
        `,
      })
    })

    it('groups props by shorthand modifier', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'shorthandElements',
              leftGroup: 'unknown',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'shorthandElements',
                modifiers: ['shorthand'],
              },
            ],
            groups: ['shorthandElements', 'unknown'],
          },
        ],
        output: dedent`
          <Element
            a
            b="b"
          />
        `,
        code: dedent`
          <Element
            b="b"
            a
          />
        `,
      })
    })

    it.each([
      ['string pattern', 'hello'],
      ['array of patterns', ['noMatch', 'hello']],
      ['case-insensitive regex', { pattern: 'HELLO', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'HELLO', flags: 'i' }]],
    ])(
      'groups props by element name pattern - %s',
      async (_description, elementNamePattern) => {
        await invalid({
          options: [
            {
              customGroups: [
                {
                  groupName: 'shorthandsStartingWithHello',
                  modifiers: ['shorthand'],
                  elementNamePattern,
                },
              ],
              groups: ['shorthandsStartingWithHello', 'unknown'],
            },
          ],
          errors: [
            {
              data: {
                rightGroup: 'shorthandsStartingWithHello',
                right: 'helloShorthand',
                leftGroup: 'unknown',
                left: 'b',
              },
              messageId: 'unexpectedJSXPropsGroupOrder',
            },
          ],
          output: dedent`
            <Element
              helloShorthand
              a="a"
              b="b"
            />
          `,
          code: dedent`
            <Element
              a="a"
              b="b"
              helloShorthand
            />
          `,
        })
      },
    )

    it.each([
      ['string pattern', 'HELLO'],
      ['array of patterns', ['noMatch', 'HELLO']],
      ['case-insensitive regex', { pattern: 'hello', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'hello', flags: 'i' }]],
    ])(
      'groups props by element value pattern - %s',
      async (_description, elementValuePattern) => {
        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'valuesStartingWithHello',
                leftGroup: 'unknown',
                right: 'z',
                left: 'b',
              },
              messageId: 'unexpectedJSXPropsGroupOrder',
            },
          ],
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
          output: dedent`
            <Element
              z="HELLO_VALUE"
              a="a"
              b
            />
          `,
          code: dedent`
            <Element
              a="a"
              b
              z="HELLO_VALUE"
            />
          `,
        })
      },
    )

    it('overrides sort type and order for custom groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'bb',
              left: 'a',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
          {
            data: {
              right: 'ccc',
              left: 'bb',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
          {
            data: {
              right: 'dddd',
              left: 'ccc',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
          {
            data: {
              rightGroup: 'reversedShorthandsByLineLength',
              leftGroup: 'unknown',
              right: 'eee',
              left: 'm',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: [
              {
                groupName: 'reversedShorthandsByLineLength',
                modifiers: ['shorthand'],
                type: 'line-length',
                order: 'desc',
              },
            ],
            groups: ['reversedShorthandsByLineLength', 'unknown'],
            type: 'alphabetical',
            order: 'asc',
          },
        ],
        output: dedent`
          <Element
            dddd
            ccc
            eee
            bb
            ff
            a
            g
            m="m"
            o="o"
            p="p"
          />
        `,
        code: dedent`
          <Element
            a
            bb
            ccc
            dddd
            m="m"
            eee
            ff
            g
            o="o"
            p="p"
          />
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
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        output: dedent`
          <Element
            fooBar
            fooZar
          />
        `,
        code: dedent`
          <Element
            fooZar
            fooBar
          />
        `,
      })
    })

    it('preserves original order for unsorted groups', async () => {
      await invalid({
        options: [
          {
            customGroups: [
              {
                groupName: 'unsortedShorthands',
                modifiers: ['shorthand'],
                type: 'unsorted',
              },
            ],
            groups: ['unsortedShorthands', 'unknown'],
          },
        ],
        errors: [
          {
            data: {
              rightGroup: 'unsortedShorthands',
              leftGroup: 'unknown',
              right: 'c',
              left: 'm',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        output: dedent`
          <Element
            b
            a
            d
            e
            c
            m="m"
          />
        `,
        code: dedent`
          <Element
            b
            a
            d
            e
            m="m"
            c
          />
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
                    modifiers: ['shorthand'],
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
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        output: dedent`
          <Element
            cFoo
            foo="foo"
            a
          />
        `,
        code: dedent`
          <Element
            a
            cFoo
            foo="foo"
          />
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
          <Element
            iHaveFooInMyName
            meTooIHaveFoo
            a
            b
          />
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
          <Component
            abcd
            a$c
          />
        `,
      })
    })

    it('sorts props according to locale-specific rules', async () => {
      await valid({
        code: dedent`
          <Component
            你好
            世界
            a
            A
            b
            B
          />
        `,
        options: [{ ...options, locales: 'zh-CN' }],
      })
    })

    it('sorts props within newline-separated groups independently', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'aaaaa',
              left: 'dd',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
          {
            data: {
              right: 'bbbb',
              left: 'e',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        output: dedent`
          <Component
            aaaaa
            dd

            ccc

            bbbb
            e
          />
        `,
        code: dedent`
          <Component
            dd
            aaaaa

            ccc

            e
            bbbb
          />
        `,
        options: [
          {
            ...options,
            partitionByNewLine: true,
          },
        ],
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
                left: 'aaaa',
                right: 'yy',
              },
              messageId: 'extraSpacingBetweenJSXPropsMembers',
            },
            {
              data: {
                right: 'bbb',
                left: 'z',
              },
              messageId: 'unexpectedJSXPropsOrder',
            },
            {
              data: {
                right: 'bbb',
                left: 'z',
              },
              messageId: 'extraSpacingBetweenJSXPropsMembers',
            },
          ],
          options: [
            {
              ...options,
              customGroups: { a: 'aaaa' },
              groups: ['a', 'unknown'],
              newlinesBetween,
            },
          ],
          code: dedent`
            <Component
              aaaa


             yy
            z

                bbb
            />
          `,
          output: dedent`
            <Component
              aaaa
             bbb
            yy
                z
            />
          `,
        })
      },
    )

    it.each([
      ['always', 'always' as const],
      ['1', 1 as const],
    ])(
      'adds newlines between groups when newlinesBetween is %s',
      async (_description, newlinesBetween) => {
        await invalid({
          errors: [
            {
              data: {
                left: 'aaaa',
                right: 'z',
              },
              messageId: 'extraSpacingBetweenJSXPropsMembers',
            },
            {
              data: {
                right: 'yy',
                left: 'z',
              },
              messageId: 'unexpectedJSXPropsOrder',
            },
            {
              data: {
                right: 'bbb',
                left: 'yy',
              },
              messageId: 'missedSpacingBetweenJSXPropsMembers',
            },
          ],
          options: [
            {
              ...options,
              customGroups: {
                a: 'aaaa',
                b: 'bbb',
              },
              groups: ['a', 'unknown', 'b'],
              newlinesBetween,
            },
          ],
          output: dedent`
            <Component
              aaaa

             yy
            z

                bbb
            />
          `,
          code: dedent`
            <Component
              aaaa


             z
            yy
                bbb
            />
          `,
        })
      },
    )

    it('applies inline newline settings between specific groups', async () => {
      await invalid({
        options: [
          {
            ...options,
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
            customGroups: {
              a: 'a',
              b: 'b',
              c: 'c',
              d: 'd',
              e: 'e',
            },
            newlinesBetween: 'always',
          },
        ],
        errors: [
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'missedSpacingBetweenJSXPropsMembers',
          },
          {
            data: {
              right: 'c',
              left: 'b',
            },
            messageId: 'extraSpacingBetweenJSXPropsMembers',
          },
          {
            data: {
              right: 'd',
              left: 'c',
            },
            messageId: 'extraSpacingBetweenJSXPropsMembers',
          },
        ],
        output: dedent`
          <Component
            a

            b

            c
            d


            e
          />
        `,
        code: dedent`
          <Component
            a
            b


            c

            d


            e
          />
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
              groups: [
                'a',
                'unusedGroup',
                { newlinesBetween: groupNewlinesBetween },
                'b',
              ],
              customGroups: {
                unusedGroup: 'X',
                a: 'a',
                b: 'b',
              },
              newlinesBetween: globalNewlinesBetween,
            },
          ],
          errors: [
            {
              data: {
                right: 'b',
                left: 'a',
              },
              messageId: 'missedSpacingBetweenJSXPropsMembers',
            },
          ],
          output: dedent`
            <Component
              a


              b
            />
          `,
          code: dedent`
            <Component
              a
              b
            />
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
              messageId: 'extraSpacingBetweenJSXPropsMembers',
            },
          ],
          output: dedent`
            <Component
              a
              b
            />
          `,
          code: dedent`
            <Component
              a

              b
            />
          `,
        })
      },
    )

    it('preserves inline comments when reordering props', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'unknown',
              leftGroup: 'b|c',
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        options: [
          {
            customGroups: {
              'b|c': 'b|c',
            },
            groups: ['unknown', 'b|c'],
            newlinesBetween: 'always',
          },
        ],
        output: dedent`
          <Component
            a // Comment after

            b
            c
          />
        `,
        code: dedent`
          <Component
            b
            a // Comment after

            c
          />
        `,
      })
    })

    it.each([
      ['string pattern', '^r|g|b$'],
      ['array of patterns', ['noMatch', '^r|g|b$']],
      ['case-insensitive regex', { pattern: '^R|G|B$', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: '^R|G|B$', flags: 'i' }]],
    ])(
      'applies configuration when all names match pattern - %s',
      async (_description, allNamesMatchPattern) => {
        await invalid({
          errors: [
            {
              data: {
                rightGroup: 'g',
                leftGroup: 'b',
                right: 'g',
                left: 'b',
              },
              messageId: 'unexpectedJSXPropsGroupOrder',
            },
            {
              data: {
                rightGroup: 'r',
                leftGroup: 'g',
                right: 'r',
                left: 'g',
              },
              messageId: 'unexpectedJSXPropsGroupOrder',
            },
          ],
          options: [
            {
              ...options,
              useConfigurationIf: {
                allNamesMatchPattern: 'foo',
              },
            },
            {
              ...options,
              customGroups: {
                r: 'r',
                g: 'g',
                b: 'b',
              },
              useConfigurationIf: {
                allNamesMatchPattern,
              },
              groups: ['r', 'g', 'b'],
            },
          ],
          output: dedent`
            <Component
              r
              g
              b
            />
          `,
          code: dedent`
            <Component
              b
              g
              r
            />
          `,
        })
      },
    )

    it.each([
      ['string pattern', '^Component$'],
      ['array of patterns', ['noMatch', '^Component']],
      ['case-insensitive regex', { pattern: '^COMPONENT$', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: '^COMPONENT', flags: 'i' }]],
    ])(
      'applies different configuration based on tag name pattern - %s',
      async (_description, tagMatchesPattern) => {
        let conditionalOptions = [
          {
            useConfigurationIf: {
              tagMatchesPattern,
            },
            type: 'unsorted',
          },
          options,
        ]

        await valid({
          code: dedent`
            <Component
              b
              c
              a
            />
          `,
          options: conditionalOptions,
        })

        await invalid({
          errors: [
            {
              data: {
                right: 'aa',
                left: 'b',
              },
              messageId: 'unexpectedJSXPropsOrder',
            },
          ],
          output: dedent`
            <OtherComponent
              aa
              b
            />
          `,
          code: dedent`
            <OtherComponent
              b
              aa
            />
          `,
          options: conditionalOptions,
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

    it('sorts jsx props', async () => {
      await valid({
        code: dedent`
          let Component = () => (
            <Element
              a="aaa"
              b="bb"
              c="c"
            >
              Value
            </Element>
          )
        `,
        options: [options],
      })

      await invalid({
        output: dedent`
          let Component = () => (
            <Element
              a="aaa"
              b="bb"
              c="c"
            >
              Value
            </Element>
          )
        `,
        code: dedent`
          let Component = () => (
            <Element
              a="aaa"
              c="c"
              b="bb"
            >
              Value
            </Element>
          )
        `,
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        options: [options],
      })
    })
  })

  describe('unsorted', () => {
    let options = {
      type: 'unsorted',
      order: 'asc',
    } as const

    it('allows mixed prop order when type is unsorted', async () => {
      await valid({
        code: dedent`
          <Component
            b
            c
            a
          />
        `,
        options: [options],
      })
    })

    it('groups props by pattern while preserving order within groups', async () => {
      await invalid({
        errors: [
          {
            data: {
              rightGroup: 'b',
              leftGroup: 'a',
              right: 'ba',
              left: 'aa',
            },
            messageId: 'unexpectedJSXPropsGroupOrder',
          },
        ],
        options: [
          {
            ...options,
            customGroups: {
              a: '^a',
              b: '^b',
            },
            groups: ['b', 'a'],
          },
        ],
        output: dedent`
          <Component
            ba
            bb
            ab
            aa
          />
        `,
        code: dedent`
          <Component
            ab
            aa
            ba
            bb
          />
        `,
      })
    })

    it('adds newlines between groups when newlinesBetween is always', async () => {
      await invalid({
        options: [
          {
            ...options,
            customGroups: {
              a: '^a',
              b: '^b',
            },
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
            messageId: 'missedSpacingBetweenJSXPropsMembers',
          },
        ],
        output: dedent`
          <Component
            b

            a
          />
        `,
        code: dedent`
          <Component
            b
            a
          />
        `,
      })
    })
  })

  describe('misc', () => {
    it('supports mixing predefined and custom groups', async () => {
      await valid({
        options: [
          {
            groups: [
              'multiline-prop',
              'shorthand-prop',
              'unknown',
              'myCustomGroup',
            ],
            customGroups: {
              myCustomGroup: 'x',
            },
          },
        ],
        code: dedent`
          let Component = () => (
            <Element
              a="aaa"
              b="bb"
              c="c"
            >
              Value
            </Element>
          )
        `,
      })
    })

    it('validates the JSON schema', async () => {
      await expect(
        validateRuleJsonSchema(rule.meta.schema),
      ).resolves.not.toThrow()
    })

    it('uses alphabetical ascending order by default', async () => {
      await valid(
        dedent`
          let Component = () => (
            <Element
              a="a"
              b="b"
              c="c"
            />
          )
        `,
      )

      await valid({
        code: dedent`
          const Component = (
            <Element
              link1="value"
              link10="value"
              link2="value"
            />
          )
        `,
        options: [{}],
      })
    })

    it('ignores elements without props', async () => {
      await valid(
        dedent`
          let Component = () => (
            <Element />
          )
        `,
      )
    })

    it('ignores elements with single prop', async () => {
      await valid(
        dedent`
          let Component = () => (
            <Element a="a" />
          )
        `,
      )
    })

    it.each([
      ['string pattern', 'Element'],
      ['array of patterns', ['noMatch', 'Element']],
      ['case-insensitive regex', { pattern: 'ELEMENT', flags: 'i' }],
      ['regex in array', ['noMatch', { pattern: 'ELEMENT', flags: 'i' }]],
    ])(
      'ignores jsx elements matching ignore pattern - %s',
      async (_description, ignorePattern) => {
        await valid({
          code: dedent`
            let Component = () => (
              <Element
                c="c"
                b="bb"
                a="aaa"
              />
            )
          `,
          options: [
            {
              ignorePattern,
            },
          ],
        })
      },
    )

    it('ignores props disabled with eslint-disable-next-line', async () => {
      await valid({
        code: dedent`
          <Element
            b="b"
            c="c"
            // eslint-disable-next-line
            a="a"
          />
        `,
      })
    })

    it('sorts props with eslint-disable-line comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        output: dedent`
          <Element
            b="b"
            c="c"
            a="a" // eslint-disable-line
          />
        `,
        code: dedent`
          <Element
            c="c"
            b="b"
            a="a" // eslint-disable-line
          />
        `,
        options: [{}],
      })
    })

    it('handles multiple eslint-disable-next-line comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'c',
              left: 'd',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
          {
            data: {
              right: 'b',
              left: 'a',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        output: dedent`
          <Element
            b="b"
            c="c"
            // eslint-disable-next-line
            a="a"
            d="d"
          />
        `,
        code: dedent`
          <Element
            d="d"
            c="c"
            // eslint-disable-next-line
            a="a"
            b="b"
          />
        `,
        options: [{}],
      })
    })

    it('handles block eslint-disable-next-line comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        output: dedent`
          <Element
            b="b"
            c="c"
            /* eslint-disable-next-line */
            a="a"
          />
        `,
        code: dedent`
          <Element
            c="c"
            b="b"
            /* eslint-disable-next-line */
            a="a"
          />
        `,
        options: [{}],
      })
    })

    it('handles inline block eslint-disable-line comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        output: dedent`
          <Element
            b="b"
            c="c"
            a="a" /* eslint-disable-line */
          />
        `,
        code: dedent`
          <Element
            c="c"
            b="b"
            a="a" /* eslint-disable-line */
          />
        `,
        options: [{}],
      })
    })

    it('sorts props around eslint-disable/enable block', async () => {
      await invalid({
        output: dedent`
          <Element
            a="a"
            d="d"
            /* eslint-disable */
            c="c"
            b="b"
            // Shouldn't move
            /* eslint-enable */
            e="e"
          />
        `,
        code: dedent`
          <Element
            d="d"
            e="e"
            /* eslint-disable */
            c="c"
            b="b"
            // Shouldn't move
            /* eslint-enable */
            a="a"
          />
        `,
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        options: [{}],
      })
    })

    it('handles rule-specific eslint-disable-next-line comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        output: dedent`
          <Element
            b="b"
            c="c"
            // eslint-disable-next-line rule-to-test/sort-jsx-props
            a="a"
          />
        `,
        code: dedent`
          <Element
            c="c"
            b="b"
            // eslint-disable-next-line rule-to-test/sort-jsx-props
            a="a"
          />
        `,
        options: [{}],
      })
    })

    it('handles rule-specific eslint-disable-line comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        output: dedent`
          <Element
            b="b"
            c="c"
            a="a" // eslint-disable-line rule-to-test/sort-jsx-props
          />
        `,
        code: dedent`
          <Element
            c="c"
            b="b"
            a="a" // eslint-disable-line rule-to-test/sort-jsx-props
          />
        `,
        options: [{}],
      })
    })

    it('handles rule-specific block eslint-disable-next-line comments', async () => {
      await invalid({
        output: dedent`
          <Element
            b="b"
            c="c"
            /* eslint-disable-next-line rule-to-test/sort-jsx-props */
            a="a"
          />
        `,
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        code: dedent`
          <Element
            c="c"
            b="b"
            /* eslint-disable-next-line rule-to-test/sort-jsx-props */
            a="a"
          />
        `,
        options: [{}],
      })
    })

    it('handles rule-specific inline block eslint-disable-line comments', async () => {
      await invalid({
        errors: [
          {
            data: {
              right: 'b',
              left: 'c',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        output: dedent`
          <Element
            b="b"
            c="c"
            a="a" /* eslint-disable-line rule-to-test/sort-jsx-props */
          />
        `,
        code: dedent`
          <Element
            c="c"
            b="b"
            a="a" /* eslint-disable-line rule-to-test/sort-jsx-props */
          />
        `,
        options: [{}],
      })
    })

    it('sorts props around rule-specific eslint-disable/enable block', async () => {
      await invalid({
        output: dedent`
          <Element
            a="a"
            d="d"
            /* eslint-disable rule-to-test/sort-jsx-props */
            c="c"
            b="b"
            // Shouldn't move
            /* eslint-enable */
            e="e"
          />
        `,
        code: dedent`
          <Element
            d="d"
            e="e"
            /* eslint-disable rule-to-test/sort-jsx-props */
            c="c"
            b="b"
            // Shouldn't move
            /* eslint-enable */
            a="a"
          />
        `,
        errors: [
          {
            data: {
              right: 'a',
              left: 'b',
            },
            messageId: 'unexpectedJSXPropsOrder',
          },
        ],
        options: [{}],
      })
    })
  })
})
