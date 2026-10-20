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
    flex-wrap: nowrap;
    gap: var(--space-s);
    align-items: center;
    padding: var(--space-2xs) var(--space-m);
    color: var(--color-content-secondary);
    cursor: pointer;
    outline: none;
    background-color: var(--color-background-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius);

    @media (prefers-reduced-motion: no-preference) {
      transition: background-color 200ms;
    }

    @media (hover: hover) {
      &:hover {
        background-color: var(--color-background-secondary-hover);
      }
    }

    &:focus-visible {
      background: var(--color-overlay-brand);
      box-shadow: 0 0 0 3px var(--color-border-brand);

      @media (prefers-reduced-motion: no-preference) {
        transition: box-shadow 200ms;
      }
    }
  }

  .title {
    font: var(--font-s);
    line-height: 1.25;

    /* The header shows every navigation item from 800px, and the label would
    make it overflow below 900px. The icon and aria-label stay. */

    @media (800px <= width < 900px) {
      display: none;
    }
  }

  .button :global(.icon) {
    flex-shrink: 0;
    inline-size: calc(var(--size-icon-s) * 0.85);
    block-size: calc(var(--size-icon-s) * 0.85);
  }
</style>
