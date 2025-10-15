<script lang="ts">
  import type { SearchResult } from 'minisearch'

  import { SvelteSet } from 'svelte/reactivity'
  import MiniSearch from 'minisearch'
  import { on } from 'svelte/events'
  import { onMount } from 'svelte'

  import IconChevronRight from '../icons/chevron-right.svg?component'
  import HighlightText from './HighlightText.svelte'
  import Portal from './Portal.svelte'

  let { onclose } = $props<{ onclose(): void }>()

  interface SearchDocument {
    collection: 'configs' | 'guide' | 'rules'
    headings: string[]
    title: string
    body: string
    slug: string
  }

  type MiniSearchResult = SearchDocument & SearchResult

  interface ParsedResult {
    highlightTerms: string[]
    data: MiniSearchResult
    heading: string | null
    snippet: string
    id: string
  }

  const MIN_QUERY_LENGTH = 2
  const MAX_RESULTS = 12
  const SNIPPET_RADIUS = 60
  const MAX_HIGHLIGHT_TERMS = 6
  const COLLECTION_LABELS: Record<SearchDocument['collection'], string> = {
    configs: 'Configs',
    guide: 'Guide',
    rules: 'Rules',
  }

  const LISTBOX_ID = `search-results-${Math.random().toString(36).slice(2, 9)}`

  let dialog: HTMLDialogElement
  let previouslyFocused: HTMLElement | null = null
  let miniSearch = $state<MiniSearch<SearchDocument> | null>(null)
  let query = $state('')
  let trimmedQuery = $derived(query.trim())
  let shouldSearch = $derived(
    miniSearch !== null && trimmedQuery.length >= MIN_QUERY_LENGTH,
  )

  let parsedResults = $state<ParsedResult[]>([])
  let activeIndex = $state(-1)
  let isLoading = $state(false)
  let isIndexReady = $state(false)
  let errorMessage = $state<string | null>(null)

  onMount(() => {
    previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    dialog.showModal()

    let stopClose = on(dialog, 'close', () => {
      previouslyFocused?.focus()
      onclose()
    })

    let stopCancel = on(dialog, 'cancel', event => {
      event.preventDefault()
      dialog.close()
    })

    return () => {
      stopClose()
      stopCancel()
    }
  })

  async function init(): Promise<void> {
    if (isIndexReady || isLoading) {
      return
    }

    isLoading = true
    errorMessage = null

    try {
      let response = await fetch('/search-index.json')

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }

      let documents = (await response.json()) as SearchDocument[]
      let index = new MiniSearch<SearchDocument>({
        searchOptions: {
          boost: {
            headings: 2,
            title: 3,
            body: 1,
          },
          combineWith: 'and',
          prefix: true,
        },
        storeFields: ['slug', 'title', 'body', 'collection', 'headings'],
        fields: ['title', 'headings', 'body'],
        idField: 'slug',
      })

      index.addAll(documents)
      miniSearch = index
      isIndexReady = true
    } catch (error) {
      console.error('Search index loading failed', error)
      errorMessage = 'Failed to load search index.'
    } finally {
      isLoading = false
    }
  }

  $effect(() => {
    if (
      trimmedQuery.length >= MIN_QUERY_LENGTH &&
      !isIndexReady &&
      !isLoading
    ) {
      void init()
    }
  })

  $effect(() => {
    if (!shouldSearch) {
      parsedResults = []
      activeIndex = -1
      return
    }

    let index = miniSearch!
    let results = index
      .search(trimmedQuery)
      .slice(0, MAX_RESULTS) as MiniSearchResult[]

    parsedResults = toParsedResults(results, trimmedQuery)
    activeIndex = results.length > 0 ? 0 : -1
  })

  $effect(() => {
    if (activeIndex < 0) {
      return
    }

    let listBox = dialog.querySelector<HTMLUListElement>(`#${LISTBOX_ID}`)
    let item = listBox?.children.item(activeIndex)

    if (item instanceof HTMLElement) {
      item.scrollIntoView({ block: 'nearest' })
    }
  })

  function toParsedResults(
    results: MiniSearchResult[],
    searchQuery: string,
  ): ParsedResult[] {
    let queryTerms = searchQuery
      .split(/\s+/u)
      .map(term => term.trim())
      .filter(Boolean)

    return results.map((result, index) => {
      let highlightTerms = collectHighlightTerms(result, queryTerms)
      let highlightTermsLower = highlightTerms.map(term => term.toLowerCase())
      let heading = pickHeading(result.headings, highlightTermsLower)
      let snippet = createSnippet(result.body, highlightTermsLower)

      return {
        id: `${LISTBOX_ID}-option-${index}`,
        highlightTerms,
        data: result,
        heading,
        snippet,
      }
    })
  }

  function collectHighlightTerms(
    result: MiniSearchResult,
    queryTerms: string[],
  ): string[] {
    let documentTerms = result.terms.slice(0, MAX_HIGHLIGHT_TERMS)
    let combined = [
      ...documentTerms,
      ...result.queryTerms,
      ...queryTerms,
    ].filter(Boolean)

    let seen = new SvelteSet<string>()
    let unique: string[] = []

    for (let term of combined) {
      let normalized = term.toLowerCase()
      if (!normalized || seen.has(normalized)) {
        continue
      }

      seen.add(normalized)
      unique.push(term)
    }

    return unique
  }

  function pickHeading(
    headings: string[],
    highlightTermsLower: string[],
  ): string | null {
    if (headings.length === 0) {
      return null
    }

    if (highlightTermsLower.length === 0) {
      return headings[0] ?? null
    }

    let lowerHeadings = headings.map(heading => heading.toLowerCase())

    for (let [index, lowerHeading] of lowerHeadings.entries()) {
      if (highlightTermsLower.some(term => lowerHeading.includes(term))) {
        return headings[index] ?? null
      }
    }

    return headings[0] ?? null
  }

  function createSnippet(value: string, highlightTermsLower: string[]): string {
    if (!value) {
      return ''
    }

    if (highlightTermsLower.length === 0) {
      return value.length > SNIPPET_RADIUS * 2
        ? `${value.slice(0, SNIPPET_RADIUS * 2).trim()}…`
        : value
    }

    let lowerValue = value.toLowerCase()
    let matchIndex = -1
    let matchLength = 0

    for (let term of highlightTermsLower) {
      let position = lowerValue.indexOf(term)
      if (position >= 0 && (matchIndex === -1 || position < matchIndex)) {
        matchIndex = position
        matchLength = term.length
      }
    }

    if (matchIndex === -1) {
      return value.length > SNIPPET_RADIUS * 2
        ? `${value.slice(0, SNIPPET_RADIUS * 2).trim()}…`
        : value
    }

    let start = Math.max(matchIndex - SNIPPET_RADIUS, 0)
    let end = Math.min(matchIndex + matchLength + SNIPPET_RADIUS, value.length)
    let snippet = value.slice(start, end).trim()

    if (start > 0) {
      snippet = `…${snippet}`
    }

    if (end < value.length) {
      snippet = `${snippet}…`
    }

    return snippet
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === dialog) {
      dialog.close()
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      dialog.close()
      return
    }

    if (parsedResults.length === 0) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      activeIndex =
        activeIndex < parsedResults.length - 1
          ? activeIndex + 1
          : parsedResults.length - 1
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      activeIndex = activeIndex <= 0 ? 0 : activeIndex - 1
      return
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      let selected = parsedResults[activeIndex]
      if (selected) {
        openResult(selected)
      }
    }
  }

  function openResult(result: ParsedResult): void {
    dialog.close()

    globalThis.setTimeout(() => {
      globalThis.location.assign(result.data.slug)
    })
  }

  function handleResultClick(event: MouseEvent, result: ParsedResult): void {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.button === 1
    ) {
      return
    }

    event.preventDefault()
    openResult(result)
  }
</script>

<Portal>
  <dialog
    class="modal"
    bind:this={dialog}
    aria-modal="true"
    data-keyux-ignore-hotkeys
    onclick={handleBackdropClick}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-inner" onclick={event => event.stopPropagation()}>
      <!-- svelte-ignore a11y_autofocus -->
      <input
        type="search"
        class="input"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={parsedResults.length > 0}
        aria-controls={parsedResults.length > 0 ? LISTBOX_ID : undefined}
        aria-activedescendant={activeIndex >= 0
          ? parsedResults[activeIndex]?.id
          : undefined}
        placeholder="Type to search..."
        aria-label="Search"
        bind:value={query}
        onfocus={init}
        onkeydown={handleKeydown}
        autofocus
      />

      <div class="results" aria-live="polite" aria-busy={isLoading}>
        {#if errorMessage}
          <p class="message error">{errorMessage}</p>
        {:else if isLoading}
          <p class="message">Loading index…</p>
        {:else if trimmedQuery.length < MIN_QUERY_LENGTH}
          <p class="message">Start typing to search the documentation.</p>
        {:else if parsedResults.length === 0}
          <p class="message">No results found. Try a different query.</p>
        {:else}
          <ul class="list" role="listbox" id={LISTBOX_ID}>
            {#each parsedResults as result, index (result.data.slug)}
              <li
                class:item-active={activeIndex === index}
                class="list-item"
                id={result.id}
                role="option"
                aria-selected={activeIndex === index}
                onmouseenter={() => (activeIndex = index)}
              >
                <a
                  class:link-active={activeIndex === index}
                  class="list-link"
                  href={result.data.slug}
                  tabindex="-1"
                  onclick={event => handleResultClick(event, result)}
                >
                  <span class="link-title">
                    <HighlightText
                      text={result.data.title}
                      terms={result.highlightTerms}
                    />
                  </span>
                  <span class="link-meta">
                    <span class="link-collection">
                      {COLLECTION_LABELS[result.data.collection]}
                    </span>
                    {#if result.heading}
                      <IconChevronRight aria-hidden="true" class="chevron" />
                      <span class="link-heading">
                        <HighlightText
                          text={result.heading}
                          terms={result.highlightTerms}
                        />
                      </span>
                    {/if}
                  </span>
                  {#if result.snippet}
                    <span class="link-snippet">
                      <HighlightText
                        text={result.snippet}
                        terms={result.highlightTerms}
                      />
                    </span>
                  {/if}
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  </dialog>
</Portal>

<style>
  .modal {
    inline-size: calc(100% - var(--space-l) * 2);
    max-inline-size: 580px;
    block-size: calc(100dvb - var(--space-xl) * 2);
    padding: 0;
    outline: none;
    scrollbar-width: thin;
    background: var(--color-background-primary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius);
    opacity: 0%;
    animation: scale-up 300ms cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
    will-change: opacity, transform;

    &::backdrop {
      background: var(--color-overlay-primary);
      backdrop-filter: blur(4px);
    }
  }

  .modal-inner {
    display: flex;
    flex-direction: column;
    gap: var(--space-m);
    block-size: 100%;
    padding: var(--space-l);
  }

  .input {
    inline-size: 100%;
    padding: var(--space-2xs) var(--space-m);
    font: var(--font-s);
    color: var(--color-content-primary);
    background: var(--color-background-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--border-radius);

    &::placeholder {
      color: var(--color-content-tertiary);
    }

    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px var(--color-overlay-brand);
      transition: box-shadow 200ms;
    }
  }

  .results {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--space-s);
    min-block-size: 0;
    overflow-block: auto;
  }

  .message {
    margin: 0;
    font: var(--font-xs);
    color: var(--color-content-secondary);

    &.error {
      color: var(--color-status-danger);
    }
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .list-item {
    margin: 0;
  }

  .list-link {
    display: flex;
    flex-direction: column;
    gap: var(--space-2xs);
    padding: var(--space-xs);
    color: inherit;
    text-decoration: none;
    background: var(--color-background-secondary);
    border: 1px solid transparent;
    border-radius: var(--border-radius);
    transition:
      border-color 150ms ease,
      background-color 150ms ease;

    &:hover,
    &:focus-visible,
    &.link-active {
      outline: none;
      background: var(--color-background-tertiary);
      border-color: var(--color-border-secondary);
    }
  }

  .link-title {
    font: var(--font-s);
    font-weight: 600;
    color: var(--color-content-primary);
  }

  .link-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4xs);
    align-items: center;
    font: var(--font-xs);
    color: var(--color-content-tertiary);

    & :global(.chevron) {
      display: flex;
      inline-size: var(--size-icon-s);
      block-size: var(--size-icon-s);
    }
  }

  .link-snippet {
    font: var(--font-xs);
    color: var(--color-content-secondary);
  }

  .item-active .list-link {
    background: var(--color-background-tertiary);
    border-color: var(--color-border-secondary);
  }

  @keyframes scale-up {
    0% {
      opacity: 0%;
      transform: scale(0.8) translate(0, 800px);
    }

    50% {
      opacity: 0%;
    }

    100% {
      opacity: 100%;
      transform: scale(1) translate(0, 0);
    }
  }
</style>
