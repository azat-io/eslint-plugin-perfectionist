<script lang="ts">
  import { hotkeyMacCompat, hotkeyKeyUX, startKeyUX } from 'keyux'
  import { onMount } from 'svelte'

  import SearchButton from './SearchButton.svelte'
  import SearchModal from './SearchModal.svelte'

  // eslint-disable-next-line no-empty-pattern
  let {} = $props()

  let isOpen = $state(false)

  onMount(() => {
    let stop = startKeyUX(globalThis, [hotkeyKeyUX([hotkeyMacCompat()])])
    return () => {
      stop()
    }
  })
</script>

<SearchButton onclick={() => (isOpen = !isOpen)} />
<SearchModal {isOpen} onclose={() => (isOpen = false)} />
