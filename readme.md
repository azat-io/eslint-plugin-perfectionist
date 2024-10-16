# ESLint Plugin Perfectionist

<img
  src="https://raw.githubusercontent.com/azat-io/eslint-plugin-perfectionist/main/docs/public/logo.svg"
  alt="ESLint Plugin Perfectionist logo"
  align="right"
  height="160"
  width="160"
/>

[![Version](https://img.shields.io/npm/v/eslint-plugin-perfectionist.svg?color=4a32c3&labelColor=26272b)](https://npmjs.com/package/eslint-plugin-perfectionist)
[![Monthly Download](https://img.shields.io/npm/dm/eslint-plugin-perfectionist.svg?color=4a32c3&labelColor=26272b)](https://npmjs.com/package/eslint-plugin-perfectionist)
[![Code Coverage](https://img.shields.io/codecov/c/github/azat-io/eslint-plugin-perfectionist.svg?color=4a32c3&labelColor=26272b)](https://npmjs.com/package/eslint-plugin-perfectionist)
[![GitHub License](https://img.shields.io/badge/license-MIT-232428.svg?color=4a32c3&labelColor=26272b)](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/license.md)

ESLint plugin that sets rules to format your code and make it consistent.

This plugin defines rules for sorting various data, such as objects, imports, TypeScript types, enums, JSX props, Svelte attributes, etc. alphabetically, naturally, or by line length

All rules are automatically fixable. It's safe!

## Why

Sorting imports and properties in software development offers numerous benefits:

- **Readability**: Finding declarations in a sorted, large list is a little faster. Remember that you read the code much more often than you write it.

- **Maintainability**: Sorting imports and properties is considered a good practice in software development, contributing to code quality and consistency across the codebase.

- **Code Review and Collaboration**: If you set rules that say you can only do things one way, then no one will have to spend time thinking about how to do it.

- **Code Uniformity**: When all code looks exactly the same, it is very hard to see who wrote it, which makes achieving the lofty goal of _collective code ownership_ easier.

- **Aesthetics**: This not only provides functional benefits, but also gives the code an aesthetic appeal, visually pleasing and harmonious structure. Take your code to a beauty salon!

## Documentation

See [docs](https://perfectionist.dev).

### Alphabetical Sorting

<picture>
  <source
    srcset="https://raw.githubusercontent.com/azat-io/eslint-plugin-perfectionist/main/docs/public/examples/example-alphabetical-light.webp"
    media="(prefers-color-scheme: light)"
  />
  <source
    srcset="https://raw.githubusercontent.com/azat-io/eslint-plugin-perfectionist/main/docs/public/examples/example-alphabetical-dark.webp"
    media="(prefers-color-scheme: dark)"
  />
  <img
    src="https://raw.githubusercontent.com/azat-io/eslint-plugin-perfectionist/main/docs/public/examples/example-alphabetical-light.webp"
    alt="ESLint Plugin Perfectionist alphabetical usage example"
  />
</picture>

### Sorting by Line Length

<picture>
  <source
    srcset="https://raw.githubusercontent.com/azat-io/eslint-plugin-perfectionist/main/docs/public/examples/example-line-length-light.webp"
    media="(prefers-color-scheme: light)"
  />
  <source
    srcset="https://raw.githubusercontent.com/azat-io/eslint-plugin-perfectionist/main/docs/public/examples/example-line-length-dark.webp"
    media="(prefers-color-scheme: dark)"
  />
  <img
    src="https://raw.githubusercontent.com/azat-io/eslint-plugin-perfectionist/main/docs/public/examples/example-line-length-light.webp"
    alt="ESLint Plugin Perfectionist line length usage example"
  />
</picture>

## Installation

You'll first need to install [ESLint](https://eslint.org):

```sh
npm install --save-dev eslint
```

Next, install `eslint-plugin-perfectionist`:

```sh
npm install --save-dev eslint-plugin-perfectionist
```

## Usage

Add `eslint-plugin-perfectionist` to the plugins section of the ESLint configuration file and define the list of rules you will use.

### Flat Config ([`eslint.config.js`](https://eslint.org/docs/latest/use/configure/configuration-files))

```js
import perfectionist from 'eslint-plugin-perfectionist'

export default [
  {
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-imports': [
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

### Legacy Config ([`.eslintrc.js`](https://eslint.org/docs/latest/use/configure/configuration-files-deprecated))

<!-- prettier-ignore -->
```js
module.exports = {
  plugins: [
    'perfectionist',
  ],
  rules: {
    'perfectionist/sort-imports': [
      'error',
      {
        type: 'natural',
        order: 'asc',
      }
    ]
  }
}
```

## Configs

The easiest way to use `eslint-plugin-perfectionist` is to use ready-made configs. Config files use all the rules of the current plugin, but you can override them.

### Flat Config ([`eslint.config.js`](https://eslint.org/docs/latest/use/configure/configuration-files))

<!-- prettier-ignore -->
```js
import perfectionist from 'eslint-plugin-perfectionist'

export default [
  perfectionist.configs['recommended-natural'],
]
```

### Legacy Config ([`.eslintrc`](https://eslint.org/docs/latest/use/configure/configuration-files-deprecated))

<!-- prettier-ignore -->
```js
module.exports = {
  extends: [
    'plugin:perfectionist/recommended-natural-legacy',
  ],
}
```

### List of Configs

| Name                                                                                   | Description                                                      |
| :------------------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| [recommended-alphabetical](https://perfectionist.dev/configs/recommended-alphabetical) | All plugin rules with alphabetical sorting in ascending order    |
| [recommended-natural](https://perfectionist.dev/configs/recommended-natural)           | All plugin rules with natural sorting in ascending order         |
| [recommended-line-length](https://perfectionist.dev/configs/recommended-line-length)   | All plugin rules with sorting by line length in descending order |

## Rules

<!-- begin auto-generated rules list -->

🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).

| Name                                                                                     | Description                                 | 🔧  |
| :--------------------------------------------------------------------------------------- | :------------------------------------------ | :-- |
| [sort-array-includes](https://perfectionist.dev/rules/sort-array-includes)               | Enforce sorted arrays before include method | 🔧  |
| [sort-astro-attributes](https://perfectionist.dev/rules/sort-astro-attributes)           | Enforce sorted Astro attributes             | 🔧  |
| [sort-classes](https://perfectionist.dev/rules/sort-classes)                             | Enforce sorted classes                      | 🔧  |
| [sort-enums](https://perfectionist.dev/rules/sort-enums)                                 | Enforce sorted TypeScript enums             | 🔧  |
| [sort-exports](https://perfectionist.dev/rules/sort-exports)                             | Enforce sorted exports                      | 🔧  |
| [sort-imports](https://perfectionist.dev/rules/sort-imports)                             | Enforce sorted imports                      | 🔧  |
| [sort-interfaces](https://perfectionist.dev/rules/sort-interfaces)                       | Enforce sorted interface properties         | 🔧  |
| [sort-intersection-types](https://perfectionist.dev/rules/sort-intersection-types)       | Enforce sorted intersection types           | 🔧  |
| [sort-jsx-props](https://perfectionist.dev/rules/sort-jsx-props)                         | Enforce sorted JSX props                    | 🔧  |
| [sort-maps](https://perfectionist.dev/rules/sort-maps)                                   | Enforce sorted Map elements                 | 🔧  |
| [sort-named-exports](https://perfectionist.dev/rules/sort-named-exports)                 | Enforce sorted named exports                | 🔧  |
| [sort-named-imports](https://perfectionist.dev/rules/sort-named-imports)                 | Enforce sorted named imports                | 🔧  |
| [sort-object-types](https://perfectionist.dev/rules/sort-object-types)                   | Enforce sorted object types                 | 🔧  |
| [sort-objects](https://perfectionist.dev/rules/sort-objects)                             | Enforce sorted objects                      | 🔧  |
| [sort-sets](https://perfectionist.dev/rules/sort-sets)                                   | Enforce sorted Set elements                 | 🔧  |
| [sort-svelte-attributes](https://perfectionist.dev/rules/sort-svelte-attributes)         | Enforce sorted Svelte attributes            | 🔧  |
| [sort-switch-case](https://perfectionist.dev/rules/sort-switch-case)                     | Enforce sorted switch case statements       | 🔧  |
| [sort-union-types](https://perfectionist.dev/rules/sort-union-types)                     | Enforce sorted union types                  | 🔧  |
| [sort-variable-declarations](https://perfectionist.dev/rules/sort-variable-declarations) | Enforce sorted variable declarations        | 🔧  |
| [sort-vue-attributes](https://perfectionist.dev/rules/sort-vue-attributes)               | Enforce sorted Vue attributes               | 🔧  |

<!-- end auto-generated rules list -->

## FAQ

### Can I automatically fix problems in the editor?

Yes. To do this, you need to enable autofix in ESLint when you save the file in your editor. Instructions for your editor can be found [here](https://perfectionist.dev/guide/integrations).

### Is it safety?

On the whole, yes. We are very careful to make sure that the work of the plugin does not negatively affect the work of the code. For example, the plugin takes into account spread operators in JSX and objects, comments to the code. Safety is our priority. If you encounter any problem, you can create an [issue](https://github.com/azat-io/eslint-plugin-perfectionist/issues/new/choose).

### Why not Prettier?

I love Prettier. However, this is not his area of responsibility. Prettier is used for formatting, and ESLint is also used for styling. For example, changing the order of imports can affect how the code works (console.log calls, fetch, style loading). Prettier should not change the AST. There is a cool article about this: ["The Blurry Line Between Formatting and Style"](https://blog.joshuakgoldberg.com/the-blurry-line-between-formatting-and-style) by **@joshuakgoldberg**.

## Versioning Policy

This plugin is following [Semantic Versioning](https://semver.org/) and [ESLint's Semantic Versioning Policy](https://github.com/eslint/eslint#semantic-versioning-policy).

## Contributing

See [Contributing Guide](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/contributing.md).

## License

MIT &copy; [Azat S.](https://azat.io)
