import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, reactive, type VNode } from 'vue'

// Mock VitePress before importing the theme entry
vi.mock('vitepress', () => ({
  useRoute: vi.fn(),
  useData: vi.fn(),
}))

vi.mock('vitepress/theme', () => ({
  default: {
    Layout: defineComponent({ name: 'DefaultLayout', render: () => null }),
  },
}))

import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import theme from '../../.vitepress/theme/index'
import AnalyzerCard from '../../.vitepress/theme/components/AnalyzerCard.vue'
import Breadcrumbs from '../../.vitepress/theme/components/Breadcrumbs.vue'
import CodeComparison from '../../.vitepress/theme/components/CodeComparison.vue'
import HomeContent from '../../.vitepress/theme/components/HomeContent.vue'
import HomeFeatures from '../../.vitepress/theme/components/HomeFeatures.vue'
import SidebarAccordion from '../../.vitepress/theme/components/SidebarAccordion.vue'
import ProBadge from '../../.vitepress/theme/components/ProBadge.vue'

const PRO_PATH = '/analyzers/security/audit-logging'
const FREE_PATH = '/analyzers/security/xss-detection'

describe('theme entry', () => {
  it('extends the default theme', () => {
    expect(theme.extends).toBe(DefaultTheme)
  })

  it('renders the default layout with the custom slot components', () => {
    const vnode = theme.Layout() as VNode
    const slots = vnode.children as Record<string, () => VNode | VNode[]>

    expect(vnode.type).toBe(DefaultTheme.Layout)
    expect((slots['sidebar-nav-before']() as VNode).type).toBe(SidebarAccordion)
    expect((slots['doc-before']() as VNode[]).map((n) => n.type)).toEqual([Breadcrumbs, ProBadge])
    expect((slots['home-hero-after']() as VNode).type).toBe(HomeFeatures)
    expect((slots['home-features-after']() as VNode).type).toBe(HomeContent)
  })

  it('registers the custom components globally', () => {
    const component = vi.fn()

    theme.enhanceApp({ app: { component } } as any)

    expect(component.mock.calls).toEqual([
      ['AnalyzerCard', AnalyzerCard],
      ['Breadcrumbs', Breadcrumbs],
      ['CodeComparison', CodeComparison],
      ['HomeContent', HomeContent],
      ['HomeFeatures', HomeFeatures],
      ['SidebarAccordion', SidebarAccordion],
      ['ProBadge', ProBadge],
    ])
  })
})

describe('sidebar PRO badges', () => {
  let route: { path: string }

  function link(href: string | null, withText = true): HTMLAnchorElement {
    const anchor = document.createElement('a')
    anchor.className = 'link'
    if (href) anchor.setAttribute('href', href)
    if (withText) {
      const text = document.createElement('p')
      text.className = 'text'
      anchor.appendChild(text)
    }
    return anchor
  }

  function mountTheme() {
    return mount(defineComponent({ setup: () => theme.setup(), render: () => null }))
  }

  const badges = () => document.querySelectorAll('.VPSidebar .pro-badge')

  beforeEach(() => {
    document.body.innerHTML = ''
    route = reactive({ path: '/' })
    vi.mocked(useRoute).mockReturnValue(route as any)
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 0
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('adds a PRO badge to Pro analyzer links only', () => {
    const sidebar = document.createElement('aside')
    sidebar.className = 'VPSidebar'
    const pro = link(PRO_PATH)
    const proWithoutText = link(PRO_PATH, false)
    const free = link(FREE_PATH)
    const noHref = link(null)
    sidebar.append(pro, proWithoutText, free, noHref)
    document.body.appendChild(sidebar)

    mountTheme()

    expect(badges()).toHaveLength(1)
    expect(pro.querySelector('.pro-badge')?.textContent).toBe('PRO')
    expect(proWithoutText.querySelector('.pro-badge')).toBeNull()
    expect(free.querySelector('.pro-badge')).toBeNull()
    expect(noHref.querySelector('.pro-badge')).toBeNull()
  })

  it('re-decorates on navigation without duplicating badges', async () => {
    const sidebar = document.createElement('aside')
    sidebar.className = 'VPSidebar'
    sidebar.append(link(PRO_PATH))
    document.body.appendChild(sidebar)

    mountTheme()
    expect(badges()).toHaveLength(1)

    // A newly rendered Pro link appears after navigating
    sidebar.append(link(PRO_PATH))
    route.path = PRO_PATH
    await nextTick()
    await nextTick()

    expect(badges()).toHaveLength(2)
  })
})
