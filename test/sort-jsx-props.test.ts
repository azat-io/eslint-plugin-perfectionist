import { RuleTester } from '@typescript-eslint/utils/dist/ts-eslint/index.js'
import { describe, it } from 'vitest'

import rule, { RULE_NAME } from '~/rules/sort-jsx-props'
import { SortType, SortOrder } from '~/typings'

describe(RULE_NAME, () => {
  let ruleTester = new RuleTester({
    parser: require.resolve('@typescript-eslint/parser'),
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  })

  it(`${RULE_NAME}: sorts jsx props`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [
        {
          code: `
            let Container = () => (
              <Button
                variant="solid"
                type="button"
                color="main"
              >
                Press me
              </Button>
            )
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
          code: `
            let Container = () => (
              <Button
                type="button"
                variant="solid"
                color="main"
              >
                Press me
              </Button>
            )
          `,
          options: [
            {
              type: SortType['line-length'],
              order: SortOrder.desc,
            },
          ],
          output: `
            let Container = () => (
              <Button
                variant="solid"
                type="button"
                color="main"
              >
                Press me
              </Button>
            )
          `,
          errors: [
            {
              messageId: 'unexpectedJSXPropsOrder',
              data: {
                first: 'type',
                second: 'variant',
              },
            },
          ],
        },
      ],
    })
  })

  it(`${RULE_NAME}: sorts jsx props with namespaced names`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [
        `
          let Container = () => (
            <Element
              foo:bar="namespace"
              name="element"
            />
          )
        `,
      ],
      invalid: [
        {
          code: `
            let Container = () => (
              <Element
                name="element"
                foo:bar="namespace"
              />
            )
          `,
          output: `
            let Container = () => (
              <Element
                foo:bar="namespace"
                name="element"
              />
            )
          `,
          errors: [
            {
              messageId: 'unexpectedJSXPropsOrder',
              data: {
                first: 'name',
                second: 'foo:bar',
              },
            },
          ],
        },
      ],
    })
  })

  it(`${RULE_NAME}: does not break the property list`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [
        {
          code: `
            let Container = () => (
              <Input
                placeholder="Password"
                value={password}
                full
                {...props}
                className="input"
                type="password"
                name="element"
                error={false}
                autoFocus
              />
            )
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
          code: `
            let Container = () => (
              <Input
                placeholder="Password"
                full
                value={password}
                {...props}
                error={false}
                name="element"
                type="password"
                autoFocus
                className="input"
              />
            )
          `,
          options: [
            {
              type: SortType['line-length'],
              order: SortOrder.desc,
            },
          ],
          output: `
            let Container = () => (
              <Input
                placeholder="Password"
                value={password}
                full
                {...props}
                className="input"
                type="password"
                name="element"
                error={false}
                autoFocus
              />
            )
          `,
          errors: [
            {
              messageId: 'unexpectedJSXPropsOrder',
              data: {
                first: 'full',
                second: 'value',
              },
            },
            {
              messageId: 'unexpectedJSXPropsOrder',
              data: {
                first: 'error',
                second: 'name',
              },
            },
            {
              messageId: 'unexpectedJSXPropsOrder',
              data: {
                first: 'name',
                second: 'type',
              },
            },
            {
              messageId: 'unexpectedJSXPropsOrder',
              data: {
                first: 'autoFocus',
                second: 'className',
              },
            },
          ],
        },
      ],
    })
  })
})
