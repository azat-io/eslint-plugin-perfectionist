---
title: sort-union-types
---

# sort-union-types

> Enforce sorted union types.

## 💡 Examples

### Natural sorting

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

### Sorting by line length

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

### `type`

- `enum` (default: `natural`):
  - `natural` - sorting, which is similar to alphabetical order.
  - `line-length` - sort by code line length.

### `order`

- `enum` (default: `asc`):
  - `asc` - enforce properties to be in ascending order.
  - `desc` - enforce properties to be in descending order.

## ⚙️ Usage

:::tip
If you use `@typescript-eslint/eslint-plugin`, you should disable the `sort-type-constituents` rule, as it may conflict with the current rule
:::

### Legacy config

```json
// .eslintrc
{
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

### Flat config

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
