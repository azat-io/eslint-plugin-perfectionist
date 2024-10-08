import { RuleTester } from '@typescript-eslint/rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { afterAll, describe, it } from 'vitest'
import astroParser from 'astro-eslint-parser'
import { dedent } from 'ts-dedent'
import path from 'node:path'

import rule from '../rules/sort-astro-attributes'

let ruleName = 'sort-astro-attributes'

describe(ruleName, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester({
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: {
          tsconfigRootDir: path.join(__dirname, './fixtures'),
          project: './tsconfig.json',
          ts: typescriptParser,
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

    ruleTester.run(
      `${ruleName}(${type}): sorts props in astro components`,
      rule,
      {
        valid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'
              ---
              <Component a="a" bb="b" ccc="c" d />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'
              ---
              <Component a="a" ccc="c" bb="b" d />
            `,
            output: dedent`
              ---
                import Component from '../file.astro'
              ---
              <Component a="a" bb="b" ccc="c" d />
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'ccc',
                  right: 'bb',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): split props intro groups if there is spread props`,
      rule,
      {
        valid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                import data from './data.json'
              ---
              <Component bb="b" {...data} a="a" ccc="c" />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                import data from './data.json'
              ---
              <Component bb="b" {...data} ccc="c" a="a" />
            `,
            output: dedent`
              ---
                import Component from '../file.astro'

                import data from './data.json'
              ---
              <Component bb="b" {...data} a="a" ccc="c" />
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'ccc',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with literal attributes`,
      rule,
      {
        valid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from './file.astro'

                let ccc = 'c'
                let dddd = 'd'
              ---
              <Component
                a="a"
                bb="b"
                {ccc}
                set:html={dddd}
              />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from './file.astro'

                let ccc = 'c'
                let dddd = 'd'
              ---
              <Component
                set:html={dddd}
                a="a"
                bb="b"
                {ccc}
              />
            `,
            output: dedent`
              ---
                import Component from './file.astro'

                let ccc = 'c'
                let dddd = 'd'
              ---
              <Component
                a="a"
                bb="b"
                {ccc}
                set:html={dddd}
              />
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'set:html',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set shorthand attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                let d = 'd'
              ---
              <Component
                a="a"
                dd="d"
                eee="e"
                {b}
                c
              />
            `,
            options: [
              {
                ...options,
                groups: ['unknown', ['astro-shorthand', 'shorthand']],
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                let d = 'd'
              ---
              <Component
                a="a"
                {b}
                c
                dd="d"
                eee="e"
              />
            `,
            output: dedent`
              ---
                import Component from '../file.astro'

                let d = 'd'
              ---
              <Component
                a="a"
                dd="d"
                eee="e"
                {b}
                c
              />
            `,
            options: [
              {
                ...options,
                groups: ['unknown', ['shorthand']],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesGroupOrder',
                data: {
                  left: 'c',
                  leftGroup: 'shorthand',
                  right: 'dd',
                  rightGroup: 'unknown',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set multiline attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                let c = false
              ---
              <Component
                b={() => {
                  c = true
                }}
                a="a"
                {c}
                d={['d', 'd']}
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
        invalid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                let c = false
              ---
              <Component
                a="a"
                b={() => {
                  c = true
                }}
                {c}
                d={['d', 'd']}
              />
            `,
            output: dedent`
              ---
                import Component from '../file.astro'

                let c = false
              ---
              <Component
                b={() => {
                  c = true
                }}
                a="a"
                {c}
                d={['d', 'd']}
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
                messageId: 'unexpectedAstroAttributesGroupOrder',
                data: {
                  left: 'a',
                  leftGroup: 'unknown',
                  right: 'b',
                  rightGroup: 'multiline',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to set custom groups`, rule, {
      valid: [
        {
          filename: 'file.astro',
          code: dedent`
            ---
              import Component from '~/file.astro'
            ---
            <Component
              b="b"
              d="d"
              a="a"
              c={() => {
                /* ... */
              }}
            />
          `,
          options: [
            {
              ...options,
              groups: ['primary', 'secondary', 'unknown'],
              customGroups: {
                primary: ['b'],
                secondary: 'd',
              },
            },
          ],
        },
      ],
      invalid: [
        {
          filename: 'file.astro',
          code: dedent`
            ---
              import Component from '~/file.astro'
            ---
            <Component
              a="a"
              b="b"
              c={() => {
                /* ... */
              }}
              d="d"
            />
          `,
          output: dedent`
            ---
              import Component from '~/file.astro'
            ---
            <Component
              b="b"
              d="d"
              a="a"
              c={() => {
                /* ... */
              }}
            />
          `,
          options: [
            {
              ...options,
              groups: ['primary', 'secondary', 'unknown'],
              customGroups: {
                primary: ['b'],
                secondary: 'd',
              },
            },
          ],
          errors: [
            {
              messageId: 'unexpectedAstroAttributesGroupOrder',
              data: {
                left: 'a',
                leftGroup: 'unknown',
                right: 'b',
                rightGroup: 'primary',
              },
            },
            {
              messageId: 'unexpectedAstroAttributesGroupOrder',
              data: {
                left: 'c',
                leftGroup: 'unknown',
                right: 'd',
                rightGroup: 'secondary',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to use regex matcher for custom groups`,
      rule,
      {
        valid: [
          {
            filename: 'file.astro',
            code: dedent`
            ---
              import Component from '~/file.astro'
            ---
            <Component
              iHaveFooInMyName="iHaveFooInMyName"
              meTooIHaveFoo="meTooIHaveFoo"
              a="a"
              b="b"
            />
            `,
            options: [
              {
                ...options,
                matcher: 'regex',
                groups: ['unknown', 'elementsWithoutFoo'],
                customGroups: {
                  elementsWithoutFoo: '^(?!.*Foo).*$',
                },
              },
            ],
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
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '~/file.astro'
              ---
              <Component
                {a}
                b="b"
                {c}
              />
            `,
            options: [
              {
                ...options,
                specialCharacters: 'trim',
              },
            ],
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
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '~/file.astro'
              ---
              <Component
                ab
                a$c
              />
            `,
            options: [
              {
                ...options,
                specialCharacters: 'remove',
              },
            ],
          },
        ],
        invalid: [],
      },
    )
  })

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(
      `${ruleName}(${type}): sorts props in astro components`,
      rule,
      {
        valid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'
              ---
              <Component a="a" bb="b" ccc="c" d />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'
              ---
              <Component a="a" ccc="c" bb="b" d />
            `,
            output: dedent`
              ---
                import Component from '../file.astro'
              ---
              <Component a="a" bb="b" ccc="c" d />
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'ccc',
                  right: 'bb',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): split props intro groups if there is spread props`,
      rule,
      {
        valid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                import data from './data.json'
              ---
              <Component bb="b" {...data} a="a" ccc="c" />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                import data from './data.json'
              ---
              <Component bb="b" {...data} ccc="c" a="a" />
            `,
            output: dedent`
              ---
                import Component from '../file.astro'

                import data from './data.json'
              ---
              <Component bb="b" {...data} a="a" ccc="c" />
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'ccc',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with literal attributes`,
      rule,
      {
        valid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from './file.astro'

                let ccc = 'c'
                let dddd = 'd'
              ---
              <Component
                a="a"
                bb="b"
                {ccc}
                set:html={dddd}
              />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from './file.astro'

                let ccc = 'c'
                let dddd = 'd'
              ---
              <Component
                set:html={dddd}
                a="a"
                bb="b"
                {ccc}
              />
            `,
            output: dedent`
              ---
                import Component from './file.astro'

                let ccc = 'c'
                let dddd = 'd'
              ---
              <Component
                a="a"
                bb="b"
                {ccc}
                set:html={dddd}
              />
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'set:html',
                  right: 'a',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set shorthand attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                let d = 'd'
              ---
              <Component
                a="a"
                dd="d"
                eee="e"
                {b}
                c
              />
            `,
            options: [
              {
                ...options,
                groups: ['unknown', ['astro-shorthand', 'shorthand']],
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                let d = 'd'
              ---
              <Component
                a="a"
                {b}
                c
                dd="d"
                eee="e"
              />
            `,
            output: dedent`
              ---
                import Component from '../file.astro'

                let d = 'd'
              ---
              <Component
                a="a"
                dd="d"
                eee="e"
                {b}
                c
              />
            `,
            options: [
              {
                ...options,
                groups: ['unknown', ['shorthand']],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesGroupOrder',
                data: {
                  left: 'c',
                  leftGroup: 'shorthand',
                  right: 'dd',
                  rightGroup: 'unknown',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set multiline attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                let c = false
              ---

              <Component
                b={() => {
                  c = true
                }}
                a="a"
                {c}
                d={['d', 'd']}
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
        invalid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                let c = false
              ---

              <Component
                a="a"
                b={() => {
                  c = true
                }}
                {c}
                d={['d', 'd']}
              />
            `,
            output: dedent`
              ---
                import Component from '../file.astro'

                let c = false
              ---

              <Component
                b={() => {
                  c = true
                }}
                a="a"
                {c}
                d={['d', 'd']}
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
                messageId: 'unexpectedAstroAttributesGroupOrder',
                data: {
                  left: 'a',
                  leftGroup: 'unknown',
                  right: 'b',
                  rightGroup: 'multiline',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to set custom groups`, rule, {
      valid: [
        {
          filename: 'file.astro',
          code: dedent`
            ---
              import Component from '~/file.astro'
            ---
            <Component
              b="b"
              d="d"
              a="a"
              c={() => {
                /* ... */
              }}
            />
          `,
          options: [
            {
              ...options,
              groups: ['primary', 'secondary', 'unknown'],
              customGroups: {
                primary: ['b'],
                secondary: 'd',
              },
            },
          ],
        },
      ],
      invalid: [
        {
          filename: 'file.astro',
          code: dedent`
            ---
              import Component from '~/file.astro'
            ---
            <Component
              a="a"
              b="b"
              c={() => {
                /* ... */
              }}
              d="d"
            />
          `,
          output: dedent`
            ---
              import Component from '~/file.astro'
            ---
            <Component
              b="b"
              d="d"
              a="a"
              c={() => {
                /* ... */
              }}
            />
          `,
          options: [
            {
              ...options,
              groups: ['primary', 'secondary', 'unknown'],
              customGroups: {
                primary: ['b'],
                secondary: 'd',
              },
            },
          ],
          errors: [
            {
              messageId: 'unexpectedAstroAttributesGroupOrder',
              data: {
                left: 'a',
                leftGroup: 'unknown',
                right: 'b',
                rightGroup: 'primary',
              },
            },
            {
              messageId: 'unexpectedAstroAttributesGroupOrder',
              data: {
                left: 'c',
                leftGroup: 'unknown',
                right: 'd',
                rightGroup: 'secondary',
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

    ruleTester.run(
      `${ruleName}(${type}): sorts props in astro components`,
      rule,
      {
        valid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'
              ---
              <Component ccc="c" bb="b" a="a" d />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'
              ---
              <Component a="a" ccc="c" bb="b" d />
            `,
            output: dedent`
              ---
                import Component from '../file.astro'
              ---
              <Component ccc="c" bb="b" a="a" d />
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'a',
                  right: 'ccc',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): split props intro groups if there is spread props`,
      rule,
      {
        valid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                import data from './data.json'
              ---
              <Component bb="b" {...data} ccc="c" a="a" />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                import data from './data.json'
              ---
              <Component bb="b" {...data} a="a" ccc="c" />
            `,
            output: dedent`
              ---
                import Component from '../file.astro'

                import data from './data.json'
              ---
              <Component bb="b" {...data} ccc="c" a="a" />
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'a',
                  right: 'ccc',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): works with literal attributes`,
      rule,
      {
        valid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from './file.astro'

                let ccc = 'c'
                let dddd = 'd'
              ---
              <Component
                set:html={dddd}
                bb="b"
                a="a"
                {ccc}
              />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from './file.astro'

                let ccc = 'c'
                let dddd = 'd'
              ---
              <Component
                bb="b"
                set:html={dddd}
                a="a"
                {ccc}
              />
            `,
            output: dedent`
              ---
                import Component from './file.astro'

                let ccc = 'c'
                let dddd = 'd'
              ---
              <Component
                set:html={dddd}
                bb="b"
                a="a"
                {ccc}
              />
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'bb',
                  right: 'set:html',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set shorthand attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                let d = 'd'
              ---
              <Component
                eee="e"
                dd="d"
                a="a"
                {b}
                c
              />
            `,
            options: [
              {
                ...options,
                groups: ['unknown', ['astro-shorthand', 'shorthand']],
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                let d = 'd'
              ---
              <Component
                a="a"
                {b}
                c
                dd="d"
                eee="e"
              />
            `,
            output: dedent`
              ---
                import Component from '../file.astro'

                let d = 'd'
              ---
              <Component
                eee="e"
                dd="d"
                a="a"
                {b}
                c
              />
            `,
            options: [
              {
                ...options,
                groups: ['unknown', ['shorthand']],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesGroupOrder',
                data: {
                  left: 'c',
                  leftGroup: 'shorthand',
                  right: 'dd',
                  rightGroup: 'unknown',
                },
              },
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'dd',
                  right: 'eee',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${ruleName}(${type}): allows to set multiline attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                let c = false
              ---
              <Component
                b={() => {
                  c = true
                }}
                d={['d', 'd']}
                a="a"
                {c}
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
        invalid: [
          {
            filename: 'file.astro',
            code: dedent`
              ---
                import Component from '../file.astro'

                let c = false
              ---
              <Component
                a="a"
                b={() => {
                  c = true
                }}
                {c}
                d={['d', 'd']}
              />
            `,
            output: dedent`
              ---
                import Component from '../file.astro'

                let c = false
              ---
              <Component
                b={() => {
                  c = true
                }}
                d={['d', 'd']}
                a="a"
                {c}
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
                messageId: 'unexpectedAstroAttributesGroupOrder',
                data: {
                  left: 'a',
                  leftGroup: 'unknown',
                  right: 'b',
                  rightGroup: 'multiline',
                },
              },
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'c',
                  right: 'd',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): allows to set custom groups`, rule, {
      valid: [
        {
          filename: 'file.astro',
          code: dedent`
            ---
              import Component from '~/file.astro'
            ---
            <Component
              b="b"
              d="d"
              c={() => {
                /* ... */
              }}
              a="a"
            />
          `,
          options: [
            {
              ...options,
              groups: ['primary', 'secondary', 'unknown'],
              customGroups: {
                primary: ['b'],
                secondary: 'd',
              },
            },
          ],
        },
      ],
      invalid: [
        {
          filename: 'file.astro',
          code: dedent`
            ---
              import Component from '~/file.astro'
            ---
            <Component
              a="a"
              b="b"
              c={() => {
                /* ... */
              }}
              d="d"
            />
          `,
          output: dedent`
            ---
              import Component from '~/file.astro'
            ---
            <Component
              b="b"
              d="d"
              c={() => {
                /* ... */
              }}
              a="a"
            />
          `,
          options: [
            {
              ...options,
              groups: ['primary', 'secondary', 'unknown'],
              customGroups: {
                primary: ['b'],
                secondary: 'd',
              },
            },
          ],
          errors: [
            {
              messageId: 'unexpectedAstroAttributesGroupOrder',
              data: {
                left: 'a',
                leftGroup: 'unknown',
                right: 'b',
                rightGroup: 'primary',
              },
            },
            {
              messageId: 'unexpectedAstroAttributesGroupOrder',
              data: {
                left: 'c',
                leftGroup: 'unknown',
                right: 'd',
                rightGroup: 'secondary',
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
            filename: 'file.astro',
            code: dedent`
          ---
            import Component from '../file2.astro'
          ---
          <Component a="a" bb="b" />
        `,
            options: [
              {
                groups: [
                  'astro-shorthand',
                  'multiline',
                  'shorthand',
                  'unknown',
                  'myCustomGroup',
                ],
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
    ruleTester.run(`${ruleName}: works only for .astro files`, rule, {
      valid: [
        dedent`
          <Component
            c="c"
            b="b"
            a="a"
          />
        `,
      ],
      invalid: [],
    })
  })
})
