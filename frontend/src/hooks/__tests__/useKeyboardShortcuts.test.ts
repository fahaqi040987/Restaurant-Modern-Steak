import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKeyboardShortcuts, createPOSShortcuts } from '../useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('useKeyboardShortcuts hook', () => {
    it('returns shortcuts info', () => {
      const action = vi.fn()
      const { result } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            { key: 'a', action, description: 'Test action' },
          ],
        })
      )

      expect(result.current.shortcuts).toHaveLength(1)
      expect(result.current.shortcuts[0]).toEqual({
        key: 'a',
        ctrl: undefined,
        shift: undefined,
        alt: undefined,
        description: 'Test action',
      })
    })

    it('executes action on key press', () => {
      const action = vi.fn()
      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            { key: 'a', action, description: 'Test action' },
          ],
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'a',
          bubbles: true,
        })
        document.dispatchEvent(event)
      })

      expect(action).toHaveBeenCalledTimes(1)
    })

    it('does not execute when disabled', () => {
      const action = vi.fn()
      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            { key: 'a', action, description: 'Test action' },
          ],
          enabled: false,
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'a',
          bubbles: true,
        })
        document.dispatchEvent(event)
      })

      expect(action).not.toHaveBeenCalled()
    })

    it('matches ctrl key modifier', () => {
      const action = vi.fn()
      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            { key: 'f', ctrlKey: true, action, description: 'Search' },
          ],
        })
      )

      // Without ctrl - should not trigger
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'f',
          ctrlKey: false,
          bubbles: true,
        })
        document.dispatchEvent(event)
      })

      expect(action).not.toHaveBeenCalled()

      // With ctrl - should trigger
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'f',
          ctrlKey: true,
          bubbles: true,
        })
        document.dispatchEvent(event)
      })

      expect(action).toHaveBeenCalledTimes(1)
    })

    it('matches shift key modifier', () => {
      const action = vi.fn()
      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            { key: 'n', shiftKey: true, action, description: 'New' },
          ],
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'n',
          shiftKey: true,
          bubbles: true,
        })
        document.dispatchEvent(event)
      })

      expect(action).toHaveBeenCalledTimes(1)
    })

    it('matches alt key modifier', () => {
      const action = vi.fn()
      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            { key: 'h', altKey: true, action, description: 'Help' },
          ],
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'h',
          altKey: true,
          bubbles: true,
        })
        document.dispatchEvent(event)
      })

      expect(action).toHaveBeenCalledTimes(1)
    })

    it('ignores shortcuts when typing in input', () => {
      const action = vi.fn()
      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            { key: 'a', action, description: 'Test' },
          ],
        })
      )

      // Create an input element
      const input = document.createElement('input')
      document.body.appendChild(input)

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'a',
          bubbles: true,
        })
        Object.defineProperty(event, 'target', { value: input })
        document.dispatchEvent(event)
      })

      expect(action).not.toHaveBeenCalled()

      document.body.removeChild(input)
    })

    it('ignores shortcuts when typing in textarea', () => {
      const action = vi.fn()
      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            { key: 'a', action, description: 'Test' },
          ],
        })
      )

      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'a',
          bubbles: true,
        })
        Object.defineProperty(event, 'target', { value: textarea })
        document.dispatchEvent(event)
      })

      expect(action).not.toHaveBeenCalled()

      document.body.removeChild(textarea)
    })

    it('prevents default behavior when shortcut matches', () => {
      const action = vi.fn()
      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            { key: 'a', action, description: 'Test' },
          ],
        })
      )

      const preventDefault = vi.fn()

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'a',
          bubbles: true,
        })
        event.preventDefault = preventDefault
        document.dispatchEvent(event)
      })

      expect(preventDefault).toHaveBeenCalled()
    })

    it('handles case insensitive key matching', () => {
      const action = vi.fn()
      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            { key: 'A', action, description: 'Test' },
          ],
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'a',
          bubbles: true,
        })
        document.dispatchEvent(event)
      })

      expect(action).toHaveBeenCalledTimes(1)
    })

    it('cleans up event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
      const action = vi.fn()

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [
            { key: 'a', action, description: 'Test' },
          ],
        })
      )

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })

  describe('createPOSShortcuts', () => {
    it('creates POS shortcuts with correct structure', () => {
      const actions = {
        openSearch: vi.fn(),
        clearCart: vi.fn(),
        proceedToPayment: vi.fn(),
        switchOrderType: vi.fn(),
        selectTable: vi.fn(),
      }

      const shortcuts = createPOSShortcuts(actions)

      expect(shortcuts).toHaveLength(5)

      // Search shortcut
      expect(shortcuts[0]).toEqual({
        key: 'f',
        ctrlKey: true,
        action: actions.openSearch,
        description: 'Open product search',
      })

      // Clear cart shortcut
      expect(shortcuts[1]).toEqual({
        key: 'Escape',
        action: actions.clearCart,
        description: 'Clear current cart',
      })

      // Payment shortcut
      expect(shortcuts[2]).toEqual({
        key: 'Enter',
        ctrlKey: true,
        action: actions.proceedToPayment,
        description: 'Proceed to payment',
      })

      // Switch order type shortcut
      expect(shortcuts[3]).toEqual({
        key: 't',
        ctrlKey: true,
        action: actions.switchOrderType,
        description: 'Switch order type',
      })

      // Select table shortcut
      expect(shortcuts[4]).toEqual({
        key: 's',
        ctrlKey: true,
        action: actions.selectTable,
        description: 'Select table (dine-in only)',
      })
    })

    it('shortcuts have correct actions', () => {
      const openSearch = vi.fn()
      const clearCart = vi.fn()
      const proceedToPayment = vi.fn()
      const switchOrderType = vi.fn()
      const selectTable = vi.fn()

      const shortcuts = createPOSShortcuts({
        openSearch,
        clearCart,
        proceedToPayment,
        switchOrderType,
        selectTable,
      })

      shortcuts[0].action()
      expect(openSearch).toHaveBeenCalled()

      shortcuts[1].action()
      expect(clearCart).toHaveBeenCalled()

      shortcuts[2].action()
      expect(proceedToPayment).toHaveBeenCalled()

      shortcuts[3].action()
      expect(switchOrderType).toHaveBeenCalled()

      shortcuts[4].action()
      expect(selectTable).toHaveBeenCalled()
    })
  })
})
