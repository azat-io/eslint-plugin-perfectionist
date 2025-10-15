<script lang="ts">
  import { onDestroy, onMount } from 'svelte'

  let reference: HTMLElement | null = null

  onMount(() => {
    document.body.append(reference!)
  })

  onDestroy(() => {
    reference!.remove()
  })
</script>

<div bind:this={reference}>
  <slot />
</div>
