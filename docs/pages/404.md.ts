import type { APIRoute } from 'astro'

const BODY = [
  '# Page Not Found',
  '',
  'The requested page could not be found.',
  '',
  '- [Go to the homepage](/index.md)',
  '- [Open the HTML homepage](/)',
  '',
]

export const GET: APIRoute = () =>
  new Response(BODY.join('\n'), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
    },
  })
