import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches React errors in the component tree and displays a fallback UI.
 * Prevents the entire app from crashing due to JavaScript errors.
 * 
 * Features:
 * - Catches errors during rendering, lifecycle methods, and constructors
 * - Displays user-friendly error message in Indonesian
 * - Reset button to clear error state and retry
 * - Logs error details to console for debugging
 * 
 * Usage:
 * Wrap your app or specific components with ErrorBoundary:
 * 
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    // Clear error state and retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided by parent
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-900">
                Terjadi Kesalahan
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi administrator jika masalah berlanjut.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error details (only show in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-mono text-gray-700 mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <details className="text-xs font-mono text-gray-600">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={this.handleReset}
                  className="w-full"
                  size="lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                  size="lg"
                >
                  Kembali ke Beranda
                </Button>
              </div>

              {/* Support information */}
              <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-200">
                <p>Jika masalah berlanjut, silakan hubungi tim dukungan kami.</p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="mt-1 text-blue-600">
                    Mode Pengembangan: Error details ditampilkan di atas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

/**
 * Hook-friendly error boundary wrapper
 * Use this in functional components that need error boundary protection
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
