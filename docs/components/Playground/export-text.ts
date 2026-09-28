import type { SortingOrder, LintProblem, SortingType } from './lint-config'

import { REQUIRED_OPTIONS } from './rule-options'
import { formatValue } from './config-snippet'

/**
 * State of the Playground that the exported texts describe.
 */
export interface ExportInput {
  /**
   * Code after every autofix pass, or `null` when the last lint could not run.
   */
  output: string | null

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
   * Sorting order from the controls.
   */
  order: SortingOrder

  /**
   * Sorting type from the controls.
   */
  type: SortingType

  /**
   * Code after every autofix pass.
   */
  output: string

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
 * nothing.
 *
 * @param input - Rule, code, output and problems.
 * @returns TypeScript source for `test/rules/<rule>.test.ts`.
 */
export function toRuleTest({
  problems,
  output,
  order,
  rule,
  type,
  code,
}: RuleTestInput): string {
  let options = formatValue({ order, type, ...REQUIRED_OPTIONS[rule] })
  let errors = problems.filter(problem => problem.messageId)
  if (errors.length === 0) {
    return [
      'await valid({',
      `  code: ${toDedent(code)},`,
      `  options: [${options}],`,
      '})',
      '',
    ].join('\n')
  }
  return [
    'await invalid({',
    `  output: ${toDedent(output)},`,
    `  code: ${toDedent(code)},`,
    '  errors: [',
    ...errors.flatMap(problem => [
      '    {',
      `      data: ${formatValue(problem.data ?? {})},`,
      `      messageId: '${problem.messageId}',`,
      '    },',
    ]),
    '  ],',
    `  options: [${options}],`,
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
 * what the Playground produced, with an empty block for the expected output.
 *
 * @param input - Playground state.
 * @returns Markdown text.
 */
export function toIssueBody({ output, config, code }: ExportInput): string {
  return [
    'Input:',
    '',
    fence(code, 'tsx'),
    '',
    'Config:',
    '',
    fence(config, 'js'),
    ...(output === null ? [] : ['', 'Output:', '', fence(output, 'tsx')]),
    '',
    'Expected output:',
    '',
    fence('', 'tsx'),
  ].join('\n')
}

/**
 * Writes code as a `dedent` template literal indented for a test case.
 *
 * @param text - Code.
 * @returns Template literal source.
 */
function toDedent(text: string): string {
  let lines = text
    .replace(/\n$/u, '')
    .replaceAll('\\', '\\\\')
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
    ...text.matchAll(/`+/gu).map(match => match[0].length),
  )
  let marks = '`'.repeat(Math.max(3, longest + 1))
  return [`${marks}${lang}`, text.replace(/\n$/u, ''), marks].join('\n')
}
