/**
 * T031: Unit test for ReservationForm component
 * Tests: Form fields, validation, submission, loading states, error handling
 *
 * Note: This test is written TDD-style before ReservationForm component exists (T035).
 * Tests will fail until ReservationForm.tsx is implemented.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReservationForm } from '../ReservationForm'

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'reservation.fullName': 'Full Name',
        'reservation.emailAddress': 'Email Address',
        'reservation.phoneNumber': 'Phone Number',
        'reservation.numberOfGuests': 'Number of Guests',
        'reservation.date': 'Date',
        'reservation.time': 'Time',
        'reservation.specialRequests': 'Special Requests',
        'reservation.submitReservation': 'Submit Reservation',
        'reservation.namePlaceholder': 'Enter your name',
        'reservation.emailPlaceholder': 'Enter your email',
        'reservation.phonePlaceholder': 'Enter your phone',
        'reservation.partySizePlaceholder': 'Enter party size',
        'reservation.specialRequestsPlaceholder': 'Any special requests?',
        'reservation.requestReceived': 'Request Received',
        'reservation.thankYouMessage': 'Thank you for your reservation',
        'reservation.makeAnother': 'Make Another Reservation',
        'reservation.submitFailed': 'Submission failed',
      }
      return translations[key] || key
    },
  }),
}))

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

// Wrapper component for tests
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

// Mock API client
const mockCreateReservation = vi.fn()
vi.mock('@/api/client', () => ({
  apiClient: {
    createReservation: (...args: unknown[]) => mockCreateReservation(...args),
  },
}))

describe('ReservationForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the form container', () => {
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      const form = screen.getByTestId('reservation-form')
      expect(form).toBeInTheDocument()
    })

    it('renders customer name input', () => {
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      const input = screen.getByLabelText(/name/i)
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('name', 'customer_name')
    })

    it('renders email input', () => {
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      const input = screen.getByLabelText(/email/i)
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'email')
    })

    it('renders phone input', () => {
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      const input = screen.getByLabelText(/phone/i)
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('name', 'phone')
    })

    it('renders party size input', () => {
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      const input = screen.getByLabelText(/party size|guests|people/i)
      expect(input).toBeInTheDocument()
    })

    it('renders reservation date input', () => {
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      const input = screen.getByLabelText(/date/i)
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'date')
    })

    it('renders reservation time input', () => {
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      const input = screen.getByLabelText(/time/i)
      expect(input).toBeInTheDocument()
    })

    it('renders special requests textarea', () => {
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      const textarea = screen.getByLabelText(/special requests|notes/i)
      expect(textarea).toBeInTheDocument()
      expect(textarea.tagName).toBe('TEXTAREA')
    })

    it('renders submit button', () => {
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      const button = screen.getByRole('button', {
        name: /book|reserve|submit/i,
      })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('type', 'submit')
    })
  })

  describe('Validation', () => {
    it('shows error for empty customer name', async () => {
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      // Submit without filling form using fireEvent
      const form = screen.getByTestId('reservation-form')
      fireEvent.submit(form)

      // Should show validation error
      await waitFor(() => {
        const error = screen.getByTestId('error-customer_name')
        expect(error).toBeInTheDocument()
      })
    })

    it('shows error for invalid email format', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      // Fill with invalid email
      await user.type(screen.getByLabelText(/name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'invalid-email')
      await user.type(screen.getByLabelText(/phone/i), '+62812345678')

      // Submit using fireEvent
      const form = screen.getByTestId('reservation-form')
      fireEvent.submit(form)

      await waitFor(() => {
        const error = screen.getByTestId('error-email')
        expect(error).toBeInTheDocument()
        expect(error).toHaveTextContent(/valid email/i)
      })
    })

    it('shows error for invalid phone format', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText(/name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/phone/i), 'abc') // Invalid

      const form = screen.getByTestId('reservation-form')
      fireEvent.submit(form)

      await waitFor(() => {
        const error = screen.getByTestId('error-phone')
        expect(error).toBeInTheDocument()
      })
    })

    it('shows error for party size less than 1', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText(/name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/phone/i), '+62812345678')

      const partySizeInput = screen.getByLabelText(/party size|guests|people/i)
      await user.clear(partySizeInput)
      await user.type(partySizeInput, '0')

      const form = screen.getByTestId('reservation-form')
      fireEvent.submit(form)

      await waitFor(() => {
        const error = screen.getByTestId('error-party_size')
        expect(error).toBeInTheDocument()
      })
    })

    it('shows error for party size greater than 20', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText(/name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/phone/i), '+62812345678')

      const partySizeInput = screen.getByLabelText(/party size|guests|people/i)
      await user.clear(partySizeInput)
      await user.type(partySizeInput, '25')

      const form = screen.getByTestId('reservation-form')
      fireEvent.submit(form)

      await waitFor(() => {
        const error = screen.getByTestId('error-party_size')
        expect(error).toBeInTheDocument()
        expect(error).toHaveTextContent(/20|maximum/i)
      })
    })

    it('shows error for past reservation date', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText(/name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/phone/i), '+62812345678')

      const dateInput = screen.getByLabelText(/date/i)
      await user.type(dateInput, '2020-01-01') // Past date

      const form = screen.getByTestId('reservation-form')
      fireEvent.submit(form)

      await waitFor(() => {
        const error = screen.getByTestId('error-reservation_date')
        expect(error).toBeInTheDocument()
      })
    })

    it('validates special requests max length', () => {
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      // The textarea has maxLength attribute to enforce 500 char limit
      const textarea = screen.getByLabelText(/special requests|notes/i)
      expect(textarea).toHaveAttribute('maxLength', '500')
    })
  })

  describe('Submission', () => {
    // Note: Full form submission tests are covered by E2E tests (T030)
    // These unit tests verify individual behaviors

    it('disables submit button when disabled prop is true', () => {
      render(
        <TestWrapper>
          <ReservationForm disabled />
        </TestWrapper>
      )

      const submitBtn = screen.getByRole('button', {
        name: /book|reserve|submit/i,
      })
      expect(submitBtn).toBeDisabled()
    })

    it('shows error message on API failure', async () => {
      mockCreateReservation.mockRejectedValue(new Error('Server error'))

      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      // Fill and submit form
      await user.type(screen.getByLabelText(/name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.type(screen.getByLabelText(/phone/i), '+62812345678')
      const partySizeInput = screen.getByLabelText(/party size|guests|people/i)
      await user.clear(partySizeInput)
      await user.type(partySizeInput, '4')
      const dateInput = screen.getByLabelText(/date/i)
      await user.type(dateInput, '2025-01-15')
      const timeInput = screen.getByLabelText(/time/i)
      await user.type(timeInput, '19:00')

      const form = screen.getByTestId('reservation-form')
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('accepts onSuccess prop', () => {
      const onSuccess = vi.fn()
      render(
        <TestWrapper>
          <ReservationForm onSuccess={onSuccess} />
        </TestWrapper>
      )

      // Just verify the component accepts the prop without crashing
      const form = screen.getByTestId('reservation-form')
      expect(form).toBeInTheDocument()
    })

    it('accepts onError prop', () => {
      const onError = vi.fn()
      render(
        <TestWrapper>
          <ReservationForm onError={onError} />
        </TestWrapper>
      )

      // Just verify the component accepts the prop without crashing
      const form = screen.getByTestId('reservation-form')
      expect(form).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper form labels for all inputs', () => {
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      const inputs = ['name', 'email', 'phone', 'date', 'time']
      inputs.forEach((label) => {
        const input = screen.getByLabelText(new RegExp(label, 'i'))
        expect(input).toBeInTheDocument()
      })
    })

    it('has proper ARIA attributes on form', () => {
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      const form = screen.getByTestId('reservation-form')
      expect(form.tagName).toBe('FORM')
    })

    it('error messages have proper role', async () => {
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      // Submit empty form
      const form = screen.getByTestId('reservation-form')
      fireEvent.submit(form)

      await waitFor(() => {
        const errors = screen.getAllByRole('alert')
        expect(errors.length).toBeGreaterThan(0)
      })
    })

    it('inputs have proper aria-invalid when validation fails', async () => {
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      // Submit empty form
      const form = screen.getByTestId('reservation-form')
      fireEvent.submit(form)

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i)
        expect(nameInput).toHaveAttribute('aria-invalid', 'true')
      })
    })
  })

  describe('Props', () => {
    it('accepts custom className', () => {
      render(
        <TestWrapper>
          <ReservationForm className="custom-form-class" />
        </TestWrapper>
      )

      const form = screen.getByTestId('reservation-form')
      expect(form).toHaveClass('custom-form-class')
    })

    it('accepts default values', () => {
      render(
        <TestWrapper>
          <ReservationForm
            defaultValues={{
              customer_name: 'Jane Doe',
              email: 'jane@example.com',
            }}
          />
        </TestWrapper>
      )

      expect(screen.getByLabelText(/name/i)).toHaveValue('Jane Doe')
      expect(screen.getByLabelText(/email/i)).toHaveValue('jane@example.com')
    })

    it('accepts disabled prop', () => {
      render(
        <TestWrapper>
          <ReservationForm disabled />
        </TestWrapper>
      )

      const submitBtn = screen.getByRole('button', {
        name: /book|reserve|submit/i,
      })
      expect(submitBtn).toBeDisabled()
    })
  })

  describe('Styling', () => {
    it('applies public theme styles', () => {
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      const form = screen.getByTestId('reservation-form')
      // Should have public theme class or CSS variable usage
      expect(form.className).toMatch(/public|form/)
    })

    it('submit button has accent color', () => {
      render(
        <TestWrapper>
          <ReservationForm />
        </TestWrapper>
      )

      const submitBtn = screen.getByRole('button', {
        name: /book|reserve|submit/i,
      })
      expect(submitBtn).toHaveClass('bg-[var(--public-accent)]')
    })
  })
})
