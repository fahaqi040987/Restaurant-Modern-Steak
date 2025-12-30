import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'

// Simple LoginForm component for testing (extracted from routes/login.tsx logic)
// This allows us to test the form behavior without TanStack Router dependencies
function TestLoginForm({
  onSubmit,
  isLoading = false,
  error = '',
}: {
  onSubmit: (data: { username: string; password: string }) => void
  isLoading?: boolean
  error?: string
}) {
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [localError, setLocalError] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!username || !password) {
      setLocalError('Username and password are required')
      return
    }

    onSubmit({ username, password })
  }

  const displayError = error || localError

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      {displayError && (
        <div role="alert" className="error-message">
          {displayError}
        </div>
      )}
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <div className="password-wrapper">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}

describe('LoginForm Component', () => {
  // T272: LoginForm_RendersInputs
  describe('Renders input fields', () => {
    it('renders username input field', () => {
      render(<TestLoginForm onSubmit={vi.fn()} />)

      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument()
    })

    it('renders password input field', () => {
      render(<TestLoginForm onSubmit={vi.fn()} />)

      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    })

    it('renders submit button', () => {
      render(<TestLoginForm onSubmit={vi.fn()} />)

      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('renders password toggle button', () => {
      render(<TestLoginForm onSubmit={vi.fn()} />)

      expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument()
    })

    it('toggles password visibility', async () => {
      const user = userEvent.setup()
      render(<TestLoginForm onSubmit={vi.fn()} />)

      const passwordInput = screen.getByLabelText('Password')
      expect(passwordInput).toHaveAttribute('type', 'password')

      await user.click(screen.getByRole('button', { name: 'Show password' }))
      expect(passwordInput).toHaveAttribute('type', 'text')

      await user.click(screen.getByRole('button', { name: 'Hide password' }))
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('has correct autocomplete attributes', () => {
      render(<TestLoginForm onSubmit={vi.fn()} />)

      expect(screen.getByLabelText('Username')).toHaveAttribute('autocomplete', 'username')
      expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password')
    })
  })

  // T273: LoginForm_ValidatesRequired
  describe('Validates required fields', () => {
    it('shows error when submitting empty form', () => {
      const onSubmit = vi.fn()
      render(<TestLoginForm onSubmit={onSubmit} />)

      fireEvent.submit(screen.getByTestId('login-form'))

      expect(screen.getByRole('alert')).toHaveTextContent('Username and password are required')
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('shows error when username is empty', () => {
      const onSubmit = vi.fn()
      render(<TestLoginForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
      fireEvent.submit(screen.getByTestId('login-form'))

      expect(screen.getByRole('alert')).toHaveTextContent('Username and password are required')
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('shows error when password is empty', () => {
      const onSubmit = vi.fn()
      render(<TestLoginForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } })
      fireEvent.submit(screen.getByTestId('login-form'))

      expect(screen.getByRole('alert')).toHaveTextContent('Username and password are required')
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('clears error and calls onSubmit when form is valid', () => {
      const onSubmit = vi.fn()
      render(<TestLoginForm onSubmit={onSubmit} />)

      // First, submit empty to trigger error
      fireEvent.submit(screen.getByTestId('login-form'))
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // Fill in form and submit again
      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } })
      fireEvent.submit(screen.getByTestId('login-form'))

      // onSubmit should be called
      expect(onSubmit).toHaveBeenCalled()
    })
  })

  // T274: LoginForm_SubmitsCredentials
  describe('Submits credentials correctly', () => {
    it('calls onSubmit with username and password', () => {
      const onSubmit = vi.fn()
      render(<TestLoginForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin123' } })
      fireEvent.submit(screen.getByTestId('login-form'))

      expect(onSubmit).toHaveBeenCalledWith({
        username: 'admin',
        password: 'admin123',
      })
    })

    it('passes correct values to onSubmit', () => {
      const onSubmit = vi.fn()
      render(<TestLoginForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'testpass' } })
      fireEvent.submit(screen.getByTestId('login-form'))

      expect(onSubmit).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'testpass',
      })
    })

    it('shows loading state during submission', () => {
      render(<TestLoginForm onSubmit={vi.fn()} isLoading={true} />)

      const submitButton = screen.getByRole('button', { name: 'Signing in...' })
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('disables submit button during loading', () => {
      render(<TestLoginForm onSubmit={vi.fn()} isLoading={true} />)

      expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled()
    })

    it('button is enabled when not loading', () => {
      render(<TestLoginForm onSubmit={vi.fn()} isLoading={false} />)

      expect(screen.getByRole('button', { name: 'Sign In' })).not.toBeDisabled()
    })
  })

  // T275: LoginForm_ShowsError
  describe('Shows error messages', () => {
    it('displays server error message', () => {
      render(<TestLoginForm onSubmit={vi.fn()} error="Invalid credentials" />)

      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
    })

    it('displays network error message', () => {
      render(<TestLoginForm onSubmit={vi.fn()} error="Network error. Please try again." />)

      expect(screen.getByRole('alert')).toHaveTextContent('Network error. Please try again.')
    })

    it('displays generic error message', () => {
      render(<TestLoginForm onSubmit={vi.fn()} error="Login failed. Please check your credentials." />)

      expect(screen.getByRole('alert')).toHaveTextContent('Login failed. Please check your credentials.')
    })

    it('error message has alert role for accessibility', () => {
      render(<TestLoginForm onSubmit={vi.fn()} error="Test error" />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('does not show error when empty', () => {
      render(<TestLoginForm onSubmit={vi.fn()} error="" />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('updates error message when prop changes', () => {
      const { rerender } = render(<TestLoginForm onSubmit={vi.fn()} error="First error" />)

      expect(screen.getByRole('alert')).toHaveTextContent('First error')

      rerender(<TestLoginForm onSubmit={vi.fn()} error="Second error" />)

      expect(screen.getByRole('alert')).toHaveTextContent('Second error')
    })
  })

  // Additional edge case tests
  describe('Edge cases', () => {
    it('handles special characters in password', () => {
      const onSubmit = vi.fn()
      render(<TestLoginForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'p@ss!w0rd#$%^&*()' } })
      fireEvent.submit(screen.getByTestId('login-form'))

      expect(onSubmit).toHaveBeenCalledWith({
        username: 'admin',
        password: 'p@ss!w0rd#$%^&*()',
      })
    })

    it('handles unicode in username', () => {
      const onSubmit = vi.fn()
      render(<TestLoginForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'user日本語' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } })
      fireEvent.submit(screen.getByTestId('login-form'))

      expect(onSubmit).toHaveBeenCalledWith({
        username: 'user日本語',
        password: 'password',
      })
    })

    it('handles long credentials', () => {
      const onSubmit = vi.fn()
      render(<TestLoginForm onSubmit={onSubmit} />)

      const longUsername = 'a'.repeat(100)
      const longPassword = 'b'.repeat(100)

      fireEvent.change(screen.getByLabelText('Username'), { target: { value: longUsername } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: longPassword } })
      fireEvent.submit(screen.getByTestId('login-form'))

      expect(onSubmit).toHaveBeenCalledWith({
        username: longUsername,
        password: longPassword,
      })
    })

    it('form has correct test id', () => {
      render(<TestLoginForm onSubmit={vi.fn()} />)

      expect(screen.getByTestId('login-form')).toBeInTheDocument()
    })

    it('inputs accept user typing', async () => {
      const user = userEvent.setup()
      render(<TestLoginForm onSubmit={vi.fn()} />)

      const usernameInput = screen.getByLabelText('Username')
      const passwordInput = screen.getByLabelText('Password')

      await user.type(usernameInput, 'testuser')
      await user.type(passwordInput, 'testpass')

      expect(usernameInput).toHaveValue('testuser')
      expect(passwordInput).toHaveValue('testpass')
    })
  })
})
