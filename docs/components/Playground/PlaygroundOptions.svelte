<script lang="ts">
  import type { OptionsProblem } from './problem-text'

  import ArrowRightIcon from '../../icons/arrow-right.svg?component'
  import AlertIcon from '../../icons/alert.svg?component'
  import { shiki } from '../../stores/shiki'

  interface Props {
    /**
     * Why the options can't be used, or `null` when they work.
     */
    problem: OptionsProblem | null

    /**
     * Called with the new text after every change.
     */
    onChange(value: string): void

    /**
     * An `eslint` comment in the code sets options of this rule, and ESLint
     * uses those instead.
     */
    overridden: boolean

    /**
     * Text of the field.
     */
    value: string

    /**
     * Rule the options are for, without the plugin prefix.
     */
    rule: string
  }

  const PLACEHOLDER = '{}'

  let { overridden, onChange, problem, value, rule }: Props = $props()

  let id = $props.id()
  let layer = $state<HTMLPreElement>()

  /**
   * Draws the highlighted text under the transparent textarea. The nodes are
   * built by hand: the text is user input, and a trailing zero-width space
   * gives an empty last line its height, as in the textarea.
   */
  $effect(() => {
    let element = layer
    if (!element) {
      return
    }
    let { highlighter, theme } = $shiki
    let lines =
      highlighter ?
        highlighter.codeToTokens(value, { lang: 'tsx', theme }).tokens
      : value.split('\n').map(line => [{ color: undefined, content: line }])
    let fragment = document.createDocumentFragment()
    for (let [index, line] of lines.entries()) {
      if (index > 0) {
        fragment.append('\n')
      }
      for (let token of line) {
        let span = document.createElement('span')
        span.textContent = token.content
        if (token.color) {
          span.style.color = token.color
        }
        fragment.append(span)
      }
    }
    fragment.append('​')
    element.replaceChildren(fragment)
  })
</script>

<div class="options">
  <div class="header">
    <label
      for="{id}-input"
      class="label"
    >
      Options
    </label>
    <a
      href="/rules/{rule}#options"
      class="docs-link"
    >
      All options
      <ArrowRightIcon class="inline-icon" />
    </a>
  </div>
  <div class={['field', problem && 'field-invalid']}>
    <div class="field-content">
      <pre
        class="layer"
        aria-hidden="true"
        bind:this={layer}></pre>
      <textarea
        {...{ autocorrect: 'off' }}
        oninput={event => onChange(event.currentTarget.value)}
        aria-describedby="{id}-note"
        aria-invalid={problem !== null}
        placeholder={PLACEHOLDER}
        autocapitalize="off"
        autocomplete="off"
        spellcheck="false"
        id="{id}-input"
        class="input"
        {value}></textarea>
    </div>
  </div>
  <div
    id="{id}-note"
    class="note"
  >
    {#if problem}
      <div class="problem">
        <AlertIcon class="problem-icon" />
        <div>
          {#each problem.lines as line, index (index)}
            <p class="problem-line">{line}</p>
          {/each}
          {#if problem.position}
            <p class="problem-line problem-position">
              Line {problem.position.line}, column {problem.position.column}
            </p>
          {/if}
        </div>
      </div>
    {:else if overridden}
      <p class="hint">
        A <code class="nowrap">/* eslint */</code>
        comment in your code sets options for {rule}, and ESLint uses those
        instead.
      </p>
    {:else}
      <p class="hint">
        Edit the options, or paste a rule entry or a whole eslint.config.js.
      </p>
    {/if}
  </div>
</div>

<style>
  .options {
    display: flex;
    flex-flow: column nowrap;
    gap: var(--space-2xs);
    margin-block-start: var(--space-s);
  }

  .header {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs) var(--space-s);
    align-items: baseline;
    justify-content: space-between;
  }

  .label {
    font: var(--font-s);
    color: var(--color-content-secondary);
  }

  .docs-link {
    display: inline-flex;
    flex-wrap: nowrap;
    gap: var(--space-4xs);
    align-items: center;
    font: var(--font-xs);
  }

  .options :global(.inline-icon) {
    inline-size: 1.1em;
    block-size: 1.1em;
  }

  /*
   * The textarea lies over the highlighted text with the same font, padding
   * and wrapping, and the text decides the height, so the field grows with
   * the options. Where the height is limited, as in the column next to the
   * editor, both scroll together inside the field.
   */
  .field {
    overflow: hidden auto;
    font: var(--font-code);
    scrollbar-width: thin;
    text-size-adjust: 100%;
    background: var(--color-code-background);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius);

    @media (prefers-reduced-motion: no-preference) {
      transition:
        border-color 200ms,
        box-shadow 200ms;
    }

    @media (width < 800px), (pointer: coarse) {
      --font-code: 400 1rem / 1.7 var(--font-family-code);
    }

    &:focus-within {
      outline: 2px solid transparent;
      outline-offset: 2px;
      box-shadow: 0 0 0 3px var(--color-border-brand);
    }
  }

  .field-content {
    position: relative;
  }

  .field-invalid {
    border-color: var(--color-status-danger);
  }

  .layer,
  .input {
    padding: var(--space-2xs) var(--space-xs);
    margin: 0;
    font: var(--font-code);
    font-variant-ligatures: none;
    overflow-wrap: anywhere;
    tab-size: 2;
    white-space: pre-wrap;
  }

  .layer {
    min-block-size: calc(2lh + 2 * var(--space-2xs));
    overflow: visible;
    color: var(--color-code-foreground);
    background: transparent;
    border: none;
    border-radius: 0;
  }

  .input {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    overflow: hidden;
    color: transparent;
    caret-color: var(--color-code-foreground);
    resize: none;
    outline: none;
    background: transparent;
    border: none;
    -webkit-text-fill-color: transparent;

    &::selection {
      background: var(--color-code-selection);
    }

    &::placeholder {
      color: var(--color-content-tertiary);
      -webkit-text-fill-color: currentcolor;
    }
  }

  .note {
    font: var(--font-xs);
  }

  .hint {
    margin: 0;
    color: var(--color-content-secondary);
  }

  .nowrap {
    white-space: nowrap;
  }

  .problem {
    display: flex;
    flex-wrap: nowrap;
    gap: var(--space-2xs);
    align-items: start;
    color: var(--color-status-danger);
    overflow-wrap: anywhere;

    & :global(.problem-icon) {
      flex-shrink: 0;
      inline-size: var(--size-icon-xs);
      block-size: 1lh;
    }
  }

  .problem-line {
    margin: 0;
  }

  .problem-position {
    color: var(--color-content-secondary);
  }
</style>
