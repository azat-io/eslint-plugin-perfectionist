<template>
  <div class="eslint-code-block-root">
    <eslint-plugin-editor
      v-show="height"
      ref="editor"
      v-model:code="code"
      :style="{ height }"
      :rules="rules"
      dark
      :fix="fix"
    />
    <template v-if="!height">
      <slot></slot>
    </template>
  </div>
</template>

<script>
import EslintPluginEditor from './eslint-plugin-editor.vue'

export default {
  name: 'ESLintCodeBlock',
  components: { EslintPluginEditor },
  props: {
    fix: {
      type: Boolean,
    },
    rules: {
      type: Object,
      default() {
        return {}
      },
    },
  },
  data() {
    return {
      code: '',
      height: '100px',
    }
  },
  mounted() {
    this.code = `${computeCodeFromSlot(findCode(this.$slots.default?.())).trim()}\n`
    const lines = this.code.split('\n').length
    this.height = `${Math.max(120, 20 * (1 + lines))}px`
  },
}

function findCode(n) {
  const nodes = Array.isArray(n) ? n : [n]
  for (const node of nodes) {
    if (!node) {
      continue
    }
    if (node.type === 'code') {
      return node
    }
    const c = findCode(node.children)
    if (c) {
      return c
    }
  }
  return null
}

function computeCodeFromSlot(n) {
  if (!n) {
    return ''
  }
  const nodes = Array.isArray(n) ? n : [n]
  return nodes.map(node => (typeof node === 'string' ? node : computeCodeFromSlot(node.children))).join('')
}
</script>
