import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-array-includes'
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

    ruleTester.run(
      `${RULE_NAME}(${type}): does not break the property list`,
      rule,
      {
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  left: 'Cart Titan',
                  right: '...otherTitans',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): sorts spread elements`, rule, {
      valid: [
        {
          code: dedent`
            [
              ...demons,
              ...lowerRanks,
              ...upperRanks,
            ].includes('Nezuko Kamado')
          `,
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
              data: {
                left: '...upperRanks',
                right: '...lowerRanks',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): ignores nullable array elements`,
      rule,
      {
        valid: [
          {
            code: dedent`
              ['Bang', 'Genos', 'King',, 'Saitama'].includes(hero)
            `,
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  left: 'Genos',
                  right: 'Bang',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allow to put spread elements to the end`,
      rule,
      {
        valid: [
          {
            code: dedent`
              ['Emma', 'Norman', 'Ray', ...graceFieldOrphans].includes(child)
            `,
            options: [
              {
                ...options,
                'spread-last': true,
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
                ...options,
                'spread-last': true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  left: '...graceFieldOrphans',
                  right: 'Norman',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): sorts array constructor`, rule, {
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
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
              data: {
                left: 'Sonozaki Shion',
                right: 'Maebara Keiichi',
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

    ruleTester.run(
      `${RULE_NAME}(${type}): does not break the property list`,
      rule,
      {
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
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  left: 'Cart Titan',
                  right: '...otherTitans',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): sorts spread elements`, rule, {
      valid: [
        {
          code: dedent`
            [
              ...demons,
              ...lowerRanks,
              ...upperRanks,
            ].includes('Nezuko Kamado')
          `,
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
              data: {
                left: '...upperRanks',
                right: '...lowerRanks',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): ignores nullable array elements`,
      rule,
      {
        valid: [
          {
            code: dedent`
              ['Bang', 'Genos', 'King',, 'Saitama'].includes(hero)
            `,
            options: [options],
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
            options: [options],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  left: 'Genos',
                  right: 'Bang',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allow to put spread elements to the end`,
      rule,
      {
        valid: [
          {
            code: dedent`
              ['Emma', 'Norman', 'Ray', ...graceFieldOrphans].includes(child)
            `,
            options: [
              {
                ...options,
                'spread-last': true,
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
                ...options,
                'spread-last': true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  left: '...graceFieldOrphans',
                  right: 'Norman',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): sorts array constructor`, rule, {
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
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
              data: {
                left: 'Sonozaki Shion',
                right: 'Maebara Keiichi',
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

    ruleTester.run(
      `${RULE_NAME}(${type}): does not break the property list`,
      rule,
      {
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
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              [
                'Armored Titan',
                'Attack Titan',
                ...otherTitans,
                'Cart Titan',
                'Beast Titan',
                'War Hammer Titan',
              ].includes(titan)
            `,
            output: dedent`
              [
                'War Hammer Titan',
                'Armored Titan',
                'Attack Titan',
                ...otherTitans,
                'Beast Titan',
                'Cart Titan',
              ].includes(titan)
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  left: 'Cart Titan',
                  right: 'Beast Titan',
                },
              },
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  left: 'Beast Titan',
                  right: 'War Hammer Titan',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): sorts spread elements`, rule, {
      valid: [
        {
          code: dedent`
            [
              ...lowerRanks,
              ...upperRanks,
              ...demons,
            ].includes('Nezuko Kamado')
          `,
          options: [options],
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
              ...upperRanks,
              ...lowerRanks,
              ...demons,
            ].includes('Nezuko Kamado')
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
              data: {
                left: '...demons',
                right: '...upperRanks',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): ignores nullable array elements`,
      rule,
      {
        valid: [
          {
            code: dedent`
              ['Saitama', 'Genos', 'King',, 'Bang'].includes(hero)
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              ['Genos', 'Bang', 'King',, 'Saitama'].includes(hero)
            `,
            output: dedent`
              ['Saitama', 'Genos', 'Bang',, 'King'].includes(hero)
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  left: 'King',
                  right: 'Saitama',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allow to put spread elements to the end`,
      rule,
      {
        valid: [
          {
            code: dedent`
              ['Norman', 'Emma', 'Ray', ...graceFieldOrphans].includes(child)
            `,
            options: [
              {
                ...options,
                'spread-last': true,
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
                ...options,
                'spread-last': true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  left: '...graceFieldOrphans',
                  right: 'Norman',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): sorts array constructor`, rule, {
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
          options: [options],
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
          options: [options],
          errors: [
            {
              messageId: 'unexpectedArrayIncludesOrder',
              data: {
                left: 'Ryūgū Rena',
                right: 'Sonozaki Shion',
              },
            },
            {
              messageId: 'unexpectedArrayIncludesOrder',
              data: {
                left: 'Sonozaki Shion',
                right: 'Maebara Keiichi',
              },
            },
          ],
        },
      ],
    })
  })

  describe(`${RULE_NAME}: misc`, () => {
    ruleTester.run(
      `${RULE_NAME}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          dedent`
            [
              'Akane Tsunemori',
              'Nobuchika Ginoza',
              'Shusei Kagari',
              'Tomomi Masaoka',
            ].includes(enforcer)
          `,
          {
            code: dedent`
              [
                'img1.png',
                'img10.png',
                'img12.png',
                'img2.png',
              ].includes(filename)
            `,
            options: [{}],
          },
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
                  left: 'Shusei Kagari',
                  right: 'Akane Tsunemori',
                },
              },
              {
                messageId: 'unexpectedArrayIncludesOrder',
                data: {
                  left: 'Tomomi Masaoka',
                  right: 'Nobuchika Ginoza',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}: works consistently with an empty array or an array with one element`,
      rule,
      {
        valid: ['[].includes(person)', "['Decim'].includes(bartender)"],
        invalid: [],
      },
    )

    ruleTester.run(`${RULE_NAME}: ignores quotes of strings`, rule, {
      valid: [
        dedent`
          ['Burger King', "McDonald's", 'Subway'].includes(name)
        `,
      ],
      invalid: [],
    })
  })
})
