let config = require('@azat-io/eslint-config-typescript')

module.exports = [
  ...config,
  {
    ignores: ['coverage/**/*'],
  },
  {
    rules: {
      'eslint-plugin/require-meta-docs-url': 'off',
    },
  },
  {
    rules: {
      'perfectionist/sort-objects': 'off',
    },
    files: ['**/test/*', '**/rules/*'],
  },
]
