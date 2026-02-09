import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import {
  observeMock,
  unobserveMock,
  disconnectMock,
  getLastObserverCallback,
} from '../setup-dom'
import { useScrollReveal } from '../../.vitepress/theme/composables/useScrollReveal'

function createWrapper(template: string) {
  return mount(
    defineComponent({
      setup() {
        const containerRef = ref<HTMLElement | null>(null)
        useScrollReveal(containerRef)
        return { containerRef }
      },
      template,
    }),
  )
}

describe('useScrollReveal', () => {
  it('observes elements with [data-reveal] attribute', async () => {
    createWrapper(`
      <div ref="containerRef">
        <div data-reveal>A</div>
        <div data-reveal>B</div>
        <div>no reveal</div>
      </div>
    `)

    await nextTick()

    expect(observeMock).toHaveBeenCalledTimes(2)
  })

  it('adds "revealed" class when element intersects', async () => {
    const wrapper = createWrapper(
      '<div ref="containerRef"><div data-reveal>content</div></div>',
    )

    await nextTick()

    const target = wrapper.find('[data-reveal]').element
    const callback = getLastObserverCallback()

    callback(
      [{ isIntersecting: true, target } as any],
      {} as IntersectionObserver,
    )

    expect(target.classList.contains('revealed')).toBe(true)
    expect(unobserveMock).toHaveBeenCalledWith(target)
  })

  it('does not add "revealed" when element is not intersecting', async () => {
    const wrapper = createWrapper(
      '<div ref="containerRef"><div data-reveal>content</div></div>',
    )

    await nextTick()

    const target = wrapper.find('[data-reveal]').element
    const callback = getLastObserverCallback()

    callback(
      [{ isIntersecting: false, target } as any],
      {} as IntersectionObserver,
    )

    expect(target.classList.contains('revealed')).toBe(false)
  })

  it('skips IntersectionObserver when prefers-reduced-motion is set', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))

    const wrapper = createWrapper(
      '<div ref="containerRef"><div data-reveal>content</div></div>',
    )

    await nextTick()

    const target = wrapper.find('[data-reveal]').element
    expect(target.classList.contains('revealed')).toBe(true)
    expect(observeMock).not.toHaveBeenCalled()
  })

  it('disconnects observer on unmount', async () => {
    const wrapper = createWrapper(
      '<div ref="containerRef"><div data-reveal>content</div></div>',
    )

    await nextTick()
    wrapper.unmount()

    expect(disconnectMock).toHaveBeenCalled()
  })

  it('does nothing when container ref is null', async () => {
    mount(
      defineComponent({
        setup() {
          const containerRef = ref<HTMLElement | null>(null)
          useScrollReveal(containerRef)
          return {}
        },
        template: '<div>no ref</div>',
      }),
    )

    await nextTick()

    expect(observeMock).not.toHaveBeenCalled()
  })
})
