import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PaymentMethodsSettings from '../PaymentMethodsSettings'
import { apiClient } from '@/api/client'
import { showSuccessToast, showErrorToast } from '@/lib/toast-helpers'
import type { PaymentMethodConfig } from '@/types'

// Mock i18n (t returns the key verbatim)
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en-US',
      changeLanguage: vi.fn(),
    },
  }),
}))

// Mock the API client (both default and named exports)
vi.mock('@/api/client', () => {
  const mockApi = {
    getAdminPaymentMethods: vi.fn(),
    updatePaymentMethod: vi.fn(),
  }
  return {
    default: mockApi,
    apiClient: mockApi,
  }
})

// Mock toast helpers
vi.mock('@/lib/toast-helpers', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}))

const mockMethods: PaymentMethodConfig[] = [
  {
    id: '1',
    code: 'cash',
    label: 'Cash',
    description: 'Pay with cash at the counter',
    is_active: true,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    code: 'qris',
    label: 'QRIS',
    description: 'Pay with QR code',
    is_active: false,
    provider: 'midtrans',
    api_endpoint: 'https://api.midtrans.com/v2',
    webhook_url: 'https://example.com/webhooks/payments',
    sort_order: 2,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('PaymentMethodsSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    ;(apiClient.getAdminPaymentMethods as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: mockMethods,
    })

    ;(apiClient.updatePaymentMethod as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: mockMethods[0],
    })
  })

  it('renders title and lists methods from mocked data', async () => {
    render(<PaymentMethodsSettings />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Cash')).toBeInTheDocument()
    })

    expect(screen.getByText('admin.paymentMethodsTitle')).toBeInTheDocument()
    expect(screen.getByText('QRIS')).toBeInTheDocument()
    expect(screen.getByText('admin.paymentMethodCode: cash')).toBeInTheDocument()
    expect(screen.getByText('admin.paymentMethodCode: qris')).toBeInTheDocument()
  })

  it('shows inactive method with inactive label and unchecked switch', async () => {
    render(<PaymentMethodsSettings />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('QRIS')).toBeInTheDocument()
    })

    expect(screen.getByText('common.inactive')).toBeInTheDocument()
    const qrisSwitch = screen.getByRole('switch', { name: 'QRIS' })
    expect(qrisSwitch).not.toBeChecked()
  })

  it('toggles switch and calls updatePaymentMethod with { is_active: true }', async () => {
    render(<PaymentMethodsSettings />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'QRIS' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('switch', { name: 'QRIS' }))

    await waitFor(() => {
      expect(apiClient.updatePaymentMethod).toHaveBeenCalledWith('2', { is_active: true })
    })

    await waitFor(() => {
      expect(showSuccessToast).toHaveBeenCalledWith('admin.paymentMethodUpdateSuccess')
    })
  })

  it('opens edit dialog and submits updated fields on Save', async () => {
    render(<PaymentMethodsSettings />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'common.edit' })).toHaveLength(2)
    })

    // QRIS is the second method (sorted by sort_order)
    fireEvent.click(screen.getAllByRole('button', { name: 'common.edit' })[1])

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('common.name'), {
      target: { value: 'QRIS Updated' },
    })
    fireEvent.change(screen.getByLabelText('admin.paymentMethodSortOrder'), {
      target: { value: '5' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'common.save' }))

    await waitFor(() => {
      expect(apiClient.updatePaymentMethod).toHaveBeenCalledWith(
        '2',
        expect.objectContaining({
          label: 'QRIS Updated',
          description: 'Pay with QR code',
          provider: 'midtrans',
          api_endpoint: 'https://api.midtrans.com/v2',
          webhook_url: 'https://example.com/webhooks/payments',
          sort_order: 5,
        }),
      )
    })

    await waitFor(() => {
      expect(showSuccessToast).toHaveBeenCalledWith('admin.paymentMethodUpdateSuccess')
    })
  })

  it('rejects invalid endpoint URL without submitting', async () => {
    render(<PaymentMethodsSettings />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'common.edit' })).toHaveLength(2)
    })

    fireEvent.click(screen.getAllByRole('button', { name: 'common.edit' })[1])

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('admin.paymentMethodApiEndpoint'), {
      target: { value: 'not-a-valid-url' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'common.save' }))

    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith('admin.paymentMethodUpdateError')
    })
    expect(apiClient.updatePaymentMethod).not.toHaveBeenCalled()
  })
})
