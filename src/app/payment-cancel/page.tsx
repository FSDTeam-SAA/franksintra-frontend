'use client'

import * as React from 'react'
import Link from 'next/link'
import { XCircle, ArrowLeft } from 'lucide-react'

import { AppHeader } from '@/components/gbp/AppHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(66,133,244,0.16),_transparent_32rem),linear-gradient(180deg,_#f8fbff_0%,_#f5f7fb_48%,_#ffffff_100%)] text-slate-900">
      <AppHeader />

      <main className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-20 sm:px-6">
        <Card className="w-full overflow-hidden rounded-[2rem] border-slate-200 bg-white/85 shadow-xl backdrop-blur">
          <CardContent className="flex flex-col items-center p-8 text-center sm:p-12">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <XCircle className="h-10 w-10" />
            </div>
            
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Payment Cancelled
            </h1>
            
            <p className="mb-8 text-base text-slate-600">
              Your checkout process was interrupted. No charges were made. You can try again whenever you&apos;re ready.
            </p>

            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline" className="flex-1 rounded-xl h-12 text-base font-semibold border-slate-300">
                <Link href="/subscription">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Plans
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
