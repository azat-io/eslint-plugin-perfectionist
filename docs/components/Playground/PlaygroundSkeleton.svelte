<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    /**
     * Content for readers without JavaScript, shown in the editor column.
     */
    children?: Snippet

    /**
     * Code the Playground opens with. Its line count sets the card height.
     */
    code: string
  }

  let { children, code }: Props = $props()
</script>

<div
  style:--lines={code.split('\n').length}
  class="skeleton"
>
  <div class="skeleton-toolbar"></div>
  <div class="skeleton-card"></div>
  {@render children?.()}
</div>

<style>
  /*
   * Sizes match the mounted Playground: toolbar rows above the card, and the
   * card header and action strip around the code.
   */
  .skeleton {
    @media (width >= 1200px) {
      display: grid;
      grid-template-columns: [editor] minmax(0, 1fr) [side] clamp(
          22rem,
          34%,
          26rem
        );
      gap: var(--space-l);
      align-items: start;
    }
  }

  .skeleton-toolbar {
    block-size: 6.25rem;

    @media (width < 900px) {
      block-size: 8.75rem;
    }

    @media (width < 800px) {
      block-size: 13rem;
    }

    @media (width >= 1200px) {
      grid-row: 1;
      grid-column: side;
    }
  }

  .skeleton-card {
    block-size: calc(var(--lines) * 1lh + var(--space-m) * 2 + 7.25rem);
    font: var(--font-code);
    background: var(--color-code-background);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius);

    @media (width < 800px), (pointer: coarse) {
      font: normal 1rem / 1.7 var(--font-family-code);
    }

    @media (width >= 1200px) {
      grid-row: 1;
      grid-column: editor;
    }
  }

  .skeleton-toolbar,
  .skeleton-card {
    @media (scripting: none) {
      display: none;
    }
  }
</style>
