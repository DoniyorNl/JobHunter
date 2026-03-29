import type { User as SupabaseUser } from '@supabase/supabase-js'
import { errorResponse } from '@/types/api'
import { createClient } from './supabase/server'

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
 * Verifies the incoming request is authenticated via Supabase session cookie.
 *
 * Why NOT include ensureUserExists() here?
 * - This function is called on every API request — adding a DB write would double
 *   the latency of every endpoint.
 * - User row creation is handled by the Supabase trigger + auth/callback safety net.
 * - If the DB row is somehow missing, the FK constraint error surfaces naturally
 *   (it's a bug to fix, not to silently retry on each request).
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

	return { user, response: null }
}
