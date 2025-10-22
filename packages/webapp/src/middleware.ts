import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl

  // Parse hostname to check for subdomain
  const hostParts = hostname.split('.')

  // Check if we're on the app subdomain (app.prpm.dev or app.localhost:3001)
  const isAppSubdomain = hostParts[0] === 'app'

  // Check if we're accessing app routes
  const isAppRoute = url.pathname.startsWith('/dashboard') ||
                     url.pathname.startsWith('/search') ||
                     url.pathname.startsWith('/authors')

  // If on main domain but accessing app routes, redirect to app subdomain
  if (!isAppSubdomain && isAppRoute) {
    // In development, handle localhost differently
    if (hostname.includes('localhost')) {
      // Just allow the request through - no subdomain redirect for localhost
      return NextResponse.next()
    }

    // In production, redirect to app subdomain
    const appHostname = hostname.replace(/^(www\.)?/, 'app.')
    const redirectUrl = new URL(url.pathname + url.search, `${url.protocol}//${appHostname}`)
    return NextResponse.redirect(redirectUrl)
  }

  // If on app subdomain but accessing marketing pages, redirect to main domain
  if (isAppSubdomain && (url.pathname === '/' || url.pathname.startsWith('/login') || url.pathname.startsWith('/signup'))) {
    // In development with localhost, allow through
    if (hostname.includes('localhost')) {
      return NextResponse.next()
    }

    // In production, redirect to main domain
    const mainHostname = hostname.replace(/^app\./, '')
    const redirectUrl = new URL(url.pathname + url.search, `${url.protocol}//${mainHostname}`)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
