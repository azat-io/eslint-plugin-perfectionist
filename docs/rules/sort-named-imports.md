---
title: sort-named-imports
description: ESLint Plugin Perfectionist rule which enforce sorted named imports
---

# sort-named-imports

💼 This rule is enabled in the following [configs](/configs/): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted named imports.

It promotes a standardized ordering of named imports, making it easier for developers to navigate and understand the import statements within the codebase.

:::info Important
If you use the [`sort-imports`](https://eslint.org/docs/latest/rules/sort-imports) rule, it is highly recommended to [disable it](https://eslint.org/docs/latest/use/configure/rules#using-configuration-files-1) to avoid conflicts.
:::

## 💡 Examples

::: code-group

<!-- prettier-ignore -->
```js [Alphabetical and Natural Sorting]
// ❌ Incorrect
import {
  useLayoutEffect,
  useRef,
  useEffect,
  useId,
  useState,
  createContext,
  useReducer,
} from 'react'

// ✅ Correct
import {
  createContext,
  useEffect,
  useId,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
```

<!-- prettier-ignore -->
```js [Sorting by Line Length]
// ❌ Incorrect
import {
  useLayoutEffect,
  useRef,
  useEffect,
  useId,
  useState,
  createContext,
  useReducer,
} from 'react'

// ✅ Correct
import {
  useLayoutEffect,
  createContext,
  useReducer,
  useEffect,
  useState,
  useRef,
  useId,
} from 'react'
```

:::

## 🔧 Options

This rule accepts an options object with the following properties:

```ts
interface Options {
  type?: 'alphabetical' | 'natural' | 'line-length'
  order?: 'asc' | 'desc'
  'ignore-case'?: boolean
  'ignore-alias'?: boolean
}
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

### ignore-alias

<sub>(default: `true`)</sub>

Use import alias as name instead of exported name.

## ⚙️ Usage

::: code-group

```json [Legacy Config]
// .eslintrc
{
  "plugins": ["perfectionist"],
  "rules": {
    "perfectionist/sort-named-imports": [
      "error",
      {
        "type": "natural",
        "order": "asc"
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
      'perfectionist/sort-named-imports': [
        'error',
        {
          type: 'natural',
          order: 'asc',
        },
      ],
    },
  },
]
```

:::

## 🚀 Version

This rule was introduced in v0.2.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-named-imports.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-named-imports.test.ts)
