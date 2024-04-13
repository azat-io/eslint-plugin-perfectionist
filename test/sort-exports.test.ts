import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-exports'
import { SortOrder, SortType } from '../typings'

describe(RULE_NAME, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    let options = {
      type: SortType.alphabetical,
      order: SortOrder.asc,
      'ignore-case': false,
    }

    ruleTester.run(`${RULE_NAME}(${type}): sorts exports`, rule, {
      valid: [
        {
          code: dedent`
            export { HiroshiOdokawa } from 'cab-park'
            export { Gouriki } from 'hospital'
            export { Daimon1, Daimon2 } from 'police'
            export { Shibagaki, Baba } from 'radio'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { Gouriki } from 'hospital'
            export { HiroshiOdokawa } from 'cab-park'
            export { Shibagaki, Baba } from 'radio'
            export { Daimon1, Daimon2 } from 'police'
          `,
          output: dedent`
            export { HiroshiOdokawa } from 'cab-park'
            export { Gouriki } from 'hospital'
            export { Daimon1, Daimon2 } from 'police'
            export { Shibagaki, Baba } from 'radio'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'hospital',
                right: 'cab-park',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'radio',
                right: 'police',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): sorts all-exports`, rule, {
      valid: [
        {
          code: dedent`
            export { SuzuHoujou } from './houjou'
            export * as Kuromura from './kuromura'
            export { TetsuMizuhara } from './mizuhara'
            export { Shuusaku } from './shuusaku'
            export * from 'hiroshima'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export * as Kuromura from './kuromura'
            export { SuzuHoujou } from './houjou'
            export { TetsuMizuhara } from './mizuhara'
            export * from 'hiroshima'
            export { Shuusaku } from './shuusaku'
          `,
          output: dedent`
            export { SuzuHoujou } from './houjou'
            export * as Kuromura from './kuromura'
            export { TetsuMizuhara } from './mizuhara'
            export { Shuusaku } from './shuusaku'
            export * from 'hiroshima'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './kuromura',
                right: './houjou',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'hiroshima',
                right: './shuusaku',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): works with export aliases`, rule, {
      valid: [
        {
          code: dedent`
            export { student as MeiKamino } from './laboratory'
            export { default as Gojira } from './monsters/gojira'
            export { Yun, Haberu } from './otaki-factory'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { default as Gojira } from './monsters/gojira'
            export { Yun, Haberu } from './otaki-factory'
            export { student as MeiKamino } from './laboratory'
          `,
          output: dedent`
            export { student as MeiKamino } from './laboratory'
            export { default as Gojira } from './monsters/gojira'
            export { Yun, Haberu } from './otaki-factory'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './otaki-factory',
                right: './laboratory',
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
      type: SortType.natural,
      order: SortOrder.asc,
      'ignore-case': false,
    }

    ruleTester.run(`${RULE_NAME}(${type}): sorts exports`, rule, {
      valid: [
        {
          code: dedent`
            export { HiroshiOdokawa } from 'cab-park'
            export { Gouriki } from 'hospital'
            export { Daimon1, Daimon2 } from 'police'
            export { Shibagaki, Baba } from 'radio'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { Gouriki } from 'hospital'
            export { HiroshiOdokawa } from 'cab-park'
            export { Shibagaki, Baba } from 'radio'
            export { Daimon1, Daimon2 } from 'police'
          `,
          output: dedent`
            export { HiroshiOdokawa } from 'cab-park'
            export { Gouriki } from 'hospital'
            export { Daimon1, Daimon2 } from 'police'
            export { Shibagaki, Baba } from 'radio'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'hospital',
                right: 'cab-park',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'radio',
                right: 'police',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): sorts all-exports`, rule, {
      valid: [
        {
          code: dedent`
            export { SuzuHoujou } from './houjou'
            export * as Kuromura from './kuromura'
            export { TetsuMizuhara } from './mizuhara'
            export { Shuusaku } from './shuusaku'
            export * from 'hiroshima'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export * as Kuromura from './kuromura'
            export { SuzuHoujou } from './houjou'
            export { TetsuMizuhara } from './mizuhara'
            export * from 'hiroshima'
            export { Shuusaku } from './shuusaku'
          `,
          output: dedent`
            export { SuzuHoujou } from './houjou'
            export * as Kuromura from './kuromura'
            export { TetsuMizuhara } from './mizuhara'
            export { Shuusaku } from './shuusaku'
            export * from 'hiroshima'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './kuromura',
                right: './houjou',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'hiroshima',
                right: './shuusaku',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): works with export aliases`, rule, {
      valid: [
        {
          code: dedent`
            export { student as MeiKamino } from './laboratory'
            export { default as Gojira } from './monsters/gojira'
            export { Yun, Haberu } from './otaki-factory'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { default as Gojira } from './monsters/gojira'
            export { Yun, Haberu } from './otaki-factory'
            export { student as MeiKamino } from './laboratory'
          `,
          output: dedent`
            export { student as MeiKamino } from './laboratory'
            export { default as Gojira } from './monsters/gojira'
            export { Yun, Haberu } from './otaki-factory'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './otaki-factory',
                right: './laboratory',
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
      type: SortType['line-length'],
      order: SortOrder.desc,
    }

    ruleTester.run(`${RULE_NAME}(${type}): sorts exports`, rule, {
      valid: [
        {
          code: dedent`
            export { HiroshiOdokawa } from 'cab-park'
            export { Daimon1, Daimon2 } from 'police'
            export { Shibagaki, Baba } from 'radio'
            export { Gouriki } from 'hospital'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { Gouriki } from 'hospital'
            export { HiroshiOdokawa } from 'cab-park'
            export { Shibagaki, Baba } from 'radio'
            export { Daimon1, Daimon2 } from 'police'
          `,
          output: dedent`
            export { HiroshiOdokawa } from 'cab-park'
            export { Daimon1, Daimon2 } from 'police'
            export { Shibagaki, Baba } from 'radio'
            export { Gouriki } from 'hospital'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'hospital',
                right: 'cab-park',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'radio',
                right: 'police',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): sorts all-exports`, rule, {
      valid: [
        {
          code: dedent`
            export { TetsuMizuhara } from './mizuhara'
            export * as Kuromura from './kuromura'
            export { SuzuHoujou } from './houjou'
            export { Shuusaku } from './shuusaku'
            export * from 'hiroshima'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export * as Kuromura from './kuromura'
            export { SuzuHoujou } from './houjou'
            export { TetsuMizuhara } from './mizuhara'
            export * from 'hiroshima'
            export { Shuusaku } from './shuusaku'
          `,
          output: dedent`
            export { TetsuMizuhara } from './mizuhara'
            export * as Kuromura from './kuromura'
            export { SuzuHoujou } from './houjou'
            export { Shuusaku } from './shuusaku'
            export * from 'hiroshima'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './houjou',
                right: './mizuhara',
              },
            },
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: 'hiroshima',
                right: './shuusaku',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(`${RULE_NAME}(${type}): works with export aliases`, rule, {
      valid: [
        {
          code: dedent`
            export { default as Gojira } from './monsters/gojira'
            export { student as MeiKamino } from './laboratory'
            export { Yun, Haberu } from './otaki-factory'
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            export { default as Gojira } from './monsters/gojira'
            export { Yun, Haberu } from './otaki-factory'
            export { student as MeiKamino } from './laboratory'
          `,
          output: dedent`
            export { default as Gojira } from './monsters/gojira'
            export { student as MeiKamino } from './laboratory'
            export { Yun, Haberu } from './otaki-factory'
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedExportsOrder',
              data: {
                left: './otaki-factory',
                right: './laboratory',
              },
            },
          ],
        },
      ],
    })
  })

  describe('misc', () => {
    ruleTester.run(
      `${RULE_NAME}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          dedent`
            export { Hizuru } from '~/higotoshima/hizuru'
            export { Mio } from '~/higotoshima/mio'
            export { Shinpei } from '~/higotoshima/shinpei'
            export { Ushio } from '~/higotoshima/ushio'
          `,
          {
            code: dedent`
              export { log } from './log'
              export { log10 } from './log10'
              export { log1p } from './log1p'
              export { log2 } from './log2'
            `,
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
              export { Shinpei } from '~/higotoshima/shinpei'
              export { Mio } from '~/higotoshima/mio'
              export { Ushio } from '~/higotoshima/ushio'
              export { Hizuru } from '~/higotoshima/hizuru'
            `,
            output: dedent`
              export { Hizuru } from '~/higotoshima/hizuru'
              export { Mio } from '~/higotoshima/mio'
              export { Shinpei } from '~/higotoshima/shinpei'
              export { Ushio } from '~/higotoshima/ushio'
            `,
            errors: [
              {
                messageId: 'unexpectedExportsOrder',
                data: {
                  left: '~/higotoshima/shinpei',
                  right: '~/higotoshima/mio',
                },
              },
              {
                messageId: 'unexpectedExportsOrder',
                data: {
                  left: '~/higotoshima/ushio',
                  right: '~/higotoshima/hizuru',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}: ignores exported variables or functions`,
      rule,
      {
        valid: [
          dedent`
            export let jajankenAttack = () => {
              // ...
            }

            export let transformGon = () => {
              // ...
            }

            export let name = 'Gon Freecss'
          `,
        ],
        invalid: [],
      },
    )
  })
})
