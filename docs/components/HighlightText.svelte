<script lang="ts">
  let { terms, text }: { terms: string[]; text: string } = $props()

  interface Chunk {
    highlight: boolean
    value: string
  }

  let chunks = $derived(createChunks(text, terms))

  function createChunks(value: string, highlightTerms: string[]): Chunk[] {
    if (!value) {
      return []
    }

    let uniqueTerms = [
      ...new Map(
        highlightTerms.filter(Boolean).map(term => [term.toLowerCase(), term]),
      ).values(),
    ]

    if (uniqueTerms.length === 0) {
      return [{ highlight: false, value }]
    }

    uniqueTerms.sort((a, b) => b.length - a.length)

    let escaped = uniqueTerms
      .map(term => term.replaceAll(/[$()*+.?[\\\]^{|}]/gu, String.raw`\$&`))
      .join('|')

    let pattern = new RegExp(`(${escaped})`, 'giu')
    let result: Chunk[] = []
    let lastIndex = 0

    value.replace(
      pattern,
      (match: string, _group: string, offset: number): string => {
        if (offset > lastIndex) {
          result.push({
            value: value.slice(lastIndex, offset),
            highlight: false,
          })
        }

        result.push({
          value: value.slice(offset, offset + match.length),
          highlight: true,
        })

        lastIndex = offset + match.length
        return match
      },
    )

    if (lastIndex < value.length) {
      result.push({
        value: value.slice(lastIndex),
        highlight: false,
      })
    }

    return result
  }
</script>

{#each chunks as chunk, index (index)}
  {#if chunk.highlight}
    <mark data-index={index}>{chunk.value}</mark>
  {:else}
    {chunk.value}
  {/if}
{/each}

<style>
  mark {
    padding-inline: 1px;
    color: inherit;
    background: var(--color-overlay-brand);
  }
</style>
