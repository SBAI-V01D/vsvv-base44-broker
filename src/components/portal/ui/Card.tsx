import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

interface SectionProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  id?: string
}

/**
 * Reusable Card wrapper with consistent padding, border-radius, background
 * Design tokens: border-radius 8px, border 1px solid #e5e7eb, background #fff
 */
export function Card({ children, className = '', style = {} }: CardProps) {
  return (
    <div
      className={`card ${className}`}
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '24px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Reusable Section wrapper with consistent margin-bottom and borderBottom
 * Design tokens: margin-bottom 48px, borderBottom 1px solid #e5e7eb
 */
export function Section({ children, className = '', style = {}, id }: SectionProps) {
  return (
    <section
      id={id}
      className={`portal-section ${className}`}
      style={{
        marginBottom: '48px',
        paddingBottom: '36px',
        borderBottom: '1px solid #e5e7eb',
        ...style,
      }}
    >
      {children}
    </section>
  )
}

export default Card