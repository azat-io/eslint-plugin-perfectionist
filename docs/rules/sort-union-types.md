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

::: code-group

<!-- prettier-ignore -->
```ts [Alphabetical and Natural Sorting]
// ❌ Incorrect
type NetworkState =
  | 'Failed'
  | 'LoadedFromCache'
  | 'Success'
  | 'DataLoading'

// ✅ Correct
type NetworkState =
  | 'DataLoading'
  | 'Failed'
  | 'LoadedFromCache'
  | 'Success'
```

<!-- prettier-ignore -->
```ts [Sorting by Line Length]
// ❌ Incorrect
type NetworkState =
  | 'Failed'
  | 'LoadedFromCache'
  | 'Success'
  | 'DataLoading'

// ✅ Correct
type NetworkState =
  | 'LoadedFromCache'
  | 'DataLoading'
  | 'Success'
  | 'Failed'
```

:::

## 🔧 Options

This rule accepts an options object with the following properties:

```ts
interface Options {
  type?: 'alphabetical' | 'natural' | 'line-length'
  order?: 'asc' | 'desc'
  'ignore-case'?: boolean
  'nullable-last'?: boolean
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

### nullable-last

<sub>(default: `false`)</sub>

When `true` requires the types `null` and `undefined` to be last.

## ⚙️ Usage

::: code-group

```json [Legacy Config]
// .eslintrc
{
  "plugins": ["perfectionist"],
  "rules": {
    "perfectionist/sort-union-types": [
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
      'perfectionist/sort-union-types': [
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

This rule was introduced in v0.4.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-union-types.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-union-types.test.ts)
