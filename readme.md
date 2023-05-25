# ESLint Plugin Perfectionist

<img src="https://raw.githubusercontent.com/azat-io/eslint-plugin-perfectionist/main/docs/public/logo.svg" alt="ESLint" align="right" width="140" height="140" />

![Version](https://img.shields.io/npm/v/eslint-plugin-perfectionist.svg?color=brightgreen)

ESLint plugin that sets rules to format your code and make it consistent.

This plugin defines rules for sorting various data, such as objects, imports, TypeScript types, enums, JSX props, etc.

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

### Examples

#### Legacy config ([`.eslintrc`](https://eslint.org/docs/latest/use/configure/configuration-files))

```
{
  "plugins": ["perfectionist"],
  "rules": {
    "perfectionist/sort-array-includes": [
      "error",
      {
        "type": "line-length",
        "order": "desc",
        "spreadLast": true
      }
    ]
  }
}
```

#### Flat config ([`eslint.config.js`](https://eslint.org/docs/latest/use/configure/configuration-files-new)) (requires eslint >= v8.23.0)

```js
import perfectionist from 'eslint-plugin-perfectionist'

export default [
  {
    plugins: {
      perfectionist,
    },
    rules: {
      'perfectionist/sort-array-includes': [
        'error',
        {
          type: 'line-length',
          order: 'desc',
          spreadLast: true,
        },
      ],
    },
  },
]
```

### Configs

The easiest way to use `eslint-plugin-perfectionist` is to use ready-made configs. Config files use all the rules of the current plugin, but you can override them.

#### Legacy config ([`.eslintrc`](https://eslint.org/docs/latest/use/configure/configuration-files))

```json
{
  "extends": ["plugin:perfectionist/recommended-natural"]
}
```

#### Flat config ([`eslint.config.js`](https://eslint.org/docs/latest/use/configure/configuration-files-new)) (requires eslint >= v8.23.0)

```js
import perfectionistPluginRecommendedNatural from 'eslint-plugin-perfectionist/config/recommended-natural'

export default [perfectionistPluginRecommendedNatural]
```

#### List of configs

| Name                                                                                                     | Description                                                      |
| :------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| [recommended-alphabetical](https://eslint-plugin-perfectionist.azat.io/configs/recommended-alphabetical) | All plugin rules with alphabetical sorting in ascending order    |
| [recommended-natural](https://eslint-plugin-perfectionist.azat.io/configs/recommended-natural)           | All plugin rules with natural sorting in ascending order         |
| [recommended-line-length](https://eslint-plugin-perfectionist.azat.io/configs/recommended-line-length)   | All plugin rules with sorting by line length in descending order |

## Rules

💼 - Configurations enabled in.\
🔧 - Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).

| Name                                                                                         | Description                                 | 💼  | 🛠   |
| :------------------------------------------------------------------------------------------- | :------------------------------------------ | :-- | :-- |
| [sort-array-includes](https://eslint-plugin-perfectionist.azat.io/rules/sort-array-includes) | Enforce sorted arrays before include method | ✅  | ✅  |
| [sort-enums](https://eslint-plugin-perfectionist.azat.io/rules/sort-enums)                   | Enforce sorted TypeScript enums             | ✅  | ✅  |
| [sort-interfaces](https://eslint-plugin-perfectionist.azat.io/rules/sort-interfaces)         | Enforce sorted interface properties         | ✅  | ✅  |
| [sort-jsx-props](https://eslint-plugin-perfectionist.azat.io/rules/sort-jsx-props)           | Enforce sorted JSX props                    | ✅  | ✅  |
| [sort-map-elements](https://eslint-plugin-perfectionist.azat.io/rules/sort-map-elements)     | Enforce sorted Map elements                 | ✅  | ✅  |
| [sort-named-exports](https://eslint-plugin-perfectionist.azat.io/rules/sort-named-exports)   | Enforce sorted named exports                | ✅  | ✅  |
| [sort-named-imports](https://eslint-plugin-perfectionist.azat.io/rules/sort-named-imports)   | Enforce sorted named imports                | ✅  | ✅  |
| [sort-object-keys](https://eslint-plugin-perfectionist.azat.io/rules/sort-object-keys)       | Enforce sorted object keys                  | ✅  | ✅  |
| [sort-union-types](https://eslint-plugin-perfectionist.azat.io/rules/sort-union-types)       | Enforce sorted union types                  | ✅  | ✅  |

## See also

- [`@azat-io/eslint-config`](https://github.com/azat-io/eslint-config) - Collection of ESLint configs

## License

MIT &copy; [Azat S.](https://azat.io)
