import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'

// Mock VitePress composables before importing the component
vi.mock('vitepress', () => ({
  useRoute: vi.fn(),
}))

import { useRoute } from 'vitepress'
import SidebarAccordion from '../../.vitepress/theme/components/SidebarAccordion.vue'

const STORAGE_KEY = 'shieldci-sidebar-open'

interface ItemSpec {
  href?: string
  collapsed?: boolean
  active?: boolean
  caret?: boolean
}

/**
 * Builds a VitePress-like sidebar. Clicking an item's caret toggles its
 * `collapsed` class, which is what VitePress does.
 */
function buildSidebar(specs: ItemSpec[]): HTMLElement[] {
  const sidebar = document.createElement('aside')
  sidebar.className = 'VPSidebar'
  const group = document.createElement('div')
  sidebar.appendChild(group)

  const items = specs.map(({ href, collapsed = true, active = false, caret = true }) => {
    const item = document.createElement('section')
    item.className = 'VPSidebarItem level-1'
    if (collapsed) item.classList.add('collapsed')
    if (active) item.classList.add('has-active')

    const row = document.createElement('div')
    row.className = 'item'
    const anchor = document.createElement('a')
    if (href) anchor.setAttribute('href', href)
    row.appendChild(anchor)

    if (caret) {
      const caretEl = document.createElement('div')
      caretEl.className = 'caret'
      caretEl.addEventListener('click', () => item.classList.toggle('collapsed'))
      row.appendChild(caretEl)
    }

    item.appendChild(row)
    group.appendChild(item)
    return item
  })

  document.body.appendChild(sidebar)
  return items
}

const isOpen = (item: HTMLElement) => !item.classList.contains('collapsed')

// MutationObserver callbacks run as microtasks
const flushObserver = () => new Promise((resolve) => setTimeout(resolve, 0))

let route: { path: string }
let wrapper: VueWrapper | undefined

async function mountAccordion() {
  wrapper = mount(SidebarAccordion)
  await nextTick()
  await nextTick()
  return wrapper
}

describe('SidebarAccordion', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    sessionStorage.clear()
    route = reactive({ path: '/analyzers/security/xss' })
    vi.mocked(useRoute).mockReturnValue(route as any)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.restoreAllMocks()
  })

  describe('with an active item', () => {
    it('remembers the active section and closes its open siblings', async () => {
      const [active, openSibling, collapsedSibling] = buildSidebar([
        { href: '/analyzers/security/', collapsed: false, active: true },
        { href: '/analyzers/performance/', collapsed: false },
        { href: '/analyzers/reliability/' },
      ])

      await mountAccordion()

      expect(sessionStorage.getItem(STORAGE_KEY)).toBe('/analyzers/security/')
      expect(isOpen(active)).toBe(true)
      expect(isOpen(openSibling)).toBe(false)
      expect(isOpen(collapsedSibling)).toBe(false)
    })

    it('tolerates an open sibling without a caret', async () => {
      const [, caretless] = buildSidebar([
        { href: '/analyzers/security/', collapsed: false, active: true },
        { href: '/analyzers/performance/', collapsed: false, caret: false },
      ])

      await mountAccordion()

      expect(isOpen(caretless)).toBe(true)
    })

    it('saves nothing when the active section link has no href', async () => {
      buildSidebar([{ collapsed: false, active: true }])

      await mountAccordion()

      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    })
  })

  describe('without an active item', () => {
    it('leaves the sidebar alone when nothing was saved', async () => {
      const items = buildSidebar([
        { href: '/analyzers/security/' },
        { href: '/analyzers/performance/' },
      ])

      await mountAccordion()

      expect(items.map(isOpen)).toEqual([false, false])
    })

    it('reopens the saved section', async () => {
      sessionStorage.setItem(STORAGE_KEY, '/analyzers/performance/')
      const [other, saved] = buildSidebar([
        { href: '/analyzers/security/' },
        { href: '/analyzers/performance/' },
      ])

      await mountAccordion()

      expect(isOpen(saved)).toBe(true)
      expect(isOpen(other)).toBe(false)
    })

    it('does not toggle the saved section when it is already open', async () => {
      sessionStorage.setItem(STORAGE_KEY, '/analyzers/performance/')
      const [, saved] = buildSidebar([
        { href: '/analyzers/security/' },
        { href: '/analyzers/performance/', collapsed: false },
      ])

      await mountAccordion()

      expect(isOpen(saved)).toBe(true)
    })

    it('tolerates a saved section without a caret', async () => {
      sessionStorage.setItem(STORAGE_KEY, '/analyzers/performance/')
      const [saved] = buildSidebar([{ href: '/analyzers/performance/', caret: false }])

      await mountAccordion()

      expect(isOpen(saved)).toBe(false)
    })
  })

  describe('observer', () => {
    it('closes open siblings when a section is opened', async () => {
      const [first, second] = buildSidebar([
        { href: '/analyzers/security/', collapsed: false },
        { href: '/analyzers/performance/' },
      ])
      await mountAccordion()

      second.querySelector<HTMLElement>('.caret')!.click()
      await flushObserver()

      expect(isOpen(second)).toBe(true)
      expect(isOpen(first)).toBe(false)
    })

    it('ignores class changes that do not open a section', async () => {
      const [first, second] = buildSidebar([
        { href: '/analyzers/security/', collapsed: false },
        { href: '/analyzers/performance/', collapsed: false },
      ])
      await mountAccordion()

      // Open → open (not collapsed before), and a change on a nested element
      first.classList.add('is-link')
      first.querySelector('.item')!.classList.add('hovered')
      await flushObserver()

      expect(isOpen(first)).toBe(true)
      expect(isOpen(second)).toBe(true)
    })

    it('treats a section that had no class attribute as not previously collapsed', async () => {
      const [open] = buildSidebar([{ href: '/analyzers/security/', collapsed: false }])
      await mountAccordion()

      const fresh = document.createElement('section')
      open.parentElement!.appendChild(fresh)
      await flushObserver()
      fresh.className = 'VPSidebarItem level-1'
      await flushObserver()

      expect(isOpen(open)).toBe(true)
    })

    it('does not observe when there is no sidebar', async () => {
      const observe = vi.spyOn(MutationObserver.prototype, 'observe')

      await mountAccordion()

      expect(observe).not.toHaveBeenCalled()
    })

    it('disconnects on unmount', async () => {
      buildSidebar([{ href: '/analyzers/security/' }])
      const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')
      await mountAccordion()

      wrapper!.unmount()
      wrapper = undefined

      expect(disconnect).toHaveBeenCalled()
    })
  })

  it('re-applies the accordion when the route changes', async () => {
    const [security, performance] = buildSidebar([
      { href: '/analyzers/security/', collapsed: false, active: true },
      { href: '/analyzers/performance/' },
    ])
    await mountAccordion()

    // Navigate: performance becomes the active, open section
    security.classList.remove('has-active')
    performance.classList.add('has-active')
    performance.classList.remove('collapsed')
    await flushObserver()
    security.classList.remove('collapsed')
    route.path = '/analyzers/performance/n-plus-one'
    await nextTick()

    expect(sessionStorage.getItem(STORAGE_KEY)).toBe('/analyzers/performance/')
    expect(isOpen(security)).toBe(false)
  })
})
