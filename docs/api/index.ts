import type { Linter } from 'eslint'

export let eslint = async (
  code: string,
  settings: Record<string, unknown>,
): Promise<Linter.LintMessage[]> => {
  if (!code) {
    return []
  }

  let response = await fetch('/.netlify/functions/eslint', {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      settings,
      code,
    }),
    method: 'POST',
  })

  let json = (await response.json()) as Partial<
    Record<'result', Linter.LintMessage[]>
  >

  if (json.result) {
    return json.result
  }

  return []
}
