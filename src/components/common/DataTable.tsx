import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'

import { SkeletonTable } from '@/components/common/SkeletonTable'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface Column<T> {
  id: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number
  className?: string
  headerClassName?: string
  align?: 'left' | 'right' | 'center'
  width?: string
}

export interface SortState {
  id: string
  desc: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  getRowId: (row: T) => string
  isLoading?: boolean
  emptyState?: React.ReactNode
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  onRowClick?: (row: T) => void
  rowActions?: (row: T) => React.ReactNode
  defaultSort?: SortState
  toolbar?: React.ReactNode
  bulkActions?: (ids: string[], clear: () => void) => React.ReactNode
  mobileCard?: (row: T) => React.ReactNode
  skeletonRows?: number
  className?: string
}

const ALIGN_CLASSES = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const

export function DataTable<T>({
  data,
  columns,
  getRowId,
  isLoading = false,
  emptyState,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  onRowClick,
  rowActions,
  defaultSort,
  toolbar,
  bulkActions,
  mobileCard,
  skeletonRows = 6,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<SortState | null>(defaultSort ?? null)

  const sorted = React.useMemo(() => {
    if (!sort) return data
    const column = columns.find((c) => c.id === sort.id)
    if (!column?.sortValue) return data
    const getValue = column.sortValue
    return [...data].sort((a, b) => {
      const left = getValue(a)
      const right = getValue(b)
      if (left < right) return sort.desc ? 1 : -1
      if (left > right) return sort.desc ? -1 : 1
      return 0
    })
  }, [data, columns, sort])

  const allIds = React.useMemo(() => sorted.map(getRowId), [sorted, getRowId])
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id))
  const someSelected = selectedIds.length > 0 && !allSelected

  const toggleAll = () => {
    if (!onSelectionChange) return
    onSelectionChange(allSelected ? [] : allIds)
  }

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return
    onSelectionChange(
      selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id],
    )
  }

  const clearSelection = () => onSelectionChange?.([])

  const handleSort = (column: Column<T>) => {
    if (!column.sortValue) return
    setSort((current) => {
      if (!current || current.id !== column.id) return { id: column.id, desc: false }
      if (!current.desc) return { id: column.id, desc: true }
      return null
    })
  }

  return (
    <div className={cn('space-y-3', className)}>
      {toolbar}
      {bulkActions && selectedIds.length > 0 ? bulkActions(selectedIds, clearSelection) : null}

      {isLoading ? (
        <div className="rounded-2xl border bg-card">
          <SkeletonTable rows={skeletonRows} columns={Math.min(columns.length + (selectable ? 1 : 0), 6)} />
        </div>
      ) : sorted.length === 0 ? (
        emptyState
      ) : (
        <>
          {mobileCard ? (
            <div className="grid gap-3 md:hidden">
              {sorted.map((row) => (
                <div key={getRowId(row)}>{mobileCard(row)}</div>
              ))}
            </div>
          ) : null}

          <div
            className={cn(
              'overflow-hidden rounded-2xl border bg-card',
              mobileCard && 'hidden md:block',
            )}
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {selectable ? (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                        onCheckedChange={toggleAll}
                        aria-label="Select all rows"
                      />
                    </TableHead>
                  ) : null}
                  {columns.map((column) => (
                    <TableHead
                      key={column.id}
                      className={cn(
                        ALIGN_CLASSES[column.align ?? 'left'],
                        column.headerClassName,
                      )}
                      style={column.width ? { width: column.width } : undefined}
                    >
                      {column.sortValue ? (
                        <button
                          type="button"
                          onClick={() => handleSort(column)}
                          className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                        >
                          {column.header}
                          {sort?.id === column.id ? (
                            sort.desc ? (
                              <ArrowDown className="size-3" />
                            ) : (
                              <ArrowUp className="size-3" />
                            )
                          ) : (
                            <ChevronsUpDown className="size-3 opacity-50" />
                          )}
                        </button>
                      ) : (
                        column.header
                      )}
                    </TableHead>
                  ))}
                  {rowActions ? <TableHead className="w-12 text-right" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((row) => {
                  const id = getRowId(row)
                  const selected = selectedIds.includes(id)
                  return (
                    <TableRow
                      key={id}
                      data-state={selected ? 'selected' : undefined}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(onRowClick && 'cursor-pointer')}
                    >
                      {selectable ? (
                        <TableCell onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => toggleOne(id)}
                            aria-label="Select row"
                          />
                        </TableCell>
                      ) : null}
                      {columns.map((column) => (
                        <TableCell
                          key={column.id}
                          className={cn(ALIGN_CLASSES[column.align ?? 'left'], column.className)}
                        >
                          {column.cell(row)}
                        </TableCell>
                      ))}
                      {rowActions ? (
                        <TableCell
                          className="text-right"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {rowActions(row)}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
