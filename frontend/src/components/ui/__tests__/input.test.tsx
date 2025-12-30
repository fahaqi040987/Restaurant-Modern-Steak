import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../input'
import { createRef } from 'react'

describe('Input Component', () => {
  // T264: Input_AcceptsValue
  describe('Accepts value input', () => {
    it('renders input with placeholder', () => {
      render(<Input placeholder="Enter your name" />)
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument()
    })

    it('accepts user input', async () => {
      const user = userEvent.setup()
      render(<Input placeholder="Type here" />)

      const input = screen.getByPlaceholderText('Type here')
      await user.type(input, 'Hello World')

      expect(input).toHaveValue('Hello World')
    })

    it('handles controlled value', async () => {
      const onChange = vi.fn()
      render(<Input value="initial" onChange={onChange} />)

      const input = screen.getByDisplayValue('initial')
      expect(input).toBeInTheDocument()
    })

    it('calls onChange when value changes', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Input onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'test')

      expect(onChange).toHaveBeenCalled()
    })

    it('handles different input types', () => {
      const { rerender } = render(<Input type="text" data-testid="input" />)
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'text')

      rerender(<Input type="email" data-testid="input" />)
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'email')

      rerender(<Input type="password" data-testid="input" />)
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'password')

      rerender(<Input type="number" data-testid="input" />)
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'number')
    })

    it('handles number input correctly', async () => {
      const user = userEvent.setup()
      render(<Input type="number" data-testid="number-input" />)

      const input = screen.getByTestId('number-input')
      await user.type(input, '12345')

      expect(input).toHaveValue(12345)
    })

    it('handles file input type', () => {
      render(<Input type="file" data-testid="file-input" />)
      const input = screen.getByTestId('file-input')
      expect(input).toHaveAttribute('type', 'file')
    })
  })

  // T265: Input_ShowsError
  describe('Shows error state', () => {
    it('applies error styling with aria-invalid', () => {
      render(<Input aria-invalid="true" data-testid="error-input" />)
      const input = screen.getByTestId('error-input')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('associates with error message via aria-describedby', () => {
      render(
        <>
          <Input aria-describedby="error-message" data-testid="input" />
          <span id="error-message">This field is required</span>
        </>
      )

      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('aria-describedby', 'error-message')
      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('can have custom error className', () => {
      render(
        <Input
          className="border-red-500 focus:ring-red-500"
          data-testid="error-input"
        />
      )

      const input = screen.getByTestId('error-input')
      expect(input).toHaveClass('border-red-500')
      expect(input).toHaveClass('focus:ring-red-500')
    })

    it('supports required attribute for form validation', () => {
      render(<Input required data-testid="required-input" />)
      const input = screen.getByTestId('required-input')
      expect(input).toBeRequired()
    })

    it('supports pattern attribute for validation', () => {
      render(<Input pattern="[A-Za-z]+" data-testid="pattern-input" />)
      const input = screen.getByTestId('pattern-input')
      expect(input).toHaveAttribute('pattern', '[A-Za-z]+')
    })
  })

  // T266: Input_ShowsDisabled
  describe('Shows disabled state', () => {
    it('can be disabled', () => {
      render(<Input disabled data-testid="disabled-input" />)
      const input = screen.getByTestId('disabled-input')
      expect(input).toBeDisabled()
    })

    it('applies disabled styling', () => {
      render(<Input disabled data-testid="disabled-input" />)
      const input = screen.getByTestId('disabled-input')
      expect(input).toHaveClass('disabled:cursor-not-allowed')
      expect(input).toHaveClass('disabled:opacity-50')
    })

    it('prevents user interaction when disabled', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Input disabled onChange={onChange} data-testid="disabled-input" />)

      const input = screen.getByTestId('disabled-input')
      await user.type(input, 'test')

      expect(onChange).not.toHaveBeenCalled()
      expect(input).toHaveValue('')
    })

    it('does not receive focus when disabled', async () => {
      const user = userEvent.setup()
      render(
        <>
          <Input data-testid="enabled-input" />
          <Input disabled data-testid="disabled-input" />
        </>
      )

      const enabledInput = screen.getByTestId('enabled-input')
      const disabledInput = screen.getByTestId('disabled-input')

      await user.click(disabledInput)
      expect(disabledInput).not.toHaveFocus()

      await user.click(enabledInput)
      expect(enabledInput).toHaveFocus()
    })
  })

  // Additional tests
  describe('Additional features', () => {
    it('forwards ref correctly', () => {
      const ref = createRef<HTMLInputElement>()
      render(<Input ref={ref} data-testid="ref-input" />)

      expect(ref.current).toBeInstanceOf(HTMLInputElement)
      expect(ref.current).toBe(screen.getByTestId('ref-input'))
    })

    it('applies custom className', () => {
      render(<Input className="custom-class" data-testid="custom-input" />)
      const input = screen.getByTestId('custom-input')
      expect(input).toHaveClass('custom-class')
    })

    it('merges custom className with default styles', () => {
      render(<Input className="my-class" data-testid="merged-input" />)
      const input = screen.getByTestId('merged-input')
      // Should have both default and custom classes
      expect(input).toHaveClass('my-class')
      expect(input).toHaveClass('flex')
      expect(input).toHaveClass('h-10')
    })

    it('passes through additional HTML attributes', () => {
      render(
        <Input
          data-testid="attr-input"
          name="username"
          autoComplete="username"
          maxLength={50}
          minLength={3}
        />
      )

      const input = screen.getByTestId('attr-input')
      expect(input).toHaveAttribute('name', 'username')
      expect(input).toHaveAttribute('autocomplete', 'username')
      expect(input).toHaveAttribute('maxlength', '50')
      expect(input).toHaveAttribute('minlength', '3')
    })

    it('handles focus events', async () => {
      const user = userEvent.setup()
      const onFocus = vi.fn()
      const onBlur = vi.fn()
      render(<Input onFocus={onFocus} onBlur={onBlur} data-testid="focus-input" />)

      const input = screen.getByTestId('focus-input')

      await user.click(input)
      expect(onFocus).toHaveBeenCalled()

      await user.tab()
      expect(onBlur).toHaveBeenCalled()
    })

    it('handles keyboard events', async () => {
      const user = userEvent.setup()
      const onKeyDown = vi.fn()
      const onKeyUp = vi.fn()
      render(
        <Input onKeyDown={onKeyDown} onKeyUp={onKeyUp} data-testid="key-input" />
      )

      const input = screen.getByTestId('key-input')
      await user.click(input)
      await user.keyboard('{Enter}')

      expect(onKeyDown).toHaveBeenCalled()
      expect(onKeyUp).toHaveBeenCalled()
    })

    it('has correct displayName', () => {
      expect(Input.displayName).toBe('Input')
    })

    it('supports readOnly attribute', async () => {
      const user = userEvent.setup()
      render(<Input readOnly value="read only value" data-testid="readonly-input" />)

      const input = screen.getByTestId('readonly-input')
      expect(input).toHaveAttribute('readonly')
      expect(input).toHaveValue('read only value')

      await user.type(input, 'new text')
      expect(input).toHaveValue('read only value')
    })

    it('supports autoFocus', () => {
      render(<Input autoFocus data-testid="autofocus-input" />)
      const input = screen.getByTestId('autofocus-input')
      expect(input).toHaveFocus()
    })
  })
})
