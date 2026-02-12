import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

vi.mock('vitepress', () => ({
  useData: vi.fn(),
}))

import { useData } from 'vitepress'
import ProBadge from '../../.vitepress/theme/components/ProBadge.vue'

function setupFrontmatter(fm: Record<string, unknown>) {
  vi.mocked(useData).mockReturnValue({
    frontmatter: ref(fm),
  } as any)
}

describe('ProBadge', () => {
  it('renders the banner when frontmatter.pro is true', () => {
    setupFrontmatter({ pro: true })

    const wrapper = mount(ProBadge)
    expect(wrapper.find('[role="note"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Pro Analyzer')
    expect(wrapper.text()).toContain('ShieldCI Pro')
  })

  it('renders nothing when frontmatter.pro is absent', () => {
    setupFrontmatter({})

    const wrapper = mount(ProBadge)
    expect(wrapper.find('[role="note"]').exists()).toBe(false)
  })

  it('renders nothing when frontmatter.pro is false', () => {
    setupFrontmatter({ pro: false })

    const wrapper = mount(ProBadge)
    expect(wrapper.find('[role="note"]').exists()).toBe(false)
  })

  it('has correct accessibility attributes', () => {
    setupFrontmatter({ pro: true })

    const wrapper = mount(ProBadge)
    const banner = wrapper.find('[role="note"]')
    expect(banner.attributes('aria-label')).toBe('This is a Pro analyzer')
  })

  it('contains a link to the Pro pricing page', () => {
    setupFrontmatter({ pro: true })

    const wrapper = mount(ProBadge)
    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/pro/')
    expect(link.text()).toBe('ShieldCI Pro')
  })

  it('renders a star icon', () => {
    setupFrontmatter({ pro: true })

    const wrapper = mount(ProBadge)
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('aria-hidden')).toBe('true')
  })
})
