import type { APIRoute } from 'astro'

import { getCollection } from 'astro:content'

const GUIDE_ORDER = ['introduction', 'getting-started', 'integrations']

export const GET: APIRoute = async () => {
  let guide = await getCollection('guide')
  guide.sort((a, b) => orderIndex(a.id) - orderIndex(b.id))

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
      `| [${entry.data.title}](/guide/${entry.id}.md) | ${description} |`,
    )
  }

  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
    },
  })
}

function escapeTableCell(value: string): string {
  return value
    .replaceAll('|', String.raw`\|`)
    .replaceAll(/\s+/gu, ' ')
    .trim()
}

function orderIndex(id: string): number {
  let index = GUIDE_ORDER.indexOf(id)
  return index === -1 ? GUIDE_ORDER.length : index
}
