import React from 'react'

interface SkeletonProps {
  type?: 'text' | 'title' | 'heading' | 'avatar' | 'image' | 'card' | 'line' | 'circle' | 'dots'
  width?: string
  height?: string
  borderRadius?: string
  count?: number
  gap?: string
  style?: React.CSSProperties
  className?: string
}

/**
 * Loading state skeleton placeholder
 * Design tokens: shimmer animation, neutral gray background
 */
export function LoadingSkeleton({
  type = 'text',
  width = '100%',
  height,
  borderRadius = '4px',
  count = 1,
  gap = '8px',
  style = {},
  className = '',
}: SkeletonProps) {
  const skeletonBase: React.CSSProperties = {
    display: 'inline-block',
    background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
    backgroundSize: '200% 100%',
    animation: 'portal-shimmer 1.5s ease-in-out infinite',
    borderRadius,
    width,
  }

  if (count === 1 && type === 'dots') {
    return (
      <div className={`portal-skeleton portal-skeleton-dots ${className}`} style={style}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                ...skeletonBase,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (count === 1) {
    return (
      <div className={`portal-skeleton ${className}`} style={style}>
        <div
          style={{
            ...skeletonBase,
            height: height ?? undefined,
          }}
        />
      </div>
    )
  }

  return (
    <div className={`portal-skeleton ${className}`} style={{ ...style, display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            ...skeletonBase,
            height: height ?? undefined,
          }}
        />
      ))}
    </div>
  )
}

// Inject shimmer keyframes once via CSS injection
const styleEl = document.createElement('style')
styleEl.textContent = `
  @keyframes portal-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`
if (typeof document !== 'undefined' && !document.getElementById('portal-shimmer-style')) {
  styleEl.id = 'portal-shimmer-style'
  document.head.appendChild(styleEl)
}

export default LoadingSkeleton