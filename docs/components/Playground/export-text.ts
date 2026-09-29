import type { AppliedConfig, LintProblem } from './lint-config'

import { withSorting, formatValue, pickSorting } from './config-snippet'
import { getDefaultOptions } from './rule-options'

/**
 * State of the Playground that the exported texts describe.
 */
export interface ExportInput {
  /**
   * Code after every autofix pass, or `null` when the last lint could not run.
   */
  output: string | null

  /**
   * Message of a crash or an internal error, or `null` when there was none.
   */
  error: string | null

  /**
   * Link to this state, or `null` when the code does not fit into a link.
   */
  link: string | null

  /**
   * Versions the Playground runs, such as `ESLint 10.11.0, ...`.
   */
  versions: string

  /**
   * `eslint.config.js` that lints the way the Playground does.
   */
  config: string

  /**
   * Code in the editor.
   */
  code: string
}

/**
 * Current state of one rule, for a rule test.
 */
export interface RuleTestInput {
  /**
   * Problems the rule reported for `code`, with message ids and data.
   */
  problems: LintProblem[]

  /**
   * Rule setup the code was linted with.
   */
  config: AppliedConfig

  /**
   * Code after every autofix pass.
   */
  output: string

  /**
   * The code has JSX, so the test has to enable it.
   */
  jsx: boolean

  /**
   * Rule name without the plugin prefix.
   */
  rule: string

  /**
   * Code in the editor.
   */
  code: string
}

/**
 * Builds a test case in the style of the plugin's rule tests: `invalid` with
 * the fixed output and the reported errors, or `valid` when the rule reports
 * nothing. The rule tester registers the rule as `rule-to-test/<rule>`, so
 * `eslint` comments in the code are renamed.
 *
 * @param input - Rule, code, output, problems and the rule setup.
 * @returns TypeScript source for `test/rules/<rule>.test.ts`.
 */
export function toRuleTest({
  problems,
  config,
  output,
  rule,
  code,
  jsx,
}: RuleTestInput): string {
  let sorting = pickSorting(config.settings)
  let otherSettings = Object.fromEntries(
    Object.entries(config.settings).filter(
      ([key]) => !Object.hasOwn(sorting, key),
    ),
  )
  let options: unknown[]
  let settings: Record<string, unknown> | null = null
  if (Object.hasOwn(config.inline, rule)) {
    /*
     * The comment in the code replaces the options of the case, so the
     * sorting goes to the shared settings, as in the Playground.
     */
    options = getDefaultOptions(rule)
    settings = { ...sorting, ...otherSettings }
  } else {
    options = withSorting(config.options ?? [], sorting)
    if (Object.keys(otherSettings).length > 0) {
      settings = otherSettings
    }
  }
  let extra = [
    ...(options.length > 0 ?
      [`  options: ${formatValue(options, 2, 'options: '.length)},`]
    : []),
    ...(settings ?
      [
        `  settings: ${formatValue({ perfectionist: settings }, 2, 'settings: '.length)},`,
      ]
    : []),
    ...(jsx ? ['  parserOptions: { ecmaFeatures: { jsx: true } },'] : []),
  ]
  let errors = problems.filter(problem => problem.messageId)
  if (errors.length === 0) {
    return [
      'await valid({',
      `  code: ${toTestCode(renameRule(code, rule))},`,
      ...extra,
      '})',
      '',
    ].join('\n')
  }
  return [
    'await invalid({',
    `  output: ${toTestCode(renameRule(output, rule))},`,
    `  code: ${toTestCode(renameRule(code, rule))},`,
    '  errors: [',
    ...errors.flatMap(problem => [
      '    {',
      `      data: ${formatValue(problem.data ?? {}, 6, 'data: '.length)},`,
      `      messageId: '${problem.messageId}',`,
      '    },',
    ]),
    '  ],',
    ...extra,
    '})',
    '',
  ].join('\n')
}

/**
 * Builds a Markdown summary to paste into a chat or an issue comment.
 *
 * @param input - Playground state.
 * @returns Markdown text.
 */
export function toMarkdown({
  versions,
  output,
  config,
  error,
  link,
  code,
}: ExportInput): string {
  return [
    `**ESLint Plugin Perfectionist Playground** (${versions})`,
    '',
    'Input:',
    '',
    fence(code, 'tsx'),
    ...(output === null || output === code ?
      []
    : ['', 'Output:', '', fence(output, 'tsx')]),
    ...(error === null ? [] : ['', 'Error:', '', fence(error, 'text')]),
    '',
    'Config:',
    '',
    fence(config, 'js'),
    ...(link ? ['', `[Open in the Playground](${link})`] : []),
    '',
  ].join('\n')
}

/**
 * Builds the "Code example" field of a bug report: the input, the config and
 * what the Playground produced, with an empty block for the expected output. A
 * crash report gets the error instead.
 *
 * @param input - Playground state.
 * @returns Markdown text.
 */
export function toIssueBody({
  output,
  config,
  error,
  code,
}: ExportInput): string {
  let result =
    error === null ?
      [
        ...(output === null ? [] : ['', 'Output:', '', fence(output, 'tsx')]),
        '',
        'Expected output:',
        '',
        fence('', 'tsx'),
      ]
    : ['', 'Error:', '', fence(error, 'text')]
  return [
    'Input:',
    '',
    fence(code, 'tsx'),
    '',
    'Config:',
    '',
    fence(config, 'js'),
    ...result,
  ].join('\n')
}

/**
 * Writes code for a test case: a `dedent` template literal, as the rule tests
 * do. `dedent` reads the raw text and keeps backslashes doubled, so code with a
 * backslash becomes a plain string literal instead.
 *
 * @param text - Source to put into the test case.
 * @returns Source of the literal.
 */
function toTestCode(text: string): string {
  let trimmed = text.replace(/\n$/u, '')
  if (trimmed.includes('\\')) {
    return JSON.stringify(trimmed)
  }
  let lines = trimmed
    .replaceAll('`', '\\`')
    .replaceAll('${', '\\${')
    .split('\n')
    .map(line => (line ? `    ${line}` : ''))
  return ['dedent`', ...lines, '  `'].join('\n')
}

/**
 * Wraps text in a fenced code block that is longer than any backtick run inside
 * it.
 *
 * @param text - Block content.
 * @param lang - Language of the block.
 * @returns Fenced block.
 */
function fence(text: string, lang: string): string {
  let longest = Math.max(
    0,
    ...Array.from(text.matchAll(/`+/gu), match => match[0].length),
  )
  let marks = '`'.repeat(Math.max(3, longest + 1))
  return [`${marks}${lang}`, text.replace(/\n$/u, ''), marks].join('\n')
}

/**
 * Points `eslint` comments about the rule to the name the rule tester gives it.
 *
 * @param text - Code.
 * @param rule - Rule name without the plugin prefix.
 * @returns Code with `perfectionist/<rule>` renamed to `rule-to-test/<rule>`.
 */
function renameRule(text: string, rule: string): string {
  return text.replaceAll(
    new RegExp(String.raw`perfectionist/${rule}(?![\w-])`, 'gu'),
    `rule-to-test/${rule}`,
  )
}
