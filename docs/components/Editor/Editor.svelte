<script lang="ts">
  import EditorMonaco from './EditorMonaco.svelte'
  import Button from '../Button.svelte'

  let settings: Record<string, unknown> = {}
</script>

<div class="wrapper">
  <Button color="primary" content="Fix ESLint problems" />
  <EditorMonaco {settings} />
</div>

<style>
  .wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-l);
  }
</style>
