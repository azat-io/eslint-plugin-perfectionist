---
title: sort-svelte-attributes
description: ESLint Plugin Perfectionist rule which enforce sorted attributes in Svelte elements
---

# sort-svelte-attributes

💼 This rule is enabled in the following [configs](/configs/): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted attributes in Svelte elements.

It's **safe**. The rule considers spread elements in an attributes list and does not break component functionality.

:::info Important
If you use the [`sort-attributes`](https://sveltejs.github.io/eslint-plugin-svelte/rules/sort-attributes/) rule from the [`eslint-plugin-svelte`](https://sveltejs.github.io/eslint-plugin-svelte) plugin, it is highly recommended to [disable it](https://eslint.org/docs/latest/use/configure/rules#using-configuration-files-1) to avoid conflicts.
:::

## 💡 Examples

::: code-group

<!-- prettier-ignore -->
```svelte [Alphabetical and Natural Sorting]
// ❌ Incorrect
<Button
  size="s"
  type="button"
  on:click={() => console.log("Clicked")}
  color="primary"
  disabled={false}
  variant="solid"
>
  Click me
</Button>

// ✅ Correct
<Button
  color="primary"
  disabled={false}
  on:click={() => console.log("Clicked")}
  size="s"
  type="button"
  variant="solid"
>
  Click me
</Button>
```

```svelte [Sorting by Line Length]
// ❌ Incorrect
<Button
  size="s"
  type="button"
  on:click={() => console.log("Clicked")}
  color="primary"
  disabled={false}
  variant="solid"
>
  Click me
</Button>

// ✅ Correct
<Button
  on:click={() => console.log("Clicked")}
  disabled={false}
  variant="solid"
  color="primary"
  type="button"
  size="s"
>
  Click me
</Button>
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

In order to start using this rule, you need to install additional dependencies:

- `svelte`
- `svelte-eslint-parser`

::: code-group

```json [Legacy Config]
// .eslintrc
{
  "plugins": ["perfectionist"],
  "rules": {
    "perfectionist/sort-svelte-attributes": [
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
      'perfectionist/sort-svelte-attributes': [
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

Coming soon.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-svelte-attributes.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-svelte-attributes.test.ts)
