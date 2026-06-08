import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/signup', '/subscribe', '/pending-approval']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in → login
  if (!isPublic && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logged in on login/signup → dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/contacts', request.url))
  }

  // Logged in on protected pages → check approval + admin access
  if (user && !isPublic) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, subscription_status')
      .eq('id', user.id)
      .single()

    const isPending = profile?.subscription_status === 'pending_approval'
    const isAdmin = profile?.is_admin === true

    // Pending users (non-admin) can only see /pending-approval
    if (isPending && !isAdmin) {
      return NextResponse.redirect(new URL('/pending-approval', request.url))
    }

    // /admin is admin-only
    if (pathname.startsWith('/admin') && !isAdmin) {
      return NextResponse.redirect(new URL('/contacts', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
