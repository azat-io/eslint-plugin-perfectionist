<script lang="ts">
  import type { InspectedBlock } from './inspection'

  import ArrowRightIcon from '../../icons/arrow-right.svg?component'
  import { getSlotHue } from './group-colors'

  interface Props {
    /**
     * Called with the group entry under the pointer, or `null` when it leaves.
     */
    onHighlight(slot: number | null): void

    /**
     * Block whose groups the legend lists, or `null` when there is none.
     */
    active: InspectedBlock | null

    /**
     * Blocks shown in the editor. Their elements are counted.
     */
    blocks: InspectedBlock[]

    /**
     * Selected rule, or `null` for all rules.
     */
    rule: string | null

    /**
     * The last lint failed, so the blocks are from an earlier result.
     */
    stale: boolean

    /**
     * The code has been linted, so the blocks are known.
     */
    ready: boolean
  }

  let { onHighlight, active, blocks, ready, stale, rule }: Props = $props()

  let id = $props.id()

  /**
   * Rows of the legend: each group entry with the number of its elements, and a
   * last row for elements outside of the groups.
   */
  let rows = $derived(getRows())

  let partitions = $derived(Math.max(0, ...blocks.map(countPartitions)))

  function getRows(): {
    slot: number | null
    names: string[]
    count: number
  }[] {
    if (!active) {
      return []
    }
    let { groups } = active
    let counts = Array.from({ length: groups.length + 1 }, () => 0)
    for (let block of blocks) {
      if (block.groups.length !== groups.length) {
        continue
      }
      for (let element of block.elements) {
        counts[Math.min(element.slot, groups.length)]! += 1
      }
    }
    let groupRows = groups.map((names, slot) => ({
      count: counts[slot]!,
      names,
      slot,
    }))
    let other = counts[groups.length]!
    return other > 0 ?
        [...groupRows, { count: other, slot: null, names: [] }]
      : groupRows
  }

  /**
   * Counts the partitions of a block.
   *
   * @param block - Inspected block.
   * @returns Number of partitions.
   */
  function countPartitions(block: InspectedBlock): number {
    let partitionIds = new Set(block.elements.map(element => element.partition))
    return partitionIds.size
  }
</script>

<section
  aria-labelledby="{id}-title"
  class="legend"
>
  <h2
    id="{id}-title"
    class="title"
  >
    Groups
    {#if active}
      <span class="rule">{active.rule}</span>
    {/if}
  </h2>
  {#if !ready}
    <p class="note">Groups show up once the code parses.</p>
  {:else if !active}
    <p class="note">
      {#if rule === 'sort-switch-case'}
        sort-switch-case has no groups.
      {:else if rule}
        {rule} found nothing to sort in this code.
      {:else}
        Put the caret into imports, an object or another block to see its
        groups.
      {/if}
    </p>
  {:else if active.groups.length === 0}
    <p class="note">
      The options of {active.rule} set no groups, so all elements sort together.
    </p>
  {:else}
    <ol
      onpointerleave={() => onHighlight(null)}
      class="rows"
    >
      {#each rows as row, index (index)}
        <li
          onpointerenter={() => onHighlight(row.slot)}
          class={['row', row.count === 0 && 'row-empty']}
        >
          <span class="index">{row.slot === null ? '' : row.slot + 1}</span>
          <span
            style:--hue={getSlotHue(row.slot)}
            class={['dot', row.slot === null && 'dot-other']}
          ></span>
          <span class="names">
            {#if row.slot === null}
              Not in groups, sorted last
            {:else}
              {#each row.names as name, nameIndex (nameIndex)}
                <code class="name">{name}</code>
              {/each}
            {/if}
          </span>
          <span class="count">
            {row.count === 0 ? '–' : row.count}
          </span>
        </li>
      {/each}
    </ol>
  {/if}
  {#if ready && stale}
    <p class="note">
      The last change can't be linted, so these groups are from the result
      before it.
    </p>
  {/if}
  {#if ready && active && partitions > 1}
    <p class="note">
      Dashed lines split {partitions} partitions. Each one sorts on its own.
    </p>
  {/if}
  {#if active}
    <a
      href="/rules/{active.rule}#groups"
      class="docs-link"
    >
      How groups work
      <ArrowRightIcon class="inline-icon" />
    </a>
  {/if}
</section>

<style>
  .legend {
    display: flex;
    flex-flow: column nowrap;
    gap: var(--space-2xs);
    padding-block-end: var(--space-s);
    margin-block-end: var(--space-s);
    border-block-end: 1px solid var(--color-border-primary);
  }

  .title {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    align-items: baseline;
    margin: 0;
    font: var(--font-s);
    font-weight: 600;
  }

  .rule {
    font: var(--font-code);
    font-size: 0.85em;
    font-weight: normal;
    color: var(--color-content-tertiary);
  }

  .note {
    margin: 0;
    font: var(--font-xs);
    color: var(--color-content-secondary);
  }

  .rows {
    display: flex;
    flex-flow: column nowrap;
    padding: 0;
    margin: 0;
    font: var(--font-xs);
  }

  .row {
    display: grid;
    grid-template-columns: [index] 1.5ch [dot] auto [names] 1fr [count] auto;
    gap: var(--space-2xs);
    align-items: baseline;
    padding-block: var(--space-4xs);
  }

  .row-empty {
    color: var(--color-content-tertiary);
  }

  .index {
    font-variant-numeric: tabular-nums;
    color: var(--color-content-tertiary);
    text-align: end;
  }

  .dot {
    inline-size: 0.6em;
    block-size: 0.6em;
    background: oklch(65% 0.15 var(--hue));
    border-radius: 50%;

    .row-empty & {
      background: none;
      border: 1px solid oklch(65% 0.15 var(--hue));
    }
  }

  .dot-other {
    background: var(--color-border-primary);
  }

  .names {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4xs);
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }

  .name {
    font-size: 0.85em;
  }

  .count {
    font-variant-numeric: tabular-nums;
    color: var(--color-content-secondary);
  }

  .docs-link {
    display: inline-flex;
    flex-wrap: nowrap;
    gap: var(--space-4xs);
    align-items: center;
    align-self: start;
    font: var(--font-xs);
  }

  .legend :global(.inline-icon) {
    inline-size: 1.1em;
    block-size: 1.1em;
  }
</style>
