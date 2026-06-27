import React, { useEffect, useRef } from 'react'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  style?: React.CSSProperties
  className?: string
}

/**
 * Modal/dialog component wrapper with overlay, backdrop, and close button
 * Design tokens: centered overlay with backdrop blur, white card content
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  style = {},
  className = '',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeStyles: Record<string, { width: string; maxWidth: string }> = {
    sm: { width: '400px', maxWidth: '90vw' },
    md: { width: '560px', maxWidth: '90vw' },
    lg: { width: '720px', maxWidth: '90vw' },
    xl: { width: '900px', maxWidth: '95vw' },
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: '9999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className={`portal-dialog ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'relative',
          background: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          maxWidth: '95vw',
          maxHeight: '85vh',
          overflow: 'auto',
          ...sizeStyles[size],
          ...style,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: '#1a1a1a',
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              border: 'none',
              background: 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#6b7280',
              fontSize: '20px',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6'
              e.currentTarget.style.color = '#374151'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#6b7280'
            }}
            aria-label="Schlie"
          >
            &times;
          </button>
        </div>

        <div style={{ padding: '24px' }}>{children}</div>

        {footer && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dialog