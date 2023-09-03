---
title: sort-object-types
description: ESLint Plugin Perfectionist rule which enforce sorted object types in TypeScript
---

# sort-object-types

💼 This rule is enabled in the following [configs](/configs/): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted object types.

This rule standardizes the order of members of an object type in a TypeScript. The order in which the members are defined within an object type does not affect the type system or the behavior of the code.

:::info Important
If you use the [`adjacent-overload-signatures`](https://typescript-eslint.io/rules/adjacent-overload-signatures) rule from the [`@typescript-eslint/eslint-plugin`](https://typescript-eslint.io) plugin, it is highly recommended to [disable it](https://eslint.org/docs/latest/use/configure/rules#using-configuration-files-1) to avoid conflicts.
:::

## 💡 Examples

::: code-group

<!-- prettier-ignore -->
```ts [Alphabetical and Natural Sorting]
// ❌ Incorrect
type User = {
  isBlocked: boolean
  createdAt: Date
  role: 'admin' | 'lead' | 'user'
  username: string
  email: string
}

// ✅ Correct
type User = {
  createdAt: Date
  email: string
  isBlocked: boolean
  role: 'admin' | 'lead' | 'user'
  username: string
}
```

```ts [Sorting by Line Length]
// ❌ Incorrect
type User = {
  isBlocked: boolean
  createdAt: Date
  role: 'admin' | 'lead' | 'user'
  username: string
  email: string
}

// ✅ Correct
type User = {
  role: 'admin' | 'lead' | 'user'
  isBlocked: boolean
  username: string
  createdAt: Date
  email: string
}
```

:::

## 🔧 Options

This rule accepts an options object with the following properties:

```ts
interface Options {
  type?: 'alphabetical' | 'natural' | 'line-length'
  order?: 'asc' | 'desc'
  'ignore-case'?: boolean
  groups?: (string | string[])[]
  'custom-groups': { [key: string]: string[] | string }
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

### groups

<sub>(default: `[]`)</sub>

You can set up a list of type properties groups for sorting. Groups can be combined. There are predefined group: `'multiline'`.

### custom-groups

<sub>(default: `{}`)</sub>

You can define your own groups for type properties attributes. The [minimatch](https://github.com/isaacs/minimatch) library is used for pattern matching.

Example:

```
{
  "custom-groups": {
    "callback": "on*"
  }
}
```

## ⚙️ Usage

::: code-group

```json [Legacy Config]
// .eslintrc
{
  "plugins": ["perfectionist"],
  "rules": {
    "perfectionist/sort-object-types": [
      "error",
      {
        "type": "natural",
        "order": "asc",
        "always-on-top": ["id"]
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
      'perfectionist/sort-object-types': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          'always-on-top': ['id'],
        },
      ],
    },
  },
]
```

:::

## 🚀 Version

This rule was introduced in v0.11.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-object-types.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-object-types.test.ts)
