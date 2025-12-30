import '@testing-library/jest-dom'

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock PointerEvent for Radix UI components
class MockPointerEvent extends Event {
  button: number
  ctrlKey: boolean
  pointerType: string
  pointerId: number

  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props)
    this.button = props.button ?? 0
    this.ctrlKey = props.ctrlKey ?? false
    this.pointerType = props.pointerType ?? 'mouse'
    this.pointerId = props.pointerId ?? 1
  }
}

// @ts-expect-error - PointerEvent mock
window.PointerEvent = MockPointerEvent

// Mock hasPointerCapture and related methods for Radix UI
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = function () {
    return false
  }
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = function () {}
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = function () {}
}

// Mock scrollIntoView for Radix UI
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {}
}
