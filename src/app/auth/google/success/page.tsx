'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

function GoogleSuccessHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = React.useState('Completing Google authentication...')

  React.useEffect(() => {
    const token = searchParams.get('token')
    const refreshToken = searchParams.get('refreshToken')
    const isNew = searchParams.get('isNew') === 'true'

    if (!token) {
      setStatus('error')
      setMessage('Authentication token not found.')
      toast.error('Google login failed: missing token')
      setTimeout(() => router.push('/login'), 3000)
      return
    }

    const performSignIn = async () => {
      try {
        const result = await signIn('credentials', {
          redirect: false,
          token,
          refreshToken: refreshToken || '',
          isGoogle: 'true',
        })

        if (result?.error) {
          setStatus('error')
          setMessage('Failed to establish session.')
          toast.error('Session establishment failed')
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        setStatus('success')
        setMessage(isNew ? 'Account created! Redirecting to dashboard...' : 'Logged in successfully! Redirecting...')
        toast.success(isNew ? 'Account created successfully!' : 'Welcome back!')
        setTimeout(() => router.push('/'), 1500)
      } catch {
        setStatus('error')
        setMessage('An unexpected error occurred.')
        toast.error('Authentication failed')
        setTimeout(() => router.push('/login'), 3000)
      }
    }

    performSignIn()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(66,133,244,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-[2rem] border border-slate-200/80 bg-white/95 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur text-center space-y-6">
        {status === 'loading' && (
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-4 w-64 rounded-full" />
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Success</h2>
            <p className="text-sm text-slate-500">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Authentication Failed</h2>
            <p className="text-sm text-slate-500">{message}</p>
            <p className="text-xs text-slate-400">Redirecting you to the login page...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function GoogleSuccessPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(66,133,244,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] px-4">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-4 w-64 rounded-full" />
            </div>
          </div>
        </div>
      }
    >
      <GoogleSuccessHandler />
    </React.Suspense>
  )
}
