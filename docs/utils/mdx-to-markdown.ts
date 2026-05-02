import type { Parent, Node } from 'unist'
import type { Plugin } from 'unified'

import { SKIP as skip, visit } from 'unist-util-visit'
import remarkFrontmatter from 'remark-frontmatter'
import remarkStringify from 'remark-stringify'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMdx from 'remark-mdx'
import { unified } from 'unified'
import dedent from 'dedent'

interface JsxElement extends Parent {
  type: 'mdxJsxFlowElement' | 'mdxJsxTextElement'
  attributes: JsxAttribute[]
  name: string | null
}

interface JsxAttributeValueExpression {
  type: 'mdxJsxAttributeValueExpression'
  data?: { estree?: EstreeProgram }
  value: string
}

interface JsxAttribute {
  value: JsxAttributeValueExpression | string | null
  type: 'mdxJsxAttribute'
  name: string
}

interface TemplateLiteralExpression extends EstreeNode {
  quasis: TemplatePart[]
}

interface EstreeNode {
  [key: string]: unknown
  type: string
}

interface EstreeProgram {
  body: { expression: EstreeNode }[]
}

interface CodeTab {
  source: string
  name?: string
}

interface TemplatePart {
  value: { cooked: string }
}

// Cspell:ignore quasis
const AST_TEMPLATE_PARTS_KEY = 'quasis' as const

const TRANSFORMERS: Record<
  string,
  ((node: JsxElement) => Node[] | null) | undefined
> = {
  CodeExample: transformCodeExample,
  Important: transformImportant,
  CodeTabs: transformCodeTabs,
}

export async function mdxToMarkdown(mdx: string): Promise<string> {
  let file = await unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkGfm)
    .use(remarkFrontmatter, ['yaml'])
    .use(transformMdxNodes)
    .use(remarkStringify, {
      listItemIndent: 'one',
      fences: true,
      bullet: '-',
    })
    .process(mdx)
  return String(file)
}

let transformMdxNodes: Plugin = () => tree => {
  removeNodes(tree, ['yaml', 'mdxjsEsm'])

  visit(
    tree,
    'mdxJsxFlowElement',
    (node, index, parent: undefined | Parent) => {
      if (typeof index !== 'number' || !parent) {
        return
      }
      let element = node as JsxElement
      let transform = element.name ? TRANSFORMERS[element.name] : undefined
      let replacement = transform ? transform(element) : null
      let nextChildren =
        replacement ?? (Array.isArray(element.children) ? element.children : [])
      let nextIndex = (index as number) + nextChildren.length
      parent.children.splice(index, 1, ...nextChildren)
      return [skip, replacement ? nextIndex : index]
    },
  )

  for (let type of [
    'mdxJsxTextElement',
    'mdxFlowExpression',
    'mdxTextExpression',
  ]) {
    visit(tree, type, (node, index, parent: undefined | Parent) => {
      if (typeof index !== 'number' || !parent) {
        return
      }
      let nodeWithChildren = node as Parent
      let children =
        Array.isArray(nodeWithChildren.children) ?
          nodeWithChildren.children
        : []
      parent.children.splice(index, 1, ...children)
      return [skip, index]
    })
  }
}

function getCodeTabsAttribute(node: JsxElement): CodeTab[] | null {
  let attribute = findAttribute(node, 'code')
  if (!attribute || typeof attribute.value !== 'object' || !attribute.value) {
    return null
  }
  let expression = attribute.value.data?.estree?.body[0]?.expression
  if (expression?.type !== 'ArrayExpression') {
    return null
  }
  let elements = expression['elements'] as (EstreeNode | null)[]
  let tabs: CodeTab[] = []
  for (let element of elements) {
    if (element?.type !== 'ObjectExpression') {
      continue
    }
    let properties = element['properties'] as EstreeNode[]
    let parsed: { source?: string; name?: string } = {}
    for (let property of properties) {
      if (property.type !== 'Property') {
        continue
      }
      let key = readPropertyKey(property['key'] as EstreeNode)
      if (!key) {
        continue
      }
      let value = resolveStringExpression(property['value'] as EstreeNode)
      if (value === null) {
        continue
      }
      if (key === 'source') {
        parsed.source = value
      } else if (key === 'name') {
        parsed.name = value
      }
    }
    if (parsed.source !== undefined) {
      tabs.push({ source: parsed.source, name: parsed.name })
    }
  }
  return tabs
}

function resolveStringExpression(
  expression: EstreeNode | undefined | null,
): string | null {
  if (!expression) {
    return null
  }
  if (
    expression.type === 'Literal' &&
    typeof expression['value'] === 'string'
  ) {
    return expression['value']
  }
  if (expression.type === 'TemplateLiteral') {
    let templateParts = (expression as TemplateLiteralExpression)[
      AST_TEMPLATE_PARTS_KEY
    ]
    return templateParts.map(part => part.value.cooked).join('')
  }
  if (expression.type === 'TaggedTemplateExpression') {
    let tag = expression['tag'] as EstreeNode
    if (tag.type === 'Identifier' && tag['name'] === 'dedent') {
      let templateLiteral = expression['quasi'] as TemplateLiteralExpression
      let raw = templateLiteral[AST_TEMPLATE_PARTS_KEY].map(
        part => part.value.cooked,
      ).join('')
      return dedent(raw)
    }
  }
  return null
}

function transformCodeExample(node: JsxElement): Node[] {
  let lang = getStringAttribute(node, 'lang') ?? 'ts'
  let variants = [
    { value: getStringAttribute(node, 'initial'), label: 'Initial' },
    {
      value: getStringAttribute(node, 'alphabetical'),
      label: 'Sorted alphabetically',
    },
    {
      value: getStringAttribute(node, 'lineLength'),
      label: 'Sorted by line length',
    },
  ]

  let result: Node[] = []
  for (let { value, label } of variants) {
    if (!value) {
      continue
    }
    result.push(buildLabel(label), buildCodeBlock(lang, value))
  }
  return result
}

function getStringAttribute(node: JsxElement, name: string): string | null {
  let attribute = findAttribute(node, name)
  if (!attribute) {
    return null
  }
  if (typeof attribute.value === 'string') {
    return attribute.value
  }
  if (attribute.value === null) {
    return ''
  }
  let expression = attribute.value.data?.estree?.body[0]?.expression
  return resolveStringExpression(expression)
}

function transformCodeTabs(node: JsxElement): Node[] | null {
  let lang = getStringAttribute(node, 'lang') ?? null
  let tabs = getCodeTabsAttribute(node)
  if (!tabs || tabs.length === 0) {
    return null
  }

  let result: Node[] = []
  for (let { source, name } of tabs) {
    if (name) {
      result.push(buildLabel(name))
    }
    result.push(buildCodeBlock(lang, source))
  }
  return result
}

function readPropertyKey(key: EstreeNode | undefined | null): string | null {
  if (!key) {
    return null
  }
  if (key.type === 'Identifier' && typeof key['name'] === 'string') {
    return key['name']
  }
  if (key.type === 'Literal' && typeof key['value'] === 'string') {
    return key['value']
  }
  return null
}

function removeNodes(tree: Node, types: string[]): void {
  for (let type of types) {
    visit(tree, type, (_node, index, parent: undefined | Parent) => {
      if (typeof index !== 'number' || !parent) {
        return
      }
      parent.children.splice(index, 1)
      return [skip, index]
    })
  }
}

function transformImportant(node: JsxElement): Node[] {
  let title = getStringAttribute(node, 'title') ?? 'Important'
  let children = Array.isArray(node.children) ? node.children : []
  return [
    {
      children: [buildLabel(title), ...children],
      type: 'blockquote',
    } as Node,
  ]
}

function findAttribute(node: JsxElement, name: string): JsxAttribute | null {
  if (!Array.isArray(node.attributes)) {
    return null
  }
  for (let attribute of node.attributes) {
    if (attribute.name === name) {
      return attribute
    }
  }
  return null
}

function buildLabel(text: string): Node {
  return {
    children: [
      {
        children: [{ type: 'text', value: text }],
        type: 'strong',
      },
    ],
    type: 'paragraph',
  } as Node
}

function buildCodeBlock(lang: string | null, value: string): Node {
  return { type: 'code', value, lang } as Node
}
