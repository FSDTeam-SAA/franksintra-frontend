'use client'

import * as React from 'react'
import Image from 'next/image'
import { Eye, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { AppHeader } from '@/components/gbp/AppHeader'
import { JobHistoryPagination } from '@/components/gbp/JobHistoryPagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
import { cn } from '@/lib/utils'
import {
  deleteJob,
  getApiErrorMessage,
  getJobDisplayName,
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

function HistoryRowsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:p-4"
        >
          <Skeleton className="h-24 w-full rounded-2xl sm:h-20 sm:w-20" />
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-5 w-3/5 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-36 rounded-full" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex gap-2 sm:flex-col">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function HistoryPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const accessToken = session?.accessToken ?? ''
  const [page, setPage] = React.useState(1)
  const [deleteTarget, setDeleteTarget] = React.useState<JobHistoryItem | null>(
    null,
  )

  const historyQuery = useQuery({
    queryKey: ['jobs-history', page, accessToken],
    queryFn: () => getJobsHistory(accessToken, page, PAGE_SIZE),
    enabled: Boolean(accessToken),
    placeholderData: previousData => previousData,
  })

  const deleteMutation = useMutation({
    mutationFn: (jobId: string) => deleteJob(accessToken, jobId),
    onSuccess: async () => {
      toast.success('History item deleted')
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['jobs-history'] })
    },
    onError: error => {
      toast.error(getApiErrorMessage(error))
    },
  })

  const jobs = historyQuery.data?.jobs ?? []
  const paginationInfo = historyQuery.data?.paginationInfo
  const totalPages = Math.max(1, paginationInfo?.totalPages ?? 1)

  React.useEffect(() => {
    if (paginationInfo && page > totalPages) {
      setPage(totalPages)
    }
  }, [page, paginationInfo, totalPages])

  React.useEffect(() => {
    if (historyQuery.isError) {
      toast.error(getApiErrorMessage(historyQuery.error))
    }
  }, [historyQuery.error, historyQuery.isError])

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
              <HistoryRowsSkeleton />
            ) : historyQuery.isError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                Failed to load job history.
              </div>
            ) : jobs.length ? (
              jobs.map(job => (
                <div
                  key={job._id}
                  className="group/row grid grid-cols-1 gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg sm:grid-cols-[80px_1fr_120px_auto] sm:items-center sm:gap-6"
                >
                  <button
                    type="button"
                    onClick={() => router.push(`/?historyJobId=${job._id}`)}
                    className="group relative h-40 w-full shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:h-20 sm:w-20"
                    aria-label={`Open ${getJobDisplayName(job)} in home`}
                  >
                    <Image
                      src={getPreferredJobImageUrl(job)}
                      alt={job.originalFilename}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
                  </button>

                  <div className="min-w-0 space-y-1.5">
                    <p className="truncate text-base font-semibold text-slate-900 transition-colors duration-200 group-hover/row:text-blue-600">
                      {getJobDisplayName(job)}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 sm:text-sm">
                      <span>{formatJobDate(job.createdAt)}</span>
                      <span className="hidden text-slate-300 sm:inline">•</span>
                      <span>Updated {formatJobDate(job.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-medium tracking-wide">
                        ID: {job._id.slice(-8)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center sm:justify-center">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium tracking-wide shadow-sm',
                        getStatusBadgeClassName(job.status),
                      )}
                    >
                      {getHistoryStatusLabel(job.status)}
                    </Badge>
                  </div>

                  <div className="flex shrink-0 flex-row gap-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-xl px-4 transition-colors hover:bg-blue-50 hover:text-blue-700 sm:flex-initial"
                      onClick={() => router.push(`/?historyJobId=${job._id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Open
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="flex-1 rounded-xl px-4 sm:flex-initial"
                      onClick={() => setDeleteTarget(job)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending &&
                      deleteTarget?._id === job._id ? (
                        <Skeleton className="mr-2 h-4 w-4 rounded-full bg-white/40" />
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

        <JobHistoryPagination
          className="mt-8"
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={paginationInfo?.totalData ?? 0}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </main>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete history item?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `This will remove ${getJobDisplayName(deleteTarget)} and its backend record.`
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
                <Skeleton className="mr-2 h-4 w-4 rounded-full bg-white/40" />
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
