---
title: sort-objects
description: ESLint Plugin Perfectionist rule which enforce sorted objects
---

# sort-objects

💼 This rule is enabled in the following [configs](/configs/): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted objects.

By adhering to the rule, developers can ensure that object keys are consistently sorted, leading to cleaner and more maintainable code. It promotes a standardized key ordering across objects, making it easier for developers to navigate and understand the structure of objects within the codebase.

It's **safe**. The rule considers spread elements in objects and does not break component functionality.

:::info Important
If you use the [`sort-keys`](https://eslint.org/docs/latest/rules/sort-keys) rule, it is highly recommended to [disable it](https://eslint.org/docs/latest/use/configure/rules#using-configuration-files-1) to avoid conflicts.
:::

## 💡 Examples

::: code-group

<!-- prettier-ignore -->
```js [Alphabetical and Natural Sorting]
// ❌ Incorrect
let product = {
  name: 'iPhone 14 Pro',
  software: 'iOS',
  weight: '7.27 oz.; 206g',
  pixelDensity: 458,
  price: 1199,
  storage: '512GB',
}

// ✅ Correct
let product = {
  name: 'iPhone 14 Pro',
  pixelDensity: 458,
  price: 1199,
  software: 'iOS',
  storage: '512GB',
  weight: '7.27 oz.; 206g',
}
```

```js [Sorting by Line Length]
// ❌ Incorrect
let product = {
  name: 'iPhone 14 Pro',
  software: 'iOS',
  weight: '7.27 oz.; 206g',
  pixelDensity: 458,
  price: 1199,
  storage: '512GB',
}

// ✅ Correct
let product = {
  weight: '7.27 oz.; 206g',
  name: 'iPhone 14 Pro',
  pixelDensity: 458,
  storage: '512GB',
  software: 'iOS',
  price: 1199,
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
  'custom-groups'?: { [key: string]: string[] | string }
  'styled-components'?: boolean
  'partition-by-comment'?: string[] | string | boolean
  'partition-by-new-line'?: boolean
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

You can set up a list of object keys groups for sorting. Groups can be combined. There are no predefined groups.

### custom-groups

<sub>(default: `{}`)</sub>

You can define your own groups for object keys. The [minimatch](https://github.com/isaacs/minimatch) library is used for pattern matching.

Example:

```
{
  "custom-groups": {
    "top": "id"
  }
}
```

### styled-components

<sub>(default: `true`)</sub>

When `false`, this rule will be disabled for the styled-components like libraries.

### partition-by-comment

<sub>(default: `false`)</sub>

You can set comments that would separate the properties of objects into logical parts. If set to `true`, all object property comments will be treated as delimiters.

The [minimatch](https://github.com/isaacs/minimatch) library is used for pattern matching.

### partition-by-new-line

<sub>(default: `false`)</sub>

When `true`, does not sort the object's keys if there is an empty string between them.

## ⚙️ Usage

::: code-group

```json [Legacy Config]
// .eslintrc
{
  "plugins": ["perfectionist"],
  "rules": {
    "perfectionist/sort-objects": [
      "error",
      {
        "type": "natural",
        "order": "asc",
        "partition-by-comment": "Part:**",
        "groups": ["id", "unknown"],
        "custom-groups": {
          "id": "id"
        }
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
      'perfectionist/sort-objects': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          'partition-by-comment': 'Part:**',
          groups: ['id', 'unknown'],
          'custom-groups': {
            id: 'id',
          },
        },
      ],
    },
  },
]
```

:::

## 🚀 Version

This rule was introduced in v0.6.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-objects.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-objects.test.ts)
