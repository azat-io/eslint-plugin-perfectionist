import type { Theme } from 'vitepress'

import { defineAsyncComponent, h } from 'vue'
import DefaultTheme from 'vitepress/theme'

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

    context.app.component(
      'eslint-playground',
      defineAsyncComponent({
        loader: () => import('./components/eslint-playground.vue'),
      }),
    )
  },
}

export default theme
