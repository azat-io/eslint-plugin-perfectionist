let eslintPlugin = require('eslint-plugin-eslint-plugin/configs/all')
let config = require('@azat-io/eslint-config-astro')

module.exports = [
  ...config,
  eslintPlugin,
  {
    ignores: ['coverage/**/*', '**/.astro/**/*'],
  },
  {
    rules: {
      'eslint-plugin/require-meta-docs-description': [
        'error',
        { pattern: '^Enforce' },
      ],
      'eslint-plugin/require-meta-docs-recommended': 'off',
      'eslint-plugin/require-meta-docs-url': 'off',
      'astro/prefer-class-list-directive': 'off',
    },
  },
  {
    rules: {
      'perfectionist/sort-objects': 'off',
    },
    files: ['**/test/*', '**/rules/*'],
  },
]
