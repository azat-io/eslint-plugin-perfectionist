<script>
  import { quintOut } from 'svelte/easing'
  import { flip } from 'svelte/animate'

  let list = [
    {
      id: 'import-1',
      source:
        '<span style="color:purple">import</span> Button from \'../../components/Button\'',
    },
    {
      id: 'import-2',
      source: 'import {',
    },
    {
      id: 'import-3',
      source: '  useId,',
    },
    {
      id: 'import-4',
      source: '  useCallback,',
    },
    {
      id: 'import-5',
      source: '  useState,',
    },
    {
      id: 'import-6',
      source: '  useEffect,',
    },
    {
      id: 'import-7',
      source: '  useMemo,',
    },
    {
      id: 'import-8',
      source: "} from 'react'",
    },
  ]

  let shuffle = () => {
    list = [...list.sort(() => (Math.random() > 0.5 ? -1 : 1))]
  }
</script>

<button on:click={shuffle}>Shuffle</button>

<code class="code">
  {#each list as row (row.id)}
    <span animate:flip={{ delay: 100, duration: 500, easing: quintOut }}>
      <span class="code-line">{@html row.source}</span>
    </span>
  {/each}
</code>

<style>
  .code {
    display: flex;
    flex-direction: column;
  }

  .code-line {
    white-space: pre;
  }
</style>
