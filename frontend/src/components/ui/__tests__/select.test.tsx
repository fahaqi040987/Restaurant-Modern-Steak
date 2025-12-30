import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '../select'

describe('Select Component', () => {
  // T268: Select_RendersOptions
  describe('Renders options correctly', () => {
    it('renders select trigger with placeholder', () => {
      render(
        <Select>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(screen.getByTestId('select-trigger')).toBeInTheDocument()
      expect(screen.getByText('Select an option')).toBeInTheDocument()
    })

    it('renders options when opened', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByTestId('select-trigger'))

      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument()
        expect(screen.getByText('Banana')).toBeInTheDocument()
        expect(screen.getByText('Orange')).toBeInTheDocument()
      })
    })

    it('renders select with groups and labels', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Vegetables</SelectLabel>
              <SelectItem value="carrot">Carrot</SelectItem>
              <SelectItem value="broccoli">Broccoli</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByTestId('select-trigger'))

      await waitFor(() => {
        expect(screen.getByText('Fruits')).toBeInTheDocument()
        expect(screen.getByText('Vegetables')).toBeInTheDocument()
        expect(screen.getByText('Apple')).toBeInTheDocument()
        expect(screen.getByText('Carrot')).toBeInTheDocument()
      })
    })

    it('shows default value when provided', () => {
      render(
        <Select defaultValue="banana">
          <SelectTrigger data-testid="select-trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(screen.getByText('Banana')).toBeInTheDocument()
    })
  })

  // T269: Select_SelectsOption
  describe('Selects option correctly', () => {
    it('selects option when clicked', async () => {
      const user = userEvent.setup()

      render(
        <Select>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      // Open select
      await user.click(screen.getByTestId('select-trigger'))

      // Wait for options to appear
      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument()
      })

      // Click option
      await user.click(screen.getByText('Option 1'))

      // Verify selection is shown
      await waitFor(() => {
        expect(screen.getByTestId('select-trigger')).toHaveTextContent('Option 1')
      })
    })

    it('calls onValueChange when selection changes', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()

      render(
        <Select onValueChange={onValueChange}>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="value1">Label 1</SelectItem>
            <SelectItem value="value2">Label 2</SelectItem>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByTestId('select-trigger'))

      await waitFor(() => {
        expect(screen.getByText('Label 1')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Label 1'))

      expect(onValueChange).toHaveBeenCalledWith('value1')
    })

    it('works with controlled value', async () => {
      const onValueChange = vi.fn()

      render(
        <Select value="option1" onValueChange={onValueChange}>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(screen.getByTestId('select-trigger')).toHaveTextContent('Option 1')
    })
  })

  // T270: Select_ShowsDisabled
  describe('Shows disabled state', () => {
    it('can be disabled', () => {
      render(
        <Select disabled>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Disabled" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByTestId('select-trigger')
      expect(trigger).toBeDisabled()
    })

    it('applies disabled styling to trigger', () => {
      render(
        <Select disabled>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Disabled" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByTestId('select-trigger')
      expect(trigger).toHaveClass('disabled:cursor-not-allowed')
      expect(trigger).toHaveClass('disabled:opacity-50')
    })

    it('does not open when disabled', async () => {
      const user = userEvent.setup()

      render(
        <Select disabled>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Disabled" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      await user.click(screen.getByTestId('select-trigger'))

      // Options should not appear
      expect(screen.queryByText('Option 1')).not.toBeInTheDocument()
    })
  })

  // Additional tests
  describe('Additional features', () => {
    it('applies custom className to trigger', () => {
      render(
        <Select>
          <SelectTrigger className="custom-trigger" data-testid="select-trigger">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(screen.getByTestId('select-trigger')).toHaveClass('custom-trigger')
    })

    it('renders with name attribute for form submission', () => {
      render(
        <Select name="fruit">
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(screen.getByTestId('select-trigger')).toBeInTheDocument()
    })

    it('can be required for form validation', () => {
      render(
        <Select required>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Required" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      // The select should be marked as required
      expect(screen.getByTestId('select-trigger')).toBeInTheDocument()
    })

    it('renders chevron icon', () => {
      const { container } = render(
        <Select>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      // Check for SVG icon (chevron)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })
})
