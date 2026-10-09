<script lang="ts">
  import type { ProblemGroups } from './lint-config'

  interface Props {
    /**
     * Names and groups of the two elements the problem is about.
     */
    groups: ProblemGroups
  }

  let { groups }: Props = $props()

  /*
   * Pairs follow the order of the message, so the first name there comes
   * first here.
   */
  let pairs = $derived(
    groups.leftFirst ?
      [
        { name: groups.leftName, group: groups.left },
        { name: groups.rightName, group: groups.right },
      ]
    : [
        { name: groups.rightName, group: groups.right },
        { name: groups.leftName, group: groups.left },
      ],
  )
</script>

<span class="groups">
  {#if groups.right === groups.left}
    Both in <span class="group">{groups.right}</span>
  {:else}
    <code class="name">{pairs[0]!.name}</code> in
    <span class="group">{pairs[0]!.group}</span>,
    <code class="name">{pairs[1]!.name}</code> in
    <span class="group">{pairs[1]!.group}</span>
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
    overflow-wrap: anywhere;
    box-decoration-break: clone;
    background: var(--group-background, var(--color-background-tertiary));
    border-radius: var(--border-radius);
  }
</style>
