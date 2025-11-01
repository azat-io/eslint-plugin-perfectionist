<script lang="ts">
  function portal(node: HTMLElement): {
    destroy(): void
  } {
    document.body.append(node)

    return {
      destroy() {
        node.remove()
      },
    }
  }
</script>

<div use:portal>
  <slot />
</div>
