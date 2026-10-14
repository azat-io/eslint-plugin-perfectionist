import type { CollectionEntry } from 'astro:content'
import type { APIRoute } from 'astro'

import { getCollection } from 'astro:content'

import { mdxToMarkdown } from './mdx-to-markdown'

interface EndpointProps {
  title: string
  body: string
}

type SupportedCollection = 'configs' | 'guide' | 'rules'

type Entry = CollectionEntry<SupportedCollection>

export function createMarkdownEndpoint(collection: SupportedCollection): {
  getStaticPaths(): Promise<
    {
      params: { slug: string }
      props: EndpointProps
    }[]
  >
  GET: APIRoute
} {
  async function getStaticPaths(): Promise<
    {
      params: { slug: string }
      props: EndpointProps
    }[]
  > {
    let entries = await getCollection(collection)
    return entries.map((entry: Entry) => ({
      props: { title: entry.data.title, body: entry.body ?? '' },
      params: { slug: entry.id },
    }))
  }

  let GET: APIRoute = async ({ props }) => {
    let { title, body } = props as EndpointProps
    let markdown = await formatMarkdown(body, title)
    return new Response(markdown, {
      headers: {
        'content-type': 'text/markdown; charset=utf-8',
      },
    })
  }

  return { getStaticPaths, GET }
}

async function formatMarkdown(body: string, title: string): Promise<string> {
  let converted = (await mdxToMarkdown(body)).trimStart()
  let needsTitle = !converted.startsWith('# ')
  let heading = needsTitle ? `# ${title}\n\n` : ''
  return `${heading}${converted}`
}
