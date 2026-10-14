import type { APIRoute } from 'astro'

import { getCollection } from 'astro:content'

import { CONFIG_ORDER, GUIDE_ORDER, orderIndex } from '../data/collections'
import { DESCRIPTION, BENEFITS } from '../data/home'

export const GET: APIRoute = async ({ site }) => {
  let origin = site?.origin ?? 'https://perfectionist.dev'

  let [guide, rules, configs] = await Promise.all([
    getCollection('guide'),
    getCollection('rules'),
    getCollection('configs'),
  ])

  guide.sort(
    (a, b) => orderIndex(GUIDE_ORDER, a.id) - orderIndex(GUIDE_ORDER, b.id),
  )
  rules.sort((a, b) => a.id.localeCompare(b.id))
  configs.sort(
    (a, b) => orderIndex(CONFIG_ORDER, a.id) - orderIndex(CONFIG_ORDER, b.id),
  )

  let lines = [
    '# ESLint Plugin Perfectionist',
    '',
    `> ${DESCRIPTION}`,
    '',
    'Key features:',
    '',
    ...BENEFITS.map(benefit => `- ${benefit.title}: ${benefit.description}`),
    '',
    '## Getting Started',
    '',
    ...guide.map(
      entry =>
        `- [${entry.data.title}](${origin}/guide/${entry.id}.md): ${entry.data.shortDescription}`,
    ),
    '',
    '## Configurations',
    '',
    ...configs.map(
      config =>
        `- [${config.data.title}](${origin}/configs/${config.id}.md): ${config.data.shortDescription}`,
    ),
    '',
    '## Rules',
    '',
    ...rules.map(rule => {
      let title =
        rule.data.deprecated ?
          `${rule.data.title} (deprecated)`
        : rule.data.title
      return `- [${title}](${origin}/rules/${rule.id}.md): ${rule.data.shortDescription}`
    }),
    '',
    '## Optional',
    '',
    `- [Documentation Homepage](${origin}/index.md): Overview of the plugin, installation, and all documentation sections`,
    `- [Full Rules List](${origin}/rules.md): All rules with short descriptions in one table`,
    '- [GitHub Repository](https://github.com/azat-io/eslint-plugin-perfectionist): Source code, issues, and contributions',
    '- [NPM Package](https://npmjs.com/package/eslint-plugin-perfectionist): Package details and version history',
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
    },
  })
}
