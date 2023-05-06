---
title: Getting Started
---

# Getting Started

## Installation

You'll first need to install [ESLint](https://eslint.org):

::: code-group

```bash [npm]
npm install --save-dev eslint
```

```bash [pnpm]
pnpm add --save-dev eslint
```

```bash [yarn]
yarn add --dev eslint
```

:::

Next, install `eslint-plugin-perfectionist`:

::: code-group

```bash [npm]
npm install --save-dev eslint-plugin-perfectionist
```

```bash [pnpm]
pnpm add --save-dev eslint-plugin-perfectionist
```

```bash [yarn]
yarn add --dev eslint-plugin-perfectionist
```

:::

## Usage

Add `perfectionist` to the plugins section of your `.eslintrc` configuration file or import `eslint-plugin-perfectionist` in your `eslint.config.js`. Then configure the rules you want to use under the rules section.

### Legacy config

```json
// .eslintrc
{
  "plugins": ["perfectionist"],
  "rules": {
    "perfectionist/sort-interfaces": "error"
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
    'perfectionist/sort-interfaces': 'error',
  },
}
```
