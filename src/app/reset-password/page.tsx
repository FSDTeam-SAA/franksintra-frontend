'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword, verifyResetCode } from '@/lib/auth'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const presetEmail = searchParams.get('email') ?? ''
  const [email, setEmail] = React.useState(presetEmail)
  const [otp, setOtp] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (presetEmail) {
      setEmail(presetEmail)
    }
  }, [presetEmail])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsSubmitting(true)

    try {
      await verifyResetCode(email, otp)
      await resetPassword({ email, newPassword })
      toast.success('Password updated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not reset password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(66,133,244,0.14),_transparent_35%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)] sm:p-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4285F4]/10 text-[#4285F4]">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="mt-5 space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Finish the reset with your code.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              Enter the verification code from your inbox, then choose a new
              password for the account.
            </p>
          </div>
          <div className="mt-8 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <ShieldCheck className="h-4 w-4 text-[#4285F4]" />
              The backend validates the OTP before accepting the new password.
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <ShieldCheck className="h-4 w-4 text-[#4285F4]" />
              After this, log back in with the updated credentials.
            </div>
          </div>
        </section>

        <Card className="rounded-[2rem] border-slate-200/80 bg-white/95 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Reset password</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 sm:text-[15px]">
              Use the email, verification code, and your new password here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="6-digit code"
                  maxLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-700 transition-colors"
                    tabIndex={-1}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat the new password"
                    autoComplete="new-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-700 transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full rounded-2xl bg-[#4285F4] px-5 py-6 text-base hover:bg-[#3777dd]"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating password...' : 'Reset password'}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <div className="text-center text-sm text-slate-600">
                Back to{' '}
                <Link
                  href="/login"
                  className="font-medium text-[#4285F4] transition-colors hover:text-[#3777dd]"
                >
                  login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(66,133,244,0.14),_transparent_35%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] flex items-center justify-center text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-[#4285F4] mr-2" />
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </React.Suspense>
  )
}

