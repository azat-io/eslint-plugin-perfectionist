import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-object-types'
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

    ruleTester.run(`${RULE_NAME}(${type}): sorts type members`, rule, {
      valid: [
        {
          code: dedent`
            type Mushishi = {
              birthname: 'Yoki'
              name: 'Ginko'
              status: 'wanderer'
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Mushishi = {
              name: 'Ginko'
              birthname: 'Yoki'
              status: 'wanderer'
            }
          `,
          output: dedent`
            type Mushishi = {
              birthname: 'Yoki'
              name: 'Ginko'
              status: 'wanderer'
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectTypesOrder',
              data: {
                left: 'name',
                right: 'birthname',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts type members in function args`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let handleDemonSlayerAttack = (attack: {
                attackType: string
                demon: string
                slayerName: string
              }) => {
                // ...
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let handleDemonSlayerAttack = (attack: {
                slayerName: string
                attackType: string
                demon: string
              }) => {
                // ...
              }
            `,
            output: dedent`
              let handleDemonSlayerAttack = (attack: {
                attackType: string
                demon: string
                slayerName: string
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'slayerName',
                  right: 'attackType',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts type members with computed keys`,
      rule,
      {
        valid: [
          {
            code: dedent`
              type SquadMember = {
                [key: string]: string
                age?: 30
                name: 'Levi Ackermann'
                occupation: 'soldier'
                rank: 'captain'
                [residence]: 'Wall Rose'
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              type SquadMember = {
                age?: 30
                [key: string]: string
                occupation: 'soldier'
                name: 'Levi Ackermann'
                [residence]: 'Wall Rose'
                rank: 'captain'
              }
            `,
            output: dedent`
              type SquadMember = {
                [key: string]: string
                age?: 30
                name: 'Levi Ackermann'
                occupation: 'soldier'
                rank: 'captain'
                [residence]: 'Wall Rose'
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'age',
                  right: '[key: string]',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'occupation',
                  right: 'name',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'residence',
                  right: 'rank',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts type members with any key types`,
      rule,
      {
        valid: [
          {
            code: dedent`
              type ParanoiaAgent = {
                [...kills]
                [[data]]: string
                [name in victims]?
                [8]: Victim
                goldenBatAttack(): void
                hide?: () => void
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              type ParanoiaAgent = {
                [...kills]
                [[data]]: string
                goldenBatAttack(): void
                [8]: Victim
                hide?: () => void
              }
            `,
            output: dedent`
              type ParanoiaAgent = {
                [...kills]
                [[data]]: string
                [8]: Victim
                goldenBatAttack(): void
                hide?: () => void
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'goldenBatAttack(): void',
                  right: '8',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): sorts inline type members`, rule, {
      valid: [
        {
          code: dedent`
            addToDeathNote<{ name: string; reasonOfDeath: string }>(/* ... */)
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            addToDeathNote<{ reasonOfDeath: string; name: string }>(/* ... */)
          `,
          output: dedent`
            addToDeathNote<{ name: string; reasonOfDeath: string }>(/* ... */)
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectTypesOrder',
              data: {
                left: 'reasonOfDeath',
                right: 'name',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set groups for sorting`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface Idol {
                id: string
                age: number
                gender: 'female'
                name: 'Ai Hoshino'
                skills: {
                  actress: number
                  singer: number
                }
              }
            `,
            options: [
              {
                ...options,
                groups: ['id', 'unknown', 'multiline'],
                'custom-groups': {
                  id: 'id',
                },
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              type Idol = {
                age: number
                gender: 'female'
                id: string
                skills: {
                  actress: number
                  singer: number
                }
                name: 'Ai Hoshino'
              }
            `,
            output: dedent`
              type Idol = {
                id: string
                age: number
                gender: 'female'
                name: 'Ai Hoshino'
                skills: {
                  actress: number
                  singer: number
                }
              }
            `,
            options: [
              {
                ...options,
                groups: ['id', 'unknown', 'multiline'],
                'custom-groups': {
                  id: 'id',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'gender',
                  right: 'id',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'skills',
                  right: 'name',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to use multiple partition comments`,
      rule,
      {
        valid: [],
        invalid: [
          {
            code: dedent`
              class PsychoPass {
                async incCrimeCoefficient (data: {
                  name: string
                  level: number
                  reason: string | string[]
                  callback: () => void
                }) {
                  updateCrimeCoefficient(data)
                }
              }
            `,
            output: dedent`
              class PsychoPass {
                async incCrimeCoefficient (data: {
                  callback: () => void
                  level: number
                  name: string
                  reason: string | string[]
                }) {
                  updateCrimeCoefficient(data)
                }
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'name',
                  right: 'level',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'reason',
                  right: 'callback',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to use new line as partition`,
      rule,
      {
        valid: [
          {
            code: dedent`
              type Cat = {
                age: number
                name: 'Jiji'

                gender: 'male' | 'female'

                breed: string
                color: string
              }
            `,
            options: [
              {
                ...options,
                'partition-by-new-line': true,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              type Cat = {
                name: 'Jiji'
                age: number

                gender: 'male' | 'female'

                color: string
                breed: string
              }
            `,
            output: dedent`
              type Cat = {
                age: number
                name: 'Jiji'

                gender: 'male' | 'female'

                breed: string
                color: string
              }
            `,
            options: [
              {
                ...options,
                'partition-by-new-line': true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'name',
                  right: 'age',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'color',
                  right: 'breed',
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
      'ignore-case': false,
    }

    ruleTester.run(`${RULE_NAME}(${type}): sorts type members`, rule, {
      valid: [
        {
          code: dedent`
            type Mushishi = {
              birthname: 'Yoki'
              name: 'Ginko'
              status: 'wanderer'
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Mushishi = {
              name: 'Ginko'
              birthname: 'Yoki'
              status: 'wanderer'
            }
          `,
          output: dedent`
            type Mushishi = {
              birthname: 'Yoki'
              name: 'Ginko'
              status: 'wanderer'
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectTypesOrder',
              data: {
                left: 'name',
                right: 'birthname',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts type members in function args`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let handleDemonSlayerAttack = (attack: {
                attackType: string
                demon: string
                slayerName: string
              }) => {
                // ...
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let handleDemonSlayerAttack = (attack: {
                slayerName: string
                attackType: string
                demon: string
              }) => {
                // ...
              }
            `,
            output: dedent`
              let handleDemonSlayerAttack = (attack: {
                attackType: string
                demon: string
                slayerName: string
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'slayerName',
                  right: 'attackType',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts type members with computed keys`,
      rule,
      {
        valid: [
          {
            code: dedent`
              type SquadMember = {
                [key: string]: string
                age?: 30
                name: 'Levi Ackermann'
                occupation: 'soldier'
                rank: 'captain'
                [residence]: 'Wall Rose'
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              type SquadMember = {
                age?: 30
                [key: string]: string
                occupation: 'soldier'
                name: 'Levi Ackermann'
                [residence]: 'Wall Rose'
                rank: 'captain'
              }
            `,
            output: dedent`
              type SquadMember = {
                [key: string]: string
                age?: 30
                name: 'Levi Ackermann'
                occupation: 'soldier'
                rank: 'captain'
                [residence]: 'Wall Rose'
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'age',
                  right: '[key: string]',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'occupation',
                  right: 'name',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'residence',
                  right: 'rank',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts type members with any key types`,
      rule,
      {
        valid: [
          {
            code: dedent`
              type ParanoiaAgent = {
                [...kills]
                [[data]]: string
                [name in victims]?
                [8]: Victim
                goldenBatAttack(): void
                hide?: () => void
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              type ParanoiaAgent = {
                [...kills]
                [[data]]: string
                goldenBatAttack(): void
                [8]: Victim
                hide?: () => void
              }
            `,
            output: dedent`
              type ParanoiaAgent = {
                [...kills]
                [[data]]: string
                [8]: Victim
                goldenBatAttack(): void
                hide?: () => void
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'goldenBatAttack(): void',
                  right: '8',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): sorts inline type members`, rule, {
      valid: [
        {
          code: dedent`
              addToDeathNote<{ name: string; reasonOfDeath: string }>(/* ... */)
            `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            addToDeathNote<{ reasonOfDeath: string; name: string }>(/* ... */)
          `,
          output: dedent`
            addToDeathNote<{ name: string; reasonOfDeath: string }>(/* ... */)
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectTypesOrder',
              data: {
                left: 'reasonOfDeath',
                right: 'name',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set groups for sorting`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface Idol {
                id: string
                age: number
                gender: 'female'
                name: 'Ai Hoshino'
                skills: {
                  actress: number
                  singer: number
                }
              }
            `,
            options: [
              {
                ...options,
                groups: ['id', 'unknown', 'multiline'],
                'custom-groups': {
                  id: 'id',
                },
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              type Idol = {
                age: number
                gender: 'female'
                id: string
                skills: {
                  actress: number
                  singer: number
                }
                name: 'Ai Hoshino'
              }
            `,
            output: dedent`
              type Idol = {
                id: string
                age: number
                gender: 'female'
                name: 'Ai Hoshino'
                skills: {
                  actress: number
                  singer: number
                }
              }
            `,
            options: [
              {
                ...options,
                groups: ['id', 'unknown', 'multiline'],
                'custom-groups': {
                  id: 'id',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'gender',
                  right: 'id',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'skills',
                  right: 'name',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to use new line as partition`,
      rule,
      {
        valid: [
          {
            code: dedent`
              type Cat = {
                age: number
                name: 'Jiji'

                gender: 'male' | 'female'

                breed: string
                color: string
              }
            `,
            options: [
              {
                ...options,
                'partition-by-new-line': true,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              type Cat = {
                name: 'Jiji'
                age: number

                gender: 'male' | 'female'

                color: string
                breed: string
              }
            `,
            output: dedent`
              type Cat = {
                age: number
                name: 'Jiji'

                gender: 'male' | 'female'

                breed: string
                color: string
              }
            `,
            options: [
              {
                ...options,
                'partition-by-new-line': true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'name',
                  right: 'age',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'color',
                  right: 'breed',
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

    ruleTester.run(`${RULE_NAME}(${type}): sorts type members`, rule, {
      valid: [
        {
          code: dedent`
            type Mushishi = {
              status: 'wanderer'
              birthname: 'Yoki'
              name: 'Ginko'
            }
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            type Mushishi = {
              name: 'Ginko'
              birthname: 'Yoki'
              status: 'wanderer'
            }
          `,
          output: dedent`
            type Mushishi = {
              status: 'wanderer'
              birthname: 'Yoki'
              name: 'Ginko'
            }
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectTypesOrder',
              data: {
                left: 'name',
                right: 'birthname',
              },
            },
            {
              messageId: 'unexpectedObjectTypesOrder',
              data: {
                left: 'birthname',
                right: 'status',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts type members in function args`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let handleDemonSlayerAttack = (attack: {
                attackType: string
                slayerName: string
                demon: string
              }) => {
                // ...
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let handleDemonSlayerAttack = (attack: {
                slayerName: string
                demon: string
                attackType: string
              }) => {
                // ...
              }
            `,
            output: dedent`
              let handleDemonSlayerAttack = (attack: {
                slayerName: string
                attackType: string
                demon: string
              }) => {
                // ...
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'demon',
                  right: 'attackType',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts type members with computed keys`,
      rule,
      {
        valid: [
          {
            code: dedent`
              type SquadMember = {
                [residence]: 'Wall Rose'
                name: 'Levi Ackermann'
                [key: string]: string
                occupation: 'soldier'
                rank: 'captain'
                age?: 30
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              type SquadMember = {
                age?: 30
                [key: string]: string
                occupation: 'soldier'
                name: 'Levi Ackermann'
                [residence]: 'Wall Rose'
                rank: 'captain'
              }
            `,
            output: dedent`
              type SquadMember = {
                [residence]: 'Wall Rose'
                name: 'Levi Ackermann'
                [key: string]: string
                occupation: 'soldier'
                rank: 'captain'
                age?: 30
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'age',
                  right: '[key: string]',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'occupation',
                  right: 'name',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'name',
                  right: 'residence',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts type members with any key types`,
      rule,
      {
        valid: [
          {
            code: dedent`
              type ParanoiaAgent = {
                goldenBatAttack(): void
                hide?: () => void
                [[data]]: string
                [8]: Victim
                [...kills]
              }
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              type ParanoiaAgent = {
                [...kills]
                [[data]]: string
                goldenBatAttack(): void
                [8]: Victim
                hide?: () => void
              }
            `,
            output: dedent`
              type ParanoiaAgent = {
                goldenBatAttack(): void
                hide?: () => void
                [[data]]: string
                [8]: Victim
                [...kills]
              }
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: '[...kills]',
                  right: '[[data]]',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: '[[data]]',
                  right: 'goldenBatAttack(): void',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: '8',
                  right: 'hide',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(`${RULE_NAME}(${type}): sorts inline type members`, rule, {
      valid: [
        {
          code: dedent`
            addToDeathNote<{ reasonOfDeath: string; name: string }>(/* ... */)
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
          addToDeathNote<{ name: string; reasonOfDeath: string }>(/* ... */)
          `,
          output: dedent`
            addToDeathNote<{ reasonOfDeath: string; name: string }>(/* ... */)
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedObjectTypesOrder',
              data: {
                left: 'name',
                right: 'reasonOfDeath',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set groups for sorting`,
      rule,
      {
        valid: [
          {
            code: dedent`
              interface Idol {
                id: string
                age: number
                gender: 'female'
                name: 'Ai Hoshino'
                skills: {
                  actress: number
                  singer: number
                }
              }
            `,
            options: [
              {
                ...options,
                groups: ['id', 'unknown', 'multiline'],
                'custom-groups': {
                  id: 'id',
                },
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              type Idol = {
                gender: 'female'
                id: string
                age: number
                skills: {
                  actress: number
                  singer: number
                }
                name: 'Ai Hoshino'
              }
            `,
            output: dedent`
              type Idol = {
                id: string
                name: 'Ai Hoshino'
                gender: 'female'
                age: number
                skills: {
                  actress: number
                  singer: number
                }
              }
            `,
            options: [
              {
                ...options,
                groups: ['id', 'unknown', 'multiline'],
                'custom-groups': {
                  id: 'id',
                },
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'gender',
                  right: 'id',
                },
              },
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'skills',
                  right: 'name',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to use new line as partition`,
      rule,
      {
        valid: [
          {
            code: dedent`
              type Cat = {
                name: 'Jiji'
                age: number

                gender: 'male' | 'female'

                breed: string
                color: string
              }
            `,
            options: [
              {
                ...options,
                'partition-by-new-line': true,
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              type Cat = {
                age: number
                name: 'Jiji'

                gender: 'male' | 'female'

                color: string
                breed: string
              }
            `,
            output: dedent`
              type Cat = {
                name: 'Jiji'
                age: number

                gender: 'male' | 'female'

                color: string
                breed: string
              }
            `,
            options: [
              {
                ...options,
                'partition-by-new-line': true,
              },
            ],
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'age',
                  right: 'name',
                },
              },
            ],
          },
        ],
      },
    )
  })

  describe('misc', () => {
    ruleTester.run(`${RULE_NAME}: ignores semi at the end of value`, rule, {
      valid: [
        dedent`
          type OverloadedReturnType<T> = T extends {
            (...args: any[]): infer R;
            (...args: any[]): infer R;
            (...args: any[]): infer R;
            (...args: any[]): infer R;
          }
            ? R
            : T extends { (...args: any[]): infer R; (...args: any[]): infer R; (...args: any[]): infer R }
            ? R
            : T extends { (...args: any[]): infer R; (...args: any[]): infer R }
            ? R
            : T extends (...args: any[]) => infer R
            ? R
            : any;
        `,
      ],
      invalid: [],
    })

    ruleTester.run(
      `${RULE_NAME}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          dedent`
            type Calculator = {
              log: (x: number) => number,
              log10: (x: number) => number,
              log1p: (x: number) => number,
              log2: (x: number) => number,
            }
          `,
          {
            code: dedent`
              type Calculator = {
                log: (x: number) => number,
                log10: (x: number) => number,
                log1p: (x: number) => number,
                log2: (x: number) => number,
              }
            `,
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
              type Calculator = {
                log: (x: number) => number,
                log1p: (x: number) => number,
                log2: (x: number) => number,
                log10: (x: number) => number,
              }
            `,
            output: dedent`
              type Calculator = {
                log: (x: number) => number,
                log10: (x: number) => number,
                log1p: (x: number) => number,
                log2: (x: number) => number,
              }
            `,
            errors: [
              {
                messageId: 'unexpectedObjectTypesOrder',
                data: {
                  left: 'log2',
                  right: 'log10',
                },
              },
            ],
          },
        ],
      },
    )
  })
})
