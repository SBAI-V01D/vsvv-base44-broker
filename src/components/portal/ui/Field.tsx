import React from 'react'

interface FieldProps {
  label: string
  value: React.ReactNode
  fallback?: string
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

/**
 * Label/Value pair display with fallback '–'
 * Design tokens: label 11px uppercase, muted color; value 15px medium
 */
export function Field({ label, value, fallback = '–', className = '', style = {}, children }: FieldProps) {
  const displayValue = children

  return (
    <div className={`portal-field ${className}`} style={{ ...style }}>
      <p
        style={{
          fontSize: '11px',
          fontWeight: '700',
          margin: '0 0 6px',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: '15px',
          fontWeight: '500',
          margin: 0,
          color: '#1a1a1a',
          whiteSpace: 'pre-wrap',
        }}
      >
        {displayValue ?? (value ?? fallback)}
      </p>
    </div>
  )
}

export default Field