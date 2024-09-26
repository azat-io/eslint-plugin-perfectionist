import { RuleTester } from '@typescript-eslint/rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { afterAll, describe, it } from 'vitest'
import svelteParser from 'svelte-eslint-parser'
import { dedent } from 'ts-dedent'
import path from 'node:path'

import rule from '../rules/sort-svelte-attributes'

let ruleName = 'sort-svelte-attributes'

describe(ruleName, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester({
    languageOptions: {
      parser: svelteParser,
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
      `${ruleName}(${type}): sorts props in svelte components`,
      rule,
      {
        valid: [
          {
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../file.svelte'
              </script>

              <Component a="aaa" b="bb" c="c" d />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../file.svelte'
              </script>

              <Component b="bb" a="aaa" d c="c" />
            `,
            output: dedent`
              <script>
                import Component from '../file.svelte'
              </script>

              <Component a="aaa" b="bb" c="c" d />
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'd',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): works with spread attributes`, rule, {
      valid: [
        {
          filename: 'file.svelte',
          code: dedent`
              <script>
                import Component from '../file.svelte'

                let data = {}
              </script>

              <Component c {...data} a="aa" b="b" />
            `,
          options: [options],
        },
      ],
      invalid: [
        {
          filename: 'file.svelte',
          code: dedent`
              <script>
                import Component from '../file.svelte'

                let data = {}
              </script>

              <Component c {...data} b="b" a="aa" />
            `,
          output: dedent`
              <script>
                import Component from '../file.svelte'

                let data = {}
              </script>

              <Component c {...data} a="aa" b="b" />
            `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSvelteAttributesOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): works with directives`, rule, {
      valid: [
        {
          filename: 'file.svelte',
          code: dedent`
            <script>
              import { clickOutside } from './click-outside.js'
              import Component from './file.svelte'

              let s = true
            </script>

            <button a="aa" on:click={() => (s = true)}>Show</button>
            {#if s}
              <Component on:outClick={() => (s = false)} use:clickOutside />
            {/if}
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          filename: 'file.svelte',
          code: dedent`
            <script>
              import { clickOutside } from './click-outside.js'
              import Component from './file.svelte'

              let s = true
            </script>

            <button a="aa" on:click={() => (s = true)}>Show</button>
            {#if s}
              <Component use:clickOutside on:outClick={() => (s = false)} />
            {/if}
          `,
          output: dedent`
            <script>
              import { clickOutside } from './click-outside.js'
              import Component from './file.svelte'

              let s = true
            </script>

            <button a="aa" on:click={() => (s = true)}>Show</button>
            {#if s}
              <Component on:outClick={() => (s = false)} use:clickOutside />
            {/if}
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSvelteAttributesOrder',
              data: {
                left: 'use:clickOutside',
                right: 'on:outClick',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to set shorthand attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = true
              </script>

              <Component
                a="aa"
                b="b"
                {c}
                d
              />
            `,
            options: [
              {
                ...options,
                groups: ['unknown', ['svelte-shorthand', 'shorthand']],
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = true
              </script>

              <Component
                a="aa"
                d
                {c}
                b="b"
              />
            `,
            output: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = true
              </script>

              <Component
                a="aa"
                b="b"
                {c}
                d
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
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'd',
                  right: 'c',
                },
              },
              {
                messageId: 'unexpectedSvelteAttributesGroupOrder',
                data: {
                  left: 'c',
                  leftGroup: 'svelte-shorthand',
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
      `${ruleName}(${type}): allows to set multiline attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = 0
              </script>

              <Component
                onClick={() => {
                  c += 1
                }}
                a="aa"
                b="b"
                c={c}
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
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = 0
              </script>

              <Component
                a="aa"
                b="b"
                c={c}
                onClick={() => {
                  c += 1
                }}
              />
            `,
            output: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = 0
              </script>

              <Component
                onClick={() => {
                  c += 1
                }}
                a="aa"
                b="b"
                c={c}
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
                messageId: 'unexpectedSvelteAttributesGroupOrder',
                data: {
                  left: 'c',
                  leftGroup: 'unknown',
                  right: 'onClick',
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
          filename: 'file.svelte',
          code: dedent`
            <script>
              import Component from '~/file.svelte'
            </script>

            <Component
              c="c"
              d={() => {
                /* ... */
              }}
              a="aaa"
              b="bb"
            />
          `,
          options: [
            {
              ...options,
              groups: ['ce', 'd', 'unknown'],
              customGroups: {
                ce: ['c', 'e'],
                d: 'd',
              },
            },
          ],
        },
      ],
      invalid: [
        {
          filename: 'file.svelte',
          code: dedent`
            <script>
              import Component from '~/file.svelte'
            </script>

            <Component
              a="aaa"
              b="bb"
              c="c"
              d={() => {
                /* ... */
              }}
            />
          `,
          output: dedent`
            <script>
              import Component from '~/file.svelte'
            </script>

            <Component
              c="c"
              d={() => {
                /* ... */
              }}
              a="aaa"
              b="bb"
            />
          `,
          options: [
            {
              ...options,
              groups: ['ce', 'd', 'unknown'],
              customGroups: {
                ce: ['c', 'e'],
                d: 'd',
              },
            },
          ],
          errors: [
            {
              messageId: 'unexpectedSvelteAttributesGroupOrder',
              data: {
                left: 'b',
                leftGroup: 'unknown',
                right: 'c',
                rightGroup: 'ce',
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
            filename: 'file.svelte',
            code: dedent`
            <script>
              import Component from '~/file.svelte'
            </script>

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
  })

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(
      `${ruleName}(${type}): sorts props in svelte components`,
      rule,
      {
        valid: [
          {
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../file.svelte'
              </script>

              <Component a="aaa" b="bb" c="c" d />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../file.svelte'
              </script>

              <Component b="bb" a="aaa" d c="c" />
            `,
            output: dedent`
              <script>
                import Component from '../file.svelte'
              </script>

              <Component a="aaa" b="bb" c="c" d />
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'd',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): works with spread attributes`, rule, {
      valid: [
        {
          filename: 'file.svelte',
          code: dedent`
              <script>
                import Component from '../file.svelte'

                let data = {}
              </script>

              <Component c {...data} a="aa" b="b" />
            `,
          options: [options],
        },
      ],
      invalid: [
        {
          filename: 'file.svelte',
          code: dedent`
              <script>
                import Component from '../file.svelte'

                let data = {}
              </script>

              <Component c {...data} b="b" a="aa" />
            `,
          output: dedent`
              <script>
                import Component from '../file.svelte'

                let data = {}
              </script>

              <Component c {...data} a="aa" b="b" />
            `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSvelteAttributesOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): works with directives`, rule, {
      valid: [
        {
          filename: 'file.svelte',
          code: dedent`
            <script>
              import { clickOutside } from './click-outside.js'
              import Component from './file.svelte'

              let s = true
            </script>

            <button a="aa" on:click={() => (s = true)}>Show</button>
            {#if s}
              <Component on:outClick={() => (s = false)} use:clickOutside />
            {/if}
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          filename: 'file.svelte',
          code: dedent`
            <script>
              import { clickOutside } from './click-outside.js'
              import Component from './file.svelte'

              let s = true
            </script>

            <button a="aa" on:click={() => (s = true)}>Show</button>
            {#if s}
              <Component use:clickOutside on:outClick={() => (s = false)} />
            {/if}
          `,
          output: dedent`
            <script>
              import { clickOutside } from './click-outside.js'
              import Component from './file.svelte'

              let s = true
            </script>

            <button a="aa" on:click={() => (s = true)}>Show</button>
            {#if s}
              <Component on:outClick={() => (s = false)} use:clickOutside />
            {/if}
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSvelteAttributesOrder',
              data: {
                left: 'use:clickOutside',
                right: 'on:outClick',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to set shorthand attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = true
              </script>

              <Component
                a="aa"
                b="b"
                {c}
                d
              />
            `,
            options: [
              {
                ...options,
                groups: ['unknown', ['svelte-shorthand', 'shorthand']],
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = true
              </script>

              <Component
                a="aa"
                d
                {c}
                b="b"
              />
            `,
            output: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = true
              </script>

              <Component
                a="aa"
                b="b"
                {c}
                d
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
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'd',
                  right: 'c',
                },
              },
              {
                messageId: 'unexpectedSvelteAttributesGroupOrder',
                data: {
                  left: 'c',
                  leftGroup: 'svelte-shorthand',
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
      `${ruleName}(${type}): allows to set multiline attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = 0
              </script>

              <Component
                onClick={() => {
                  c += 1
                }}
                a="aa"
                b="b"
                c={c}
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
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = 0
              </script>

              <Component
                a="aa"
                b="b"
                c={c}
                onClick={() => {
                  c += 1
                }}
              />
            `,
            output: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = 0
              </script>

              <Component
                onClick={() => {
                  c += 1
                }}
                a="aa"
                b="b"
                c={c}
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
                messageId: 'unexpectedSvelteAttributesGroupOrder',
                data: {
                  left: 'c',
                  leftGroup: 'unknown',
                  right: 'onClick',
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
          filename: 'file.svelte',
          code: dedent`
            <script>
              import Component from '~/file.svelte'
            </script>

            <Component
              c="c"
              d={() => {
                /* ... */
              }}
              a="aaa"
              b="bb"
            />
          `,
          options: [
            {
              ...options,
              groups: ['ce', 'd', 'unknown'],
              customGroups: {
                ce: ['c', 'e'],
                d: 'd',
              },
            },
          ],
        },
      ],
      invalid: [
        {
          filename: 'file.svelte',
          code: dedent`
            <script>
              import Component from '~/file.svelte'
            </script>

            <Component
              a="aaa"
              b="bb"
              c="c"
              d={() => {
                /* ... */
              }}
            />
          `,
          output: dedent`
            <script>
              import Component from '~/file.svelte'
            </script>

            <Component
              c="c"
              d={() => {
                /* ... */
              }}
              a="aaa"
              b="bb"
            />
          `,
          options: [
            {
              ...options,
              groups: ['ce', 'd', 'unknown'],
              customGroups: {
                ce: ['c', 'e'],
                d: 'd',
              },
            },
          ],
          errors: [
            {
              messageId: 'unexpectedSvelteAttributesGroupOrder',
              data: {
                left: 'b',
                leftGroup: 'unknown',
                right: 'c',
                rightGroup: 'ce',
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
      `${ruleName}(${type}): sorts props in svelte components`,
      rule,
      {
        valid: [
          {
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../file.svelte'
              </script>

              <Component a="aaa" b="bb" c="c" d />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../file.svelte'
              </script>

              <Component b="bb" a="aaa" d c="c" />
            `,
            output: dedent`
              <script>
                import Component from '../file.svelte'
              </script>

              <Component a="aaa" b="bb" c="c" d />
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'b',
                  right: 'a',
                },
              },
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'd',
                  right: 'c',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${ruleName}(${type}): works with spread attributes`, rule, {
      valid: [
        {
          filename: 'file.svelte',
          code: dedent`
              <script>
                import Component from '../file.svelte'

                let data = {}
              </script>

              <Component c {...data} a="aa" b="b" />
            `,
          options: [options],
        },
      ],
      invalid: [
        {
          filename: 'file.svelte',
          code: dedent`
              <script>
                import Component from '../file.svelte'

                let data = {}
              </script>

              <Component c {...data} b="b" a="aa" />
            `,
          output: dedent`
              <script>
                import Component from '../file.svelte'

                let data = {}
              </script>

              <Component c {...data} a="aa" b="b" />
            `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSvelteAttributesOrder',
              data: {
                left: 'b',
                right: 'a',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${ruleName}(${type}): works with directives`, rule, {
      valid: [
        {
          filename: 'file.svelte',
          code: dedent`
            <script>
              import { clickOutside } from './click-outside.js'
              import Component from './file.svelte'

              let s = true
            </script>

            <button on:click={() => (s = true)} a="aa">Show</button>
            {#if s}
              <Component on:outClick={() => (s = false)} use:clickOutside />
            {/if}
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          filename: 'file.svelte',
          code: dedent`
            <script>
              import { clickOutside } from './click-outside.js'
              import Component from './file.svelte'

              let s = true
            </script>

            <button a="aa" on:click={() => (s = true)}>Show</button>
            {#if s}
              <Component on:outClick={() => (s = false)} use:clickOutside />
            {/if}
          `,
          output: dedent`
            <script>
              import { clickOutside } from './click-outside.js'
              import Component from './file.svelte'

              let s = true
            </script>

            <button on:click={() => (s = true)} a="aa">Show</button>
            {#if s}
              <Component on:outClick={() => (s = false)} use:clickOutside />
            {/if}
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedSvelteAttributesOrder',
              data: {
                left: 'a',
                right: 'on:click',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${ruleName}(${type}): allows to set shorthand attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = true
              </script>

              <Component
                a="aa"
                b="b"
                {c}
                d
              />
            `,
            options: [
              {
                ...options,
                groups: ['unknown', ['svelte-shorthand', 'shorthand']],
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = true
              </script>

              <Component
                a="aa"
                d
                {c}
                b="b"
              />
            `,
            output: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = true
              </script>

              <Component
                a="aa"
                b="b"
                {c}
                d
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
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'd',
                  right: 'c',
                },
              },
              {
                messageId: 'unexpectedSvelteAttributesGroupOrder',
                data: {
                  left: 'c',
                  leftGroup: 'svelte-shorthand',
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
      `${ruleName}(${type}): allows to set multiline attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = 0
              </script>

              <Component
                onClick={() => {
                  c += 1
                }}
                a="aa"
                b="b"
                c={c}
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
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = 0
              </script>

              <Component
                a="aa"
                b="b"
                c={c}
                onClick={() => {
                  c += 1
                }}
              />
            `,
            output: dedent`
              <script>
                import Component from '../components/file.svelte'

                let c = 0
              </script>

              <Component
                onClick={() => {
                  c += 1
                }}
                a="aa"
                b="b"
                c={c}
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
                messageId: 'unexpectedSvelteAttributesGroupOrder',
                data: {
                  left: 'c',
                  leftGroup: 'unknown',
                  right: 'onClick',
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
          filename: 'file.svelte',
          code: dedent`
            <script>
              import Component from '~/file.svelte'
            </script>

            <Component
              c="c"
              d={() => {
                /* ... */
              }}
              a="aaa"
              b="bb"
            />
          `,
          options: [
            {
              ...options,
              groups: ['ce', 'd', 'unknown'],
              customGroups: {
                ce: ['c', 'e'],
                d: 'd',
              },
            },
          ],
        },
      ],
      invalid: [
        {
          filename: 'file.svelte',
          code: dedent`
            <script>
              import Component from '~/file.svelte'
            </script>

            <Component
              a="aaa"
              b="bb"
              c="c"
              d={() => {
                /* ... */
              }}
            />
          `,
          output: dedent`
            <script>
              import Component from '~/file.svelte'
            </script>

            <Component
              c="c"
              d={() => {
                /* ... */
              }}
              a="aaa"
              b="bb"
            />
          `,
          options: [
            {
              ...options,
              groups: ['ce', 'd', 'unknown'],
              customGroups: {
                ce: ['c', 'e'],
                d: 'd',
              },
            },
          ],
          errors: [
            {
              messageId: 'unexpectedSvelteAttributesGroupOrder',
              data: {
                left: 'b',
                leftGroup: 'unknown',
                right: 'c',
                rightGroup: 'ce',
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
            filename: 'file.svelte',
            code: dedent`
              <script>
                import Component from '../file2.svelte'
              </script>

              <Component a="aaa" b="bb" />
            `,
            options: [
              {
                groups: [
                  'svelte-shorthand',
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
    ruleTester.run(`${ruleName}: works only with .svelte files`, rule, {
      valid: [
        {
          filename: 'component.ts',
          code: dedent`
            <Component c="c" b="bb" a="aaa" />
          `,
          options: [
            {
              type: 'line-length',
              order: 'desc',
            },
          ],
        },
      ],
      invalid: [],
    })

    ruleTester.run(`${ruleName}: works with special directive keys`, rule, {
      valid: [
        {
          filename: 'file.svelte',
          code: dedent`
            <svelte:element key={1} this={expression} />
          `,
          options: [
            {
              type: 'alphabetical',
              order: 'asc',
            },
          ],
        },
      ],
      invalid: [],
    })
  })
})
