import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-svelte-attributes'
import { SortOrder, SortType } from '../typings'

describe(RULE_NAME, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester({
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

    let options = {
      type: SortType.alphabetical,
      order: SortOrder.asc,
      'ignore-case': false,
    }

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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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

    it(`${RULE_NAME}(${type}): allows to set shorthand attributes position`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Reborn from '../components/Reborn.svelte'

                let isAlive = true
              </script>

              <Reborn
                age={23}
                firstName="Rudeus"
                lastName="Greyrat"
                {isAlive}
                reincarnated
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
                import Reborn from '../components/Reborn.svelte'

                let isAlive = true
              </script>

              <Reborn
                age={23}
                reincarnated
                {isAlive}
                firstName="Rudeus"
                lastName="Greyrat"
              />
            `,
            output: dedent`
              <script>
                import Reborn from '../components/Reborn.svelte'

                let isAlive = true
              </script>

              <Reborn
                age={23}
                firstName="Rudeus"
                lastName="Greyrat"
                {isAlive}
                reincarnated
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
                  left: 'reincarnated',
                  right: 'isAlive',
                },
              },
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'isAlive',
                  right: 'firstName',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set multiline attributes position`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Hero from '../components/Hero.svelte'

                let frags = 0
              </script>

              <Reborn
                onAttack={() => {
                  frags += 1
                }}
                frags={frags}
                name="One-Punch Man"
                realName="Saitama"
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
                import Hero from '../components/Hero.svelte'

                let frags = 0
              </script>

              <Reborn
                frags={frags}
                onAttack={() => {
                  frags += 1
                }}
                name="One-Punch Man"
                realName="Saitama"
              />
            `,
            output: dedent`
              <script>
                import Hero from '../components/Hero.svelte'

                let frags = 0
              </script>

              <Reborn
                onAttack={() => {
                  frags += 1
                }}
                frags={frags}
                name="One-Punch Man"
                realName="Saitama"
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
                  left: 'frags',
                  right: 'onAttack',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set custom groups`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Robot from '~/base/robot.svelte'
              </script>

              <Robot
                id="42f1b85f-54ef-413d-b99e-27c9e9610fc2"
                name="Reg"
                handlePushHand={() => {
                  /* ... */
                }}
                team="Team Riko"
              />
            `,
            options: [
              {
                ...options,
                groups: ['top', 'handlers', 'unknown'],
                'custom-groups': {
                  top: ['id', 'name'],
                  handlers: 'handle*',
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
                import Robot from '~/base/robot.svelte'
              </script>

              <Robot
                handlePushHand={() => {
                  /* ... */
                }}
                name="Reg"
                team="Team Riko"
                id="42f1b85f-54ef-413d-b99e-27c9e9610fc2"
              />
            `,
            output: dedent`
              <script>
                import Robot from '~/base/robot.svelte'
              </script>

              <Robot
                id="42f1b85f-54ef-413d-b99e-27c9e9610fc2"
                name="Reg"
                handlePushHand={() => {
                  /* ... */
                }}
                team="Team Riko"
              />
            `,
            options: [
              {
                ...options,
                groups: ['top', 'handlers', 'unknown'],
                'custom-groups': {
                  top: ['id', 'name'],
                  handlers: 'handle*',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'handlePushHand',
                  right: 'name',
                },
              },
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'team',
                  right: 'id',
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

    let options = {
      type: SortType.alphabetical,
      order: SortOrder.asc,
      'ignore-case': false,
    }

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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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

    it(`${RULE_NAME}(${type}): allows to set shorthand attributes position`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Reborn from '../components/Reborn.svelte'

                let isAlive = true
              </script>

              <Reborn
                age={23}
                firstName="Rudeus"
                lastName="Greyrat"
                {isAlive}
                reincarnated
              />
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
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Reborn from '../components/Reborn.svelte'

                let isAlive = true
              </script>

              <Reborn
                age={23}
                reincarnated
                {isAlive}
                firstName="Rudeus"
                lastName="Greyrat"
              />
            `,
            output: dedent`
              <script>
                import Reborn from '../components/Reborn.svelte'

                let isAlive = true
              </script>

              <Reborn
                age={23}
                firstName="Rudeus"
                lastName="Greyrat"
                {isAlive}
                reincarnated
              />
            `,
            options: [
              {
                ...options,
                groups: ['unknown', 'shorthand'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'reincarnated',
                  right: 'isAlive',
                },
              },
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'isAlive',
                  right: 'firstName',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set multiline attributes position`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Hero from '../components/Hero.svelte'

                let frags = 0
              </script>

              <Reborn
                onAttack={() => {
                  frags += 1
                }}
                frags={frags}
                name="One-Punch Man"
                realName="Saitama"
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
                import Hero from '../components/Hero.svelte'

                let frags = 0
              </script>

              <Reborn
                frags={frags}
                onAttack={() => {
                  frags += 1
                }}
                name="One-Punch Man"
                realName="Saitama"
              />
            `,
            output: dedent`
              <script>
                import Hero from '../components/Hero.svelte'

                let frags = 0
              </script>

              <Reborn
                onAttack={() => {
                  frags += 1
                }}
                frags={frags}
                name="One-Punch Man"
                realName="Saitama"
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
                  left: 'frags',
                  right: 'onAttack',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set custom groups`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Robot from '~/base/robot.svelte'
              </script>

              <Robot
                id="42f1b85f-54ef-413d-b99e-27c9e9610fc2"
                name="Reg"
                handlePushHand={() => {
                  /* ... */
                }}
                team="Team Riko"
              />
            `,
            options: [
              {
                ...options,
                groups: ['top', 'handlers', 'unknown'],
                'custom-groups': {
                  top: ['id', 'name'],
                  handlers: 'handle*',
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
                import Robot from '~/base/robot.svelte'
              </script>

              <Robot
                handlePushHand={() => {
                  /* ... */
                }}
                name="Reg"
                team="Team Riko"
                id="42f1b85f-54ef-413d-b99e-27c9e9610fc2"
              />
            `,
            output: dedent`
              <script>
                import Robot from '~/base/robot.svelte'
              </script>

              <Robot
                id="42f1b85f-54ef-413d-b99e-27c9e9610fc2"
                name="Reg"
                handlePushHand={() => {
                  /* ... */
                }}
                team="Team Riko"
              />
            `,
            options: [
              {
                ...options,
                groups: ['top', 'handlers', 'unknown'],
                'custom-groups': {
                  top: ['id', 'name'],
                  handlers: 'handle*',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'handlePushHand',
                  right: 'name',
                },
              },
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'team',
                  right: 'id',
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

    let options = {
      type: SortType['line-length'],
      order: SortOrder.desc,
    }

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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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
            options: [options],
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

    it(`${RULE_NAME}(${type}): allows to set shorthand attributes position`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Reborn from '../components/Reborn.svelte'

                let isAlive = true
              </script>

              <Reborn
                firstName="Rudeus"
                lastName="Greyrat"
                age={23}
                reincarnated
                {isAlive}
              />
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
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Reborn from '../components/Reborn.svelte'

                let isAlive = true
              </script>

              <Reborn
                age={23}
                reincarnated
                {isAlive}
                firstName="Rudeus"
                lastName="Greyrat"
              />
            `,
            output: dedent`
              <script>
                import Reborn from '../components/Reborn.svelte'

                let isAlive = true
              </script>

              <Reborn
                firstName="Rudeus"
                lastName="Greyrat"
                age={23}
                reincarnated
                {isAlive}
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
                  left: 'isAlive',
                  right: 'firstName',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set multiline attributes position`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Hero from '../components/Hero.svelte'

                let frags = 0
              </script>

              <Reborn
                onAttack={() => {
                  frags += 1
                }}
                name="One-Punch Man"
                realName="Saitama"
                frags={frags}
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
                import Hero from '../components/Hero.svelte'

                let frags = 0
              </script>

              <Reborn
                frags={frags}
                onAttack={() => {
                  frags += 1
                }}
                name="One-Punch Man"
                realName="Saitama"
              />
            `,
            output: dedent`
              <script>
                import Hero from '../components/Hero.svelte'

                let frags = 0
              </script>

              <Reborn
                onAttack={() => {
                  frags += 1
                }}
                name="One-Punch Man"
                realName="Saitama"
                frags={frags}
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
                  left: 'frags',
                  right: 'onAttack',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allows to set custom groups`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.svelte',
            code: dedent`
              <script>
                import Robot from '~/base/robot.svelte'
              </script>

              <Robot
                id="42f1b85f-54ef-413d-b99e-27c9e9610fc2"
                name="Reg"
                handlePushHand={() => {
                  /* ... */
                }}
                team="Team Riko"
              />
            `,
            options: [
              {
                ...options,
                groups: ['top', 'handlers', 'unknown'],
                'custom-groups': {
                  top: ['id', 'name'],
                  handlers: 'handle*',
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
                import Robot from '~/base/robot.svelte'
              </script>

              <Robot
                handlePushHand={() => {
                  /* ... */
                }}
                name="Reg"
                team="Team Riko"
                id="42f1b85f-54ef-413d-b99e-27c9e9610fc2"
              />
            `,
            output: dedent`
              <script>
                import Robot from '~/base/robot.svelte'
              </script>

              <Robot
                id="42f1b85f-54ef-413d-b99e-27c9e9610fc2"
                name="Reg"
                handlePushHand={() => {
                  /* ... */
                }}
                team="Team Riko"
              />
            `,
            options: [
              {
                ...options,
                groups: ['top', 'handlers', 'unknown'],
                'custom-groups': {
                  top: ['id', 'name'],
                  handlers: 'handle*',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'handlePushHand',
                  right: 'name',
                },
              },
              {
                messageId: 'unexpectedSvelteAttributesOrder',
                data: {
                  left: 'team',
                  right: 'id',
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
