---
title: sort-enums
---

# sort-enums

> Enforce sorted TypeScript enum members.

## 💡 Examples

### Alphabetical and natural sorting

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

### Sorting by line length

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

### Legacy config

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
