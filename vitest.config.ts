import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default defineConfig(
  mergeConfig(viteConfig, {
    test: {
      coverage: {
        thresholds: {
          statements: 100,
          functions: 100,
          branches: 100,
          lines: 100,
        },
        provider: 'v8',
      },
    },
  }),
)
