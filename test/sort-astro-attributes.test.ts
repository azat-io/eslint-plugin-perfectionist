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
