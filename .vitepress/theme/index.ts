import { h } from 'vue'
import Theme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import './style/index.css'

import AnalyzerCard from './components/AnalyzerCard.vue'
import Breadcrumbs from './components/Breadcrumbs.vue'
import CodeComparison from './components/CodeComparison.vue'

export default {
  extends: Theme,
  Layout() {
    return h(Theme.Layout, null, {
      'doc-before': () => h(Breadcrumbs)
    })
  },
  enhanceApp({ app }: EnhanceAppContext) {
    app.component('AnalyzerCard', AnalyzerCard)
    app.component('Breadcrumbs', Breadcrumbs)
    app.component('CodeComparison', CodeComparison)
  }
}

