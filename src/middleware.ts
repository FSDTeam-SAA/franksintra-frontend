import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token) {
    if (isPublicRoute) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Check if the route is an admin route
    if (pathname.startsWith('/admin')) {
      if (token.role !== 'ADMIN') {
        // Redirect non-admins to the home page
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
