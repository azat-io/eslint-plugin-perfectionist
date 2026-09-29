<script lang="ts">
  import buildInfo from 'virtual:playground-build-info'
  import { onMount, untrack } from 'svelte'
  import { on } from 'svelte/events'

  import type {
    AppliedConfig,
    SortingOrder,
    LintProblem,
    SortingType,
    LintResult,
  } from './lint-config'
  import type { OptionsProblem } from './problem-text'
  import type { ExportInput } from './export-text'
  import type { DecodedState } from './url-state'
  import type { LintState } from './lint-client'

  import {
    LONG_LINK_LENGTH,
    getDefaultOrder,
    encodeState,
    decodeState,
    isSupported,
  } from './url-state'
  import { getDefaultOptionsText, getConfigFile } from './config-snippet'
  import ExternalLinkIcon from '../../icons/external-link.svg?component'
  import CopyDefaultIcon from '../../icons/copy-default.svg?component'
  import { INITIAL_LINT_STATE, createLintClient } from './lint-client'
  import RotateRightIcon from '../../icons/rotate-right.svg?component'
  import { toIssueBody, toMarkdown, toRuleTest } from './export-text'
  import CopyCopiedIcon from '../../icons/copy-copied.svg?component'
  import RotateLeftIcon from '../../icons/rotate-left.svg?component'
  import PlaygroundProblems from './PlaygroundProblems.svelte'
  import SparkleIcon from '../../icons/sparkle.svg?component'
  import SpinnerIcon from '../../icons/spinner.svg?component'
  import RefreshIcon from '../../icons/refresh.svg?component'
  import PlaygroundOptions from './PlaygroundOptions.svelte'
  import PlaygroundToolbar from './PlaygroundToolbar.svelte'
  import DeleteIcon from '../../icons/delete.svg?component'
  import PencilIcon from '../../icons/pencil.svg?component'
  import PlaygroundEditor from './PlaygroundEditor.svelte'
  import AlertIcon from '../../icons/alert.svg?component'
  import { toOptionsErrors } from './problem-text'
  import { CODE_SIZE_LIMIT } from './frame'

  interface EditorApi {
    /**
     * Animates the code to `target` and writes it as one undo step.
     */
    transition(target: string, signal: AbortSignal): Promise<void>

    /**
     * Moves the caret to a 1-based position and scrolls it into view.
     */
    select(line: number, column: number): void

    /**
     * Underlines the problems of the code on screen.
     */
    setProblems(problems: LintProblem[]): void

    /**
     * Replaces the code the way typing would, keeping native undo.
     */
    replaceAll(text: string): void
  }

  interface Status {
    /**
     * Picks the icon and its color: problems to fix, work in progress, a clean
     * result, a failure, or nothing to lint yet.
     */
    tone: 'problems' | 'loading' | 'success' | 'error' | 'idle'

    /**
     * Longer explanations shown under the editor, such as ESLint messages and
     * ignored comments. The sticky status line keeps only the headline.
     */
    details: string[]

    /**
     * Headline in the sticky status line.
     */
    text: string
  }

  interface SortedState {
    /**
     * Problems the last Sort started from.
     */
    fixedFrom: number

    /**
     * Code before the last Sort, for Undo.
     */
    previous: string

    /**
     * Rule, type and order the last Sort used.
     */
    settings: string

    /**
     * Code the last Sort produced.
     */
    code: string
  }

  interface Props {
    /**
     * Unsorted example code of each rule, by rule id.
     */
    examples: Record<string, string>

    /**
     * Example for all rules.
     */
    initial: string
  }

  /**
   * Copy actions the toolbar shows.
   */
  type ShareKind = 'markdown' | 'config' | 'link' | 'test'

  /**
   * Texts the Playground can copy.
   */
  type CopyKind = keyof typeof COPY_NAMES

  const STORAGE_KEY = 'playground:state'

  const NEW_ISSUE_URL =
    'https://github.com/azat-io/eslint-plugin-perfectionist/issues/new'

  const BROKEN_LINK =
    "This link couldn't be opened, so the example is shown instead."

  const UNKNOWN_SETTINGS =
    "This link has settings the Playground doesn't know, so defaults are used for them."

  const LONG_LINK = 'This link is long and may be cut off in some apps.'

  const CLIPBOARD_REPORT =
    'The code, config and output are in your clipboard. Paste them into Code example.'

  const CLIPBOARD_REPORT_FAILED =
    "Couldn't copy the code, config and output. Use Copy as Markdown and paste it into Code example."

  /**
   * Copy actions the toolbar shows.
   */
  const SHARE_KINDS = new Set<CopyKind | null>([
    'markdown',
    'config',
    'link',
    'test',
  ])

  /**
   * What each copy action copies, as named in its messages.
   */
  const COPY_NAMES = {
    markdown: 'Markdown',
    config: 'config',
    link: 'link',
    code: 'code',
    test: 'test',
  }

  /**
   * GitHub rejects issue URLs much longer than this, so a longer playground
   * link is left out of the report link.
   */
  const REPORT_LINK_LIMIT = 6000

  /**
   * The hash is written this long after the last change.
   */
  const HASH_DELAY = 400

  /**
   * After typing stops for this long, screen readers hear the new status.
   */
  const IDLE_ANNOUNCE_DELAY = 1500

  /**
   * A lint whose result comes later than this after the last change shows that
   * it is running. Typing gets its result sooner, so the previous result stays
   * on screen without blinking.
   */
  const SLOW_LINT_DELAY = 500

  /**
   * A change of more characters than this, such as pasting a file, shows that
   * linting runs at once: its result takes a while.
   */
  const LARGE_EDIT = 5000

  /**
   * From this width the controls and the problems move to a column next to the
   * editor. Keep it in sync with the skeleton styles.
   */
  const WIDE_QUERY = '(width >= 1200px)'

  let { examples, initial }: Props = $props()

  let rules = untrack(() => Object.keys(examples))

  let phase = $state<'unsupported' | 'loading' | 'ready'>('loading')
  let editorInitial = $state('')
  let code = $state('')
  let rule = $state<string | null>(null)
  let type = $state<SortingType>('alphabetical')
  let order = $state<SortingOrder>('asc')
  let optionsText = $state('')

  /**
   * Options of rules other than the current one, so choosing a rule again
   * brings its options back.
   */
  let optionsByRule: Partial<Record<string, string>> = {}
  let lint = $state<LintState>(INITIAL_LINT_STATE)
  let lastResult = $state<LintState['result']>(null)

  /**
   * Code the last result belongs to. It differs from `code` while new input is
   * being linted.
   */
  let lastResultCode = ''

  /**
   * Rule settings the last result belongs to, in the form of `settings`.
   */
  let lastResultSettings = $state('')
  let problems = $state<LintProblem[]>([])
  let sorted = $state<SortedState | null>(null)
  let sorting = $state(false)
  let awaitingResult = $state(false)
  let sortRequested = $state(false)
  let undoing = $state(false)
  let copied = $state<CopyKind | null>(null)
  let notice = $state<string | null>(null)
  let shareLink = $state('')
  let appleKeys = $state(false)

  /**
   * Wide screens show the controls and the problems in a sticky column next to
   * the editor.
   */
  let wide = $state(false)
  let statusAnnouncement = $state({ text: '', id: 0 })
  let announcement = $state({ text: '', id: 0 })
  let editor = $state<EditorApi>()
  let actionButton = $state<HTMLButtonElement>()

  /**
   * The code equals an example the playground put there. Choosing another rule
   * then swaps in that rule's example. Typing, pasting and Clear reset it; Sort
   * and Undo keep it.
   */
  let pristine = $state(true)

  let controller = new AbortController()
  let destroyed = false
  let id = $props.id()
  let statusId = `${id}-status`
  let detailsId = `${id}-details`

  /**
   * Path of the page the island belongs to. The router changes the URL before
   * it swaps the page, so events and writes for another path are ignored.
   */
  let path = ''

  /**
   * When the last transition ended. The second click of a double click on Sort
   * must not undo the Sort that the first click finished at once.
   */
  let settledAt = Number.NEGATIVE_INFINITY

  let lastHash = ''
  let hashTimer: ReturnType<typeof setTimeout> | undefined
  let hashDirty = false
  let hashWrites = 0
  let hashReads = 0
  let hashPending = false

  let copiedTimer: ReturnType<typeof setTimeout> | undefined
  let slowLintTimer: ReturnType<typeof setTimeout> | undefined

  /**
   * The result for the current input has taken longer than `SLOW_LINT_DELAY`.
   * The previous result on screen is then out of date.
   */
  let lintSlow = $state(false)
  let idleTimer: ReturnType<typeof setTimeout> | undefined
  let announcePending = false
  let announceForce = false
  let lastAnnounced = ''
  let trackedEvents: string[] = []

  let client = createLintClient({
    onChange: state => {
      lint = state
      watchSlowLint(state)
      if (state.result) {
        lastResult = state.result
        lastResultCode = code
        lastResultSettings = settings
        problems = getProblems(state.result)
        editor?.setProblems(problems)
        if (!sorting) {
          awaitingResult = false
        }
        trackResult(state.result)
      } else if (state.status === 'failed') {
        problems = []
        awaitingResult = false
        trackOnce('playground: load failed')
      }
      if (
        state.status === 'failed' ||
        (state.result && state.result.kind !== 'result')
      ) {
        sortRequested = false
      }
      if (sortRequested && state.result) {
        void sort()
      }
      flushAnnouncement()
    },
    createWorker: () =>
      new Worker(new URL('./lint.worker.ts', import.meta.url), {
        type: 'module',
      }),
  })

  let tooLarge = $derived(code.length > CODE_SIZE_LIMIT)
  let settings = $derived(JSON.stringify([rule, type, order, optionsText]))
  let example = $derived(getExample(rule))
  let canUndo = $derived(
    sorted !== null && sorted.code === code && sorted.settings === settings,
  )
  let canSortAgain = $derived(
    lint.result?.kind === 'result' && lint.result.output !== code,
  )
  let busy = $derived(sorting || sortRequested)
  let settling = $derived(sorting || awaitingResult)
  let mode = $derived(getMode())
  let sortable = $derived(
    !tooLarge &&
      lint.status === 'ready' &&
      (lint.result === null ||
        (lint.result.kind === 'result' && lint.result.output !== code)),
  )
  let actionEnabled = $derived(!busy && (mode === 'undo' || sortable))
  let status = $derived(describe())
  let showLoadExample = $derived(
    rule !== null &&
      !pristine &&
      !tooLarge &&
      code !== example &&
      (lint.result?.kind === 'result' || lint.result === null),
  )
  let appliedConfig = $derived(getAppliedConfig())
  let inlineRules = $derived(Object.keys(appliedConfig?.inline ?? {}))
  let configFile = $derived(
    getConfigFile({ config: appliedConfig, order, rule, type }),
  )
  let overrides = $derived(getOverrides())
  let optionsProblem = $derived(getOptionsProblem())
  let currentResult = $derived(
    lint.result?.kind === 'result' ? lint.result : null,
  )
  /*
   * Based on the last finished result, so the button stays while new input is
   * linted. The test itself is built only from the current result.
   */
  let testReady = $derived(rule !== null && lastResult?.kind === 'result')
  let report = $derived(getReport())

  /**
   * Describes the state in one line for the status bar. While new code is
   * linted, the previous result stays on screen, so the line does not blink on
   * every key press.
   *
   * @returns Status text and tone.
   */
  function describe(): Status {
    if (tooLarge) {
      return {
        text: 'This code is too large for the Playground (100 KB max).',
        details: ['Highlighting, linting and the link are off.'],
        tone: 'error',
      }
    }
    if (lint.status === 'failed') {
      return {
        details: [
          'Reload the page to try again. Your code is saved in the link.',
        ],
        text: "Couldn't load the linter.",
        tone: 'error',
      }
    }
    if (settling || sortRequested) {
      return {
        text: undoing ? 'Undoing…' : 'Sorting…',
        tone: 'loading',
        details: [],
      }
    }
    let result =
      lint.result ?? (lastResult?.kind === 'timeout' ? null : lastResult)
    if (result?.kind === 'timeout') {
      return {
        text: 'Linting took too long and was stopped.',
        tone: 'error',
        details: [],
      }
    }
    if (lint.status === 'loading') {
      return {
        text:
          lint.slow ?
            'Still loading the linter… Slow connection?'
          : 'Loading linter…',
        tone: 'loading',
        details: [],
      }
    }
    if (code.trim() === '') {
      return {
        text: 'Paste some code, or load an example.',
        tone: 'idle',
        details: [],
      }
    }
    if (!result || lintSlow) {
      return { text: 'Linting…', tone: 'loading', details: [] }
    }
    switch (result.kind) {
      case 'options-error':
        return {
          text: "The options can't be read.",
          tone: 'error',
          details: [],
        }
      case 'config-error':
        if (result.source === 'options') {
          return {
            text: 'These options are invalid.',
            tone: 'error',
            details: [],
          }
        }
        return {
          text:
            result.source === 'inline' ?
              'A /* eslint */ comment in your code sets invalid options.'
            : "This rule setup can't run.",
          details: [clean(result.message)],
          tone: 'error',
        }
      case 'parse-error':
        return {
          text: `Can't parse this code: ${result.problem.message} (${result.problem.line}:${result.problem.column})`,
          tone: 'error',
          details: [],
        }
      case 'internal':
        return {
          text: 'Something went wrong inside the Playground.',
          details: [clean(result.message)],
          tone: 'error',
        }
      case 'result':
        return describeProblems(result, lastResultCode)
      case 'crash':
        return {
          details: [`That's a bug, please report it. ${clean(result.message)}`],
          text: 'Perfectionist crashed on this code.',
          tone: 'error',
        }
    }
  }

  function describeProblems(
    result: Extract<LintResult, { kind: 'result' }>,
    source: string,
  ): Status {
    let count = result.problems.length
    let text = `${count} ${count === 1 ? 'problem' : 'problems'}`
    let tone: Status['tone'] = count === 0 ? 'success' : 'problems'
    if (count === 0) {
      if (canUndo && sorted) {
        text = `Sorted. Fixed ${sorted.fixedFrom} ${sorted.fixedFrom === 1 ? 'problem' : 'problems'}.`
      } else {
        text =
          rule ? `No problems found by ${rule}.` : 'Perfect. Nothing to sort.'
      }
    } else if (result.output === source) {
      text = `${text} can't be fixed automatically.`
    } else if (canUndo && sorted && sorted.fixedFrom > count) {
      text = `Fixed ${sorted.fixedFrom - count} of ${sorted.fixedFrom} problems. Press Sort again to continue.`
    }
    let { invalidInlineConfig, foreignRules, directives } = result.notices
    let details = [...invalidInlineConfig, ...directives].map(
      directive => `A comment in your code was ignored: ${clean(directive)}`,
    )
    if (foreignRules > 0) {
      details.push(
        `Ignored ${foreignRules} ${foreignRules === 1 ? 'report' : 'reports'} from rules that aren't part of Perfectionist.`,
      )
    }
    return { details, tone, text }
  }

  /**
   * Applies a hash that changed from outside, for example through Back or a
   * link to another example. A change during Sort waits until it ends.
   */
  async function readHash(): Promise<void> {
    let { pathname, hash } = location
    if (pathname !== path || hash === lastHash) {
      return
    }
    /*
     * The link changed from outside. A pending or running write of the old
     * state must not replace it, for example while Sort still animates.
     */
    clearTimeout(hashTimer)
    hashDirty = false
    hashWrites++
    let read = ++hashReads
    let decoded = await decodeState(hash, rules)
    if (destroyed || read !== hashReads || location.pathname !== path) {
      return
    }
    if (sorting) {
      hashPending = true
      return
    }
    lastHash = hash
    shareLink = location.href
    editor?.replaceAll(decoded.code ?? getExample(decoded.rule))
    applyState(decoded)
    pristine = decoded.code === null
    requestLint(true)
    queueAnnouncement(true)
    if (decoded.broken) {
      /*
       * Keep the broken link in the address bar, as on the first load. The
       * example put into the editor above scheduled a write of its own.
       */
      clearTimeout(hashTimer)
      hashDirty = false
    } else {
      void writeHash()
    }
  }

  /**
   * Builds a link to a new bug report with the versions, the playground link,
   * the rule in the title and the code, config and output in "Code example".
   * GitHub fills issue form fields from query parameters named after their ids.
   * When the whole text does not fit into a URL, the link leaves the code out
   * and the text goes to the clipboard on click instead.
   *
   * @returns Link and, when it did not fit, the text to copy.
   */
  function getReport(): { body: string | null; href: string } {
    let version = `v${buildInfo.perfectionist}`
    if (!buildInfo.release && buildInfo.commit) {
      version += ` + main@${buildInfo.commit}`
    }
    let fields = [
      ['template', 'bug-report.yml'],
      ['eslint-plugin-perfectionist-version', version],
    ]
    let reportedRule =
      rule ?? problems[0]?.ruleId?.replace('perfectionist/', '') ?? null
    if (reportedRule) {
      fields.push(['title', `Bug: (${reportedRule}) `])
    }
    if (lint.eslintVersion) {
      fields.push(['eslint-version', `v${lint.eslintVersion}`])
    }
    if (shareLink.length <= REPORT_LINK_LIMIT) {
      fields.push(['playground-link', shareLink])
    }
    let body = toIssueBody(getExportInput())
    let withBody = new URLSearchParams([...fields, ['code-example', body]])
    let href = `${NEW_ISSUE_URL}?${withBody.toString()}`
    if (href.length <= REPORT_LINK_LIMIT) {
      return { body: null, href }
    }
    let query = new URLSearchParams(fields)
    return { href: `${NEW_ISSUE_URL}?${query.toString()}`, body }
  }

  async function copy(kind: CopyKind): Promise<void> {
    let linked = true
    if (kind === 'link' || kind === 'markdown') {
      linked = await writeHash()
    }
    if (kind === 'link' && !linked) {
      notice = "The link can't hold this much code."
      announce(notice)
      return
    }
    let text = getCopyText(kind, linked)
    if (text === null) {
      return
    }
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      notice = `Couldn't copy the ${COPY_NAMES[kind]}.`
      announce(notice)
      return
    }
    copied = kind
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied = null
    }, 2000)
    track(`playground: ${kind} copied`)
    let name = COPY_NAMES[kind]
    let message = `${name.charAt(0).toUpperCase()}${name.slice(1)} copied.`
    if (kind === 'link' && text.length > LONG_LINK_LENGTH) {
      notice = LONG_LINK
      message += ` ${LONG_LINK}`
    }
    announce(message)
  }

  /**
   * Writes the state to the URL hash and the session copy. It replaces the
   * history entry and keeps its state, which the router needs for Back.
   *
   * @returns Whether the hash now matches the state.
   */
  async function writeHash(): Promise<boolean> {
    clearTimeout(hashTimer)
    hashDirty = false
    if (code.length > CODE_SIZE_LIMIT) {
      return false
    }
    let write = ++hashWrites
    let options =
      rule && optionsText.trim() !== getDefaultOptionsText(rule) ?
        optionsText
      : ''
    let encoded = await encodeState(
      { options, order, code, rule, type },
      example,
    )
    if (write !== hashWrites) {
      return false
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, encoded)
    } catch {
      // Storage may be off. The hash still keeps the state.
    }
    if (destroyed || location.pathname !== path) {
      return false
    }
    let hash = `#${encoded}`
    if (location.hash !== hash) {
      history.replaceState(
        history.state,
        '',
        `${location.pathname}${location.search}${hash}`,
      )
    }
    lastHash = hash
    shareLink = location.href
    return true
  }

  /**
   * Returns the text a copy action puts into the clipboard.
   *
   * @param kind - What to copy.
   * @param linked - The URL holds the current state.
   * @returns Text, or `null` when it cannot be built right now.
   */
  function getCopyText(kind: CopyKind, linked: boolean): string | null {
    switch (kind) {
      case 'markdown':
        return toMarkdown({
          ...getExportInput(),
          link: linked ? location.href : null,
        })
      case 'config':
        return configFile
      case 'link':
        return location.href
      case 'code':
        return code
      case 'test':
        return rule && currentResult?.config ?
            toRuleTest({
              problems: currentResult.problems.filter(
                problem => problem.ruleId === `perfectionist/${rule}`,
              ),
              config: currentResult.config,
              output: currentResult.output,
              jsx: currentResult.jsx,
              rule,
              code,
            })
          : null
    }
  }

  /**
   * Collects the state the exported texts describe.
   *
   * @returns Code, output, config, versions and link.
   */
  function getExportInput(): ExportInput {
    let perfectionistVersion =
      !buildInfo.release && buildInfo.commit ?
        `${buildInfo.perfectionist} + main@${buildInfo.commit}`
      : buildInfo.perfectionist
    return {
      versions: [
        `ESLint ${lint.eslintVersion ?? 'unknown'}`,
        `Perfectionist ${perfectionistVersion}`,
        `TypeScript ${buildInfo.typescript}`,
      ].join(', '),
      error:
        lint.result?.kind === 'crash' || lint.result?.kind === 'internal' ?
          lint.result.message
        : null,
      link: shareLink.length <= LONG_LINK_LENGTH ? shareLink : null,
      output: currentResult?.output ?? null,
      config: configFile,
      code,
    }
  }

  async function sort(): Promise<void> {
    if (!editor || sorting || tooLarge || lint.status !== 'ready') {
      sortRequested = false
      return
    }
    if (!lint.result) {
      sortRequested = true
      return
    }
    sortRequested = false
    let { result } = lint
    if (result.kind !== 'result' || result.output === code) {
      return
    }
    let previous = code
    let fixedFrom = result.problems.length
    let sortedWith = settings
    await run(result.output)
    if (code === result.output) {
      sorted = {
        settings: sortedWith,
        code: result.output,
        fixedFrom,
        previous,
      }
    }
    queueAnnouncement(true)
  }

  /**
   * Restores the state from the hash, or from the session copy when the hash is
   * empty. Clicking Playground in the header reloads this page without the
   * hash, and the session copy keeps the code.
   */
  async function restore(): Promise<void> {
    let { hash } = location
    let source = hash.slice(1)
    if (!source) {
      try {
        source = sessionStorage.getItem(STORAGE_KEY) ?? ''
      } catch {
        // Storage may be off. Start from the example.
      }
    }
    let decoded = await decodeState(source, rules)
    if (destroyed) {
      return
    }
    applyState(decoded)
    code = decoded.code ?? example
    pristine = decoded.code === null
    editorInitial = code
    lastHash = hash
    shareLink = location.href
    phase = 'ready'
    requestLint(true)
    queueAnnouncement(true)
    if (!decoded.broken) {
      void writeHash()
    }
  }

  async function run(target: string): Promise<void> {
    let wasPristine = pristine
    if (!(document.activeElement instanceof HTMLTextAreaElement)) {
      actionButton?.focus({ preventScroll: true })
    }
    sorting = true
    awaitingResult = true
    try {
      await editor!.transition(target, controller.signal)
    } finally {
      sorting = false
      pristine = wasPristine
      settledAt = performance.now()
      if (tooLarge || lint.status === 'failed' || lint.result !== null) {
        awaitingResult = false
      }
      if (hashPending) {
        hashPending = false
        void readHash()
      }
    }
  }

  /**
   * Tells which sorting controls the options override: a rule's own `type` or
   * `order`, or shared settings from the Options field.
   *
   * @returns Overridden controls.
   */
  function getOverrides(): { order: boolean; type: boolean } {
    let config = appliedConfig
    if (!config || rule === null) {
      return { order: false, type: false }
    }
    let objects = (config.options ?? []).filter(
      (option): option is Record<string, unknown> =>
        typeof option === 'object' && option !== null,
    )
    return {
      order:
        objects.some(option => 'order' in option) ||
        config.settings['order'] !== order,
      type:
        objects.some(option => 'type' in option) ||
        config.settings['type'] !== type,
    }
  }

  function flushAnnouncement(): void {
    let known = tooLarge || lint.status === 'failed' || lint.result !== null
    if (!announcePending || settling || !known) {
      return
    }
    let text = [status.text, ...status.details].join(' ')
    if (announceForce || text !== lastAnnounced) {
      statusAnnouncement = { id: statusAnnouncement.id + 1, text }
      lastAnnounced = text
    }
    announcePending = false
    announceForce = false
  }

  function handleCode(value: string): void {
    let large = Math.abs(value.length - code.length) > LARGE_EDIT
    code = value
    pristine &&= value === example || value === sorted?.code
    notice = null
    requestLint(sorting)
    if (large && !tooLarge && lint.result === null) {
      lintSlow = true
    }
    scheduleHashWrite()
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => queueAnnouncement(), IDLE_ANNOUNCE_DELAY)
  }

  /**
   * Explains why the options can't be used, from the last result.
   *
   * @returns Problem to show under the Options field, or `null`.
   */
  function getOptionsProblem(): OptionsProblem | null {
    let result = lastResult
    if (rule === null || !result) {
      return null
    }
    if (result.kind === 'options-error') {
      return { position: result.position, lines: [result.message] }
    }
    if (result.kind === 'config-error' && result.source === 'options') {
      return { lines: toOptionsErrors(result.message), position: null }
    }
    return null
  }

  function act(): void {
    let blocked = document.querySelector('dialog[open]') !== null
    if (blocked || !actionEnabled || performance.now() - settledAt < 400) {
      return
    }
    if (mode === 'undo') {
      track('playground: undo')
      void undo()
    } else {
      track(
        mode === 'sort-again' ? 'playground: sort again' : 'playground: sort',
      )
      void sort()
    }
  }

  function changeRule(value: string | null): void {
    if (rule !== null) {
      optionsByRule[rule] = optionsText
    }
    rule = value
    optionsText =
      value === null ? '' : (
        (optionsByRule[value] ?? getDefaultOptionsText(value))
      )
    track('playground: rule changed')
    if (pristine) {
      notice = null
      loadExample()
    } else {
      applySettings()
    }
  }

  function trackResult(result: NonNullable<LintState['result']>): void {
    switch (result.kind) {
      case 'parse-error': {
        trackOnce('playground: parse error')

        break
      }
      case 'timeout': {
        trackOnce('playground: timeout')

        break
      }
      case 'crash': {
        trackOnce('playground: crash')

        break
      }
      // No default
    }
  }

  function applyState(decoded: DecodedState): void {
    ;({ options: optionsText, order, rule, type } = decoded)
    if (rule !== null && optionsText === '') {
      optionsText = getDefaultOptionsText(rule)
    }
    optionsByRule = {}
    notice = null
    if (decoded.broken) {
      notice = BROKEN_LINK
    } else if (decoded.invalid) {
      notice = UNKNOWN_SETTINGS
    }
  }

  /**
   * Tracks a click on a report link and copies the report text when it did not
   * fit into the link.
   */
  async function openReport(): Promise<void> {
    track('playground: report clicked')
    let { body } = report
    if (!body) {
      return
    }
    try {
      await navigator.clipboard.writeText(body)
      notice = CLIPBOARD_REPORT
    } catch {
      notice = CLIPBOARD_REPORT_FAILED
    }
    announce(notice)
  }

  function requestLint(immediate = false): void {
    sortRequested = false
    if (code.length > CODE_SIZE_LIMIT) {
      client.clear()
      problems = []
    } else {
      client.update(
        { options: optionsText, order, code, rule, type },
        { immediate },
      )
    }
  }

  function changeOptions(value: string): void {
    optionsText = value
    notice = null
    trackOnce('playground: options edited')
    requestLint()
    scheduleHashWrite()
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => queueAnnouncement(), IDLE_ANNOUNCE_DELAY)
  }

  /**
   * Marks the lint as slow once the result for the current input is late, and
   * clears the mark when it arrives. Every change starts the wait again, so
   * typing does not count as waiting.
   *
   * @param state - New state of the lint client.
   */
  function watchSlowLint(state: LintState): void {
    clearTimeout(slowLintTimer)
    if (state.status !== 'ready' || state.result !== null) {
      lintSlow = false
      return
    }
    slowLintTimer = setTimeout(() => {
      lintSlow = true
    }, SLOW_LINT_DELAY)
  }

  async function undo(): Promise<void> {
    if (!sorted || sorting) {
      return
    }
    let { previous } = sorted
    undoing = true
    try {
      await run(previous)
    } finally {
      undoing = false
    }
    sorted = null
    queueAnnouncement(true)
  }

  /**
   * Returns what the problem list says when the code has no problems.
   *
   * @returns Text, or `null` when the code is empty or was not linted.
   */
  function getEmptyText(): string | null {
    if (
      tooLarge ||
      lintSlow ||
      lastResult?.kind !== 'result' ||
      code.trim() === ''
    ) {
      return null
    }
    return canUndo ? 'No problems left.' : 'No problems.'
  }

  function getActionLabel(): string {
    if (busy) {
      return undoing ? 'Undoing…' : 'Sorting…'
    }
    if (mode === 'sort-again') {
      return 'Sort again'
    }
    return mode === 'undo' ? 'Undo' : 'Sort'
  }

  function getProblems(result: LintState['result']): LintProblem[] {
    if (result?.kind === 'result') {
      return result.problems
    }
    return result?.kind === 'parse-error' ? [result.problem] : []
  }

  /**
   * Returns the rule setup of the last result when it belongs to the current
   * rule settings.
   *
   * @returns Setup, or `null` while none matches.
   */
  function getAppliedConfig(): AppliedConfig | null {
    if (!lastResult || lastResult.kind === 'timeout') {
      return null
    }
    return lastResultSettings === settings ? lastResult.config : null
  }

  function scheduleHashWrite(): void {
    clearTimeout(hashTimer)
    hashDirty = true
    hashTimer = setTimeout(() => {
      void writeHash()
    }, HASH_DELAY)
  }

  function changeType(value: SortingType): void {
    type = value
    order = getDefaultOrder(value)
    track('playground: type changed')
    applySettings()
  }

  /**
   * Puts the example of the current rule into the editor. Cmd/Ctrl+Z brings
   * back the previous code.
   */
  function loadExample(): void {
    editor?.replaceAll(example)
    pristine = true
    requestLint(true)
    scheduleHashWrite()
    queueAnnouncement(true)
  }

  function getMode(): 'sort-again' | 'undo' | 'sort' {
    if (!canUndo) {
      return 'sort'
    }
    return canSortAgain ? 'sort-again' : 'undo'
  }

  function undoClick(): void {
    if (performance.now() - settledAt < 400) {
      return
    }
    track('playground: undo')
    void undo()
  }

  function trackOnce(event: string): void {
    if (!trackedEvents.includes(event)) {
      trackedEvents.push(event)
      track(event)
    }
  }

  /**
   * Asks to read the status aloud once the result for the current code is in.
   * Typing only leads here after a pause, so screen readers do not hear every
   * intermediate count.
   *
   * @param force - Read it even if it has not changed, after an explicit
   *   action.
   */
  function queueAnnouncement(force = false): void {
    announcePending = true
    announceForce ||= force
    flushAnnouncement()
  }

  function applySettings(): void {
    notice = null
    requestLint(true)
    scheduleHashWrite()
    queueAnnouncement(true)
  }

  function getExample(ruleId: string | null): string {
    return (ruleId ? examples[ruleId] : undefined) ?? initial
  }

  /**
   * Tells whether a copy action is one the toolbar shows.
   *
   * @param kind - Copy action, if any.
   * @returns Whether the toolbar shows it.
   */
  function isShareKind(kind: CopyKind | null): kind is ShareKind {
    return SHARE_KINDS.has(kind)
  }

  /**
   * Joins the lines of an ESLint message, which may hold line breaks and tabs.
   *
   * @param message - Message text.
   * @returns Message on one line.
   */
  function clean(message: string): string {
    return message.replaceAll(/\s+/gu, ' ').trim()
  }

  /**
   * Reads the result of an action aloud, separately from the status.
   *
   * @param text - Message for screen readers.
   */
  function announce(text: string): void {
    announcement = { id: announcement.id + 1, text }
  }

  function changeOrder(value: SortingOrder): void {
    order = value
    applySettings()
  }

  function clearCode(): void {
    editor?.replaceAll('')
    queueAnnouncement(true)
  }

  function track(event: string): void {
    globalThis.fathom?.trackEvent(event)
  }

  onMount(() => {
    if (!isSupported()) {
      phase = 'unsupported'
      return
    }
    appleKeys = /Mac|iPad|iPhone|iPod/u.test(navigator.userAgent)
    path = location.pathname
    let wideQuery = matchMedia(WIDE_QUERY)
    wide = wideQuery.matches
    let cleanups = [
      on(document, 'visibilitychange', () => {
        if (sorting && document.hidden) {
          controller.abort()
          controller = new AbortController()
        }
      }),
      on(globalThis, 'hashchange', () => {
        void readHash()
      }),
      on(globalThis, 'popstate', () => {
        void readHash()
      }),
      on(wideQuery, 'change', () => {
        wide = wideQuery.matches
      }),
    ]
    void restore()

    if (document.prerendering) {
      cleanups.push(
        on(document, 'prerenderingchange', () => client.start(), {
          once: true,
        }),
      )
    } else {
      client.start()
    }

    return () => {
      destroyed = true
      controller.abort()
      if (hashDirty) {
        void writeHash()
      }
      clearTimeout(copiedTimer)
      clearTimeout(idleTimer)
      clearTimeout(slowLintTimer)
      for (let cleanup of cleanups) {
        cleanup()
      }
      client.destroy()
    }
  })
</script>

{#if phase === 'unsupported'}
  <p class="unsupported">The Playground needs a newer browser.</p>
{:else if phase === 'loading'}
  <div
    style:--lines={initial.split('\n').length}
    class="skeleton"
  >
    <div class="skeleton-toolbar"></div>
    <div class="skeleton-card"></div>
  </div>
{:else}
  {#snippet controls()}
    <div
      class="controls"
      inert={sorting}
    >
      <PlaygroundToolbar
        shared={isShareKind(copied) ? copied : null}
        inline={inlineRules}
        onShare={copy}
        configReady={lastResult?.kind !== 'options-error'}
        {overrides}
        {testReady}
        onOrderChange={changeOrder}
        onRuleChange={changeRule}
        onTypeChange={changeType}
        {order}
        {rules}
        {rule}
        {type}
      >
        {#snippet options()}
          {#if rule}
            <PlaygroundOptions
              overridden={inlineRules.includes(rule)}
              onChange={changeOptions}
              problem={optionsProblem}
              value={optionsText}
              {rule}
            />
          {/if}
        {/snippet}
      </PlaygroundToolbar>
    </div>

    {#if notice}
      <p class="notice">{notice}</p>
    {/if}
  {/snippet}

  {#snippet diagnostics()}
    {#if status.details.length > 0}
      <ul
        id={detailsId}
        class="details"
      >
        {#each status.details as detail, index (index)}
          <li class="detail">{detail}</li>
        {/each}
      </ul>
    {/if}

    <PlaygroundProblems
      onselect={(line: number, column: number) => editor?.select(line, column)}
      empty={getEmptyText()}
      loading={!lastResult && lint.status !== 'failed' && !tooLarge}
      showRules={rule === null}
      settling={settling || (lintSlow && !tooLarge)}
      {problems}
    />
  {/snippet}

  <div class={['layout', wide && 'layout-wide']}>
    {#if !wide}
      {@render controls()}
    {/if}
    <div class="main">
      <section
        aria-label="Code editor"
        aria-busy={sorting}
        class="card"
      >
        <div class="card-header">
          <span class="badge">
            <PencilIcon class="badge-icon" />
            input.tsx · Editable
          </span>
          <div
            class="card-buttons"
            inert={sorting}
          >
            <button
              onclick={clearCode}
              class="tool"
              type="button"
            >
              <DeleteIcon class="tool-icon" />
              Clear
            </button>
            <button
              onclick={loadExample}
              class="tool"
              type="button"
            >
              <RefreshIcon class="tool-icon" />
              Reset
            </button>
          </div>
        </div>

        <PlaygroundEditor
          placeholder="Paste some code to sort…"
          describedby="{statusId} {detailsId}"
          showRules={rule === null}
          initial={editorInitial}
          oninput={handleCode}
          bind:this={editor}
        />

        <div class="strip">
          <p
            data-tone={status.tone}
            id={statusId}
            class="status"
          >
            {#key status.tone}
              {#if status.tone === 'success'}
                <SparkleIcon class="status-icon status-icon-success" />
              {:else if status.tone === 'loading'}
                <SpinnerIcon class="status-icon spinner" />
              {:else if status.tone === 'idle'}
                <PencilIcon class="status-icon" />
              {:else}
                <AlertIcon class="status-icon" />
              {/if}
            {/key}
            <span class="status-text">{status.text}</span>
            {#if !settling && lint.result?.kind === 'timeout'}
              <button
                onclick={() => {
                  actionButton?.focus({ preventScroll: true })
                  client.retry()
                }}
                class="inline-action"
                type="button"
              >
                <RotateRightIcon class="inline-icon" />
                Try again
              </button>
            {:else if !settling && (lint.result?.kind === 'crash' || lint.result?.kind === 'internal')}
              <a
                class="inline-action"
                href={report.href}
                onclick={openReport}
                rel="noopener noreferrer"
                target="_blank"
              >
                Report the bug
                <ExternalLinkIcon class="inline-icon" />
              </a>
            {:else if !settling && code.trim() === ''}
              <button
                onclick={() => {
                  actionButton?.focus({ preventScroll: true })
                  loadExample()
                }}
                class="inline-action"
                type="button"
              >
                {rule ? `Load the ${rule} example` : 'Load an example'}
              </button>
            {:else if !settling && showLoadExample}
              <button
                onclick={() => {
                  actionButton?.focus({ preventScroll: true })
                  loadExample()
                }}
                class="inline-action"
                type="button"
              >
                Load the {rule} example
              </button>
            {/if}
          </p>
          <div class="strip-buttons">
            <button
              aria-label={copied === 'code' ? 'Code copied' : 'Copy code'}
              onclick={() => copy('code')}
              class="tool copy-code"
              inert={sorting}
              type="button"
            >
              {#if copied === 'code'}
                <CopyCopiedIcon class="tool-icon" />
              {:else}
                <CopyDefaultIcon class="tool-icon" />
              {/if}
              <span class="copy-code-label">
                {copied === 'code' ? 'Code copied' : 'Copy code'}
              </span>
            </button>
            {#if mode === 'sort-again' && !busy}
              <button
                class="action action-secondary"
                onclick={undoClick}
                type="button"
              >
                <RotateLeftIcon class="action-icon" />
                Undo
              </button>
            {/if}
            <button
              class={[
                'action',
                mode === 'undo' && !busy ?
                  'action-secondary'
                : 'action-primary',
              ]}
              aria-keyshortcuts={mode === 'undo' ? undefined : 'ctrl+enter'}
              aria-disabled={!actionEnabled}
              bind:this={actionButton}
              onclick={act}
              type="button"
            >
              {#if busy || (lintSlow && !tooLarge && mode !== 'undo')}
                <SpinnerIcon class="action-icon spinner" />
              {:else if mode === 'undo'}
                <RotateLeftIcon class="action-icon" />
              {:else}
                <SparkleIcon class="action-icon" />
              {/if}
              {getActionLabel()}
              {#if mode !== 'undo' && !busy}
                <kbd
                  aria-hidden="true"
                  class="shortcut"
                >
                  {appleKeys ? '⌘↵' : 'Ctrl↵'}
                </kbd>
              {/if}
            </button>
          </div>
        </div>
      </section>
      {#if !wide}
        {@render diagnostics()}
      {/if}
    </div>
    {#if wide}
      <div class="side">
        {@render controls()}
        {@render diagnostics()}
      </div>
    {/if}
  </div>

  <p class="versions">
    ESLint {lint.eslintVersion ?? '…'} · Perfectionist {buildInfo.perfectionist}
    {#if !buildInfo.release && buildInfo.commit}
      + <a
        href="https://github.com/azat-io/eslint-plugin-perfectionist/commit/{buildInfo.commit}"
        >main@{buildInfo.commit}</a
      >
    {/if}
    · TypeScript {buildInfo.typescript} ·
    <a
      class="external-link"
      href={report.href}
      onclick={openReport}
      rel="noopener noreferrer"
      target="_blank"
    >
      Report an issue
      <ExternalLinkIcon class="inline-icon" />
    </a>
  </p>

  <div
    class="visually-hidden"
    role="status"
  >
    {#key statusAnnouncement.id}
      <span>{statusAnnouncement.text}</span>
    {/key}
  </div>
  <div
    class="visually-hidden"
    aria-live="polite"
  >
    {#key announcement.id}
      <span>{announcement.text}</span>
    {/key}
  </div>
{/if}

<style>
  .skeleton {
    @media (width >= 1200px) {
      display: grid;
      grid-template-columns: [editor] minmax(0, 1fr) [side] clamp(
          22rem,
          34%,
          26rem
        );
      gap: var(--space-l);
      align-items: start;
    }
  }

  .skeleton-toolbar {
    block-size: 6.25rem;

    @media (width >= 1200px) {
      grid-row: 1;
      grid-column: side;
    }

    @media (width < 900px) {
      block-size: 8.75rem;
    }

    @media (width < 800px) {
      block-size: 13rem;
    }
  }

  .skeleton-card {
    block-size: calc(var(--lines) * 1lh + var(--space-m) * 2 + 7.25rem);
    font: var(--font-code);
    background: var(--color-code-background);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius);

    @media (width < 800px), (pointer: coarse) {
      font: normal 1rem / 1.7 var(--font-family-code);
    }

    @media (width >= 1200px) {
      grid-row: 1;
      grid-column: editor;
    }
  }

  .unsupported,
  .notice {
    padding: var(--space-xs) var(--space-s);
    margin-block: 0 var(--space-m);
    font: var(--font-xs);
    color: var(--color-content-secondary);
    background: var(--color-background-tertiary);
    border-radius: var(--border-radius);
  }

  .layout-wide {
    display: grid;
    grid-template-columns: [editor] minmax(0, 1fr) [side] clamp(
        22rem,
        34%,
        26rem
      );
    gap: var(--space-l);
    align-items: start;
  }

  .main {
    min-inline-size: 0;
  }

  /*
   * The column stays in view while the page scrolls along the code. Only the
   * problem list scrolls inside it, so the controls are always visible.
   */

  /*
   * The problems take the space left under the controls and scroll inside it,
   * but keep enough height for a few rows. When even that does not fit, the
   * whole column scrolls instead of running over the footer. The padding
   * keeps focus rings inside the scrolling box.
   */
  .side {
    position: sticky;
    inset-block-start: calc(var(--header-block-size) + var(--space-m));
    display: flex;
    flex-flow: column nowrap;
    max-block-size: calc(
      100dvb - var(--header-block-size) - var(--space-m) * 2
    );
    padding: var(--space-4xs);
    margin: calc(var(--space-4xs) * -1);
    container-type: inline-size;
    overflow: hidden auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;

    /*
     * The parts of the controls and of the Options field take part in the
     * column layout, so a long Options field shrinks and scrolls before the
     * problems get too short.
     */
    & .controls {
      display: contents;
    }

    & :global(.options) {
      display: contents;
    }

    & :global(.options .header) {
      margin-block: var(--space-s) var(--space-2xs);
    }

    & :global(.options .field) {
      min-block-size: calc(3lh + var(--space-2xs) * 2 + 2px);
      margin-block-end: var(--space-2xs);
    }

    & :global(.problems) {
      flex: 1 1 auto;
      min-block-size: min(14rem, 40dvb);
      padding-inline: var(--space-4xs);
      margin-block: 0;
      margin-inline: calc(var(--space-4xs) * -1);
      overflow: auto;
    }
  }

  .card {
    position: relative;
    background: var(--color-code-background);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius);

    @media (prefers-reduced-motion: no-preference) {
      transition: box-shadow 200ms;
    }

    &:has(:global(textarea:focus)) {
      outline: 2px solid transparent;
      outline-offset: 2px;
      box-shadow: 0 0 0 3px var(--color-border-brand);
    }
  }

  .card-header {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    align-items: center;
    justify-content: space-between;
    padding-inline-end: var(--space-2xs);
    border-block-end: 1px solid var(--color-border-primary);
  }

  .badge {
    display: inline-flex;
    flex-wrap: nowrap;
    gap: var(--space-2xs);
    align-items: center;
    align-self: stretch;
    padding: var(--space-2xs) var(--space-xs);
    font: var(--font-xs);
    font-family: var(--font-family-title);
    line-height: 1;
    color: oklch(100% 0 0deg);
    white-space: nowrap;
    background: var(--color-background-brand);
    border-start-start-radius: calc(var(--border-radius) - 1px);
    border-end-end-radius: var(--border-radius);
  }

  .card-header :global(.badge-icon) {
    inline-size: var(--size-icon-xs);
    block-size: var(--size-icon-xs);
  }

  .card-buttons,
  .strip-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    align-items: center;
    margin-inline-start: auto;
  }

  .tool {
    display: inline-flex;
    flex-wrap: nowrap;
    gap: var(--space-2xs);
    align-items: center;
    padding: var(--space-2xs) var(--space-xs);
    margin-block: var(--space-2xs);
    font: var(--font-xs);
    line-height: 1.25;
    color: var(--color-content-secondary);
    white-space: nowrap;
    outline: none;
    background: none;
    border: none;
    border-radius: var(--border-radius);

    @media (prefers-reduced-motion: no-preference) {
      transition:
        background-color 200ms,
        box-shadow 200ms;
    }

    @media (hover: hover) {
      &:hover {
        background: var(--color-background-secondary-hover);
      }
    }

    @media (pointer: coarse) {
      min-block-size: 44px;
    }

    &:focus-visible {
      outline: 2px solid transparent;
      outline-offset: 2px;
      box-shadow: 0 0 0 3px var(--color-border-brand);
    }
  }

  .card :global(.tool-icon) {
    flex-shrink: 0;
    inline-size: var(--size-icon-xs);
    block-size: var(--size-icon-xs);
  }

  .card-buttons :global(.tool-icon) {
    @media (width < 400px) {
      display: none;
    }
  }

  .strip {
    position: sticky;
    inset-block-end: 0;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs) var(--space-s);
    align-items: center;
    justify-content: space-between;
    padding: var(--space-xs) var(--space-xs) var(--space-xs) var(--space-m);
    background: var(--color-code-background);
    border-block-start: 1px solid var(--color-border-primary);
    border-end-start-radius: var(--border-radius);
    border-end-end-radius: var(--border-radius);
  }

  .status {
    display: flex;
    flex: 1 1 8rem;
    flex-wrap: wrap;
    gap: var(--space-2xs) var(--space-xs);
    align-items: center;
    margin: 0;
    font: var(--font-xs);
    color: var(--color-content-secondary);

    &[data-tone='problems'],
    &[data-tone='error'] {
      & :global(.status-icon) {
        color: var(--color-status-danger);
      }
    }

    &[data-tone='success'] :global(.status-icon) {
      color: var(--color-status-success);
    }

    &[data-tone='idle'] :global(.status-icon) {
      color: var(--color-content-tertiary);
    }
  }

  .status-text {
    flex: 1 1 0;
    min-inline-size: 12ch;
  }

  .details {
    padding: var(--space-xs) var(--space-s);
    margin-block: var(--space-s) 0;
    font: var(--font-xs);
    color: var(--color-content-secondary);
    overflow-wrap: anywhere;
    list-style-type: '';
    background: var(--color-background-tertiary);
    border-radius: var(--border-radius);
  }

  .detail {
    margin: 0;

    & + & {
      margin-block-start: var(--space-2xs);
    }
  }

  .strip :global(.status-icon) {
    flex-shrink: 0;
    inline-size: var(--size-icon-xs);
    block-size: var(--size-icon-xs);
  }

  .strip :global(.status-icon-success) {
    @media (prefers-reduced-motion: no-preference) {
      animation: pop 300ms ease-out;
    }
  }

  .strip :global(.spinner) {
    @media (prefers-reduced-motion: no-preference) {
      animation: spin 1200ms linear infinite;
    }
  }

  .inline-action {
    display: inline-flex;
    flex-wrap: nowrap;
    gap: var(--space-4xs);
    align-items: center;
    padding: 0;
    font: inherit;
    color: var(--color-content-brand);
    text-decoration: underline;
    text-underline-offset: 0.25em;
    background: none;
    border: none;
    border-radius: var(--border-radius);

    @media (prefers-reduced-motion: no-preference) {
      transition:
        background-color 200ms,
        box-shadow 200ms;
    }

    &:focus-visible {
      text-decoration: none;
      outline: 2px solid transparent;
      outline-offset: 2px;
      background: var(--color-overlay-brand);
      box-shadow: 0 0 0 3px var(--color-border-brand);
    }
  }

  .copy-code-label {
    @media (width < 800px) {
      display: none;
    }
  }

  .action {
    display: inline-flex;
    flex-wrap: nowrap;
    gap: var(--space-2xs);
    align-items: center;
    justify-content: center;
    min-inline-size: 7.5rem;
    block-size: 40px;

    @media (width < 800px) {
      min-inline-size: 6rem;
    }
    padding: 0 var(--space-s);
    font: var(--font-xs);
    font-weight: 500;
    white-space: nowrap;
    outline: none;
    border: 1px solid transparent;
    border-radius: var(--border-radius);

    @media (prefers-reduced-motion: no-preference) {
      transition:
        background-color 200ms ease-in-out,
        box-shadow 200ms ease-in-out,
        transform 200ms ease-in-out;
    }

    @media (pointer: coarse) {
      block-size: 44px;
    }

    &:focus-visible {
      outline: 2px solid transparent;
      outline-offset: 2px;
      box-shadow: 0 0 0 3px var(--color-border-brand);
    }

    &:active:not([aria-disabled='true']) {
      transform: scale(95%);
    }

    &[aria-disabled='true'] {
      cursor: not-allowed;
      opacity: 55%;
    }
  }

  .action-primary {
    color: oklch(100% 0 0deg);
    background: var(--color-background-brand);

    @media (hover: hover) {
      &:hover:not([aria-disabled='true']) {
        background: var(--color-background-brand-hover);
      }
    }
  }

  .action-secondary {
    color: var(--color-content-inverse);
    background: var(--color-background-inverse);

    @media (hover: hover) {
      &:hover:not([aria-disabled='true']) {
        background: var(--color-background-inverse-hover);
      }
    }
  }

  .strip :global(.action-icon) {
    flex-shrink: 0;
    inline-size: var(--size-icon-xs);
    block-size: var(--size-icon-xs);
  }

  .shortcut {
    display: none;
    padding: 0 var(--space-4xs);
    font: var(--font-xs);
    font-size: 0.8em;
    color: inherit;
    background: transparent;
    border: none;
    opacity: 75%;

    @media (hover: hover) {
      display: inline;
    }
  }

  .versions {
    font: var(--font-xs);
    color: var(--color-content-tertiary);
  }

  .external-link {
    display: inline-flex;
    flex-wrap: nowrap;
    gap: var(--space-4xs);
    align-items: center;
  }

  .strip :global(.inline-icon),
  .versions :global(.inline-icon) {
    flex-shrink: 0;
    inline-size: 1.1em;
    block-size: 1.1em;
  }

  .visually-hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
  }

  @keyframes pop {
    0% {
      opacity: 0%;
      transform: scale(40%);
    }

    100% {
      opacity: 100%;
      transform: scale(100%);
    }
  }

  @keyframes spin {
    100% {
      transform: rotate(1turn);
    }
  }
</style>
