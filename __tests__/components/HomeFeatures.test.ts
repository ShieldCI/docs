import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import '../setup-dom'
import HomeFeatures from '../../.vitepress/theme/components/HomeFeatures.vue'

describe('HomeFeatures', () => {
  it('renders the "Why ShieldCI?" heading', () => {
    const wrapper = mount(HomeFeatures)
    expect(wrapper.text()).toContain('Why ShieldCI?')
  })

  it('renders all 6 feature cards', () => {
    const wrapper = mount(HomeFeatures)

    const expectedTitles = [
      'Catch Vulnerabilities Early',
      'Optimize Performance',
      'Deep Coverage, 5 Categories',
      'CI/CD Integration',
      'Actionable Fix Guidance',
      'Built for Teams',
    ]

    for (const title of expectedTitles) {
      expect(wrapper.text()).toContain(title)
    }
  })

  it('renders SVG icons for each feature', () => {
    const wrapper = mount(HomeFeatures)
    // v-html renders SVGs into spans — find all SVG elements inside the grid
    const svgs = wrapper.findAll('.grid svg')

    expect(svgs).toHaveLength(6)
  })
})
