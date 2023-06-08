# ESLint Plugin Perfectionist

<img
  src="https://raw.githubusercontent.com/azat-io/eslint-plugin-perfectionist/main/docs/public/logo.svg"
  alt="ESLint Plugin Perfectionist logo"
  align="right"
  height="170"
  width="170"
/>

[![Version](https://img.shields.io/npm/v/eslint-plugin-perfectionist.svg?color=4a32c3)](https://www.npmjs.com/package/eslint-plugin-perfectionist)
[![GitHub license](https://img.shields.io/badge/license-MIT-4a32c3.svg)](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/license)

ESLint plugin that sets rules to format your code and make it consistent.

This plugin defines rules for sorting various data, such as objects, imports, TypeScript types, enums, JSX props, etc.

All rules are automatically fixable. It's safe!

## 🦄 Why

Sorting imports and properties in software development offers numerous benefits:

- **Readability**: Finding declarations in a sorted, large list is a little faster. Remember that you read the code much more often than you write it.

- **Maintainability**: Sorting imports and properties is considered a good practice in software development, contributing to code quality and consistency across the codebase.

- **Code Review and Collaboration**: If you set rules that say you can only do things one way, then no one will have to spend time thinking about how to do it.

- **Code Uniformity**: When all code looks exactly the same, it is very hard to see who wrote it, which makes achieving the lofty goal of _collective code ownership_ easier.

- **Aesthetics**: This not only provides functional benefits, but also gives the code an aesthetic appeal, visually pleasing and harmonious structure. Take your code to the beauty salon!

## 📖 Documentation

See [docs](https://eslint-plugin-perfectionist.azat.io).

![ESLint Plugin Perfectionist usage example](https://raw.githubusercontent.com/azat-io/eslint-plugin-perfectionist/main/docs/public/example.png)

## 💿 Installation

You'll first need to install [ESLint](https://eslint.org):

```sh
npm install --save-dev eslint
```

Next, install `eslint-plugin-perfectionist`:

```sh
npm install --save-dev eslint-plugin-perfectionist
```

## 🚀️️️️ Usage

Add `eslint-plugin-perfectionist` to the plugins section of the ESLint configuration file and define the list of rules you will use.

### Legacy Config ([`.eslintrc`](https://eslint.org/docs/latest/use/configure/configuration-files))

<!-- prettier-ignore -->
```json
{
  "plugins": [
    "perfectionist"
  ],
  "rules": {
    "perfectionist/sort-objects": [
      "error",
      {
        "type": "line-length",
        "order": "desc"
      }
    ]
  }
}
```

### Flat Config ([`eslint.config.js`](https://eslint.org/docs/latest/use/configure/configuration-files-new)) (requires eslint >= v8.23.0)

```js
import perfectionist from 'eslint-plugin-perfectionist'

export default [
  {
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-objects': [
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

## ⚙️ Configs

The easiest way to use `eslint-plugin-perfectionist` is to use ready-made configs. Config files use all the rules of the current plugin, but you can override them.

### Legacy Config ([`.eslintrc`](https://eslint.org/docs/latest/use/configure/configuration-files))

<!-- prettier-ignore -->
```json
{
  "extends": [
    "plugin:perfectionist/recommended-line-length"
  ]
}
```

### Flat Config ([`eslint.config.js`](https://eslint.org/docs/latest/use/configure/configuration-files-new))

<!-- prettier-ignore -->
```js
import perfectionistLineLength from 'eslint-plugin-perfectionist/configs/recommended-line-length'

export default [
  perfectionistLineLength,
]
```

### List of Configs

| Name                                                                                                     | Description                                                      |
| :------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| [recommended-alphabetical](https://eslint-plugin-perfectionist.azat.io/configs/recommended-alphabetical) | all plugin rules with alphabetical sorting in ascending order    |
| [recommended-natural](https://eslint-plugin-perfectionist.azat.io/configs/recommended-natural)           | all plugin rules with natural sorting in ascending order         |
| [recommended-line-length](https://eslint-plugin-perfectionist.azat.io/configs/recommended-line-length)   | all plugin rules with sorting by line length in descending order |

## ✅ Rules

<!-- begin auto-generated rules list -->

🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).

| Name                                                                                         | Description                                 | 🔧 |
| :------------------------------------------------------------------------------------------- | :------------------------------------------ | :- |
| [sort-array-includes](https://eslint-plugin-perfectionist.azat.io/rules/sort-array-includes) | enforce sorted arrays before include method | 🔧 |
| [sort-classes](https://eslint-plugin-perfectionist.azat.io/rules/sort-classes)               | enforce sorted classes                      | 🔧 |
| [sort-enums](https://eslint-plugin-perfectionist.azat.io/rules/sort-enums)                   | enforce sorted TypeScript enums             | 🔧 |
| [sort-imports](https://eslint-plugin-perfectionist.azat.io/rules/sort-imports)               | enforce sorted imports                      | 🔧 |
| [sort-interfaces](https://eslint-plugin-perfectionist.azat.io/rules/sort-interfaces)         | enforce sorted interface properties         | 🔧 |
| [sort-jsx-props](https://eslint-plugin-perfectionist.azat.io/rules/sort-jsx-props)           | enforce sorted JSX props                    | 🔧 |
| [sort-map-elements](https://eslint-plugin-perfectionist.azat.io/rules/sort-map-elements)     | enforce sorted Map elements                 | 🔧 |
| [sort-named-exports](https://eslint-plugin-perfectionist.azat.io/rules/sort-named-exports)   | enforce sorted named exports                | 🔧 |
| [sort-named-imports](https://eslint-plugin-perfectionist.azat.io/rules/sort-named-imports)   | enforce sorted named imports                | 🔧 |
| [sort-object-types](https://eslint-plugin-perfectionist.azat.io/rules/sort-object-types)     | enforce sorted object types                 | 🔧 |
| [sort-objects](https://eslint-plugin-perfectionist.azat.io/rules/sort-objects)               | enforce sorted objects                      | 🔧 |
| [sort-union-types](https://eslint-plugin-perfectionist.azat.io/rules/sort-union-types)       | enforce sorted union types                  | 🔧 |

<!-- end auto-generated rules list -->

## ⚠️ Troubleshooting

There are rules of ESLint and other ESLint plugins that may conflict with the rules of ESLint Plugin Perfectionist. We strongly recommend that you [disable rules](https://eslint.org/docs/latest/use/configure/rules#using-configuration-files-1) with similar functionality.

I recommend that you read the [documentation](https://eslint-plugin-perfectionist.azat.io) before using any rules.

<details>
  <summary>Possible conflicts</summary>

**perfectionist/sort-imports:**

```json
{
  "rules": {
    "import/order": "off",
    "sort-imports": "off"
  }
}
```

**perfectionist/sort-interfaces:**

```json
{
  "rules": {
    "@typescript-eslint/adjacent-overload-signatures": "off"
  }
}
```

**perfectionist/sort-jsx-props:**

```json
{
  "rules": {
    "react/jsx-sort-props": "off"
  }
}
```

**perfectionist/sort-named-imports:**

```json
{
  "rules": {
    "sort-imports": "off"
  }
}
```

**perfectionist/sort-object-types:**

```json
{
  "rules": {
    "@typescript-eslint/adjacent-overload-signatures": "off"
  }
}
```

**perfectionist/sort-objects:**

```json
{
  "rules": {
    "sort-keys": "off"
  }
}
```

**perfectionist/sort-union-types:**

```json
{
  "rules": {
    "@typescript-eslint/sort-type-constituents": "off"
  }
}
```

</details>

## 🚥 Versioning Policy

This plugin is following [Semantic Versioning](https://semver.org/) and [ESLint's Semantic Versioning Policy](https://github.com/eslint/eslint#semantic-versioning-policy).

## ❤️ Contributing

See [Contributing Guide](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/contributing.md).

## 👁 See Also

- [`@azat-io/eslint-config`](https://github.com/azat-io/eslint-config) - Collection of ESLint configs

## 🔒 License

MIT &copy; [Azat S.](https://azat.io)
