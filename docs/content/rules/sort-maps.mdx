---
title: sort-maps
description: Enforce sorted elements within JavaScript Map objects for a clear and predictable code structure. Use this ESLint rule to keep your Map elements organized
shortDescription: Enforce sorted Map elements
keywords:
  - eslint
  - sort maps
  - eslint rule
  - coding standards
  - code quality
  - javascript linting
  - map elements sorting
  - javascript map objects
---

import CodeExample from '../../components/CodeExample.svelte'
import CodeTabs from '../../components/CodeTabs.svelte'
import { dedent } from 'ts-dedent'

Enforce sorted elements within JavaScript Map object.

Sorting elements within JavaScript Map objects provides a clear and predictable structure to the codebase. This rule detects instances where Map elements are not sorted and raises linting errors, encouraging developers to arrange elements in the desired order.

By maintaining a consistent structure across Map objects, this rule improves readability and makes it easier to locate and understand key-value pairs.

## Try it out

<CodeExample
  alphabetical={dedent`
    const products = new Map([
      ['keyboard', { name: 'Keyboard', price: 50 }],
      ['laptop', { name: 'Laptop', price: 1000 }],
      ['monitor', { name: 'Monitor', price: 200 }],
      ['mouse', { name: 'Mouse', price: 25 }],
    ])

    const categories = new Map([
      ['accessories', { name: 'Accessories' }],
      ['clothing', { name: 'Clothing' }],
      ['electronics', { name: 'Electronics' }],
      ['furniture', { name: 'Furniture' }],
    ])
  `}
  lineLength={dedent`
    const products = new Map([
      ['keyboard', { name: 'Keyboard', price: 50 }],
      ['monitor', { name: 'Monitor', price: 200 }],
      ['laptop', { name: 'Laptop', price: 1000 }],
      ['mouse', { name: 'Mouse', price: 25 }],
    ])

    const categories = new Map([
      ['accessories', { name: 'Accessories' }],
      ['electronics', { name: 'Electronics' }],
      ['furniture', { name: 'Furniture' }],
      ['clothing', { name: 'Clothing' }],
    ])
  `}
  initial={dedent`
    const products = new Map([
      ['monitor', { name: 'Monitor', price: 200 }],
      ['laptop', { name: 'Laptop', price: 1000 }],
      ['mouse', { name: 'Mouse', price: 25 }],
      ['keyboard', { name: 'Keyboard', price: 50 }],
    ])

    const categories = new Map([
      ['electronics', { name: 'Electronics' }],
      ['furniture', { name: 'Furniture' }],
      ['clothing', { name: 'Clothing' }],
      ['accessories', { name: 'Accessories' }],
    ])
  `}
  client:load
  lang="ts"
/>

## Options

This rule accepts an options object with the following properties:

### type

<sub>default: `'alphabetical'`</sub>

Specifies the sorting method.

- `'alphabetical'` — Sort items alphabetically (e.g., “a” < “b” < “c”).
- `'natural'` — Sort items in a natural order (e.g., “item2” < “item10”).
- `'line-length'` — Sort items by the length of the code line (shorter lines first).

### order

<sub>default: `'asc'`</sub>

Determines whether the sorted items should be in ascending or descending order.

- `'asc'` — Sort items in ascending order (A to Z, 1 to 9).
- `'desc'` — Sort items in descending order (Z to A, 9 to 1).

### ignoreCase

<sub>default: `true`</sub>

Controls whether sorting should be case-sensitive or not.

- `true` — Ignore case when sorting alphabetically or naturally (e.g., “A” and “a” are the same).
- `false` — Consider case when sorting (e.g., “A” comes before “a”).

## Usage

<CodeTabs
  code={[
    {
      source: dedent`
        // eslint.config.js
        import perfectionist from 'eslint-plugin-perfectionist'

        export default [
          {
            plugins: {
              perfectionist,
            },
            rules: {
              'perfectionist/sort-maps': [
                'error',
                {
                  type: 'alphabetical',
                  order: 'asc',
                  ignoreCase: true,
                },
              ],
            },
          },
        ]
      `,
      name: 'Flat Config',
      value: 'flat',
    },
    {
      source: dedent`
        // .eslintrc.js
        module.exports = {
          plugins: [
            'perfectionist',
          ],
          rules: {
            'perfectionist/sort-maps': [
              'error',
              {
                type: 'alphabetical',
                order: 'asc',
                ignoreCase: true,
              },
            ],
          },
        }
      `,
      name: 'Legacy Config',
      value: 'legacy',
    },
  ]}
  type="config-type"
  client:load
  lang="ts"
/>

## Version

This rule was introduced in [v0.5.0](https://github.com/azat-io/eslint-plugin-perfectionist/releases/tag/v0.5.0).

## Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-maps.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-maps.test.ts)
