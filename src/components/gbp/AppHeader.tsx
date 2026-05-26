'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/history', label: 'History' },
  { href: '/settings', label: 'Settings' },
]

export function AppHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 md:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-[#4285F4] text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold md:text-lg">
              GBP Pilot
            </span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm md:flex md:text-base">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'transition-colors hover:text-slate-900',
                  pathname === link.href
                    ? 'font-semibold text-slate-900'
                    : 'text-slate-600',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <Button
          asChild
          className="h-9 rounded-xl bg-[#4285F4] px-4 text-sm whitespace-nowrap hover:bg-[#3777dd]"
        >
          <Link href="/" className="inline-flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>
    </header>
  )
}
