import type { ImageResponse } from '@vercel/og'

import { openGraph } from '../../utils/open-graph'

export let GET = async (): Promise<ImageResponse> => await openGraph('Rules')
