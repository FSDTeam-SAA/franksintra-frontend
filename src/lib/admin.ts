import { axiosInstance } from '@/lib/axios'
import type { AuthUserProfile } from '@/lib/auth'

type ApiEnvelope<T> = {
  data: T
  message?: string
}

export type AdminUser = AuthUserProfile & {
  hasActiveSubscription?: boolean
  subscriptionExpireDate?: string | null
  isVerified?: boolean
}

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  }
}

export async function getUsers(accessToken: string, page = 1, limit = 20) {
  const response = await axiosInstance.get<
    ApiEnvelope<{
      users: AdminUser[]
      paginationInfo?: {
        total: number
        page: number
        limit: number
        totalPages: number
      }
    }>
  >('/user/all-users', {
    params: { page, limit },
    headers: authHeaders(accessToken),
  })

  return response.data.data
}

export async function updateUser(
  accessToken: string,
  userId: string,
  payload: Partial<Pick<AdminUser, 'name' | 'role' | 'hasActiveSubscription'>>,
) {
  const response = await axiosInstance.put<ApiEnvelope<AdminUser>>(
    `/user/${userId}`,
    payload,
    { headers: authHeaders(accessToken) },
  )

  return response.data.data
}

export async function deleteUser(accessToken: string, userId: string) {
  const response = await axiosInstance.delete<ApiEnvelope<null>>(
    `/user/${userId}`,
    { headers: authHeaders(accessToken) },
  )

  return response.data
}
