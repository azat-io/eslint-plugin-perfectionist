import { RuleTester } from '@typescript-eslint/utils/dist/ts-eslint/index.js'
import { describe, it } from 'vitest'

import rule, { RULE_NAME } from '~/rules/sort-named-imports'

describe(RULE_NAME, () => {
  let ruleTester = new RuleTester({
    parser: require.resolve('@typescript-eslint/parser'),
  })

  it(`${RULE_NAME}: sorts named imports`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [
        `
          import { useEffect, useState, useRef } from 'react'
        `,
      ],
      invalid: [
        {
          code: `
            import { useEffect, useRef, useState } from 'react'
          `,
          output: `
            import { useEffect, useState, useRef } from 'react'
          `,
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                first: 'useRef',
                second: 'useState',
              },
            },
          ],
        },
      ],
    })
  })

  it(`${RULE_NAME}: sorts named multiline imports`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [
        `
          import {
            identity,
            andThen,
            compose,
            concat,
            ifElse,
            unless,
            isNil,
            head,
            when,
            has,
            __,
            F,
          } from 'ramda'
        `,
      ],
      invalid: [
        {
          code: `
            import {
              __,
              andThen,
              compose,
              concat,
              F,
              isNil,
              has,
              head,
              identity,
              ifElse,
              unless,
              when,
            } from 'ramda'
          `,
          output: `
            import {
              identity,
              andThen,
              compose,
              concat,
              ifElse,
              unless,
              isNil,
              head,
              when,
              has,
              __,
              F,
            } from 'ramda'
          `,
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                first: '__',
                second: 'andThen',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                first: 'F',
                second: 'isNil',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                first: 'has',
                second: 'head',
              },
            },
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                first: 'head',
                second: 'identity',
              },
            },
          ],
        },
      ],
    })
  })
})
