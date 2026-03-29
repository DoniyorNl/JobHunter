import type { User as SupabaseUser } from '@supabase/supabase-js'
import { errorResponse } from '@/types/api'
import { createClient } from './supabase/server'
import { ensureUserExists } from './user'

/**
 * Discriminated union so TypeScript narrows the type correctly after the check.
 *
 * Usage in API routes:
 *   const { user, response } = await requireUser()
 *   if (response) return response          // unauthenticated — Response already built
 *   // From here TypeScript knows: user is SupabaseUser (non-null)
 */
type AuthSuccess = { user: SupabaseUser; response: null }
type AuthFailure = { user: null; response: Response }
export type AuthResult = AuthSuccess | AuthFailure

/**
 * Verifies the incoming request is authenticated via Supabase session cookie,
 * then ensures the corresponding User row exists in our database.
 *
 * Why call ensureUserExists() here (not just in /auth/callback)?
 * - The callback is the primary sync point, but it can be skipped if the user
 *   was already logged in from a previous session before we added the callback.
 * - prisma.user.upsert() uses ON CONFLICT DO UPDATE — a single DB round-trip.
 *   Overhead is ~2-5ms, acceptable as a safety net for FK constraint errors.
 * - Non-fatal: a failure here is logged but does not block the request.
 */
export async function requireUser(): Promise<AuthResult> {
	const supabase = await createClient()
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser()

	if (error || !user) {
		return { user: null, response: errorResponse('Unauthorized', 401) }
	}

	try {
		await ensureUserExists(user)
	} catch (err) {
		console.error('[requireUser] ensureUserExists failed:', err)
	}

	return { user, response: null }
}
