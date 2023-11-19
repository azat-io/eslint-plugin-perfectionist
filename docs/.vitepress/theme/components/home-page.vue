<script lang="ts" setup>
import { VPTeamMembers } from 'vitepress/theme'
import { onMounted, computed, ref } from 'vue'

import codeBefore from './code-before.vue'
import codeAfter from './code-after.vue'

let twitter = ref('https://twitter.com/azat_io_en')

let members = computed(() => [
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
        link: twitter.value,
      },
    ],
  },
])

onMounted(() => {
  let checkUserLang = (language: string | string[]): boolean => {
    let userLang = window.navigator.language.substring(0, 2)
    let checkLang = (lang: string): boolean => lang === userLang
    if (typeof language === 'string') {
      return checkLang(language)
    }
    return language.some(lang => checkLang(lang))
  }

  if (checkUserLang(['ru', 'uk', 'be'])) {
    twitter.value = 'https://twitter.com/azat_io'
  }
})
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
  inline-size: 100%;
  max-inline-size: 1152px;
  block-size: 1px;
  margin: 48px auto;
  border: 1px solid var(--vp-c-divider);
}

.content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
  max-inline-size: 1152px;
  margin: 0 auto;
}

.code-blocks {
  display: none;
}

.members {
  inline-size: fit-content;
}

@media (width >= 640px) {
  .container {
    padding-inline: 48px;
  }
}

@media (width >= 960px) {
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
    position: relative;
    z-index: 1;
    display: block;
    inline-size: calc(50% + 16px);
    block-size: auto;
    overflow: hidden;
    background: var(--vp-c-bg-soft);
    border-radius: 12px;
  }

  .code-caption {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    padding-inline: 24px;
    font-family: var(--vp-font-family-mono);
    font-size: 12px;
    color: var(--vp-button-brand-text);
    background: var(--vp-c-brand);
    border-end-end-radius: 12px;
  }

  .code-wrapper svg {
    position: absolute;
    inset: 24px;
    inline-size: calc(100% - 24px * 2);
    block-size: calc(100% - 24px * 2);
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
