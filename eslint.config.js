let eslintPlugin = require('eslint-plugin-eslint-plugin/configs/all')
let config = require('@azat-io/eslint-config-typescript')

module.exports = [
  ...config,
  eslintPlugin,
  {
    ignores: ['**/.vitepress/cache/**/*', 'coverage/**/*'],
  },
  {
    rules: {
      'eslint-plugin/require-meta-docs-url': 'off',
      'consistent-return': 'off',
    },
  },
  {
    files: ['**/test/*', '**/rules/*', '**/docs/.vitepress/config.ts'],
    rules: {
      'perfectionist/sort-objects': 'off',
    },
  },
]
