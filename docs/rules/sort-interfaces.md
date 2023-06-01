---
title: sort-interfaces
---

# sort-interfaces

💼 This rule is enabled in the following [configs](https://eslint-plugin-perfectionist.azat.io/configs): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted TypeScript interface properties.

Sorting interface properties provides a clear and predictable structure to the codebase, making it easier for developers to locate the various properties defined within an interface. It helps maintain consistency and allows for efficient maintenance and collaboration among team members.

It's **safe**. If you document interface properties line by line, property comments will also be sorted.

## 💡 Examples

### Alphabetical and Natural Sorting

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

### Sorting by Line Length

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

### `ignore-pattern`

- `[string]` (default: `[]`) - allows to ignore interface by pattern

## ⚙️ Usage

### Legacy Config

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
