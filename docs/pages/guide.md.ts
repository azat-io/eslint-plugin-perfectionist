import type { APIRoute } from 'astro'

import { getCollection } from 'astro:content'

import { GUIDE_ORDER, orderIndex } from '../data/collections'
import { escapeTableCell } from '../utils/markdown-response'

export const GET: APIRoute = async () => {
  let guide = await getCollection('guide')
  guide.sort(
    (a, b) => orderIndex(GUIDE_ORDER, a.id) - orderIndex(GUIDE_ORDER, b.id),
  )

  let lines = [
    '# Guide',
    '',
    'Learn how to install, configure, and integrate eslint-plugin-perfectionist.',
    '',
    '| Page | Description |',
    '| --- | --- |',
  ]
  for (let entry of guide) {
    let description = escapeTableCell(entry.data.description)
    lines.push(
      `| [${escapeTableCell(entry.data.title)}](/guide/${entry.id}.md) | ${description} |`,
    )
  }

  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
    },
  })
}
