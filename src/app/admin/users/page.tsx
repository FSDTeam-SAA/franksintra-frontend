'use client'

import * as React from 'react'
import { Eye, Pencil, Trash2, UserCog } from 'lucide-react'
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
import { deleteUser, getUsers, updateUser, type AdminUser } from '@/lib/admin'
import { getApiErrorMessage } from '@/lib/jobs'

function formatDate(value?: string | null) {
  if (!value) return 'No expiry'
  return new Date(value).toLocaleDateString()
}

function UsersTableSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="grid gap-3 md:grid-cols-[1.4fr_1fr_0.7fr_0.8fr_0.8fr]">
            <Skeleton className="h-8 rounded-xl" />
            <Skeleton className="h-8 rounded-xl" />
            <Skeleton className="h-8 rounded-xl" />
            <Skeleton className="h-8 rounded-xl" />
            <Skeleton className="h-8 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const accessToken = session?.accessToken ?? ''
  const queryClient = useQueryClient()
  const [viewUser, setViewUser] = React.useState<AdminUser | null>(null)
  const [editUser, setEditUser] = React.useState<AdminUser | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<AdminUser | null>(null)

  const usersQuery = useQuery({
    queryKey: ['admin-users', accessToken],
    queryFn: () => getUsers(accessToken, 1, 100),
    enabled: Boolean(accessToken),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      user,
      hasActiveSubscription,
    }: {
      user: AdminUser
      hasActiveSubscription: boolean
    }) =>
      updateUser(accessToken, user._id, {
        hasActiveSubscription,
      }),
    onSuccess: async () => {
      toast.success('User access updated')
      setEditUser(null)
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
    },
    onError: error => toast.error(getApiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(accessToken, userId),
    onSuccess: async () => {
      toast.success('User deleted')
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: error => toast.error(getApiErrorMessage(error)),
  })

  const users = usersQuery.data?.users ?? []

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Management
          </p>
          <h1 className="mt-2 text-[2.1rem] font-semibold leading-tight text-slate-950 sm:text-4xl">
            Users
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review registered users and manage subscription access.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Total users
          </p>
          <p className="text-[1.85rem] font-semibold leading-none text-slate-950">
            {users.length}
          </p>
        </div>
      </div>

      {usersQuery.isLoading ? (
        <UsersTableSkeleton />
      ) : users.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-4">User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user._id}>
                  <TableCell className="px-4">
                    <div>
                      <p className="font-medium text-slate-950">{user.name}</p>
                      <p className="text-xs text-slate-500">ID: {user._id.slice(-8)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        user.role === 'ADMIN'
                          ? 'rounded-full bg-sky-100 text-sky-700'
                          : 'rounded-full bg-slate-100 text-slate-600'
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        user.hasActiveSubscription
                          ? 'rounded-full bg-emerald-100 text-emerald-700'
                          : 'rounded-full bg-amber-100 text-amber-800'
                      }
                    >
                      {user.hasActiveSubscription ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {formatDate(user.subscriptionExpireDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-lg"
                        onClick={() => setViewUser(user)}
                        aria-label={`View ${user.name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-lg"
                        onClick={() => setEditUser(user)}
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
          No users found.
        </div>
      )}

      <Dialog open={Boolean(viewUser)} onOpenChange={open => !open && setViewUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Account and subscription information for this user.
            </DialogDescription>
          </DialogHeader>
          {viewUser ? (
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Name</p>
                <p className="mt-1 font-semibold text-slate-950">{viewUser.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Email</p>
                <p className="mt-1 text-slate-700">{viewUser.email}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Role</p>
                  <p className="mt-1 text-slate-700">{viewUser.role}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Subscription</p>
                  <p className="mt-1 text-slate-700">
                    {viewUser.hasActiveSubscription ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editUser)} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Access</DialogTitle>
            <DialogDescription>
              Manage subscription access. Admin role changes are intentionally disabled here.
            </DialogDescription>
          </DialogHeader>
          {editUser ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white">
                  <UserCog className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{editUser.name}</p>
                  <p className="text-sm text-slate-500">{editUser.email}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Current subscription access is{' '}
                <span className="font-semibold">
                  {editUser.hasActiveSubscription ? 'active' : 'inactive'}
                </span>
                .
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditUser(null)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#4285F4] hover:bg-[#3777dd]"
              onClick={() => {
                if (!editUser) return
                updateMutation.mutate({
                  user: editUser,
                  hasActiveSubscription: !editUser.hasActiveSubscription,
                })
              }}
              disabled={!editUser || updateMutation.isPending}
            >
              {editUser?.hasActiveSubscription ? 'Remove Access' : 'Grant Access'}
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
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              This will permanently remove the selected user account.
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
              disabled={!deleteTarget || deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
