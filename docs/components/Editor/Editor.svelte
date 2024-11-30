<script lang="ts">
  import type { Linter } from 'eslint'

  import EditorMonaco from './EditorMonaco.svelte'
  import Button from '../Button.svelte'

  let config: Linter.Config[] = []
</script>

<div class="wrapper">
  <Button color="primary" content="Fix ESLint problems" />
  <EditorMonaco {config} />
</div>

<style>
  .wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-l);
  }
</style>
