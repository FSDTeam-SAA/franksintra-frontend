'use client'

import * as React from 'react'
import {
  Check,
  ChevronDown,
  Copy,
  History,
  ImagePlus,
  Loader2,
  MessageSquare,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import Image from 'next/image'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { AppHeader } from '@/components/gbp/AppHeader'
import { AiThinkingLoader } from '@/components/gbp/AiThinkingLoader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  getApiErrorMessage,
  formatAiContentForCopy,
  getDuplicateJobId,
  getJob,
  getJobsHistory,
  parseAiGeneratedContent,
  deleteJob,
  refineJob,
  uploadJob,
  type JobHistoryItem,
  type ParsedAiContent,
  type JobStatus,
} from '@/lib/jobs'

type HistoryStatus = 'Published' | 'Draft'
type GenerationMode = 'upload' | 'refine'
type RefineFieldKey = (typeof REFINE_FIELDS)[number]['key']

const REFINE_FIELDS = [
  {
    key: 'title',
    label: 'Title',
    description: 'Refine the main title shown in the content pack.',
    placeholder: 'Make the title clearer, shorter, or more appealing.',
  },
  {
    key: 'caption',
    label: 'Caption',
    description: 'Rewrite the short caption that goes with the image.',
    placeholder: 'Make the caption warmer, cleaner, or more engaging.',
  },
  {
    key: 'SEO_keywords',
    label: 'SEO Keywords',
    description: 'Improve search terms and local discoverability.',
    placeholder: 'Add city, service, or keyword ideas.',
  },
  {
    key: 'description',
    label: 'Description',
    description: 'Rewrite the business description in a clearer tone.',
    placeholder: 'Rewrite for clarity, trust, or conversion.',
  },
  {
    key: 'assign_location',
    label: 'Location',
    description: 'Set the location field used by the AI output.',
    placeholder: 'Add the city, area, or target location.',
  },
  {
    key: 'gmb_post',
    label: 'GMB Post',
    description: 'Refine the main copy that gets pasted into GMB.',
    placeholder: 'Make the post shorter, warmer, or more persuasive.',
  },
  {
    key: 'file_name',
    label: 'File Name',
    description: 'Create a cleaner file name for the asset.',
    placeholder: 'Rename the file with a useful, descriptive name.',
  },
] as const

const initialFieldInputs = REFINE_FIELDS.reduce((accumulator, field) => {
  accumulator[field.key] = ''
  return accumulator
}, {} as Record<RefineFieldKey, string>)

function getHistoryStatus(jobStatus: JobStatus): HistoryStatus {
  return jobStatus === 'DONE' ? 'Published' : 'Draft'
}

function getHistoricalPreviewText(job: JobHistoryItem) {
  return job.originalFilename.replace(/\.[^.]+$/, '')
}

function getRefineFieldLabel(fieldKey: RefineFieldKey) {
  return (
    REFINE_FIELDS.find((field) => field.key === fieldKey)?.label ?? fieldKey
  )
}

function getRefineFieldValue(
  fieldKey: RefineFieldKey,
  content: ParsedAiContent | null,
) {
  if (!content) return ''

  switch (fieldKey) {
    case 'title':
      return content.title
    case 'caption':
      return content.caption
    case 'SEO_keywords':
      return content.keywords.join(', ')
    case 'description':
      return content.description
    case 'assign_location':
      return content.location
    case 'gmb_post':
      return content.gmbPost
    case 'file_name':
      return content.fileName
    default:
      return ''
  }
}

function getPreviewImageClassName() {
  return 'h-[260px] w-full rounded-2xl object-contain bg-slate-50'
}

function RefineFieldCard({
  field,
  value,
  onChange,
  onSubmit,
  disabled,
  pending,
}: {
  field: (typeof REFINE_FIELDS)[number]
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled: boolean
  pending: boolean
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label className="text-sm font-semibold text-slate-900">
            {field.label}
          </Label>
          <p className="mt-1 text-sm text-slate-600">{field.description}</p>
        </div>
        {pending ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          className="min-h-24 rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 sm:text-[15px]"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            className="w-full rounded-xl bg-[#4285F4] px-4 text-sm hover:bg-[#3777dd] sm:w-auto sm:text-[15px]"
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Update
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const queryClient = useQueryClient()
  const postTextareaRef = React.useRef<HTMLTextAreaElement | null>(null)
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [activeJobId, setActiveJobId] = React.useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = React.useState<JobStatus | null>(null)
  const [generationMode, setGenerationMode] =
    React.useState<GenerationMode>('upload')
  const [postText, setPostText] = React.useState('')
  const [aiContent, setAiContent] = React.useState<ParsedAiContent | null>(null)
  const [extraDetailsOpen, setExtraDetailsOpen] = React.useState(false)
  const [extraDetails, setExtraDetails] = React.useState('')
  const [showRefinePanel, setShowRefinePanel] = React.useState(false)
  const [fieldInputs, setFieldInputs] =
    React.useState<Record<RefineFieldKey, string>>(initialFieldInputs)
  const [activeFieldKey, setActiveFieldKey] =
    React.useState<RefineFieldKey | null>(null)
  const [refineActivity, setRefineActivity] = React.useState<
    Array<{
      field: RefineFieldKey
      instruction: string
      response: string
      createdAt: string
    }>
  >([])
  const [copied, setCopied] = React.useState(false)
  const [deleteDialogJobId, setDeleteDialogJobId] = React.useState<string | null>(
    null,
  )

  const historyQuery = useQuery({
    queryKey: ['jobs-history'],
    queryFn: () => getJobsHistory(1, 8),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })

  const jobQuery = useQuery({
    queryKey: ['job', activeJobId],
    queryFn: () => getJob(activeJobId as string),
    enabled: Boolean(activeJobId),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    refetchIntervalInBackground: true,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'PENDING' || status === 'PROCESSING' ? 2000 : false
    },
  })

  const uploadMutation = useMutation({
    mutationFn: uploadJob,
    onMutate: async () => {
      setGenerationMode('upload')
      setCurrentStatus('PENDING')
      setPostText('')
      setAiContent(null)
      setRefineActivity([])
      setShowRefinePanel(false)
    },
    onSuccess: async (data) => {
      setActiveJobId(data.jobId)
      setCurrentStatus(data.status)
      toast.success('Image uploaded. AI processing started.')
      void queryClient.refetchQueries({ queryKey: ['job', data.jobId], exact: true })
      await queryClient.invalidateQueries({ queryKey: ['jobs-history'] })
    },
    onError: async (error) => {
      const duplicateJobId = getDuplicateJobId(error)
      if (duplicateJobId) {
        setActiveJobId(duplicateJobId)
        toast.info('This image already exists. Loading the existing job.')
        void queryClient.refetchQueries({ queryKey: ['job', duplicateJobId], exact: true })
        return
      }

      toast.error(getApiErrorMessage(error))
      setCurrentStatus(null)
    },
  })

  const refineMutation = useMutation({
    mutationFn: refineJob,
    onMutate: ({ update_field_name }) => {
      setGenerationMode('refine')
      setActiveFieldKey(update_field_name as RefineFieldKey)
      setCurrentStatus('PROCESSING')
    },
    onSuccess: async (data, variables) => {
      const parsed = parseAiGeneratedContent(data.ai_response)
      if (parsed) {
        setAiContent(parsed)
        setPostText(parsed.gmbPost || parsed.caption || parsed.description || '')
      } else {
        setPostText(data.ai_response)
      }
      setCurrentStatus('DONE')
      setFieldInputs((previous) => ({
        ...previous,
        [variables.update_field_name as RefineFieldKey]: '',
      }))
      setRefineActivity((previous) => [
        {
          field: variables.update_field_name as RefineFieldKey,
          instruction: variables.user_instruction,
          response:
            parsed?.gmbPost ||
            parsed?.caption ||
            parsed?.description ||
            data.ai_response,
          createdAt: new Date().toISOString(),
        },
        ...previous,
      ])

      toast.success(`Updated ${getRefineFieldLabel(variables.update_field_name as RefineFieldKey)}`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['job', activeJobId] }),
        queryClient.invalidateQueries({ queryKey: ['jobs-history'] }),
      ])
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
      setCurrentStatus('DONE')
    },
    onSettled: () => {
      setActiveFieldKey(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: async (_, jobId) => {
      toast.success('History item deleted')
      await queryClient.invalidateQueries({ queryKey: ['jobs-history'] })

      if (activeJobId === jobId) {
        setActiveJobId(null)
        setSelectedFile(null)
        setUploadedImage(null)
        setCurrentStatus(null)
        setPostText('')
        setAiContent(null)
        setRefineActivity([])
        setShowRefinePanel(false)
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })

  React.useEffect(() => {
    const job = jobQuery.data
    if (!job) return

    setCurrentStatus(job.status)
    setUploadedImage(job.originalCloudinaryUrl)

    if (job.status === 'DONE') {
      const parsed = parseAiGeneratedContent(job.aiRawResponse)
      setAiContent(parsed)
      setPostText(parsed?.gmbPost || parsed?.caption || parsed?.description || '')
    }

    if (job.status === 'FAILED') {
      toast.error(job.failureReason || 'AI processing failed')
    }
  }, [jobQuery.data])

  React.useEffect(() => {
    if (!jobQuery.isError) return

    setCurrentStatus(null)
    toast.error(getApiErrorMessage(jobQuery.error))
  }, [jobQuery.error, jobQuery.isError])

  React.useEffect(() => {
    if (!historyQuery.isError) return

    toast.error(getApiErrorMessage(historyQuery.error))
  }, [historyQuery.error, historyQuery.isError])

  const handleUpload = (file?: File) => {
    if (!file) return
    const localPreview = URL.createObjectURL(file)
    setUploadedImage(localPreview)
    setSelectedFile(file)
    setCurrentStatus(null)
    setActiveJobId(null)
    setPostText('')
    setAiContent(null)
    setRefineActivity([])
    setShowRefinePanel(false)
  }

  const handleGenerate = () => {
    if (!selectedFile) {
      toast.error('Upload an image first')
      return
    }

    uploadMutation.mutate(selectedFile)
  }

  const handleCopy = async () => {
    if (!displayPostText) return
    await navigator.clipboard.writeText(displayPostText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1100)
  }

  const handleCopyGmbPost = async () => {
    if (!aiContent?.gmbPost) return
    await navigator.clipboard.writeText(aiContent.gmbPost)
    setCopied(true)
    setTimeout(() => setCopied(false), 1100)
  }

  const handleCopyFullPackage = async () => {
    if (!aiContent) return
    await navigator.clipboard.writeText(formatAiContentForCopy(aiContent))
    setCopied(true)
    setTimeout(() => setCopied(false), 1100)
  }

  const handleDownload = (format: 'txt' | 'json') => {
    if (!aiContent) return

    const payload =
      format === 'json'
        ? JSON.stringify(aiContent, null, 2)
        : formatAiContentForCopy(aiContent)

    const blob = new Blob([payload], {
      type: format === 'json' ? 'application/json' : 'text/plain',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gbp-ai-response.${format}`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDeleteHistoryItem = (jobId: string) => {
    setDeleteDialogJobId(jobId)
  }

  const handleOpenHistoryJob = (item: JobHistoryItem) => {
    setActiveJobId(item._id)
    setSelectedFile(null)
    setUploadedImage(item.originalCloudinaryUrl)
    setCurrentStatus(item.status)
    setGenerationMode('upload')
    setShowRefinePanel(false)
    void queryClient.refetchQueries({ queryKey: ['job', item._id], exact: true })
  }

  const confirmDeleteHistoryItem = () => {
    if (!deleteDialogJobId) return

    deleteMutation.mutate(deleteDialogJobId, {
      onSettled: () => {
        setDeleteDialogJobId(null)
      },
    })
  }

  const submitRefineField = (field: RefineFieldKey) => {
    if (!activeJobId) {
      toast.error('Upload an image first')
      return
    }

    if (currentStatus !== 'DONE') {
      toast.error('Wait until the current job finishes processing.')
      return
    }

    const instruction = fieldInputs[field].trim()
    if (!instruction) {
      toast.error('Add a short instruction for this field.')
      return
    }

    refineMutation.mutate({
      jobId: activeJobId,
      update_field_name: field,
      user_instruction: instruction,
    })
  }

  const historyItems = historyQuery.data?.jobs ?? []
  const isGenerating =
    uploadMutation.isPending ||
    refineMutation.isPending ||
    jobQuery.isFetching ||
    currentStatus === 'PENDING' ||
    currentStatus === 'PROCESSING'
  const activeJob = jobQuery.data
  const displayPostText = postText || aiContent?.gmbPost || ''
  const shouldShowReadyState =
    Boolean(activeJobId) && currentStatus === 'DONE' && Boolean(aiContent)
  const deleteTargetJob = historyItems.find((item) => item._id === deleteDialogJobId)

  React.useEffect(() => {
    const textarea = postTextareaRef.current
    if (!textarea) return

    textarea.style.height = '0px'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [displayPostText])

  React.useEffect(() => {
    if (!aiContent) return

    setFieldInputs((previous) => ({
      ...previous,
      title: getRefineFieldValue('title', aiContent),
      caption: getRefineFieldValue('caption', aiContent),
      SEO_keywords: getRefineFieldValue('SEO_keywords', aiContent),
      description: getRefineFieldValue('description', aiContent),
      assign_location: getRefineFieldValue('assign_location', aiContent),
      gmb_post: getRefineFieldValue('gmb_post', aiContent),
      file_name: getRefineFieldValue('file_name', aiContent),
    }))
  }, [aiContent])

  const HistoryList = () => (
    <div className="space-y-3">
      {historyQuery.isLoading ? (
        <div className="space-y-3 rounded-3xl border bg-white p-3 sm:p-4">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500">Loading recent jobs...</p>
        </div>
      ) : historyQuery.isError ? (
        <div className="rounded-3xl border bg-white p-3 text-sm text-rose-600 sm:p-4">
          Failed to load job history.
        </div>
      ) : historyItems.length ? (
        historyItems.map((item) => (
          <Card
            key={item._id}
            className="rounded-2xl border bg-white p-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex w-full flex-col gap-3 rounded-2xl px-3 py-3 sm:flex-row sm:items-start">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
                onClick={() => handleOpenHistoryJob(item)}
              >
                <Image
                  src={item.originalCloudinaryUrl}
                  alt={item.originalFilename}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-14 w-14 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate pr-1 text-[15px] font-medium text-slate-900 md:text-base">
                    {getHistoricalPreviewText(item)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-sm',
                        getHistoryStatus(item.status) === 'Published' &&
                          'bg-emerald-100 text-emerald-700',
                        getHistoryStatus(item.status) === 'Draft' &&
                          'bg-slate-100 text-slate-600',
                      )}
                    >
                      {getHistoryStatus(item.status)}
                    </Badge>
                    <span className="text-sm text-slate-500">
                      {item.status === 'DONE' ? 'AI done' : 'Waiting for AI'}
                    </span>
                  </div>
                </div>
              </button>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="self-end shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-600 sm:self-auto"
                onClick={() => handleDeleteHistoryItem(item._id)}
                disabled={deleteMutation.isPending}
                aria-label={`Delete ${item.originalFilename}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))
      ) : (
        <div className="rounded-3xl border bg-white p-4 text-sm text-slate-500">
          No backend history yet.
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-[15px] text-slate-900 md:text-base">
      <AppHeader />

      <main className="mx-auto grid max-w-7xl items-start gap-4 px-3 py-4 sm:px-4 md:grid-cols-5 md:gap-6 md:px-6 md:py-6">
        <section className="flex w-full flex-col gap-4 md:col-span-3">
          <Card className="block h-auto min-h-fit w-full overflow-visible rounded-2xl border-slate-200 p-3 shadow-sm transition-all duration-300 hover:shadow-md box-border sm:p-4 md:p-5">
            <CardHeader className="p-0">
              <CardTitle className="text-lg sm:text-xl">Step 1 - Upload Image</CardTitle>
              <CardDescription className="pr-1 text-sm leading-6 sm:pr-2 sm:text-[15px]">
                Drop an image and the backend will create a job, store it, and
                hand it off to the AI pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <label className="group block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 transition-all duration-300 hover:border-[#4285F4] hover:bg-blue-50/40 sm:p-7">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleUpload(event.target.files?.[0])}
                />
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition group-hover:scale-105">
                    {uploadMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ImagePlus className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold sm:text-base">
                      Drag and drop image here
                    </p>
                    <p className="text-sm text-slate-500 sm:text-[15px]">
                      or click to browse from your device
                    </p>
                  </div>
                </div>
              </label>

              {uploadedImage && (
                <div className="rounded-2xl border bg-white p-3 transition-all duration-300 animate-in fade-in sm:p-4">
                  <p className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-500">
                    Uploaded Preview
                  </p>
                  <Image
                    src={uploadedImage}
                    alt="uploaded"
                    width={1200}
                    height={800}
                    unoptimized
                    className={getPreviewImageClassName()}
                  />
                </div>
              )}

              <div className="rounded-2xl border bg-white p-3 sm:p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 sm:text-sm">
                      Generate
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Select an image, then click the button to start AI generation.
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="w-full rounded-xl bg-[#4285F4] px-5 text-base hover:bg-[#3777dd] sm:w-auto"
                    onClick={handleGenerate}
                    disabled={!selectedFile || uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Generate content
                  </Button>
                </div>
              </div>

              <Card className="rounded-2xl border bg-white p-0">
                <Accordion
                  value={extraDetailsOpen ? ['details'] : []}
                  className="w-full"
                >
                  <AccordionItem value="details" className="border-0 px-4">
                    <AccordionTrigger
                      onClick={() => setExtraDetailsOpen((value) => !value)}
                      className="py-4 text-sm font-medium hover:no-underline sm:text-base"
                    >
                      Add extra details (optional)
                    </AccordionTrigger>
                    <AccordionContent className="border-t pt-4 animate-in fade-in slide-in-from-top-1 duration-300">
                      <Input
                        value={extraDetails}
                        onChange={(event) => setExtraDetails(event.target.value)}
                        placeholder="Mention your weekend discount or focus on eco-friendly packaging"
                        disabled={isGenerating}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>

              {shouldShowReadyState && (
                <Card className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 sm:text-[15px]">
                  AI job is ready. Open the refine panel or copy the GMB-ready
                  output.
                </Card>
              )}
            </CardContent>
          </Card>

          <Card className="block h-auto min-h-fit w-full overflow-visible rounded-2xl border-slate-200 p-3 shadow-sm transition-all duration-300 hover:shadow-md box-border sm:p-4 md:p-5">
            <CardHeader className="p-0">
              <CardTitle className="text-lg sm:text-xl">
                Step 2 - AI Generated Content
              </CardTitle>
              <CardDescription className="pr-1 text-sm leading-6 sm:pr-2 sm:text-[15px]">
                The output below comes from the backend job status and AI
                response, not a local mock.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              {isGenerating ? (
                <AiThinkingLoader active mode={generationMode} />
              ) : (
                <div className="min-h-[420px] rounded-2xl border bg-white p-3 animate-in fade-in duration-300 sm:min-h-[480px] sm:p-3.5">
                  <Textarea
                    ref={postTextareaRef}
                    value={displayPostText}
                    onChange={(event) => setPostText(event.target.value)}
                    className="min-h-72 resize-none overflow-hidden rounded-xl border-0 bg-slate-50 px-4 py-3 text-sm leading-7 md:min-h-[340px] md:text-base"
                    placeholder="Generated GMB-ready post will appear here"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  variant="outline"
                  className="w-full rounded-xl px-4 text-sm transition-all duration-300 hover:-translate-y-0.5 sm:w-auto sm:text-[15px]"
                  onClick={() => setShowRefinePanel((value) => !value)}
                  disabled={!activeJobId}
                >
                  <Wand2 className="mr-2 h-4 w-4" /> Refine
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl px-4 text-sm transition-all duration-300 hover:-translate-y-0.5 sm:w-auto sm:text-[15px]"
                  onClick={handleCopy}
                  disabled={isGenerating || !displayPostText}
                >
                  {copied ? (
                    <Check className="mr-2 h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copied ? 'Copied' : 'Copy Post'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl px-4 text-sm transition-all duration-300 hover:-translate-y-0.5 sm:w-auto sm:text-[15px]"
                  onClick={handleCopyFullPackage}
                  disabled={isGenerating || !aiContent}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Full Pack
                </Button>
              </div>

              {showRefinePanel && (
                <div className="space-y-3 rounded-3xl border bg-slate-50 p-3 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:p-4">
                  <div className="space-y-3">
                    {REFINE_FIELDS.map((field) => (
                      <RefineFieldCard
                        key={field.key}
                        field={field}
                        value={fieldInputs[field.key]}
                        onChange={(value) =>
                          setFieldInputs((previous) => ({
                            ...previous,
                            [field.key]: value,
                          }))
                        }
                        onSubmit={() => submitRefineField(field.key)}
                        disabled={refineMutation.isPending || currentStatus !== 'DONE'}
                        pending={activeFieldKey === field.key}
                      />
                    ))}
                  </div>

                  {!!refineActivity.length && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-3 sm:p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Recent refine activity
                      </p>
                      <div className="mt-3 space-y-3">
                        {refineActivity.map((entry) => (
                          <div
                            key={`${entry.field}-${entry.createdAt}`}
                            className="rounded-2xl bg-slate-50 px-3 py-3 sm:px-4"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="rounded-full px-2.5 py-0.5 text-xs"
                              >
                                {getRefineFieldLabel(entry.field)}
                              </Badge>
                              <span className="text-sm text-slate-500">
                                {new Date(entry.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              {entry.instruction}
                            </p>
                            <p className="mt-2 rounded-xl bg-white px-3 py-2 text-sm leading-6 text-slate-600 shadow-sm">
                              {entry.response}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="block h-auto min-h-fit w-full overflow-visible rounded-2xl border-slate-200 p-3 shadow-sm transition-all duration-300 hover:shadow-md box-border sm:p-4">
            <CardHeader className="p-0">
              <CardTitle className="text-lg sm:text-xl">Step 3 - Export & Copy</CardTitle>
              <CardDescription className="pr-1 text-sm leading-6 sm:pr-2 sm:text-[15px]">
                Copy the post, export the full content pack, or download it for later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className="w-full rounded-xl px-4 text-sm sm:w-auto sm:text-[15px]"
                    >
                      Export <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleCopyGmbPost}>
                    Copy Post
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyFullPackage}>
                    Copy Full Pack
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('txt')}>
                    Download as .txt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('json')}>
                    Download as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>

          <Card className="h-auto min-h-fit w-full overflow-visible rounded-2xl border-slate-200 p-3 shadow-sm md:hidden box-border">
            <CardHeader className="flex-row items-center justify-between space-y-0 p-0">
              <div>
                <CardTitle className="text-lg">History</CardTitle>
                <CardDescription className="text-sm">
                  Past backend jobs
                </CardDescription>
              </div>
              <Sheet>
                <SheetTrigger
                  render={
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <History className="mr-2 h-4 w-4" /> Open
                    </Button>
                  }
                />
                <SheetContent
                  side="bottom"
                  className="max-h-[80vh] overflow-y-auto px-3 pb-4 sm:px-4"
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

        <aside
          id="history"
          className="flex w-full scroll-mt-24 flex-col gap-4 box-border md:col-span-2"
        >
          <Card className="relative z-0 h-auto min-h-fit w-full shrink-0 overflow-visible rounded-2xl border-slate-200 p-3 shadow-sm transition-all duration-300 hover:shadow-md box-border sm:p-4">
            <CardHeader className="p-0">
              <CardTitle className="text-lg sm:text-xl">Live Post Preview</CardTitle>
              <CardDescription className="pr-1 text-sm leading-6 sm:pr-2 sm:text-[15px]">
                How this appears on Google Business Profile
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-2xl border bg-white p-3 sm:p-4">
                {uploadedImage ? (
                  <Image
                    src={uploadedImage}
                    alt="preview"
                    width={1200}
                    height={800}
                    unoptimized
                    className={getPreviewImageClassName()}
                  />
                ) : (
                  <div className="grid h-36 place-items-center rounded-xl bg-slate-100 px-4 text-center text-sm text-slate-500 sm:h-40 sm:text-[15px]">
                    Image preview
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
                    {currentStatus ?? 'No job'}
                  </Badge>
                  {activeJob?.originalFilename ? (
                    <span className="text-sm text-slate-500">
                      {activeJob.originalFilename}
                    </span>
                  ) : null}
                </div>

                {aiContent ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                      <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                        {aiContent.title || 'AI generated content'}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {aiContent.caption || 'No caption returned by the AI service.'}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      <div className="rounded-2xl border bg-white p-3">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                          SEO Keywords
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {aiContent.keywords.length ? (
                            aiContent.keywords.map((keyword) => (
                              <Badge
                                key={keyword}
                                variant="secondary"
                                className="rounded-full bg-slate-100 px-3 py-1 text-slate-700"
                              >
                                {keyword}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500">
                              No keywords returned.
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border bg-white p-3">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                          Description
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {aiContent.description || 'No description returned by the AI service.'}
                        </p>
                      </div>

                      <div className="rounded-2xl border bg-white p-3">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                          Google Business Profile Post
                        </p>
                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 whitespace-pre-wrap text-slate-700">
                          {aiContent.gmbPost || 'No GMB post returned by the AI service.'}
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-1">
                        <div className="rounded-2xl border bg-white p-3">
                          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                            File name
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {aiContent.fileName || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 pr-1 text-sm leading-7 text-slate-700 md:text-base">
                    Your generated GBP post will show here after the backend job finishes.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="relative z-0 hidden h-auto min-h-fit w-full shrink-0 overflow-visible rounded-2xl border-slate-200 p-4 shadow-sm box-border md:block">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MessageSquare className="h-5 w-5" /> History
              </CardTitle>
              <CardDescription className="pr-1 text-sm leading-6 sm:pr-2 sm:text-[15px]">
                Grouped by recent backend jobs
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <HistoryList />
            </CardContent>
          </Card>
        </aside>
      </main>

      <Dialog
        open={Boolean(deleteDialogJobId)}
        onOpenChange={(open) => {
          if (!open) setDeleteDialogJobId(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete history item?</DialogTitle>
            <DialogDescription>
              {deleteTargetJob
                ? `This will remove ${deleteTargetJob.originalFilename}, the Cloudinary image, and the AI session.`
                : 'This will remove the job, Cloudinary image, and AI session.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogJobId(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteHistoryItem}
              disabled={deleteMutation.isPending || !deleteDialogJobId}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
