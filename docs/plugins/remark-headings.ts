import type { Transformer, Plugin } from 'unified'
import type { Literal, Parent, Node } from 'unist'
import type { Heading, Root } from 'mdast'

import { visit } from 'unist-util-visit'

export let remarkHeadings: Plugin<[], Root> =
  (): Transformer<Root> => (tree: Node) => {
    visit(tree, (node: Node, index: undefined | number, parent: Parent) => {
      if (
        node.type === 'heading' &&
        ((node as Heading).depth === 2 || (node as Heading).depth === 3) &&
        typeof index === 'number'
      ) {
        let text = ((node as Heading).children[0] as Literal).value as string
        let id = text
          .replaceAll(/\p{P}/gu, '')
          .replaceAll(/\s{2,}/g, ' ')
          .replaceAll(' ', '-')
          .toLowerCase()
        let { depth } = node as Heading
        let newNode = {
          value: `<h${depth} id="${id}">
            <a href="#${id}" aria-label="${text}" class="heading-anchor">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 20L10 4M14 20L17 4M19.5 15H3.5M20.5 9L4.5 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
            ${text}
          </h${depth}>`,
          type: 'html',
        }

        parent.children[index] = newNode
      }
    })
  }
