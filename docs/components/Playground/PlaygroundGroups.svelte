<script lang="ts">
  import type { ProblemGroups } from './lint-config'

  interface Props {
    /**
     * Names and groups of the two elements the problem is about.
     */
    groups: ProblemGroups
  }

  let { groups }: Props = $props()
</script>

<span class="groups">
  {#if groups.right === groups.left}
    Both in <span class="group">{groups.right}</span>
  {:else}
    <code class="name">{groups.rightName}</code> in
    <span class="group">{groups.right}</span>,
    <code class="name">{groups.leftName}</code> in
    <span class="group">{groups.left}</span>
  {/if}
</span>

<style>
  /*
   * Inline text, so the hint wraps between words like the message above it.
   */
  .groups {
    display: block;
    margin-block-start: var(--space-4xs);
    font: var(--font-xs);
    font-size: 0.9em;
    color: var(--color-content-secondary);
  }

  .name {
    font-size: 0.9em;
  }

  .group {
    padding-inline: var(--space-2xs);
    font: var(--font-code);
    font-size: 0.8em;
    white-space: nowrap;
    background: var(--group-background, var(--color-background-tertiary));
    border-radius: var(--border-radius);
  }
</style>
