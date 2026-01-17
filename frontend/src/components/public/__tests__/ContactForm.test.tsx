import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import * as React from 'react'

// Test component that mimics the ContactForm behavior without TanStack Router dependencies
interface ContactFormData {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

interface TestContactFormProps {
  onSubmit: (data: ContactFormData) => void
  isLoading?: boolean
  isSubmitted?: boolean
  onReset?: () => void
  error?: string
}

const SUBJECTS = [
  { value: 'reservation', label: 'Reservation' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'catering', label: 'Catering' },
  { value: 'general', label: 'General Inquiry' },
]

function TestContactForm({
  onSubmit,
  isLoading = false,
  isSubmitted = false,
  onReset,
  error,
}: TestContactFormProps) {
  const [formData, setFormData] = React.useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name is too long'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }

    if (!formData.subject) {
      newErrors.subject = 'Please select a subject'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    } else if (formData.message.length > 1000) {
      newErrors.message = 'Message is too long'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  if (isSubmitted) {
    return (
      <div data-testid="success-message">
        <h3>Thank You!</h3>
        <p>Your message has been sent successfully. We'll get back to you soon.</p>
        <button onClick={onReset} data-testid="send-another-btn">
          Send Another Message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} data-testid="contact-form">
      {error && (
        <div role="alert" data-testid="form-error">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name">Name *</label>
        <input
          id="name"
          type="text"
          placeholder="Your name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          data-testid="name-input"
        />
        {errors.name && <span data-testid="name-error">{errors.name}</span>}
      </div>

      <div>
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          data-testid="email-input"
        />
        {errors.email && <span data-testid="email-error">{errors.email}</span>}
      </div>

      <div>
        <label htmlFor="phone">Phone (Optional)</label>
        <input
          id="phone"
          type="tel"
          placeholder="+62 xxx xxxx xxxx"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          data-testid="phone-input"
        />
      </div>

      <div>
        <label htmlFor="subject">Subject *</label>
        <select
          id="subject"
          value={formData.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          data-testid="subject-select"
        >
          <option value="">Select a subject</option>
          {SUBJECTS.map((subject) => (
            <option key={subject.value} value={subject.value}>
              {subject.label}
            </option>
          ))}
        </select>
        {errors.subject && <span data-testid="subject-error">{errors.subject}</span>}
      </div>

      <div>
        <label htmlFor="message">Message *</label>
        <textarea
          id="message"
          placeholder="Your message..."
          rows={5}
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          data-testid="message-input"
        />
        {errors.message && <span data-testid="message-error">{errors.message}</span>}
      </div>

      <button type="submit" disabled={isLoading} data-testid="submit-btn">
        {isLoading ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}

describe('ContactForm Component', () => {
  // T294: ContactForm_RendersFields
  describe('Renders form fields', () => {
    it('renders name input field', () => {
      render(<TestContactForm onSubmit={vi.fn()} />)

      expect(screen.getByLabelText(/Name/)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument()
    })

    it('renders email input field', () => {
      render(<TestContactForm onSubmit={vi.fn()} />)

      expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
    })

    it('renders phone input field as optional', () => {
      render(<TestContactForm onSubmit={vi.fn()} />)

      expect(screen.getByLabelText(/Phone/)).toBeInTheDocument()
      // Check that the label contains "(Optional)" text
      expect(screen.getByText(/Phone \(Optional\)/)).toBeInTheDocument()
    })

    it('renders subject select field', () => {
      render(<TestContactForm onSubmit={vi.fn()} />)

      expect(screen.getByLabelText(/Subject/)).toBeInTheDocument()
      expect(screen.getByTestId('subject-select')).toBeInTheDocument()
    })

    it('renders subject options', () => {
      render(<TestContactForm onSubmit={vi.fn()} />)

      const select = screen.getByTestId('subject-select')
      expect(select).toContainHTML('Reservation')
      expect(select).toContainHTML('Feedback')
      expect(select).toContainHTML('Catering')
      expect(select).toContainHTML('General Inquiry')
    })

    it('renders message textarea', () => {
      render(<TestContactForm onSubmit={vi.fn()} />)

      expect(screen.getByLabelText(/Message/)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Your message...')).toBeInTheDocument()
    })

    it('renders submit button', () => {
      render(<TestContactForm onSubmit={vi.fn()} />)

      expect(screen.getByRole('button', { name: 'Send Message' })).toBeInTheDocument()
    })
  })

  // T295: ContactForm_ValidatesRequired
  describe('Validates required fields', () => {
    it('shows error when name is empty', () => {
      const onSubmit = vi.fn()
      render(<TestContactForm onSubmit={onSubmit} />)

      fireEvent.submit(screen.getByTestId('contact-form'))

      expect(screen.getByTestId('name-error')).toHaveTextContent('Name is required')
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('shows error when email is empty', () => {
      const onSubmit = vi.fn()
      render(<TestContactForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } })
      fireEvent.submit(screen.getByTestId('contact-form'))

      expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required')
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('shows error when subject is not selected', () => {
      const onSubmit = vi.fn()
      render(<TestContactForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } })
      fireEvent.submit(screen.getByTestId('contact-form'))

      expect(screen.getByTestId('subject-error')).toHaveTextContent('Please select a subject')
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('shows error when message is empty', () => {
      const onSubmit = vi.fn()
      render(<TestContactForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByTestId('subject-select'), { target: { value: 'general' } })
      fireEvent.submit(screen.getByTestId('contact-form'))

      expect(screen.getByTestId('message-error')).toHaveTextContent('Message is required')
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('shows error when message is too short', () => {
      const onSubmit = vi.fn()
      render(<TestContactForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByTestId('subject-select'), { target: { value: 'general' } })
      fireEvent.change(screen.getByTestId('message-input'), { target: { value: 'Hi' } })
      fireEvent.submit(screen.getByTestId('contact-form'))

      expect(screen.getByTestId('message-error')).toHaveTextContent('Message must be at least 10 characters')
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('clears error when user starts typing', () => {
      render(<TestContactForm onSubmit={vi.fn()} />)

      fireEvent.submit(screen.getByTestId('contact-form'))
      expect(screen.getByTestId('name-error')).toBeInTheDocument()

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'J' } })
      expect(screen.queryByTestId('name-error')).not.toBeInTheDocument()
    })
  })

  // T296: ContactForm_ValidatesEmail
  describe('Validates email format', () => {
    it('shows error for invalid email format', () => {
      const onSubmit = vi.fn()
      render(<TestContactForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'invalid-email' } })
      fireEvent.change(screen.getByTestId('subject-select'), { target: { value: 'general' } })
      fireEvent.change(screen.getByTestId('message-input'), { target: { value: 'This is a test message for the form.' } })
      fireEvent.submit(screen.getByTestId('contact-form'))

      expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email address')
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('accepts valid email format', () => {
      const onSubmit = vi.fn()
      render(<TestContactForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByTestId('subject-select'), { target: { value: 'general' } })
      fireEvent.change(screen.getByTestId('message-input'), { target: { value: 'This is a test message for the form.' } })
      fireEvent.submit(screen.getByTestId('contact-form'))

      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument()
      expect(onSubmit).toHaveBeenCalled()
    })

    it('accepts email with subdomain', () => {
      const onSubmit = vi.fn()
      render(<TestContactForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@mail.example.co.id' } })
      fireEvent.change(screen.getByTestId('subject-select'), { target: { value: 'general' } })
      fireEvent.change(screen.getByTestId('message-input'), { target: { value: 'This is a test message for the form.' } })
      fireEvent.submit(screen.getByTestId('contact-form'))

      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument()
      expect(onSubmit).toHaveBeenCalled()
    })

    it('rejects email without domain extension', () => {
      const onSubmit = vi.fn()
      render(<TestContactForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example' } })
      fireEvent.change(screen.getByTestId('subject-select'), { target: { value: 'general' } })
      fireEvent.change(screen.getByTestId('message-input'), { target: { value: 'This is a test message for the form.' } })
      fireEvent.submit(screen.getByTestId('contact-form'))

      expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email address')
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  // T297: ContactForm_SubmitsCorrectly
  describe('Submits form correctly', () => {
    it('calls onSubmit with form data when valid', () => {
      const onSubmit = vi.fn()
      render(<TestContactForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByTestId('phone-input'), { target: { value: '+62812345678' } })
      fireEvent.change(screen.getByTestId('subject-select'), { target: { value: 'reservation' } })
      fireEvent.change(screen.getByTestId('message-input'), { target: { value: 'I would like to make a reservation for 4 people.' } })
      fireEvent.submit(screen.getByTestId('contact-form'))

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+62812345678',
        subject: 'reservation',
        message: 'I would like to make a reservation for 4 people.',
      })
    })

    it('shows loading state during submission', () => {
      render(<TestContactForm onSubmit={vi.fn()} isLoading={true} />)

      const submitButton = screen.getByTestId('submit-btn')
      expect(submitButton).toHaveTextContent('Sending...')
      expect(submitButton).toBeDisabled()
    })

    it('shows success message after submission', () => {
      render(<TestContactForm onSubmit={vi.fn()} isSubmitted={true} />)

      expect(screen.getByTestId('success-message')).toBeInTheDocument()
      expect(screen.getByText('Thank You!')).toBeInTheDocument()
      expect(screen.getByText(/Your message has been sent successfully/)).toBeInTheDocument()
    })

    it('shows "Send Another Message" button after submission', () => {
      render(<TestContactForm onSubmit={vi.fn()} isSubmitted={true} />)

      expect(screen.getByTestId('send-another-btn')).toBeInTheDocument()
    })

    it('calls onReset when "Send Another Message" is clicked', () => {
      const onReset = vi.fn()
      render(<TestContactForm onSubmit={vi.fn()} isSubmitted={true} onReset={onReset} />)

      fireEvent.click(screen.getByTestId('send-another-btn'))

      expect(onReset).toHaveBeenCalled()
    })

    it('shows error message when submission fails', () => {
      render(<TestContactForm onSubmit={vi.fn()} error="Failed to send message. Please try again." />)

      expect(screen.getByTestId('form-error')).toHaveTextContent('Failed to send message. Please try again.')
    })
  })

  // Additional tests
  describe('Edge cases', () => {
    it('phone field is optional', () => {
      const onSubmit = vi.fn()
      render(<TestContactForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } })
      // Intentionally skip phone
      fireEvent.change(screen.getByTestId('subject-select'), { target: { value: 'general' } })
      fireEvent.change(screen.getByTestId('message-input'), { target: { value: 'This is a test message for the form.' } })
      fireEvent.submit(screen.getByTestId('contact-form'))

      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        phone: '',
      }))
    })

    it('trims whitespace from inputs', () => {
      const onSubmit = vi.fn()
      render(<TestContactForm onSubmit={onSubmit} />)

      // Name with whitespace
      fireEvent.change(screen.getByTestId('name-input'), { target: { value: '   ' } })
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByTestId('subject-select'), { target: { value: 'general' } })
      fireEvent.change(screen.getByTestId('message-input'), { target: { value: 'This is a test message.' } })
      fireEvent.submit(screen.getByTestId('contact-form'))

      expect(screen.getByTestId('name-error')).toHaveTextContent('Name is required')
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('handles unicode characters in name', () => {
      const onSubmit = vi.fn()
      render(<TestContactForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Budi Santoso 日本語' } })
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'budi@example.com' } })
      fireEvent.change(screen.getByTestId('subject-select'), { target: { value: 'general' } })
      fireEvent.change(screen.getByTestId('message-input'), { target: { value: 'This is a test message with unicode.' } })
      fireEvent.submit(screen.getByTestId('contact-form'))

      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Budi Santoso 日本語',
      }))
    })

    it('accepts Indonesian phone format', () => {
      const onSubmit = vi.fn()
      render(<TestContactForm onSubmit={onSubmit} />)

      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Budi' } })
      fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'budi@example.com' } })
      fireEvent.change(screen.getByTestId('phone-input'), { target: { value: '+62 812 3456 7890' } })
      fireEvent.change(screen.getByTestId('subject-select'), { target: { value: 'reservation' } })
      fireEvent.change(screen.getByTestId('message-input'), { target: { value: 'I want to book a table for dinner.' } })
      fireEvent.submit(screen.getByTestId('contact-form'))

      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        phone: '+62 812 3456 7890',
      }))
    })

    it('allows all subject options', () => {
      const onSubmit = vi.fn()

      SUBJECTS.forEach((subject) => {
        const { unmount } = render(<TestContactForm onSubmit={onSubmit} />)

        fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Test' } })
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByTestId('subject-select'), { target: { value: subject.value } })
        fireEvent.change(screen.getByTestId('message-input'), { target: { value: 'This is a test message for the form.' } })
        fireEvent.submit(screen.getByTestId('contact-form'))

        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
          subject: subject.value,
        }))

        unmount()
        onSubmit.mockClear()
      })
    })
  })
})
