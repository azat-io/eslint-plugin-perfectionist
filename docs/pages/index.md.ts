import type { APIRoute } from 'astro'

import { getCollection } from 'astro:content'

import {
  INSTALL_COMMANDS,
  DESCRIPTION,
  CODE_STYLE,
  BENEFITS,
  TAGLINE,
} from '../data/home'
import { CONFIG_ORDER, GUIDE_ORDER, orderIndex } from '../data/collections'

const DEMO_LINKS = [
  {
    href: '/rules/sort-imports.md',
    title: 'sort-imports',
  },
  {
    href: '/rules/sort-objects.md',
    title: 'sort-objects',
  },
  {
    href: '/rules/sort-classes.md',
    title: 'sort-classes',
  },
]

export const GET: APIRoute = async () => {
  let [guide, rules, configs] = await Promise.all([
    getCollection('guide'),
    getCollection('rules'),
    getCollection('configs'),
  ])

  guide.sort(
    (a, b) => orderIndex(GUIDE_ORDER, a.id) - orderIndex(GUIDE_ORDER, b.id),
  )
  configs.sort(
    (a, b) => orderIndex(CONFIG_ORDER, a.id) - orderIndex(CONFIG_ORDER, b.id),
  )

  let lines = [
    '# Perfectionist',
    '',
    `> ${TAGLINE}`,
    '',
    DESCRIPTION,
    '',
    '- [Get Started](/guide/getting-started.md)',
    '- [View on GitHub](https://github.com/azat-io/eslint-plugin-perfectionist)',
    '',
    '## ESLint Plugin',
    '',
    DESCRIPTION,
    '',
    '### Why teams use it',
    '',
    ...BENEFITS.map(benefit => `- ${benefit.title} — ${benefit.description}`),
    '',
    '## Installation',
    '',
    'Install `eslint-plugin-perfectionist` with your package manager:',
    '',
    ...formatInstallCommands(),
    '',
    'For ESLint setup examples and configuration patterns, continue with [Getting Started](/guide/getting-started.md).',
    '',
    `## ${CODE_STYLE.title}`,
    '',
    CODE_STYLE.paragraphs[0],
    '',
    CODE_STYLE.paragraphs[1],
    '',
    '## Interactive Demo',
    '',
    'Try the live examples and compare sorting strategies directly in the rule docs:',
    '',
    ...DEMO_LINKS.map(link => `- [${link.title}](${link.href})`),
    '',
    '## Guide',
    '',
    ...guide.map(
      entry =>
        `- [${entry.data.title}](/guide/${entry.id}.md) — ${entry.data.description}`,
    ),
    '',
    '## Ready-Made Configs',
    '',
    ...configs.map(
      config =>
        `- [${config.data.title}](/configs/${config.id}.md) — ${config.data.shortDescription}`,
    ),
    '',
    '## Rules Reference',
    '',
    `Explore all ${rules.length} rules in [the full list](/rules.md).`,
    '',
    '## Community',
    '',
    '- [GitHub Repository](https://github.com/azat-io/eslint-plugin-perfectionist)',
    '- [NPM Package](https://npmjs.com/package/eslint-plugin-perfectionist)',
    '- [Contributing Guide](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/contributing.md)',
    '- [Changelog](https://github.com/azat-io/eslint-plugin-perfectionist/blob/main/changelog.md)',
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
    },
  })
}

function formatInstallCommands(): string[] {
  let lines: string[] = []

  for (let { command, name } of INSTALL_COMMANDS) {
    lines.push(`**${name}**`, '', '```bash', command, '```', '')
  }

  return lines
}
