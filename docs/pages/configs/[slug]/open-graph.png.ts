import type { CollectionEntry } from 'astro:content'

import { getCollection } from 'astro:content'

import { openGraph } from '../../../utils/open-graph'

interface Props {
  props: CollectionEntry<'configs'>
  params: {
    slug: string
  }
}

export let GET = async ({ props }: Props) => await openGraph(props.slug)

export let getStaticPaths = async () => {
  let rules = await getCollection('configs')
  return rules.map(currentRule => ({
    params: {
      slug: currentRule.slug,
    },
    props: currentRule,
  }))
}
