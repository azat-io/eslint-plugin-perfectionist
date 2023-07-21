import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-exports'
import { SortOrder, SortType } from '../typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    it(`${RULE_NAME}(${type}): sorts exports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              export { HiroshiOdokawa } from 'cab-park'
              export { Gouriki } from 'hospital'
              export { Daimon1, Daimon2 } from 'police'
              export { Shibagaki, Baba } from 'radio'
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
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
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
    })

    it(`${RULE_NAME}(${type}): sorts all-exports only if export kind is value`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              export { SuzuHoujou } from './houjou'
              export * as Kuromura from './kuromura'
              export { TetsuMizuhara } from './mizuhara'
              export * from 'hiroshima'
              export { Shuusaku } from './shuusaku'
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
              export * from 'hiroshima'
              export { Shuusaku } from './shuusaku'
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedExportsOrder',
                data: {
                  left: './kuromura',
                  right: './houjou',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with export aliases`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              export { student as MeiKamino } from './laboratory'
              export { default as Gojira } from './monsters/gojira'
              export { Yun, Haberu } from './otaki-factory'
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
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
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
  })

  describe(`${RULE_NAME}: sorting by natural order`, () => {
    let type = 'natural-order'

    it(`${RULE_NAME}(${type}): sorts exports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              export { HiroshiOdokawa } from 'cab-park'
              export { Gouriki } from 'hospital'
              export { Daimon1, Daimon2 } from 'police'
              export { Shibagaki, Baba } from 'radio'
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
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
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
    })

    it(`${RULE_NAME}(${type}): sorts all-exports only if export kind is value`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              export { SuzuHoujou } from './houjou'
              export * as Kuromura from './kuromura'
              export { TetsuMizuhara } from './mizuhara'
              export * from 'hiroshima'
              export { Shuusaku } from './shuusaku'
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
              export * from 'hiroshima'
              export { Shuusaku } from './shuusaku'
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedExportsOrder',
                data: {
                  left: './kuromura',
                  right: './houjou',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with export aliases`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              export { student as MeiKamino } from './laboratory'
              export { default as Gojira } from './monsters/gojira'
              export { Yun, Haberu } from './otaki-factory'
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
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
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
  })

  describe(`${RULE_NAME}: sorting by line length`, () => {
    let type = 'line-length-order'

    it(`${RULE_NAME}(${type}): sorts exports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              export { HiroshiOdokawa } from 'cab-park'
              export { Daimon1, Daimon2 } from 'police'
              export { Shibagaki, Baba } from 'radio'
              export { Gouriki } from 'hospital'
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
            code: dedent`
              export { Gouriki } from 'hospital'
              export { HiroshiOdokawa } from 'cab-park'
              export { Shibagaki, Baba } from 'radio'
              export { Daimon1, Daimon2 } from 'police'
            `,
            output: dedent`
              export { Daimon1, Daimon2 } from 'police'
              export { HiroshiOdokawa } from 'cab-park'
              export { Shibagaki, Baba } from 'radio'
              export { Gouriki } from 'hospital'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
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
    })

    it(`${RULE_NAME}(${type}): sorts all-exports only if export kind is value`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              export { TetsuMizuhara } from './mizuhara'
              export * as Kuromura from './kuromura'
              export { SuzuHoujou } from './houjou'
              export * from 'hiroshima'
              export { Shuusaku } from './shuusaku'
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
              export * from 'hiroshima'
              export { Shuusaku } from './shuusaku'
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedExportsOrder',
                data: {
                  left: './houjou',
                  right: './mizuhara',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): works with export aliases`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              export { default as Gojira } from './monsters/gojira'
              export { student as MeiKamino } from './laboratory'
              export { Yun, Haberu } from './otaki-factory'
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
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
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
  })

  describe('misc', () => {
    it(`${RULE_NAME}: sets alphabetical asc sorting as default`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
      })
    })

    it(`${RULE_NAME}: ignores exported variables or functions`, () => {
      ruleTester.run(RULE_NAME, rule, {
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
      })
    })
  })
})
