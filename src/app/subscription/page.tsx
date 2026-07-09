'use client'

import * as React from 'react'
import { Check, CreditCard, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { AppHeader } from '@/components/gbp/AppHeader'
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
  buySubscription,
  getCurrentSubscription,
  getPlans,
} from '@/lib/subscriptions'
import { getApiErrorMessage } from '@/lib/jobs'

function formatDate(value?: string | null) {
  if (!value) return 'Not active'
  return new Date(value).toLocaleDateString()
}

function PlansSkeleton() {
  return (
    <div className="mt-6 grid justify-center gap-5 [grid-template-columns:repeat(auto-fit,minmax(280px,340px))]">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card
          key={index}
          className="rounded-[1.6rem] border-slate-200 bg-white shadow-sm"
        >
          <CardHeader>
            <Skeleton className="h-6 w-36 rounded-full" />
            <Skeleton className="mt-2 h-4 w-full rounded-full" />
            <Skeleton className="mt-5 h-8 w-32 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-5/6 rounded-full" />
            <Skeleton className="h-4 w-4/6 rounded-full" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function SubscriptionPage() {
  const { data: session } = useSession()
  const accessToken = session?.accessToken ?? ''
  const [checkoutPlanId, setCheckoutPlanId] = React.useState<string | null>(null)

  const plansQuery = useQuery({
    queryKey: ['plans'],
    queryFn: () => getPlans(1, 50),
  })

  const subscriptionQuery = useQuery({
    queryKey: ['subscription-status', accessToken],
    queryFn: () => getCurrentSubscription(accessToken),
    enabled: Boolean(accessToken),
  })

  const buyMutation = useMutation({
    mutationFn: (planId: string) => buySubscription(accessToken, planId),
    onSuccess: data => {
      if (data.url) {
        window.location.href = data.url
      }
    },
    onError: error => {
      toast.error(getApiErrorMessage(error))
    },
    onSettled: () => setCheckoutPlanId(null),
  })

  const activePlan = subscriptionQuery.data?.subscription?.planId
  const activePlanName =
    activePlan && typeof activePlan === 'object' ? activePlan.planName : null
  const plans = plansQuery.data?.plans.filter(plan => plan.isActive) ?? []
  const hasActiveSubscription =
    subscriptionQuery.data?.hasActiveSubscription ?? false

  const handleSubscribe = (planId: string) => {
    setCheckoutPlanId(planId)
    buyMutation.mutate(planId)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(66,133,244,0.16),_transparent_32rem),linear-gradient(180deg,_#f8fbff_0%,_#f5f7fb_48%,_#ffffff_100%)] text-slate-900">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 md:px-6 md:py-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-white/85 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-7 lg:p-8">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-100/70 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-emerald-100/70 blur-3xl" />

          <div className="relative grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <Badge className="mb-4 rounded-full bg-blue-50 px-3 py-1 text-blue-700 hover:bg-blue-50">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Premium access
              </Badge>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]">
                Pick the plan that keeps your GMB workflow moving.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Unlock content generation, refinement, copy tools, and posting
                actions with a subscription built for consistent local marketing.
              </p>

              <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
                {[
                  { icon: Zap, label: 'Generate faster' },
                  { icon: ShieldCheck, label: 'Secure checkout' },
                  { icon: Check, label: 'Cancel anytime' },
                ].map(item => {
                  const Icon = item.icon

                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm"
                    >
                      <Icon className="h-4 w-4 text-[#4285F4]" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <Card className="relative rounded-[1.75rem] border-slate-200 bg-slate-950 text-white shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl">Current Plan</CardTitle>
                  <Badge
                    className={
                      hasActiveSubscription
                        ? 'rounded-full bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/15'
                        : 'rounded-full bg-amber-400/15 text-amber-200 hover:bg-amber-400/15'
                    }
                  >
                    {hasActiveSubscription ? 'Active' : 'Required'}
                  </Badge>
                </div>
                <CardDescription className="text-slate-300">
                  {activePlanName
                    ? `${activePlanName} renews or expires on ${formatDate(
                        subscriptionQuery.data?.subscriptionExpireDate,
                      )}.`
                    : 'No active subscription is attached to this account.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-sm text-slate-300">Subscription status</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {hasActiveSubscription
                      ? (activePlanName ?? 'Active plan')
                      : 'Choose a plan'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {hasActiveSubscription
                      ? 'You can keep using premium GMB actions.'
                      : 'Subscribe once to unlock premium GMB actions.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="mx-auto mt-8 max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
            Pricing plans
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Simple plans, centered around your posting workflow.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Select a package below. Your premium tools unlock immediately after
            checkout succeeds.
          </p>
        </div>

        {plansQuery.isLoading ? (
          <PlansSkeleton />
        ) : plans.length ? (
          <div className="mt-6 grid justify-center gap-5 [grid-template-columns:repeat(auto-fit,minmax(280px,340px))]">
            {plans.map((plan, index) => (
              <Card
                key={plan._id}
                className="group relative flex min-h-[430px] flex-col overflow-hidden rounded-[1.75rem] border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_28px_70px_rgba(37,99,235,0.14)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4285F4] via-cyan-400 to-emerald-400 opacity-0 transition group-hover:opacity-100" />
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-2xl tracking-tight">
                        {plan.planName}
                      </CardTitle>
                      <CardDescription className="mt-2 leading-6">
                        {plan.title}
                      </CardDescription>
                    </div>
                    {activePlanName === plan.planName ? (
                      <Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        Current
                      </Badge>
                    ) : index === 1 ? (
                      <Badge className="rounded-full bg-blue-100 text-blue-700 hover:bg-blue-100">
                        Popular
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <p className="text-3xl font-semibold tracking-tight text-slate-950">
                      ${Number(plan.price).toFixed(2)}
                    </p>
                    <p className="mt-1 text-sm capitalize text-slate-500">
                      per {plan.billingCycle}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-5">
                  <div className="space-y-3 text-sm leading-6 text-slate-600">
                    {(plan.packageIncludes || 'GMB content generation')
                      .split(/\n|,/)
                      .map(item => item.trim())
                      .filter(Boolean)
                      .map(item => (
                        <div key={item} className="flex gap-2.5">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          </span>
                          <span>{item}</span>
                        </div>
                      ))}
                  </div>

                  <Button
                    type="button"
                    className="h-11 rounded-xl bg-[#4285F4] text-base font-semibold hover:bg-[#3777dd]"
                    onClick={() => handleSubscribe(plan._id)}
                    disabled={
                      buyMutation.isPending || activePlanName === plan.planName
                    }
                  >
                    {checkoutPlanId === plan._id && buyMutation.isPending ? (
                      <Skeleton className="mr-2 h-4 w-4 rounded-full bg-white/40" />
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    {activePlanName === plan.planName
                      ? 'Current Plan'
                      : 'Subscribe'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mt-6 rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6 text-sm text-slate-600">
              No active plans are available right now.
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
