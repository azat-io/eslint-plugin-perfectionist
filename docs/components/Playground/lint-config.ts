import type { ESLint, Linter, Rule } from 'eslint'

import { REQUIRED_OPTIONS } from './rule-options'
import perfectionist from '../../../index'

export interface LintProblem {
  /**
   * Values the message text is built from, keyed as in the message template.
   * Rule tests list them in `errors`.
   */
  data?: Record<string, string>

  /**
   * Groups of the two elements a sorting problem is about. Left out when the
   * rule has no groups for them.
   */
  groups?: ProblemGroups

  /**
   * Rule that reported the problem, such as `perfectionist/sort-imports`, or
   * `null` for a parse error.
   */
  ruleId: string | null

  /**
   * Id of the message in the rule's `meta.messages`. Left out for parse errors.
   */
  messageId?: string

  /**
   * 1-based column where the problem ends, exclusive.
   */
  endColumn: number

  /**
   * Text ESLint shows for the problem.
   */
  message: string

  /**
   * 1-based line where the problem ends.
   */
  endLine: number

  /**
   * 1-based column where the problem starts.
   */
  column: number

  /**
   * 1-based line where the problem starts.
   */
  line: number
}

/**
 * Names of the two elements a problem is about and the groups they belong to.
 * `right` should come before `left`.
 */
export interface ProblemGroups {
  /**
   * Name of the element that should come first, as in the message.
   */
  rightName: string

  /**
   * Name of the element that should come after it.
   */
  leftName: string

  /**
   * Group of the element that should come first.
   */
  right: string

  /**
   * Group of the element that should come after it.
   */
  left: string
}

/**
 * Outcome of one lint request.
 *
 * - `result`: the code parsed and the rules ran. `output` is the code after every
 *   autofix pass; `remaining` counts plugin problems autofix left.
 * - `parse-error`: the code is not valid TSX.
 * - `config-error`: ESLint rejected the rule setup. `inline` is set when the code
 *   carries its own `eslint perfectionist/…` directive, which is the user's
 *   mistake rather than a playground bug.
 * - `crash`: a rule threw on valid code and settings, which is a plugin bug.
 * - `internal`: ESLint reported a problem with no rule, for example the filename
 *   matched no config. This is a playground bug.
 */
export type LintResult =
  | {
      problems: LintProblem[]
      notices: LintNotices
      remaining: number
      kind: 'result'
      output: string
    }
  | {
      kind: 'config-error'
      message: string
      inline: boolean
    }
  | {
      kind: 'internal' | 'crash'
      message: string
    }
  | {
      problem: LintProblem
      kind: 'parse-error'
    }

export type WorkerMessage =
  | {
      kind: 'load-failed'
      message: string
    }
  | ({
      id: number
      ms: number
    } & LintResult)
  | {
      eslint: string
      kind: 'ready'
    }

export type LintRequest = Omit<LintConfigOptions, 'parser'> & {
  code: string
  id: number
}

export type SortingType = 'alphabetical' | 'line-length' | 'natural'

export type SortingOrder = 'desc' | 'asc'

interface LintNotices {
  /**
   * Messages about `eslint perfectionist/…` comments with invalid options.
   * ESLint ignores such a comment and keeps linting.
   */
  invalidInlineConfig: string[]

  /**
   * Problems ESLint found in other comments of the code, such as the removed
   * `eslint-env` or a malformed `eslint` comment. Rules still run.
   */
  directives: string[]

  /**
   * Reports for rules outside Perfectionist or for unknown rule names, for
   * example from an `eslint-disable` comment copied from another project.
   */
  foreignRules: number
}

interface LintConfigOptions {
  parser: Linter.Parser
  /**
   * Rule name without the plugin prefix, or `null` for every rule of the
   * recommended configs.
   */
  rule: string | null
  order: SortingOrder
  type: SortingType
}

type LintEngine = Pick<Linter, 'verifyAndFix' | 'verify'>

const PLAYGROUND_FILENAME = '/playground/input.tsx'

let pluginPrefix = 'perfectionist/'

let inlineConfigPrefix = 'Inline configuration for rule'

let unknownRulePrefix = 'Definition for rule'

/**
 * A report a rule made during the last `verify`, with the data ESLint does not
 * pass on to lint messages.
 */
interface CapturedReport {
  /**
   * Message data the rule passed, with every value as a string.
   */
  data: Record<string, string>

  /**
   * Id of the reported message.
   */
  messageId: string

  /**
   * Full id of the rule, such as `perfectionist/sort-imports`.
   */
  ruleId: string

  /**
   * 1-based column of the reported node, as in the lint message.
   */
  column: number

  /**
   * 1-based line of the reported node.
   */
  line: number
}

/**
 * Reports collected while `verify` runs, or `null` outside of it.
 */
let capturedReports: CapturedReport[] | null = null

/**
 * The plugin with every rule wrapped so its reports are also collected. The
 * plugin itself stays untouched; only the playground sees the wrapper.
 */
let playgroundPlugin: ESLint.Plugin = {
  ...perfectionist,
  rules: Object.fromEntries(
    Object.entries(perfectionist.rules ?? {}).map(([name, rule]) => [
      name,
      captureReports(`${pluginPrefix}${name}`, rule),
    ]),
  ),
}

/**
 * Lints code and sorts ESLint's reports into what the playground shows.
 *
 * @param linter - ESLint `Linter` instance.
 * @param request - Code and rule settings, without the request id.
 * @param parser - TypeScript parser.
 * @returns The classified outcome.
 */
export function lintCode(
  linter: LintEngine,
  { code, ...options }: Omit<LintRequest, 'id'>,
  parser: Linter.Parser,
): LintResult {
  let config = createLintConfig({ ...options, parser })
  try {
    capturedReports = []
    let messages = linter.verify(code, config, PLAYGROUND_FILENAME)
    let reports = capturedReports
    capturedReports = null
    let parseError = messages.find(isParseError)
    if (parseError) {
      /*
       * A parser failure that is not a syntax error, such as a stack overflow,
       * has no position. Firefox still gives it a line in the parser bundle.
       */
      let located =
        Number.isFinite(parseError.line) && Number.isFinite(parseError.column)
      return located ?
          { problem: toParseProblem(parseError), kind: 'parse-error' }
        : { message: parseError.message, kind: 'internal' }
    }
    let setupError = messages.find(
      message =>
        message.ruleId === null &&
        message.message.startsWith('No matching configuration found'),
    )
    if (setupError) {
      return { message: setupError.message, kind: 'internal' }
    }

    let problems = messages
      .filter(isPluginProblem)
      .map(message => withReportData(toProblem(message), message, reports))
    let notices: LintNotices = {
      foreignRules: messages.filter(
        message =>
          message.ruleId !== null &&
          (!message.ruleId.startsWith(pluginPrefix) ||
            message.message.startsWith(unknownRulePrefix)),
      ).length,
      directives: messages
        .filter(message => message.ruleId === null)
        .map(message => message.message),
      invalidInlineConfig: messages
        .filter(isInlineConfigNotice)
        .map(message => message.message),
    }
    if (problems.length === 0) {
      return { kind: 'result', remaining: 0, output: code, problems, notices }
    }

    /*
     * The code and its comments passed the check above, so a failure here
     * comes from a rule on a later autofix pass.
     */
    let fixed: Linter.FixReport
    try {
      fixed = linter.verifyAndFix(code, config, PLAYGROUND_FILENAME)
    } catch (error) {
      return {
        message: `Autofix failed: ${toErrorMessage(error)}`,
        kind: 'crash',
      }
    }
    let brokenFix = fixed.messages.find(isParseError)
    if (brokenFix) {
      return {
        message: `Autofix produced code that doesn't parse: ${brokenFix.message.replace(/^Parsing error: /u, '')}`,
        kind: 'crash',
      }
    }
    return {
      remaining: fixed.messages.filter(isPluginProblem).length,
      output: fixed.output,
      kind: 'result',
      problems,
      notices,
    }
  } catch (error) {
    capturedReports = null
    return classifyError(toErrorMessage(error), () =>
      linter.verify(code, config, {
        filename: PLAYGROUND_FILENAME,
        allowInlineConfig: false,
      }),
    )
  }
}

/**
 * Adds the groups and the message data of the matching report to a problem.
 *
 * @param problem - Problem built from a lint message.
 * @param message - The lint message.
 * @param reports - Reports collected during `verify`.
 * @returns The problem with groups and data when a report matches.
 */
function withReportData(
  problem: LintProblem,
  message: Linter.LintMessage,
  reports: CapturedReport[],
): LintProblem {
  let index = reports.findIndex(
    report =>
      report.ruleId === message.ruleId &&
      report.messageId === message.messageId &&
      report.line === message.line &&
      report.column === message.column,
  )
  if (index === -1) {
    return problem
  }
  let [report] = reports.splice(index, 1)
  let { rightGroup, leftGroup, right, left } = report!.data
  let template = getMessageTemplate(report!.ruleId, report!.messageId)
  let used = new Set(
    template
      .matchAll(/\{\{\s*(?<key>\w+)\s*\}\}/gu)
      .map(match => match.groups!['key']!),
  )
  let data = Object.fromEntries(
    Object.entries(report!.data).filter(([key]) => used.has(key)),
  )
  let groups: ProblemGroups | null =
    (
      leftGroup !== undefined &&
      rightGroup !== undefined &&
      (leftGroup !== 'unknown' || rightGroup !== 'unknown')
    ) ?
      {
        rightName: right ?? '',
        leftName: left ?? '',
        right: rightGroup,
        left: leftGroup,
      }
    : null
  return {
    ...problem,
    ...(groups && { groups }),
    messageId: report!.messageId,
    data,
  }
}

/**
 * Wraps a rule so that its reports are collected while `verify` runs. Rules
 * pass the groups of both elements and the message data to `context.report`,
 * but ESLint keeps only the final text in lint messages.
 *
 * @param ruleId - Full rule id, such as `perfectionist/sort-imports`.
 * @param rule - Rule to wrap.
 * @returns A rule that reports the same problems.
 */
function captureReports(
  ruleId: string,
  rule: Rule.RuleModule,
): Rule.RuleModule {
  return {
    ...rule,
    create(context) {
      function report(descriptor: Rule.ReportDescriptor): void {
        let start = 'node' in descriptor ? descriptor.node.loc?.start : null
        let messageId =
          'messageId' in descriptor ? descriptor.messageId : undefined
        if (capturedReports && start && messageId && descriptor.data) {
          capturedReports.push({
            data: toStrings(descriptor.data),
            column: start.column + 1,
            line: start.line,
            messageId,
            ruleId,
          })
        }
        context.report(descriptor)
      }
      let wrapped: unknown = Object.create(context, {
        report: { value: report },
      })
      return rule.create(wrapped as Rule.RuleContext)
    },
  }

  function toStrings(data: Record<string, unknown>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)]),
    )
  }
}

/**
 * Builds the flat config the playground lints with.
 *
 * Sorting type and order go through `settings.perfectionist` instead of rule
 * options, so a single rule and the whole recommended set share one source of
 * truth.
 *
 * @param options - Rule selection, sorting settings and the parser to use.
 * @returns A flat config for `Linter#verify` with `PLAYGROUND_FILENAME`.
 */
function createLintConfig({
  parser,
  order,
  rule,
  type,
}: LintConfigOptions): Linter.Config[] {
  return [
    {
      languageOptions: {
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
          warnOnUnsupportedTypeScriptVersion: false,
        },
        sourceType: 'module',
        parser,
      },
      settings: {
        perfectionist: {
          order,
          type,
        },
      },
      linterOptions: {
        reportUnusedDisableDirectives: 'off',
      },
      rules: rule === null ? getRecommendedRules() : getRuleEntry(rule),
      plugins: {
        perfectionist: playgroundPlugin,
      },
      files: ['**/*.tsx'],
    },
  ]
}

/**
 * Maps an exception from linting to a result.
 *
 * ESLint throws for rule options it rejects, both from the config and from
 * `eslint` comments in the code. If linting succeeds with comments ignored, the
 * comment was the cause, which is the user's mistake rather than a bug.
 *
 * @param message - Error message without ESLint's location note.
 * @param lintWithoutComments - Runs `verify` with inline config disabled.
 * @returns A `config-error` or `crash` result.
 */
function classifyError(
  message: string,
  lintWithoutComments: () => unknown,
): LintResult {
  try {
    lintWithoutComments()
    return { kind: 'config-error', inline: true, message }
  } catch {
    if (
      message.startsWith('Key "rules"') ||
      message.startsWith('Error while loading rule')
    ) {
      return { kind: 'config-error', inline: false, message }
    }
    return { kind: 'crash', message }
  }
}

function toProblem(message: Linter.LintMessage): LintProblem {
  return {
    endColumn: message.endColumn ?? message.column,
    endLine: message.endLine ?? message.line,
    message: message.message,
    ruleId: message.ruleId,
    column: message.column,
    line: message.line,
  }
}

/**
 * Converts a parse error to a problem. The TypeScript parser reports 0-based
 * columns, while ESLint and rules use 1-based ones. The `Parsing error:` prefix
 * is dropped, because the status line already says so.
 *
 * @param message - Fatal ESLint message.
 * @returns Problem with 1-based columns.
 */
function toParseProblem(message: Linter.LintMessage): LintProblem {
  return {
    ...toProblem(message),
    message: message.message.replace(/^Parsing error: /u, ''),
    endColumn: (message.endColumn ?? message.column) + 1,
    column: message.column + 1,
  }
}

function getMessageTemplate(ruleId: string, messageId: string): string {
  let rule = perfectionist.rules?.[ruleId.slice(pluginPrefix.length)]
  let template = rule?.meta?.messages?.[messageId]
  return typeof template === 'string' ? template : ''
}

function getRecommendedRules(): Linter.RulesRecord {
  let recommendedRules = {
    ...perfectionist.configs['recommended-natural'].rules,
  }
  return Object.fromEntries(
    Object.keys(recommendedRules).map(ruleId => [ruleId, 'error']),
  )
}

function isPluginProblem(message: Linter.LintMessage): boolean {
  return (
    String(message.ruleId).startsWith(pluginPrefix) &&
    !message.message.startsWith(inlineConfigPrefix) &&
    !message.message.startsWith(unknownRulePrefix)
  )
}

function getRuleEntry(rule: string): Linter.RulesRecord {
  let requiredOptions = REQUIRED_OPTIONS[rule]
  return {
    [`perfectionist/${rule}`]:
      requiredOptions ? ['error', requiredOptions] : 'error',
  }
}

function isInlineConfigNotice(message: Linter.LintMessage): boolean {
  return (
    String(message.ruleId).startsWith(pluginPrefix) &&
    message.message.startsWith(inlineConfigPrefix)
  )
}

/**
 * Returns the message of an error thrown while linting, without the file
 * location ESLint appends.
 *
 * @param error - Thrown value.
 * @returns Message text.
 */
function toErrorMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error))
    .replace(/\nOccurred while linting[\s\S]*$/u, '')
    .trim()
}

function isParseError(message: Linter.LintMessage): boolean {
  return message.fatal === true && message.message.startsWith('Parsing error:')
}
