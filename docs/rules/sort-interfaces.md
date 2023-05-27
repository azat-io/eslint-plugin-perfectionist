---
title: sort-interfaces
---

# sort-interfaces

> Enforce sorted TypeScript interface properties.

## 💡 Examples

### Alphabetical and natural sorting

```ts
// Incorrect
interface Hero {
  name: string
  rank: 'S-Class' | 'A-Class' | 'B-Class' | 'C-Class'
  isAlive: boolean
  abilities: string[]
  age: number
  affiliation: 'Association' | 'Saitama Group'
}

// Correct
interface Hero {
  abilities: string[]
  affiliation: 'Association' | 'Saitama Group'
  age: number
  isAlive: boolean
  name: string
  rank: 'S-Class' | 'A-Class' | 'B-Class' | 'C-Class'
}
```

### Sorting by line length

```ts
// Incorrect
interface Hero {
  name: string
  rank: 'S-Class' | 'A-Class' | 'B-Class' | 'C-Class'
  isAlive: boolean
  abilities: string[]
  age: number
  affiliation: 'Association' | 'Saitama Group'
}

// Correct
interface Hero {
  rank: 'S-Class' | 'A-Class' | 'B-Class' | 'C-Class'
  affiliation: 'Association' | 'Saitama Group'
  abilities: string[]
  isAlive: boolean
  name: string
  age: number
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
    "perfectionist/sort-interfaces": [
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
      'perfectionist/sort-interfaces': [
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

This rule was introduced in v0.1.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-interfaces.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-interfaces.test.ts)
