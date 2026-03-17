import type { KnipConfig } from 'knip'

export default {
  entry: ['index.ts', 'test/v8-coverage-provider.js'],
  ignoreDependencies: ['@vitest/coverage-custom'],
  ignore: ['test/fixtures/**'],
} satisfies KnipConfig
