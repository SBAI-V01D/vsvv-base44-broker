import React from 'react'

interface BadgeProps {
  text: string
  color?: BadgeColorType
  size?: BadgeSizeType
  style?: React.CSSProperties
}

export type BadgeColorType = 'blue' | 'orange' | 'green' | 'gray' | 'red'
export type BadgeSizeType = 'sm' | 'md' | 'lg'

const styles = {
  blue: {
    background: '#eff6ff',
    color: '#1d4ed8',
    border: '1px solid #bfdbfe',
  },
  orange: {
    background: '#fff7ed',
    color: '#c2410c',
    border: '1px solid #fed7aa',
  },
  green: {
    background: '#f0fdf4',
    color: '#15803d',
    border: '1px solid #bbf7d0',
  },
  gray: {
    background: '#f9fafb',
    color: '#4b5563',
    border: '1px solid #e5e7eb',
  },
  red: {
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
  },
} as const

const sizeStyles = {
  sm: { fontSize: '11px', padding: '2px 8px' },
  md: { fontSize: '12px', padding: '4px 10px' },
  lg: { fontSize: '14px', padding: '6px 14px' },
} as const

/**
 * Status badge component
 * Design tokens: small rounded pills with semantic colors
 */
export function Badge({ text, color = 'gray', size = 'md', style = {} }: BadgeProps) {
  const colorStyle = styles[color as keyof typeof styles] || styles.gray
  const sizeStyle = sizeStyles[size as keyof typeof sizeStyles] || sizeStyles.md

  return (
    <span
      style={{
        display: 'inline-block',
        ...colorStyle,
        ...sizeStyle,
        borderRadius: '9999px',
        fontWeight: '600',
        fontFamily: 'Inter, -apple-system, sans-serif',
        letterSpacing: '0.3px',
        ...style,
      }}
    >
      {text}
    </span>
  )
}

export default Badge