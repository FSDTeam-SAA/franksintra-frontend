'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  History,
  LogIn,
  LogOut,
  Menu,
  Plus,
  UserRound,
  Loader2,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { toast } from 'sonner'

import { logout } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Home' },
  { href: '/history', label: 'History' },
  { href: '/account', label: 'Account' },
]

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const [isLogoutOpen, setIsLogoutOpen] = React.useState(false)

  const handleNewPost = React.useCallback(() => {
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    router.push(`/?newPost=${token}`)
  }, [router])

  const handleLogout = React.useCallback(async () => {
    setIsLoggingOut(true)
    try {
      if (session?.accessToken) {
        await logout(session.accessToken)
      }
    } catch {
      toast.error('Could not log out from the backend, continuing locally.')
    } finally {
      setIsLogoutOpen(false)
      setIsLoggingOut(false)
      await signOut({ callbackUrl: '/login' })
    }
  }, [session?.accessToken])

  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-white shadow-sm">
              <img
                src="/images/image 1108.svg"
                alt="Logo"
                className="h-7 w-7"
              />
            </div>
            <span className="truncate text-sm font-semibold sm:text-base md:text-lg">
              gmbpostingez
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
                  {links.map(link => (
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

                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start rounded-xl"
                >
                  <Link href="/history">
                    <History className="mr-2 h-4 w-4" />
                    Open history
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start rounded-xl"
                >
                  <Link href="/account">
                    <UserRound className="mr-2 h-4 w-4" />
                    Account settings
                  </Link>
                </Button>

                {status === 'authenticated' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start rounded-xl border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 hover:text-rose-700 transition-all duration-200"
                    onClick={() => setIsLogoutOpen(true)}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="w-full justify-start rounded-xl bg-[#4285F4] hover:bg-[#3777dd]"
                  >
                    <Link href="/login">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {status === 'authenticated' ? (
            <>
              <Button
                asChild
                variant="outline"
                className="hidden rounded-xl px-4 sm:inline-flex"
              >
                <Link href="/account">
                  <UserRound className="mr-2 h-4 w-4" />
                  Account
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="hidden rounded-xl px-4 sm:inline-flex border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 hover:text-rose-700 transition-all duration-200"
                onClick={() => setIsLogoutOpen(true)}
                disabled={isLoggingOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <Button
              asChild
              className="hidden rounded-xl bg-[#4285F4] px-4 hover:bg-[#3777dd] sm:inline-flex"
            >
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent className="max-w-md p-6 bg-white border border-slate-200 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <LogOut className="h-5 w-5 text-rose-500" /> Confirm Log Out
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm mt-2">
              Are you sure you want to log out from your account? You will need
              to log back in to manage your workspace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsLogoutOpen(false)}
              className="rounded-xl px-4 py-2 border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-xl px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />{' '}
                  Logging out...
                </>
              ) : (
                'Yes, Log out'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
