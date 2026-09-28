import type { KnipConfig } from 'knip'

export default {
  entry: [
    'index.ts',
    'docs/netlify/edge-functions/markdown-negotiation.ts',
    'docs/components/Playground/lint.worker.ts',
    'docs/plugins/playground-shims/*.ts',
  ],
  ignore: ['test/fixtures/**', 'svelte.config.ts'],
} satisfies KnipConfig
