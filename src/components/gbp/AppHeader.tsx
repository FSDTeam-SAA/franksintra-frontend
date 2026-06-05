'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { History, Menu, Plus, Sparkles } from 'lucide-react'
import * as React from 'react'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/history', label: 'History' },
  { href: '/settings', label: 'Settings' },
]

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()

  const handleNewPost = React.useCallback(() => {
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    router.push(`/?newPost=${token}`)
  }, [router])

  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-[#4285F4] text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="truncate text-sm font-semibold sm:text-base md:text-lg">
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
        <div className="flex items-center gap-2">
          <Button
            type="button"
            className="hidden h-9 rounded-xl bg-[#4285F4] px-3 text-sm whitespace-nowrap hover:bg-[#3777dd] sm:inline-flex sm:px-4"
            onClick={handleNewPost}
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="sr-only sm:not-sr-only">New Post</span>
          </Button>

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="rounded-xl md:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              }
            />
            <SheetContent side="right" className="w-[86vw] max-w-sm px-4 py-4">
              <SheetHeader className="px-0">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start rounded-xl"
                  onClick={handleNewPost}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Button>

                <div className="space-y-1">
                  {links.map((link) => (
                    <Button
                      key={link.href}
                      asChild
                      variant="ghost"
                      className={cn(
                        'w-full justify-start rounded-xl px-3',
                        pathname === link.href && 'bg-slate-100 text-slate-900',
                      )}
                    >
                      <Link href={link.href}>{link.label}</Link>
                    </Button>
                  ))}
                </div>

                <Button asChild variant="outline" className="w-full justify-start rounded-xl">
                  <a href="#history">
                    <History className="mr-2 h-4 w-4" />
                    Go to History
                  </a>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
