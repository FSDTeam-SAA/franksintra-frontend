'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, MailWarning, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset } from '@/lib/auth'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await requestPasswordReset(email)
      toast.success('Verification code sent to your email')
      router.push(`/reset-password?email=${encodeURIComponent(email)}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send code')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(66,133,244,0.14),_transparent_35%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_25px_80px_rgba(15,23,42,0.12)] sm:p-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4285F4]/10 text-[#4285F4]">
            <MailWarning className="h-5 w-5" />
          </div>
          <div className="mt-5 space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Reset access in two quick steps.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              We’ll send a code to your email. Use that code on the next screen
              to set a new password.
            </p>
          </div>
          <div className="mt-8 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <ShieldCheck className="h-4 w-4 text-[#4285F4]" />
              Only the backend auth endpoints handle the reset flow.
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <ShieldCheck className="h-4 w-4 text-[#4285F4]" />
              No signup flow is exposed because this is a single-user app.
            </div>
          </div>
        </section>

        <Card className="rounded-[2rem] border-slate-200/80 bg-white/95 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Forgot password</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6 sm:text-[15px]">
              Enter the email linked to your account and we’ll send a code.
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
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-2xl bg-[#4285F4] px-5 py-6 text-base hover:bg-[#3777dd]"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending code...' : 'Send verification code'}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <div className="text-center text-sm text-slate-600">
                Remembered your password?{' '}
                <Link
                  href="/login"
                  className="font-medium text-[#4285F4] transition-colors hover:text-[#3777dd]"
                >
                  Back to login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
