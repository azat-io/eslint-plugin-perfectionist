---
title: sort-union-types
description: ESLint Plugin Perfectionist rule which enforce sorted union types in TypeScript
---

# sort-union-types

💼 This rule is enabled in the following [configs](/configs/): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted union types in TypeScript.

Adhering to the `sort-union-types` rule enables developers to ensure that union types are consistently sorted, resulting in cleaner and more maintainable code. This rule promotes a standardized ordering of union types, making it easier for developers to navigate and understand the structure of type unions within the codebase.

:::info Important
If you use the [`sort-type-constituents`](https://typescript-eslint.io/rules/sort-type-constituents) rule from the [`@typescript-eslint/eslint-plugin`](https://typescript-eslint.io) plugin, it is highly recommended to [disable it](https://eslint.org/docs/latest/use/configure/rules#using-configuration-files-1) to avoid conflicts.
:::

## 💡 Examples

### Alphabetical and Natural Sorting

<!-- prettier-ignore -->
```ts
// Incorrect
type DevilHunter =
  | 'Denji'
  | 'Power'
  | 'Makima'
  | 'Aki Hayakawa'
  | 'Pochita'

// Correct
type DevilHunter =
  | 'Aki Hayakawa'
  | 'Denji'
  | 'Makima'
  | 'Pochita'
  | 'Power'
```

### Sorting by Line Length

<!-- prettier-ignore -->
```ts
// Incorrect
type DevilHunter =
  | 'Denji'
  | 'Power'
  | 'Makima'
  | 'Aki Hayakawa'
  | 'Pochita'

// Correct
type DevilHunter =
  | 'Aki Hayakawa'
  | 'Pochita'
  | 'Makima'
  | 'Denji'
  | 'Power'
```

## 🔧 Options

This rule accepts an options object with the following properties:

```ts
interface Options {
  type?: 'alphabetical' | 'natural' | 'natural'
  order?: 'asc' | 'desc'
  'ignore-case'?: boolean
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

## ⚙️ Usage

### Legacy Config

```json
// .eslintrc
{
  "plugins": ["perfectionist"],
  "rules": {
    "perfectionist/sort-union-types": [
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
import perfectionist from 'eslint-plugin-perfectionist'

export default [
  {
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-union-types': [
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

This rule was introduced in v0.4.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-union-types.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-union-types.test.ts)
