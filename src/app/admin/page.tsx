'use client'

import * as React from 'react'
import { BarChart3, Eye, Users, WalletCards } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { AdminShell } from '@/components/admin/AdminShell'
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
import { getUsers, type AdminUser } from '@/lib/admin'
import { getAdminOverview, type Subscriber } from '@/lib/subscriptions'

function OverviewSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card
            key={index}
            className="rounded-2xl border-slate-200 bg-white shadow-sm"
          >
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-20 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-5 rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-44 rounded-full" />
          <Skeleton className="h-4 w-64 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[260px] w-full rounded-2xl" />
        </CardContent>
      </Card>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, cardIndex) => (
          <Card
            key={cardIndex}
            className="rounded-2xl border-slate-200 bg-white shadow-sm"
          >
            <CardHeader>
              <Skeleton className="h-6 w-44 rounded-full" />
              <Skeleton className="h-4 w-64 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40 rounded-full" />
                    <Skeleton className="h-4 w-56 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

function getSubscriptionStatus(user: AdminUser) {
  return user.hasActiveSubscription ? 'Active' : 'Inactive'
}

export default function AdminOverviewPage() {
  const { data: session } = useSession()
  const accessToken = session?.accessToken ?? ''
  const [viewSubscriber, setViewSubscriber] =
    React.useState<Subscriber | null>(null)
  const [viewUser, setViewUser] = React.useState<AdminUser | null>(null)

  const overviewQuery = useQuery({
    queryKey: ['admin-overview', accessToken],
    queryFn: () => getAdminOverview(accessToken),
    enabled: Boolean(accessToken),
  })

  const usersQuery = useQuery({
    queryKey: ['admin-recent-users', accessToken],
    queryFn: () => getUsers(accessToken, 1, 5),
    enabled: Boolean(accessToken),
  })

  const overview = overviewQuery.data
  const recentUsers = usersQuery.data?.users ?? []
  const recentSubscribers = overview?.recentSubscribers?.slice(0, 5) ?? []
  const metrics = [
    {
      label: 'Total Users',
      value: overview?.totalUsers ?? 0,
      icon: Users,
    },
    {
      label: 'Active Subscribers',
      value: overview?.activeSubscribers ?? 0,
      icon: WalletCards,
    },
    {
      label: 'Total Plans',
      value: overview?.totalPlans ?? 0,
      icon: WalletCards,
    },
    {
      label: 'Active Plans',
      value: overview?.activePlans ?? 0,
      icon: WalletCards,
    },
  ]
  const chartData = metrics.map(metric => ({
    name: metric.label
      .replace('Total ', '')
      .replace('Active Subscribers', 'Subscribers'),
    value: metric.value,
  }))
  const isLoading = overviewQuery.isLoading || usersQuery.isLoading

  return (
    <AdminShell>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Control room
        </p>
        <h1 className="mt-2 text-[2.1rem] font-semibold leading-tight text-slate-950 sm:text-4xl">
          Overview
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Subscription and user activity at a glance.
        </p>
      </div>

      {isLoading ? (
        <OverviewSkeleton />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(metric => {
              const Icon = metric.icon

              return (
                <Card
                  key={metric.label}
                  className="rounded-2xl border-slate-200 bg-white shadow-sm"
                >
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                    <CardDescription>{metric.label}</CardDescription>
                    <Icon className="h-4 w-4 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-[2.1rem] font-semibold leading-none">
                      {metric.value}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="mt-5 overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Workspace Activity</CardTitle>
                <CardDescription>
                  Users, plans, and active subscription volume.
                </CardDescription>
              </div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <BarChart3 className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full rounded-2xl bg-gradient-to-b from-slate-50 to-white p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(37, 99, 235, 0.08)' }}
                      contentStyle={{
                        borderRadius: '14px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#2563eb"
                      radius={[10, 10, 4, 4]}
                      name="Count"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Recent Users</CardTitle>
                <CardDescription>
                  Latest registered accounts in the workspace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentUsers.length ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="px-4">User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Subscription</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentUsers.map(user => (
                          <TableRow key={user._id}>
                            <TableCell className="px-4">
                              <p className="font-medium text-slate-950">
                                {user.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {user.email}
                              </p>
                            </TableCell>
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
                                {getSubscriptionStatus(user)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end">
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
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No users found.</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Recent Subscribers</CardTitle>
                <CardDescription>
                  Latest users with active subscription access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentSubscribers.length ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="px-4">Subscriber</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentSubscribers.map(user => (
                          <TableRow key={user._id}>
                            <TableCell className="px-4">
                              <p className="font-medium text-slate-950">
                                {user.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {user.email}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge className="w-fit rounded-full bg-emerald-100 text-emerald-700">
                                Active
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end">
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
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No active subscribers yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Dialog open={Boolean(viewUser)} onOpenChange={open => !open && setViewUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Account snapshot from the recent users table.
            </DialogDescription>
          </DialogHeader>
          {viewUser ? (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  User
                </p>
                <p className="mt-1 font-semibold text-slate-950">
                  {viewUser.name}
                </p>
                <p className="text-sm text-slate-600">{viewUser.email}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Role</p>
                  <p className="font-medium">{viewUser.role}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Subscription</p>
                  <p className="font-medium">
                    {getSubscriptionStatus(viewUser)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(viewSubscriber)}
        onOpenChange={open => !open && setViewSubscriber(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscriber Details</DialogTitle>
            <DialogDescription>
              Quick snapshot from the overview table.
            </DialogDescription>
          </DialogHeader>
          {viewSubscriber ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">
                {viewSubscriber.name}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {viewSubscriber.email}
              </p>
              <Badge className="mt-4 rounded-full bg-emerald-100 text-emerald-700">
                Active subscriber
              </Badge>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
