import { axiosInstance } from '@/lib/axios'

type ApiEnvelope<T> = {
  data: T
  message?: string
}

export type AuthUserProfile = {
  _id: string
  name: string
  email: string
  role: string
  username?: string
  dob?: string
  phone?: string
  gender?: 'male' | 'female' | 'other'
  bio?: string
  language?: string
  address?: {
    country?: string
    cityState?: string
    roadArea?: string
    postalCode?: string
    taxId?: string
  }
  profileImage?: string | null
}

export type UpdateUserProfilePayload = {
  name?: string
  username?: string
  dob?: string
  phone?: string
  gender?: 'male' | 'female' | 'other'
  bio?: string
  language?: string
  country?: string
  cityState?: string
  roadArea?: string
  postalCode?: string
  taxId?: string
}

export type AuthSessionResponse = ApiEnvelope<{
  user: AuthUserProfile & {
    refreshToken: string
  }
  accessToken: string
}>

export type ChangePasswordPayload = {
  oldPassword: string
  newPassword: string
}

export type ResetPasswordPayload = {
  email: string
  newPassword: string
}

export async function getCurrentUserProfile(accessToken: string) {
  const response = await axiosInstance.get<ApiEnvelope<AuthUserProfile>>(
    '/user/me',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  return response.data.data
}

export async function changePassword(
  accessToken: string,
  payload: ChangePasswordPayload,
) {
  const response = await axiosInstance.post<ApiEnvelope<null>>(
    '/auth/change-password',
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  return response.data
}

export async function logout(accessToken: string) {
  const response = await axiosInstance.post<ApiEnvelope<null>>(
    '/auth/logout',
    undefined,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  return response.data
}

export async function requestPasswordReset(email: string) {
  const response = await axiosInstance.post<ApiEnvelope<null>>(
    '/auth/forget-password',
    { email },
  )

  return response.data
}

export async function verifyResetCode(email: string, otp: string) {
  const response = await axiosInstance.post<ApiEnvelope<null>>(
    '/auth/verify-code',
    { email, otp },
  )

  return response.data
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const response = await axiosInstance.post<ApiEnvelope<null>>(
    '/auth/reset-password',
    payload,
  )

  return response.data
}

export async function updateCurrentUserProfile(
  accessToken: string,
  payload: UpdateUserProfilePayload,
) {
  const response = await axiosInstance.put<ApiEnvelope<AuthUserProfile>>(
    '/user/me',
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  return response.data.data
}

export async function uploadAvatar(accessToken: string, file: File) {
  const formData = new FormData()
  formData.append('profileImage', file)

  const response = await axiosInstance.post<ApiEnvelope<AuthUserProfile>>(
    '/user/upload-avatar',
    formData,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return response.data.data
}

export async function updateAvatar(accessToken: string, file: File) {
  const formData = new FormData()
  formData.append('profileImage', file)

  const response = await axiosInstance.put<ApiEnvelope<AuthUserProfile>>(
    '/user/upload-avatar',
    formData,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return response.data.data
}

export async function deleteAvatar(accessToken: string) {
  const response = await axiosInstance.delete<ApiEnvelope<AuthUserProfile>>(
    '/user/upload-avatar',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  return response.data.data
}
