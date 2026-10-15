import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  className?: string
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const pages = buildPageList(page, pageCount)

  return (
    <div
      className={cn(
        'flex flex-col-reverse items-center justify-between gap-3 sm:flex-row',
        className,
      )}
    >
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          {start}–{end} of {total}
        </span>
        {onPageSizeChange ? (
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            aria-label="Rows per page"
            className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>
        {pages.map((entry, index) =>
          entry === '…' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={entry}
              variant={entry === page ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={() => onPageChange(entry)}
              aria-label={`Page ${entry}`}
              aria-current={entry === page ? 'page' : undefined}
            >
              {entry}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}

function buildPageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  const pages: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i += 1) pages.push(i)
  if (end < total - 1) pages.push('…')
  pages.push(total)
  return pages
}
