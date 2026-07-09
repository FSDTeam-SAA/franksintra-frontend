'use client'

import * as React from 'react'
import { Eye, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { AdminShell } from '@/components/admin/AdminShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  createPlan,
  deletePlan,
  getPlans,
  updatePlan,
  type BillingCycle,
  type Plan,
  type PlanPayload,
} from '@/lib/subscriptions'
import { getApiErrorMessage } from '@/lib/jobs'

const emptyForm: PlanPayload = {
  planName: '',
  price: 0,
  billingCycle: 'monthly',
  title: '',
  packageIncludes: '',
  isActive: true,
}

function PlansRowsSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-3 border-b border-slate-100 py-3 last:border-0 md:grid-cols-[1.4fr_0.7fr_0.8fr_0.7fr_0.7fr_0.7fr]"
        >
          <Skeleton className="h-8 rounded-xl" />
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

export default function AdminPlansPage() {
  const { data: session } = useSession()
  const accessToken = session?.accessToken ?? ''
  const queryClient = useQueryClient()
  const [form, setForm] = React.useState<PlanPayload>(emptyForm)
  const [editingPlan, setEditingPlan] = React.useState<Plan | null>(null)
  const [viewPlan, setViewPlan] = React.useState<Plan | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Plan | null>(null)

  const plansQuery = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => getPlans(1, 100),
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      editingPlan
        ? updatePlan(accessToken, editingPlan._id, form)
        : createPlan(accessToken, form),
    onSuccess: async () => {
      toast.success(editingPlan ? 'Plan updated' : 'Plan created')
      setForm(emptyForm)
      setEditingPlan(null)
      await queryClient.invalidateQueries({ queryKey: ['admin-plans'] })
      await queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
    onError: error => toast.error(getApiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (planId: string) => deletePlan(accessToken, planId),
    onSuccess: async () => {
      toast.success('Plan deleted')
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['admin-plans'] })
      await queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
    onError: error => toast.error(getApiErrorMessage(error)),
  })

  const startEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setForm({
      planName: plan.planName,
      price: plan.price,
      billingCycle: plan.billingCycle,
      title: plan.title,
      packageIncludes: plan.packageIncludes ?? '',
      isActive: plan.isActive,
    })
  }

  const plans = plansQuery.data?.plans ?? []

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Revenue
          </p>
          <h1 className="mt-2 text-[2.1rem] font-semibold leading-tight text-slate-950 sm:text-4xl">
            Plans
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Add, edit, activate, or delete subscription plans.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Total plans
          </p>
          <p className="text-[1.85rem] font-semibold leading-none text-slate-950">
            {plans.length}
          </p>
        </div>
      </div>

      <Card className="mb-5 rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            {editingPlan ? 'Edit Plan' : 'Add Plan'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Plan name</Label>
              <Input
                value={form.planName}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    planName: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Price</Label>
              <Input
                type="number"
                min="0"
                value={form.price}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    price: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Billing cycle</Label>
              <select
                value={form.billingCycle}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    billingCycle: event.target.value as BillingCycle,
                  }))
                }
                className="h-8 w-full rounded-lg border border-input bg-white px-2.5 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <label className="flex items-end gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.isActive)}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active plan
            </label>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={event =>
                  setForm(current => ({ ...current, title: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Package includes</Label>
              <Textarea
                value={form.packageIncludes}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    packageIncludes: event.target.value,
                  }))
                }
                className="min-h-24"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              className="rounded-xl bg-[#4285F4] hover:bg-[#3777dd]"
              onClick={() => saveMutation.mutate()}
              disabled={
                saveMutation.isPending || !form.planName || !form.title
              }
            >
              {saveMutation.isPending ? (
                <Skeleton className="mr-2 h-4 w-4 rounded-full bg-white/40" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {editingPlan ? 'Update Plan' : 'Add Plan'}
            </Button>
            {editingPlan ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setEditingPlan(null)
                  setForm(emptyForm)
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div>
        {plansQuery.isLoading ? (
          <PlansRowsSkeleton />
        ) : plans.length ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="px-4">Plan</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscribers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map(plan => (
                  <TableRow key={plan._id}>
                    <TableCell className="px-4">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {plan.planName}
                        </p>
                        <p className="max-w-[360px] truncate text-xs text-slate-500">
                          {plan.title}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${Number(plan.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="capitalize text-slate-600">
                      {plan.billingCycle}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          plan.isActive
                            ? 'rounded-full bg-emerald-100 text-emerald-700'
                            : 'rounded-full bg-slate-100 text-slate-600'
                        }
                      >
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {plan.subscribers ?? 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-lg"
                          onClick={() => setViewPlan(plan)}
                          aria-label={`View ${plan.planName}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-lg"
                          onClick={() => startEdit(plan)}
                          aria-label={`Edit ${plan.planName}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => setDeleteTarget(plan)}
                          disabled={deleteMutation.isPending}
                          aria-label={`Delete ${plan.planName}`}
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
          <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">
            No plans have been created yet.
          </div>
        )}
      </div>

      <Dialog open={Boolean(viewPlan)} onOpenChange={open => !open && setViewPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan Details</DialogTitle>
            <DialogDescription>
              Pricing and package details for this subscription plan.
            </DialogDescription>
          </DialogHeader>
          {viewPlan ? (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                    Plan
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">
                    {viewPlan.planName}
                  </p>
                </div>
                <Badge
                  className={
                    viewPlan.isActive
                      ? 'rounded-full bg-emerald-100 text-emerald-700'
                      : 'rounded-full bg-slate-100 text-slate-600'
                  }
                >
                  {viewPlan.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">Price</p>
                  <p className="font-semibold">${Number(viewPlan.price).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Cycle</p>
                  <p className="font-semibold capitalize">{viewPlan.billingCycle}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Subscribers</p>
                  <p className="font-semibold">{viewPlan.subscribers ?? 0}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500">Title</p>
                <p className="mt-1 text-slate-700">{viewPlan.title}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Package Includes</p>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">
                  {viewPlan.packageIncludes || 'No package details added.'}
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={open => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete plan?</DialogTitle>
            <DialogDescription>
              This removes the plan from the admin plan list.
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
