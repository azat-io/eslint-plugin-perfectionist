---
title: sort-interfaces
---

# sort-interfaces

> Enforce sorted interface properties.

## 📖 Rule details

This rule verifies that all TypeScript interface properties are sorted sorted in order of string length.

### Incorrect

```ts
interface ButtonProps {
  onClick?: () => void
  variant?: 'solid' | 'outline' | 'text'
  color: 'main' | 'info' | 'success' | 'warning' | 'error'
  size: 's' | 'm' | 'l'
  type?: 'submit' | 'button'
  children?: string | number
  disabled?: ComponentProps<'button'>['disabled']
  full?: boolean
  className?: string
}
```

### Correct

```ts
interface ButtonProps {
  color: 'main' | 'info' | 'success' | 'warning' | 'error'
  disabled?: ComponentProps<'button'>['disabled']
  variant?: 'solid' | 'outline' | 'text'
  type?: 'submit' | 'button'
  children?: string | number
  size: 's' | 'm' | 'l'
  onClick?: () => void
  className?: string
  full?: boolean
}
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
    "perfectionist/sort-interfaces": ["error", { "type": "line-length", "order": "desc" }]
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
    'perfectionist/sort-interfaces': ['error', { type: 'line-length', order: 'desc' }],
  },
}
```

## 🚀 Version

This rule was introduced in v0.1.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-interfaces.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-interfaces.test.ts)
