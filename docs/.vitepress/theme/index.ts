import type { Theme } from 'vitepress'

import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'

import ESLintCodeBlock from './components/eslint-code-block.vue'
import HomePage from './components/home-page.vue'
import './layout/colors.css'

let theme: Theme = {
  ...DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'home-features-after': () => h(HomePage),
    }),
  enhanceApp: context => {
    DefaultTheme.enhanceApp(context)
    context.app.component('eslint-code-block', ESLintCodeBlock)
  },
}

export default theme
