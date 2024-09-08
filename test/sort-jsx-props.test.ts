import { RuleTester } from '@typescript-eslint/rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'
import path from 'node:path'

import rule from '../rules/sort-jsx-props'

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
        tsconfigRootDir: path.join(__dirname, './fixtures'),
        project: './tsconfig.json',
        parser: typescriptParser,
        extraFileExtensions: ['.svelte', '.astro', '.vue'],
        ecmaFeatures: {
          jsx: true,
        },
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
      invalid: [
        {
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedJSXPropsOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts jsx props with namespaced names`,
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
                  d:e="d"
                />
              )
            `,
            options: [options],
          },
        ],
        invalid: [
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'd:e',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break the property list`,
      rule,
      {
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
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'e',
                  right: 'd',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set shorthand props position`,
      rule,
      {
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
        invalid: [
          {
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
            options: [
              {
                ...options,
                groups: ['unknown', 'shorthand'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsGroupOrder',
                data: {
                  left: 'aaaaaa',
                  leftGroup: 'shorthand',
                  right: 'b',
                  rightGroup: 'unknown',
                },
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
        valid: [
          {
            code: dedent`
              <Element
                a="a"
                b="b"
                onChange={handleChange}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <Element
                onChange={handleChange}
                a="a"
                b="b"
              />
            `,
            output: dedent`
              <Element
                a="a"
                b="b"
                onChange={handleChange}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsGroupOrder',
                data: {
                  left: 'onChange',
                  leftGroup: 'callback',
                  right: 'a',
                  rightGroup: 'unknown',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set multiline props position`,
      rule,
      {
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
        invalid: [
          {
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
            options: [
              {
                ...options,
                groups: ['multiline', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsGroupOrder',
                data: {
                  left: 'c',
                  leftGroup: 'unknown',
                  right: 'd',
                  rightGroup: 'multiline',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to set priority props`, rule, {
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
      invalid: [
        {
          code: dedent`
              <Element
                a="aaaa"
                b="bbb"
                c="cc"
                d="ddd"
                e="ee"
              />
            `,
          output: dedent`
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
          errors: [
            {
              messageId: 'unexpectedJSXPropsGroupOrder',
              data: {
                left: 'c',
                leftGroup: 'unknown',
                right: 'd',
                rightGroup: 'top',
              },
            },
          ],
        },
      ],
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
      invalid: [
        {
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedJSXPropsOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts jsx props with namespaced names`,
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
                  d:e="d"
                />
              )
            `,
            options: [options],
          },
        ],
        invalid: [
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'd:e',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break the property list`,
      rule,
      {
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
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'e',
                  right: 'd',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set shorthand props position`,
      rule,
      {
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
        invalid: [
          {
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
            options: [
              {
                ...options,
                groups: ['unknown', 'shorthand'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsGroupOrder',
                data: {
                  left: 'aaaaaa',
                  leftGroup: 'shorthand',
                  right: 'b',
                  rightGroup: 'unknown',
                },
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
        valid: [
          {
            code: dedent`
              <Element
                a="a"
                b="b"
                onChange={handleChange}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <Element
                onChange={handleChange}
                a="a"
                b="b"
              />
            `,
            output: dedent`
              <Element
                a="a"
                b="b"
                onChange={handleChange}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsGroupOrder',
                data: {
                  left: 'onChange',
                  leftGroup: 'callback',
                  right: 'a',
                  rightGroup: 'unknown',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set multiline props position`,
      rule,
      {
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
        invalid: [
          {
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
            options: [
              {
                ...options,
                groups: ['multiline', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsGroupOrder',
                data: {
                  left: 'c',
                  leftGroup: 'unknown',
                  right: 'd',
                  rightGroup: 'multiline',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to set priority props`, rule, {
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
      invalid: [
        {
          code: dedent`
              <Element
                a="aaaa"
                b="bbb"
                c="cc"
                d="ddd"
                e="ee"
              />
            `,
          output: dedent`
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
          errors: [
            {
              messageId: 'unexpectedJSXPropsGroupOrder',
              data: {
                left: 'c',
                leftGroup: 'unknown',
                right: 'd',
                rightGroup: 'top',
              },
            },
          ],
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
      invalid: [
        {
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedJSXPropsOrder',
              data: {
                left: 'c',
                right: 'b',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): sorts jsx props with namespaced names`,
      rule,
      {
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
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'b',
                  right: 'd:e',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): does not break the property list`,
      rule,
      {
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
        invalid: [
          {
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'd',
                  right: 'f',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set shorthand props position`,
      rule,
      {
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
        invalid: [
          {
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
            options: [
              {
                ...options,
                groups: ['unknown', 'shorthand'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsGroupOrder',
                data: {
                  left: 'aaaaaa',
                  leftGroup: 'shorthand',
                  right: 'b',
                  rightGroup: 'unknown',
                },
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
        valid: [
          {
            code: dedent`
              <Element
                a="a"
                b="b"
                onChange={handleChange}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <Element
                onChange={handleChange}
                a="a"
                b="b"
              />
            `,
            output: dedent`
              <Element
                a="a"
                b="b"
                onChange={handleChange}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsGroupOrder',
                data: {
                  left: 'onChange',
                  leftGroup: 'callback',
                  right: 'a',
                  rightGroup: 'unknown',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set multiline props position`,
      rule,
      {
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
        invalid: [
          {
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
            options: [
              {
                ...options,
                groups: ['multiline', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsGroupOrder',
                data: {
                  left: 'c',
                  leftGroup: 'unknown',
                  right: 'd',
                  rightGroup: 'multiline',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'd',
                  right: 'e',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to set priority props`, rule, {
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
              ignoreCase: true,
            },
          ],
        },
      ],
      invalid: [
        {
          code: dedent`
              <Element
                a="aaaa"
                b="bbb"
                c="cc"
                d="ddd"
                e="ee"
              />
            `,
          output: dedent`
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
          errors: [
            {
              messageId: 'unexpectedJSXPropsGroupOrder',
              data: {
                left: 'c',
                leftGroup: 'unknown',
                right: 'd',
                rightGroup: 'top',
              },
            },
          ],
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
                groups: ['multiline', 'shorthand', 'unknown', 'myCustomGroup'],
                customGroups: {
                  myCustomGroup: 'x',
                },
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
  })
})
