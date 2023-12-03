<script lang="ts">
  import { quintOut } from 'svelte/easing'
  import { flip } from 'svelte/animate'
  import { onMount } from 'svelte'

  let list = [
    {
      id: 'import-1',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-keyword)">import</span><span style="color:var(--astro-code-color-text)"> Button </span><span style="color:var(--astro-code-token-keyword)">from</span><span style="color:var(--astro-code-token-string-expression)"> \'~/components/Button\'</span></span>',
    },
    {
      id: 'import-2',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-keyword)">import</span><span style="color:var(--astro-code-token-keyword)"> type</span><span style="color:var(--astro-code-color-text)"> { FC } </span><span style="color:var(--astro-code-token-keyword)">from</span><span style="color:var(--astro-code-token-string-expression)"> \'react\'</span></span>',
    },
    {
      id: 'import-3',
      source: '<span class="line"> </span>',
    },
    {
      id: 'import-4',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-keyword)">import</span><span style="color:var(--astro-code-color-text)"> {</span></span>',
    },
    {
      id: 'import-5',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">  useId</span><span style="color:var(--astro-code-token-punctuation)">,</span></span>',
    },
    {
      id: 'import-6',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">  useCallback</span><span style="color:var(--astro-code-token-punctuation)">,</span></span>',
    },
    {
      id: 'import-7',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">  useState</span><span style="color:var(--astro-code-token-punctuation)">,</span></span>',
    },
    {
      id: 'import-8',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">  useEffect</span><span style="color:var(--astro-code-token-punctuation)">,</span></span>',
    },
    {
      id: 'import-9',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">} </span><span style="color:var(--astro-code-token-keyword)">from</span><span style="color:var(--astro-code-token-string-expression)"> \'react\'</span></span>',
    },
    {
      id: 'import-10',
      source: '<span class="line"> </span>',
    },
    {
      id: 'import-11',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-keyword)">import</span><span style="color:var(--astro-code-color-text)"> Form </span><span style="color:var(--astro-code-token-keyword)">from</span><span style="color:var(--astro-code-token-string-expression)"> \'~/components/Form\'</span></span>',
    },
    {
      id: 'import-12',
      source: '<span class="line"> </span>',
    },
    {
      id: 'import-13',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-keyword)">import</span><span style="color:var(--astro-code-token-string-expression)"> \'./styles.css\'</span></span>',
    },
    {
      id: 'import-14',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-keyword)">import</span><span style="color:var(--astro-code-color-text)"> Input </span><span style="color:var(--astro-code-token-keyword)">from</span><span style="color:var(--astro-code-token-string-expression)"> \'~/components/Input\'</span></span>',
    },
    {
      id: 'import-15',
      source: '<span class="line"> </span>',
    },
    {
      id: 'import-16',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-keyword)">import</span><span style="color:var(--astro-code-token-keyword)"> type</span><span style="color:var(--astro-code-color-text)"> { FormValues } </span><span style="color:var(--astro-code-token-keyword)">from</span><span style="color:var(--astro-code-token-string-expression)"> \'~/stores/suth\'</span></span>',
    },
    {
      id: 'space-1',
      source: '<span class="line"> </span>',
    },
    {
      id: 'source-1',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-keyword)">interface</span><span style="color:var(--astro-code-token-function)"> Props</span><span style="color:var(--astro-code-color-text)"> {</span></span>',
    },
    {
      id: 'interface-1',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">  className</span><span style="color:var(--astro-code-token-keyword)">?:</span><span style="color:var(--astro-code-token-constant)"> string</span></span>',
    },
    {
      id: 'interface-2',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-function)">  onSubmit</span><span style="color:var(--astro-code-token-keyword)">:</span><span style="color:var(--astro-code-color-text)"> (values</span><span style="color:var(--astro-code-token-keyword)">:</span><span style="color:var(--astro-code-token-function)"> FormValues</span><span style="color:var(--astro-code-color-text)">) </span><span style="color:var(--astro-code-token-keyword)">=&gt;</span><span style="color:var(--astro-code-token-constant)"> void</span></span>',
    },
    {
      id: 'interface-3',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">  id</span><span style="color:var(--astro-code-token-keyword)">:</span><span style="color:var(--astro-code-token-constant)"> string</span></span>',
    },
    {
      id: 'interface-4',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-function)">  resetFormValues</span><span style="color:var(--astro-code-token-keyword)">:</span><span style="color:var(--astro-code-color-text)"> () </span><span style="color:var(--astro-code-token-keyword)">=&gt;</span><span style="color:var(--astro-code-token-constant)"> void</span></span>',
    },
    {
      id: 'interface-5',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">  title</span><span style="color:var(--astro-code-token-keyword)">:</span><span style="color:var(--astro-code-token-constant)"> string</span></span>',
    },
    {
      id: 'source-2',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">}</span></span>',
    },
    {
      id: 'space-2',
      source: '<span class="line"> </span>',
    },
    {
      id: 'source-3',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-keyword)">const</span><span style="color:var(--astro-code-token-function)"> Auth</span><span style="color:var(--astro-code-token-keyword)">:</span><span style="color:var(--astro-code-token-function)"> FC</span><span style="color:var(--astro-code-color-text)">&lt;</span><span style="color:var(--astro-code-token-function)">Props</span><span style="color:var(--astro-code-color-text)">&gt; </span><span style="color:var(--astro-code-token-keyword)">=</span><span style="color:var(--astro-code-color-text)"> props </span><span style="color:var(--astro-code-token-keyword)">=&gt;</span><span style="color:var(--astro-code-color-text)"> (</span></span>',
    },
    {
      id: 'source-4',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">  &lt;</span><span style="color:var(--astro-code-token-constant)">Form</span><span style="color:var(--astro-code-color-text)"> {</span><span style="color:var(--astro-code-token-keyword)">...</span><span style="color:var(--astro-code-color-text)">props}&gt;</span></span>',
    },
    {
      id: 'source-5',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">    &lt;</span><span style="color:var(--astro-code-token-constant)">Input</span></span>',
    },
    {
      id: 'input-props-1',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-function)">      placeholder</span><span style="color:var(--astro-code-token-keyword)">=</span><span style="color:var(--astro-code-token-string-expression)">"Enter your email"</span></span>',
    },
    {
      id: 'input-props-2',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-function)">      full</span></span>',
    },
    {
      id: 'input-props-3',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-function)">      name</span><span style="color:var(--astro-code-token-keyword)">=</span><span style="color:var(--astro-code-token-string-expression)">"user-email"</span></span>',
    },
    {
      id: 'input-props-4',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-function)">      validation</span><span style="color:var(--astro-code-token-keyword)">=</span><span style="color:var(--astro-code-color-text)">{</span><span style="color:var(--astro-code-token-string-expression)">/</span><span style="color:var(--astro-code-token-keyword)">^</span><span style="color:var(--astro-code-token-string-expression)">[</span><span style="color:var(--astro-code-token-keyword)">^</span><span style="color:var(--astro-code-token-string-expression)">s@]</span><span style="color:var(--astro-code-token-keyword)">+</span><span style="color:var(--astro-code-token-string-expression)">@[</span><span style="color:var(--astro-code-token-keyword)">^</span><span style="color:var(--astro-code-token-string-expression)">s@]</span><span style="color:var(--astro-code-token-keyword)">+</span><span style="color:var(--astro-code-token-string-expression)">.[</span><span style="color:var(--astro-code-token-keyword)">^</span><span style="color:var(--astro-code-token-string-expression)">s@]</span><span style="color:var(--astro-code-token-keyword)">+$</span><span style="color:var(--astro-code-token-string-expression)">/</span><span style="color:var(--astro-code-token-keyword)">i</span><span style="color:var(--astro-code-color-text)">}</span></span>',
    },
    {
      id: 'input-props-5',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-function)">      type</span><span style="color:var(--astro-code-token-keyword)">=</span><span style="color:var(--astro-code-token-string-expression)">"email"</span></span>',
    },
    {
      id: 'input-props-6',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-function)">      size</span><span style="color:var(--astro-code-token-keyword)">=</span><span style="color:var(--astro-code-token-string-expression)">"l"</span></span>',
    },
    {
      id: 'input-props-7',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-function)">      label</span><span style="color:var(--astro-code-token-keyword)">=</span><span style="color:var(--astro-code-token-string-expression)">"Email address"</span></span>',
    },
    {
      id: 'source-6',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">    /&gt;</span></span>',
    },
    {
      id: 'source-7',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">    &lt;</span><span style="color:var(--astro-code-token-constant)">Button</span></span>',
    },
    {
      id: 'button-props-1',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-function)">      type</span><span style="color:var(--astro-code-token-keyword)">=</span><span style="color:var(--astro-code-token-string-expression)">"submit"</span></span>',
    },
    {
      id: 'button-props-2',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-function)">      variant</span><span style="color:var(--astro-code-token-keyword)">=</span><span style="color:var(--astro-code-token-string-expression)">"solid"</span></span>',
    },
    {
      id: 'button-props-3',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-function)">      className</span><span style="color:var(--astro-code-token-keyword)">=</span><span style="color:var(--astro-code-token-string-expression)">"submit-button"</span></span>',
    },
    {
      id: 'button-props-4',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-function)">      size</span><span style="color:var(--astro-code-token-keyword)">=</span><span style="color:var(--astro-code-token-string-expression)">"l"</span></span>',
    },
    {
      id: 'button-props-5',
      source:
        '<span class="line"><span style="color:var(--astro-code-token-function)">      color</span><span style="color:var(--astro-code-token-keyword)">=</span><span style="color:var(--astro-code-token-string-expression)">"secondary"</span></span>',
    },
    {
      id: 'source-8',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">    &gt;</span></span>',
    },
    {
      id: 'source-9',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">      Submit</span></span>',
    },
    {
      id: 'source-10',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">    &lt;/</span><span style="color:var(--astro-code-token-constant)">Button</span><span style="color:var(--astro-code-color-text)">&gt;</span></span>',
    },
    {
      id: 'source-11',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">  &lt;/</span><span style="color:var(--astro-code-token-constant)">Form</span><span style="color:var(--astro-code-color-text)">&gt;</span></span>',
    },
    {
      id: 'source-12',
      source:
        '<span class="line"><span style="color:var(--astro-code-color-text)">)</span></span>',
    },
  ]

  let resetList = [
    'import-1',
    'import-2',
    'import-3',
    'import-4',
    'import-5',
    'import-6',
    'import-7',
    'import-8',
    'import-9',
    'import-10',
    'import-11',
    'import-12',
    'import-13',
    'import-14',
    'import-15',
    'import-16',
    'space-1',
    'source-1',
    'interface-1',
    'interface-2',
    'interface-3',
    'interface-4',
    'interface-5',
    'source-2',
    'space-2',
    'source-3',
    'source-4',
    'source-5',
    'input-props-1',
    'input-props-2',
    'input-props-3',
    'input-props-4',
    'input-props-5',
    'input-props-6',
    'input-props-7',
    'source-6',
    'source-7',
    'button-props-1',
    'button-props-2',
    'button-props-3',
    'button-props-4',
    'button-props-5',
    'source-8',
    'source-9',
    'source-10',
    'source-11',
    'source-12',
  ]

  let alphabeticalList = [
    'import-2',
    'import-3',
    'import-4',
    'import-6',
    'import-8',
    'import-5',
    'import-7',
    'import-9',
    'import-10',
    'import-16',
    'import-12',
    'import-1',
    'import-11',
    'import-14',
    'import-15',
    'import-13',
    'space-1',
    'source-1',
    'interface-1',
    'interface-3',
    'interface-2',
    'interface-4',
    'interface-5',
    'source-2',
    'space-2',
    'source-3',
    'source-4',
    'source-5',
    'input-props-2',
    'input-props-7',
    'input-props-3',
    'input-props-1',
    'input-props-6',
    'input-props-5',
    'input-props-4',
    'source-6',
    'source-7',
    'button-props-3',
    'button-props-5',
    'button-props-4',
    'button-props-1',
    'button-props-2',
    'source-8',
    'source-9',
    'source-10',
    'source-11',
    'source-12',
  ]

  let lineLengthList = [
    'import-2',
    'import-3',
    'import-4',
    'import-6',
    'import-8',
    'import-7',
    'import-5',
    'import-9',
    'import-10',
    'import-16',
    'import-15',
    'import-1',
    'import-14',
    'import-11',
    'import-12',
    'import-13',
    'space-1',
    'source-1',
    'interface-2',
    'interface-4',
    'interface-1',
    'interface-5',
    'interface-3',
    'source-2',
    'space-2',
    'source-3',
    'source-4',
    'source-5',
    'input-props-4',
    'input-props-1',
    'input-props-7',
    'input-props-3',
    'input-props-5',
    'input-props-6',
    'input-props-2',
    'source-6',
    'source-7',
    'button-props-3',
    'button-props-5',
    'button-props-2',
    'button-props-1',
    'button-props-4',
    'source-8',
    'source-9',
    'source-10',
    'source-11',
    'source-12',
  ]

  let updateList = (newList: string[]) => {
    list = list.sort((a, b) => newList.indexOf(a.id) - newList.indexOf(b.id))
  }

  onMount(() => {
    document
      .getElementById('demo-sort-reset')
      ?.addEventListener('click', () => {
        updateList(resetList)
      })

    document
      .getElementById('demo-sort-alphabetical')
      ?.addEventListener('click', () => {
        updateList(alphabeticalList)
      })

    document
      .getElementById('demo-sort-line-length')
      ?.addEventListener('click', () => {
        updateList(lineLengthList)
      })
  })
</script>

<code class="code">
  {#each list as row (row.id)}
    <span animate:flip={{ delay: 100, duration: 500, easing: quintOut }}>
      <span class="code-line">{@html row.source}</span>
    </span>
  {/each}
</code>

<style>
  .code {
    background-color: var(--astro-code-color-background);
    display: flex;
    flex-direction: column;
    font-size: 13px;
  }

  .code-line {
    white-space: pre;
  }
</style>
