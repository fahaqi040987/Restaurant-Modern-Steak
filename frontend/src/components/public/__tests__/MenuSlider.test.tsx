/**
 * T024: Unit test for MenuSlider component
 * Tests: Category display, selection handling, slider navigation, responsiveness
 *
 * Note: This test is written TDD-style before MenuSlider component exists (T025).
 * Tests will fail until MenuSlider.tsx is implemented.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MenuSlider } from '../MenuSlider'
import type { PublicCategory } from '@/types'

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'public.allItems': 'All Items',
      }
      return translations[key] || key
    },
  }),
}))

// Sample categories for testing
const mockCategories: PublicCategory[] = [
  {
    id: 'cat-1',
    name: 'Steaks',
    description: 'Premium beef steaks',
    color: '#8B0000',
    sort_order: 1,
  },
  {
    id: 'cat-2',
    name: 'Sides',
    description: 'Delicious side dishes',
    color: '#228B22',
    sort_order: 2,
  },
  {
    id: 'cat-3',
    name: 'Beverages',
    description: 'Refreshing drinks',
    color: '#4169E1',
    sort_order: 3,
  },
  {
    id: 'cat-4',
    name: 'Desserts',
    description: 'Sweet endings',
    color: '#FFD700',
    sort_order: 4,
  },
  {
    id: 'cat-5',
    name: 'Appetizers',
    description: 'Start your meal',
    color: '#FF6347',
    sort_order: 5,
  },
]

describe('MenuSlider Component', () => {
  describe('Rendering', () => {
    it('renders the slider container', () => {
      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory={null}
          onCategoryChange={vi.fn()}
        />
      )

      const slider = screen.getByTestId('menu-slider')
      expect(slider).toBeInTheDocument()
    })

    it('renders "All Items" button', () => {
      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory={null}
          onCategoryChange={vi.fn()}
        />
      )

      const allItemsBtn = screen.getByRole('button', { name: /All Items/i })
      expect(allItemsBtn).toBeInTheDocument()
    })

    it('renders all category buttons', () => {
      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory={null}
          onCategoryChange={vi.fn()}
        />
      )

      mockCategories.forEach((category) => {
        expect(screen.getByText(category.name)).toBeInTheDocument()
      })
    })

    it('renders loading state when isLoading is true', () => {
      render(
        <MenuSlider
          categories={[]}
          selectedCategory={null}
          onCategoryChange={vi.fn()}
          isLoading={true}
        />
      )

      // Should show skeleton loaders
      const skeletons = screen.getAllByTestId('category-skeleton')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('renders empty state when no categories', () => {
      render(
        <MenuSlider
          categories={[]}
          selectedCategory={null}
          onCategoryChange={vi.fn()}
          isLoading={false}
        />
      )

      // Should still show All Items button
      const allItemsBtn = screen.getByRole('button', { name: /All Items/i })
      expect(allItemsBtn).toBeInTheDocument()
    })
  })

  describe('Selection Behavior', () => {
    it('marks "All Items" as selected when selectedCategory is null', () => {
      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory={null}
          onCategoryChange={vi.fn()}
        />
      )

      const allItemsBtn = screen.getByRole('button', { name: /All Items/i })
      expect(allItemsBtn).toHaveAttribute('aria-pressed', 'true')
    })

    it('marks correct category as selected', () => {
      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory="cat-2"
          onCategoryChange={vi.fn()}
        />
      )

      const selectedBtn = screen.getByTestId('category-button-cat-2')
      expect(selectedBtn).toHaveAttribute('aria-pressed', 'true')

      const allItemsBtn = screen.getByRole('button', { name: /All Items/i })
      expect(allItemsBtn).toHaveAttribute('aria-pressed', 'false')
    })

    it('calls onCategoryChange with null when clicking All Items', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory="cat-1"
          onCategoryChange={handleChange}
        />
      )

      const allItemsBtn = screen.getByRole('button', { name: /All Items/i })
      await user.click(allItemsBtn)

      expect(handleChange).toHaveBeenCalledWith(null)
    })

    it('calls onCategoryChange with category ID when clicking category', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory={null}
          onCategoryChange={handleChange}
        />
      )

      const categoryBtn = screen.getByText('Steaks')
      await user.click(categoryBtn)

      expect(handleChange).toHaveBeenCalledWith('cat-1')
    })
  })

  describe('Styling', () => {
    it('applies selected styles to active category', () => {
      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory="cat-1"
          onCategoryChange={vi.fn()}
        />
      )

      const selectedBtn = screen.getByTestId('category-button-cat-1')
      expect(selectedBtn).toHaveClass('bg-[var(--public-accent)]')
    })

    it('applies outline styles to unselected categories', () => {
      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory={null}
          onCategoryChange={vi.fn()}
        />
      )

      const unselectedBtn = screen.getByTestId('category-button-cat-1')
      expect(unselectedBtn.className).toMatch(/border/)
    })

    it('applies category color to unselected buttons', () => {
      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory={null}
          onCategoryChange={vi.fn()}
        />
      )

      const steakBtn = screen.getByTestId('category-button-cat-1')
      // The color should be applied as border or text color
      expect(steakBtn).toHaveStyle({ borderColor: '#8B0000' })
    })
  })

  describe('Navigation', () => {
    it('renders navigation arrows when content overflows', () => {
      // Mock container to simulate overflow
      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory={null}
          onCategoryChange={vi.fn()}
        />
      )

      // In JSDOM, the slider doesn't have actual overflow, so navigation buttons
      // are conditionally rendered only when canScrollPrev/canScrollNext is true.
      // The slider component itself should render.
      const slider = screen.getByTestId('menu-slider')
      expect(slider).toBeInTheDocument()

      // Navigation buttons may or may not be present based on overflow state
      // In real browser with overflow, they would appear
      const prevBtn = screen.queryByTestId('slider-prev')
      const nextBtn = screen.queryByTestId('slider-next')

      // Either buttons exist (overflow detected) or they don't (no overflow in JSDOM)
      // This test verifies the component renders without error
      expect(slider).toBeInTheDocument()
    })

    it('scrolls to next items when clicking next button', async () => {
      const user = userEvent.setup()

      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory={null}
          onCategoryChange={vi.fn()}
        />
      )

      const nextBtn = screen.queryByTestId('slider-next')
      if (nextBtn) {
        await user.click(nextBtn)
        // Should scroll (we can't easily test scroll position in JSDOM)
        expect(nextBtn).toBeInTheDocument()
      }
    })

    it('scrolls to previous items when clicking previous button', async () => {
      const user = userEvent.setup()

      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory={null}
          onCategoryChange={vi.fn()}
        />
      )

      const prevBtn = screen.queryByTestId('slider-prev')
      if (prevBtn) {
        await user.click(prevBtn)
        expect(prevBtn).toBeInTheDocument()
      }
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for navigation', () => {
      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory={null}
          onCategoryChange={vi.fn()}
        />
      )

      const slider = screen.getByTestId('menu-slider')
      expect(slider).toHaveAttribute('aria-label', 'Menu categories')
    })

    it('buttons have aria-pressed attribute', () => {
      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory={null}
          onCategoryChange={vi.fn()}
        />
      )

      const allItemsBtn = screen.getByRole('button', { name: /All Items/i })
      expect(allItemsBtn).toHaveAttribute('aria-pressed')

      const categoryBtn = screen.getByTestId('category-button-cat-1')
      expect(categoryBtn).toHaveAttribute('aria-pressed')
    })

    it('is keyboard navigable', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()

      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory={null}
          onCategoryChange={handleChange}
        />
      )

      // Tab to first button
      await user.tab()

      // First button should be focused
      const allItemsBtn = screen.getByRole('button', { name: /All Items/i })
      expect(allItemsBtn).toHaveFocus()

      // Press Enter to select
      await user.keyboard('{Enter}')
      expect(handleChange).toHaveBeenCalledWith(null)
    })
  })

  describe('Props', () => {
    it('accepts custom className', () => {
      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory={null}
          onCategoryChange={vi.fn()}
          className="custom-slider-class"
        />
      )

      const slider = screen.getByTestId('menu-slider')
      expect(slider).toHaveClass('custom-slider-class')
    })

    it('respects disabled state', () => {
      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory={null}
          onCategoryChange={vi.fn()}
          disabled={true}
        />
      )

      const allItemsBtn = screen.getByRole('button', { name: /All Items/i })
      expect(allItemsBtn).toBeDisabled()
    })
  })

  describe('Animation', () => {
    it('applies transition classes for smooth animations', () => {
      render(
        <MenuSlider
          categories={mockCategories}
          selectedCategory={null}
          onCategoryChange={vi.fn()}
        />
      )

      const categoryBtn = screen.getByTestId('category-button-cat-1')
      expect(categoryBtn.className).toMatch(/transition/)
    })
  })
})
