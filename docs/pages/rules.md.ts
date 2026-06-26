import type { APIRoute } from 'astro'

import { getCollection } from 'astro:content'

import { escapeTableCell } from '../utils/markdown-response'

export const GET: APIRoute = async () => {
  let rules = await getCollection('rules')
  rules.sort((a, b) => a.id.localeCompare(b.id))

  let lines = [
    '# Rules',
    '',
    'Check out the list of all ESLint rules that this plugin includes.',
    'All rules are automatically fixable with the `--fix` CLI option.',
    '',
    '| Rule | Description |',
    '| --- | --- |',
  ]
  for (let rule of rules) {
    let title =
      rule.data.deprecated ? `${rule.data.title} (deprecated)` : rule.data.title
    let description = escapeTableCell(rule.data.shortDescription)
    lines.push(
      `| [${escapeTableCell(title)}](/rules/${rule.id}.md) | ${description} |`,
    )
  }

  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
    },
  })
}
