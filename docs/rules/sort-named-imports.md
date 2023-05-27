---
title: sort-named-imports
---

# sort-named-imports

> Enforce sorted named imports.

## 💡 Examples

### Alphabetical and natural sorting

<!-- prettier-ignore -->
```ts
// Incorrect
export {
  killuaZoldyck,
  leorio,
  gon,
  hisoka,
  kurapika,
} from 'hunters'

// Correct
export {
  gon,
  hisoka,
  killuaZoldyck,
  kurapika,
  leorio,
} from 'hunters'
```

### Sorting by line length

<!-- prettier-ignore -->
```ts
// Incorrect
export {
  killuaZoldyck,
  leorio,
  gon,
  hisoka,
  kurapika,
} from 'hunters'

// Correct
export {
  killuaZoldyck,
  kurapika,
  hisoka,
  leorio,
  gon,
} from 'hunters'
```

## 🔧 Options

### `type`

- `enum` (default: `alphabetical`):
  - `alphabetical` - sort alphabetically.
  - `natural` - sort in natural order.
  - `line-length` - sort by code line length.

### `order`

- `enum` (default: `asc`):
  - `asc` - enforce properties to be in ascending order.
  - `desc` - enforce properties to be in descending order.

## ⚙️ Usage

### Legacy config

```json
// .eslintrc
{
  "rules": {
    "perfectionist/sort-named-imports": [
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
// eslint.config.js
import perfectionist from 'eslint-plugin-perfectionist'

export default [
  {
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-named-imports': [
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

This rule was introduced in v0.2.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-named-imports.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-named-imports.test.ts)
