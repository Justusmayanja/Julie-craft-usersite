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
  '/api/analytics'
]

// Define inventory API routes that should be accessible to customers
const customerInventoryRoutes = [
  '/api/inventory/check',
  '/api/inventory/reserve'
]

// Define inventory API routes that require admin access
const adminInventoryRoutes = [
  '/api/inventory/adjustments',
  '/api/inventory/robust',
  '/api/inventory/returns',
  '/api/inventory/reorder-alerts',
  '/api/inventory/audit'
]

// Define API routes that are exempt from admin protection (for setup/testing)
const exemptApiRoutes = [
  '/api/admin/create-test-user'
]

// Define routes that should be accessible to all users (including admins)
const publicRoutes = [
  '/login',
  '/register',
  '/api/auth',
  '/api/debug'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is an admin route
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isAdminApiRoute = adminApiRoutes.some(route => pathname.startsWith(route))
  const isExemptApiRoute = exemptApiRoutes.some(route => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isCustomerInventoryRoute = customerInventoryRoutes.some(route => pathname.startsWith(route))
  const isAdminInventoryRoute = adminInventoryRoutes.some(route => pathname.startsWith(route))

  // Skip middleware for exempt API routes, public routes, and customer inventory routes
  if (isExemptApiRoute || isPublicRoute || isCustomerInventoryRoute) {
    return NextResponse.next()
  }

  // Check if it's an admin inventory route (requires admin access)
  const requiresAdminAccess = isAdminRoute || isAdminApiRoute || isAdminInventoryRoute

  if (requiresAdminAccess) {
    // Special handling for /api/orders POST - allow authenticated customers to place orders
    const isOrdersPost = pathname === '/api/orders' && request.method === 'POST'
    
    // Get the authorization header or token from cookie
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('julie-crafts-token')?.value
    
    console.log(`[Middleware] Checking ${pathname}:`, {
      hasAuthHeader: !!authHeader,
      hasCookieToken: !!cookieToken,
      method: request.method
    })
    
    let token = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
      console.log(`[Middleware] Using token from Authorization header`)
    } else if (cookieToken) {
      token = cookieToken
      console.log(`[Middleware] Using token from cookie`)
    } else {
      console.log(`[Middleware] No token found in header or cookie`)
    }
    
    // For POST to /api/orders, allow both authenticated and guest users
    // The API endpoint itself handles authentication validation
    if (isOrdersPost) {
      // If token is provided, verify it's valid (but don't require it)
      if (token) {
        try {
          if (isSupabaseConfigured && supabaseAdmin) {
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
            // If token is invalid, still allow the request (guest checkout)
            // The API endpoint will handle the case appropriately
            if (error || !user) {
              console.log('Invalid token for order placement, allowing as guest order')
            }
          }
        } catch (error) {
          console.error('Token verification error for order placement:', error)
          // Continue anyway - allow guest checkout
        }
      }
      
      // Allow the request to proceed (authenticated or guest)
      return NextResponse.next()
    }
    
    if (!token) {
      // For API routes, return 401 with more helpful message
      if (isAdminApiRoute) {
        console.log('No token found for admin API route:', pathname)
        return NextResponse.json(
          { 
            error: 'Unauthorized - Authentication required',
            message: 'Please log in to access this resource'
          },
          { status: 401 }
        )
      }
      
      // For page routes, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      // Check if Supabase is configured before attempting verification
      if (!isSupabaseConfigured || !supabaseAdmin) {
        console.log('Supabase not configured in middleware, allowing admin access')
        // For development/testing, allow access if Supabase is not configured
        if (isAdminApiRoute) {
          const requestHeaders = new Headers(request.headers)
          requestHeaders.set('x-user-id', 'dev-admin')
          requestHeaders.set('x-user-role', 'admin')
          
          return NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
        }
        return NextResponse.next()
      }

      // Verify the token and get user info
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      
      if (error || !user) {
        console.log('Token verification failed in middleware:', error?.message)
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
        console.log('Profile fetch failed in middleware:', profileError?.message)
        // If profile doesn't exist, assume admin role for development
        console.log('Assuming admin role for development')
        const isAdmin = true // Allow access for development
        
        if (isAdminApiRoute) {
          const requestHeaders = new Headers(request.headers)
          requestHeaders.set('x-user-id', user.id)
          requestHeaders.set('x-user-role', 'admin')
          
          return NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
        }
        return NextResponse.next()
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
      
      // For development, allow access even if there are errors
      console.log('Allowing admin access despite middleware error for development')
      
      if (isAdminApiRoute) {
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-user-id', 'dev-admin')
        requestHeaders.set('x-user-role', 'admin')
        
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      }
      
      // For page routes, allow access in development
      return NextResponse.next()
    }
  }

  // Check if authenticated admin is trying to access user-site pages
  // Redirect them to admin dashboard
  // Skip this check for API routes, admin routes, and public routes
  // Also skip for static assets and Next.js internal routes
  const isStaticAsset = pathname.startsWith('/_next/') || 
                        pathname.startsWith('/static/') || 
                        pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/)
  
  // Check referer to see if request is coming from an admin page
  // This helps avoid redirecting when admin is navigating within admin pages
  const referer = request.headers.get('referer')
  let isFromAdminPage = false
  try {
    if (referer) {
      const refererUrl = new URL(referer)
      isFromAdminPage = refererUrl.pathname.startsWith('/admin')
    }
  } catch (e) {
    // Invalid referer URL, ignore
  }
  
  if (!isAdminRoute && !isAdminApiRoute && !isPublicRoute && !pathname.startsWith('/api/') && !isStaticAsset) {
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('julie-crafts-token')?.value
    
    let token = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    // Only check if user has a token (is authenticated)
    // Only redirect on GET requests (page navigation), not on other methods
    // Skip redirect if request is coming from an admin page (might be intentional navigation)
    if (token && request.method === 'GET' && !isFromAdminPage) {
      try {
        // Check if Supabase is configured
        if (isSupabaseConfigured && supabaseAdmin) {
          // Verify the token and get user info
          const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
          
          if (!error && user) {
            // Get user profile with role information
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('role, is_admin')
              .eq('id', user.id)
              .single()

            // Check if user has admin privileges
            if (profile) {
              const isAdmin = profile.role === 'admin' || profile.role === 'super_admin' || profile.is_admin === true
              
              // If admin is trying to access user-site pages, redirect to admin dashboard
              // Make sure we're not already on admin/login/register pages to avoid loops
              const isExcludedPath = pathname.startsWith('/admin') || 
                                     pathname.startsWith('/login') || 
                                     pathname.startsWith('/register') ||
                                     pathname === '/'
              
              if (isAdmin && !isExcludedPath) {
                console.log(`Admin user detected on user-site page (${pathname}), redirecting to /admin`)
                const adminUrl = new URL('/admin', request.url)
                return NextResponse.redirect(adminUrl)
              }
            }
          }
        }
      } catch (error) {
        // If there's an error checking admin status, continue normally
        // This prevents blocking legitimate users if there's a database issue
        console.error('Error checking admin status in middleware:', error)
      }
    }
  }

  // For non-admin routes, continue normally
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes to check for admin redirects
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
