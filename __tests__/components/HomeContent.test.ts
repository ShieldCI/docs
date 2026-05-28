import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import '../setup-dom'
import HomeContent from '../../.vitepress/theme/components/HomeContent.vue'

describe('HomeContent', () => {
  it('renders all 5 category cards', () => {
    const wrapper = mount(HomeContent)

    const categories = ['Security', 'Performance', 'Reliability', 'Code Quality', 'Best Practices']
    for (const cat of categories) {
      expect(wrapper.text()).toContain(cat)
    }
  })

  it('category cards link to the correct paths', () => {
    const wrapper = mount(HomeContent)
    const links = wrapper.findAll('a[href^="/analyzers/"]')

    const hrefs = links.map((a) => a.attributes('href'))
    expect(hrefs).toContain('/analyzers/security/')
    expect(hrefs).toContain('/analyzers/performance/')
    expect(hrefs).toContain('/analyzers/reliability/')
    expect(hrefs).toContain('/analyzers/code-quality/')
    expect(hrefs).toContain('/analyzers/best-practices/')
  })

  it('renders the "How It Works" section with 3 steps', () => {
    const wrapper = mount(HomeContent)

    expect(wrapper.text()).toContain('How It Works')
    expect(wrapper.text()).toContain('composer require shieldci/laravel')
    expect(wrapper.text()).toContain('php artisan shield:analyze')
    expect(wrapper.text()).toContain('Follow actionable recommendations')
  })

  it('renders the CTA section with Get Started link', () => {
    const wrapper = mount(HomeContent)

    const cta = wrapper.find('a[href="/getting-started/installation"]')
    expect(cta.exists()).toBe(true)
    expect(cta.text()).toBe('Get Started')
  })

  it('shows analyzer counts on category cards', () => {
    const wrapper = mount(HomeContent)

    const expectedCounts = ['22', '18', '13', '5', '15']
    for (const count of expectedCounts) {
      expect(wrapper.text()).toContain(count)
    }
  })
})
