import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AnalyzerCard from '../../.vitepress/theme/components/AnalyzerCard.vue'

describe('AnalyzerCard', () => {
  it('renders title and description', () => {
    const wrapper = mount(AnalyzerCard, {
      props: { title: 'SQL Injection', description: 'Detects raw queries' },
    })

    expect(wrapper.text()).toContain('SQL Injection')
    expect(wrapper.text()).toContain('Detects raw queries')
  })

  it('renders as <a> when link is provided', () => {
    const wrapper = mount(AnalyzerCard, {
      props: {
        title: 'XSS',
        description: 'Finds XSS',
        link: '/analyzers/security/xss',
      },
    })

    const root = wrapper.element as HTMLElement
    expect(root.tagName).toBe('A')
    expect(root.getAttribute('href')).toBe('/analyzers/security/xss')
  })

  it('renders as <div> when no link is provided', () => {
    const wrapper = mount(AnalyzerCard, {
      props: { title: 'Test', description: 'Desc' },
    })

    expect(wrapper.element.tagName).toBe('DIV')
  })

  it.each([
    ['critical', 'Critical', 'bg-red-100'],
    ['high', 'High', 'bg-orange-100'],
    ['medium', 'Medium', 'bg-yellow-100'],
    ['low', 'Low', 'bg-blue-100'],
    ['info', 'Info', 'bg-gray-100'],
  ] as const)(
    'severity="%s" renders label "%s" with class containing "%s"',
    (severity, label, expectedClass) => {
      const wrapper = mount(AnalyzerCard, {
        props: { title: 'T', description: 'D', severity },
      })

      const badge = wrapper.find('span.shrink-0')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe(label)
      expect(badge.classes().join(' ')).toContain(expectedClass)
    },
  )

  it('hides severity badge when severity is not provided', () => {
    const wrapper = mount(AnalyzerCard, {
      props: { title: 'T', description: 'D' },
    })

    expect(wrapper.find('span.shrink-0').exists()).toBe(false)
  })

  it('shows category when provided', () => {
    const wrapper = mount(AnalyzerCard, {
      props: { title: 'T', description: 'D', category: 'Security' },
    })

    expect(wrapper.text()).toContain('Security')
  })

  it('hides category section when not provided', () => {
    const wrapper = mount(AnalyzerCard, {
      props: { title: 'T', description: 'D' },
    })

    // The category div should not render (v-if="category")
    const categoryDiv = wrapper.findAll('div').find(
      (d) => d.classes().includes('mt-2'),
    )
    expect(categoryDiv).toBeUndefined()
  })
})
