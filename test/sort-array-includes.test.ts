import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '~/rules/sort-array-includes'
import { SortType, SortOrder } from '~/typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  })

  describe(`${RULE_NAME}: sorting by alphabetical order`, () => {
    let type = 'alphabetical-order'

    it(`${RULE_NAME}(${type}): does not break the property list`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              [
                ...otherTitans,
                'Armored Titan',
                'Attack Titan',
                'Beast Titan',
                'Cart Titan',
                'War Hammer Titan',
              ].includes(titan)
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
              [
                'Armored Titan',
                'Attack Titan',
                'Cart Titan',
                ...otherTitans,
                'Beast Titan',
                'War Hammer Titan',
              ].includes(titan)
            `,
            output: dedent`
              [
                ...otherTitans,
                'Armored Titan',
                'Attack Titan',
                'Beast Titan',
                'Cart Titan',
                'War Hammer Titan',
              ].includes(titan)
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: "'Cart Titan'",
                  second: '...otherTitans',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts spread elements`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              [
                ...demons,
                ...lowerRanks,
                ...upperRanks,
              ].includes('Nezuko Kamado')
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
              [
                ...demons,
                ...upperRanks,
                ...lowerRanks,
              ].includes('Nezuko Kamado')
            `,
            output: dedent`
              [
                ...demons,
                ...lowerRanks,
                ...upperRanks,
              ].includes('Nezuko Kamado')
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: '...upperRanks',
                  second: '...lowerRanks',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): ignores nullable array elements`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              ['Bang', 'Genos', 'King',, 'Saitama'].includes(hero)
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
              ['Genos', 'Bang', 'King',, 'Saitama'].includes(hero)
            `,
            output: dedent`
              ['Bang', 'Genos', 'King',, 'Saitama'].includes(hero)
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: "'Genos'",
                  second: "'Bang'",
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allow to put spread elements to the end`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              ['Emma', 'Norman', 'Ray', ...graceFieldOrphans].includes(child)
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                spreadLast: true,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              ['Emma', ...graceFieldOrphans, 'Norman', 'Ray'].includes(child)
            `,
            output: dedent`
              ['Emma', 'Norman', 'Ray', ...graceFieldOrphans].includes(child)
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
                spreadLast: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: '...graceFieldOrphans',
                  second: "'Norman'",
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts array constructor`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              new Array(
                'Furude Rika',
                'Maebara Keiichi',
                'Ryūgū Rena',
                'Sonozaki Shion',
              ).includes(name)
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
              new Array(
                'Furude Rika',
                'Ryūgū Rena',
                'Sonozaki Shion',
                'Maebara Keiichi',
              ).includes(name)
            `,
            output: dedent`
              new Array(
                'Furude Rika',
                'Maebara Keiichi',
                'Ryūgū Rena',
                'Sonozaki Shion',
              ).includes(name)
            `,
            options: [
              {
                type: SortType.alphabetical,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: "'Sonozaki Shion'",
                  second: "'Maebara Keiichi'",
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

    it(`${RULE_NAME}(${type}): does not break the property list`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              [
                'Armored Titan',
                'Attack Titan',
                'Beast Titan',
                'Cart Titan',
                'War Hammer Titan',
                ...otherTitans,
              ].includes(titan)
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
              [
                'Armored Titan',
                'Attack Titan',
                'Cart Titan',
                ...otherTitans,
                'Beast Titan',
                'War Hammer Titan',
              ].includes(titan)
            `,
            output: dedent`
              [
                'Armored Titan',
                'Attack Titan',
                'Beast Titan',
                'Cart Titan',
                'War Hammer Titan',
                ...otherTitans,
              ].includes(titan)
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: '...otherTitans',
                  second: "'Beast Titan'",
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts spread elements`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              [
                ...demons,
                ...lowerRanks,
                ...upperRanks,
              ].includes('Nezuko Kamado')
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
              [
                ...demons,
                ...upperRanks,
                ...lowerRanks,
              ].includes('Nezuko Kamado')
            `,
            output: dedent`
              [
                ...demons,
                ...lowerRanks,
                ...upperRanks,
              ].includes('Nezuko Kamado')
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: '...upperRanks',
                  second: '...lowerRanks',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): ignores nullable array elements`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              ['Bang', 'Genos', 'King',, 'Saitama'].includes(hero)
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
              ['Genos', 'Bang', 'King',, 'Saitama'].includes(hero)
            `,
            output: dedent`
              ['Bang', 'Genos', 'King',, 'Saitama'].includes(hero)
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: "'Genos'",
                  second: "'Bang'",
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allow to put spread elements to the end`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              ['Emma', 'Norman', 'Ray', ...graceFieldOrphans].includes(child)
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                spreadLast: true,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              ['Emma', ...graceFieldOrphans, 'Norman', 'Ray'].includes(child)
            `,
            output: dedent`
              ['Emma', 'Norman', 'Ray', ...graceFieldOrphans].includes(child)
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
                spreadLast: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: '...graceFieldOrphans',
                  second: "'Norman'",
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts array constructor`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              new Array(
                'Furude Rika',
                'Maebara Keiichi',
                'Ryūgū Rena',
                'Sonozaki Shion',
              ).includes(name)
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
              new Array(
                'Furude Rika',
                'Ryūgū Rena',
                'Sonozaki Shion',
                'Maebara Keiichi',
              ).includes(name)
            `,
            output: dedent`
              new Array(
                'Furude Rika',
                'Maebara Keiichi',
                'Ryūgū Rena',
                'Sonozaki Shion',
              ).includes(name)
            `,
            options: [
              {
                type: SortType.natural,
                order: SortOrder.asc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: "'Sonozaki Shion'",
                  second: "'Maebara Keiichi'",
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

    it(`${RULE_NAME}(${type}): does not break the property list`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              [
                'War Hammer Titan',
                'Armored Titan',
                ...otherTitans,
                'Attack Titan',
                'Beast Titan',
                'Cart Titan',
              ].includes(titan)
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
              [
                'Armored Titan',
                'Attack Titan',
                'Cart Titan',
                ...otherTitans,
                'Beast Titan',
                'War Hammer Titan',
              ].includes(titan)
            `,
            output: dedent`
              [
                'War Hammer Titan',
                'Armored Titan',
                ...otherTitans,
                'Attack Titan',
                'Beast Titan',
                'Cart Titan',
              ].includes(titan)
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: "'Cart Titan'",
                  second: '...otherTitans',
                },
              },
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: "'Beast Titan'",
                  second: "'War Hammer Titan'",
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts spread elements`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              [
                ...lowerRanks,
                ...upperRanks,
                ...demons,
              ].includes('Nezuko Kamado')
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
              [
                ...demons,
                ...upperRanks,
                ...lowerRanks,
              ].includes('Nezuko Kamado')
            `,
            output: dedent`
              [
                ...lowerRanks,
                ...upperRanks,
                ...demons,
              ].includes('Nezuko Kamado')
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: '...demons',
                  second: '...upperRanks',
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): ignores nullable array elements`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              ['Saitama', 'Genos', 'King',, 'Bang'].includes(hero)
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
              ['Genos', 'Bang', 'King',, 'Saitama'].includes(hero)
            `,
            output: dedent`
              ['Saitama', 'Genos', 'King',, 'Bang'].includes(hero)
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: "'King'",
                  second: "'Saitama'",
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): allow to put spread elements to the end`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              ['Norman', 'Emma', 'Ray', ...graceFieldOrphans].includes(child)
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                spreadLast: true,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              ['Emma', ...graceFieldOrphans, 'Norman', 'Ray'].includes(child)
            `,
            output: dedent`
              ['Norman', 'Emma', 'Ray', ...graceFieldOrphans].includes(child)
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
                spreadLast: true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: '...graceFieldOrphans',
                  second: "'Norman'",
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}(${type}): sorts array constructor`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: [
          {
            code: dedent`
              new Array(
                'Maebara Keiichi',
                'Sonozaki Shion',
                'Furude Rika',
                'Ryūgū Rena',
              ).includes(name)
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
              new Array(
                'Furude Rika',
                'Ryūgū Rena',
                'Sonozaki Shion',
                'Maebara Keiichi',
              ).includes(name)
            `,
            output: dedent`
              new Array(
                'Maebara Keiichi',
                'Sonozaki Shion',
                'Furude Rika',
                'Ryūgū Rena',
              ).includes(name)
            `,
            options: [
              {
                type: SortType['line-length'],
                order: SortOrder.desc,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: "'Ryūgū Rena'",
                  second: "'Sonozaki Shion'",
                },
              },
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: "'Sonozaki Shion'",
                  second: "'Maebara Keiichi'",
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
        valid: [
          dedent`
            [
              'Akane Tsunemori',
              'Nobuchika Ginoza',
              'Shusei Kagari',
              'Tomomi Masaoka',
            ].includes(enforcer)
          `,
        ],
        invalid: [
          {
            code: dedent`
              [
                'Shusei Kagari',
                'Akane Tsunemori',
                'Tomomi Masaoka',
                'Nobuchika Ginoza',
              ].includes(enforcer)
            `,
            output: dedent`
                [
                  'Akane Tsunemori',
                  'Nobuchika Ginoza',
                  'Shusei Kagari',
                  'Tomomi Masaoka',
                ].includes(enforcer)
              `,
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: "'Shusei Kagari'",
                  second: "'Akane Tsunemori'",
                },
              },
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  first: "'Tomomi Masaoka'",
                  second: "'Nobuchika Ginoza'",
                },
              },
            ],
          },
        ],
      })
    })

    it(`${RULE_NAME}: works consistently with an empty array or an array with one element`, () => {
      ruleTester.run(RULE_NAME, rule, {
        valid: ['[].includes(person)', "['Decim'].includes(bartender)"],
        invalid: [],
      })
    })
  })
})
