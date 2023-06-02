import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-named-exports'
import { SortType, SortOrder } from '../typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    it(`${RULE_NAME}(${type}): sorts named exports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: 'export { ErisBoreas, Rudeus, RuijerdSuperdia }',
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
              export {
                Rudeus,
                RuijerdSuperdia,
                ErisBoreas
              }
            `,
            output: dedent`
              export {
                ErisBoreas,
                Rudeus,
                RuijerdSuperdia
              }
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  first: 'RuijerdSuperdia',
                  second: 'ErisBoreas',
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

    it(`${RULE_NAME}(${type}): sorts named exports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: 'export { ErisBoreas, Rudeus, RuijerdSuperdia }',
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
              export {
                Rudeus,
                RuijerdSuperdia,
                ErisBoreas
              }
            `,
            output: dedent`
              export {
                ErisBoreas,
                Rudeus,
                RuijerdSuperdia
              }
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  first: 'RuijerdSuperdia',
                  second: 'ErisBoreas',
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

    it(`${RULE_NAME}(${type}): sorts named exports`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: 'export { RuijerdSuperdia, ErisBoreas, Rudeus }',
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
              export {
                Rudeus,
                RuijerdSuperdia,
                ErisBoreas
              }
            `,
            output: dedent`
              export {
                RuijerdSuperdia,
                ErisBoreas,
                Rudeus
              }
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  first: 'Rudeus',
                  second: 'RuijerdSuperdia',
                },
              },
            ],
          },
        ],
      })
    })
  })

  describe(`${RULE_NAME}: misc`, () => {
    it(`${RULE_NAME}: sets alphabetical asc sorting as default`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: ['export { KayoHinazuki, SatoruFujinuma }'],
        invalid: [
          {
            code: dedent`
              export { SatoruFujinuma, KayoHinazuki }
            `,
            output: dedent`
              export { KayoHinazuki, SatoruFujinuma }
            `,
            errors: [
              {
                messageId: 'unexpectedNamedExportsOrder',
                data: {
                  first: 'SatoruFujinuma',
                  second: 'KayoHinazuki',
                },
              },
            ],
          },
        ],
      })
    })
  })
})
