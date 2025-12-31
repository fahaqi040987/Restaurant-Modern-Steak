/**
 * T016: Unit test for Loader component
 * Tests: Animation display, timer behavior, callback execution, visibility states
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { Loader } from '../Loader'

describe('Loader Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('renders when show is true', () => {
      render(<Loader show={true} />)

      const loader = screen.getByRole('alert')
      expect(loader).toBeInTheDocument()
    })

    it('does not render when show is false', () => {
      render(<Loader show={false} />)

      const loader = screen.queryByRole('alert')
      expect(loader).not.toBeInTheDocument()
    })

    it('renders restaurant name', () => {
      render(<Loader show={true} />)

      expect(screen.getByText('Steak Kenangan')).toBeInTheDocument()
    })

    it('renders loading text', () => {
      render(<Loader show={true} />)

      expect(screen.getByText('Preparing your experience...')).toBeInTheDocument()
    })

    it('renders loading dots', () => {
      render(<Loader show={true} />)

      const dots = screen.getAllByRole('alert')[0].querySelectorAll('.loader-dot')
      expect(dots).toHaveLength(3)
    })

    it('renders animated utensils (fork and knife)', () => {
      render(<Loader show={true} />)

      // Check for SVG elements with utensils animation class
      const loader = screen.getByRole('alert')
      const utensils = loader.querySelectorAll('.loader-utensils-animation')
      expect(utensils).toHaveLength(2)
    })
  })

  describe('Accessibility', () => {
    it('has correct aria-busy attribute', () => {
      render(<Loader show={true} />)

      const loader = screen.getByRole('alert')
      expect(loader).toHaveAttribute('aria-busy', 'true')
    })

    it('has correct aria-label', () => {
      render(<Loader show={true} />)

      const loader = screen.getByRole('alert')
      expect(loader).toHaveAttribute('aria-label', 'Loading page content')
    })

    it('marks decorative elements as aria-hidden', () => {
      render(<Loader show={true} />)

      const loader = screen.getByRole('alert')
      const svgs = loader.querySelectorAll('svg')
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute('aria-hidden', 'true')
      })

      const dots = loader.querySelectorAll('.loader-dot')
      dots.forEach((dot) => {
        expect(dot).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  describe('Timer Behavior', () => {
    it('uses default duration of 2500ms', () => {
      const onComplete = vi.fn()
      render(<Loader show={true} onComplete={onComplete} />)

      // Advance timer to just before completion
      act(() => {
        vi.advanceTimersByTime(2499)
      })
      expect(onComplete).not.toHaveBeenCalled()

      // Advance to completion
      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('respects custom duration prop', () => {
      const onComplete = vi.fn()
      const customDuration = 5000

      render(<Loader show={true} duration={customDuration} onComplete={onComplete} />)

      // Should not complete before custom duration
      act(() => {
        vi.advanceTimersByTime(4999)
      })
      expect(onComplete).not.toHaveBeenCalled()

      // Should complete at custom duration
      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('calls onComplete callback when animation finishes', () => {
      const onComplete = vi.fn()
      render(<Loader show={true} onComplete={onComplete} />)

      act(() => {
        vi.advanceTimersByTime(2500)
      })

      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('starts fading 500ms before completion', () => {
      render(<Loader show={true} duration={2500} />)

      // Initially not fading
      let loader = screen.getByRole('alert')
      expect(loader).toHaveClass('opacity-100')
      expect(loader).not.toHaveClass('opacity-0')

      // Advance to fade start (2500 - 500 = 2000ms)
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      loader = screen.getByRole('alert')
      expect(loader).toHaveClass('opacity-0')
    })

    it('hides after completion', () => {
      render(<Loader show={true} />)

      act(() => {
        vi.advanceTimersByTime(2500)
      })

      const loader = screen.queryByRole('alert')
      expect(loader).not.toBeInTheDocument()
    })
  })

  describe('Show/Hide Behavior', () => {
    it('shows loader when show changes from false to true', () => {
      const { rerender } = render(<Loader show={false} />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()

      rerender(<Loader show={true} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('hides loader immediately when show changes to false', () => {
      const { rerender } = render(<Loader show={true} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()

      rerender(<Loader show={false} />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('resets fade state when show changes to true again', () => {
      const { rerender } = render(<Loader show={true} />)

      // Advance to start fading
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // Should be fading
      expect(screen.getByRole('alert')).toHaveClass('opacity-0')

      // Hide and show again
      rerender(<Loader show={false} />)
      rerender(<Loader show={true} />)

      // Should not be fading (reset)
      expect(screen.getByRole('alert')).toHaveClass('opacity-100')
    })

    it('clears timers when unmounted', () => {
      const onComplete = vi.fn()
      const { unmount } = render(<Loader show={true} onComplete={onComplete} />)

      // Advance partway
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Unmount
      unmount()

      // Advance past when callback would have fired
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // onComplete should not have been called
      expect(onComplete).not.toHaveBeenCalled()
    })

    it('clears timers when show changes to false', () => {
      const onComplete = vi.fn()
      const { rerender } = render(<Loader show={true} onComplete={onComplete} />)

      // Advance partway
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Hide loader
      rerender(<Loader show={false} onComplete={onComplete} />)

      // Advance past when callback would have fired
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // onComplete should not have been called (timer was cleared)
      expect(onComplete).not.toHaveBeenCalled()
    })
  })

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      render(<Loader show={true} className="custom-loader-class" />)

      const loader = screen.getByRole('alert')
      expect(loader).toHaveClass('custom-loader-class')
    })

    it('preserves base classes when custom className is added', () => {
      render(<Loader show={true} className="custom-class" />)

      const loader = screen.getByRole('alert')
      expect(loader).toHaveClass('fixed')
      expect(loader).toHaveClass('inset-0')
      expect(loader).toHaveClass('z-[9999]')
      expect(loader).toHaveClass('custom-class')
    })
  })

  describe('Styling', () => {
    it('has full-screen fixed positioning', () => {
      render(<Loader show={true} />)

      const loader = screen.getByRole('alert')
      expect(loader).toHaveClass('fixed')
      expect(loader).toHaveClass('inset-0')
    })

    it('has highest z-index', () => {
      render(<Loader show={true} />)

      const loader = screen.getByRole('alert')
      expect(loader).toHaveClass('z-[9999]')
    })

    it('centers content with flexbox', () => {
      render(<Loader show={true} />)

      const loader = screen.getByRole('alert')
      expect(loader).toHaveClass('flex')
      expect(loader).toHaveClass('flex-col')
      expect(loader).toHaveClass('items-center')
      expect(loader).toHaveClass('justify-center')
    })

    it('has transition classes for fade effect', () => {
      render(<Loader show={true} />)

      const loader = screen.getByRole('alert')
      expect(loader).toHaveClass('transition-opacity')
      expect(loader).toHaveClass('duration-500')
    })
  })

  describe('Animation Classes', () => {
    it('applies utensils animation class to SVGs', () => {
      render(<Loader show={true} />)

      const loader = screen.getByRole('alert')
      const utensils = loader.querySelectorAll('.loader-utensils-animation')
      expect(utensils.length).toBe(2)
    })

    it('applies staggered animation delay to knife', () => {
      render(<Loader show={true} />)

      const loader = screen.getByRole('alert')
      const utensils = loader.querySelectorAll('.loader-utensils-animation')

      // First utensil (fork) should have 0s delay
      expect(utensils[0]).toHaveStyle({ animationDelay: '0s' })

      // Second utensil (knife) should have 0.2s delay
      expect(utensils[1]).toHaveStyle({ animationDelay: '0.2s' })
    })

    it('applies loader-dot class to loading dots', () => {
      render(<Loader show={true} />)

      const loader = screen.getByRole('alert')
      const dots = loader.querySelectorAll('.loader-dot')
      expect(dots.length).toBe(3)
    })
  })
})
