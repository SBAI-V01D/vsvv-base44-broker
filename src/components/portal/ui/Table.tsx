import React from 'react'

interface PortalTableProps {
  columns: PortalTableColumn[]
  rows: Record<string, unknown>[]
  striped?: boolean
  hoverable?: boolean
  style?: React.CSSProperties
  className?: string
  emptyMessage?: string
  sortColumn?: string
  onSort?: (col: string) => void
  footer?: React.ReactNode
}

interface PortalTableColumn {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode
}

/**
 * Portal Table wrapper with consistent headers, rows styling
 * Design tokens: border-collapse, header bg #f9fafb, zebra stripes
 */
export function PortalTable({
  columns,
  rows,
  striped = true,
  hoverable = true,
  style = {},
  className = '',
  emptyMessage = 'Keine Daten vorhanden',
}: PortalTableProps) {
  if (rows.length === 0) {
    return (
      <div
        className={`portal-table-empty ${className}`}
        style={{
          padding: '48px 32px',
          textAlign: 'center',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
        }}
      >
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={`portal-table-wrapper ${className}`} style={{ width: '100%' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'Inter, -apple-system, sans-serif',
          fontSize: '14px',
          ...style,
        }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: (col.align || 'left'),
                  padding: '12px 16px',
                  fontWeight: '700',
                  color: '#374151',
                  background: '#f9fafb',
                  borderBottom: '2px solid #e5e7eb',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  width: col.width,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: Record<string, unknown>, rowIndex: number) => (
            <tr
              key={rowIndex as number}
              style={{
                background:
                  striped && rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb',
                transition: 'background 0.15s ease',
                cursor: hoverable ? 'pointer' : 'default',
              }}
              onMouseEnter={(e) => {
                if (hoverable) {
                  ;(e.currentTarget as HTMLElement).style.background = '#eff6ff'
                }
              }}
              onMouseLeave={(e) => {
                if (hoverable) {
                  const bg =
                    striped && rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb'
                  ;(e.currentTarget as HTMLElement).style.background = bg
                }
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f3f4f6',
                    textAlign: (col.align || 'left'),
                    color: '#1a1a1a',
                    verticalAlign: 'middle',
                  }}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? '–')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PortalTable