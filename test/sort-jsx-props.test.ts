import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-jsx-props'

describe(RULE_NAME, () => {
  RuleTester.describeSkip = describe.skip
  RuleTester.afterAll = afterAll
  RuleTester.describe = describe
  RuleTester.itOnly = it.only
  RuleTester.itSkip = it.skip
  RuleTester.it = it

  let ruleTester = new RuleTester({
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
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

    ruleTester.run(`${RULE_NAME}(${type}): sorts jsx props`, rule, {
      valid: [
        {
          code: dedent`
            let Odokawa = () => (
              <Character
                role="taxi driver"
                type="walrus"
                variant="odd"
              >
                Pew-pew
              </Character>
            )
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            let Odokawa = () => (
              <Character
                type="walrus"
                role="taxi driver"
                variant="odd"
              >
                Pew-pew
              </Character>
            )
          `,
          output: dedent`
            let Odokawa = () => (
              <Character
                role="taxi driver"
                type="walrus"
                variant="odd"
              >
                Pew-pew
              </Character>
            )
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedJSXPropsOrder',
              data: {
                left: 'type',
                right: 'role',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts jsx props with namespaced names`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Protagonist = () => (
                <User
                  age={16}
                  name="Shinichi Izumi"
                  parasite:name="Migi"
                  school="West High"
                />
              )
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Protagonist = () => (
                <User
                  age={16}
                  parasite:name="Migi"
                  name="Shinichi Izumi"
                  school="West High"
                />
              )
            `,
            output: dedent`
              let Protagonist = () => (
                <User
                  age={16}
                  name="Shinichi Izumi"
                  parasite:name="Migi"
                  school="West High"
                />
              )
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'parasite:name',
                  right: 'name',
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
            code: dedent`
              let ArmorBoy = () => (
                <Alchemist
                  big
                  firstName="Alphonse"
                  lastName="Elric"
                  {...data}
                  age={14}
                  occupation="Alchemist"
                  weapon={['fists']}
                />
              )
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let ArmorBoy = () => (
                <Alchemist
                  firstName="Alphonse"
                  lastName="Elric"
                  big
                  {...data}
                  occupation="Alchemist"
                  age={14}
                  weapon={['fists']}
                />
              )
            `,
            output: dedent`
              let ArmorBoy = () => (
                <Alchemist
                  big
                  firstName="Alphonse"
                  lastName="Elric"
                  {...data}
                  age={14}
                  occupation="Alchemist"
                  weapon={['fists']}
                />
              )
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'lastName',
                  right: 'big',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'occupation',
                  right: 'age',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set shorthand props position`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Spike = () => (
                <Hunter
                  age={27}
                  bloodType={0}
                  origin="Mars"
                  isFromCowboyBebop
                />
              )
            `,
            options: [
              {
                ...options,
                groups: ['unknown', 'shorthand'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Spike = () => (
                <Hunter
                  age={27}
                  bloodType={0}
                  isFromCowboyBebop
                  origin="Mars"
                />
              )
            `,
            output: dedent`
              let Spike = () => (
                <Hunter
                  age={27}
                  bloodType={0}
                  origin="Mars"
                  isFromCowboyBebop
                />
              )
            `,
            options: [
              {
                ...options,
                groups: ['unknown', 'shorthand'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'isFromCowboyBebop',
                  right: 'origin',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set callback props position`,
      rule,
      {
        valid: [
          {
            code: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                shinigami="Ryuk"
                onChange={updateDeathNotes}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                onChange={updateDeathNotes}
                shinigami="Ryuk"
              />
            `,
            output: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                shinigami="Ryuk"
                onChange={updateDeathNotes}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'onChange',
                  right: 'shinigami',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set multiline props position`,
      rule,
      {
        valid: [
          {
            code: dedent`
              <Holo
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                form={form}
                residence="Pasloe"
                title="Wisewolf"
              />
            `,
            options: [
              {
                ...options,
                groups: [['multiline'], 'unknown'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <Holo
                form={form}
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                residence="Pasloe"
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                title="Wisewolf"
              />
            `,
            output: dedent`
              <Holo
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                form={form}
                residence="Pasloe"
                title="Wisewolf"
              />
            `,
            options: [
              {
                ...options,
                groups: ['multiline', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'form',
                  right: 'handleTransform',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'residence',
                  right: 'style',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set priority props`,
      rule,
      {
        valid: [
          {
            code: dedent`
              <Hero
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                name="Saitama"
                age={25}
                height={175}
                nickname="One-Punch Man"
                weight={70}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { top: ['id', 'name'] },
                groups: ['top', 'unknown'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <Hero
                age={25}
                nickname="One-Punch Man"
                name="Saitama"
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                height={175}
                weight={70}
              />
            `,
            output: dedent`
              <Hero
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                name="Saitama"
                age={25}
                height={175}
                nickname="One-Punch Man"
                weight={70}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { top: ['id', 'name'] },
                groups: ['top', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'nickname',
                  right: 'name',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
                },
              },
            ],
          },
          {
            code: dedent`
              <Hero
                name="Genos"
                id="dabd9d43-a165-419a-bfc8-061533bf40bd"
              />
            `,
            output: dedent`
              <Hero
                id="dabd9d43-a165-419a-bfc8-061533bf40bd"
                name="Genos"
              />
            `,
            options: [
              {
                ...options,
                customGroups: { top: ['id'] },
                groups: ['top', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
                },
              },
            ],
          },
          {
            code: dedent`
              <Hero
                name="King"
                id="5bcd11c7-bb04-4046-b986-a4e4796fa624"
              />
            `,
            output: dedent`
              <Hero
                id="5bcd11c7-bb04-4046-b986-a4e4796fa624"
                name="King"
              />
            `,
            options: [
              {
                ...options,
                customGroups: { top: ['id'] },
                groups: ['top', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
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
      ignoreCase: true,
      type: 'natural',
      order: 'asc',
    } as const

    ruleTester.run(`${RULE_NAME}(${type}): sorts jsx props`, rule, {
      valid: [
        {
          code: dedent`
            let Odokawa = () => (
              <Character
                role="taxi driver"
                type="walrus"
                variant="odd"
              >
                Pew-pew
              </Character>
            )
          `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            let Odokawa = () => (
              <Character
                type="walrus"
                role="taxi driver"
                variant="odd"
              >
                Pew-pew
              </Character>
            )
          `,
          output: dedent`
            let Odokawa = () => (
              <Character
                role="taxi driver"
                type="walrus"
                variant="odd"
              >
                Pew-pew
              </Character>
            )
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedJSXPropsOrder',
              data: {
                left: 'type',
                right: 'role',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts jsx props with namespaced names`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Protagonist = () => (
                <User
                  age={16}
                  name="Shinichi Izumi"
                  parasite:name="Migi"
                  school="West High"
                />
              )
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Protagonist = () => (
                <User
                  age={16}
                  parasite:name="Migi"
                  name="Shinichi Izumi"
                  school="West High"
                />
              )
            `,
            output: dedent`
              let Protagonist = () => (
                <User
                  age={16}
                  name="Shinichi Izumi"
                  parasite:name="Migi"
                  school="West High"
                />
              )
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'parasite:name',
                  right: 'name',
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
            code: dedent`
              let ArmorBoy = () => (
                <Alchemist
                  big
                  firstName="Alphonse"
                  lastName="Elric"
                  {...data}
                  age={14}
                  occupation="Alchemist"
                  weapon={['fists']}
                />
              )
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let ArmorBoy = () => (
                <Alchemist
                  firstName="Alphonse"
                  lastName="Elric"
                  big
                  {...data}
                  occupation="Alchemist"
                  age={14}
                  weapon={['fists']}
                />
              )
            `,
            output: dedent`
              let ArmorBoy = () => (
                <Alchemist
                  big
                  firstName="Alphonse"
                  lastName="Elric"
                  {...data}
                  age={14}
                  occupation="Alchemist"
                  weapon={['fists']}
                />
              )
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'lastName',
                  right: 'big',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'occupation',
                  right: 'age',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set shorthand props position`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Spike = () => (
                <Hunter
                  age={27}
                  bloodType={0}
                  origin="Mars"
                  isFromCowboyBebop
                />
              )
            `,
            options: [
              {
                ...options,
                groups: ['unknown', 'shorthand'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Spike = () => (
                <Hunter
                  age={27}
                  bloodType={0}
                  isFromCowboyBebop
                  origin="Mars"
                />
              )
            `,
            output: dedent`
              let Spike = () => (
                <Hunter
                  age={27}
                  bloodType={0}
                  origin="Mars"
                  isFromCowboyBebop
                />
              )
            `,
            options: [
              {
                ...options,
                groups: ['unknown', 'shorthand'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'isFromCowboyBebop',
                  right: 'origin',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set callback props position`,
      rule,
      {
        valid: [
          {
            code: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                shinigami="Ryuk"
                onChange={updateDeathNotes}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                onChange={updateDeathNotes}
                shinigami="Ryuk"
              />
            `,
            output: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                shinigami="Ryuk"
                onChange={updateDeathNotes}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'onChange',
                  right: 'shinigami',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set multiline props position`,
      rule,
      {
        valid: [
          {
            code: dedent`
              <Holo
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                form={form}
                residence="Pasloe"
                title="Wisewolf"
              />
            `,
            options: [
              {
                ...options,
                groups: [['multiline'], 'unknown'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <Holo
                form={form}
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                residence="Pasloe"
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                title="Wisewolf"
              />
            `,
            output: dedent`
              <Holo
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                form={form}
                residence="Pasloe"
                title="Wisewolf"
              />
            `,
            options: [
              {
                ...options,
                groups: ['multiline', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'form',
                  right: 'handleTransform',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'residence',
                  right: 'style',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set priority props`,
      rule,
      {
        valid: [
          {
            code: dedent`
              <Hero
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                name="Saitama"
                age={25}
                height={175}
                nickname="One-Punch Man"
                weight={70}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { top: ['id', 'name'] },
                groups: ['top', 'unknown'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <Hero
                age={25}
                nickname="One-Punch Man"
                name="Saitama"
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                height={175}
                weight={70}
              />
            `,
            output: dedent`
              <Hero
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                name="Saitama"
                age={25}
                height={175}
                nickname="One-Punch Man"
                weight={70}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { top: ['id', 'name'] },
                groups: ['top', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'nickname',
                  right: 'name',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
                },
              },
            ],
          },
          {
            code: dedent`
              <Hero
                name="Genos"
                id="dabd9d43-a165-419a-bfc8-061533bf40bd"
              />
            `,
            output: dedent`
              <Hero
                id="dabd9d43-a165-419a-bfc8-061533bf40bd"
                name="Genos"
              />
            `,
            options: [
              {
                ...options,
                customGroups: { top: ['id'] },
                groups: ['top', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
                },
              },
            ],
          },
          {
            code: dedent`
              <Hero
                name="King"
                id="5bcd11c7-bb04-4046-b986-a4e4796fa624"
              />
            `,
            output: dedent`
              <Hero
                id="5bcd11c7-bb04-4046-b986-a4e4796fa624"
                name="King"
              />
            `,
            options: [
              {
                ...options,
                customGroups: { top: ['id'] },
                groups: ['top', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
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

    ruleTester.run(`${RULE_NAME}(${type}): sorts jsx props`, rule, {
      valid: [
        {
          code: dedent`
              let Odokawa = () => (
                <Character
                  role="taxi driver"
                  type="walrus"
                  variant="odd"
                >
                  Pew-pew
                </Character>
              )
            `,
          options: [options],
        },
      ],
      invalid: [
        {
          code: dedent`
            let Odokawa = () => (
              <Character
                type="walrus"
                role="taxi driver"
                variant="odd"
              >
                Pew-pew
              </Character>
            )
          `,
          output: dedent`
            let Odokawa = () => (
              <Character
                role="taxi driver"
                type="walrus"
                variant="odd"
              >
                Pew-pew
              </Character>
            )
          `,
          options: [options],
          errors: [
            {
              messageId: 'unexpectedJSXPropsOrder',
              data: {
                left: 'type',
                right: 'role',
              },
            },
          ],
        },
      ],
    })

    ruleTester.run(
      `${RULE_NAME}(${type}): sorts jsx props with namespaced names`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Protagonist = () => (
                <User
                  name="Shinichi Izumi"
                  parasite:name="Migi"
                  school="West High"
                  age={16}
                />
              )
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Protagonist = () => (
                <User
                  age={16}
                  parasite:name="Migi"
                  name="Shinichi Izumi"
                  school="West High"
                />
              )
            `,
            output: dedent`
              let Protagonist = () => (
                <User
                  name="Shinichi Izumi"
                  parasite:name="Migi"
                  school="West High"
                  age={16}
                />
              )
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'age',
                  right: 'parasite:name',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'parasite:name',
                  right: 'name',
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
            code: dedent`
              let ArmorBoy = () => (
                <Alchemist
                  firstName="Alphonse"
                  lastName="Elric"
                  big
                  {...data}
                  occupation="Alchemist"
                  weapon={['fists']}
                  age={14}
                />
              )
            `,
            options: [options],
          },
        ],
        invalid: [
          {
            code: dedent`
              let ArmorBoy = () => (
                <Alchemist
                  firstName="Alphonse"
                  lastName="Elric"
                  big
                  {...data}
                  occupation="Alchemist"
                  age={14}
                  weapon={['fists']}
                />
              )
            `,
            output: dedent`
              let ArmorBoy = () => (
                <Alchemist
                  firstName="Alphonse"
                  lastName="Elric"
                  big
                  {...data}
                  occupation="Alchemist"
                  weapon={['fists']}
                  age={14}
                />
              )
            `,
            options: [options],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'age',
                  right: 'weapon',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set shorthand props position`,
      rule,
      {
        valid: [
          {
            code: dedent`
              let Spike = () => (
                <Hunter
                  bloodType={0}
                  origin="Mars"
                  age={27}
                  isFromCowboyBebop
                />
              )
            `,
            options: [
              {
                ...options,
                groups: ['unknown', 'shorthand'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Spike = () => (
                <Hunter
                  age={27}
                  bloodType={0}
                  isFromCowboyBebop
                  origin="Mars"
                />
              )
            `,
            output: dedent`
              let Spike = () => (
                <Hunter
                  bloodType={0}
                  origin="Mars"
                  age={27}
                  isFromCowboyBebop
                />
              )
            `,
            options: [
              {
                ...options,
                groups: ['unknown', 'shorthand'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'age',
                  right: 'bloodType',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'isFromCowboyBebop',
                  right: 'origin',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set callback props position`,
      rule,
      {
        valid: [
          {
            code: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                shinigami="Ryuk"
                onChange={updateDeathNotes}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                onChange={updateDeathNotes}
                shinigami="Ryuk"
              />
            `,
            output: dedent`
              <DeathNote
                author="Light Yagami"
                list={deathNotes}
                shinigami="Ryuk"
                onChange={updateDeathNotes}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { callback: 'on*' },
                groups: ['unknown', 'callback'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'onChange',
                  right: 'shinigami',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set multiline props position`,
      rule,
      {
        valid: [
          {
            code: dedent`
              <Holo
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                residence="Pasloe"
                title="Wisewolf"
                form={form}
              />
            `,
            options: [
              {
                ...options,
                groups: [['multiline'], 'unknown'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <Holo
                form={form}
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                residence="Pasloe"
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                title="Wisewolf"
              />
            `,
            output: dedent`
              <Holo
                handleTransform={(type: 'Human' | 'Wolf') => {
                  toogleForm(form)
                }}
                style={{
                  position: 'absolute',
                  color: 'red',
                }}
                residence="Pasloe"
                title="Wisewolf"
                form={form}
              />
            `,
            options: [
              {
                ...options,
                groups: ['multiline', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'form',
                  right: 'handleTransform',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'residence',
                  right: 'style',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}(${type}): allows to set priority props`,
      rule,
      {
        valid: [
          {
            code: dedent`
              <Hero
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                name="Saitama"
                nickname="One-Punch Man"
                height={175}
                weight={70}
                age={25}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { top: ['id', 'name'] },
                groups: ['top', 'unknown'],
              },
            ],
          },
        ],
        invalid: [
          {
            code: dedent`
              <Hero
                age={25}
                nickname="One-Punch Man"
                name="Saitama"
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                height={175}
                weight={70}
              />
            `,
            output: dedent`
              <Hero
                id="ed2cc26e-ec5a-41da-aab0-51a61d6a919f"
                name="Saitama"
                nickname="One-Punch Man"
                height={175}
                weight={70}
                age={25}
              />
            `,
            options: [
              {
                ...options,
                customGroups: { top: ['id', 'name'] },
                groups: ['top', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'age',
                  right: 'nickname',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'nickname',
                  right: 'name',
                },
              },
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
                },
              },
            ],
          },
          {
            code: dedent`
              <Hero
                name="Genos"
                id="dabd9d43-a165-419a-bfc8-061533bf40bd"
              />
            `,
            output: dedent`
              <Hero
                id="dabd9d43-a165-419a-bfc8-061533bf40bd"
                name="Genos"
              />
            `,
            options: [
              {
                ...options,
                customGroups: { top: ['id', 'name'] },
                groups: ['top', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
                },
              },
            ],
          },
          {
            code: dedent`
              <Hero
                name="King"
                id="5bcd11c7-bb04-4046-b986-a4e4796fa624"
              />
            `,
            output: dedent`
              <Hero
                id="5bcd11c7-bb04-4046-b986-a4e4796fa624"
                name="King"
              />
            `,
            options: [
              {
                ...options,
                customGroups: { top: ['id', 'name'] },
                groups: ['top', 'unknown'],
              },
            ],
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'name',
                  right: 'id',
                },
              },
            ],
          },
        ],
      },
    )
  })

  describe(`${RULE_NAME}: misc`, () => {
    ruleTester.run(
      `${RULE_NAME}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          dedent`
            let Mob = () => (
              <Character
                firstName="Shigeo"
                lastName="Kageyama"
                occupation={['student', 'club vice-president']}
              />
            )
          `,
          {
            code: dedent`
              const content = (
                <AppBar
                  link1="http://www.example.com"
                  link10="http://www.example.com"
                  link2="http://www.example.com"
                />
              )
            `,
            options: [{}],
          },
        ],
        invalid: [
          {
            code: dedent`
              let Mob = () => (
                <Character
                  occupation={['student', 'club vice-president']}
                  firstName="Shigeo"
                  lastName="Kageyama"
                />
              )
            `,
            output: dedent`
              let Mob = () => (
                <Character
                  firstName="Shigeo"
                  lastName="Kageyama"
                  occupation={['student', 'club vice-president']}
                />
              )
            `,
            errors: [
              {
                messageId: 'unexpectedJSXPropsOrder',
                data: {
                  left: 'occupation',
                  right: 'firstName',
                },
              },
            ],
          },
        ],
      },
    )

    ruleTester.run(
      `${RULE_NAME}: sets alphabetical asc sorting as default`,
      rule,
      {
        valid: [
          dedent`
            let Mob = () => (
              <Character
                firstName="Shigeo"
                lastName="Kageyama"
                occupation={['student', 'club vice-president']}
              />
            )
          `,
          {
            code: dedent`
              const content = (
                <AppBar
                  link1="http://www.example.com"
                  link10="http://www.example.com"
                  link2="http://www.example.com"
                />
              )
            `,
            options: [{}],
          },
        ],
        invalid: [],
      },
    )

    // prettier-ignore
    ;['.svelte', '.astro', '.vue'].forEach(extension => {
      ruleTester.run(`${RULE_NAME}: not works with ${extension} files`, rule, {
        valid: [
          {
            filename: 'component.vue',
            code: dedent`
                <Student
                  name="Mitsumi Iwakura"
                  age={15}
                  gender="female"
                  birthPlace="Ikajima, Ishikawa Prefecture"
                />
              `,
          },
        ],
        invalid: [],
      })
    })
  })
})
