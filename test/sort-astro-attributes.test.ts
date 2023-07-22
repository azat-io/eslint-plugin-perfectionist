import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-astro-attributes'
import { SortOrder, SortType } from '../typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    // @ts-ignore
    parser: require.resolve('astro-eslint-parser'),
    parserOptions: {
      parser: {
        ts: '@typescript-eslint/parser',
      },
    },
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    it(`${RULE_NAME}(${type}): sorts props in astro components`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.astro',
            code: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.astro'
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
            filename: 'component.astro',
            code: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.astro'
              </script>
              <HeavenChild name="Tokio" partner="Kona" age={14} sick />
            `,
            output: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.astro'
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
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'partner',
                  right: 'age',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): split props intro groups if there is spreaded props`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.astro',
            code: dedent`
              <script>
                import Mushishi from '../characters/Mushishi.astro'

                import ginko from './data.json'
              </script>
              <Mushishi name="Yoki" {...ginko} occupation="Mushishi" status="wanderer" />
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
            filename: 'component.astro',
            code: dedent`
              <script>
                import Mushishi from '../characters/Mushishi.astro'

                import ginko from './data.json'
              </script>
              <Mushishi name="Yoki" {...ginko} status="wanderer" occupation="Mushishi" />
            `,
            output: dedent`
              <script>
                import Mushishi from '../characters/Mushishi.astro'

                import ginko from './data.json'
              </script>
              <Mushishi name="Yoki" {...ginko} occupation="Mushishi" status="wanderer" />
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'status',
                  right: 'occupation',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with literal attributes`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.astro',
            code: dedent`
              <script>
                import Haruka from './rumbling-hearts/haruka-suzumiya.astro'

                let name = 'Haruka Suzumiya'
                let greeting = 'Konnichiwa!'
              </script>
              <Haruka
                color="#FF0000"
                diagnosis="anterograde amnesia"
                {name}
                set:html={greeting}
              />
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
            filename: 'component.astro',
            code: dedent`
              <script>
                import Haruka from './rumbling-hearts/haruka-suzumiya.astro'

                let name = 'Haruka Suzumiya'
                let greeting = 'Konnichiwa!'
              </script>
              <Haruka
                set:html={greeting}
                color="#FF0000"
                {name}
                diagnosis="anterograde amnesia"
              />
            `,
            output: dedent`
              <script>
                import Haruka from './rumbling-hearts/haruka-suzumiya.astro'

                let name = 'Haruka Suzumiya'
                let greeting = 'Konnichiwa!'
              </script>
              <Haruka
                color="#FF0000"
                diagnosis="anterograde amnesia"
                {name}
                set:html={greeting}
              />
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'set:html',
                  right: 'color',
                },
              },
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'name',
                  right: 'diagnosis',
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
            filename: 'component.astro',
            code: dedent`
              <script>
                import Shinobi from '../components/Shinobi.astro'

                let clan = 'Iwagakure'
              </script>

              <Shinobi
                alias="Hollow"
                elemental="Fire"
                name="Gabimaru"
                {clan}
                immortal
              />
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                groups: ['unknown', ['astro-shorthand', 'shorthand']],
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.astro',
            code: dedent`
              <script>
                import Shinobi from '../components/Shinobi.astro'

                let clan = 'Iwagakure'
              </script>

              <Shinobi
                alias="Hollow"
                {clan}
                elemental="Fire"
                immortal
                name="Gabimaru"
              />
            `,
            output: dedent`
              <script>
                import Shinobi from '../components/Shinobi.astro'

                let clan = 'Iwagakure'
              </script>

              <Shinobi
                alias="Hollow"
                elemental="Fire"
                name="Gabimaru"
                {clan}
                immortal
              />
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                groups: ['unknown', ['svelte-shorthand', 'shorthand']],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'clan',
                  right: 'elemental',
                },
              },
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'immortal',
                  right: 'name',
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
            filename: 'component.astro',
            code: dedent`
              <script>
                import Rocker from '../components/Rocker.svelte'

                let isPlaying = false
              </script>

              <Rocker
                onPlay={() => {
                  isPlaying = true
                }}
                {isPlaying}
                name="Ikuyo Kita"
                role={['guitar', 'vocal']}
              />
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                groups: ['multiline', 'unknown'],
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.astro',
            code: dedent`
              <script>
                import Rocker from '../components/Rocker.svelte'

                let isPlaying = false
              </script>

              <Rocker
                name="Ikuyo Kita"
                onPlay={() => {
                  isPlaying = true
                }}
                role={['guitar', 'vocal']}
                {isPlaying}
              />
            `,
            output: dedent`
              <script>
                import Rocker from '../components/Rocker.svelte'

                let isPlaying = false
              </script>

              <Rocker
                onPlay={() => {
                  isPlaying = true
                }}
                {isPlaying}
                name="Ikuyo Kita"
                role={['guitar', 'vocal']}
              />
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                groups: ['multiline', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'name',
                  right: 'onPlay',
                },
              },
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'role',
                  right: 'isPlaying',
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

    it(`${RULE_NAME}(${type}): sorts props in astro components`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.astro',
            code: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.astro'
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
            filename: 'component.astro',
            code: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.astro'
              </script>
              <HeavenChild name="Tokio" partner="Kona" age={14} sick />
            `,
            output: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.astro'
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
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'partner',
                  right: 'age',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): split props intro groups if there is spreaded props`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.astro',
            code: dedent`
              <script>
                import Mushishi from '../characters/Mushishi.astro'

                import ginko from './data.json'
              </script>
              <Mushishi name="Yoki" {...ginko} occupation="Mushishi" status="wanderer" />
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
            filename: 'component.astro',
            code: dedent`
              <script>
                import Mushishi from '../characters/Mushishi.astro'

                import ginko from './data.json'
              </script>
              <Mushishi name="Yoki" {...ginko} status="wanderer" occupation="Mushishi" />
            `,
            output: dedent`
              <script>
                import Mushishi from '../characters/Mushishi.astro'

                import ginko from './data.json'
              </script>
              <Mushishi name="Yoki" {...ginko} occupation="Mushishi" status="wanderer" />
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'status',
                  right: 'occupation',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with literal attributes`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.astro',
            code: dedent`
              <script>
                import Haruka from './rumbling-hearts/haruka-suzumiya.astro'

                let name = 'Haruka Suzumiya'
                let greeting = 'Konnichiwa!'
              </script>
              <Haruka
                color="#FF0000"
                diagnosis="anterograde amnesia"
                {name}
                set:html={greeting}
              />
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
            filename: 'component.astro',
            code: dedent`
              <script>
                import Haruka from './rumbling-hearts/haruka-suzumiya.astro'

                let name = 'Haruka Suzumiya'
                let greeting = 'Konnichiwa!'
              </script>
              <Haruka
                set:html={greeting}
                color="#FF0000"
                {name}
                diagnosis="anterograde amnesia"
              />
            `,
            output: dedent`
              <script>
                import Haruka from './rumbling-hearts/haruka-suzumiya.astro'

                let name = 'Haruka Suzumiya'
                let greeting = 'Konnichiwa!'
              </script>
              <Haruka
                color="#FF0000"
                diagnosis="anterograde amnesia"
                {name}
                set:html={greeting}
              />
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'set:html',
                  right: 'color',
                },
              },
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'name',
                  right: 'diagnosis',
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
            filename: 'component.astro',
            code: dedent`
              <script>
                import Shinobi from '../components/Shinobi.astro'

                let clan = 'Iwagakure'
              </script>

              <Shinobi
                alias="Hollow"
                elemental="Fire"
                name="Gabimaru"
                {clan}
                immortal
              />
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                groups: ['unknown', ['astro-shorthand', 'shorthand']],
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.astro',
            code: dedent`
              <script>
                import Shinobi from '../components/Shinobi.astro'

                let clan = 'Iwagakure'
              </script>

              <Shinobi
                alias="Hollow"
                {clan}
                elemental="Fire"
                immortal
                name="Gabimaru"
              />
            `,
            output: dedent`
              <script>
                import Shinobi from '../components/Shinobi.astro'

                let clan = 'Iwagakure'
              </script>

              <Shinobi
                alias="Hollow"
                elemental="Fire"
                name="Gabimaru"
                {clan}
                immortal
              />
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                groups: ['unknown', ['svelte-shorthand', 'shorthand']],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'clan',
                  right: 'elemental',
                },
              },
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'immortal',
                  right: 'name',
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
            filename: 'component.astro',
            code: dedent`
              <script>
                import Rocker from '../components/Rocker.svelte'

                let isPlaying = false
              </script>

              <Rocker
                onPlay={() => {
                  isPlaying = true
                }}
                {isPlaying}
                name="Ikuyo Kita"
                role={['guitar', 'vocal']}
              />
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                groups: ['multiline', 'unknown'],
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.astro',
            code: dedent`
              <script>
                import Rocker from '../components/Rocker.svelte'

                let isPlaying = false
              </script>

              <Rocker
                name="Ikuyo Kita"
                onPlay={() => {
                  isPlaying = true
                }}
                role={['guitar', 'vocal']}
                {isPlaying}
              />
            `,
            output: dedent`
              <script>
                import Rocker from '../components/Rocker.svelte'

                let isPlaying = false
              </script>

              <Rocker
                onPlay={() => {
                  isPlaying = true
                }}
                {isPlaying}
                name="Ikuyo Kita"
                role={['guitar', 'vocal']}
              />
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                groups: ['multiline', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'name',
                  right: 'onPlay',
                },
              },
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'role',
                  right: 'isPlaying',
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

    it(`${RULE_NAME}(${type}): sorts props in astro components`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.astro',
            code: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.astro'
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
            filename: 'component.astro',
            code: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.astro'
              </script>
              <HeavenChild name="Tokio" partner="Kona" age={14} sick />
            `,
            output: dedent`
              <script>
                import HeavenChild from '../takahara-academy/HeavenChild.astro'
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
                messageId: 'unexpectedAstroAttributesOrder',
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

    it(`${RULE_NAME}(${type}): split props intro groups if there is spreaded props`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.astro',
            code: dedent`
              <script>
                import Mushishi from '../characters/Mushishi.astro'

                import ginko from './data.json'
              </script>
              <Mushishi name="Yoki" {...ginko} occupation="Mushishi" status="wanderer" />
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
            filename: 'component.astro',
            code: dedent`
              <script>
                import Mushishi from '../characters/Mushishi.astro'

                import ginko from './data.json'
              </script>
              <Mushishi name="Yoki" {...ginko} status="wanderer" occupation="Mushishi" />
            `,
            output: dedent`
              <script>
                import Mushishi from '../characters/Mushishi.astro'

                import ginko from './data.json'
              </script>
              <Mushishi name="Yoki" {...ginko} occupation="Mushishi" status="wanderer" />
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'status',
                  right: 'occupation',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with literal attributes`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.astro',
            code: dedent`
              <script>
                import Haruka from './rumbling-hearts/haruka-suzumiya.astro'

                let name = 'Haruka Suzumiya'
                let greeting = 'Konnichiwa!'
              </script>
              <Haruka
                diagnosis="anterograde amnesia"
                set:html={greeting}
                color="#FF0000"
                {name}
              />
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
            filename: 'component.astro',
            code: dedent`
              <script>
                import Haruka from './rumbling-hearts/haruka-suzumiya.astro'

                let name = 'Haruka Suzumiya'
                let greeting = 'Konnichiwa!'
              </script>
              <Haruka
                set:html={greeting}
                color="#FF0000"
                {name}
                diagnosis="anterograde amnesia"
              />
            `,
            output: dedent`
              <script>
                import Haruka from './rumbling-hearts/haruka-suzumiya.astro'

                let name = 'Haruka Suzumiya'
                let greeting = 'Konnichiwa!'
              </script>
              <Haruka
                diagnosis="anterograde amnesia"
                set:html={greeting}
                color="#FF0000"
                {name}
              />
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'name',
                  right: 'diagnosis',
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
            filename: 'component.astro',
            code: dedent`
              <script>
                import Shinobi from '../components/Shinobi.astro'

                let clan = 'Iwagakure'
              </script>

              <Shinobi
                elemental="Fire"
                name="Gabimaru"
                alias="Hollow"
                immortal
                {clan}
              />
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                groups: ['unknown', ['astro-shorthand', 'shorthand']],
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.astro',
            code: dedent`
              <script>
                import Shinobi from '../components/Shinobi.astro'

                let clan = 'Iwagakure'
              </script>

              <Shinobi
                alias="Hollow"
                {clan}
                elemental="Fire"
                immortal
                name="Gabimaru"
              />
            `,
            output: dedent`
              <script>
                import Shinobi from '../components/Shinobi.astro'

                let clan = 'Iwagakure'
              </script>

              <Shinobi
                elemental="Fire"
                name="Gabimaru"
                alias="Hollow"
                immortal
                {clan}
              />
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                groups: ['unknown', ['svelte-shorthand', 'shorthand']],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'clan',
                  right: 'elemental',
                },
              },
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'immortal',
                  right: 'name',
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
            filename: 'component.astro',
            code: dedent`
              <script>
                import Rocker from '../components/Rocker.svelte'

                let isPlaying = false
              </script>

              <Rocker
                onPlay={() => {
                  isPlaying = true
                }}
                role={['guitar', 'vocal']}
                name="Ikuyo Kita"
                {isPlaying}
              />
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                groups: ['multiline', 'unknown'],
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.astro',
            code: dedent`
              <script>
                import Rocker from '../components/Rocker.svelte'

                let isPlaying = false
              </script>

              <Rocker
                name="Ikuyo Kita"
                onPlay={() => {
                  isPlaying = true
                }}
                role={['guitar', 'vocal']}
                {isPlaying}
              />
            `,
            output: dedent`
              <script>
                import Rocker from '../components/Rocker.svelte'

                let isPlaying = false
              </script>

              <Rocker
                onPlay={() => {
                  isPlaying = true
                }}
                role={['guitar', 'vocal']}
                name="Ikuyo Kita"
                {isPlaying}
              />
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                groups: ['multiline', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedAstroAttributesOrder',
                data: {
                  left: 'name',
                  right: 'onPlay',
                },
              },
            ],
          },
        ],
      })
    })
  })

  describe(`${RULE_NAME}: misc`, () => {
    it(`${RULE_NAME}: works only for .astro files`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          dedent`
            <Makishima
              gender="male"
              height={180}
              weight={65}
            />
          `,
        ],
        invalid: [],
      })
    })
  })
})
