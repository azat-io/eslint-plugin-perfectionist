import type { CollectionEntry } from 'astro:content'
import type { Root as MdastRoot } from 'mdast'
import type { Parent, Node } from 'unist'

import { toString as mdastToString } from 'mdast-util-to-string'
import { SKIP as skip, visit } from 'unist-util-visit'
import remarkFrontmatter from 'remark-frontmatter'
import { toText } from 'hast-util-to-text'
import remarkRehype from 'remark-rehype'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import { unified } from 'unified'

export interface SearchIndexItem {
  collection: SearchCollection
  headings: string[]
  title: string
  body: string
  slug: string
}

export type SearchCollection = 'configs' | 'guide' | 'rules'

let slugPrefix: Record<SearchCollection, string> = {
  configs: '/configs',
  guide: '/guide',
  rules: '/rules',
}

export async function createSearchIndexItem<T extends SearchCollection>(
  collection: T,
  entry: CollectionEntry<T>,
): Promise<SearchIndexItem> {
  let body = entry.body ?? ''
  let { mdast, text } = await mdxToPlainText(body)

  return {
    slug: `${slugPrefix[collection]}/${entry.id}`,
    headings: getHeadings(mdast),
    title: entry.data.title,
    body: text,
    collection,
  }
}

function stripJsx(tree: Node): void {
  visit(
    tree,
    [
      'mdxJsxFlowElement',
      'mdxJsxTextElement',
      'mdxjsEsm',
      'mdxFlowExpression',
      'mdxTextExpression',
    ],
    (node, index, parent) => {
      if (typeof index !== 'number') {
        return
      }

      let parentNode = parent as Parent
      let nodeWithChildren = node as Parent
      let children =
        Array.isArray(nodeWithChildren.children) ?
          nodeWithChildren.children
        : []

      parentNode.children.splice(index, 1, ...children)
      return [skip, index]
    },
  )
}

async function mdxToPlainText(
  mdx: string,
): Promise<{ mdast: MdastRoot; text: string }> {
  let parser = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkGfm)
    .use(remarkFrontmatter, ['yaml'])

  let mdast = parser.parse(mdx)

  stripFrontmatter(mdast)
  stripJsx(mdast)

  let hast = await unified().use(remarkRehype).run(mdast)
  let text = toText(hast)

  return { text: normalizeWhitespace(text), mdast }
}

function stripFrontmatter(tree: Node): void {
  visit(tree, 'yaml', (_node, index, parent) => {
    if (typeof index !== 'number') {
      return
    }

    ;(parent as Parent).children.splice(index, 1)
    return [skip, index]
  })
}

function getHeadings(tree: MdastRoot): string[] {
  let headings: string[] = []

  visit(tree, 'heading', node => {
    headings.push(normalizeWhitespace(mdastToString(node)))
  })

  return headings
}

function normalizeWhitespace(value: string): string {
  return value.replaceAll('\u00A0', ' ').replaceAll(/\s+/gu, ' ').trim()
}
