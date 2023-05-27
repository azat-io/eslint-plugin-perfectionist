<script lang="ts" setup>
import { VPTeamMembers } from 'vitepress/theme'

import codeBefore from './code-before.vue'
import codeAfter from './code-after.vue'

let members = [
  {
    avatar: 'https://github.com/azat-io.png',
    name: 'Azat S.',
    title: 'An open source developer',
    links: [
      {
        icon: 'github',
        link: 'https://github.com/azat-io',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/azat_io',
      },
    ],
  },
]
</script>

<template>
  <div class="container">
    <hr class="divider" />
  </div>
  <div class="container">
    <div class="content">
      <VPTeamMembers class="members" :members="members" />
      <div class="code-blocks">
        <figure class="code-wrapper code-wrapper-left">
          <figcaption class="code-caption">Input</figcaption>
          <code-before />
        </figure>
        <figure class="code-wrapper code-wrapper-right">
          <figcaption class="code-caption">Output</figcaption>
          <code-after />
        </figure>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  padding-inline: 24px;
}

.divider {
  max-inline-size: 1152px;
  margin: 48px auto;
  inline-size: 100%;
  block-size: 1px;
  border: 1px solid var(--vp-c-divider);
}

.content {
  display: grid;
  grid-template-columns: 1fr;
  max-inline-size: 1152px;
  margin: 0 auto;
  gap: 48px;
}

.code-blocks {
  display: none;
}

.members {
  inline-size: fit-content;
}

@media (min-width: 640px) {
  .container {
    padding-inline: 48px;
  }
}

@media (min-width: 960px) {
  .container {
    padding-inline: 64px;
  }

  .content {
    grid-template-columns: auto 1fr;
    inline-size: 100%;
  }

  .code-blocks {
    display: flex;
    max-block-size: 100%;
  }

  .code-wrapper {
    display: block;
    position: relative;
    border-radius: 12px;
    background: var(--vp-c-bg-soft);
    border-radius: 12px;
    block-size: auto;
    z-index: 1;
    inline-size: calc(50% + 16px);
    overflow: hidden;
  }

  .code-caption {
    font-family: var(--vp-font-family-mono);
    font-size: 12px;
    background: var(--vp-c-brand);
    color: var(--vp-button-brand-text);
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    padding-inline: 24px;
    border-end-end-radius: 12px;
  }

  .code-wrapper svg {
    position: absolute;
    inline-size: calc(100% - 24px * 2);
    block-size: calc(100% - 24px * 2);
    inset: 24px;
  }

  .code-wrapper-left {
    margin-block-end: 24px;
    opacity: 80%;
  }

  .code-wrapper-right {
    margin-block-start: 24px;
    margin-inline-start: -32px;
    box-shadow: 0 3px 8px 0 var(--vp-c-bg-soft-down);
  }
}
</style>
