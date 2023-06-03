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

### Alphabetical and Natural Sorting

<!-- prettier-ignore -->
```ts
// Incorrect
let family = {
  dad: 'Loid Forger',
  mom: 'Yor Forger',
  daughter: 'Anya Forger',
}

// Correct
let family = {
  dad: 'Loid Forger',
  daughter: 'Anya Forger',
  mom: 'Yor Forger',
}
```

### Sorting by Line Length

<!-- prettier-ignore -->
```ts
// Incorrect
let family = {
  dad: 'Loid Forger',
  mom: 'Yor Forger',
  daughter: 'Anya Forger',
}

// Correct
let family = {
  daughter: 'Anya Forger',
  dad: 'Loid Forger',
  mom: 'Yor Forger',
}
```

## 🔧 Options

This rule accepts an options object with the following properties:

```ts
interface Options {
  type?: 'alphabetical' | 'natural' | 'natural'
  order?: 'asc' | 'desc'
  'ignore-case'?: boolean
  'always-on-top'?: string[]
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

### always-on-top

<sub>(default: `[]`)</sub>

You can set a list of key names that will always go at the beginning of the object. For example: `['id', 'name']`

## ⚙️ Usage

### Legacy Config

```json
// .eslintrc
{
  "rules": {
    "perfectionist/sort-objects": [
      "error",
      {
        "type": "line-length",
        "order": "desc"
      }
    ]
  }
}
```

### Flat Config

```js
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
          type: 'line-length',
          order: 'desc',
        },
      ],
    },
  },
]
```

## 🚀 Version

This rule was introduced in v0.6.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-objects.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-objects.test.ts)
