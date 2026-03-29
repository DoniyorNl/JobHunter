import { ensureUserExists } from '@/lib/user'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /auth/callback
 *
 * Handles two cases:
 * 1. Email confirmation redirect (Supabase sends ?code=...)
 * 2. OAuth redirect (Google, GitHub, etc.)
 *
 * After exchanging the code for a session we call ensureUserExists() so that
 * our Prisma `User` table is always in sync with Supabase Auth.
 *
 * Why here and not in middleware?
 * - Middleware runs on every request — too expensive for a DB write.
 * - This route fires exactly once per login/signup — the right place for sync.
 */
export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url)
	const code = searchParams.get('code')
	const next = searchParams.get('next') ?? '/board'

	if (code) {
		const supabase = await createClient()
		const { data, error } = await supabase.auth.exchangeCodeForSession(code)

		if (!error && data.user) {
			// Sync user to our DB — non-fatal: auth still works even if this fails
			try {
				await ensureUserExists(data.user)
			} catch (err) {
				console.error('[auth/callback] ensureUserExists failed:', err)
			}

			const forwardedHost = request.headers.get('x-forwarded-host')
			const isLocalEnv = process.env.NODE_ENV === 'development'

			if (isLocalEnv) {
				return NextResponse.redirect(`${origin}${next}`)
			} else if (forwardedHost) {
				return NextResponse.redirect(`https://${forwardedHost}${next}`)
			} else {
				return NextResponse.redirect(`${origin}${next}`)
			}
		}
	}

	return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
