import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect admin routes (everything except login and welcome pages)
  if (request.nextUrl.pathname !== '/admin/login' && request.nextUrl.pathname !== '/admin/welcome') {
    if (!user) {
      // no user, potentially respond by redirecting the user to the welcome page first
      const url = request.nextUrl.clone()
      url.pathname = '/admin/welcome'
      return NextResponse.redirect(url)
    }

    // Check if user is admin
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile query error:', profileError)
        const url = request.nextUrl.clone()
        url.pathname = '/admin/welcome'
        url.searchParams.set('error', 'database_error')
        return NextResponse.redirect(url)
      }

      if (!profile?.is_admin) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin/welcome'
        url.searchParams.set('error', 'access_denied')
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.error('Middleware auth error:', error)
      // If database is not available, redirect to welcome page
      const url = request.nextUrl.clone()
      url.pathname = '/admin/welcome'
      url.searchParams.set('error', 'database_error')
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse
}
