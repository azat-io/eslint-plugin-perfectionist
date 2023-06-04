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

## 💡 Examples

### Alphabetical and Natural Sorting

<!-- prettier-ignore -->
```ts
// Incorrect
type User = {
  name: string
  email: string
  role: Role
  isAdmin: boolean
}

// Correct
type User = {
  email: string
  isAdmin: boolean
  name: string
  role: Role
}
```

### Sorting by Line Length

<!-- prettier-ignore -->
```ts
// Incorrect
type User = {
  name: string
  email: string
  role: Role
  isAdmin: boolean
}

// Correct
type User = {
  isAdmin: boolean
  email: string
  name: string
  role: Role
}
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
  "rules": {
    "perfectionist/sort-object-types": [
      "error",
      {
        "type": "line-length",
        "order": "desc",
        "always-on-top": ["id"]
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
      'perfectionist/sort-object-types': [
        'error',
        {
          type: 'line-length',
          order: 'desc',
          'always-on-top': ['id'],
        },
      ],
    },
  },
]
```

## 🚀 Version

Coming soon.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-object-types.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-object-types.test.ts)
