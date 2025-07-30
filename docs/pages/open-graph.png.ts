import type { ImageResponse } from '@vercel/og'

import { openGraph } from '../utils/open-graph'

export async function GET(): Promise<ImageResponse> {
  return await openGraph('Take Your Code to a Beauty Salon')
}
