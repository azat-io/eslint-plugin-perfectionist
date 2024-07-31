import { RuleTester } from '@typescript-eslint/rule-tester'
import typescriptParser from '@typescript-eslint/parser'
import { afterAll, describe, it } from 'vitest'
import vueParser from 'vue-eslint-parser'
import { dedent } from 'ts-dedent'
import path from 'node:path'

import rule from '../rules/sort-vue-attributes'

let ruleName = 'sort-vue-attributes'

describe(ruleName, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester({
    languageOptions: {
      parser: vueParser,
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
      `${ruleName}(${type}): sorts props in Vue components`,
      rule,
      {
        valid: [
          {
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import Component from '../file.vue'

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
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import Component from '../file.vue'

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
                import Component from '../file.vue'

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
      `${ruleName}(${type}): does not break the property list`,
      rule,
      {
        valid: [
          {
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import Component from '@/file.vue'
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
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import Component from '@/file.vue'
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
                import Component from '@/file.vue'
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
      `${ruleName}(${type}): allows to sort props using groups`,
      rule,
      {
        valid: [
          {
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Component from '../file.vue'

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
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Component from '../file.vue'

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

                import Component from '../file.vue'

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

  describe(`${ruleName}: sorting by natural order`, () => {
    let type = 'natural-order'

    let options = {
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(
      `${ruleName}(${type}): sorts props in Vue components`,
      rule,
      {
        valid: [
          {
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import Component from '../file.vue'

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
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import Component from '../file.vue'

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
                import Component from '../file.vue'

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
      `${ruleName}(${type}): does not break the property list`,
      rule,
      {
        valid: [
          {
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import Component from '@/file.vue'
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
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import Component from '@/file.vue'
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
                import Component from '@/file.vue'
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
      `${ruleName}(${type}): allows to sort props using groups`,
      rule,
      {
        valid: [
          {
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Component from '../file.vue'

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
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Component from '../file.vue'

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

                import Component from '../file.vue'

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

  describe(`${ruleName}: sorting by line length`, () => {
    let type = 'line-length-order'

    let options = {
      type: 'line-length',
      order: 'desc',
    } as const

    ruleTester.run(
      `${ruleName}(${type}): sorts props in Vue components`,
      rule,
      {
        valid: [
          {
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import Component from '../file.vue'

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
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import Component from '../file.vue'

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
                import Component from '../file.vue'

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
      `${ruleName}(${type}): does not break the property list`,
      rule,
      {
        valid: [
          {
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import Component from '@/file.vue'
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
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import Component from '@/file.vue'
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
                import Component from '@/file.vue'
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
      `${ruleName}(${type}): allows to sort props using groups`,
      rule,
      {
        valid: [
          {
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Component from '../file.vue'

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
            filename: 'file.vue',
            code: dedent`
              <script lang="ts" setup>
                import { useRef } from 'vue'

                import Component from '../file.vue'

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

                import Component from '../file.vue'

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

  describe(`${ruleName}: misc`, () => {
    ruleTester.run(`${ruleName}: works only with .vue files`, rule, {
      valid: [
        {
          filename: 'component.ts',
          code: dedent`
            <script lang="ts" setup>
              import Component from '../file.vue'
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
        settings: {
          parser: typescriptParser,
        },
      })

      tsRuleTester.run(`${ruleName}: requires vue parser`, rule, {
        valid: [
          {
            filename: 'file.vue',
            code: '',
            options: [{}],
          },
        ],
        invalid: [],
      })
    })
  })
})
