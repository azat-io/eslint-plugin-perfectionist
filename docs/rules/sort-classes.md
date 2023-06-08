---
title: sort-classes
description: ESLint Plugin Perfectionist rule which enforce sorted ES class members
---

# sort-classes

💼 This rule is enabled in the following [configs](/configs/): `recommended-alphabetical`, `recommended-line-length`, `recommended-natural`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

## 📖 Rule Details

Enforce sorted class members. By enforcing a consistent order, this rule improves code readability and maintainability. It helps developers quickly locate class members and understand the structure of the class.

Class members that are not sorted in a certain order can cause confusion and reduce code readability.

## 💡 Examples

::: code-group

<!-- prettier-ignore -->
```js [Alphabetical and Natural Sorting]
// ❌ Incorrect
class Rectangle {
  get area() {
    return this.calcArea()
  }

  calcPerimeter() {
    return this.height * 2 + this.width * 2
  }

  calcArea() {
    return this.height * this.width
  }

  constructor(height, width) {
    this.height = height
    this.width = width
  }
}

// ✅ Correct
class Rectangle {
  constructor(height, width) {
    this.height = height
    this.width = width
  }

  get area() {
    return this.calcArea()
  }

  calcArea() {
    return this.height * this.width
  }

  calcPerimeter() {
    return this.height * 2 + this.width * 2
  }
}
```

```js [Sorting by Line Length]
// ❌ Incorrect
class Rectangle {
  get area() {
    return this.calcArea()
  }

  calcPerimeter() {
    return this.height * 2 + this.width * 2
  }

  calcArea() {
    return this.height * this.width
  }

  constructor(height, width) {
    this.height = height
    this.width = width
  }
}

// ✅ Correct
class Rectangle {
  constructor(height, width) {
    this.height = height
    this.width = width
  }

  calcPerimeter() {
    return this.height * 2 + this.width * 2
  }

  calcArea() {
    return this.height * this.width
  }

  get area() {
    return this.calcArea()
  }
}
```

:::

## 🔧 Options

This rule accepts an options object with the following properties:

```ts
type Group =
  | 'private-property'
  | 'static-property'
  | 'private-method'
  | 'static-method'
  | 'constructor'
  | 'property'
  | 'unknown'
  | 'method'

interface Options {
  type?: 'alphabetical' | 'natural' | 'line-length'
  order?: 'asc' | 'desc'
  'ignore-case'?: boolean
  groups?: (Group | Group[])[]
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

### groups

<sub>(default: `['property', 'constructor', 'method', 'unknown']`)</sub>

You can set up a list of class members groups for sorting. Groups can be combined.

If you use [one of the configs](/configs/) exported by this plugin, you get the following import grouping settings:

```js
{
  groups: [
    'static-property',
    'private-property',
    'property',
    'constructor',
    'static-method',
    'private-method',
    'method',
    'unknown',
  ]
}
```

## ⚙️ Usage

::: code-group

```json [Legacy Config]
// .eslintrc
{
  "plugins": ["perfectionist"],
  "rules": {
    "perfectionist/sort-classes": [
      "error",
      {
        "type": "line-length",
        "order": "desc",
        "groups": [
          "static-property",
          "private-property",
          "property",
          "constructor",
          "static-method",
          "private-method",
          "method"
        ]
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
      'perfectionist/sort-classes': [
        'error',
        {
          type: 'line-length',
          order: 'desc',
          groups: [
            'static-property',
            'private-property',
            'property',
            'constructor',
            'static-method',
            'private-method',
            'method',
          ],
        },
      ],
    },
  },
]
```

:::

## 🚀 Version

This rule was introduced in v0.11.0.

## 📚 Resources

- [Rule source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/rules/sort-classes.ts)
- [Test source](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/test/sort-classes.test.ts)
