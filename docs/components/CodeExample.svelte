<script lang="ts">
  import { ShikiMagicMove } from 'shiki-magic-move/svelte'
  import { onMount } from 'svelte'

  import { shiki } from '../stores/shiki'
  import Button from './Button.svelte'

  export let initial: string
  export let alphabetical: string
  export let lineLength: string
  export let lang: string

  type Type = 'alphabetical' | 'lineLength' | 'initial'

  let code = {
    alphabetical,
    lineLength,
    initial,
  }
  let initialLines = initial.split(/\r\n|\r|\n/).length
  let mounted = false

  $: selected = 'initial' as Type

  onMount(() => {
    mounted = true
  })
</script>

<div class="buttons-wrapper">
  <div class="buttons">
    <Button
      color="primary"
      onClick={() => {
        selected = 'alphabetical'
      }}
    >
      Sort Alphabetically
    </Button>
    <Button
      color="primary"
      onClick={() => {
        selected = 'lineLength'
      }}
    >
      Sort by Line Length
    </Button>
  </div>
  <Button
    color="secondary"
    onClick={() => {
      selected = 'initial'
    }}
  >
    Reset
  </Button>
</div>
{#if mounted && $shiki.highlighter}
  <ShikiMagicMove
    options={{
      animateContainer: true,
      duration: 500,
      stagger: 3,
    }}
    highlighter={$shiki.highlighter}
    theme={$shiki.theme}
    code={code[selected]}
    class="code"
    {lang}
  />
{:else}
  <div
    style="block-size: calc({initialLines}lh + var(--space-m) * 2)"
    class="code-loader"
  ></div>
{/if}

<style>
  .buttons-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-m);
    justify-content: space-between;
    margin-block-end: var(--space-l);
    container-type: inline-size;
  }

  @container (inline-size >= 600px) {
    .buttons-wrapper {
      flex-direction: row;
    }
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: var(--space-m);
  }

  @container (inline-size >= 400px) {
    .buttons {
      flex-direction: row;
    }
  }

  .code-loader {
    font: var(--font-code);
    background: var(--color-code-background);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius);
  }
</style>
