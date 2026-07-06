'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  UserPlus,
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
import { axiosInstance } from '@/lib/axios'

function RegisterForm() {
  const router = useRouter()
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      // 1. Call Register Endpoint
      await axiosInstance.post('/auth/register', {
        name,
        email,
        password,
      })

      toast.success('Registration successful! Logging you in...')

      // 2. Automate Login
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        toast.error('Registered successfully, but failed to log in automatically. Please log in.')
        router.push('/login')
        return
      }

      toast.success('Welcome to GBP Pilot!')
      router.push('/')
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      const message = axiosError?.response?.data?.message || 'Could not register right now'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(66,133,244,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden flex-col justify-center overflow-hidden rounded-[2rem] border border-white/70 bg-[#0f172a] p-8 text-white shadow-[0_30px_100px_rgba(15,23,42,0.25)] lg:flex sm:p-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(66,133,244,0.25),_transparent_55%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_30%)]" />
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4 text-[#8ab4f8]" />
              Create your GBP Pilot workspace
            </div>
            <div className="max-w-xl space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Get started with the full posting workflow.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-200 sm:text-lg">
                Create your account to access your content generator, history, and account tools from a
                single secure workspace.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Secure Accounts',
                  text: 'Industry-standard JWT encryption keeps your workflow safe.',
                },
                {
                  icon: UserRound,
                  title: 'Multi-User Access',
                  text: 'Manage profiles, schedules, and custom settings separately.',
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

        <Card className="flex flex-col justify-center rounded-[2rem] border-slate-200/80 bg-white/95 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <CardHeader className="space-y-3 pb-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4285F4]/10 text-[#4285F4]">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-2xl">Create account</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 sm:text-[15px]">
                Sign up to begin scheduling your GMB posts.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="John Doe"
                  autoComplete="name"
                  required
                />
              </div>
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
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
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

              <Button
                type="submit"
                className="w-full rounded-2xl bg-[#4285F4] px-5 py-6 text-base hover:bg-[#3777dd] mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering...' : 'Register account'}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-2xl border-slate-200/80 hover:bg-slate-50 px-5 py-6 text-base text-slate-700 hover:text-slate-900 transition-colors"
                onClick={() => {
                  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`
                }}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign up with Google
              </Button>

              <div className="text-center text-sm text-slate-500 mt-3">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-medium text-[#4285F4] transition-colors hover:text-[#3777dd]"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function RegisterPage() {
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
      <RegisterForm />
    </React.Suspense>
  )
}
