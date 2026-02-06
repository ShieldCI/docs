import { h } from 'vue'
import Theme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import { useData } from 'vitepress'
import './style/index.css'

import AnalyzerCard from './components/AnalyzerCard.vue'
import Breadcrumbs from './components/Breadcrumbs.vue'
import CodeComparison from './components/CodeComparison.vue'
import HomeContent from './components/HomeContent.vue'
import HomeFeatures from './components/HomeFeatures.vue'

export default {
  extends: Theme,
  Layout() {
    return h(Theme.Layout, null, {
      'doc-before': () => h(Breadcrumbs),
      'home-hero-after': () => h(HomeFeatures),
      'home-features-after': () => h(HomeContent)
    })
  },
  enhanceApp({ app }: EnhanceAppContext) {
    app.component('AnalyzerCard', AnalyzerCard)
    app.component('Breadcrumbs', Breadcrumbs)
    app.component('CodeComparison', CodeComparison)
    app.component('HomeContent', HomeContent)
    app.component('HomeFeatures', HomeFeatures)
  }
}

