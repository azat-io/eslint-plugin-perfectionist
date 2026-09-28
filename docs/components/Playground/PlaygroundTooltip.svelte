<script lang="ts">
  import type { LintProblem } from './lint-config'

  import { hasGroupHint, getRuleName, toSegments } from './problem-text'
  import PlaygroundGroups from './PlaygroundGroups.svelte'

  interface Props {
    /**
     * Problems of the hovered code.
     */
    problems: LintProblem[]

    /**
     * Box of the hovered code in viewport coordinates, or `null` to hide the
     * tooltip.
     */
    anchor: Anchor | null
    /**
     * Name the rule of each problem, as the problem list does.
     */
    showRules: boolean
  }

  interface Anchor {
    /**
     * Bottom edge of the hovered line, in viewport pixels.
     */
    bottom: number

    /**
     * Left edge of the underline on that line, in viewport pixels.
     */
    left: number

    /**
     * Top edge of the hovered line, in viewport pixels.
     */
    top: number
  }

  /**
   * Space between the code and the tooltip.
   */
  const GAP = 4

  /**
   * Smallest distance from the tooltip to the viewport edges.
   */
  const MARGIN = 8

  let { showRules, problems, anchor }: Props = $props()

  let tooltip = $state<HTMLDivElement>()

  $effect(() => {
    let element = tooltip
    if (!element || !('showPopover' in element)) {
      return
    }
    let open = element.matches(':popover-open')
    if (!anchor || problems.length === 0) {
      if (open) {
        element.hidePopover()
      }
      return
    }
    if (!open) {
      element.showPopover()
    }
    place(element, anchor)
  })

  /**
   * Puts the tooltip under the code, or above it when there is no room below,
   * and keeps it inside the viewport. It is measured at the viewport's left
   * edge, so the space left of its previous position does not narrow it.
   *
   * @param element - Tooltip element, already shown.
   * @param box - Box of the hovered code.
   */
  function place(element: HTMLElement, box: Anchor): void {
    element.style.setProperty('left', '0px')
    element.style.setProperty('top', '0px')
    let width = element.offsetWidth
    let height = element.offsetHeight
    let { clientHeight, clientWidth } = document.documentElement
    let left = Math.max(
      MARGIN,
      Math.min(box.left, clientWidth - width - MARGIN),
    )
    let top = box.bottom + GAP
    if (top + height > clientHeight - MARGIN) {
      top = Math.max(MARGIN, box.top - GAP - height)
    }
    element.style.setProperty('left', `${left}px`)
    element.style.setProperty('top', `${top}px`)
  }
</script>

<div
  bind:this={tooltip}
  aria-hidden="true"
  popover="manual"
  class="tooltip"
>
  {#each problems as problem, index (index)}
    {let ruleName = $derived(showRules ? getRuleName(problem.ruleId) : null)}
    <p class="problem">
      {#each toSegments(problem.message) as segment, segmentIndex (segmentIndex)}
        {#if segment.code}
          <code class="name">{segment.text}</code>
        {:else}
          {segment.text}
        {/if}
      {/each}
      {#if ruleName}
        <span class="rule">{ruleName}</span>
      {/if}
      {#if hasGroupHint(problem) && problem.groups}
        <PlaygroundGroups groups={problem.groups} />
      {/if}
    </p>
  {/each}
</div>

<style>
  /*
   * Hidden unless open. Browsers without popovers drop the second rule, so the
   * tooltip never shows there.
   */
  .tooltip {
    position: fixed;
    inset: auto;
    display: none;
    inline-size: max-content;
    max-inline-size: min(32rem, calc(100vi - 16px));
    padding: var(--space-2xs) var(--space-xs);
    margin: 0;
    overflow: visible;
    font: var(--font-xs);
    color: var(--color-content-primary);
    pointer-events: none;
    background: var(--color-background-tertiary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius);
    box-shadow: 0 4px 16px var(--color-overlay-primary);

    /* Group chips have the tooltip's background by default. */
    --group-background: var(--color-background-primary);

    @media (prefers-reduced-motion: no-preference) {
      animation: appear 120ms ease-out;
    }

    &:popover-open {
      display: block;
    }
  }

  .problem {
    margin: 0;
    overflow-wrap: anywhere;

    & + & {
      padding-block-start: var(--space-2xs);
      margin-block-start: var(--space-2xs);
      border-block-start: 1px solid var(--color-border-primary);
    }
  }

  .name {
    font-size: 0.9em;
  }

  .rule {
    margin-inline-start: var(--space-2xs);
    font: var(--font-code);
    font-size: 0.85em;
    color: var(--color-content-tertiary);
    white-space: nowrap;
  }

  @keyframes appear {
    0% {
      opacity: 0%;
    }

    100% {
      opacity: 100%;
    }
  }
</style>
