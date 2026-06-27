import React, { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary wrapper that catches rendering errors and displays
 * a fallback UI instead of crashing the whole portal.
 * Used to wrap every Portal page component.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
            textAlign: 'center',
            minHeight: '400px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              fontSize: '36px',
            }}
          >
            &#9888;
          </div>
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: '24px',
              fontWeight: '600',
              color: '#374151',
            }}
          >
            Ein Fehler ist aufgetreten
          </h2>
          <p
            style={{
              margin: '0 0 8px',
              fontSize: '14px',
              color: '#6b7280',
              maxWidth: '500px',
            }}
          >
            Diese Seite konnte nicht korrekt geladen werden.
          </p>
          <p
            style={{
              margin: '0 24px 24px',
              fontSize: '12px',
              color: '#9ca3af',
              fontFamily: 'monospace',
              textAlign: 'left',
              background: '#f9fafb',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              maxWidth: '500px',
              overflow: 'auto',
              maxHeight: '200px',
            }}
          >
            {this.state.error?.message ?? ''}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#ffffff',
              background: '#1e40af',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1d4ed8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1e40af'
            }}
          >
            Seite neu laden
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary