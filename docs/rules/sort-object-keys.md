---
title: sort-object-keys
---

# sort-object-keys

💼 This rule is enabled in the following [configs](https://eslint-plugin-perfectionist.azat.io/configs): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Enforce sorted object keys.

## 💡 Examples

### Alphabetical and natural sorting

<!-- prettier-ignore -->
```ts
// Incorrect
let family = {
  dad: 'Loid Forger',
  mom: 'Yor Forger',
  daughter: 'Anya Forger',
}

// Correct
let family = {
  dad: 'Loid Forger',
  daughter: 'Anya Forger',
  mom: 'Yor Forger',
}
```

### Sorting by line length

<!-- prettier-ignore -->
```ts
// Incorrect
let family = {
  dad: 'Loid Forger',
  mom: 'Yor Forger',
  daughter: 'Anya Forger',
}

// Correct
let family = {
  daughter: 'Anya Forger',
  dad: 'Loid Forger',
  mom: 'Yor Forger',
}
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

:::tip
If you use the `sort-keys` rule, you should disable it, as it may conflict with the current rule.
:::

### Legacy config

```json
// .eslintrc
{
  "rules": {
    "perfectionist/sort-object-keys": [
      "error",
      {
        "type": "line-length",
        "order": "desc",
        "spreadLast": true
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
      'perfectionist/sort-object-keys': [
        'error',
        {
          type: 'line-length',
          order: 'desc',
          spreadLast: true,
        },
      ],
    },
  },
]
```

## 🚀 Version

This rule was introduced in v0.6.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-object-keys.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-object-keys.test.ts)
