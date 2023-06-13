---
title: sort-exports
description: ESLint Plugin Perfectionist rule which enforce sorted exports
---

# sort-exports

💼 This rule is enabled in the following [configs](/configs/): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted exports.

Sorting exports alphabetically or in a consistent order can enhance the readability and maintainability of your code. When exports are sorted, it becomes simpler to identify any missing or incorrect exports.

## 💡 Examples

::: code-group

<!-- prettier-ignore -->
```js [Alphabetical and Natural Sorting]
// ❌ Incorrect
export { readPackageJson } from './read-package-json'
export { loadDotEnv } from './load-dot-env'
export { getGitBranch } from './get-git-branch'

// ✅ Correct
export { getGitBranch } from './get-git-branch'
export { loadDotEnv } from './load-dot-env'
export { readPackageJson } from './read-package-json'
```

<!-- prettier-ignore -->
```js [Sorting by Line Length]
// ❌ Incorrect
export { readPackageJson } from './read-package-json'
export { loadDotEnv } from './load-dot-env'
export { getGitBranch } from './get-git-branch'

// ✅ Correct
export { readPackageJson } from './read-package-json'
export { getGitBranch } from './get-git-branch'
export { loadDotEnv } from './load-dot-env'
```

:::

## 🔧 Options

This rule accepts an options object with the following properties:

```ts
interface Options {
  type?: 'alphabetical' | 'natural' | 'line-length'
  order?: 'asc' | 'desc'
  'ignore-case'?: boolean
}
```

### type

<sub>(default: `'alphabetical'`)</sub>

- `alphabetical` - sort alphabetically.
- `natural` - sort in natural order.
- `line-length` - sort by code line length.

### order

<sub>(default: `'asc'`)</sub>

- `asc` - enforce properties to be in ascending order.
- `desc` - enforce properties to be in descending order.

### ignore-case

<sub>(default: `false`)</sub>

Only affects alphabetical and natural sorting. When `true` the rule ignores the case-sensitivity of the order.

## ⚙️ Usage

::: code-group

```json [Legacy Config]
// .eslintrc
{
  "plugins": ["perfectionist"],
  "rules": {
    "perfectionist/sort-exports": [
      "error",
      {
        "type": "natural",
        "order": "asc"
      }
    ]
  }
}
```

```js [Flat Config]
// eslint.config.js
import perfectionist from 'eslint-plugin-perfectionist'

export default [
  {
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-exports': [
        'error',
        {
          type: 'natural',
          order: 'asc',
        },
      ],
    },
  },
]
```

:::

## 🚀 Version

This rule was introduced in v1.2.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-exports.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-exports.test.ts)
