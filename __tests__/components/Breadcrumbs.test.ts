import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

// Mock VitePress composables before importing the component
vi.mock('vitepress', () => ({
  useData: vi.fn(),
  useRoute: vi.fn(),
}))

import { useData, useRoute } from 'vitepress'
import Breadcrumbs from '../../.vitepress/theme/components/Breadcrumbs.vue'

function setupMocks(routePath: string, frontmatterTitle?: string, pageTitle?: string) {
  vi.mocked(useData).mockReturnValue({
    frontmatter: ref({ title: frontmatterTitle }),
    title: ref(pageTitle ?? ''),
  } as any)

  vi.mocked(useRoute).mockReturnValue({
    path: routePath,
  } as any)
}

describe('Breadcrumbs', () => {
  it('renders nothing on the homepage', () => {
    setupMocks('/')

    const wrapper = mount(Breadcrumbs)
    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('renders Home + page for a single-level path', () => {
    setupMocks('/contributing', 'Contributing')

    const wrapper = mount(Breadcrumbs)
    const items = wrapper.findAll('li')

    expect(items).toHaveLength(2)
    expect(items[0].text()).toContain('Home')
    expect(items[0].find('a').attributes('href')).toBe('/')
    expect(items[1].text()).toContain('Contributing')
  })

  it('renders intermediate segments as links with Title Case', () => {
    setupMocks('/analyzers/security/sql-injection', 'SQL Injection Analyzer')

    const wrapper = mount(Breadcrumbs)
    const items = wrapper.findAll('li')

    // Home > Analyzers > Security > SQL Injection Analyzer
    expect(items).toHaveLength(4)
    expect(items[0].find('a').attributes('href')).toBe('/')
    expect(items[1].find('a').text()).toBe('Analyzers')
    expect(items[1].find('a').attributes('href')).toBe('/analyzers')
    expect(items[2].find('a').text()).toBe('Security')
    expect(items[2].find('a').attributes('href')).toBe('/analyzers/security')
    // Last item: no link, uses frontmatter title
    expect(items[3].find('span').text()).toBe('SQL Injection Analyzer')
  })

  it('falls back to kebab-to-Title-Case when no frontmatter title', () => {
    setupMocks('/getting-started/ci-cd-integration', undefined, '')

    const wrapper = mount(Breadcrumbs)
    const items = wrapper.findAll('li')

    const lastItem = items[items.length - 1]
    expect(lastItem.find('span').text()).toBe('Ci Cd Integration')
  })

  it('has aria-label for accessibility', () => {
    setupMocks('/guide/install', 'Install')

    const wrapper = mount(Breadcrumbs)
    expect(wrapper.find('nav').attributes('aria-label')).toBe('Breadcrumb')
  })

  it('marks the last item with aria-current="page"', () => {
    setupMocks('/introduction/why-shieldci', 'Why ShieldCI?')

    const wrapper = mount(Breadcrumbs)
    const currentPage = wrapper.find('[aria-current="page"]')

    expect(currentPage.exists()).toBe(true)
    expect(currentPage.text()).toBe('Why ShieldCI?')
  })

  it('renders separators between items but not after the last', () => {
    setupMocks('/analyzers/security/xss', 'XSS')

    const wrapper = mount(Breadcrumbs)
    const separators = wrapper.findAll('.separator')

    // 4 items → 3 separators
    expect(separators).toHaveLength(3)
  })
})
