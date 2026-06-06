'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl,
      })

      if (result?.error) {
        toast.error('Invalid email or password')
        return
      }

      toast.success('Logged in successfully')
      router.push(callbackUrl)
    } catch {
      toast.error('Could not sign in right now')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(66,133,244,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[#0f172a] p-8 text-white shadow-[0_30px_100px_rgba(15,23,42,0.25)] sm:p-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(66,133,244,0.25),_transparent_55%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_30%)]" />
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4 text-[#8ab4f8]" />
              GBP Pilot workspace access
            </div>
            <div className="max-w-xl space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                One login for the full posting workflow.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-200 sm:text-lg">
                Access your content generator, history, and account tools from a
                single secure workspace built around the backend auth flow.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Protected pages',
                  text: 'Middleware keeps the app locked until you sign in.',
                },
                {
                  icon: UserRound,
                  title: 'Fast account access',
                  text: 'Jump straight to history and account settings after login.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                >
                  <item.icon className="h-5 w-5 text-[#8ab4f8]" />
                  <p className="mt-3 font-medium">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Card className="rounded-[2rem] border-slate-200/80 bg-white/95 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <CardHeader className="space-y-3 pb-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4285F4]/10 text-[#4285F4]">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 sm:text-[15px]">
                Sign in with your backend account to continue.
              </CardDescription>
            </div>
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
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-700 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-[#4285F4] transition-colors hover:text-[#3777dd]"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full rounded-2xl bg-[#4285F4] px-5 py-6 text-base hover:bg-[#3777dd]"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Login to dashboard'}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(66,133,244,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] flex items-center justify-center text-slate-500"
      >
        <Loader2 className="h-6 w-6 animate-spin text-[#4285F4] mr-2" />
        Loading...
      </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  )
}

