import type { Theme } from 'vitepress'

import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'

import HomePage from './components/home-page.vue'
import './layout/colors.css'

let theme: Theme = {
  ...DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'home-features-after': () => h(HomePage),
    }),
}

export default theme
