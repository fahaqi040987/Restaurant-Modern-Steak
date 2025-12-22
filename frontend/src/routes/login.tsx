import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { apiClient } from '@/api/client'
import type { LoginRequest, LoginResponse, APIResponse } from '@/types'
import '@/styles/public-theme.css'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginRequest>({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')

  // Check if already authenticated and redirect
  useEffect(() => {
    if (apiClient.isAuthenticated()) {
      const storedUser = localStorage.getItem('pos_user')
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser)
          redirectByRole(user.role)
        } catch {
          // Invalid stored user, stay on login page
        }
      }
    }
  }, [])

  const redirectByRole = (role: string) => {
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
  }

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response: APIResponse<LoginResponse> = await apiClient.login(credentials)
      return response
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        apiClient.setAuthToken(data.data.token)
        localStorage.setItem('pos_user', JSON.stringify(data.data.user))

        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('pos_remember_user', formData.username)
        } else {
          localStorage.removeItem('pos_remember_user')
        }

        // Redirect based on role
        setTimeout(() => {
          redirectByRole(data.data!.user.role)
        }, 100)
      } else {
        setError(data.message || 'Login failed. Please check your credentials.')
      }
    },
    onError: (error: any) => {
      setError(error.message || 'Login failed. Please try again.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.username || !formData.password) {
      setError('Username and password are required')
      return
    }

    loginMutation.mutate(formData)
  }

  // Load remembered username on mount
  useEffect(() => {
    const rememberedUser = localStorage.getItem('pos_remember_user')
    if (rememberedUser) {
      setFormData((prev) => ({ ...prev, username: rememberedUser }))
      setRememberMe(true)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[var(--public-bg-primary)] flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a574' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <Card className="w-full max-w-md relative bg-[var(--public-bg-elevated)] border-[var(--public-border)]">
        <CardHeader className="text-center pb-2">
          {/* Logo */}
          <div className="mb-4">
            <h1
              className="text-3xl font-bold text-[var(--public-text-primary)]"
              style={{ fontFamily: 'var(--public-font-heading)' }}
            >
              Modern<span className="text-[var(--public-secondary)]">Steak</span>
            </h1>
          </div>
          <CardTitle className="text-xl text-[var(--public-text-primary)]">
            Staff Portal
          </CardTitle>
          <CardDescription className="text-[var(--public-text-secondary)]">
            Enter your credentials to access the POS system
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[var(--public-text-primary)]">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="bg-[var(--public-bg-primary)] border-[var(--public-border)] text-[var(--public-text-primary)] placeholder:text-[var(--public-text-muted)] focus:border-[var(--public-secondary)] focus:ring-[var(--public-secondary)]"
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--public-text-primary)]">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-[var(--public-bg-primary)] border-[var(--public-border)] text-[var(--public-text-primary)] placeholder:text-[var(--public-text-muted)] focus:border-[var(--public-secondary)] focus:ring-[var(--public-secondary)] pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--public-text-muted)] hover:text-[var(--public-text-primary)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-[var(--public-border)] data-[state=checked]:bg-[var(--public-secondary)] data-[state=checked]:border-[var(--public-secondary)]"
              />
              <Label
                htmlFor="remember"
                className="text-sm text-[var(--public-text-secondary)] cursor-pointer"
              >
                Remember my username
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-[var(--public-secondary)] text-[var(--public-text-on-gold)] hover:bg-[var(--public-secondary-light)] font-semibold"
            >
              {loginMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Back to website link */}
          <div className="mt-6 text-center">
            <a
              href="/public"
              className="text-sm text-[var(--public-text-muted)] hover:text-[var(--public-secondary)] transition-colors"
            >
              ← Back to Website
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
