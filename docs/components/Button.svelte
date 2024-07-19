<script lang="ts">
  export let color: 'primary' | 'secondary' = 'primary'
  export let onClick: () => void = () => {}
  export let content: string = ''
</script>

<button
  class:button-secondary={color === 'secondary'}
  class:button-primary={color === 'primary'}
  on:click={onClick}
  class="button"
  type="button"
>
  {content}
</button>

<style>
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 200px;
    block-size: 48px;
    padding: 0 16px;
    font: var(--font-xs);
    font-weight: 500;
    text-decoration: none;
    border: none;
    border-radius: var(--border-radius);
    outline: none;
    transition: all 200ms ease-in-out;

    &:focus-visible {
      text-decoration: none;
      box-shadow: 0 0 0 3px var(--color-border-brand);
    }

    &:active {
      transform: scale(95%);
    }
  }

  .button-primary {
    color: oklch(100% 0 0);
    background: var(--color-background-brand);

    &:focus-visible {
      background: var(--color-background-brand-hover);
    }

    @media (hover: hover) {
      &:hover {
        background: var(--color-background-brand-hover);
      }
    }
  }

  .button-secondary {
    color: var(--color-content-inverse);
    background: var(--color-background-inverse);

    &:focus-visible {
      background: var(--color-background-inverse-hover);
    }

    @media (hover: hover) {
      &:hover {
        background: var(--color-background-inverse-hover);
      }
    }
  }
</style>
