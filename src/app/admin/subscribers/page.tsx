'use client'

import * as React from 'react'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { AdminShell } from '@/components/admin/AdminShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  cancelSubscriber,
  getSubscribers,
  type Plan,
  type Subscriber,
} from '@/lib/subscriptions'
import { getApiErrorMessage } from '@/lib/jobs'

function formatDate(value?: string | null) {
  if (!value) return 'No expiry'
  return new Date(value).toLocaleDateString()
}

function getPlanName(plan?: Plan | string | null) {
  if (!plan) return 'Unknown plan'
  return typeof plan === 'string' ? 'Plan assigned' : plan.planName
}

function SubscribersTableSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-3 border-b border-slate-100 py-3 last:border-0 md:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.7fr]"
        >
          <Skeleton className="h-8 rounded-xl" />
          <Skeleton className="h-8 rounded-xl" />
          <Skeleton className="h-8 rounded-xl" />
          <Skeleton className="h-8 rounded-xl" />
          <Skeleton className="h-8 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export default function AdminSubscribersPage() {
  const { data: session } = useSession()
  const accessToken = session?.accessToken ?? ''
  const queryClient = useQueryClient()
  const [viewSubscriber, setViewSubscriber] = React.useState<Subscriber | null>(null)
  const [manageSubscriber, setManageSubscriber] = React.useState<Subscriber | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Subscriber | null>(null)

  const subscribersQuery = useQuery({
    queryKey: ['admin-subscribers', accessToken],
    queryFn: () => getSubscribers(accessToken, 1, 100),
    enabled: Boolean(accessToken),
  })

  const cancelMutation = useMutation({
    mutationFn: (userId: string) => cancelSubscriber(accessToken, userId),
    onSuccess: async () => {
      toast.success('Subscription cancelled')
      setManageSubscriber(null)
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
    },
    onError: error => toast.error(getApiErrorMessage(error)),
  })

  const subscribers = subscribersQuery.data?.subscriptions ?? []

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Billing
          </p>
          <h1 className="mt-2 text-[2.1rem] font-semibold leading-tight text-slate-950 sm:text-4xl">
            Subscribers
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage users with active subscription access.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Active subscribers
          </p>
          <p className="text-[1.85rem] font-semibold leading-none text-slate-950">
            {subscribers.length}
          </p>
        </div>
      </div>

      {subscribersQuery.isLoading ? (
        <SubscribersTableSkeleton />
      ) : subscribers.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-4">Subscriber</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map(user => (
                <TableRow key={user._id}>
                  <TableCell className="px-4">
                    <div>
                      <p className="font-semibold text-slate-950">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {getPlanName(user.subscription?.planId)}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {formatDate(user.subscriptionExpireDate)}
                  </TableCell>
                  <TableCell>
                    <Badge className="rounded-full bg-emerald-100 text-emerald-700">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-lg"
                        onClick={() => setViewSubscriber(user)}
                        aria-label={`View ${user.name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-lg"
                        onClick={() => setManageSubscriber(user)}
                        aria-label={`Edit ${user.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => setDeleteTarget(user)}
                        aria-label={`Delete ${user.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          No active subscribers yet.
        </div>
      )}

      <Dialog
        open={Boolean(viewSubscriber)}
        onOpenChange={open => !open && setViewSubscriber(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscriber Details</DialogTitle>
            <DialogDescription>
              Subscription status and plan information.
            </DialogDescription>
          </DialogHeader>
          {viewSubscriber ? (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Subscriber</p>
                <p className="mt-1 font-semibold text-slate-950">{viewSubscriber.name}</p>
                <p className="text-sm text-slate-600">{viewSubscriber.email}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Plan</p>
                  <p className="font-medium">{getPlanName(viewSubscriber.subscription?.planId)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Expires</p>
                  <p className="font-medium">{formatDate(viewSubscriber.subscriptionExpireDate)}</p>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(manageSubscriber)}
        onOpenChange={open => !open && setManageSubscriber(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>
              {"Cancel this user's active subscription access."}
            </DialogDescription>
          </DialogHeader>
          {manageSubscriber ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {manageSubscriber.name} currently has active access to{' '}
              {getPlanName(manageSubscriber.subscription?.planId)}.
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setManageSubscriber(null)}
              disabled={cancelMutation.isPending}
            >
              Keep Active
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!manageSubscriber) return
                cancelMutation.mutate(manageSubscriber._id)
              }}
              disabled={!manageSubscriber || cancelMutation.isPending}
            >
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={open => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove subscriber?</DialogTitle>
            <DialogDescription>
              This removes active subscription access for this user.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={cancelMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!deleteTarget) return
                cancelMutation.mutate(deleteTarget._id)
              }}
              disabled={!deleteTarget || cancelMutation.isPending}
            >
              Remove Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
