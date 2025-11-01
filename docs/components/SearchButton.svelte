<script lang="ts">
  import SearchIcon from '../icons/search.svg?component'

  let { onclick }: { onclick(): void } = $props()
</script>

<button
  class="button"
  type="button"
  aria-label="Search"
  aria-keyshortcuts="ctrl+k"
  {onclick}
>
  <span class="title">Search</span>
  <SearchIcon class="icon" />
</button>

<style>
  .button {
    display: flex;
    gap: var(--space-s);
    align-items: center;
    padding: var(--space-2xs) var(--space-m);
    color: var(--color-content-secondary);
    cursor: pointer;
    outline: none;
    background-color: var(--color-background-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius);
    transition: background-color 200ms;

    &:hover {
      background-color: var(--color-background-secondary-hover);
    }

    &:focus-visible {
      background: var(--color-overlay-brand);
      box-shadow: 0 0 0 3px var(--color-border-brand);
      transition: box-shadow 200ms;
    }
  }

  .title {
    font: var(--font-s);
    line-height: 1.25;
  }

  .button :global(.icon) {
    flex-shrink: 0;
    inline-size: calc(var(--size-icon-s) * 0.85);
    block-size: calc(var(--size-icon-s) * 0.85);
  }
</style>
