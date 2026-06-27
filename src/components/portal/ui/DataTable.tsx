import React, { useState, useMemo, useCallback } from 'react'
import { PortalTable, PortalTableProps } from './Table'

interface DataTableProps {
  columns: PortalTableProps['columns']
  data: Record<string, unknown>[]
  filteredColumns?: Record<string, boolean>
  searchPlaceholder?: string
  striped?: boolean
  emptyMessage?: string
  noResultsMessage?: string
  showSearch?: boolean
}

/**
 * Data Table wrapper with search/filter functionality
 * Uses PortalTable internally, adds search bar and client-side filtering
 */
export function DataTable({
  columns,
  data,
  filteredColumns = columns.reduce(
    (acc, col) => ({ ...acc, [col.key]: true }),
    {} as Record<string, boolean>
  ),
  searchPlaceholder = 'Suchen...',
  striped = true,
  emptyMessage = 'Keine Daten vorhanden',
  noResultsMessage = 'Keine Ergebnisse',
  showSearch = true,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const activeColumns = useMemo(
    () => columns.filter((col) => filteredColumns[col.key]),
    [columns, filteredColumns]
  )

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data
    const term = searchTerm.toLowerCase()
    return data.filter((row) =>
      activeColumns.some((col) => {
        const val = row[col.key]
        if (val === null || val === undefined) return false
        return String(val).toLowerCase().includes(term)
      })
    )
  }, [searchTerm, data, activeColumns])

  const handleColumnVisibility = useCallback(
    (key: string) => {
      ;(window as unknown as { __setColumnFilter: (k: string, v: boolean) => void }).__setColumnFilter?.(
        key,
        !filteredColumns[key]
      )
    },
    [filteredColumns]
  )

  return (
    <div>
      {(showSearch || Object.keys(filteredColumns).length > columns.length) && (
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '16px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {showSearch && (
            <div
              style={{
                position: 'relative',
                flex: '1 1 300px',
                maxWidth: '400px',
              }}
            >
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  paddingRight: '36px',
                  fontSize: '14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none',
                  background: '#ffffff',
                  color: '#1a1a1a',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#1e40af'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  fontSize: '16px',
                  pointerEvents: 'none',
                }}
              >
                &#128269;
              </span>
            </div>
          )}
        </div>
      )}

      {filteredData.length === 0 && (
        <p
          style={{
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px',
            padding: '32px',
          }}
        >
          {searchTerm ? noResultsMessage : emptyMessage}
        </p>
      )}

      {filteredData.length > 0 && (
        <PortalTable
          columns={activeColumns}
          rows={filteredData}
          striped={striped}
          emptyMessage={emptyMessage}
        />
      )}
    </div>
  )
}

export default DataTable