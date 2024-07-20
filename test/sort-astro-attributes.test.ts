import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

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
    parser: require.resolve('astro-eslint-parser'),
    parserOptions: {
      parser: {
        ts: '@typescript-eslint/parser',
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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'
              ---
              <Component a="a" bb="b" ccc="c" d />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'
              ---
              <Component a="a" ccc="c" bb="b" d />
            `,
            output: dedent`
              ---
                import Component from '../Component.astro'
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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

                import data from './data.json'
              ---
              <Component bb="b" {...data} a="a" ccc="c" />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

                import data from './data.json'
              ---
              <Component bb="b" {...data} ccc="c" a="a" />
            `,
            output: dedent`
              ---
                import Component from '../Component.astro'

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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from './Component.astro'

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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from './Component.astro'

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
                import Component from './Component.astro'

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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

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
                import Component from '../Component.astro'

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
                groups: ['unknown', ['svelte-shorthand', 'shorthand']],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'c',
                  right: 'dd',
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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

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
                import Component from '../Component.astro'

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
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'a',
                  right: 'b',
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
          filename: 'component.astro',
          code: dedent`
            ---
              import Component from '~/Component.astro'
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
          filename: 'component.astro',
          code: dedent`
            ---
              import Component from '~/Component.astro'
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
              import Component from '~/Component.astro'
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
              messageId: 'unexpectedAstroAttributesOrder',
              data: {
                left: 'a',
                right: 'b',
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
    })
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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'
              ---
              <Component a="a" bb="b" ccc="c" d />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'
              ---
              <Component a="a" ccc="c" bb="b" d />
            `,
            output: dedent`
              ---
                import Component from '../Component.astro'
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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

                import data from './data.json'
              ---
              <Component bb="b" {...data} a="a" ccc="c" />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

                import data from './data.json'
              ---
              <Component bb="b" {...data} ccc="c" a="a" />
            `,
            output: dedent`
              ---
                import Component from '../Component.astro'

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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from './Component.astro'

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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from './Component.astro'

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
                import Component from './Component.astro'

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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

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
                import Component from '../Component.astro'

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
                groups: ['unknown', ['svelte-shorthand', 'shorthand']],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'c',
                  right: 'dd',
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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

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
                import Component from '../Component.astro'

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
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'a',
                  right: 'b',
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
          filename: 'component.astro',
          code: dedent`
            ---
              import Component from '~/Component.astro'
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
          filename: 'component.astro',
          code: dedent`
            ---
              import Component from '~/Component.astro'
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
              import Component from '~/Component.astro'
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
              messageId: 'unexpectedAstroAttributesOrder',
              data: {
                left: 'a',
                right: 'b',
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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'
              ---
              <Component ccc="c" bb="b" a="a" d />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'
              ---
              <Component a="a" ccc="c" bb="b" d />
            `,
            output: dedent`
              ---
                import Component from '../Component.astro'
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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

                import data from './data.json'
              ---
              <Component bb="b" {...data} ccc="c" a="a" />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

                import data from './data.json'
              ---
              <Component bb="b" {...data} a="a" ccc="c" />
            `,
            output: dedent`
              ---
                import Component from '../Component.astro'

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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from './Component.astro'

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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from './Component.astro'

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
                import Component from './Component.astro'

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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

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
                import Component from '../Component.astro'

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
                groups: ['unknown', ['svelte-shorthand', 'shorthand']],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'c',
                  right: 'dd',
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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

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
            filename: 'component.astro',
            code: dedent`
              ---
                import Component from '../Component.astro'

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
                import Component from '../Component.astro'

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
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'a',
                  right: 'b',
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
          filename: 'component.astro',
          code: dedent`
            ---
              import Component from '~/Component.astro'
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
          filename: 'component.astro',
          code: dedent`
            ---
              import Component from '~/Component.astro'
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
              import Component from '~/Component.astro'
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
              messageId: 'unexpectedAstroAttributesOrder',
              data: {
                left: 'a',
                right: 'b',
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
    })
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
