---
title: sort-named-exports
---

# sort-named-exports

> Enforce sorted named exports.

## 💡 Examples

### Alphabetical and natural sorting

<!-- prettier-ignore -->
```ts
// Incorrect
export {
  Emma,
  Ray,
  Norman,
  Don,
  Gilda,
} from 'grace-field'

// Correct
export {
  Don,
  Emma,
  Gilda,
  Norman,
  Ray,
} from 'grace-field'
```

### Sorting by line length

<!-- prettier-ignore -->
```ts
// Incorrect
export {
  Emma,
  Ray,
  Norman,
  Don,
  Gilda,
} from 'grace-field'

// Correct
export {
  Norman,
  Gilda,
  Emma,
  Don,
  Ray,
} from 'grace-field'
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

### Legacy config

```json
// .eslintrc
{
  "rules": {
    "perfectionist/sort-named-exports": [
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
      'perfectionist/sort-named-exports': [
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

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-named-exports.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-named-exports.test.ts)
