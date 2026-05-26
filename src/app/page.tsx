'use client'

import * as React from 'react'
import {
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  History,
  ImagePlus,
  Loader2,
  MessageSquare,
  Sparkles,
  Wand2,
} from 'lucide-react'

import { AppHeader } from '@/components/gbp/AppHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type HistoryStatus = 'Scheduled' | 'Published' | 'Draft'
type DotKind = 'offer' | 'post' | 'photo'

type HistoryItem = {
  id: string
  image: string
  title: string
  date: string
  status: HistoryStatus
  similarity: string
}

const MOCK_HISTORY: HistoryItem[] = [
  {
    id: '1',
    image:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
    title: 'Weekend brunch deal with fresh bakery add-ons now live.',
    date: 'May 24, 2026',
    status: 'Scheduled',
    similarity: '94% visual match',
  },
  {
    id: '2',
    image:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=200&q=80',
    title: 'Eco-friendly packaging update and reusable cup rewards.',
    date: 'May 20, 2026',
    status: 'Published',
    similarity: '88% visual match',
  },
  {
    id: '3',
    image:
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=200&q=80',
    title: 'New seasonal launch with limited-time in-store tasting.',
    date: 'May 18, 2026',
    status: 'Draft',
    similarity: '83% visual match',
  },
]

const MOCK_DOTS: Record<string, DotKind[]> = {
  '2026-05-27': ['offer'],
  '2026-05-29': ['post'],
  '2026-05-30': ['photo'],
  '2026-06-02': ['offer', 'post'],
}

const initialPost = `🌿 Fresh flavors are in for the weekend at Frank's Bistro!

Enjoy our chef-crafted seasonal menu made with local ingredients and sustainable packaging. Bring a friend and ask about our limited-time weekend discount.

Visit us today and turn your weekend into something delicious. 📍`

export default function Home() {
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [postText, setPostText] = React.useState('')
  const [extraDetailsOpen, setExtraDetailsOpen] = React.useState(false)
  const [extraDetails, setExtraDetails] = React.useState('')
  const [showRefineInput, setShowRefineInput] = React.useState(false)
  const [refineInput, setRefineInput] = React.useState('')
  const [refineHistory, setRefineHistory] = React.useState<
    Array<{ role: 'user' | 'ai'; text: string }>
  >([])
  const [copied, setCopied] = React.useState(false)
  const [scheduleMode, setScheduleMode] = React.useState<'auto' | 'manual'>(
    'auto',
  )
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    new Date(2026, 4, 30),
  )
  const [gmbConnected, setGmbConnected] = React.useState(false)
  const [lastSaved, setLastSaved] = React.useState(new Date())

  React.useEffect(() => {
    if (!postText) return
    const t = setTimeout(() => setLastSaved(new Date()), 450)
    return () => clearTimeout(t)
  }, [postText, refineHistory])

  const handleUpload = (file?: File) => {
    if (!file) return
    const localUrl = URL.createObjectURL(file)
    setUploadedImage(localUrl)
    setIsGenerating(true)
    setShowRefineInput(false)
    setRefineHistory([])

    setTimeout(() => {
      setPostText(initialPost)
      setIsGenerating(false)
      setLastSaved(new Date())
    }, 1300)
  }

  const handleRegenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setPostText(`✨ New week, new reasons to stop by Frank's Bistro.

From eco-friendly takeout packaging to handpicked seasonal specials, we've made your local favorite even better. Drop in this week and discover your next go-to order.

Tap directions and visit us today!`)
      setIsGenerating(false)
      setLastSaved(new Date())
    }, 1000)
  }

  const handleCopy = async () => {
    if (!postText) return
    await navigator.clipboard.writeText(postText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1100)
  }

  const submitRefine = () => {
    if (!refineInput.trim()) return
    const userMsg = refineInput.trim()
    const aiMsg = 'Shortened with a stronger CTA and local SEO keywords.'
    setRefineHistory(prev => [
      ...prev,
      { role: 'user', text: userMsg },
      { role: 'ai', text: aiMsg },
    ])
    setPostText(`📣 Weekend special at Frank's Bistro!

Enjoy fresh seasonal dishes, eco-friendly packaging, and a limited-time local discount. Visit today and ask our team for the weekend offer.`)
    setRefineInput('')
  }

  const dayDots = (date: Date) => {
    const key = date.toISOString().slice(0, 10)
    return MOCK_DOTS[key] ?? []
  }

  const HistoryList = () => (
    <div className="space-y-3">
      {MOCK_HISTORY.map(item => (
        <Card
          key={item.id}
          className="rounded-2xl border bg-white p-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm"
        >
          <Button
            type="button"
            variant="ghost"
            className="h-auto w-full justify-start rounded-2xl px-3 py-3 text-left"
            onClick={() => {
              setUploadedImage(item.image)
              setPostText(item.title + '\n\n' + initialPost.split('\n\n')[1])
            }}
          >
            <div className="flex w-full items-start gap-3">
              <img
                src={item.image}
                alt="history thumb"
                className="h-14 w-14 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate pr-1 text-[15px] font-medium text-slate-900 md:text-base">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-slate-500">{item.date}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-sm',
                      item.status === 'Published' &&
                        'bg-emerald-100 text-emerald-700',
                      item.status === 'Scheduled' &&
                        'bg-blue-100 text-blue-700',
                      item.status === 'Draft' && 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {item.status}
                  </Badge>
                  <span className="text-sm text-slate-500">
                    {item.similarity}
                  </span>
                </div>
              </div>
            </div>
          </Button>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-[15px] text-slate-900 md:text-base">
      <AppHeader />

      <main className="mx-auto grid max-w-7xl items-start gap-6 px-4 py-6 md:grid-cols-5 md:px-6">
        <section className="flex w-full flex-col gap-4 md:col-span-3">
          <Card className="block h-auto min-h-fit w-full overflow-visible rounded-2xl border-slate-200 p-4 shadow-sm transition-all duration-300 hover:shadow-md box-border">
            <CardHeader className="p-0">
              <CardTitle className="text-xl">Step 1 - Upload Image</CardTitle>
              <CardDescription className="pr-2 text-[15px] leading-6">
                Drop an image and AI starts generating instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <label className="group block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-7 transition-all duration-300 hover:border-[#4285F4] hover:bg-blue-50/40">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleUpload(e.target.files?.[0])}
                />
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition group-hover:scale-105">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">
                      Drag and drop image here
                    </p>
                    <p className="text-[15px] text-slate-500">
                      or click to browse from your device
                    </p>
                  </div>
                </div>
              </label>

              {uploadedImage && (
                <div className="rounded-2xl border bg-white p-4 transition-all duration-300 animate-in fade-in">
                  <p className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-500">
                    Uploaded Preview
                  </p>
                  <img
                    src={uploadedImage}
                    alt="uploaded"
                    className="h-44 w-full rounded-xl object-cover"
                  />
                </div>
              )}

              <Card className="rounded-2xl border bg-white p-0">
                <Accordion
                  type="single"
                  value={extraDetailsOpen ? 'details' : ''}
                  className="w-full"
                >
                  <AccordionItem value="details" className="border-0 px-4">
                    <AccordionTrigger
                      onClick={() => setExtraDetailsOpen(v => !v)}
                      className="py-4 text-base font-medium hover:no-underline"
                    >
                      Add extra details (optional)
                    </AccordionTrigger>
                    <AccordionContent className="border-t pt-4 animate-in fade-in slide-in-from-top-1 duration-300">
                      <Input
                        value={extraDetails}
                        onChange={e => setExtraDetails(e.target.value)}
                        placeholder="Mention our weekend discount or focus on eco-friendly packaging"
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>

              {uploadedImage && (
                <Card className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-[15px] text-blue-700">
                  We found a previous post for a similar image -{' '}
                  <Button
                    variant="link"
                    className="h-auto p-0 text-[15px] font-semibold text-blue-700 underline"
                  >
                    View History
                  </Button>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card className="block h-auto min-h-fit w-full overflow-visible rounded-2xl border-slate-200 p-4 shadow-sm transition-all duration-300 hover:shadow-md box-border">
            <CardHeader className="p-0">
              <CardTitle className="text-xl">
                Step 2 - AI Generated Content
              </CardTitle>
              <CardDescription className="pr-2 text-[15px] leading-6">
                Auto-saved draft • Last saved{' '}
                {lastSaved.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              {isGenerating ? (
                <div className="space-y-3 rounded-2xl border bg-white p-4">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              ) : (
                <div className="rounded-2xl border bg-white p-3.5 animate-in fade-in duration-300">
                  <Textarea
                    value={postText}
                    onChange={e => setPostText(e.target.value)}
                    className="min-h-48 resize-y rounded-xl border-0 bg-slate-50 px-4 py-3 text-[15px] leading-7 md:text-base"
                    placeholder="Generated GBP post will appear here"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl px-4 text-[15px] transition-all duration-300 hover:-translate-y-0.5"
                  onClick={() => setShowRefineInput(v => !v)}
                >
                  <Wand2 className="mr-2 h-4 w-4" /> Refine
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl px-4 text-[15px] transition-all duration-300 hover:-translate-y-0.5"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="mr-2 h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl px-4 text-[15px] transition-all duration-300 hover:-translate-y-0.5"
                  onClick={handleRegenerate}
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}{' '}
                  Regenerate
                </Button>
              </div>

              {showRefineInput && (
                <div className="rounded-2xl border bg-white p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Label className="mb-2 block text-sm uppercase tracking-wide text-slate-500">
                    Refine with AI
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={refineInput}
                      onChange={e => setRefineInput(e.target.value)}
                      placeholder='Try "make it shorter" or "add CTA"'
                    />
                    <Button onClick={submitRefine}>Send</Button>
                  </div>
                  {!!refineHistory.length && (
                    <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
                      {refineHistory.map((msg, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'max-w-[90%] rounded-xl px-3 py-2.5 text-[15px] leading-6',
                            msg.role === 'user'
                              ? 'ml-auto bg-[#4285F4] text-white'
                              : 'bg-white text-slate-700 shadow-sm',
                          )}
                        >
                          {msg.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="block h-auto min-h-fit w-full overflow-visible rounded-2xl border-slate-200 p-4 shadow-sm transition-all duration-300 hover:shadow-md box-border">
            <CardHeader className="p-0">
              <CardTitle className="text-xl">
                Step 3 - Publish Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setScheduleMode('auto')}
                  className={cn(
                    'h-auto min-h-[92px] flex-col items-start justify-start rounded-2xl px-4 py-3 text-left transition-all duration-300 hover:-translate-y-0.5',
                    scheduleMode === 'auto'
                      ? 'border-[#4285F4] bg-blue-50'
                      : 'bg-white',
                  )}
                >
                  <p className="text-base font-medium">🤖 Auto Schedule</p>
                  <p className="mt-1 text-[15px] text-slate-600">
                    Suggested: May 30, 2026 • 11:30 AM
                  </p>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setScheduleMode('manual')}
                  className={cn(
                    'h-auto min-h-[92px] flex-col items-start justify-start rounded-2xl px-4 py-3 text-left transition-all duration-300 hover:-translate-y-0.5',
                    scheduleMode === 'manual'
                      ? 'border-[#4285F4] bg-blue-50'
                      : 'bg-white',
                  )}
                >
                  <p className="text-base font-medium">📅 Manual Schedule</p>
                  <p className="mt-1 text-[15px] text-slate-600">
                    Pick date from calendar panel
                  </p>
                </Button>
              </div>

              <div className="rounded-2xl border bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[15px]">
                  <span className="font-medium">
                    Google Business Profile connection
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1',
                      gmbConnected ? 'text-emerald-600' : 'text-slate-500',
                    )}
                  >
                    <BadgeCheck className="h-4 w-4" />{' '}
                    {gmbConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <Button
                  className="w-full rounded-xl bg-[#4285F4] text-base hover:bg-[#3777dd]"
                  onClick={() => setGmbConnected(v => !v)}
                >
                  Sync to GMB
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-xl px-4 text-[15px]"
                  >
                    Export <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleCopy}>
                    Copy Text
                  </DropdownMenuItem>
                  <DropdownMenuItem>Download as .txt</DropdownMenuItem>
                  <DropdownMenuItem>Download as JSON</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>

          <Card className="h-auto min-h-fit w-full overflow-visible rounded-2xl border-slate-200 p-4 shadow-sm md:hidden box-border">
            <CardHeader className="flex-row items-center justify-between space-y-0 p-0">
              <div>
                <CardTitle className="text-xl">History</CardTitle>
                <CardDescription className="text-[15px]">
                  Past generated posts
                </CardDescription>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <History className="mr-2 h-4 w-4" /> Open
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="max-h-[80vh] overflow-y-auto"
                >
                  <SheetHeader>
                    <SheetTitle>History</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <HistoryList />
                  </div>
                </SheetContent>
              </Sheet>
            </CardHeader>
          </Card>
        </section>

        <aside className="flex w-full flex-col gap-4 box-border md:col-span-2">
          <Card className="relative z-0 h-auto min-h-fit w-full shrink-0 overflow-visible rounded-2xl border-slate-200 p-4 shadow-sm transition-all duration-300 hover:shadow-md box-border">
            <CardHeader className="p-0">
              <CardTitle className="text-xl">Live Post Preview</CardTitle>
              <CardDescription className="pr-2 text-[15px] leading-6">
                How this appears on Google Business Profile
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-2xl border bg-white p-4">
                {uploadedImage ? (
                  <img
                    src={uploadedImage}
                    alt="preview"
                    className="h-40 w-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid h-40 place-items-center rounded-xl bg-slate-100 px-4 text-center text-[15px] text-slate-500">
                    Image preview
                  </div>
                )}
                <p className="mt-4 pr-1 text-[15px] leading-7 text-slate-700 md:text-base">
                  {postText ||
                    'Your generated GBP post will show here after image upload.'}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  in {scheduleMode === 'auto' ? '5' : '2'} days
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative z-0 h-auto min-h-fit w-full shrink-0 overflow-visible rounded-2xl border-slate-200 p-4 shadow-sm transition-all duration-300 hover:shadow-md box-border">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CalendarDays className="h-5 w-5" /> Publishing Calendar
              </CardTitle>
              <CardDescription className="pr-2 text-[15px] leading-6">
                Green = Offer, Blue = Post, Amber = Photo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="w-full rounded-2xl border bg-white p-2 box-border">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="w-full p-0"
                  classNames={{
                    root: 'w-full box-border',
                    months: 'w-full',
                    month: 'w-full space-y-4',
                    nav: 'relative flex w-full items-center justify-between',
                    month_caption:
                      'flex h-10 w-full items-center justify-center px-8',
                    caption_label: 'text-base font-semibold',
                    table: 'w-full border-collapse',
                    weekdays: 'grid w-full grid-cols-7 gap-y-1',
                    weekday:
                      'w-full text-center text-[0.82rem] font-medium text-muted-foreground',
                    week: 'mt-1 grid w-full grid-cols-7 gap-y-1',
                    day: 'relative flex w-full aspect-square p-0 text-center items-center justify-center',
                    day_button:
                      'w-full aspect-square h-auto min-w-0 rounded-xl px-5 text-sm transition-all duration-200 flex items-center justify-center',
                  }}
                  modifiers={{ marked: date => dayDots(date).length > 0 }}
                  modifiersClassNames={{
                    marked: 'font-semibold text-[#4285F4]',
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Offer
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Post
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Photo
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative z-0 hidden h-auto min-h-fit w-full shrink-0 overflow-visible rounded-2xl border-slate-200 p-4 shadow-sm box-border md:block">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 text-xl">
                <MessageSquare className="h-5 w-5" /> History
              </CardTitle>
              <CardDescription className="pr-2 text-[15px] leading-6">
                Grouped by similar images
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <HistoryList />
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  )
}
