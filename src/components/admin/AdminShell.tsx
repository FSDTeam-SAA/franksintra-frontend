'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowLeft,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
  WalletCards,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const adminLinks = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/plans', label: 'Plans', icon: WalletCards },
  { href: '/admin/subscribers', label: 'Subscribers', icon: CreditCard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[15px] text-slate-900">
      <main className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="border-r border-slate-200 bg-slate-950 text-white lg:sticky lg:top-0 lg:h-screen">
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-4 py-4">
              <Link href="/" className="inline-flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white">
                  <img
                    src="/images/image 1108.svg"
                    alt="Logo"
                    className="h-6 w-6"
                  />
                </div>
                <div>
                  <p className="text-[15px] font-semibold tracking-wide">
                    gmbpostingez
                  </p>
                  <p className="text-xs text-slate-400">Admin Console</p>
                </div>
              </Link>
            </div>

            <div className="px-4 py-4">
              <p className="text-xl font-semibold">Dashboard</p>
              <p className="mt-1 text-[13px] leading-5 text-slate-400">
                Manage plans, subscribers, users, and settings.
              </p>
            </div>

            <nav className="flex-1 space-y-1 px-3">
              {adminLinks.map(link => {
                const Icon = link.icon
                const isActive =
                  pathname === link.href ||
                  (link.href !== '/admin' && pathname.startsWith(link.href))

                return (
                  <Button
                    key={link.href}
                    asChild
                    variant="ghost"
                    className={cn(
                      'h-10 w-full justify-start rounded-xl px-3 text-slate-300 hover:bg-white/10 hover:text-white',
                      isActive &&
                        'bg-white text-slate-950 hover:bg-white hover:text-slate-950',
                    )}
                  >
                    <Link href={link.href}>
                      <Icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </Link>
                  </Button>
                )
              })}
            </nav>

            <div className="border-t border-white/10 p-3">
              <Button
                asChild
                variant="ghost"
                className="h-10 w-full justify-start rounded-xl text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to app
                </Link>
              </Button>
            </div>
          </div>
        </aside>
        <section className="min-w-0 px-3 py-3 sm:px-5 lg:px-6 lg:py-5">
          {children}
        </section>
      </main>
    </div>
  )
}
