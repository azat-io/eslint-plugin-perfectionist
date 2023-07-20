---
title: sort-maps
description: ESLint Plugin Perfectionist rule which enforce sorted element within JavaScript Map object
---

# sort-maps

💼 This rule is enabled in the following [configs](/configs/): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted elements within JavaScript `Map` object.

Sorting Map elements provides a clear and predictable structure to the codebase, making it easier for developers to locate and understand the key-value pairs defined within a Map.

This rule detects instances where Map elements are not sorted in a specified order and raises a linting error. It encourages developers to rearrange the elements in the desired order, ensuring a consistent structure across Map objects.

## 💡 Examples

::: code-group

<!-- prettier-ignore -->
```js [Alphabetical and Natural Sorting]
// ❌ Incorrect
let burritoRecipeMap = new Map([
  ['tomatoes', 300],
  ['bell pepper', 100],
  ['corn', 150],
  ['cheese', 200],
  ['chicken fillet', 300],
  ['beans', 150],
])

// ✅ Correct
let burritoRecipeMap = new Map([
  ['beans', 150],
  ['bell pepper', 100],
  ['cheese', 200],
  ['chicken fillet', 300],
  ['corn', 150],
  ['tomatoes', 300],
])
```

```js [Sorting by Line Length]
// ❌ Incorrect
let burritoRecipeMap = new Map([
  ['tomatoes', 300],
  ['bell pepper', 100],
  ['corn', 150],
  ['cheese', 200],
  ['chicken fillet', 300],
  ['beans', 150],
])

// ✅ Correct
let burritoRecipeMap = new Map([
  ['chicken fillet', 300],
  ['bell pepper', 100],
  ['tomatoes', 300],
  ['cheese', 200],
  ['beans', 150],
  ['corn', 150],
])
```

:::

## 🔧 Options

This rule accepts an options object with the following properties:

```ts
interface Options {
  type?: 'alphabetical' | 'natural' | 'line-length'
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

::: code-group

```json [Legacy Config]
// .eslintrc
{
  "plugins": ["perfectionist"],
  "rules": {
    "perfectionist/sort-maps": [
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
      'perfectionist/sort-maps': [
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

This rule was introduced in v0.5.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-maps.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-maps.test.ts)
