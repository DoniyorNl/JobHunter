import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({ request })

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
					supabaseResponse = NextResponse.next({ request })
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options),
					)
				},
			},
		},
	)

	// Refresh session — DO NOT remove this code
	const {
		data: { user },
	} = await supabase.auth.getUser()

	const { pathname } = request.nextUrl

	// Protected routes — redirect to login if not authenticated
	const protectedRoutes = ['/board', '/resumes', '/contacts', '/interviews', '/metrics']
	const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

	if (isProtectedRoute && !user) {
		const url = request.nextUrl.clone()
		url.pathname = '/login'
		url.searchParams.set('redirectedFrom', pathname)
		return NextResponse.redirect(url)
	}

	// Auth routes — redirect to board if already authenticated
	const authRoutes = ['/login', '/signup']
	const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

	if (isAuthRoute && user) {
		const url = request.nextUrl.clone()
		url.pathname = '/board'
		return NextResponse.redirect(url)
	}

	return supabaseResponse
}
