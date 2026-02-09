import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CodeComparison from '../../.vitepress/theme/components/CodeComparison.vue'

describe('CodeComparison', () => {
  it('renders default "Bad" and "Good" labels', () => {
    const wrapper = mount(CodeComparison)

    const labels = wrapper.findAll('span.font-medium')
    expect(labels).toHaveLength(2)
    expect(labels[0].text()).toBe('Bad')
    expect(labels[1].text()).toBe('Good')
  })

  it('uses custom labels when provided', () => {
    const wrapper = mount(CodeComparison, {
      props: { badLabel: 'Before', goodLabel: 'After' },
    })

    const labels = wrapper.findAll('span.font-medium')
    expect(labels[0].text()).toBe('Before')
    expect(labels[1].text()).toBe('After')
  })

  it('renders slot content', () => {
    const wrapper = mount(CodeComparison, {
      slots: {
        bad: '<pre>bad code</pre>',
        good: '<pre>good code</pre>',
      },
    })

    expect(wrapper.find('.bad-code').text()).toContain('bad code')
    expect(wrapper.find('.good-code').text()).toContain('good code')
  })

  it('has the two-column grid layout class', () => {
    const wrapper = mount(CodeComparison)

    expect(wrapper.classes()).toContain('code-comparison')
    expect(wrapper.classes()).toContain('grid')
  })
})
