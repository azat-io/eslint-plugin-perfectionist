<script>
  import { quintOut } from 'svelte/easing'
  import { slide } from 'svelte/transition'
  import { onMount } from 'svelte'

  import { locales } from '../locales'

  let open = false

  onMount(() => {
    document.getElementById('locale-select').addEventListener('click', () => {
      open = !open
    })

    document.addEventListener('click', event => {
      if (open && !event.target.closest('#locale-select')) {
        open = false
      }
    })

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        open = false
      }
    })
  })
</script>

{#if open}
  <div
    class="locale-select"
    transition:slide={{ delay: 0, duration: 400, easing: quintOut }}
  >
    {#each locales as { name, originName, code, icon }}
      <a class="locale" href={`/${code}`} key={code}>
        <div class="icon">{@html icon}</div>
        <div class="name-container">
          <span class="name">{name}</span>
          <span class="origin-name">{originName}</span>
        </div>
      </a>
    {/each}
  </div>
{/if}

<style>
  .locale-select {
    display: flex;
    flex-direction: column;
    position: absolute;
    right: 0;
    background: var(--color-background-primary);
    border: 1px solid var(--color-border-primary);
    border-radius: 0 0 6px 6px;
    padding: 16px;
  }

  .locale {
    display: grid;
    grid-template-columns: 48px 1fr;
    align-items: center;
    gap: 16px;
    color: inherit;
    text-decoration: none;
    border-radius: 6px;
    min-inline-size: 160px;
    padding: 12px;
  }

  .locale:hover,
  .locale:focus-visible {
    background: var(--color-background-primary-hover);
  }

  .icon {
    display: flex;
    justify-content: center;
    min-inline-size: 100%;
  }

  .name-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .name {
    font-size: 16px;
  }

  .origin-name {
    font-size: 13px;
  }
</style>
