'use client'

import * as React from 'react'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

type JobHistoryPaginationProps = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  compact?: boolean
}

export function JobHistoryPagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  className,
  compact = false,
}: JobHistoryPaginationProps) {
  if (totalPages <= 1) return null

  const visiblePages = new Set([
    1,
    totalPages,
    page,
    Math.max(1, page - 1),
    Math.min(totalPages, page + 1),
  ])
  const orderedPages = Array.from(visiblePages).sort((a, b) => a - b)

  const goToPage = (nextPage: number) => {
    onPageChange(Math.min(totalPages, Math.max(1, nextPage)))
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 sm:flex-row',
        className,
      )}
    >
      {!compact ? (
        <p className="text-sm text-slate-500">
          Showing{' '}
          <span className="font-medium text-slate-900">
            {(page - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-medium text-slate-900">
            {Math.min(page * pageSize, totalItems)}
          </span>{' '}
          of <span className="font-medium text-slate-900">{totalItems}</span>{' '}
          jobs
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          Page {page} of {totalPages}
        </p>
      )}

      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={page <= 1}
              onClick={(event) => {
                event.preventDefault()
                goToPage(page - 1)
              }}
              className={cn(page <= 1 && 'pointer-events-none opacity-50')}
            />
          </PaginationItem>

          {!compact &&
            orderedPages.map((value, index) => {
              const previous = orderedPages[index - 1]
              return (
                <React.Fragment key={value}>
                  {index > 0 && value - previous > 1 ? (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : null}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      size="default"
                      isActive={value === page}
                      aria-label={`Go to history page ${value}`}
                      onClick={(event) => {
                        event.preventDefault()
                        goToPage(value)
                      }}
                    >
                      {value}
                    </PaginationLink>
                  </PaginationItem>
                </React.Fragment>
              )
            })}

          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={page >= totalPages}
              onClick={(event) => {
                event.preventDefault()
                goToPage(page + 1)
              }}
              className={cn(
                page >= totalPages && 'pointer-events-none opacity-50',
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
