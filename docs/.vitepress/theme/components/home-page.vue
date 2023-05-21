<script lang="ts" setup>
import { VPTeamMembers } from 'vitepress/theme'

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
      <div />
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
  display: flex;
  justify-content: space-between;
  max-inline-size: 1152px;
  inline-size: 100%;
  margin: 0 auto;
  gap: 48px;
}

.members {
  width: fit-content;
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
}
</style>
