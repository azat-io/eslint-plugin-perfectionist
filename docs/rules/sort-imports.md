---
title: sort-imports
description: ESLint Plugin Perfectionist rule which enforce sorted imports
---

# sort-imports

💼 This rule is enabled in the following [configs](/configs/): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted imports.

Maintaining a consistent and sorted order of imports can improve code readability, organization, and reduce the likelihood of errors caused by import conflicts.

Sorting imports ensures that imports are easily locatable and quickly scannable, especially in modules with a large number of import statements. It provides a clear and predictable structure to the codebase, making it easier for developers to identify and manage imports.

:::info Important
If you use the [`sort-imports`](https://eslint.org/docs/latest/rules/sort-imports) rule or the [`order`](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md) rule from the [`eslint-plugin-import`](https://github.com/import-js/eslint-plugin-import) plugin, it is highly recommended to [disable them](https://eslint.org/docs/latest/use/configure/rules#using-configuration-files-1) to avoid conflicts.
:::

Rule `perfectionist/sort-imports` works in a similar way to rule `import/order`, but with some differences:

1. Supporting for new import types: `'side-effect'`, `'style'`, `'builtin-type'`, `'internal-type'`, `'parent-type'`, `'sibling-type'`, `'index-type'`
2. Supporting for adding custom import groups
3. Sorting not only alphabetically, but also naturally and by line length

## 💡 Examples

::: code-group

<!-- prettier-ignore -->
```js [Alphabetical and Natural Sorting]
// ❌ Incorrect
import express from 'express'
import type { Response, Request } from 'express'
import fromPairs from 'lodash/fromPairs'
import dotenv from 'dotenv'

import config from './config.js'
import map from 'lodash/map'
import defaultsDeep from 'lodash/defaultsDeep'
import fs from 'fs'

// ✅ Correct
import type { Response, Request } from 'express'

import dotenv from 'dotenv'
import express from 'express'
import fs from 'fs'
import defaultsDeep from 'lodash/defaultsDeep'
import fromPairs from 'lodash/fromPairs'
import map from 'lodash/map'

import config from './config.js'
```

```js [Sorting by Line Length]
// ❌ Incorrect
import express from 'express'
import type { Response, Request } from 'express'
import fromPairs from 'lodash/fromPairs'
import dotenv from 'dotenv'

import config from './config.js'
import map from 'lodash/map'
import defaultsDeep from 'lodash/defaultsDeep'
import fs from 'fs'

// ✅ Correct
import type { Response, Request } from 'express'

import defaultsDeep from 'lodash/defaultsDeep'
import fromPairs from 'lodash/fromPairs'
import express from 'express'
import map from 'lodash/map'
import dotenv from 'dotenv'
import fs from 'fs'

import config from './config.js'
```

:::

## 🔧 Options

This rule accepts an options object with the following properties:

```ts
type CustomGroup = string
type Group =
  | 'builtin'
  | 'external'
  | 'internal'
  | 'parent'
  | 'sibling'
  | 'side-effect'
  | 'index'
  | 'object'
  | 'style'
  | 'type'
  | 'builtin-type'
  | 'external-type'
  | 'internal-type'
  | 'parent-type'
  | 'sibling-type'
  | 'index-type'
  | 'unknown'
  | CustomGroup

interface Options {
  type?: 'alphabetical' | 'natural' | 'line-length'
  order?: 'asc' | 'desc'
  'ignore-case'?: boolean
  groups?: (Group | Group[])[]
  'custom-groups'?: {
    value?: {
      [key: CustomGroup]: string | string[]
    }
    type?: {
      [key: CustomGroup]: string | string[]
    }
  }
  'internal-pattern'?: string[]
  'newlines-between'?: 'always' | 'ignore' | 'never'
```

### type

<sub>(default: `'alphabetical'`)</sub>

- `alphabetical` - sort alphabetically.
- `natural` - sort in natural order.
- `line-length` - sort by code line length.

### order

<sub>(default: `'asc'`)</sub>

- `asc` - enforce properties to be in ascending order.
- `desc` - enforce properties to be in descending order.

### ignore-case

<sub>(default: `false`)</sub>

Only affects alphabetical and natural sorting. When `true` the rule ignores the case-sensitivity of the order.

### groups

<sub>(default: `[]`)</sub>

You can set up a list of import groups for sorting. Groups can be combined.

```ts
// 'builtin' - Node.js Built-in Modules
import path from 'path'
// 'external' - External modules installed in the project
import axios from 'axios'
// 'internal' - Your internal modules
import Button from '~/components/Button'
// 'parent' - Modules from parent directory
import formatNumber from '../utils/format-number'
// 'siblings' - Modules from the same directory
import config from './config'
// 'side-effect' - Side effect imports
import './set-production-env.js'
// 'index' - Main file from the current directory
import main from '.'
// 'object' - TypeScript object-imports
import log = console.log
// 'style' - Styles
import styles from './index.module.css'
// 'external-type' - TypeScript type imports
import type { FC } from 'react'
// 'builtin-type' - TypeScript type imports from Built-in Modules
import type { Server } from 'http'
// 'internal-type' - TypeScript type imports from your internal modules
import type { User } from '~/users'
// 'parent-type' - TypeScript type imports from parent directory
import type { InputProps } from '../Input'
// 'sibling-type' - TypeScript type imports from the same directory
import type { Details } from './data'
// 'index-type' - TypeScript type imports from main directory file
import type { BaseOptions } from './index.d.ts'
```

If you use [one of the configs](/configs/) exported by this plugin, you get the following import grouping settings:

```js
{
  groups: [
    'type',
    ['builtin', 'external'],
    'internal-type',
    'internal',
    ['parent-type', 'sibling-type', 'index-type'],
    ['parent', 'sibling', 'index'],
    'object',
    'unknown',
  ]
}
```

### custom-groups

<sub>(default: `{ value: {}, type: {} }`)</sub>

You can define your own groups for importing values or types. The [minimatch](https://github.com/isaacs/minimatch) library is used for pattern matching.

Example:

```
{
  "custom-groups": {
    "value": {
      "react": ["react", "react-*"],
      "lodash": "lodash"
    },
    "type": {
      "react": ["react", "react-*"]
    }
  }
}
```

### internal-pattern

<sub>(default: `['~/**']`)</sub>

You can specify a pattern for internal imports.

The [minimatch](https://github.com/isaacs/minimatch) library is used for pattern matching.

### newlines-between

<sub>(default: `'always'`)</sub>

- `ignore` - do not report errors related to new lines between import groups.
- `always` - one new line between each group will be enforced, and new lines inside a group will be forbidden.
- `never` - no new lines are allowed in the entire import section.

## ⚙️ Usage

::: code-group

```json [Legacy Config]
// .eslintrc
{
  "plugins": ["perfectionist"],
  "rules": {
    "perfectionist/sort-imports": [
      "error",
      {
        "type": "natural",
        "order": "asc",
        "groups": [
          "type",
          "react",
          "nanostores",
          ["builtin", "external"],
          "internal-type",
          "internal",
          ["parent-type", "sibling-type", "index-type"],
          ["parent", "sibling", "index"],
          "side-effect",
          "style",
          "object",
          "unknown"
        ],
        "custom-groups": {
          "value": {
            "react": ["react", "react-*"],
            "nanostores": "@nanostores/**"
          },
          "type": {
            "react": "react"
          }
        },
        "newlines-between": "always",
        "internal-pattern": [
          "@/components/**",
          "@/stores/**",
          "@/pages/**",
          "@/lib/**"
        ]
      }
    ]
  }
}
```

```js [Flat Config]
// eslint.config.js
import perfectionist from 'eslint-plugin-perfectionist'

export default [
  {
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          groups: [
            'type',
            'react',
            'nanostores',
            ['builtin', 'external'],
            'internal-type',
            'internal',
            ['parent-type', 'sibling-type', 'index-type'],
            ['parent', 'sibling', 'index'],
            'side-effect',
            'style',
            'object',
            'unknown',
          ],
          'custom-groups': {
            value: {
              react: ['react', 'react-*'],
              nanostores: '@nanostores/**',
            },
            type: {
              react: 'react'
            }
          },
          'newlines-between': 'always',
          'internal-pattern': [
            '@/components/**',
            '@/stores/**',
            '@/pages/**',
            '@/lib/**',
          ],
        },
      ],
    },
  },
]
```

:::

## 🚀 Version

This rule was introduced in v0.9.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-imports.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-imports.test.ts)
