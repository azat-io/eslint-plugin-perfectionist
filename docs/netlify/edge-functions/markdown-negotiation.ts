import type { Context, Config } from '@netlify/edge-functions'

const COLLECTION_PATH_PREFIXES = ['/configs/', '/guide/', '/rules/']

/* Hosts that _redirects force-redirects to the canonical domain. Edge
functions run before redirects, so they must be skipped here explicitly. */
const LEGACY_HOSTNAMES = new Set([
  'eslint-plugin-perfectionist.netlify.app',
  'eslint-plugin-perfectionist.azat.io',
])

/* Headers that must not influence the fallback fetch of /404.md: its body
is always served whole, with the status rewritten to the original 404. */
const FALLBACK_IGNORED_HEADERS = [
  'if-modified-since',
  'if-none-match',
  'if-range',
  'range',
]

const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8'

export default async function markdownNegotiation(
  request: Request,
  context: Context,
): Promise<Response> {
  let url = new URL(request.url)
  if (
    LEGACY_HOSTNAMES.has(url.hostname) ||
    !prefersMarkdown(request.headers.get('accept'))
  ) {
    return context.next()
  }

  let pathname = normalizePathname(url.pathname)
  let markdownPath = getMarkdownPath(pathname)
  let requestHeaders = new Headers(request.headers)
  requestHeaders.delete('accept')

  if (markdownPath) {
    let markdownResponse = await fetchMarkdownResponse(
      markdownPath,
      request,
      requestHeaders,
    )

    /* A 304 can only come from the client's own conditional headers, so it
    revalidates the markdown variant the client already has cached. The
    subresponse status is forwarded because /404.md is served with 404 by the
    dev server but as a static 200 file by the production build. */
    if (
      markdownResponse.status === 304 ||
      hasMarkdownContentType(markdownResponse)
    ) {
      return createMarkdownResponse(markdownResponse)
    }
  }

  let response = await context.next()
  if (response.status !== 404) {
    return response
  }

  for (let ignoredHeader of FALLBACK_IGNORED_HEADERS) {
    requestHeaders.delete(ignoredHeader)
  }

  let markdownResponse = await fetchMarkdownResponse(
    '/404.md',
    request,
    requestHeaders,
  )
  if (!hasMarkdownContentType(markdownResponse)) {
    return response
  }

  return createMarkdownResponse(
    markdownResponse,
    response.status,
    response.statusText,
  )
}

export const config: Config = {
  header: {
    accept: String.raw`text\/markdown`,
  },
  excludedPath: ['/_astro/*', '/fonts/*'],
  /* HEAD cannot be declared: the deploy-time manifest schema
  (@netlify/edge-bundler) only accepts GET/POST/PUT/PATCH/DELETE/OPTIONS. */
  method: 'GET',
  path: '/*',
}

function createMarkdownResponse(
  markdownResponse: Response,
  status = markdownResponse.status,
  statusText = markdownResponse.statusText,
): Response {
  let headers = new Headers(markdownResponse.headers)
  /* Fetch decodes the body, so the original framing headers no longer
  describe it; the platform recomputes them. */
  headers.delete('content-encoding')
  headers.delete('content-length')
  headers.set('content-type', MARKDOWN_CONTENT_TYPE)
  headers.set('vary', appendHeaderValue(headers.get('vary'), 'Accept'))

  return new Response(markdownResponse.body, {
    statusText,
    headers,
    status,
  })
}

function getMarkdownPath(pathname: string): string | null {
  if (pathname !== '/' && hasFileExtension(pathname)) {
    return null
  }

  if (pathname === '/') {
    return '/index.md'
  }

  if (pathname === '/404') {
    return '/404.md'
  }

  if (pathname === '/configs') {
    return '/configs.md'
  }

  if (pathname === '/guide') {
    return '/guide.md'
  }

  if (pathname === '/rules') {
    return '/rules.md'
  }

  for (let prefix of COLLECTION_PATH_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return `${pathname}.md`
    }
  }

  return null
}

function mediaTypeQuality(acceptHeader: string, mediaType: string): number {
  let type = mediaType.slice(0, mediaType.indexOf('/'))
  let bestSpecificity = -1
  let quality = 0

  for (let range of acceptHeader.split(',')) {
    let [mediaRange, ...parameters] = range.trim().toLowerCase().split(';') as [
      string,
      ...string[],
    ]
    let specificity = getSpecificity(mediaRange.trim(), mediaType, type)
    if (specificity > bestSpecificity) {
      bestSpecificity = specificity
      quality = parseQuality(parameters)
    }
  }

  return quality
}

function parseQuality(parameters: string[]): number {
  for (let parameter of parameters) {
    let separatorIndex = parameter.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }
    if (parameter.slice(0, separatorIndex).trim() !== 'q') {
      continue
    }
    let quality = Number.parseFloat(parameter.slice(separatorIndex + 1))
    return Number.isNaN(quality) ? 0 : Math.min(Math.max(quality, 0), 1)
  }
  return 1
}

function appendHeaderValue(
  currentValue: string | null,
  valueToAppend: string,
): string {
  if (!currentValue) {
    return valueToAppend
  }

  let values = currentValue.split(',').map(value => value.trim())
  if (values.includes(valueToAppend)) {
    return currentValue
  }

  return `${currentValue}, ${valueToAppend}`
}

async function fetchMarkdownResponse(
  pathname: string,
  request: Request,
  headers: Headers,
): Promise<Response> {
  let markdownUrl = new URL(request.url)
  markdownUrl.pathname = pathname

  return fetch(
    new Request(markdownUrl, {
      method: request.method,
      headers,
    }),
  )
}

/* The config header matcher is only a coarse substring filter: it also
matches Accept headers that rank markdown below HTML or refuse it with q=0.
It is load-bearing too: it guarantees the client named text/markdown
explicitly, which is why wildcard ties may resolve toward markdown here. */
function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) {
    return false
  }
  let markdownQuality = mediaTypeQuality(acceptHeader, 'text/markdown')
  return (
    markdownQuality > 0 &&
    markdownQuality >= mediaTypeQuality(acceptHeader, 'text/html')
  )
}

function getSpecificity(
  mediaRange: string,
  mediaType: string,
  type: string,
): number {
  if (mediaRange === mediaType) {
    return 2
  }
  if (mediaRange === `${type}/*`) {
    return 1
  }
  if (mediaRange === '*/*') {
    return 0
  }
  return -1
}

function normalizePathname(pathname: string): string {
  if (pathname === '/' || !pathname.endsWith('/')) {
    return pathname
  }

  return pathname.slice(0, -1)
}

function hasMarkdownContentType(response: Response): boolean {
  return (
    response.headers.get('content-type')?.startsWith('text/markdown') === true
  )
}

function hasFileExtension(pathname: string): boolean {
  let lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1)
  return lastSegment.includes('.')
}
