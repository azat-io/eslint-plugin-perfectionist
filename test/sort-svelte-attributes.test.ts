import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-svelte-attributes'

describe(RULE_NAME, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester({
    parser: require.resolve('svelte-eslint-parser'),
    parserOptions: {
      parser: {
        ts: '@typescript-eslint/parser',
      },
    },
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    let options = {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts props in svelte components`,
      rule,
      {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../Component.svelte'
              </script>

              <Component a="aaa" b="bb" c="c" d />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../Component.svelte'
              </script>

              <Component b="bb" a="aaa" d c="c" />
            `,
            output: dedent`
              <script>
                import Component from '../Component.svelte'
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

    ruleTester.run(
      `${RULE_NAME}(${type}): works with spread attributes`,
      rule,
      {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../Component.svelte'

                let data = {}
              </script>

              <Component c {...data} a="aa" b="b" />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../Component.svelte'

                let data = {}
              </script>

              <Component c {...data} b="b" a="aa" />
            `,
            output: dedent`
              <script>
                import Component from '../Component.svelte'

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
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): works with directives`, rule, {
      valid: [
        {
          filename: 'component.svelte',
          code: dedent`
            <script>
              import { clickOutside } from './click-outside.js'
              import Component from './Component.svelte'

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
          filename: 'component.svelte',
          code: dedent`
            <script>
              import { clickOutside } from './click-outside.js'
              import Component from './Component.svelte'

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
              import Component from './Component.svelte'

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
      `${RULE_NAME}(${type}): allows to set shorthand attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../components/Component.svelte'

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
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../components/Component.svelte'

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
                import Component from '../components/Component.svelte'

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
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set multiline attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../components/Component.svelte'

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
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../components/Component.svelte'

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
                import Component from '../components/Component.svelte'

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
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'c',
                  right: 'onClick',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): allows to set custom groups`, rule, {
      valid: [
        {
          filename: 'component.svelte',
          code: dedent`
            <script>
              import Component from '~/Component.svelte'
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
          filename: 'component.svelte',
          code: dedent`
            <script>
              import Component from '~/Component.svelte'
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
              import Component from '~/Component.svelte'
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
              messageId: 'unexpectedSvelteAttributesOrder',
              data: {
                left: 'b',
                right: 'c',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      type: 'alphabetical',
      ignoreCase: true,
      order: 'asc',
    } as const

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts props in svelte components`,
      rule,
      {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../Component.svelte'
              </script>

              <Component a="aaa" b="bb" c="c" d />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../Component.svelte'
              </script>

              <Component b="bb" a="aaa" d c="c" />
            `,
            output: dedent`
              <script>
                import Component from '../Component.svelte'
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

    ruleTester.run(
      `${RULE_NAME}(${type}): works with spread attributes`,
      rule,
      {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../Component.svelte'

                let data = {}
              </script>

              <Component c {...data} a="aa" b="b" />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../Component.svelte'

                let data = {}
              </script>

              <Component c {...data} b="b" a="aa" />
            `,
            output: dedent`
              <script>
                import Component from '../Component.svelte'

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
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): works with directives`, rule, {
      valid: [
        {
          filename: 'component.svelte',
          code: dedent`
            <script>
              import { clickOutside } from './click-outside.js'
              import Component from './Component.svelte'

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
          filename: 'component.svelte',
          code: dedent`
            <script>
              import { clickOutside } from './click-outside.js'
              import Component from './Component.svelte'

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
              import Component from './Component.svelte'

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
      `${RULE_NAME}(${type}): allows to set shorthand attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../components/Component.svelte'

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
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../components/Component.svelte'

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
                import Component from '../components/Component.svelte'

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
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set multiline attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../components/Component.svelte'

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
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../components/Component.svelte'

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
                import Component from '../components/Component.svelte'

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
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'c',
                  right: 'onClick',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): allows to set custom groups`, rule, {
      valid: [
        {
          filename: 'component.svelte',
          code: dedent`
            <script>
              import Component from '~/Component.svelte'
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
          filename: 'component.svelte',
          code: dedent`
            <script>
              import Component from '~/Component.svelte'
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
              import Component from '~/Component.svelte'
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
              messageId: 'unexpectedSvelteAttributesOrder',
              data: {
                left: 'b',
                right: 'c',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts props in svelte components`,
      rule,
      {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../Component.svelte'
              </script>

              <Component a="aaa" b="bb" c="c" d />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../Component.svelte'
              </script>

              <Component b="bb" a="aaa" d c="c" />
            `,
            output: dedent`
              <script>
                import Component from '../Component.svelte'
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

    ruleTester.run(
      `${RULE_NAME}(${type}): works with spread attributes`,
      rule,
      {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../Component.svelte'

                let data = {}
              </script>

              <Component c {...data} a="aa" b="b" />
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../Component.svelte'

                let data = {}
              </script>

              <Component c {...data} b="b" a="aa" />
            `,
            output: dedent`
              <script>
                import Component from '../Component.svelte'

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
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): works with directives`, rule, {
      valid: [
        {
          filename: 'component.svelte',
          code: dedent`
            <script>
              import { clickOutside } from './click-outside.js'
              import Component from './Component.svelte'

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
          filename: 'component.svelte',
          code: dedent`
            <script>
              import { clickOutside } from './click-outside.js'
              import Component from './Component.svelte'

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
              import Component from './Component.svelte'

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
      `${RULE_NAME}(${type}): allows to set shorthand attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../components/Component.svelte'

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
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../components/Component.svelte'

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
                import Component from '../components/Component.svelte'

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
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'c',
                  right: 'b',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set multiline attributes position`,
      rule,
      {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../components/Component.svelte'

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
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Component from '../components/Component.svelte'

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
                import Component from '../components/Component.svelte'

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
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'c',
                  right: 'onClick',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): allows to set custom groups`, rule, {
      valid: [
        {
          filename: 'component.svelte',
          code: dedent`
            <script>
              import Component from '~/Component.svelte'
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
          filename: 'component.svelte',
          code: dedent`
            <script>
              import Component from '~/Component.svelte'
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
              import Component from '~/Component.svelte'
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
              messageId: 'unexpectedSvelteAttributesOrder',
              data: {
                left: 'b',
                right: 'c',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: misc`, () => {
    ruleTester.run(`${RULE_NAME}: works only with .svelte files`, rule, {
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

    ruleTester.run(`${RULE_NAME}: works with special directive keys`, rule, {
      valid: [
        {
          filename: 'component.svelte',
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
