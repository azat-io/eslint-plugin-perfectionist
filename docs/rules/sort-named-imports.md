---
title: sort-named-imports
---

# sort-named-imports

> Enforce sorted named imports.

## Rule details

This rule verifies that all named imports are sorted sorted in order of string length.

### Incorrect

```ts
import {
  useEffect,
  useState,
  useMemo,
  useId,
  Suspense,
  useCallback,
  lazy,
} from 'react'
```

### Correct

```ts
import {
  useCallback,
  useEffect,
  Suspense,
  useState,
  useMemo,
  useId,
  lazy,
} from 'react'
```

## Options

This rule is not configurable.

## Usage

### Legacy config

```json
// .eslintrc
{
  "rules": {
    "perfectionist/sort-named-imports": "error"
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
    'perfectionist/sort-named-imports': 'error',
  },
}
```

## Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-named-imports.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-named-imports.test.ts)
