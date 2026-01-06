import type { ChangelogConfig } from 'changelogen'

export default {
  types: {
    perf: {
      title: '🏎 Performance Improvements',
    },
    feat: {
      title: '🚀 Features',
    },
    fix: {
      title: '🐞 Bug Fixes',
    },
    refactor: false,
    build: false,
    chore: false,
    style: false,
    docs: false,
    test: false,
    ci: false,
  },
  templates: {
    commitMessage: 'build: publish v{{newVersion}}',
  },
} satisfies Partial<ChangelogConfig>
