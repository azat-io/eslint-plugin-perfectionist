import type { Context, Config } from '@netlify/edge-functions'

const COLLECTION_PATH_PREFIXES = ['/configs/', '/guide/', '/rules/']

const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8'

export default async function markdownNegotiation(
  request: Request,
  context: Context,
): Promise<Response> {
  let url = new URL(request.url)
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

    if (isMarkdownResponse(markdownResponse)) {
      return createMarkdownResponse(markdownResponse)
    }
  }

  let response = await context.next()
  if (response.status !== 404) {
    return response
  }

  let markdownResponse = await fetchMarkdownResponse(
    '/404.md',
    request,
    requestHeaders,
  )
  if (!isMarkdownResponse(markdownResponse)) {
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
  method: 'GET',
  path: '/*',
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

function createMarkdownResponse(
  markdownResponse: Response,
  status = markdownResponse.status,
  statusText = markdownResponse.statusText,
): Response {
  let headers = new Headers(markdownResponse.headers)
  headers.set('content-type', MARKDOWN_CONTENT_TYPE)
  headers.set('vary', appendHeaderValue(headers.get('vary'), 'Accept'))

  return new Response(markdownResponse.body, {
    statusText,
    headers,
    status,
  })
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

function isMarkdownResponse(response: Response): boolean {
  return (
    response.ok &&
    response.headers.get('content-type')?.startsWith('text/markdown') === true
  )
}

function normalizePathname(pathname: string): string {
  if (pathname === '/' || !pathname.endsWith('/')) {
    return pathname
  }

  return pathname.slice(0, -1)
}

function hasFileExtension(pathname: string): boolean {
  let lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1)
  return lastSegment.includes('.')
}
