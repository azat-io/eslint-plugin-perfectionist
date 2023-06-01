---
title: sort-enums
---

# sort-enums

💼 This rule is enabled in the following [configs](https://eslint-plugin-perfectionist.azat.io/configs): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted TypeScript `enum` members.

Enums provide a way to define a set of named constants, and it is good practice to maintain a consistent and predictable order for readability and maintainability purposes.

When enum members are sorted, it sometimes becomes easier to reason about their values and identify any missing or duplicate entries.

## 💡 Examples

### Alphabetical and Natural Sorting

```ts
// Incorrect
enum Hinamizawa {
  'Sonozaki Shion' = 'Sonozaki Shion',
  'Furude Rika' = 'Furude Rika',
  'Sonozaki Mion' = 'Sonozaki Mion',
  'Ryūgū Rena' = 'Ryūgū Rena',
}

// Correct
enum Hinamizawa {
  'Furude Rika' = 'Furude Rika',
  'Ryūgū Rena' = 'Ryūgū Rena',
  'Sonozaki Mion' = 'Sonozaki Mion',
  'Sonozaki Shion' = 'Sonozaki Shion',
}
```

### Sorting by Line Length

```ts
// Incorrect
enum Hinamizawa {
  'Sonozaki Shion' = 'Sonozaki Shion',
  'Furude Rika' = 'Furude Rika',
  'Sonozaki Mion' = 'Sonozaki Mion',
  'Ryūgū Rena' = 'Ryūgū Rena',
}

// Correct
enum Hinamizawa {
  'Sonozaki Shion' = 'Sonozaki Shion',
  'Sonozaki Mion' = 'Sonozaki Mion',
  'Furude Rika' = 'Furude Rika',
  'Ryūgū Rena' = 'Ryūgū Rena',
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

### Legacy Config

```json
// .eslintrc
{
  "rules": {
    "perfectionist/sort-enums": [
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
      'perfectionist/sort-enums': [
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

This rule was introduced in v0.8.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-enums.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-enums.test.ts)
