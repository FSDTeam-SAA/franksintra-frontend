import type { Metadata } from 'next'
import './globals.css'
import { cn } from '@/lib/utils'
import { AppProvider } from '@/components/providers/AppProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'gmbpostingez',
  description: 'AI-assisted Google Business Profile content workflow',
  icons: {
    icon: '/images/image 1108.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={cn('min-h-screen bg-background font-sans antialiased')}>
        <AuthProvider>
          <AppProvider>
            {children}
            <Toaster />
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
