import { defineCollection, z } from 'astro:content'

let guide = defineCollection({
  schema: z.object({
    keywords: z.array(z.string()).optional(),
    description: z.string(),
    title: z.string(),
  }),
  type: 'content',
})

let configs = defineCollection({
  schema: z.object({
    keywords: z.array(z.string()).optional(),
    shortDescription: z.string(),
    description: z.string(),
    title: z.string(),
  }),
  type: 'content',
})

let rules = defineCollection({
  schema: z.object({
    keywords: z.array(z.string()).optional(),
    shortDescription: z.string(),
    description: z.string(),
    title: z.string(),
  }),
  type: 'content',
})

export let collections = {
  configs,
  guide,
  rules,
}
