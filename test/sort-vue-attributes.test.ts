import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-vue-attributes'
import { SortOrder, SortType } from '../typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    // @ts-ignore
    parser: require.resolve('vue-eslint-parser'),
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

    it(`${RULE_NAME}(${type}): sorts props in Vue components`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import JujutsuSorcerer from '../elements/Sorcerer.vue'

                let name = 'Yuuji Itadori'
              </script>

              <template>
                <jujutsu-sorcerer
                  :age="15"
                  :name="name"
                  affiliation="Jujutsu High"
                  vessel
                />
              </template>
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import JujutsuSorcerer from '../elements/Sorcerer.vue'

                let name = 'Yuuji Itadori'
              </script>

              <template>
                <jujutsu-sorcerer
                  :name="name"
                  :age="15"
                  affiliation="Jujutsu High"
                  vessel
                />
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import JujutsuSorcerer from '../elements/Sorcerer.vue'

                let name = 'Yuuji Itadori'
              </script>

              <template>
                <jujutsu-sorcerer
                  :age="15"
                  :name="name"
                  affiliation="Jujutsu High"
                  vessel
                />
              </template>
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: ':name',
                  right: ':age',
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
      type: SortType.natural,
      order: SortOrder.asc,
      'ignore-case': false,
    }

    it(`${RULE_NAME}(${type}): sorts props in Vue components`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import JujutsuSorcerer from '../elements/Sorcerer.vue'

                let name = 'Yuuji Itadori'
              </script>

              <template>
                <jujutsu-sorcerer
                  :age="15"
                  :name="name"
                  affiliation="Jujutsu High"
                  vessel
                />
              </template>
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import JujutsuSorcerer from '../elements/Sorcerer.vue'

                let name = 'Yuuji Itadori'
              </script>

              <template>
                <jujutsu-sorcerer
                  :name="name"
                  :age="15"
                  affiliation="Jujutsu High"
                  vessel
                />
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import JujutsuSorcerer from '../elements/Sorcerer.vue'

                let name = 'Yuuji Itadori'
              </script>

              <template>
                <jujutsu-sorcerer
                  :age="15"
                  :name="name"
                  affiliation="Jujutsu High"
                  vessel
                />
              </template>
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: ':name',
                  right: ':age',
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

    it(`${RULE_NAME}(${type}): sorts props in Vue components`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import JujutsuSorcerer from '../elements/Sorcerer.vue'

                let name = 'Yuuji Itadori'
              </script>

              <template>
                <jujutsu-sorcerer
                  affiliation="Jujutsu High"
                  :name="name"
                  :age="15"
                  vessel
                />
              </template>
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import JujutsuSorcerer from '../elements/Sorcerer.vue'

                let name = 'Yuuji Itadori'
              </script>

              <template>
                <jujutsu-sorcerer
                  :name="name"
                  :age="15"
                  affiliation="Jujutsu High"
                  vessel
                />
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import JujutsuSorcerer from '../elements/Sorcerer.vue'

                let name = 'Yuuji Itadori'
              </script>

              <template>
                <jujutsu-sorcerer
                  affiliation="Jujutsu High"
                  :name="name"
                  :age="15"
                  vessel
                />
              </template>
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: ':age',
                  right: 'affiliation',
                },
              },
            ],
          },
        ],
      })
    })
  })

  describe(`${RULE_NAME}: misc`, () => {
    it(`${RULE_NAME}: works only with .vue files`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.ts',
            code: dedent`
              <script lang="ts" setup>
                import TaxiDriver from '../jobs/TaxiDriver.vue'
              </script>

              <template>
                <TaxiDriver name="Kiyoshi Odokawa" birth="1980" />
              </template>
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

    it(`${RULE_NAME}: requires vue parser`, () => {
      let tsRuleTester = new ESLintUtils.RuleTester({
        parser: '@typescript-eslint/parser',
      })

      tsRuleTester.run(RULE_NAME, rule, {
        valid: [
          {
            filename: 'component.vue',
            code: '',
            options: [{}],
          },
        ],
        invalid: [],
      })
    })
  })
})
