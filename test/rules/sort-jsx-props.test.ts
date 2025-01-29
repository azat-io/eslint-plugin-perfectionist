import { RuleTester } from '@typescript-eslint/rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { afterAll, describe, it } from 'vitest'
import path from 'node:path'
import dedent from 'dedent'

import { Alphabet } from '../../utils/alphabet'
import rule from '../../rules/sort-jsx-props'

let ruleName = 'sort-jsx-props'

describe(ruleName, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester({
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: path.join(__dirname, '../fixtures'),
        extraFileExtensions: ['.svelte', '.astro', '.vue'],
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
        parser: typescriptParser,
      },
    },
  })

  describe(`${ruleName}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    let options = {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts jsx props`, rule, {
      invalid: [
        {
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
        },
      ],
      valid: [
        {
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
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts jsx props with namespaced names`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break the property list`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set shorthand props position`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  leftGroup: 'shorthand',
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
            options: [
              {
                ...options,
                groups: ['unknown', 'shorthand'],
              },
            ],
          },
        ],
        valid: [
          {
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
            options: [
              {
                ...options,
                groups: ['unknown', 'shorthand'],
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set callback props position`,
      rule,
      {
        invalid: [
          {
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
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
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
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
              },
            ],
            code: dedent`
              <Element
                a="a"
                b="b"
                onChange={handleChange}
              />
            `,
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set multiline props position`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'multiline',
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
            options: [
              {
                ...options,
                groups: ['multiline', 'unknown'],
              },
            ],
          },
        ],
        valid: [
          {
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
            options: [
              {
                ...options,
                groups: [['multiline'], 'unknown'],
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to set priority props`, rule, {
      invalid: [
        {
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
          options: [
            {
              ...options,
              customGroups: { top: ['d', 'e'] },
              groups: ['top', 'unknown'],
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
            <Element
              d="ddd"
              e="ee"
              a="aaaa"
              b="bbb"
              c="cc"
            />
          `,
          options: [
            {
              ...options,
              customGroups: { top: ['d', 'e'] },
              groups: ['top', 'unknown'],
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex for custom groups`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to trim special characters`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to remove special characters`,
      rule,
      {
        valid: [
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to use locale`, rule, {
      valid: [
        {
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
        },
      ],
      invalid: [],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use new line as partition`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [],
      },
    )

    describe(`${ruleName}: newlinesBetween`, () => {
      ruleTester.run(
        `${ruleName}(${type}): removes newlines when never`,
        rule,
        {
          invalid: [
            {
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
                  newlinesBetween: 'never',
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
            },
          ],
          valid: [],
        },
      )

      ruleTester.run(
        `${ruleName}(${type}): keeps one newline when always`,
        rule,
        {
          invalid: [
            {
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
                  newlinesBetween: 'always',
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
            },
          ],
          valid: [],
        },
      )

      describe(`${ruleName}(${type}): "newlinesBetween" inside groups`, () => {
        ruleTester.run(
          `${ruleName}(${type}): handles "newlinesBetween" between consecutive groups`,
          rule,
          {
            invalid: [
              {
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
              },
            ],
            valid: [],
          },
        )

        describe(`${ruleName}(${type}): "newlinesBetween" between non-consecutive groups`, () => {
          for (let [globalNewlinesBetween, groupNewlinesBetween] of [
            ['always', 'never'] as const,
            ['always', 'ignore'] as const,
            ['never', 'always'] as const,
            ['ignore', 'always'] as const,
          ]) {
            ruleTester.run(
              `${ruleName}(${type}): enforces a newline if the global option is "${globalNewlinesBetween}" and the group option is "${groupNewlinesBetween}"`,
              rule,
              {
                invalid: [
                  {
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
                  },
                ],
                valid: [],
              },
            )
          }

          for (let [globalNewlinesBetween, groupNewlinesBetween] of [
            ['ignore', 'never'] as const,
            ['never', 'ignore'] as const,
          ]) {
            ruleTester.run(
              `${ruleName}(${type}): does not enforce a newline if the global option is "${globalNewlinesBetween}" and the group option is "${groupNewlinesBetween}"`,
              rule,
              {
                valid: [
                  {
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
                    code: dedent`
                      <Component
                        a

                        b
                      />
                    `,
                  },
                  {
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
                    code: dedent`
                      <Component
                        a
                        b
                      />
                    `,
                  },
                ],
                invalid: [],
              },
            )
          }
        })
      })

      ruleTester.run(
        `${ruleName}(${type}): handles newlines and comment after fixes`,
        rule,
        {
          invalid: [
            {
              output: [
                dedent`
                  <Component
                    a // Comment after
                    b

                    c
                  />
                `,
                dedent`
                  <Component
                    a // Comment after

                    b
                    c
                  />
                `,
              ],
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
              code: dedent`
                <Component
                  b
                  a // Comment after

                  c
                />
              `,
            },
          ],
          valid: [],
        },
      )
    })
  })

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts jsx props`, rule, {
      invalid: [
        {
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
        },
      ],
      valid: [
        {
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
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts jsx props with namespaced names`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break the property list`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set shorthand props position`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  leftGroup: 'shorthand',
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
            options: [
              {
                ...options,
                groups: ['unknown', 'shorthand'],
              },
            ],
          },
        ],
        valid: [
          {
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
            options: [
              {
                ...options,
                groups: ['unknown', 'shorthand'],
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set callback props position`,
      rule,
      {
        invalid: [
          {
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
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
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
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
              },
            ],
            code: dedent`
              <Element
                a="a"
                b="b"
                onChange={handleChange}
              />
            `,
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set multiline props position`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'multiline',
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
            options: [
              {
                ...options,
                groups: ['multiline', 'unknown'],
              },
            ],
          },
        ],
        valid: [
          {
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
            options: [
              {
                ...options,
                groups: [['multiline'], 'unknown'],
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to set priority props`, rule, {
      invalid: [
        {
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
          options: [
            {
              ...options,
              customGroups: { top: ['d', 'e'] },
              groups: ['top', 'unknown'],
            },
          ],
        },
      ],
      valid: [
        {
          code: dedent`
            <Element
              d="ddd"
              e="ee"
              a="aaaa"
              b="bbb"
              c="cc"
            />
          `,
          options: [
            {
              ...options,
              customGroups: { top: ['d', 'e'] },
              groups: ['top', 'unknown'],
            },
          ],
        },
      ],
    })
  })

  describe(`${ruleName}: sorts by custom alphabet`, () => {
    let type = 'custom'

    let alphabet = Alphabet.generateRecommendedAlphabet()
      .sortByLocaleCompare('en-US')
      .getCharacters()
    let options = {
      type: 'custom',
      order: 'asc',
      alphabet,
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts jsx props`, rule, {
      invalid: [
        {
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
        },
      ],
      valid: [
        {
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
        },
      ],
    })
  })

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(`${ruleName}(${type}): sorts jsx props`, rule, {
      invalid: [
        {
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
        },
      ],
      valid: [
        {
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
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts jsx props with namespaced names`,
      rule,
      {
        invalid: [
          {
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
          },
        ],
        valid: [
          {
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
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break the property list`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  right: 'f',
                  left: 'd',
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
                  e="ee"
                  f="f"
                  d
                  {...data}
                  a="aaa"
                  b="bb"
                  c="c"
                />
              )
            `,
            code: dedent`
              let Component = () => (
                <Element
                  e="ee"
                  d
                  f="f"
                  {...data}
                  b="bb"
                  a="aaa"
                  c="c"
                />
              )
            `,
            options: [options],
          },
        ],
        valid: [
          {
            code: dedent`
              let Component = () => (
                <Element
                  e="ee"
                  f="f"
                  d
                  {...data}
                  a="aaa"
                  b="bb"
                  c="c"
                />
              )
            `,
            options: [options],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set shorthand props position`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  leftGroup: 'shorthand',
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
            options: [
              {
                ...options,
                groups: ['unknown', 'shorthand'],
              },
            ],
          },
        ],
        valid: [
          {
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
            options: [
              {
                ...options,
                groups: ['unknown', 'shorthand'],
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set callback props position`,
      rule,
      {
        invalid: [
          {
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
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
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
          },
        ],
        valid: [
          {
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
              },
            ],
            code: dedent`
              <Element
                a="a"
                b="b"
                onChange={handleChange}
              />
            `,
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set multiline props position`,
      rule,
      {
        invalid: [
          {
            errors: [
              {
                data: {
                  rightGroup: 'multiline',
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
            options: [
              {
                ...options,
                groups: ['multiline', 'unknown'],
              },
            ],
          },
        ],
        valid: [
          {
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
            options: [
              {
                ...options,
                groups: [['multiline'], 'unknown'],
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to set priority props`, rule, {
      invalid: [
        {
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
          options: [
            {
              ...options,
              customGroups: { top: ['d', 'e'] },
              groups: ['top', 'unknown'],
            },
          ],
        },
      ],
      valid: [
        {
          options: [
            {
              ...options,
              customGroups: { top: ['d', 'e'] },
              groups: ['top', 'unknown'],
              ignoreCase: true,
            },
          ],
          code: dedent`
            <Element
              d="ddd"
              e="ee"
              a="aaaa"
              b="bbb"
              c="cc"
            />
          `,
        },
      ],
    })
  })

  describe(`${ruleName}: validating group configuration`, () => {
    ruleTester.run(
      `${ruleName}: allows predefined groups and defined custom groups`,
      rule,
      {
        valid: [
          {
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
            options: [
              {
                customGroups: {
                  myCustomGroup: 'x',
                },
                groups: ['multiline', 'shorthand', 'unknown', 'myCustomGroup'],
              },
            ],
          },
        ],
        invalid: [],
      },
    )
  })

  describe(`${ruleName}: misc`, () => {
    ruleTester.run(
      `${ruleName}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          dedent`
            let Component = () => (
              <Element
                a="a"
                b="b"
                c="c"
              />
            )
          `,
          {
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
          },
        ],
        invalid: [],
      },
    )

    ruleTester.run(`${ruleName}: does not work with empty props`, rule, {
      valid: [
        dedent`
          let Component = () => (
            <Element />
          )
        `,
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}: does not work with single prop`, rule, {
      valid: [
        dedent`
          let Component = () => (
            <Element a="a" />
          )
        `,
      ],
      invalid: [],
    })

    ruleTester.run(
      `${ruleName}: allow to disable rule for some JSX elements`,
      rule,
      {
        valid: [
          {
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
                ignorePattern: ['Element'],
              },
            ],
          },
        ],
        invalid: [],
      },
    )

    let eslintDisableRuleTesterName = `${ruleName}: supports 'eslint-disable' for individual nodes`
    ruleTester.run(eslintDisableRuleTesterName, rule, {
      invalid: [
        {
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
          output: dedent`
            <Element
              b="b"
              c="c"
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
              a="a"
            />
          `,
          code: dedent`
            <Element
              c="c"
              b="b"
              // eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName}
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
          options: [{}],
        },
        {
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
              a="a" // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            />
          `,
          code: dedent`
            <Element
              c="c"
              b="b"
              a="a" // eslint-disable-line @rule-tester/${eslintDisableRuleTesterName}
            />
          `,
          options: [{}],
        },
        {
          output: dedent`
            <Element
              b="b"
              c="c"
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
              a="a"
            />
          `,
          code: dedent`
            <Element
              c="c"
              b="b"
              /* eslint-disable-next-line @rule-tester/${eslintDisableRuleTesterName} */
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
          options: [{}],
        },
        {
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
              a="a" /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            />
          `,
          code: dedent`
            <Element
              c="c"
              b="b"
              a="a" /* eslint-disable-line @rule-tester/${eslintDisableRuleTesterName} */
            />
          `,
          options: [{}],
        },
        {
          output: dedent`
            <Element
              a="a"
              d="d"
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
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
              /* eslint-disable @rule-tester/${eslintDisableRuleTesterName} */
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
        },
      ],
      valid: [],
    })
  })
})
