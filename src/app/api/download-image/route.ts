import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

function sanitizeFilename(value: string) {
  const cleaned = value.trim().replace(/[^\w.\-]+/g, '-')
  return cleaned || 'gbp-image.jpg'
}

function getFilenameFromUrl(urlValue: string) {
  try {
    const url = new URL(urlValue)
    const pathnameParts = url.pathname.split('/').filter(Boolean)
    const lastSegment = pathnameParts[pathnameParts.length - 1] || 'gbp-image.jpg'
    return sanitizeFilename(decodeURIComponent(lastSegment))
  } catch {
    return 'gbp-image.jpg'
  }
}

export async function GET(request: NextRequest) {
  const urlValue = request.nextUrl.searchParams.get('url')
  const requestedName = request.nextUrl.searchParams.get('name')

  if (!urlValue) {
    return new Response('Missing image url', { status: 400 })
  }

  let imageUrl: URL
  try {
    imageUrl = new URL(urlValue)
  } catch {
    return new Response('Invalid image url', { status: 400 })
  }

  if (imageUrl.protocol !== 'http:' && imageUrl.protocol !== 'https:') {
    return new Response('Unsupported image url', { status: 400 })
  }

  const response = await fetch(imageUrl.toString(), {
    cache: 'no-store',
  })

  if (!response.ok || !response.body) {
    return new Response('Failed to fetch image', { status: 502 })
  }

  const filename =
    sanitizeFilename(requestedName || '') || getFilenameFromUrl(imageUrl.toString())
  const contentType =
    response.headers.get('content-type') || 'application/octet-stream'

  return new Response(response.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
