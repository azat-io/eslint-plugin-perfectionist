---
title: sort-enums
description: ESLint Plugin Perfectionist rule which enforce sorted TypeScript enum members
---

# sort-enums

💼 This rule is enabled in the following [configs](/configs/): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted TypeScript `enum` members.

Enums provide a way to define a set of named constants, and it is good practice to maintain a consistent and predictable order for readability and maintainability purposes.

When enum members are sorted, it sometimes becomes easier to reason about their values and identify any missing or duplicate entries.

## 💡 Examples

::: code-group

<!-- prettier-ignore -->
```ts [Alphabetical and Natural Sorting]
// ❌ Incorrect
enum StatusCodes {
  NotFound = 404
  Ok = 200
  MethodNotAllowed = 405
  BadRequest = 400
}

// ✅ Correct
enum StatusCodes {
  BadRequest = 400
  MethodNotAllowed = 405
  NotFound = 404
  Ok = 200
}
```

```ts [Sorting by Line Length]
// ❌ Incorrect
enum StatusCodes {
  NotFound = 404
  Ok = 200
  MethodNotAllowed = 405
  BadRequest = 400
}

// ✅ Correct
enum StatusCodes {
  MethodNotAllowed = 405
  BadRequest = 400
  NotFound = 404
  Ok = 200
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
  'partition-by-comment'?: string[] | string | boolean
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

### partition-by-comment

<sub>(default: `false`)</sub>

You can set comments that would separate the members of enums into logical parts. If set to `true`, all enum member comments will be treated as delimiters.

The [minimatch](https://github.com/isaacs/minimatch) library is used for pattern matching.

## ⚙️ Usage

::: code-group

```json [Legacy Config]
// .eslintrc
{
  "plugins": ["perfectionist"],
  "rules": {
    "perfectionist/sort-enums": [
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
      'perfectionist/sort-enums': [
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

This rule was introduced in v0.8.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-enums.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-enums.test.ts)
