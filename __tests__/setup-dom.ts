/**
 * Shared DOM stubs for jsdom environment.
 * jsdom doesn't implement IntersectionObserver or matchMedia,
 * so we provide no-op implementations.
 */
import { vi, beforeEach } from 'vitest'

let observerCallback: IntersectionObserverCallback | undefined

export function getLastObserverCallback(): IntersectionObserverCallback {
  if (!observerCallback) throw new Error('No IntersectionObserver has been created yet')
  return observerCallback
}

export const observeMock = vi.fn()
export const unobserveMock = vi.fn()
export const disconnectMock = vi.fn()

beforeEach(() => {
  observeMock.mockClear()
  unobserveMock.mockClear()
  disconnectMock.mockClear()
  observerCallback = undefined

  // IntersectionObserver — must be a class (arrow functions can't be used with `new`)
  class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      observerCallback = callback
    }
    observe = observeMock
    unobserve = unobserveMock
    disconnect = disconnectMock
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

  // matchMedia — default: no reduced motion
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
})
