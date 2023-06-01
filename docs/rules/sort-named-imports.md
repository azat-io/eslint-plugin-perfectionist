---
title: sort-named-imports
---

# sort-named-imports

💼 This rule is enabled in the following [configs](https://eslint-plugin-perfectionist.azat.io/configs): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted named imports.

It promotes a standardized ordering of named imports, making it easier for developers to navigate and understand the import statements within the codebase.

:::info Important
If you use the [`sort-imports`](https://eslint.org/docs/latest/rules/sort-imports) rule, it is highly recommended to [disable it](https://eslint.org/docs/latest/use/configure/rules#using-configuration-files-1) to avoid conflicts.
:::

## 💡 Examples

### Alphabetical and Natural Sorting

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

### Sorting by Line Length

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

### Legacy Config

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
