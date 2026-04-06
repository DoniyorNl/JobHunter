import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
	const { pathname } = request.nextUrl

	const protectedRoutes = ['/board', '/resumes', '/contacts', '/interviews', '/metrics']
	const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
	const authRoutes = ['/login', '/signup']
	const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

	// Misconfigured deploy (e.g. Vercel env not set) — avoid throwing inside middleware (500)
	if (!supabaseUrl || !supabaseAnonKey) {
		console.error(
			'[updateSession] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
		)
		return NextResponse.next({ request })
	}

	try {
		let supabaseResponse = NextResponse.next({ request })

		const supabase = createServerClient(
			supabaseUrl,
			supabaseAnonKey,
			{
				cookies: {
					getAll() {
						return request.cookies.getAll()
					},
					setAll(cookiesToSet) {
						cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
						supabaseResponse = NextResponse.next({ request })
						cookiesToSet.forEach(({ name, value, options }) =>
							supabaseResponse.cookies.set(name, value, options),
						)
					},
				},
			},
		)

		// Refresh session — network/Supabase errors must not crash Edge middleware (empty 500)
		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (isProtectedRoute && !user) {
			const url = request.nextUrl.clone()
			url.pathname = '/login'
			url.searchParams.set('redirectedFrom', pathname)
			return NextResponse.redirect(url)
		}

		if (isAuthRoute && user) {
			const url = request.nextUrl.clone()
			url.pathname = '/board'
			return NextResponse.redirect(url)
		}

		return supabaseResponse
	} catch (err) {
		console.error('[updateSession] Supabase session refresh failed:', err)
		// API routes: let Node handlers run (JSON 401/503 from requireUser + Prisma)
		if (pathname.startsWith('/api/')) {
			return NextResponse.next({ request })
		}
		if (isProtectedRoute) {
			const url = request.nextUrl.clone()
			url.pathname = '/login'
			url.searchParams.set('redirectedFrom', pathname)
			return NextResponse.redirect(url)
		}
		return NextResponse.next({ request })
	}
}
