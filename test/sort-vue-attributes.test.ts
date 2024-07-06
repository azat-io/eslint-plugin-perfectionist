import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-vue-attributes'
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
      ignoreCase: false,
    }

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts props in Vue components`,
      rule,
      {
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
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): does not break the property list`,
      rule,
      {
        valid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import Daddy from '@/characters/buddy-daddies.vue'
              </script>

              <template>
                <daddy
                  :age="29"
                  firstName="Kazuki"
                  lastName="Kurusu"
                  v-bind="{ firstName: 'Rei', lastName: 'Suwa' }"
                  cover-job="Stand-up comedian"
                  job="assassin"
                ></daddy>
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
                import Daddy from '@/characters/buddy-daddies.vue'
              </script>

              <template>
                <daddy
                  firstName="Kazuki"
                  lastName="Kurusu"
                  :age="29"
                  v-bind="{ firstName: 'Rei', lastName: 'Suwa' }"
                  job="assassin"
                  cover-job="Stand-up comedian"
                ></daddy>
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import Daddy from '@/characters/buddy-daddies.vue'
              </script>

              <template>
                <daddy
                  :age="29"
                  firstName="Kazuki"
                  lastName="Kurusu"
                  v-bind="{ firstName: 'Rei', lastName: 'Suwa' }"
                  cover-job="Stand-up comedian"
                  job="assassin"
                ></daddy>
              </template>
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'lastName',
                  right: ':age',
                },
              },
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'job',
                  right: 'cover-job',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to sort props using groups`,
      rule,
      {
        valid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Titan from '../components/Titan.vue'

                let isTitan = useRef(false)
                let isAlive = true
              </script>

              <template>
                <titan
                  @transform="() => {
                    isTitan.value = false
                  }"
                  name="Armin Arlelt"
                  occupation="soldier"
                  team="Scout Regiment"
                  is-titan
                ></titan>
              </template>
            `,
            options: [
              {
                ...options,
                groups: ['multiline', 'directives', 'unknown', 'shorthand'],
                customGroups: {
                  directives: 'v-*',
                },
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Titan from '../components/Titan.vue'

                let isTitan = useRef(false)
                let isAlive = true
              </script>

              <template>
                <titan
                  occupation="soldier"
                  name="Armin Arlelt"
                  is-titan
                  team="Scout Regiment"
                  @transform="() => {
                    isTitan.value = false
                  }"
                ></titan>
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Titan from '../components/Titan.vue'

                let isTitan = useRef(false)
                let isAlive = true
              </script>

              <template>
                <titan
                  @transform="() => {
                    isTitan.value = false
                  }"
                  name="Armin Arlelt"
                  occupation="soldier"
                  team="Scout Regiment"
                  is-titan
                ></titan>
              </template>
            `,
            options: [
              {
                ...options,
                groups: ['multiline', 'directives', 'unknown', 'shorthand'],
                customGroups: {
                  directives: 'v-*',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'occupation',
                  right: 'name',
                },
              },
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'is-titan',
                  right: 'team',
                },
              },
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'team',
                  right: '@transform',
                },
              },
            ],
          },
        ],
      },
    )
  })

  describe(`${RULE_NAME}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      type: SortType.natural,
      order: SortOrder.asc,
      ignoreCase: false,
    }

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts props in Vue components`,
      rule,
      {
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
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): does not break the property list`,
      rule,
      {
        valid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import Daddy from '@/characters/buddy-daddies.vue'
              </script>

              <template>
                <daddy
                  :age="29"
                  firstName="Kazuki"
                  lastName="Kurusu"
                  v-bind="{ firstName: 'Rei', lastName: 'Suwa' }"
                  cover-job="Stand-up comedian"
                  job="assassin"
                ></daddy>
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
                import Daddy from '@/characters/buddy-daddies.vue'
              </script>

              <template>
                <daddy
                  firstName="Kazuki"
                  lastName="Kurusu"
                  :age="29"
                  v-bind="{ firstName: 'Rei', lastName: 'Suwa' }"
                  job="assassin"
                  cover-job="Stand-up comedian"
                ></daddy>
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import Daddy from '@/characters/buddy-daddies.vue'
              </script>

              <template>
                <daddy
                  :age="29"
                  firstName="Kazuki"
                  lastName="Kurusu"
                  v-bind="{ firstName: 'Rei', lastName: 'Suwa' }"
                  cover-job="Stand-up comedian"
                  job="assassin"
                ></daddy>
              </template>
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'lastName',
                  right: ':age',
                },
              },
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'job',
                  right: 'cover-job',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to sort props using groups`,
      rule,
      {
        valid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Titan from '../components/Titan.vue'

                let isTitan = useRef(false)
                let isAlive = true
              </script>

              <template>
                <titan
                  @transform="() => {
                    isTitan.value = false
                  }"
                  name="Armin Arlelt"
                  occupation="soldier"
                  team="Scout Regiment"
                  is-titan
                ></titan>
              </template>
            `,
            options: [
              {
                ...options,
                groups: ['multiline', 'directives', 'unknown', 'shorthand'],
                customGroups: {
                  directives: 'v-*',
                },
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Titan from '../components/Titan.vue'

                let isTitan = useRef(false)
                let isAlive = true
              </script>

              <template>
                <titan
                  occupation="soldier"
                  name="Armin Arlelt"
                  is-titan
                  team="Scout Regiment"
                  @transform="() => {
                    isTitan.value = false
                  }"
                ></titan>
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Titan from '../components/Titan.vue'

                let isTitan = useRef(false)
                let isAlive = true
              </script>

              <template>
                <titan
                  @transform="() => {
                    isTitan.value = false
                  }"
                  name="Armin Arlelt"
                  occupation="soldier"
                  team="Scout Regiment"
                  is-titan
                ></titan>
              </template>
            `,
            options: [
              {
                ...options,
                groups: ['multiline', 'directives', 'unknown', 'shorthand'],
                customGroups: {
                  directives: 'v-*',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'occupation',
                  right: 'name',
                },
              },
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'is-titan',
                  right: 'team',
                },
              },
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'team',
                  right: '@transform',
                },
              },
            ],
          },
        ],
      },
    )
  })

  describe(`${RULE_NAME}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: SortType['line-length'],
      order: SortOrder.desc,
    }

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts props in Vue components`,
      rule,
      {
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
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): does not break the property list`,
      rule,
      {
        valid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import Daddy from '@/characters/buddy-daddies.vue'
              </script>

              <template>
                <daddy
                  firstName="Kazuki"
                  lastName="Kurusu"
                    :age="29"
                  v-bind="{ firstName: 'Rei', lastName: 'Suwa' }"
                  cover-job="Stand-up comedian"
                  job="assassin"
                ></daddy>
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
                import Daddy from '@/characters/buddy-daddies.vue'
              </script>

              <template>
                <daddy
                  firstName="Kazuki"
                  lastName="Kurusu"
                  :age="29"
                  v-bind="{ firstName: 'Rei', lastName: 'Suwa' }"
                  job="assassin"
                  cover-job="Stand-up comedian"
                ></daddy>
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import Daddy from '@/characters/buddy-daddies.vue'
              </script>

              <template>
                <daddy
                  firstName="Kazuki"
                  lastName="Kurusu"
                  :age="29"
                  v-bind="{ firstName: 'Rei', lastName: 'Suwa' }"
                  cover-job="Stand-up comedian"
                  job="assassin"
                ></daddy>
              </template>
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'job',
                  right: 'cover-job',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to sort props using groups`,
      rule,
      {
        valid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Titan from '../components/Titan.vue'

                let isTitan = useRef(false)
                let isAlive = true
              </script>

              <template>
                <titan
                  @transform="() => {
                    isTitan.value = false
                  }"
                  team="Scout Regiment"
                  occupation="soldier"
                  name="Armin Arlelt"
                  is-titan
                ></titan>
              </template>
            `,
            options: [
              {
                ...options,
                groups: ['multiline', 'directives', 'unknown', 'shorthand'],
                customGroups: {
                  directives: 'v-*',
                },
              },
            ],
          },
        ],
        invalid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Titan from '../components/Titan.vue'

                let isTitan = useRef(false)
                let isAlive = true
              </script>

              <template>
                <titan
                  occupation="soldier"
                  name="Armin Arlelt"
                  is-titan
                  team="Scout Regiment"
                  @transform="() => {
                    isTitan.value = false
                  }"
                ></titan>
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Titan from '../components/Titan.vue'

                let isTitan = useRef(false)
                let isAlive = true
              </script>

              <template>
                <titan
                  @transform="() => {
                    isTitan.value = false
                  }"
                  team="Scout Regiment"
                  occupation="soldier"
                  name="Armin Arlelt"
                  is-titan
                ></titan>
              </template>
            `,
            options: [
              {
                ...options,
                groups: ['multiline', 'directives', 'unknown', 'shorthand'],
                customGroups: {
                  directives: 'v-*',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'is-titan',
                  right: 'team',
                },
              },
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'team',
                  right: '@transform',
                },
              },
            ],
          },
        ],
      },
    )
  })

  describe(`${RULE_NAME}: misc`, () => {
    ruleTester.run(`${RULE_NAME}: works only with .vue files`, rule, {
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

    describe('without vue parser', () => {
      let tsRuleTester = new RuleTester({
        parser: '@typescript-eslint/parser',
      })

      tsRuleTester.run(`${RULE_NAME}: requires vue parser`, rule, {
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
