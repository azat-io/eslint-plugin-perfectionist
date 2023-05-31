import { ESLintUtils } from '@typescript-eslint/utils'
import { describe, it } from 'vitest'
import { dedent } from 'ts-dedent'

import rule, { RULE_NAME } from '../rules/sort-named-imports'
import { SortType, SortOrder } from '../typings'

describe(RULE_NAME, () => {
  let ruleTester = new ESLintUtils.RuleTester({
    parser: '@typescript-eslint/parser',
  })

  it(`${RULE_NAME}: sets natural asc sorting as default`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: ["import { get, post, put } from 'axios'"],
      invalid: [
        {
          code: dedent`
            import { get, post, put, patch } from 'axios'
          `,
          output: dedent`
            import { get, patch, post, put } from 'axios'
          `,
          errors: [
            {
              messageId: 'unexpectedNamedImportsOrder',
              data: {
                first: 'put',
                second: 'patch',
              },
            },
          ],
        },
      ],
    })
  })

  it(`${RULE_NAME}: sorts named imports`, () => {
    ruleTester.run(RULE_NAME, rule, {
      valid: [
        {
          code: dedent`
            import { useEffect, useState, useRef } from 'react'
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
            import { useEffect, useRef, useState } from 'react'
          `,
          output: dedent`
            import { useEffect, useState, useRef } from 'react'
          `,
          options: [
            {
              type: SortType['line-length'],
              order: SortOrder.desc,
            },
          ],
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
        {
          code: dedent`
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
          output: dedent`
            import {
              identity,
              compose,
              andThen,
              unless,
              ifElse,
              concat,
              isNil,
              when,
              head,
              has,
              __,
              F,
            } from 'ramda'
          `,
          options: [
            {
              type: SortType['line-length'],
              order: SortOrder.desc,
            },
          ],
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
