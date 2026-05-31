// File: frontend/src/routes/auth/google/callback.tsx
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { apiClient } from '@/api/client'
import '@/styles/public-theme.css'

export const Route = createFileRoute('/auth/google/callback')({
  component: GoogleCallbackPage,
})

type CallbackState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'pending'; user: { email: string; first_name: string; last_name: string } }
  | { status: 'success' }

function GoogleCallbackPage() {
  const router = useRouter()
  const [state, setState] = useState<CallbackState>({ status: 'loading' })

  useEffect(() => {
    const handleCallback = async () => {
      // Read query params from the current URL
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const stateParam = params.get('state')
      const error = params.get('error')

      // Handle user-denied consent
      if (error) {
        setState({ status: 'error', message: 'Google login was cancelled.' })
        setTimeout(() => router.navigate({ to: '/login' }), 2000)
        return
      }

      if (!code || !stateParam) {
        setState({ status: 'error', message: 'Invalid callback: missing code or state.' })
        setTimeout(() => router.navigate({ to: '/login' }), 2000)
        return
      }

      // CSRF state verification
      const savedState = sessionStorage.getItem('google_oauth_state')
      if (!savedState || savedState !== stateParam) {
        setState({ status: 'error', message: 'Security check failed (state mismatch). Please try again.' })
        sessionStorage.removeItem('google_oauth_state')
        setTimeout(() => router.navigate({ to: '/login' }), 2000)
        return
      }
      sessionStorage.removeItem('google_oauth_state')

      try {
        // Call backend to exchange code for user info
        const envApiUrl = import.meta.env.VITE_API_URL;
        // If VITE_API_URL already ends with /api/v1, don't append it again
        const apiBase = envApiUrl 
          ? (envApiUrl.endsWith('/api/v1') ? envApiUrl : `${envApiUrl}/api/v1`)
          : 'http://localhost:8080/api/v1';
          
        const response = await fetch(
          `${apiBase}/auth/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(stateParam)}`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        )

        const data = await response.json()

        if (!response.ok || !data.success) {
          // Handle specific error codes
          if (data.error === 'user_exists_link_required') {
            setState({
              status: 'error',
              message: 'An account with this email already exists. Please log in with your password and link Google in profile settings.',
            })
          } else if (data.error === 'user_rejected') {
            setState({ status: 'error', message: 'Your account was previously rejected. Please try again later.' })
          } else {
            setState({ status: 'error', message: data.message || 'Google login failed. Please try again.' })
          }
          setTimeout(() => router.navigate({ to: '/login' }), 4000)
          return
        }

        // Success path - check if approval is required
        if (data.data?.requiresApproval) {
          setState({ status: 'pending', user: data.data.user })
          return
        }

        // Full success - store token and redirect
        if (data.data?.token) {
          apiClient.setAuthToken(data.data.token)
          localStorage.setItem('pos_user', JSON.stringify(data.data.user))

          setState({ status: 'success' })

          // Redirect based on role
          const role = data.data.user?.role
          setTimeout(() => {
            switch (role) {
              case 'admin':
              case 'manager':
                router.navigate({ to: '/admin/dashboard' })
                break
              case 'kitchen':
                router.navigate({ to: '/kitchen' })
                break
              case 'server':
                router.navigate({ to: '/admin/server' })
                break
              case 'counter':
              case 'cashier':
                router.navigate({ to: '/admin/counter' })
                break
              default:
                router.navigate({ to: '/' })
            }
          }, 500)
        }
      } catch (err) {
        setState({
          status: 'error',
          message: 'Unable to connect to the server. Please try again.',
        })
        setTimeout(() => router.navigate({ to: '/login' }), 3000)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-[var(--public-bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {state.status === 'loading' && (
          <div className="bg-[var(--public-bg-elevated)] border border-[var(--public-border)] rounded-xl p-10 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[var(--public-border)] rounded-full" />
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-[var(--public-secondary)] border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
            <h2
              className="text-xl font-semibold text-[var(--public-text-primary)] mb-2"
              style={{ fontFamily: 'var(--public-font-heading)' }}
            >
              Signing you in...
            </h2>
            <p className="text-sm text-[var(--public-text-muted)]">
              Please wait while we complete your Google login.
            </p>
          </div>
        )}

        {state.status === 'success' && (
          <div className="bg-[var(--public-bg-elevated)] border border-green-500/30 rounded-xl p-10 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2
              className="text-xl font-semibold text-[var(--public-text-primary)] mb-2"
              style={{ fontFamily: 'var(--public-font-heading)' }}
            >
              Login Successful!
            </h2>
            <p className="text-sm text-[var(--public-text-muted)]">Redirecting you now...</p>
          </div>
        )}

        {state.status === 'pending' && (
          <div className="bg-[var(--public-bg-elevated)] border border-yellow-500/30 rounded-xl p-10 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2
              className="text-xl font-semibold text-[var(--public-text-primary)] mb-2"
              style={{ fontFamily: 'var(--public-font-heading)' }}
            >
              Account Pending Approval
            </h2>
            <p className="text-sm text-[var(--public-text-secondary)] mb-4">
              Hi <strong>{state.user.first_name}</strong>! Your account has been created and is waiting for admin approval.
            </p>
            <p className="text-xs text-[var(--public-text-muted)] mb-6">
              You'll receive an email at <strong>{state.user.email}</strong> once approved.
            </p>
            <button
              onClick={() => router.navigate({ to: '/login' })}
              className="w-full py-2 px-4 bg-[var(--public-secondary)] text-[var(--public-text-on-gold)] rounded-lg font-medium hover:bg-[var(--public-secondary-light)] transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}

        {state.status === 'error' && (
          <div className="bg-[var(--public-bg-elevated)] border border-red-500/30 rounded-xl p-10 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h2
              className="text-xl font-semibold text-[var(--public-text-primary)] mb-2"
              style={{ fontFamily: 'var(--public-font-heading)' }}
            >
              Login Failed
            </h2>
            <p className="text-sm text-[var(--public-text-secondary)] mb-6">{state.message}</p>
            <button
              onClick={() => router.navigate({ to: '/login' })}
              className="w-full py-2 px-4 bg-[var(--public-secondary)] text-[var(--public-text-on-gold)] rounded-lg font-medium hover:bg-[var(--public-secondary-light)] transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
