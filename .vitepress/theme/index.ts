import { h, watch, onMounted, nextTick } from 'vue'
import Theme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import { useRoute } from 'vitepress'
import './style/index.css'

import AnalyzerCard from './components/AnalyzerCard.vue'
import Breadcrumbs from './components/Breadcrumbs.vue'
import CodeComparison from './components/CodeComparison.vue'
import HomeContent from './components/HomeContent.vue'
import HomeFeatures from './components/HomeFeatures.vue'
import ProBadge from './components/ProBadge.vue'

import { proAnalyzerPaths } from './data/pro-analyzers'

function decorateSidebarProItems() {
  // Remove any existing badges first to avoid duplicates
  document.querySelectorAll('.VPSidebar .pro-badge').forEach((el) => el.remove())

  document.querySelectorAll('.VPSidebar a.link').forEach((anchor) => {
    const href = anchor.getAttribute('href')
    if (!href || !proAnalyzerPaths.has(href)) return

    const textEl = anchor.querySelector('.text')
    if (!textEl) return

    const badge = document.createElement('span')
    badge.className = 'pro-badge'
    badge.textContent = 'PRO'
    textEl.appendChild(badge)
  })
}

export default {
  extends: Theme,
  Layout() {
    return h(Theme.Layout, null, {
      'doc-before': () => [h(Breadcrumbs), h(ProBadge)],
      'home-hero-after': () => h(HomeFeatures),
      'home-features-after': () => h(HomeContent),
    })
  },
  enhanceApp({ app }: EnhanceAppContext) {
    app.component('AnalyzerCard', AnalyzerCard)
    app.component('Breadcrumbs', Breadcrumbs)
    app.component('CodeComparison', CodeComparison)
    app.component('HomeContent', HomeContent)
    app.component('HomeFeatures', HomeFeatures)
    app.component('ProBadge', ProBadge)
  },
  setup() {
    const route = useRoute()

    onMounted(() => {
      requestAnimationFrame(decorateSidebarProItems)
    })

    watch(
      () => route.path,
      () => {
        nextTick(() => {
          requestAnimationFrame(decorateSidebarProItems)
        })
      },
    )
  },
}
