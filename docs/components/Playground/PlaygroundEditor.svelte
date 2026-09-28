<script lang="ts">
  import type { KeyedTokensInfo } from '@shikijs/magic-move/types'
  import type { HighlighterCore } from 'shiki'

  import { flushSync, onMount, untrack } from 'svelte'
  import { on } from 'svelte/events'

  import type { LintProblem } from './lint-config'
  import type { Animator } from './motion'
  import type { Mark } from './frame'

  import {
    CODE_SIZE_LIMIT,
    getChangedRange,
    getLineStarts,
    toMotionFrame,
    shiftMarks,
    toFrame,
    toMarks,
  } from './frame'
  import PlaygroundTooltip from './PlaygroundTooltip.svelte'
  import { shiki } from '../../stores/shiki'
  import { createAnimator } from './motion'
  import { syncKeys } from './key-sync'

  interface Props {
    /**
     * Called with the new code after every change.
     */
    oninput(code: string): void

    /**
     * Id of the element that describes the code, such as the status line.
     */
    describedby: string

    /**
     * Text shown while the editor is empty.
     */
    placeholder: string

    /**
     * Name the rule of each problem in the hover tooltip.
     */
    showRules: boolean

    /**
     * Code the editor starts with.
     */
    initial: string
  }

  /**
   * Code longer than this is highlighted after a short pause instead of on
   * every frame. Rebuilding the layer costs about 20 µs per token in Firefox.
   */
  const INSTANT_LIMIT = 20_000

  /**
   * Frames with more tokens are swapped without animation.
   */
  const ANIMATION_TOKEN_LIMIT = 2000

  /**
   * Code longer than this is not animated, so the word frames and key sync are
   * skipped. About three characters make one word-split token.
   */
  const ANIMATION_LENGTH_LIMIT = ANIMATION_TOKEN_LIMIT * 3

  /**
   * The pointer has to rest on underlined code this long before the tooltip
   * shows. Moving to other underlined code while it is open updates it at
   * once.
   */
  const HOVER_DELAY = 300

  /**
   * Replacing more lines than this goes through `value` instead of an editing
   * command. Chromium's `insertText` slows down with the square of the line
   * count: Sort on 5000 short lines froze the page for 14 seconds. The native
   * undo step is lost then, while the Undo button still works.
   */
  const NATIVE_WRITE_LINE_LIMIT = 400

  let { placeholder, describedby, showRules, initial, oninput }: Props =
    $props()

  let code = untrack(() => initial)
  let marks: Mark[] = []

  /**
   * Problems the marks were made from. The `problem-N` classes of underlined
   * tokens point into the list that was current when the layer was drawn.
   */
  let markProblems: LintProblem[] = []
  let layerProblems: LintProblem[] = []
  let animating = $state(false)
  let stale = $state(false)
  let textarea = $state<HTMLTextAreaElement>()
  let layer = $state<HTMLPreElement>()

  let animator: Animator | null = null
  let highlighter: HighlighterCore | null = null
  let highlightFrame = 0
  let highlightTimer: ReturnType<typeof setTimeout> | undefined
  let programmatic = false
  let transitioning = false
  let destroyed = false

  let hovered = $state<LintProblem[]>([])
  let hoverAnchor = $state<{ bottom: number; left: number; top: number }>()
  let hoverToken: Element | null = null
  let pointer: { x: number; y: number } | null = null
  let hoverFrame = 0
  let hoverTimer: ReturnType<typeof setTimeout> | undefined

  /**
   * Animates the code to `target` and writes it into the textarea as one native
   * undo step. Focus returns to the element that had it, such as the Sort
   * button.
   *
   * @param target - Code after the change.
   * @param signal - Stops the animation early, for example when the tab is
   *   hidden. The code is still written unless the editor is gone.
   */
  export async function transition(
    target: string,
    signal: AbortSignal,
  ): Promise<void> {
    let element = textarea
    if (!animator || !element || target === code) {
      return
    }
    let source = code
    let { selectionStart, selectionEnd } = element
    transitioning = true
    hideHover()
    cancelPendingHighlight()
    element.readOnly = true
    try {
      element.scrollLeft = 0
      syncScroll()
      let options = { theme: $shiki.theme, highlighter }
      let animate =
        !matchMedia('(prefers-reduced-motion: reduce)').matches &&
        !document.hidden &&
        Math.max(source.length, target.length) <= ANIMATION_LENGTH_LIMIT
      let from =
        animate ? toFrame(source, { ...options, words: true, marks }) : null
      let to = from ? syncKeys(from, toMotionFrame(target, options)) : null
      if (from && to && to.tokens.length <= ANIMATION_TOKEN_LIMIT) {
        animating = true
        flushSync()
        await animator.animate(from, to, signal)
      }
      if (destroyed || !element.isConnected) {
        return
      }
      marks = []
      markProblems = []
      layerProblems = []
      animator.replace(toFrame(target, options))
      stale = false
      animating = false
      element.readOnly = false
      write(element, source, target)
      element.setSelectionRange(
        Math.min(selectionStart, target.length),
        Math.min(selectionEnd, target.length),
      )
      syncScroll()
      code = target
      oninput(target)
    } finally {
      transitioning = false
      animating = false
      element.readOnly = false
    }
  }

  /**
   * Moves the caret to a position and scrolls it into view.
   *
   * @param line - 1-based line.
   * @param column - 1-based column.
   */
  export function select(line: number, column: number): void {
    if (!textarea) {
      return
    }
    let lineStarts = getLineStarts(code)
    let lineStart = lineStarts[Math.min(line, lineStarts.length) - 1] ?? 0
    let offset = Math.min(lineStart + column - 1, code.length)
    textarea.focus({ preventScroll: true })
    textarea.setSelectionRange(offset, offset)
    let lineHeight = textarea.scrollHeight / lineStarts.length
    let top = textarea.getBoundingClientRect().top + scrollY
    let reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    scrollTo({
      top: top + lineHeight * (line - 1) - innerHeight / 2,
      behavior: reduceMotion ? 'instant' : 'smooth',
    })
    syncScroll()
  }

  /**
   * Replaces the whole code the way typing would, so Cmd/Ctrl+Z restores the
   * previous code.
   *
   * @param text - New code.
   */
  export function replaceAll(text: string): void {
    if (!textarea || text === code || transitioning) {
      return
    }
    let previous = code
    hideHover()
    write(textarea, previous, text)
    code = text
    marks = shiftMarks(marks, previous, text)
    scheduleHighlight(true)
    oninput(text)
  }

  /**
   * Underlines the problems of the current code.
   *
   * @param problems - Problems reported for the code on screen.
   */
  export function setProblems(problems: LintProblem[]): void {
    marks = toMarks(code, problems)
    markProblems = problems
    scheduleHighlight(false)
  }

  /**
   * Opens the tooltip for an underlined token. It is anchored to the start of
   * the underline on the token's line, so it stays still while the pointer
   * moves along one underline. The layer is redrawn with new elements, so the
   * same element always shows the same problems.
   *
   * @param token - Underlined token under the pointer.
   */
  function showHover(token: HTMLElement): void {
    if (token === hoverToken && hoverAnchor) {
      return
    }
    let classes = [...token.classList].filter(name =>
      name.startsWith('problem-'),
    )
    let problems = classes.flatMap(name => {
      let problem = layerProblems[Number(name.slice('problem-'.length))]
      return problem ? [problem] : []
    })
    if (!layer || problems.length === 0) {
      return
    }
    let first: Element = token
    let previous = first.previousElementSibling
    while (
      previous &&
      previous.tagName !== 'BR' &&
      previous.classList.contains(classes[0]!)
    ) {
      first = previous
      previous = first.previousElementSibling
    }
    let tokenBox = token.getBoundingClientRect()
    let left = Math.max(
      first.getBoundingClientRect().left,
      layer.getBoundingClientRect().left,
    )
    hoverToken = token
    hovered = problems
    hoverAnchor = { bottom: tokenBox.bottom, top: tokenBox.top, left }
  }

  /**
   * Writes only the part of the text that changed, so the browser keeps a
   * native undo entry: replacing the whole value from a selection that ends
   * with a line break breaks redo in Chromium. Large changes set the value
   * directly, see `NATIVE_WRITE_LINE_LIMIT`. Page scroll and focus are restored
   * afterwards.
   *
   * @param element - Editor textarea.
   * @param from - Current text.
   * @param to - Text to write.
   */
  function write(element: HTMLTextAreaElement, from: string, to: string): void {
    let { fromEnd, start, toEnd } = getChangedRange(from, to)
    let text = to.slice(start, toEnd)
    let lines = countLines(text) + countLines(from.slice(start, fromEnd))
    let focused = document.activeElement
    let pageScroll = scrollY
    element.focus({ preventScroll: true })
    element.setSelectionRange(start, fromEnd)
    programmatic = true
    let inserted =
      lines <= NATIVE_WRITE_LINE_LIMIT &&
      document.execCommand('insertText', false, text)
    programmatic = false
    if (!inserted || element.value !== to) {
      element.value = to
      element.setSelectionRange(toEnd, toEnd)
    }
    scrollTo({ behavior: 'instant', top: pageScroll })
    if (
      focused !== element &&
      focused instanceof HTMLElement &&
      focused.isConnected
    ) {
      focused.focus({ preventScroll: true })
    }
  }

  function findHoveredToken(): HTMLElement | null {
    if (!pointer || !layer || transitioning || stale) {
      return null
    }
    for (let element of document.elementsFromPoint(pointer.x, pointer.y)) {
      if (
        element instanceof HTMLElement &&
        element.classList.contains('lint') &&
        layer.contains(element)
      ) {
        return element
      }
    }
    return null
  }

  /**
   * Shows the problems of the underlined code under the pointer. The textarea
   * covers the highlighted layer, so the token is found by hit testing through
   * it.
   */
  function updateHover(): void {
    hoverFrame = 0
    let token = findHoveredToken()
    if (!token) {
      hideHover()
      return
    }
    if (hoverAnchor) {
      showHover(token)
      return
    }
    hoverTimer ??= setTimeout(() => {
      hoverTimer = undefined
      let current = findHoveredToken()
      if (current) {
        showHover(current)
      }
    }, HOVER_DELAY)
  }

  function scheduleHighlight(codeChanged: boolean): void {
    if (transitioning) {
      return
    }
    cancelPendingHighlight()
    if (code.length > INSTANT_LIMIT) {
      stale ||= codeChanged
      highlightTimer = setTimeout(highlight, 150)
      return
    }
    highlightFrame = requestAnimationFrame(highlight)
  }

  /**
   * Builds the frame for the code on screen. Code over the size limit is drawn
   * as plain text without underlines: the layer still sets the height of the
   * editor, so the textarea can show all of it.
   *
   * @returns Frame for the renderer.
   */
  function currentFrame(): KeyedTokensInfo {
    let plain = code.length > CODE_SIZE_LIMIT
    layerProblems = plain ? [] : markProblems
    hoverToken = null
    return toFrame(code, {
      highlighter: plain ? null : highlighter,
      marks: plain ? [] : marks,
      theme: $shiki.theme,
    })
  }

  function handlePointerMove(event: PointerEvent): void {
    if (event.pointerType === 'touch') {
      return
    }
    if (event.buttons !== 0) {
      endHover()
      return
    }
    pointer = { x: event.clientX, y: event.clientY }
    hoverFrame ||= requestAnimationFrame(updateHover)
  }

  function handleInput(): void {
    if (programmatic) {
      return
    }
    endHover()
    let previous = code
    code = textarea!.value
    marks = shiftMarks(marks, previous, code)
    scheduleHighlight(true)
    oninput(code)
  }

  function highlight(): void {
    highlightFrame = 0
    animator?.replace(currentFrame())
    stale = false
    syncScroll()
    if (pointer && hoverAnchor) {
      hoverFrame ||= requestAnimationFrame(updateHover)
    }
  }

  function hideHover(): void {
    cancelAnimationFrame(hoverFrame)
    hoverFrame = 0
    clearTimeout(hoverTimer)
    hoverTimer = undefined
    hoverAnchor = undefined
    hovered = []
    hoverToken = null
  }

  function countLines(text: string): number {
    let count = 0
    let index = text.indexOf('\n')
    while (index !== -1) {
      count++
      index = text.indexOf('\n', index + 1)
    }
    return count
  }

  function cancelPendingHighlight(): void {
    cancelAnimationFrame(highlightFrame)
    clearTimeout(highlightTimer)
    highlightFrame = 0
  }

  function syncScroll(): void {
    if (layer && textarea) {
      layer.scrollLeft = textarea.scrollLeft
    }
  }

  /**
   * Closes the tooltip until the pointer moves again, for example when the user
   * starts typing or dragging a selection.
   */
  function endHover(): void {
    pointer = null
    hideHover()
  }

  onMount(() => {
    animator = createAnimator(layer!, currentFrame())
    let stops = [
      on(globalThis, 'scroll', hideHover, { passive: true }),
      on(globalThis, 'resize', hideHover),
      on(globalThis, 'keydown', endHover),
    ]
    return () => {
      destroyed = true
      cancelPendingHighlight()
      hideHover()
      for (let stop of stops) {
        stop()
      }
    }
  })

  $effect(() => {
    let { highlighter: current } = $shiki
    if (!current || highlighter) {
      return
    }
    highlighter = current
    untrack(() => scheduleHighlight(false))
  })
</script>

<div
  data-phase={animating ? 'animate' : 'edit'}
  class:stale
  class="editor"
>
  <pre
    class="layer shiki-magic-move-container"
    aria-hidden="true"
    bind:this={layer}></pre>
  <textarea
    {...{ autocorrect: 'off' }}
    aria-describedby={describedby}
    onpointerleave={endHover}
    onpointermove={handlePointerMove}
    onpointerdown={hideHover}
    oninput={handleInput}
    autocapitalize="off"
    onscroll={() => {
      hideHover()
      syncScroll()
    }}
    autocomplete="off"
    spellcheck="false"
    bind:this={textarea}
    aria-label="Code"
    class="input"
    value={initial}
    {placeholder}
    wrap="off"></textarea>
  <PlaygroundTooltip
    anchor={hoverAnchor ?? null}
    problems={hovered}
    {showRules}
  />
</div>

<style>
  .editor {
    position: relative;
    overflow: clip;
    text-size-adjust: 100%;
    background: var(--color-code-background);

    @media (width < 800px), (pointer: coarse) {
      --font-code: 400 1rem / 1.7 var(--font-family-code);
    }
  }

  .layer {
    min-block-size: 1lh;
    overflow: hidden;
    tab-size: 2;
    background: transparent;
    border: none;
    border-radius: 0;
  }

  /*
   * Inline tokens keep the text flow of the textarea while editing: tab stops
   * and sub-pixel glyph positions match. Transforms need inline-block, so it
   * is used only while the renderer animates.
   */
  [data-phase='edit'] .layer :global(.shiki-magic-move-item) {
    display: inline;
  }

  .layer :global(.lint) {
    text-decoration: underline wavy var(--color-status-danger) 1px;
    text-decoration-skip-ink: none;
    text-underline-offset: 0.25em;

    /*
     * No transition here: it would replace the renderer's transitions on
     * moving tokens, and underlined tokens would jump instead of sliding.
     */
    [data-phase='animate'] & {
      text-decoration-color: transparent;
    }
  }

  .stale .layer {
    visibility: hidden;
  }

  .input {
    position: absolute;
    inset: 0;
    padding: var(--space-m);
    margin: 0;
    overflow: auto hidden;
    font: var(--font-code);
    font-variant-ligatures: none;
    color: transparent;
    tab-size: 2;
    white-space: pre;
    caret-color: var(--color-code-foreground);
    resize: none;
    outline: none;
    scroll-padding-inline: var(--space-m);
    background: transparent;
    border: none;
    -webkit-text-fill-color: transparent;

    &::selection {
      background: var(--color-code-selection);
    }

    &::placeholder {
      color: var(--color-content-tertiary);
      -webkit-text-fill-color: currentcolor;
    }

    &:read-only {
      caret-color: transparent;
    }

    .stale & {
      color: var(--color-code-foreground);
      -webkit-text-fill-color: currentcolor;
    }
  }
</style>
