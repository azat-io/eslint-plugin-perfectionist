<script lang="ts">
  import type { Snippet } from 'svelte'

  import type { SortingOrder, SortingType } from './lint-config'

  import CopyDefaultIcon from '../../icons/copy-default.svg?component'
  import ChevronDownIcon from '../../icons/chevron-down.svg?component'
  import CopyCopiedIcon from '../../icons/copy-copied.svg?component'
  import { getSettingsSnippet, getPreset } from './config-snippet'
  import LinkChainIcon from '../../icons/link-chain.svg?component'

  interface Props {
    /**
     * Sorting keys the Options field sets. ESLint uses those instead of the
     * controls.
     */
    overrides: { order: boolean; type: boolean }

    /**
     * Called when the user picks another order.
     */
    onOrderChange(order: SortingOrder): void

    /**
     * Called when the user picks another rule, or `null` for all rules.
     */
    onRuleChange(rule: string | null): void

    /**
     * Called when the user picks another sorting type.
     */
    onTypeChange(type: SortingType): void

    /**
     * Copies the link, a Markdown summary or a rule test.
     */
    onShare(kind: ShareKind): void

    /**
     * Which share text was copied a moment ago, to confirm it on its button.
     */
    shared: ShareKind | null

    /**
     * The config can be copied: the options could be read.
     */
    configReady: boolean

    /**
     * Selected rule, or `null` for all rules of the recommended configs.
     */
    rule: string | null

    /**
     * Selected sorting order.
     */
    order: SortingOrder

    /**
     * A rule test can be built: one rule is selected and its result is known.
     */
    testReady: boolean

    /**
     * The Options field of a single rule.
     */
    options?: Snippet

    /**
     * Selected sorting type.
     */
    type: SortingType

    /**
     * Rules whose options an `eslint` comment in the code changed.
     */
    inline: string[]

    /**
     * Rules to choose from.
     */
    rules: string[]
  }

  /**
   * Texts the toolbar can copy through the Playground.
   */
  type ShareKind = 'markdown' | 'config' | 'link' | 'test'

  const TYPES: { value: SortingType; label: string }[] = [
    { value: 'alphabetical', label: 'Alphabetical' },
    { value: 'natural', label: 'Natural' },
    { value: 'line-length', label: 'Line length' },
  ]

  const ORDERS: { value: SortingOrder; label: string }[] = [
    { label: 'Ascending', value: 'asc' },
    { label: 'Descending', value: 'desc' },
  ]

  let {
    onOrderChange,
    onRuleChange,
    onTypeChange,
    configReady,
    overrides,
    testReady,
    options,
    onShare,
    shared,
    inline,
    order,
    rules,
    rule,
    type,
  }: Props = $props()

  let id = $props.id()
  let preset = $derived(getPreset(type, order))
  let snippet = $derived(getSettingsSnippet(type, order))
</script>

<div class="toolbar">
  <label class="field">
    <span class="label">Rule</span>
    <span class="select-wrapper">
      <select
        onchange={event => onRuleChange(event.currentTarget.value || null)}
        value={rule ?? ''}
        class="select"
      >
        <option value="">All rules (recommended)</option>
        {#each rules as ruleId (ruleId)}
          <option value={ruleId}>{ruleId}</option>
        {/each}
      </select>
      <ChevronDownIcon class="select-icon" />
    </span>
  </label>
  <fieldset
    aria-describedby={overrides.type ? `${id}-overrides` : undefined}
    disabled={overrides.type}
    class="segments"
  >
    <legend class="visually-hidden">Sorting type</legend>
    {#each TYPES as option (option.value)}
      <label class="segment">
        <input
          onchange={() => onTypeChange(option.value)}
          checked={type === option.value}
          class="segment-input"
          value={option.value}
          name="{id}-type"
          type="radio"
        />
        {option.label}
      </label>
    {/each}
  </fieldset>
  <fieldset
    aria-describedby={overrides.order ? `${id}-overrides` : undefined}
    disabled={overrides.order}
    class="segments"
  >
    <legend class="visually-hidden">Order</legend>
    {#each ORDERS as option (option.value)}
      <label class="segment">
        <input
          onchange={() => onOrderChange(option.value)}
          checked={order === option.value}
          class="segment-input"
          value={option.value}
          name="{id}-order"
          type="radio"
        />
        {option.label}
      </label>
    {/each}
  </fieldset>
  {#if overrides.type || overrides.order}
    <p
      id="{id}-overrides"
      class="overrides"
    >
      {#if overrides.type && overrides.order}
        Type and order are
      {:else if overrides.type}
        Type is
      {:else}
        Order is
      {/if}
      set in Options.
    </p>
  {/if}
</div>

{@render options?.()}

<div class="details">
  {#if rule === null}
    <p class="hint">
      {#if inline.length > 0}
        Options for {inline.join(', ')} come from the
        <code class="nowrap">/* eslint */</code>
        comment in your code.
      {:else if preset}
        Same as <a href="/configs/{preset}">{preset}</a>
      {:else}
        <code class="snippet">{snippet}</code>
      {/if}
    </p>
  {/if}
  <div class="share">
    <button
      onclick={() => onShare('config')}
      disabled={!configReady}
      class="share-button"
      type="button"
    >
      {#if shared === 'config'}
        <CopyCopiedIcon class="copy-icon" />
        Config copied
      {:else}
        <CopyDefaultIcon class="copy-icon" />
        Copy config
      {/if}
    </button>
    <button
      onclick={() => onShare('link')}
      class="share-button copy-link"
      type="button"
    >
      {#if shared === 'link'}
        <CopyCopiedIcon class="copy-icon" />
        Link copied
      {:else}
        <LinkChainIcon class="copy-icon" />
        Copy link
      {/if}
    </button>
    <button
      onclick={() => onShare('markdown')}
      class="share-button"
      type="button"
    >
      {#if shared === 'markdown'}
        <CopyCopiedIcon class="copy-icon" />
        Markdown copied
      {:else}
        <CopyDefaultIcon class="copy-icon" />
        Copy as Markdown
      {/if}
    </button>
    {#if testReady}
      <button
        onclick={() => onShare('test')}
        class="share-button"
        type="button"
      >
        {#if shared === 'test'}
          <CopyCopiedIcon class="copy-icon" />
          Test copied
        {:else}
          <CopyDefaultIcon class="copy-icon" />
          Copy as test
        {/if}
      </button>
    {/if}
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-s) var(--space-m);
    align-items: center;
  }

  .field {
    display: flex;
    flex: 1 1 220px;
    flex-wrap: nowrap;
    gap: var(--space-xs);
    align-items: center;
    max-inline-size: 320px;
  }

  /*
   * In a narrow container, such as a phone or the column next to the editor,
   * every control takes a full row.
   */

  @container (inline-size < 30rem) {
    .field {
      flex-basis: 100%;
      max-inline-size: none;
    }

    .segments {
      flex: 1 1 100%;
    }
  }

  .label {
    font: var(--font-s);
    color: var(--color-content-secondary);
  }

  .select-wrapper {
    position: relative;
    display: flex;
    flex: 1;
    flex-wrap: nowrap;
    align-items: center;
  }

  .select {
    inline-size: 100%;
    padding: var(--space-2xs) calc(var(--space-m) + var(--size-icon-xs))
      var(--space-2xs) var(--space-s);
    font: var(--font-s);
    line-height: 1.25;
    color: var(--color-content-secondary);
    appearance: none;
    outline: none;
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius);

    @media (prefers-reduced-motion: no-preference) {
      transition:
        background-color 200ms,
        box-shadow 200ms;
    }

    @media (hover: hover) {
      &:hover {
        background-color: var(--color-background-secondary-hover);
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

  .select-wrapper :global(.select-icon) {
    position: absolute;
    inset-inline-end: var(--space-xs);
    inline-size: var(--size-icon-xs);
    block-size: var(--size-icon-xs);
    color: var(--color-content-tertiary);
    pointer-events: none;
  }

  .segments {
    display: inline-flex;
    flex-wrap: nowrap;
    max-inline-size: 100%;
    padding: 0;
    margin: 0;
    border: none;

    &:disabled {
      opacity: 50%;
    }

    &:disabled :is(.segment, .segment-input) {
      cursor: not-allowed;
    }
  }

  .segment {
    position: relative;
    display: inline-flex;
    flex: 1 1 auto;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    padding: var(--space-2xs) var(--space-xs);
    font: var(--font-s);
    line-height: 1.25;
    color: var(--color-content-secondary);
    text-align: center;
    cursor: pointer;
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border-primary);
    border-inline-start-width: 0;

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

    &:first-of-type {
      border-inline-start-width: 1px;
      border-start-start-radius: var(--border-radius);
      border-end-start-radius: var(--border-radius);
    }

    &:last-of-type {
      border-start-end-radius: var(--border-radius);
      border-end-end-radius: var(--border-radius);
    }

    &:has(:checked) {
      color: var(--color-content-brand);
      background: var(--color-overlay-brand);
      box-shadow: inset 0 -2px 0 var(--color-content-brand);
    }

    &:has(:focus-visible) {
      z-index: 1;
      outline: 2px solid transparent;
      outline-offset: 2px;
      box-shadow: 0 0 0 3px var(--color-border-brand);
    }

    &:has(:checked:focus-visible) {
      box-shadow:
        inset 0 -2px 0 var(--color-content-brand),
        0 0 0 3px var(--color-border-brand);
    }

    @media (forced-colors: active) {
      &:has(:checked) {
        color: SelectedItemText;
        forced-color-adjust: none;
        background: SelectedItem;
      }
    }
  }

  .segment-input {
    position: absolute;
    inset: 0;
    margin: 0;
    cursor: pointer;
    opacity: 0%;
  }

  .share {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
    align-self: start;
    margin-inline-start: auto;
  }

  .share-button {
    display: inline-flex;
    flex-wrap: nowrap;
    gap: var(--space-2xs);
    align-items: center;
    padding: var(--space-2xs) var(--space-s);
    font: var(--font-xs);
    line-height: 1.25;
    color: var(--color-content-secondary);
    white-space: nowrap;
    outline: none;
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius);

    @media (prefers-reduced-motion: no-preference) {
      transition:
        background-color 200ms,
        box-shadow 200ms;
    }

    @media (hover: hover) {
      &:hover:enabled {
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

    &:disabled {
      cursor: not-allowed;
      opacity: 50%;
    }
  }

  .details {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs) var(--space-m);
    align-items: center;
    justify-content: space-between;
    margin-block: var(--space-xs) var(--space-m);
  }

  /*
   * Body text color: the tertiary one has a contrast of about 3.7:1 on the
   * light background, below the 4.5:1 small text needs.
   */
  .hint {
    flex: 1 1 20rem;
    margin: 0;
    font: var(--font-xs);
    color: var(--color-content-primary);
  }

  .snippet {
    overflow-wrap: anywhere;
    white-space: normal;
  }

  .nowrap {
    white-space: nowrap;
  }

  .overrides {
    flex-basis: 100%;
    margin: calc(var(--space-2xs) - var(--space-s)) 0 0;
    font: var(--font-xs);
    color: var(--color-content-secondary);
  }

  .details :global(.copy-icon) {
    flex-shrink: 0;
    inline-size: var(--size-icon-xs);
    block-size: var(--size-icon-xs);
  }

  .visually-hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
  }
</style>
