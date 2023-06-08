---
title: sort-interfaces
description: ESLint Plugin Perfectionist rule which enforce sorted TypeScript interface properties
---

# sort-interfaces

💼 This rule is enabled in the following [configs](/configs/): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted TypeScript interface properties.

Sorting interface properties provides a clear and predictable structure to the codebase, making it easier for developers to locate the various properties defined within an interface. It helps maintain consistency and allows for efficient maintenance and collaboration among team members.

It's **safe**. If you document interface properties line by line, property comments will also be sorted.

:::info Important
If you use the [`adjacent-overload-signatures`](https://typescript-eslint.io/rules/adjacent-overload-signatures) rule from the [`@typescript-eslint/eslint-plugin`](https://typescript-eslint.io) plugin, it is highly recommended to [disable it](https://eslint.org/docs/latest/use/configure/rules#using-configuration-files-1) to avoid conflicts.
:::

## 💡 Examples

::: code-group

<!-- prettier-ignore -->
```ts [Alphabetical and Natural Sorting]
// ❌ Incorrect
interface ButtonProps {
  variant?: 'solid' | 'outline' | 'text'
  full?: boolean
  disabled?: ComponentProps<'button'>['disabled']
  type?: 'submit' | 'button'
  color: 'main' | 'info' | 'success' | 'warning' | 'error'
  onClick?: () => void
  children?: string | number
  icon?: FC<SVGProps<SVGSVGElement>>
  className?: string
  size: 's' | 'm' | 'l'
}

// ✅ Correct
interface ButtonProps {
  children?: string | number
  className?: string
  color: 'main' | 'info' | 'success' | 'warning' | 'error'
  disabled?: ComponentProps<'button'>['disabled']
  full?: boolean
  icon?: FC<SVGProps<SVGSVGElement>>
  onClick?: () => void
  size: 's' | 'm' | 'l'
  type?: 'submit' | 'button'
  variant?: 'solid' | 'outline' | 'text'
}
```

```ts [Sorting by Line Length]
// ❌ Incorrect
interface ButtonProps {
  variant?: 'solid' | 'outline' | 'text'
  full?: boolean
  disabled?: ComponentProps<'button'>['disabled']
  type?: 'submit' | 'button'
  color: 'main' | 'info' | 'success' | 'warning' | 'error'
  onClick?: () => void
  children?: string | number
  icon?: FC<SVGProps<SVGSVGElement>>
  className?: string
  size: 's' | 'm' | 'l'
}

// ✅ Correct
interface ButtonProps {
  color: 'main' | 'info' | 'success' | 'warning' | 'error'
  disabled?: ComponentProps<'button'>['disabled']
  variant?: 'solid' | 'outline' | 'text'
  icon?: FC<SVGProps<SVGSVGElement>>
  children?: string | number
  type?: 'submit' | 'button'
  size: 's' | 'm' | 'l'
  onClick?: () => void
  className?: string
  full?: boolean
}
```

:::

## 🔧 Options

This rule accepts an options object with the following properties:

```ts
interface Options {
  type?: 'alphabetical' | 'natural' | 'line-length'
  order?: 'asc' | 'desc'
  'ignore-case'?: boolean
  'ignore-pattern'?: string[]
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

### ignore-pattern

<sub>(default: `[]`)</sub>

If you need to ignore a rule for some interfaces, you can specify their names or a pattern to ignore, for example: `'Component*'` to ignore all interfaces whose names begin with the word Component.

The [minimatch](https://github.com/isaacs/minimatch) library is used for pattern matching.

## ⚙️ Usage

::: code-group

```json [Legacy Config]
// .eslintrc
{
  "plugins": ["perfectionist"],
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

```js [Flat Config]
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

:::

## 🚀 Version

This rule was introduced in v0.1.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-interfaces.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-interfaces.test.ts)
