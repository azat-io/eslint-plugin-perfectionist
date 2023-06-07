---
title: sort-array-includes
description: ESLint Plugin Perfectionist rule which enforce sorted array values if the `includes` method is immediately called after the array is created
---

# sort-array-includes

💼 This rule is enabled in the following [configs](/configs/): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted array values if the `includes` method is immediately called after the array is created.

This rule aims to promote code readability and maintainability by enforcing a consistent ordering of values in arrays.

## 💡 Examples

::: code-group

<!-- prettier-ignore -->
```js [Alphabetical and Natural Sorting]
// ❌ Incorrect
if ([
  'maintainer',
  'admin',
  'developer',
  'owner',
  'observer'
].includes(user.role)) {
  return response.json({ allowed: true })
}

// ✅ Correct
if ([
  'admin',
  'developer',
  'maintainer',
  'observer'
  'owner',
].includes(user.role)) {
  return response.json({ allowed: true })
}
```

```js [Sorting by Line Length]
// ❌ Incorrect
if ([
  'maintainer',
  'admin',
  'developer',
  'owner',
  'observer'
].includes(user.role)) {
  return response.json({ allowed: true })
}

// ✅ Correct
if ([
  'maintainer',
  'developer',
  'observer'
  'admin',
  'owner',
].includes(user.role)) {
  return response.json({ allowed: true })
}
```

:::

## 🔧 Options

This rule accepts an options object with the following properties:

```ts
interface Options {
  type?: 'alphabetical' | 'natural' | 'natural'
  order?: 'asc' | 'desc'
  'ignore-case'?: boolean
  'spread-last'?: boolean
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

### spread-last

<sub>(default: `false`)</sub>

When `true` enforce spread elements in array to be last.

## ⚙️ Usage

::: code-group

```json [Legacy Config]
// .eslintrc
{
  "plugins": ["perfectionist"],
  "rules": {
    "perfectionist/sort-array-includes": [
      "error",
      {
        "type": "line-length",
        "order": "desc",
        "spread-last": true
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
      'perfectionist/sort-array-includes': [
        'error',
        {
          type: 'line-length',
          order: 'desc',
          spread-last: true,
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

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-array-includes.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-array-includes.test.ts)
