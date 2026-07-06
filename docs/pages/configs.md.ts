import type { APIRoute } from 'astro'

import { getCollection } from 'astro:content'

import { CONFIG_ORDER, orderIndex } from '../data/collections'
import { escapeTableCell } from '../utils/markdown-response'

export const GET: APIRoute = async () => {
  let configs = await getCollection('configs')
  configs.sort(
    (a, b) => orderIndex(CONFIG_ORDER, a.id) - orderIndex(CONFIG_ORDER, b.id),
  )

  let lines = [
    '# Configs',
    '',
    'The easiest way to use eslint-plugin-perfectionist is to use ready-made configs.',
    'Each configuration applies all rules with a specific sorting strategy.',
    '',
    '| Config | Description |',
    '| --- | --- |',
  ]
  for (let config of configs) {
    let description = escapeTableCell(config.data.shortDescription)
    lines.push(
      `| [${escapeTableCell(config.data.title)}](/configs/${config.id}.md) | ${description} |`,
    )
  }

  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
    },
  })
}
