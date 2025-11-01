let cleanup: () => void = () => {}

function handleEntries(entries: IntersectionObserverEntry[]): void {
  if (globalThis.scrollY === 0) {
    let firstTocItem = document.querySelector<HTMLAnchorElement>(
      '.table-of-content a',
    )
    let previouslyActivatedItem =
      document.querySelector<HTMLAnchorElement>('.active')
    previouslyActivatedItem?.classList.remove('active')
    firstTocItem?.classList.add('active')
    return
  }

  for (let entry of entries) {
    let headingFragment = `#${entry.target.id}`
    let tocItem = document.querySelector<HTMLAnchorElement>(
      `.table-of-content a[href="${headingFragment}"]`,
    )
    if (!tocItem) {
      continue
    }

    if (entry.isIntersecting) {
      let previouslyActivatedItem =
        document.querySelector<HTMLAnchorElement>('.active')
      previouslyActivatedItem?.classList.remove('active')
      tocItem.classList.add('active')
    } else {
      let isAnyOtherEntryIntersecting = entries.some(
        otherEntry =>
          otherEntry.target.id !== entry.target.id && otherEntry.isIntersecting,
      )

      if (isAnyOtherEntryIntersecting) {
        tocItem.classList.remove('active')
      }
    }
  }
}

function initToc(): void {
  cleanup()

  // eslint-disable-next-line unicorn/prefer-spread
  let sectionHeadings = Array.from(
    document.querySelectorAll<HTMLElement>('article h2, article h3'),
  )
  if (sectionHeadings.length === 0) {
    scheduleNext()
    return
  }

  let observer = new IntersectionObserver(handleEntries, {
    rootMargin: '0px',
    threshold: [1],
    root: null,
  })

  for (let heading of sectionHeadings) {
    observer.observe(heading)
  }

  cleanup = () => {
    observer.disconnect()
  }

  handleEntries(observer.takeRecords())
  scheduleNext()
}

function scheduleNext(): void {
  document.addEventListener(
    'astro:before-swap',
    () => {
      cleanup()
    },
    { once: true },
  )
  document.addEventListener(
    'astro:after-swap',
    () => {
      initToc()
    },
    { once: true },
  )
}

let marker = '__perfectionistTocInitialized__'

export function setupTableOfContents(): void {
  if (typeof document === 'undefined') {
    return
  }

  if (!(marker in globalThis)) {
    Object.defineProperty(globalThis, marker, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: true,
    })
    initToc()
    return
  }

  initToc()
}

setupTableOfContents()
