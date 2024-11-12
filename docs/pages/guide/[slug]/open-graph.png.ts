import type { CollectionEntry } from 'astro:content'
import type { ImageResponse } from '@vercel/og'

import { getCollection } from 'astro:content'

import { openGraph } from '../../../utils/open-graph'

interface Props {
  props: CollectionEntry<'guide'>
  params: {
    slug: string
  }
}

export let GET = async ({ props }: Props): Promise<ImageResponse> =>
  await openGraph(props.slug)

export let getStaticPaths = async (): Promise<
  {
    params: {
      slug: string
    }
    props: CollectionEntry<'guide'>
  }[]
> => {
  let rules = await getCollection('guide')
  return rules.map(currentRule => ({
    params: {
      slug: currentRule.slug,
    },
    props: currentRule,
  }))
}
