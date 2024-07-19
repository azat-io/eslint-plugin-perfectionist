<script lang="ts">
  import { ShikiMagicMove } from 'shiki-magic-move/svelte'
  import { focusGroupKeyUX, startKeyUX } from 'keyux'
  import { onMount } from 'svelte'

  import CopyDefaultIcon from '../icons/copy-default.svg?component'
  import CopyCopiedIcon from '../icons/copy-copied.svg?component'
  import { codeSettings } from '../stores/code-settings'
  import { shiki } from '../stores/shiki'

  interface Code {
    source: string
    value: string
    name: string
  }

  export let type: string
  export let code: Code[]
  export let lang: string

  let copied = false
  let mounted = false
  let initial = code[0]!.source
  let initialLines = initial.split(/\r\n|\r|\n/).length

  const copyCode = () => {
    navigator.clipboard.writeText(
      code.find(({ value }) => value === codeSettings.get()[type])?.source!,
    )
    copied = true
    setTimeout(() => {
      copied = false
    }, 2000)
  }

  onMount(() => {
    mounted = true
    startKeyUX(window, [focusGroupKeyUX()])
  })
</script>

<ul aria-orientation="horizontal" role="tablist" class="tabs">
  {#each code as codeValue}
    <button
      on:click={() => {
        codeSettings.setKey(type, codeValue.value)
      }}
      class:active-tab={mounted && $codeSettings[type] === codeValue.value}
      aria-selected={$codeSettings[type] === codeValue.value}
      type="button"
      class="tab"
      role="tab"
    >
      {codeValue.name}
    </button>
  {/each}
</ul>
{#if mounted && $shiki.highlighter && $codeSettings[type]}
  <div class="code-wrapper">
    <ShikiMagicMove
      options={{
        animateContainer: true,
        duration: 500,
        stagger: 3,
      }}
      code={code.find(({ value }) => value === $codeSettings[type])?.source ??
        ''}
      highlighter={$shiki.highlighter}
      theme={$shiki.theme}
      class="code"
      {lang}
    />
    <button
      aria-label="Copy code to clipboard"
      class:copy-button-copied={copied}
      class="copy-button"
      on:click={copyCode}
      type="button"
    >
      {#if copied}
        <CopyCopiedIcon class="copy-icon" />
      {:else}
        <CopyDefaultIcon class="copy-icon" />
      {/if}
    </button>
  </div>
{:else}
  <div
    style="block-size: calc({initialLines}lh + var(--space-m) * 2 + 2px)"
    class="code-loader"
  ></div>
{/if}

<style>
  .tabs {
    display: inline-flex;
    padding-inline-start: 0;
    margin-block: 0 -1px;
    border-block-end: none;
  }

  .tab {
    z-index: 1;
    padding: var(--space-2xs) var(--space-xs);
    font: var(--font-s);
    color: var(--color-content-secondary);
    background: var(--color-background-secondary);
    border: none;
    border-block-start: 1px solid var(--color-border-primary);
    border-block-end: 1px solid var(--color-border-primary);
    outline: none;
    transition: all 300ms;

    &:hover {
      background: var(--color-background-secondary-hover);
    }

    &:focus-visible {
      z-index: 2;
      background: var(--color-overlay-brand);
      box-shadow: 0 0 0 3px var(--color-border-brand);
    }
  }

  .tab:first-child {
    border-inline-start: 1px solid var(--color-border-primary);
    border-start-start-radius: var(--border-radius);
  }

  .tab:last-child {
    border-inline-end: 1px solid var(--color-border-primary);
    border-start-end-radius: var(--border-radius);
  }

  .active-tab {
    color: var(--color-content-primary);
    border-block-end-color: var(--color-content-primary);
    transition: border-color 600ms;
  }

  .code-wrapper {
    position: relative;
    margin-block-end: var(--space-m);
    overflow: hidden;
  }

  .code-wrapper :global(.code) {
    border-start-start-radius: 0;
  }

  .copy-button {
    display: none;

    @media (width >= 800px) {
      position: absolute;
      inset-block-start: var(--space-xs);
      inset-inline-end: var(--space-m);
      display: flex;
      align-items: center;
      justify-content: center;
      inline-size: 42px;
      block-size: 42px;
      color: var(--color-content-secondary);
      cursor: pointer;
      background: var(--color-background-secondary);
      border: none;
      border-radius: var(--border-radius);
      outline: none;
      opacity: 0%;
      transition: all 300ms;

      @media (hover: hover) {
        &:hover {
          background: var(--color-background-secondary-hover);
        }
      }

      &:focus-visible {
        background: var(--color-background-secondary-hover);
        box-shadow: 0 0 0 3px var(--color-border-brand);
        opacity: 100%;
      }
    }
  }

  .copy-button-copied {
    opacity: 100%;
  }

  @media (hover: hover) {
    .code-wrapper:hover .copy-button {
      opacity: 100%;
    }
  }

  .code-wrapper :global(.copy-icon) {
    inline-size: 24px;
    block-size: 24px;
  }

  .code-loader {
    margin-block-end: var(--space-m);
    font: var(--font-code);
    background: var(--color-code-background);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius);
    border-start-start-radius: 0;
  }
</style>
