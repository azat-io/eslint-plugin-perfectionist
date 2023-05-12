---
title: sort-union-types
---

# sort-union-types

> Enforce sorted union types.

## 📖 Rule details

This rule verifies that all named imports are sorted sorted in order of string length.

### Incorrect

<!-- prettier-ignore -->
```ts
type Color =
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'rebeccapurple'
```

### Correct

<!-- prettier-ignore -->
```ts
type Color =
  | 'rebeccapurple'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'red'
```

## 🔧 Options

### `type`

- `natural` (default) - sorting, which is similar to alphabetical order.
- `line-length` - sort by code line length.

### `order`

- `asc` (default) - enforce properties to be in ascending order.
- `desc` - enforce properties to be in descending order.

## 🚀 Usage

### Legacy config

```json
// .eslintrc
{
  "rules": {
    "perfectionist/sort-union-types": ["error", { "type": "line-length", "order": "desc" }]
  }
}
```

### Flat config

```js
// eslint.config.js
import perfectionist from 'eslint-plugin-perfectionist'

export default {
  plugins: {
    perfectionist,
  },
  rules: {
    'perfectionist/sort-union-types': ['error', { type: 'line-length', order: 'desc' }],
  },
}
```

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-union-types.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-union-types.test.ts)
