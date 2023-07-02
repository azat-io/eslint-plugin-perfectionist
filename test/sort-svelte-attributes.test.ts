import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-svelte-attributes'
import { SortOrder, SortType } from '../typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    // @ts-ignore
    parser: require.resolve('svelte-eslint-parser'),
    parserOptions: {
      parser: {
        ts: '@typescript-eslint/parser',
      },
    },
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    it(`${RULE_NAME}(${type}): sorts props in svelte components`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.svelte'
              </script>

              <HeavenChild age={14} name="Tokio" partner="Kona" sick />
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.svelte'
              </script>

              <HeavenChild partner="Kona" name="Tokio" age={14} sick />
            `,
            output: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.svelte'
              </script>

              <HeavenChild age={14} name="Tokio" partner="Kona" sick />
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'partner',
                  right: 'name',
                },
              },
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'name',
                  right: 'age',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with spread attributes`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Sorcerer from '../Sorcerer.svelte'

                let data = {}
              </script>

              <Sorcerer isAlive {...data} firstName="Satoru" lastName="Gojo" />
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Sorcerer from '../Sorcerer.svelte'

                let data = {}
              </script>

              <Sorcerer isAlive {...data} lastName="Gojo" firstName="Satoru" />
            `,
            output: dedent`
              <script>
                import Sorcerer from '../Sorcerer.svelte'

                let data = {}
              </script>

              <Sorcerer isAlive {...data} firstName="Satoru" lastName="Gojo" />
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'lastName',
                  right: 'firstName',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with directives`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import { clickOutside } from './click-outside.js'
                import Migi from './Migi.svelte'

                let showParasite = true
              </script>

              <button id="hand" on:click={() => (showParasite = true)}>Show Modal</button>
              {#if showParasite}
                <Migi on:outclick={() => (showParasite = false)} use:clickOutside />
              {/if}
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import { clickOutside } from './click-outside.js'
                import Migi from './Migi.svelte'

                let showParasite = true
              </script>

              <button on:click={() => (showParasite = true)} id="hand">Show Modal</button>
              {#if showParasite}
                <Migi use:clickOutside on:outclick={() => (showParasite = false)} />
              {/if}
            `,
            output: dedent`
              <script>
                import { clickOutside } from './click-outside.js'
                import Migi from './Migi.svelte'

                let showParasite = true
              </script>

              <button id="hand" on:click={() => (showParasite = true)}>Show Modal</button>
              {#if showParasite}
                <Migi on:outclick={() => (showParasite = false)} use:clickOutside />
              {/if}
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'on:click',
                  right: 'id',
                },
              },
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'use:clickOutside',
                  right: 'on:outclick',
                },
              },
            ],
          },
        ],
      })
    })
  })

  describe(`${RULE_NAME}: sorting by natural order`, () => {
    let type = 'natural-order'

    it(`${RULE_NAME}(${type}): sorts props in svelte components`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.svelte'
              </script>

              <HeavenChild age={14} name="Tokio" partner="Kona" sick />
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.svelte'
              </script>

              <HeavenChild partner="Kona" name="Tokio" age={14} sick />
            `,
            output: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.svelte'
              </script>

              <HeavenChild age={14} name="Tokio" partner="Kona" sick />
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'partner',
                  right: 'name',
                },
              },
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'name',
                  right: 'age',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with spread attributes`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Sorcerer from '../Sorcerer.svelte'

                let data = {}
              </script>

              <Sorcerer isAlive {...data} firstName="Satoru" lastName="Gojo" />
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Sorcerer from '../Sorcerer.svelte'

                let data = {}
              </script>

              <Sorcerer isAlive {...data} lastName="Gojo" firstName="Satoru" />
            `,
            output: dedent`
              <script>
                import Sorcerer from '../Sorcerer.svelte'

                let data = {}
              </script>

              <Sorcerer isAlive {...data} firstName="Satoru" lastName="Gojo" />
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'lastName',
                  right: 'firstName',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with directives`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import { clickOutside } from './click-outside.js'
                import Migi from './Migi.svelte'

                let showParasite = true
              </script>

              <button id="hand" on:click={() => (showParasite = true)}>Show Modal</button>
              {#if showParasite}
                <Migi on:outclick={() => (showParasite = false)} use:clickOutside />
              {/if}
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import { clickOutside } from './click-outside.js'
                import Migi from './Migi.svelte'

                let showParasite = true
              </script>

              <button on:click={() => (showParasite = true)} id="hand">Show Modal</button>
              {#if showParasite}
                <Migi use:clickOutside on:outclick={() => (showParasite = false)} />
              {/if}
            `,
            output: dedent`
              <script>
                import { clickOutside } from './click-outside.js'
                import Migi from './Migi.svelte'

                let showParasite = true
              </script>

              <button id="hand" on:click={() => (showParasite = true)}>Show Modal</button>
              {#if showParasite}
                <Migi on:outclick={() => (showParasite = false)} use:clickOutside />
              {/if}
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'on:click',
                  right: 'id',
                },
              },
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'use:clickOutside',
                  right: 'on:outclick',
                },
              },
            ],
          },
        ],
      })
    })
  })

  describe(`${RULE_NAME}: sorting by line length`, () => {
    let type = 'line-length-order'

    it(`${RULE_NAME}(${type}): sorts props in svelte components`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.svelte'
              </script>

              <HeavenChild partner="Kona" name="Tokio" age={14} sick />
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.svelte'
              </script>

              <HeavenChild age={14} name="Tokio" partner="Kona" sick />
            `,
            output: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.svelte'
              </script>

              <HeavenChild partner="Kona" name="Tokio" age={14} sick />
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'age',
                  right: 'name',
                },
              },
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'name',
                  right: 'partner',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with spread attributes`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Sorcerer from '../Sorcerer.svelte'

                let data = {}
              </script>

              <Sorcerer isAlive {...data} firstName="Satoru" lastName="Gojo" />
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Sorcerer from '../Sorcerer.svelte'

                let data = {}
              </script>

              <Sorcerer isAlive {...data} lastName="Gojo" firstName="Satoru" />
            `,
            output: dedent`
              <script>
                import Sorcerer from '../Sorcerer.svelte'

                let data = {}
              </script>

              <Sorcerer isAlive {...data} firstName="Satoru" lastName="Gojo" />
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'lastName',
                  right: 'firstName',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with directives`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import { clickOutside } from './click-outside.js'
                import Migi from './Migi.svelte'

                let showParasite = true
              </script>

              <button on:click={() => (showParasite = true)} id="hand">Show Modal</button>
              {#if showParasite}
                <Migi on:outclick={() => (showParasite = false)} use:clickOutside />
              {/if}
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import { clickOutside } from './click-outside.js'
                import Migi from './Migi.svelte'

                let showParasite = true
              </script>

              <button on:click={() => (showParasite = true)} id="hand">Show Modal</button>
              {#if showParasite}
                <Migi use:clickOutside on:outclick={() => (showParasite = false)} />
              {/if}
            `,
            output: dedent`
              <script>
                import { clickOutside } from './click-outside.js'
                import Migi from './Migi.svelte'

                let showParasite = true
              </script>

              <button on:click={() => (showParasite = true)} id="hand">Show Modal</button>
              {#if showParasite}
                <Migi on:outclick={() => (showParasite = false)} use:clickOutside />
              {/if}
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'use:clickOutside',
                  right: 'on:outclick',
                },
              },
            ],
          },
        ],
      })
    })
  })

  describe(`${RULE_NAME}: misc`, () => {
    it(`${RULE_NAME}: works only with .svelte files`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.ts',
            code: dedent`
              <KessokuBandMember firstName="Hitori" lastName="Gotou" instrument="guitar" />
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
          },
        ],
        invalid: [],
      })
    })

    it(`${RULE_NAME}: works with special directive keys`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <svelte:element key={1} this={expression} />
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
          },
        ],
        invalid: [],
      })
    })
  })
})
