import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLoadingStates, useFormLoading, usePaginationLoading } from '../useLoadingStates'

describe('useLoadingStates', () => {
  describe('useLoadingStates hook', () => {
    it('initializes with empty states', () => {
      const { result } = renderHook(() => useLoadingStates())
      expect(result.current.states).toEqual({})
      expect(result.current.isAnyLoading).toBe(false)
    })

    it('setLoading sets loading state for a key', () => {
      const { result } = renderHook(() => useLoadingStates())

      act(() => {
        result.current.setLoading('fetch', true)
      })

      expect(result.current.states['fetch'].isLoading).toBe(true)
      expect(result.current.isAnyLoading).toBe(true)
    })

    it('setLoading clears error when setting loading to true', () => {
      const { result } = renderHook(() => useLoadingStates())

      act(() => {
        result.current.setError('fetch', 'Some error')
      })

      expect(result.current.states['fetch'].error).toBe('Some error')

      act(() => {
        result.current.setLoading('fetch', true)
      })

      expect(result.current.states['fetch'].error).toBeNull()
    })

    it('setError sets error and clears loading', () => {
      const { result } = renderHook(() => useLoadingStates())

      act(() => {
        result.current.setLoading('fetch', true)
      })

      act(() => {
        result.current.setError('fetch', 'Network error')
      })

      expect(result.current.states['fetch'].error).toBe('Network error')
      expect(result.current.states['fetch'].isLoading).toBe(false)
      expect(result.current.states['fetch'].success).toBe(false)
    })

    it('setSuccess sets success state', () => {
      const { result } = renderHook(() => useLoadingStates())

      act(() => {
        result.current.setSuccess('submit', true)
      })

      expect(result.current.states['submit'].success).toBe(true)
      expect(result.current.states['submit'].isLoading).toBe(false)
      expect(result.current.states['submit'].error).toBeNull()
    })

    it('clearState removes a specific key', () => {
      const { result } = renderHook(() => useLoadingStates())

      act(() => {
        result.current.setLoading('fetch', true)
        result.current.setLoading('submit', true)
      })

      act(() => {
        result.current.clearState('fetch')
      })

      expect(result.current.states['fetch']).toBeUndefined()
      expect(result.current.states['submit']).toBeDefined()
    })

    it('clearAllStates clears all states', () => {
      const { result } = renderHook(() => useLoadingStates())

      act(() => {
        result.current.setLoading('fetch', true)
        result.current.setLoading('submit', true)
      })

      act(() => {
        result.current.clearAllStates()
      })

      expect(result.current.states).toEqual({})
      expect(result.current.isAnyLoading).toBe(false)
    })

    it('isAnyLoading returns true if any key is loading', () => {
      const { result } = renderHook(() => useLoadingStates())

      act(() => {
        result.current.setLoading('fetch', false)
        result.current.setLoading('submit', true)
      })

      expect(result.current.isAnyLoading).toBe(true)
    })
  })

  describe('useFormLoading hook', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('initializes with default values', () => {
      const { result } = renderHook(() => useFormLoading())

      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.submitError).toBeNull()
      expect(result.current.isSuccess).toBe(false)
    })

    it('startSubmitting sets submitting state', () => {
      const { result } = renderHook(() => useFormLoading())

      act(() => {
        result.current.startSubmitting()
      })

      expect(result.current.isSubmitting).toBe(true)
      expect(result.current.submitError).toBeNull()
      expect(result.current.isSuccess).toBe(false)
    })

    it('stopSubmitting with error sets error state', () => {
      const { result } = renderHook(() => useFormLoading())

      act(() => {
        result.current.startSubmitting()
      })

      act(() => {
        result.current.stopSubmitting('Validation failed')
      })

      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.submitError).toBe('Validation failed')
      expect(result.current.isSuccess).toBe(false)
    })

    it('stopSubmitting without error sets success state', () => {
      const { result } = renderHook(() => useFormLoading())

      act(() => {
        result.current.startSubmitting()
      })

      act(() => {
        result.current.stopSubmitting()
      })

      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.submitError).toBeNull()
      expect(result.current.isSuccess).toBe(true)
    })

    it('success state clears after 3 seconds', () => {
      const { result } = renderHook(() => useFormLoading())

      act(() => {
        result.current.stopSubmitting()
      })

      expect(result.current.isSuccess).toBe(true)

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(result.current.isSuccess).toBe(false)
    })

    it('clearStates resets all states', () => {
      const { result } = renderHook(() => useFormLoading())

      act(() => {
        result.current.startSubmitting()
      })

      act(() => {
        result.current.stopSubmitting('Error')
      })

      act(() => {
        result.current.clearStates()
      })

      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.submitError).toBeNull()
      expect(result.current.isSuccess).toBe(false)
    })
  })

  describe('usePaginationLoading hook', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => usePaginationLoading())

      expect(result.current.isLoadingPage).toBe(false)
      expect(result.current.isSearching).toBe(false)
      expect(result.current.isFiltering).toBe(false)
    })

    it('setIsLoadingPage updates loading page state', () => {
      const { result } = renderHook(() => usePaginationLoading())

      act(() => {
        result.current.setIsLoadingPage(true)
      })

      expect(result.current.isLoadingPage).toBe(true)
    })

    it('setIsSearching updates searching state', () => {
      const { result } = renderHook(() => usePaginationLoading())

      act(() => {
        result.current.setIsSearching(true)
      })

      expect(result.current.isSearching).toBe(true)
    })

    it('setIsFiltering updates filtering state', () => {
      const { result } = renderHook(() => usePaginationLoading())

      act(() => {
        result.current.setIsFiltering(true)
      })

      expect(result.current.isFiltering).toBe(true)
    })
  })
})
