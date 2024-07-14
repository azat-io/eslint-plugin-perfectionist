import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-vue-attributes'

describe(RULE_NAME, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester({
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
      type: 'alphabetical',
      ignoreCase: false,
      order: 'asc',
    } as const

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts props in Vue components`,
      rule,
      {
        valid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import Component from '../Component.vue'

                let b = 'b'
              </script>

              <template>
                <jujutsu-sorcerer
                  :a="a"
                  :b="b"
                  c="c"
                  d
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
                import Component from '../Component.vue'

                let b = 'b'
              </script>

              <template>
                <jujutsu-sorcerer
                  :b="b"
                  c="c"
                  :a="a"
                  d
                />
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import Component from '../Component.vue'

                let b = 'b'
              </script>

              <template>
                <jujutsu-sorcerer
                  :a="a"
                  :b="b"
                  c="c"
                  d
                />
              </template>
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'c',
                  right: ':a',
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
                import Component from '@/Component.vue'
              </script>

              <template>
                <component
                  :c="cc"
                  d="d"
                  e="e"
                  v-bind="{ f: 'f' }"
                  a="aaaa"
                  b="bbb"
                ></component>
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
                import Component from '@/Component.vue'
              </script>

              <template>
                <component
                  :c="cc"
                  d="d"
                  e="e"
                  v-bind="{ f: 'f' }"
                  b="bbb"
                  a="aaaa"
                ></component>
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import Component from '@/Component.vue'
              </script>

              <template>
                <component
                  :c="cc"
                  d="d"
                  e="e"
                  v-bind="{ f: 'f' }"
                  a="aaaa"
                  b="bbb"
                ></component>
              </template>
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVueAttributesOrder',
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

                import Component from '../Component.vue'

                let eF = useRef(false)
                let g = true
              </script>

              <template>
                <component
                  @a="() => {
                    g.value = false
                  }"
                  b="bb"
                  c="c"
                  e-f
                ></component>
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

                import Component from '../Component.vue'

                let eF = useRef(false)
                let g = true
              </script>

              <template>
                <component
                  b="bb"
                  @a="() => {
                    g.value = false
                  }"
                  e-f
                  c="c"
                ></component>
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Component from '../Component.vue'

                let eF = useRef(false)
                let g = true
              </script>

              <template>
                <component
                  @a="() => {
                    g.value = false
                  }"
                  b="bb"
                  c="c"
                  e-f
                ></component>
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
                  left: 'b',
                  right: '@a',
                },
              },
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'e-f',
                  right: 'c',
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
      ignoreCase: false,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts props in Vue components`,
      rule,
      {
        valid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import Component from '../Component.vue'

                let b = 'b'
              </script>

              <template>
                <jujutsu-sorcerer
                  :a="a"
                  :b="b"
                  c="c"
                  d
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
                import Component from '../Component.vue'

                let b = 'b'
              </script>

              <template>
                <jujutsu-sorcerer
                  :b="b"
                  c="c"
                  :a="a"
                  d
                />
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import Component from '../Component.vue'

                let b = 'b'
              </script>

              <template>
                <jujutsu-sorcerer
                  :a="a"
                  :b="b"
                  c="c"
                  d
                />
              </template>
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'c',
                  right: ':a',
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
                import Component from '@/Component.vue'
              </script>

              <template>
                <component
                  :c="cc"
                  d="d"
                  e="e"
                  v-bind="{ f: 'f' }"
                  a="aaaa"
                  b="bbb"
                ></component>
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
                import Component from '@/Component.vue'
              </script>

              <template>
                <component
                  :c="cc"
                  d="d"
                  e="e"
                  v-bind="{ f: 'f' }"
                  b="bbb"
                  a="aaaa"
                ></component>
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import Component from '@/Component.vue'
              </script>

              <template>
                <component
                  :c="cc"
                  d="d"
                  e="e"
                  v-bind="{ f: 'f' }"
                  a="aaaa"
                  b="bbb"
                ></component>
              </template>
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVueAttributesOrder',
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

                import Component from '../Component.vue'

                let eF = useRef(false)
                let g = true
              </script>

              <template>
                <component
                  @a="() => {
                    g.value = false
                  }"
                  b="bb"
                  c="c"
                  e-f
                ></component>
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

                import Component from '../Component.vue'

                let eF = useRef(false)
                let g = true
              </script>

              <template>
                <component
                  b="bb"
                  @a="() => {
                    g.value = false
                  }"
                  e-f
                  c="c"
                ></component>
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Component from '../Component.vue'

                let eF = useRef(false)
                let g = true
              </script>

              <template>
                <component
                  @a="() => {
                    g.value = false
                  }"
                  b="bb"
                  c="c"
                  e-f
                ></component>
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
                  left: 'b',
                  right: '@a',
                },
              },
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'e-f',
                  right: 'c',
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
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts props in Vue components`,
      rule,
      {
        valid: [
          {
            filename: 'component.vue',
            code: dedent`
              <script lang="ts" setup>
                import Component from '../Component.vue'

                let b = 'b'
              </script>

              <template>
                <jujutsu-sorcerer
                  :a="a"
                  :b="b"
                  c="c"
                  d
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
                import Component from '../Component.vue'

                let b = 'b'
              </script>

              <template>
                <jujutsu-sorcerer
                  :b="b"
                  c="c"
                  :a="a"
                  d
                />
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import Component from '../Component.vue'

                let b = 'b'
              </script>

              <template>
                <jujutsu-sorcerer
                  :b="b"
                  :a="a"
                  c="c"
                  d
                />
              </template>
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'c',
                  right: ':a',
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
                import Component from '@/Component.vue'
              </script>

              <template>
                <component
                  :c="cc"
                  d="d"
                  e="e"
                  v-bind="{ f: 'f' }"
                  a="aaaa"
                  b="bbb"
                ></component>
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
                import Component from '@/Component.vue'
              </script>

              <template>
                <component
                  :c="cc"
                  d="d"
                  e="e"
                  v-bind="{ f: 'f' }"
                  b="bbb"
                  a="aaaa"
                ></component>
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import Component from '@/Component.vue'
              </script>

              <template>
                <component
                  :c="cc"
                  d="d"
                  e="e"
                  v-bind="{ f: 'f' }"
                  a="aaaa"
                  b="bbb"
                ></component>
              </template>
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedVueAttributesOrder',
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

                import Component from '../Component.vue'

                let eF = useRef(false)
                let g = true
              </script>

              <template>
                <component
                  @a="() => {
                    g.value = false
                  }"
                  b="bb"
                  c="c"
                  e-f
                ></component>
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

                import Component from '../Component.vue'

                let eF = useRef(false)
                let g = true
              </script>

              <template>
                <component
                  b="bb"
                  @a="() => {
                    g.value = false
                  }"
                  e-f
                  c="c"
                ></component>
              </template>
            `,
            output: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Component from '../Component.vue'

                let eF = useRef(false)
                let g = true
              </script>

              <template>
                <component
                  @a="() => {
                    g.value = false
                  }"
                  b="bb"
                  c="c"
                  e-f
                ></component>
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
                  left: 'b',
                  right: '@a',
                },
              },
              {
                messageId: 'unexpectedVueAttributesOrder',
                data: {
                  left: 'e-f',
                  right: 'c',
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
              import Component from '../Component.vue'
            </script>

            <template>
              <Component b="b" a="aa" />
            </template>
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
