<script lang="ts">
  import { ShikiMagicMove } from '@shikijs/magic-move/svelte'
  import { onMount } from 'svelte'

  import ArrowRightIcon from '../icons/arrow-right.svg?component'
  import { shiki } from '../stores/shiki'
  import Button from './Button.svelte'

  export let initial: string
  export let alphabetical: string
  export let lineLength: string
  export let lang: string

  /**
   * Rule the example belongs to, for the Playground link. Pages without a rule,
   * such as the homepage, leave it out.
   */
  export let rule: string | null = null

  type Type = 'alphabetical' | 'lineLength' | 'initial'

  let code = {
    alphabetical,
    lineLength,
    initial,
  }
  let initialLines = initial.split(/\r\n|\r|\n/u).length
  let mounted = false

  let selected = 'initial' as Type
  $: ({ highlighter, theme } = $shiki)
  $: playgroundHref = getPlaygroundHref(rule, selected)

  /**
   * Links to the same example in the Playground. The Playground knows the
   * example of every rule, so the link carries only the rule and the sorting
   * type.
   *
   * @param ruleId - Rule of the example, if any.
   * @param type - Selected variant.
   * @returns Playground URL.
   */
  function getPlaygroundHref(ruleId: string | null, type: Type): string {
    let parameters = []
    if (ruleId) {
      parameters.push(`rule=${ruleId}`)
    }
    if (type === 'lineLength') {
      parameters.push('type=line-length')
    }
    /*
     * The hash is never empty: without it the Playground restores the last
     * state of the tab instead of this example.
     */
    return `/playground#${parameters.length > 0 ? parameters.join('&') : 'v=1'}`
  }

  onMount(() => {
    mounted = true
  })
</script>

<div class="buttons-wrapper">
  <div class="buttons">
    <Button
      onClick={() => {
        selected = 'alphabetical'
        if (globalThis.fathom) {
          globalThis.fathom.trackEvent('demo: sort alphabetically')
        }
      }}
      content="Sort Alphabetically"
      color="primary"
    />
    <Button
      onClick={() => {
        selected = 'lineLength'
        if (globalThis.fathom) {
          globalThis.fathom.trackEvent('demo: sort by line length')
        }
      }}
      content="Sort by Line Length"
      color="primary"
    />
  </div>
  <Button
    onClick={() => {
      selected = 'initial'
      if (globalThis.fathom) {
        globalThis.fathom.trackEvent('demo: reset')
      }
    }}
    color="secondary"
    content="Reset"
  />
</div>
{#if mounted && highlighter}
  <ShikiMagicMove
    options={{
      animateContainer: true,
      duration: 500,
      stagger: 3,
    }}
    code={code[selected]}
    {highlighter}
    tabindex={0}
    class="code"
    {theme}
    {lang}
  />
{:else}
  <div
    style:block-size="calc({initialLines}lh + var(--space-m) * 2)"
    class="code-loader"
  ></div>
{/if}
<p class="playground">
  <a
    on:click={() => {
      if (globalThis.fathom) {
        globalThis.fathom.trackEvent('demo: open playground')
      }
    }}
    href={playgroundHref}
    class="playground-link"
  >
    Open in Playground
    <ArrowRightIcon class="playground-icon" />
  </a>
</p>

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

  .playground {
    margin-block: var(--space-s) 0;
    font: var(--font-xs);
    text-align: end;
  }

  .playground-link {
    display: inline-flex;
    flex-wrap: nowrap;
    gap: var(--space-4xs);
    align-items: center;

    & :global(.playground-icon) {
      flex-shrink: 0;
      inline-size: 1.1em;
      block-size: 1.1em;
    }
  }

  .code-loader {
    font: var(--font-code);
    background: var(--color-code-background);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius);
  }
</style>
