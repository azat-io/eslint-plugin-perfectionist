import type { APIRoute } from 'astro'

import { getCollection } from 'astro:content'

const TAGLINE = 'Take Your Code to a Beauty Salon'

const DESCRIPTION =
  'Automatically sort and organize objects, imports, types, enums, and JSX props. Ensure a clean and maintainable codebase with minimal effort.'

const GUIDE_ORDER = ['introduction', 'getting-started', 'integrations']

const BENEFITS = [
  'Fixable Rules — Automatically fix all errors safely. No manual intervention needed.',
  'Code Uniformity — Achieve a consistent code style for better readability and maintenance.',
  'Easy to Use — Flexible configuration to match your preferences, with seamless editor integration.',
  `It's Just Beautiful — Enjoy aesthetically pleasing code that looks really awesome.`,
]

const INSTALL_COMMANDS = [
  {
    command: 'npm install --save-dev eslint-plugin-perfectionist',
    name: 'npm',
  },
  { command: 'pnpm add --save-dev eslint-plugin-perfectionist', name: 'pnpm' },
  { command: 'yarn add --dev eslint-plugin-perfectionist', name: 'yarn' },
  { command: 'bun install --dev eslint-plugin-perfectionist', name: 'bun' },
]

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

  guide.sort((a, b) => orderIndex(a.id) - orderIndex(b.id))
  configs.sort((a, b) => a.id.localeCompare(b.id))

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
    'Automatically sort and organize objects, imports, types, enums, and JSX props. Ensure a clean and maintainable codebase with minimal effort.',
    '',
    '### Why teams use it',
    '',
    ...BENEFITS.map(feature => `- ${feature}`),
    '',
    '## Installation',
    '',
    'Install `eslint-plugin-perfectionist` with your package manager:',
    '',
    ...formatInstallCommands(),
    '',
    'For ESLint setup examples and configuration patterns, continue with [Getting Started](/guide/getting-started.md).',
    '',
    '## Identical Code Style',
    '',
    'Consistent code style fosters collaboration and improves quality. Uniform style makes code readable and manageable, enabling quick understanding and contribution.',
    '',
    'Perfectionist helps enforce these standards, keeping your codebase neat and organized.',
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

function orderIndex(id: string): number {
  let index = GUIDE_ORDER.indexOf(id)
  return index === -1 ? GUIDE_ORDER.length : index
}
