<script lang="ts">
  import { untrack, tick } from 'svelte'
  import { on } from 'svelte/events'

  import type { LintProblem } from './lint-config'

  import { hasGroupHint, getRuleName, toSegments } from './problem-text'
  import SparkleIcon from '../../icons/sparkle.svg?component'
  import PlaygroundGroups from './PlaygroundGroups.svelte'

  interface Props {
    /**
     * Called with the 1-based position of a problem the user picked.
     */
    onselect(line: number, column: number): void

    /**
     * Problems to list, in order of position.
     */
    problems: LintProblem[]

    /**
     * Text to show when the code was linted and has no problems, or `null` when
     * there is nothing to say, for example after a parse error.
     */
    empty: string | null

    /**
     * Show which rule reported each problem.
     */
    showRules: boolean

    /**
     * Sort is running or waiting for the result of the sorted code. The list
     * keeps its height and fades, then shrinks to the new result.
     */
    settling: boolean

    /**
     * The linter is still loading; placeholder rows are shown.
     */
    loading: boolean
  }

  /**
   * Rows shown before the rest is collapsed behind a button.
   */
  const VISIBLE_LIMIT = 50

  let { showRules, problems, settling, onselect, loading, empty }: Props =
    $props()

  let expanded = $state(false)
  let section = $state<HTMLElement>()

  /**
   * The list scrolls in the column next to the editor and has more rows above
   * or below the visible ones. Lines on those edges tell so.
   */
  let hidden = $state({ above: false, below: false })

  let shown = $derived(expanded ? problems : problems.slice(0, VISIBLE_LIMIT))

  /**
   * Height of the list when Sort started, measured before the result changes
   * it.
   */
  let heldSize = $derived(
    settling ? untrack(() => section?.offsetHeight ?? 0) : 0,
  )

  function measureScroll(): void {
    if (!section) {
      return
    }
    let { scrollHeight, clientHeight, scrollTop } = section
    let above = scrollTop > 1
    let below = scrollTop + clientHeight < scrollHeight - 1
    if (above !== hidden.above || below !== hidden.below) {
      hidden = { above, below }
    }
  }

  $effect(() => {
    let element = section
    if (!element) {
      return
    }
    /*
     * New rows change the scroll height without resizing the list itself.
     */
    let resizes = new ResizeObserver(measureScroll)
    let mutations = new MutationObserver(measureScroll)
    resizes.observe(element)
    mutations.observe(element, { childList: true, subtree: true })
    let stop = on(element, 'scroll', measureScroll, { passive: true })
    return () => {
      resizes.disconnect()
      mutations.disconnect()
      stop()
    }
  })
</script>

<section
  style:min-block-size={heldSize ? `${heldSize}px` : undefined}
  class:edge-below={hidden.below}
  class:edge-above={hidden.above}
  aria-label="Problems"
  class:fading={settling}
  bind:this={section}
  inert={settling}
  class="problems"
>
  {#if loading}
    <div class="skeleton"></div>
    <div class="skeleton"></div>
  {:else if problems.length > 0}
    <ol class="list">
      {#each shown as problem, index (index)}
        {let ruleName = $derived(
          showRules ? getRuleName(problem.ruleId) : null,
        )}
        <li class="problem">
          <button
            onclick={() => onselect(problem.line, problem.column)}
            aria-label="{problem.line}:{problem.column}, go to line {problem.line}, column {problem.column}"
            class="position"
            type="button"
          >
            {problem.line}:{problem.column}
          </button>
          <span class="message">
            {#each toSegments(problem.message) as segment, segmentIndex (segmentIndex)}
              {#if segment.code}
                <code class="name">{segment.text}</code>
              {:else}
                {segment.text}
              {/if}
            {/each}
            {#if hasGroupHint(problem) && problem.groups}
              <PlaygroundGroups groups={problem.groups} />
            {/if}
          </span>
          {#if ruleName}
            <a
              href="/rules/{ruleName}"
              class="rule"
            >
              {ruleName}
            </a>
          {/if}
        </li>
      {/each}
    </ol>
    {#if shown.length < problems.length}
      <button
        onclick={async () => {
          let first = shown.length
          expanded = true
          await tick()
          let rows = section?.querySelectorAll<HTMLButtonElement>('.position')
          rows?.[first]?.focus()
        }}
        class="more"
        type="button"
      >
        Show {problems.length - shown.length} more
      </button>
    {/if}
  {:else if empty}
    <div class="empty">
      <SparkleIcon class="empty-icon" />
      <div>
        <p class="empty-title">{empty}</p>
        <p class="empty-hint">Copy config to sort your project the same way.</p>
      </div>
    </div>
  {/if}
</section>

<style>
  .problems {
    margin-block: var(--space-m);
    container-type: inline-size;

    @media (prefers-reduced-motion: no-preference) {
      transition:
        opacity 500ms ease,
        min-block-size 300ms ease;
    }
  }

  .fading {
    opacity: 40%;
  }

  /*
   * Lines stick to the edges of the scrolling list and show only while rows
   * are hidden behind that edge.
   */
  .problems::before,
  .problems::after {
    position: sticky;
    z-index: 1;
    display: block;
    block-size: 1px;
    pointer-events: none;
    content: '';
    background: var(--color-border-primary);
    opacity: 0%;

    @media (prefers-reduced-motion: no-preference) {
      transition: opacity 200ms;
    }
  }

  .problems::before {
    inset-block-start: 0;
    margin-block-end: -1px;
  }

  .problems::after {
    inset-block-end: 0;
    margin-block-start: -1px;
  }

  .edge-above::before,
  .edge-below::after {
    opacity: 100%;
  }

  .empty {
    display: flex;
    flex-wrap: nowrap;
    gap: var(--space-xs);
    align-items: start;
    padding-block: var(--space-xs);
    font: var(--font-xs);

    & :global(.empty-icon) {
      flex-shrink: 0;
      inline-size: var(--size-icon-xs);
      block-size: 1lh;
      color: var(--color-status-success);
    }
  }

  .empty-title {
    margin: 0;
    font-weight: 600;
  }

  .empty-hint {
    margin: 0;
    color: var(--color-content-secondary);
  }

  .list {
    padding: 0;
    margin: 0;
    list-style-type: '';
  }

  .problem {
    display: grid;
    grid-template-columns: [position] 5ch [message] 1fr [rule] auto;
    gap: var(--space-s);
    align-items: baseline;
    padding-block: var(--space-2xs);
    margin: 0;
    font: var(--font-xs);
    color: var(--color-content-primary);
    border-block-end: 1px solid var(--color-border-primary);
  }

  /*
   * A narrow list, on a phone or in the column next to the editor, puts the
   * rule name under the message.
   */

  @container (inline-size < 30rem) {
    .problem {
      grid-template-columns: [position] 5ch [message] 1fr;
      row-gap: var(--space-4xs);
    }

    .rule {
      grid-column: message;
      justify-self: start;
    }
  }

  .position {
    padding: 0;
    font: var(--font-code);
    color: var(--color-content-brand);
    text-align: start;
    text-decoration: underline;
    text-underline-offset: 0.25em;
    outline: none;
    background: none;
    border: none;
    border-radius: var(--border-radius);

    @media (prefers-reduced-motion: no-preference) {
      transition:
        color 200ms,
        background-color 200ms,
        box-shadow 200ms;
    }

    @media (hover: hover) {
      &:hover {
        color: var(--color-content-brand-hover);
      }
    }

    &:focus-visible {
      text-decoration: none;
      outline: 2px solid transparent;
      outline-offset: 2px;
      background: var(--color-overlay-brand);
      box-shadow: 0 0 0 3px var(--color-border-brand);
    }
  }

  .message {
    overflow-wrap: anywhere;
  }

  .name {
    font-size: 0.9em;
  }

  .rule {
    font: var(--font-code);
    font-size: 0.85em;
    color: var(--color-content-tertiary);
    white-space: nowrap;
  }

  .more {
    padding: var(--space-2xs) 0;
    margin-block-start: var(--space-2xs);
    font: var(--font-xs);
    color: var(--color-content-brand);
    outline: none;
    background: none;
    border: none;
    border-radius: var(--border-radius);

    @media (prefers-reduced-motion: no-preference) {
      transition: box-shadow 200ms;
    }

    &:focus-visible {
      outline: 2px solid transparent;
      outline-offset: 2px;
      box-shadow: 0 0 0 3px var(--color-border-brand);
    }
  }

  .skeleton {
    block-size: 1lh;
    margin-block: var(--space-2xs);
    font: var(--font-xs);
    background: var(--color-background-tertiary);
    border-radius: var(--border-radius);

    &:last-child {
      inline-size: 60%;
    }
  }
</style>
