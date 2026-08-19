import { createMarkdownEndpoint } from '../../utils/markdown-response'

export const { getStaticPaths, GET } = createMarkdownEndpoint('guide')
