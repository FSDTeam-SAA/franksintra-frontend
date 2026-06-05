'use client'

import * as React from 'react'
import Image from 'next/image'
import { Eye, Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { AppHeader } from '@/components/gbp/AppHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  deleteJob,
  getApiErrorMessage,
  getJobsHistory,
  getPreferredJobImageUrl,
  type JobHistoryItem,
} from '@/lib/jobs'
import { toast } from 'sonner'

const PAGE_SIZE = 8

function formatJobDate(value: string) {
  return new Date(value).toLocaleString()
}

function getHistoryStatusLabel(status: JobHistoryItem['status']) {
  return status === 'DONE' ? 'Published' : 'Draft'
}

function getStatusBadgeClassName(status: JobHistoryItem['status']) {
  switch (status) {
    case 'DONE':
      return 'bg-emerald-100 text-emerald-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

export default function HistoryPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = React.useState(1)
  const [deleteTarget, setDeleteTarget] = React.useState<JobHistoryItem | null>(
    null,
  )

  const historyQuery = useQuery({
    queryKey: ['jobs-history', page],
    queryFn: () => getJobsHistory(page, PAGE_SIZE),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: async () => {
      toast.success('History item deleted')
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['jobs-history'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })

  const jobs = historyQuery.data?.jobs ?? []
  const paginationInfo = historyQuery.data?.paginationInfo
  const totalPages = paginationInfo?.totalPages ?? 1

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  React.useEffect(() => {
    if (historyQuery.isError) {
      toast.error(getApiErrorMessage(historyQuery.error))
    }
  }, [historyQuery.error, historyQuery.isError])

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const visiblePages = new Set<number>()
    visiblePages.add(1)
    visiblePages.add(totalPages)
    visiblePages.add(page)
    visiblePages.add(Math.max(1, page - 1))
    visiblePages.add(Math.min(totalPages, page + 1))

    const orderedPages = Array.from(visiblePages)
      .filter((value) => value >= 1 && value <= totalPages)
      .sort((left, right) => left - right)

    const items: React.ReactNode[] = []

    orderedPages.forEach((value, index) => {
      const previous = orderedPages[index - 1]
      if (index > 0 && value - previous > 1) {
        items.push(
          <PaginationItem key={`ellipsis-${previous}-${value}`}>
            <PaginationEllipsis />
          </PaginationItem>,
        )
      }

      items.push(
        <PaginationItem key={value}>
          <PaginationLink
            href="#"
            size="default"
            isActive={value === page}
            onClick={(event) => {
              event.preventDefault()
              setPage(value)
            }}
          >
            {value}
          </PaginationLink>
        </PaginationItem>,
      )
    })

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(event) => {
                event.preventDefault()
                setPage((current) => Math.max(1, current - 1))
              }}
              className={cn(page <= 1 && 'pointer-events-none opacity-50')}
            />
          </PaginationItem>
          {items}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(event) => {
                event.preventDefault()
                setPage((current) => Math.min(totalPages, current + 1))
              }}
              className={cn(page >= totalPages && 'pointer-events-none opacity-50')}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-[15px] text-slate-900 md:text-base">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 md:px-6 md:py-6">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg sm:text-xl">Recent Jobs</CardTitle>
            <CardDescription className="text-sm sm:text-[15px]">
              Each row includes the image, status, and quick actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-3 sm:p-4">
            {historyQuery.isLoading ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading history...
                </div>
              </div>
            ) : historyQuery.isError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                Failed to load job history.
              </div>
            ) : jobs.length ? (
              jobs.map((job) => (
                <div
                  key={job._id}
                  className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:p-4"
                >
                  <button
                    type="button"
                    onClick={() => router.push(`/?historyJobId=${job._id}`)}
                    className="group relative h-24 w-full shrink-0 overflow-hidden rounded-2xl border bg-slate-100 sm:h-20 sm:w-20"
                    aria-label={`Open ${job.originalFilename} in home`}
                  >
                    <Image
                      src={getPreferredJobImageUrl(job)}
                      alt={job.originalFilename}
                      fill
                      unoptimized
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-slate-900 sm:text-base">
                          {job.originalFilename}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          <span>{formatJobDate(job.createdAt)}</span>
                          <span>•</span>
                          <span>Updated {formatJobDate(job.updatedAt)}</span>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium',
                          getStatusBadgeClassName(job.status),
                        )}
                      >
                        {getHistoryStatusLabel(job.status)}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        ID: {job._id.slice(-8)}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl px-4"
                      onClick={() => router.push(`/?historyJobId=${job._id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Open
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="rounded-xl px-4"
                      onClick={() => setDeleteTarget(job)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending && deleteTarget?._id === job._id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                No backend history yet.
              </div>
            )}
          </CardContent>
        </Card>

        {renderPagination()}
      </main>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete history item?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `This will remove ${deleteTarget.originalFilename} and its backend record.`
                : 'This will remove the selected job.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!deleteTarget) return
                deleteMutation.mutate(deleteTarget._id)
              }}
              disabled={deleteMutation.isPending || !deleteTarget}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
