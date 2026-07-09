import { axiosInstance } from '@/lib/axios'
import type { AuthUserProfile } from '@/lib/auth'

type ApiEnvelope<T> = {
  data: T
  message?: string
}

export type BillingCycle = 'daily' | 'monthly' | 'yearly'

export type Plan = {
  _id: string
  planName: string
  price: number
  billingCycle: BillingCycle
  title: string
  packageIncludes?: string
  isActive: boolean
  subscribers?: number
  createdAt?: string
  updatedAt?: string
}

export type PlanPayload = {
  planName: string
  price: number
  billingCycle: BillingCycle
  title: string
  packageIncludes?: string
  isActive?: boolean
}

export type SubscriptionStatus = {
  hasActiveSubscription: boolean
  subscription: {
    planId: Plan | string | null
    startDate: string | null
    endDate: string | null
  } | null
  subscriptionExpireDate?: string | null
}

export type Subscriber = AuthUserProfile & {
  hasActiveSubscription?: boolean
  subscriptionExpireDate?: string | null
  subscription?: SubscriptionStatus['subscription']
}

export type AdminOverview = {
  totalUsers: number
  activeSubscribers: number
  totalPlans: number
  activePlans: number
  recentSubscribers: Subscriber[]
}

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  }
}

export async function getPlans(page = 1, limit = 50) {
  const response = await axiosInstance.get<
    ApiEnvelope<{
      plans: Plan[]
      paginationInfo?: {
        total: number
        page: number
        limit: number
        totalPages: number
      }
    }>
  >('/plans', { params: { page, limit } })

  return response.data.data
}

export async function createPlan(accessToken: string, payload: PlanPayload) {
  const response = await axiosInstance.post<ApiEnvelope<Plan>>(
    '/plans',
    payload,
    { headers: authHeaders(accessToken) },
  )

  return response.data.data
}

export async function updatePlan(
  accessToken: string,
  planId: string,
  payload: Partial<PlanPayload>,
) {
  const response = await axiosInstance.put<ApiEnvelope<Plan>>(
    `/plans/${planId}`,
    payload,
    { headers: authHeaders(accessToken) },
  )

  return response.data.data
}

export async function deletePlan(accessToken: string, planId: string) {
  const response = await axiosInstance.delete<ApiEnvelope<null>>(
    `/plans/${planId}`,
    { headers: authHeaders(accessToken) },
  )

  return response.data
}

export async function getCurrentSubscription(accessToken: string) {
  const response = await axiosInstance.get<ApiEnvelope<SubscriptionStatus>>(
    '/subscriptions/me',
    { headers: authHeaders(accessToken) },
  )

  return response.data.data
}

export async function buySubscription(accessToken: string, planId: string) {
  const response = await axiosInstance.post<ApiEnvelope<{ url: string }>>(
    `/subscriptions/buy/${planId}`,
    undefined,
    { headers: authHeaders(accessToken) },
  )

  return response.data.data
}

export async function getAdminOverview(accessToken: string) {
  const response = await axiosInstance.get<ApiEnvelope<AdminOverview>>(
    '/subscriptions/overview',
    { headers: authHeaders(accessToken) },
  )

  return response.data.data
}

export async function getSubscribers(accessToken: string, page = 1, limit = 20) {
  const response = await axiosInstance.get<
    ApiEnvelope<{
      subscriptions: Subscriber[]
      paginationInfo?: {
        total: number
        page: number
        limit: number
        totalPages: number
      }
    }>
  >('/subscriptions/all', {
    params: { page, limit },
    headers: authHeaders(accessToken),
  })

  return response.data.data
}

export async function cancelSubscriber(accessToken: string, userId: string) {
  const response = await axiosInstance.delete<ApiEnvelope<Subscriber>>(
    `/subscriptions/${userId}`,
    { headers: authHeaders(accessToken) },
  )

  return response.data.data
}
