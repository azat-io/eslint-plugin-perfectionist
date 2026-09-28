<script lang="ts">
  import { untrack, tick } from 'svelte'

  import type { LintProblem } from './lint-config'

  import { hasGroupHint, getRuleName, toSegments } from './problem-text'
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

  let { showRules, problems, settling, onselect, loading }: Props = $props()

  let expanded = $state(false)
  let section = $state<HTMLElement>()

  let shown = $derived(expanded ? problems : problems.slice(0, VISIBLE_LIMIT))

  /**
   * Height of the list when Sort started, measured before the result changes
   * it.
   */
  let heldSize = $derived(
    settling ? untrack(() => section?.offsetHeight ?? 0) : 0,
  )
</script>

<section
  style:min-block-size="{heldSize}px"
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
