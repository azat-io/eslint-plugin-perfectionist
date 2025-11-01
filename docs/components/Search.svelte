<script lang="ts">
  import { hotkeyMacCompat, hotkeyKeyUX, startKeyUX } from 'keyux'
  import { onMount } from 'svelte'

  import SearchButton from './SearchButton.svelte'
  import SearchModal from './SearchModal.svelte'

  let isOpen = $state(false)

  onMount(() => {
    let stop = startKeyUX(globalThis, [hotkeyKeyUX([hotkeyMacCompat()])])
    return () => {
      stop()
    }
  })
</script>

<SearchButton onclick={() => (isOpen = !isOpen)} />
{#if isOpen}
  <SearchModal onclose={() => (isOpen = false)} />
{/if}
