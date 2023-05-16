---
title: sort-named-exports
---

# sort-named-exports

> Enforce sorted named exports.

## 📖 Rule details

This rule verifies that all named exports are sorted sorted in order of string length.

### Incorrect

<!-- prettier-ignore -->
```ts
export {
  get,
  post,
  put,
  patch
}
```

### Correct

<!-- prettier-ignore -->
```ts
export {
  patch
  post,
  put,
  get,
}
```

## 🔧 Options

### `type`

- `natural` (default) - sorting, which is similar to alphabetical order.
- `line-length` - sort by code line length.

### `order`

- `asc` (default) - enforce properties to be in ascending order.
- `desc` - enforce properties to be in descending order.

## ⚙️ Usage

### Legacy config

```json
// .eslintrc
{
  "rules": {
    "perfectionist/sort-named-exports": ["error", { "type": "line-length", "order": "desc" }]
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
    'perfectionist/sort-named-exports': ['error', { type: 'line-length', order: 'desc' }],
  },
}
```

## 🚀 Version

This rule was introduced in v0.4.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-named-exports.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-named-exports.test.ts)
