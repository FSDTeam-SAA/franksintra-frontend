'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  BadgeCheck,
  ImagePlus,
  Loader2,
  MessageSquare,
  Sparkles,
  Wand2,
} from 'lucide-react'

import { cn } from '@/lib/utils'

type GenerationMode = 'upload' | 'regenerate' | 'refine'

type Step = {
  title: string
  detail: string
  icon: ReactNode
}

type AiThinkingLoaderProps = {
  active: boolean
  mode: GenerationMode
  className?: string
}

const MODE_CONFIG: Record<
  GenerationMode,
  {
    badge: string
    title: string
    lead: string
    footer: string
    steps: Step[]
  }
> = {
  upload: {
    badge: 'upload flow',
    title: 'Reading the image',
    lead: 'The backend has the file. We are waiting for the AI team to extract context, spot duplicates, and draft the first response.',
    footer: 'Backend flow: PENDING -> PROCESSING -> DONE',
    steps: [
      {
        title: 'Upload received',
        detail: 'The image is moving to Cloudinary and being registered as a new job.',
        icon: <ImagePlus className="h-4 w-4" />,
      },
      {
        title: 'Visual scan',
        detail: 'AI is reading composition, subject, and business cues.',
        icon: <Sparkles className="h-4 w-4" />,
      },
      {
        title: 'Duplicate check',
        detail: 'The backend compares the image hash with previous jobs.',
        icon: <BadgeCheck className="h-4 w-4" />,
      },
      {
        title: 'Drafting response',
        detail: 'The final aiRawResponse is being prepared for the UI.',
        icon: <MessageSquare className="h-4 w-4" />,
      },
    ],
  },
  regenerate: {
    badge: 'regenerate flow',
    title: 'Refreshing the copy',
    lead: 'The backend is reusing the same AI session and asking for a new version with a different tone or structure.',
    footer: 'This keeps the conversation context intact while improving the output.',
    steps: [
      {
        title: 'Context loaded',
        detail: 'The previous session id is being reused.',
        icon: <MessageSquare className="h-4 w-4" />,
      },
      {
        title: 'New variation',
        detail: 'AI is rewriting the post with a fresh angle.',
        icon: <Wand2 className="h-4 w-4" />,
      },
      {
        title: 'Polish pass',
        detail: 'CTA, tone, and local intent are being tightened.',
        icon: <Sparkles className="h-4 w-4" />,
      },
      {
        title: 'Ready to copy',
        detail: 'The updated response is almost ready for review.',
        icon: <BadgeCheck className="h-4 w-4" />,
      },
    ],
  },
  refine: {
    badge: 'refine flow',
    title: 'Applying your feedback',
    lead: 'Your instruction is being merged into the AI session so the next response stays on-brand and stays useful.',
    footer: 'This is the best place to show that the backend is listening and not just spinning.',
    steps: [
      {
        title: 'Instruction received',
        detail: 'The user note has been queued for the AI session.',
        icon: <MessageSquare className="h-4 w-4" />,
      },
      {
        title: 'Rewrite in progress',
        detail: 'The response is being reshaped around your feedback.',
        icon: <Wand2 className="h-4 w-4" />,
      },
      {
        title: 'Tone alignment',
        detail: 'The copy is being tuned for clarity and conversion.',
        icon: <Sparkles className="h-4 w-4" />,
      },
      {
        title: 'Final check',
        detail: 'The backend is preparing the updated ai_response payload.',
        icon: <BadgeCheck className="h-4 w-4" />,
      },
    ],
  },
}

export function AiThinkingLoader({
  active,
  mode,
  className,
}: AiThinkingLoaderProps) {
  const [activeStep, setActiveStep] = useState(0)
  const config = MODE_CONFIG[mode]

  useEffect(() => {
    if (!active) {
      setActiveStep(0)
      return
    }

    setActiveStep(0)
    const interval = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % config.steps.length)
    }, 850)

    return () => window.clearInterval(interval)
  }, [active, config.steps.length, mode])

  if (!active) {
    return null
  }

  const progress = ((activeStep + 1) / config.steps.length) * 100

  return (
    <div
      className={cn(
        'rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4 shadow-sm',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-600 text-white shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">
              AI is thinking
            </p>
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-700">
              {config.badge}
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {config.lead}
          </p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 grid gap-2">
        {config.steps.map((step, index) => {
          const isActive = index === activeStep
          const isComplete = index < activeStep

          return (
            <div
              key={step.title}
              className={cn(
                'flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-all duration-300',
                isActive
                  ? 'border-sky-200 bg-white shadow-sm'
                  : 'border-transparent bg-white/60',
              )}
            >
              <div
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-xl',
                  isActive ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500',
                )}
              >
                {isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  step.icon
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{step.title}</p>
                <p className="text-sm text-slate-600">{step.detail}</p>
              </div>

              {isComplete ? (
                <BadgeCheck className="h-4 w-4 text-emerald-500" />
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-sky-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
        <span className="font-medium text-slate-900">{config.title}:</span>{' '}
        {config.footer}
      </div>
    </div>
  )
}
