---
title: sort-named-imports
---

# sort-named-imports

> Enforce sorted named imports.

## 📖 Rule details

This rule verifies that all named imports are sorted sorted in order of string length.

### Incorrect

<!-- prettier-ignore -->
```ts
import {
  useEffect,
  lazy
  useState,
  useMemo,
  useCallback,
  useId,
  Suspense,
} from 'react'
```

### Correct

<!-- prettier-ignore -->
```ts
import {
  useCallback,
  useEffect,
  Suspense,
  useState,
  useMemo,
  useId,
  lazy
} from 'react'
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
    "perfectionist/sort-named-imports": ["error", { "type": "line-length", "order": "desc" }]
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
    'perfectionist/sort-named-imports': ['error', { type: 'line-length', order: 'desc' }],
  },
}
```

## 🚀 Version

This rule was introduced in v0.2.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-named-imports.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-named-imports.test.ts)
