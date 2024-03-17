let config = require('@azat-io/eslint-config-typescript')

module.exports = [
  ...config,
  {
    ignores: ['**/.vitepress/cache/**/*', 'coverage/**/*'],
  },
  {
    rules: {
      'eslint-plugin/require-meta-docs-url': 'off',
    },
  },
  {
    files: ['**/test/*', '**/rules/*', '**/docs/.vitepress/config.ts'],
    rules: {
      'perfectionist/sort-objects': 'off',
    },
  },
]
