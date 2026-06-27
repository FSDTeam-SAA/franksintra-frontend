'use client'

export const dynamic = 'force-dynamic'

import * as React from 'react'
import {
  Building2,
  Check,
  Copy,
  History,
  ImagePlus,
  Loader2,
  MessageSquare,
  Pencil,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { AppHeader } from '@/components/gbp/AppHeader'
import { AiThinkingLoader } from '@/components/gbp/AiThinkingLoader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  getJobDisplayName,
  getJobsHistory,
  getPreferredJobImageUrl,
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
    label: 'Image Caption',
    description: 'Rewrite the short caption that goes with the image.',
    placeholder: 'Make the caption warmer, cleaner, or more engaging.',
  },
  {
    key: 'SEO_keywords',
    label: 'Image Keywords',
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
    hidden: true,
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

function createInitialFieldInputs() {
  return REFINE_FIELDS.reduce(
    (accumulator, field) => {
      accumulator[field.key] = ''
      return accumulator
    },
    {} as Record<RefineFieldKey, string>,
  )
}

function getHistoryStatus(jobStatus: JobStatus): HistoryStatus {
  return jobStatus === 'DONE' ? 'Published' : 'Draft'
}

function getHistoricalPreviewText(job: JobHistoryItem) {
  const name = getJobDisplayName(job)
  return name.replace(/\.[^.]+$/, '')
}

function getRefineFieldLabel(fieldKey: RefineFieldKey) {
  return REFINE_FIELDS.find(field => field.key === fieldKey)?.label ?? fieldKey
}

function getDownloadFilename(
  fileName: string,
  updatedImageUrl?: string | null,
) {
  const trimmedName = fileName.trim() || 'gbp-image.jpg'
  const hasExtension = /\.[^.]+$/.test(trimmedName)
  const prefix = updatedImageUrl ? 'updated-' : ''

  if (hasExtension) {
    return `${prefix}${trimmedName}`
  }

  return `${prefix}${trimmedName}.jpg`
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
          onChange={event => onChange(event.target.value)}
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

function HomeContent() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const postTextareaRef = React.useRef<HTMLTextAreaElement | null>(null)
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [activeJobId, setActiveJobId] = React.useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = React.useState<JobStatus | null>(
    null,
  )
  const [generationMode, setGenerationMode] =
    React.useState<GenerationMode>('upload')
  const [postText, setPostText] = React.useState('')
  const [aiContent, setAiContent] = React.useState<ParsedAiContent | null>(null)
  const [showRefinePanel, setShowRefinePanel] = React.useState(false)
  const [fieldInputs, setFieldInputs] = React.useState<
    Record<RefineFieldKey, string>
  >(() => createInitialFieldInputs())
  const [activeFieldKey, setActiveFieldKey] =
    React.useState<RefineFieldKey | null>(null)
  const [rightActiveFieldKey, setRightActiveFieldKey] =
    React.useState<RefineFieldKey | null>(null)
  const [assignLocation, setAssignLocation] = React.useState('')
  const [preferredInstructions, setPreferredInstructions] = React.useState('')
  const [companyName, setCompanyName] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const [deleteDialogJobId, setDeleteDialogJobId] = React.useState<
    string | null
  >(null)
  const [showGenerateDialog, setShowGenerateDialog] = React.useState(false)
  const [locationError, setLocationError] = React.useState('')

  const previousStatusRef = React.useRef<JobStatus | null>(null)

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
    refetchInterval: query => {
      const status = query.state.data?.status
      return status === 'PENDING' || status === 'PROCESSING' ? 2000 : false
    },
  })

  const uploadMutation = useMutation({
    mutationFn: ({
      file,
      location,
      instructions,
      companyName,
    }: {
      file: File
      location?: string
      instructions?: string
      companyName?: string
    }) => uploadJob(file, location, instructions, companyName),
    onMutate: async () => {
      setGenerationMode('upload')
      setCurrentStatus('PENDING')
      setPostText('')
      setAiContent(null)
      setShowRefinePanel(false)
    },
    onSuccess: async data => {
      setActiveJobId(data.jobId)
      setCurrentStatus(data.status)
      toast.success('Image uploaded. AI processing started.')
      void queryClient.refetchQueries({
        queryKey: ['job', data.jobId],
        exact: true,
      })
      await queryClient.invalidateQueries({ queryKey: ['jobs-history'] })
    },
    onError: async error => {
      const duplicateJobId = getDuplicateJobId(error)
      if (duplicateJobId) {
        setActiveJobId(duplicateJobId)
        toast.info('This image already exists. Loading the existing job.')
        void queryClient.refetchQueries({
          queryKey: ['job', duplicateJobId],
          exact: true,
        })
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
      const latestAiResponse =
        data.chatHistory?.[data.chatHistory.length - 1]?.ai_response ??
        data.ai_response

      const parsed = parseAiGeneratedContent(latestAiResponse)
      if (parsed) {
        setAiContent(parsed)
        setPostText(
          parsed.gmbPost || parsed.caption || parsed.description || '',
        )
      } else {
        setPostText('')
      }
      setCurrentStatus('DONE')
      setFieldInputs(previous => ({
        ...previous,
        [variables.update_field_name as RefineFieldKey]: '',
      }))
      toast.success(
        `Updated ${getRefineFieldLabel(variables.update_field_name as RefineFieldKey)}`,
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['job', activeJobId] }),
        queryClient.invalidateQueries({ queryKey: ['jobs-history'] }),
      ])
    },
    onError: error => {
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
        setShowRefinePanel(false)
      }
    },
    onError: error => {
      toast.error(getApiErrorMessage(error))
    },
  })

  React.useEffect(() => {
    const job = jobQuery.data
    if (!job) return

    const prevStatus = previousStatusRef.current
    previousStatusRef.current = job.status

    setCurrentStatus(job.status)
    setUploadedImage(getPreferredJobImageUrl(job))

    if (job.status === 'DONE') {
      if (prevStatus && prevStatus !== 'DONE') {
        void queryClient.invalidateQueries({ queryKey: ['jobs-history'] })
      }

      const latestAiResponse =
        job.latestAiResponse ??
        job.latestChatHistory?.ai_response ??
        job.aiRawResponse

      const parsed = parseAiGeneratedContent(latestAiResponse)
      setAiContent(parsed)
      setPostText(
        parsed?.gmbPost || parsed?.caption || parsed?.description || '',
      )
    }

    if (job.status === 'FAILED') {
      toast.error(job.failureReason || 'AI processing failed')
    }
  }, [jobQuery.data, queryClient])

  React.useEffect(() => {
    if (!jobQuery.isError) return

    setCurrentStatus(null)
    toast.error(getApiErrorMessage(jobQuery.error))
  }, [jobQuery.error, jobQuery.isError])

  React.useEffect(() => {
    if (!historyQuery.isError) return

    toast.error(getApiErrorMessage(historyQuery.error))
  }, [historyQuery.error, historyQuery.isError])

  const handleOpenHistoryJob = React.useCallback(
    (item: JobHistoryItem) => {
      setActiveJobId(item._id)
      setSelectedFile(null)
      setUploadedImage(getPreferredJobImageUrl(item))
      setCurrentStatus(item.status)
      setGenerationMode('upload')
      setShowRefinePanel(false)
      void queryClient.refetchQueries({
        queryKey: ['job', item._id],
        exact: true,
      })
    },
    [queryClient],
  )

  const resetComposerState = React.useCallback(() => {
    setUploadedImage(null)
    setSelectedFile(null)
    setActiveJobId(null)
    setCurrentStatus(null)
    setGenerationMode('upload')
    setPostText('')
    setAiContent(null)
    setShowRefinePanel(false)
    setFieldInputs(createInitialFieldInputs())
    setActiveFieldKey(null)
    setCopied(false)
    setDeleteDialogJobId(null)
  }, [])

  React.useEffect(() => {
    const newPostToken = searchParams.get('newPost')
    if (newPostToken) {
      resetComposerState()
      router.replace('/')
      return
    }

    const historyJobId = searchParams.get('historyJobId')
    if (!historyJobId || historyJobId === activeJobId) return

    const historyJob = historyQuery.data?.jobs.find(
      item => item._id === historyJobId,
    )
    if (historyJob) {
      handleOpenHistoryJob(historyJob)
      return
    }

    setActiveJobId(historyJobId)
    setSelectedFile(null)
    setUploadedImage(null)
    setCurrentStatus(null)
    setPostText('')
    setAiContent(null)
    setShowRefinePanel(false)
  }, [
    activeJobId,
    handleOpenHistoryJob,
    historyQuery.data?.jobs,
    resetComposerState,
    router,
    searchParams,
  ])

  const handleUpload = (file?: File) => {
    if (!file) return
    const localPreview = URL.createObjectURL(file)
    setUploadedImage(localPreview)
    setSelectedFile(file)
    setCurrentStatus(null)
    setActiveJobId(null)
    setPostText('')
    setAiContent(null)
    setShowRefinePanel(false)
  }

  const handleGenerate = () => {
    if (!selectedFile) {
      toast.error('Upload an image first')
      return
    }

    uploadMutation.mutate({
      file: selectedFile,
      location: assignLocation.trim() || undefined,
      instructions: preferredInstructions.trim() || undefined,
      companyName: companyName.trim() || undefined,
    })
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

  const handleDownloadImage = async () => {
    if (!preferredImageUrl) {
      toast.error('No image available to download.')
      return
    }

    const downloadName = getDownloadFilename(
      getJobDisplayName(activeJob) || selectedFile?.name || 'gbp-image.jpg',
      activeJob?.updatedImageUrl,
    )

    const downloadUrl = new URL('/api/download-image', window.location.origin)
    downloadUrl.searchParams.set('url', preferredImageUrl)
    downloadUrl.searchParams.set('name', downloadName)

    const link = document.createElement('a')
    link.href = downloadUrl.toString()
    link.download = downloadName
    link.rel = 'noreferrer'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handleDeleteHistoryItem = (jobId: string) => {
    setDeleteDialogJobId(jobId)
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
  const isBusy =
    uploadMutation.isPending ||
    refineMutation.isPending ||
    jobQuery.isFetching ||
    currentStatus === 'PENDING' ||
    currentStatus === 'PROCESSING'
  const shouldShowThinkingLoader =
    uploadMutation.isPending ||
    (!aiContent &&
      (currentStatus === 'PENDING' || currentStatus === 'PROCESSING'))
  const isRefining = refineMutation.isPending
  const activeJob = jobQuery.data
  const displayPostText = postText || aiContent?.gmbPost || ''
  const deleteTargetJob = historyItems.find(
    item => item._id === deleteDialogJobId,
  )
  const preferredImageUrl =
    getPreferredJobImageUrl(activeJob) || uploadedImage || ''

  React.useEffect(() => {
    const textarea = postTextareaRef.current
    if (!textarea) return

    textarea.style.height = '0px'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [displayPostText])

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
        historyItems.map(item => (
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
                  src={getPreferredJobImageUrl(item)}
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
                aria-label={`Delete ${getJobDisplayName(item)}`}
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
              <CardTitle className="text-lg sm:text-xl">
                Step 1 - Upload Image
              </CardTitle>
              <CardDescription className="pr-1 text-sm leading-6 sm:pr-2 sm:text-[15px]">
                Drop an image and the backend will create a job, store it, and
                hand it off to the AI pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="group flex cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 transition-all duration-300 hover:border-[#4285F4] hover:bg-blue-50/40 sm:p-7">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={event => handleUpload(event.target.files?.[0])}
                  />
                  <div className="flex flex-col items-center justify-center gap-3 text-center min-h-[200px] w-full">
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

                <div className="rounded-2xl border bg-white p-3 transition-all duration-300 sm:p-4">
                  <p className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-500">
                    Uploaded Preview
                  </p>
                  {preferredImageUrl ? (
                    <Image
                      src={preferredImageUrl}
                      alt="uploaded"
                      width={1200}
                      height={800}
                      unoptimized
                      className={getPreviewImageClassName()}
                    />
                  ) : (
                    <div className="grid h-[260px] w-full place-items-center rounded-2xl bg-slate-50 px-4 text-center text-sm text-slate-500">
                      No image uploaded yet
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={() => {
                  if (!selectedFile) {
                    toast.error('Upload an image first')
                    return
                  }
                  setLocationError('')
                  setShowGenerateDialog(true)
                }}
                disabled={isBusy || !selectedFile}
                className="w-full rounded-xl bg-[#4285F4] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#3777dd] disabled:opacity-50"
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {uploadMutation.isPending
                  ? 'Uploading & Processing...'
                  : 'Generate'}
              </Button>
            </CardContent>
          </Card>

          <Card className="block h-auto min-h-fit w-full overflow-visible rounded-2xl border-slate-200 p-3 shadow-sm transition-all duration-300 hover:shadow-md box-border sm:p-4 md:p-5">
            <CardHeader className="p-0">
              <CardTitle className="text-lg sm:text-xl">
                Step 2 - GMB Post Content
              </CardTitle>
              <CardDescription className="pr-1 text-sm leading-6 sm:pr-2 sm:text-[15px]">
                Review and refine the GMB-ready post generated by AI for your
                business profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              {isRefining && aiContent ? (
                <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                  Updating the current response with your latest edit...
                </div>
              ) : null}

              {shouldShowThinkingLoader ? (
                <AiThinkingLoader active mode={generationMode} />
              ) : (
                <div className="rounded-2xl border bg-white p-3 animate-in fade-in duration-300 sm:p-3.5">
                  <Textarea
                    ref={postTextareaRef}
                    value={displayPostText}
                    onChange={event => setPostText(event.target.value)}
                    className="min-h-0 resize-none overflow-hidden rounded-xl border-0 bg-slate-50 px-4 py-3 text-sm leading-7 md:text-base"
                    placeholder="Generated GMB-ready post will appear here"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  variant="outline"
                  className="w-full rounded-xl px-4 text-sm transition-all duration-300 hover:-translate-y-0.5 sm:w-auto sm:text-[15px]"
                  onClick={() => setShowRefinePanel(value => !value)}
                  disabled={!activeJobId || isBusy}
                >
                  <Wand2 className="mr-2 h-4 w-4" /> Refine
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl px-4 text-sm transition-all duration-300 hover:-translate-y-0.5 sm:w-auto sm:text-[15px]"
                  onClick={handleCopy}
                  disabled={isBusy || !displayPostText}
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
                  disabled={isBusy || !aiContent}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Full Pack
                </Button>
              </div>

              {showRefinePanel && (
                <div className="space-y-3 rounded-3xl border bg-slate-50 p-3 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:p-4">
                  <div className="space-y-3">
                    <RefineFieldCard
                      field={REFINE_FIELDS.find(f => f.key === 'gmb_post')!}
                      value={fieldInputs.gmb_post}
                      onChange={value =>
                        setFieldInputs(previous => ({
                          ...previous,
                          gmb_post: value,
                        }))
                      }
                      onSubmit={() => submitRefineField('gmb_post')}
                      disabled={
                        refineMutation.isPending || currentStatus !== 'DONE'
                      }
                      pending={activeFieldKey === 'gmb_post'}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="block h-auto min-h-fit w-full overflow-visible rounded-2xl border-slate-200 p-3 shadow-sm transition-all duration-300 hover:shadow-md box-border sm:p-4">
            <CardHeader className="p-0">
              <CardTitle className="text-lg sm:text-xl">
                Step 3 - Export & Copy
              </CardTitle>
              <CardDescription className="pr-1 text-sm leading-6 sm:pr-2 sm:text-[15px]">
                Copy the post, export the full content pack, or download it for
                later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-0">
              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl px-4 text-sm sm:text-[15px]"
                  onClick={handleCopyGmbPost}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Post
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl px-4 text-sm sm:text-[15px]"
                  onClick={handleCopyFullPackage}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Full Pack
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl px-4 text-sm sm:text-[15px]"
                  onClick={handleDownloadImage}
                  disabled={!preferredImageUrl}
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Download Image
                </Button>
              </div>
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
              <CardTitle className="text-lg sm:text-xl">
                Image Metadata
              </CardTitle>
              <CardDescription className="pr-1 text-sm leading-6 sm:pr-2 sm:text-[15px]">
                AI-generated metadata for the uploaded image
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-2xl border bg-white p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-full px-2.5 py-0.5"
                  >
                    {currentStatus ?? 'No job'}
                  </Badge>
                  {getJobDisplayName(activeJob) ? (
                    <span className="text-sm text-slate-500">
                      {getJobDisplayName(activeJob)}
                    </span>
                  ) : null}
                </div>

                {aiContent ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                          Image Title
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7 text-slate-400 hover:text-[#4285F4]"
                          onClick={() =>
                            setRightActiveFieldKey(
                              rightActiveFieldKey === 'title' ? null : 'title',
                            )
                          }
                          disabled={isBusy || currentStatus !== 'DONE'}
                          title="Refine image title"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <h3 className="mt-2 text-base font-semibold text-slate-900 sm:text-lg">
                        {aiContent.title || 'Image Title'}
                      </h3>
                      {rightActiveFieldKey === 'title' && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          <RefineFieldCard
                            field={REFINE_FIELDS.find(f => f.key === 'title')!}
                            value={fieldInputs.title}
                            onChange={value =>
                              setFieldInputs(previous => ({
                                ...previous,
                                title: value,
                              }))
                            }
                            onSubmit={() => submitRefineField('title')}
                            disabled={
                              refineMutation.isPending ||
                              currentStatus !== 'DONE'
                            }
                            pending={activeFieldKey === 'title'}
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                          Image Caption
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7 text-slate-400 hover:text-[#4285F4] shrink-0"
                          onClick={() =>
                            setRightActiveFieldKey(
                              rightActiveFieldKey === 'caption'
                                ? null
                                : 'caption',
                            )
                          }
                          disabled={isBusy || currentStatus !== 'DONE'}
                          title="Refine image caption"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {aiContent.caption ||
                          'No caption returned by the AI service.'}
                      </p>
                      {rightActiveFieldKey === 'caption' && (
                        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          <RefineFieldCard
                            field={
                              REFINE_FIELDS.find(f => f.key === 'caption')!
                            }
                            value={fieldInputs.caption}
                            onChange={value =>
                              setFieldInputs(previous => ({
                                ...previous,
                                caption: value,
                              }))
                            }
                            onSubmit={() => submitRefineField('caption')}
                            disabled={
                              refineMutation.isPending ||
                              currentStatus !== 'DONE'
                            }
                            pending={activeFieldKey === 'caption'}
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid gap-3">
                      <div className="rounded-2xl border bg-white p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                            Image Keywords
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-slate-400 hover:text-[#4285F4]"
                            onClick={() =>
                              setRightActiveFieldKey(
                                rightActiveFieldKey === 'SEO_keywords'
                                  ? null
                                  : 'SEO_keywords',
                              )
                            }
                            disabled={isBusy || currentStatus !== 'DONE'}
                            title="Refine image keywords"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {rightActiveFieldKey === 'SEO_keywords' && (
                          <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <RefineFieldCard
                              field={
                                REFINE_FIELDS.find(
                                  f => f.key === 'SEO_keywords',
                                )!
                              }
                              value={fieldInputs.SEO_keywords}
                              onChange={value =>
                                setFieldInputs(previous => ({
                                  ...previous,
                                  SEO_keywords: value,
                                }))
                              }
                              onSubmit={() => submitRefineField('SEO_keywords')}
                              disabled={
                                refineMutation.isPending ||
                                currentStatus !== 'DONE'
                              }
                              pending={activeFieldKey === 'SEO_keywords'}
                            />
                          </div>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {aiContent.keywords.length ? (
                            aiContent.keywords.map(keyword => (
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
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                            Image Description
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-slate-400 hover:text-[#4285F4]"
                            onClick={() =>
                              setRightActiveFieldKey(
                                rightActiveFieldKey === 'description'
                                  ? null
                                  : 'description',
                              )
                            }
                            disabled={isBusy || currentStatus !== 'DONE'}
                            title="Refine image description"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {rightActiveFieldKey === 'description' && (
                          <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <RefineFieldCard
                              field={
                                REFINE_FIELDS.find(
                                  f => f.key === 'description',
                                )!
                              }
                              value={fieldInputs.description}
                              onChange={value =>
                                setFieldInputs(previous => ({
                                  ...previous,
                                  description: value,
                                }))
                              }
                              onSubmit={() => submitRefineField('description')}
                              disabled={
                                refineMutation.isPending ||
                                currentStatus !== 'DONE'
                              }
                              pending={activeFieldKey === 'description'}
                            />
                          </div>
                        )}
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {aiContent.description ||
                            'No description returned by the AI service.'}
                        </p>
                      </div>

                      <div className="rounded-2xl border bg-white p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                            Image Filename
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="h-7 w-7 text-slate-400 hover:text-[#4285F4]"
                            onClick={() =>
                              setRightActiveFieldKey(
                                rightActiveFieldKey === 'file_name'
                                  ? null
                                  : 'file_name',
                              )
                            }
                            disabled={isBusy || currentStatus !== 'DONE'}
                            title="Refine image filename"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {rightActiveFieldKey === 'file_name' && (
                          <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <RefineFieldCard
                              field={
                                REFINE_FIELDS.find(f => f.key === 'file_name')!
                              }
                              value={fieldInputs.file_name}
                              onChange={value =>
                                setFieldInputs(previous => ({
                                  ...previous,
                                  file_name: value,
                                }))
                              }
                              onSubmit={() => submitRefineField('file_name')}
                              disabled={
                                refineMutation.isPending ||
                                currentStatus !== 'DONE'
                              }
                              pending={activeFieldKey === 'file_name'}
                            />
                          </div>
                        )}
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {aiContent.fileName || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 pr-1 text-sm leading-7 text-slate-700 md:text-base">
                    Your generated GBP post will show here after the backend job
                    finishes.
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
        open={showGenerateDialog}
        onOpenChange={open => {
          if (!open) {
            setShowGenerateDialog(false)
            setLocationError('')
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-[#4285F4]" />
              Generate AI Content
            </DialogTitle>
            <DialogDescription className="text-sm">
              Configure generation options before starting the AI pipeline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label
                htmlFor="modal-company"
                className="flex items-center gap-1 text-sm font-semibold text-slate-800"
              >
                <Building2 className="h-4 w-4 text-slate-500" />
                Company Name
                <span className="text-xs font-normal text-slate-400">
                  (optional)
                </span>
              </Label>
              <input
                id="modal-company"
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Frank's HVAC"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4]"
              />
              <p className="text-xs text-slate-500">
                Optional. Tell the AI which business this content is for.
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="modal-location"
                className="flex items-center gap-1 text-sm font-semibold text-slate-800"
              >
                Assign Location
                <span className="text-rose-500">*</span>
              </Label>
              <input
                id="modal-location"
                type="text"
                value={assignLocation}
                onChange={e => {
                  setAssignLocation(e.target.value)
                  if (locationError) setLocationError('')
                }}
                placeholder="e.g. Las Vegas, NV"
                className={cn(
                  'w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors focus:ring-1',
                  locationError
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 focus:border-[#4285F4] focus:ring-[#4285F4]',
                )}
              />
              {locationError ? (
                <p className="flex items-center gap-1 text-sm text-rose-500">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                  {locationError}
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Required. Tell the AI which city or area this content is for.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="modal-instructions"
                className="flex items-center gap-1 text-sm font-semibold text-slate-800"
              >
                Preferred Instructions
                <span className="text-xs font-normal text-slate-400">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="modal-instructions"
                value={preferredInstructions}
                onChange={e => setPreferredInstructions(e.target.value)}
                placeholder="e.g. Focus on appliance repair keywords, highlight 24/7 service..."
                className="min-h-24 rounded-2xl border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition-colors focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4]"
              />
              <p className="text-xs text-slate-500">
                Optional. Add extra context or keywords for better AI output.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-3 ">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowGenerateDialog(false)
                setLocationError('')
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!assignLocation.trim()) {
                  setLocationError('Location is required before generating.')
                  return
                }
                setShowGenerateDialog(false)
                handleGenerate()
              }}
              disabled={uploadMutation.isPending}
              className="rounded-xl bg-[#4285F4] px-6 hover:bg-[#3777dd]"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Start Generating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteDialogJobId)}
        onOpenChange={open => {
          if (!open) setDeleteDialogJobId(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete history item?</DialogTitle>
            <DialogDescription>
              {deleteTargetJob
                ? `This will remove ${getJobDisplayName(deleteTargetJob)}, the Cloudinary image, and the AI session.`
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

export default function Home() {
  return (
    <React.Suspense fallback={null}>
      <HomeContent />
    </React.Suspense>
  )
}
