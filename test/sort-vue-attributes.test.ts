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
                  v-bind="props"
                  vessel
                />
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
                  v-bind="props"
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
                  v-bind="props"
                  vessel
                />
              </template>
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: ':name',
                  right: ':age',
                },
              },
            ]
          },
        ],
      })
    })
  })
})
