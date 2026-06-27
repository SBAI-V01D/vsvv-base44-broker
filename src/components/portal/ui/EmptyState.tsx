import React from 'react'

interface EmptyStateProps {
  message: string
  subMessage?: string
  actionLabel?: string
  onAction?: () => void
  style?: React.CSSProperties
  className?: string
}

/**
 * Empty state placeholder with message, optional subMessage, and action button
 */
export function EmptyState({
  message,
  subMessage,
  actionLabel,
  onAction,
  style = {},
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`portal-empty-state ${className}`} style={{ ...style }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            fontSize: '28px',
            color: '#9ca3af',
          }}
        >
          &#128196;
        </div>
        <p
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151',
            margin: '0 0 8px',
          }}
        >
          {message}
        </p>
        {subMessage && (
          <p
            style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0 0 24px',
              maxWidth: '400px',
            }}
          >
            {subMessage}
          </p>
        )}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#ffffff',
              background: '#1e40af',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1d4ed8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1e40af'
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

export default EmptyState