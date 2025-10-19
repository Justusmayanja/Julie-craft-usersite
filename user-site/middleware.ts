import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// Define admin routes that require authentication and admin role
const adminRoutes = [
  '/admin',
  '/admin/dashboard',
  '/admin/products',
  '/admin/orders',
  '/admin/customers',
  '/admin/inventory',
  '/admin/analytics',
  '/admin/settings'
]

// Define API routes that require admin access
const adminApiRoutes = [
  '/api/admin',
  '/api/orders',
  '/api/customers',
  '/api/inventory',
  '/api/analytics'
]

// Define API routes that are exempt from admin protection (for setup/testing)
const exemptApiRoutes = [
  '/api/admin/create-test-user'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is an admin route
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isAdminApiRoute = adminApiRoutes.some(route => pathname.startsWith(route))
  const isExemptApiRoute = exemptApiRoutes.some(route => pathname.startsWith(route))

  // Skip middleware for exempt API routes
  if (isExemptApiRoute) {
    return NextResponse.next()
  }

  if (isAdminRoute || isAdminApiRoute) {
    // Get the authorization header or token from cookie
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('julie-crafts-token')?.value
    
    let token = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (!token) {
      // For API routes, return 401
      if (isAdminApiRoute) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 401 }
        )
      }
      
      // For page routes, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      // Verify the token and get user info
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      
      if (error || !user) {
        if (isAdminApiRoute) {
          return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
          )
        }
        
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Get user profile with role information
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role, is_admin')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        if (isAdminApiRoute) {
          return NextResponse.json(
            { error: 'User profile not found' },
            { status: 403 }
          )
        }
        
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('error', 'profile_not_found')
        return NextResponse.redirect(loginUrl)
      }

      // Check if user has admin privileges
      const isAdmin = profile.role === 'admin' || profile.role === 'super_admin' || profile.is_admin === true

      if (!isAdmin) {
        if (isAdminApiRoute) {
          return NextResponse.json(
            { error: 'Forbidden - Admin privileges required' },
            { status: 403 }
          )
        }
        
        // Redirect non-admin users to their dashboard or home
        const homeUrl = new URL('/', request.url)
        homeUrl.searchParams.set('error', 'insufficient_privileges')
        return NextResponse.redirect(homeUrl)
      }

      // User is authenticated and has admin privileges
      // Add user info to headers for API routes
      if (isAdminApiRoute) {
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-user-id', user.id)
        requestHeaders.set('x-user-role', profile.role)
        
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      }

      // For page routes, continue to the page
      return NextResponse.next()

    } catch (error) {
      console.error('Middleware error:', error)
      
      if (isAdminApiRoute) {
        return NextResponse.json(
          { error: 'Authentication error' },
          { status: 500 }
        )
      }
      
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'auth_error')
      return NextResponse.redirect(loginUrl)
    }
  }

  // For non-admin routes, continue normally
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all admin routes and API routes
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/orders/:path*',
    '/api/customers/:path*',
    '/api/inventory/:path*',
    '/api/analytics/:path*',
  ],
}
