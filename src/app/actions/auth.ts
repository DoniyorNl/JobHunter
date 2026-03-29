'use server'

import { ensureUserExists } from '@/lib/user'
import { createClient } from '@/lib/supabase/server'

export interface SignUpResult {
	error: string | null
	/** true = Supabase sent a confirmation email; false = user is already active */
	requiresConfirmation: boolean
}

/**
 * Server Action: email/password signup.
 *
 * Why a Server Action instead of calling supabase.auth.signUp() from the client?
 * - We need to call ensureUserExists() on the server (Prisma is server-only).
 * - If email confirmation is DISABLED in Supabase, signUp() returns a live session
 *   immediately — we create the DB row right away.
 * - If email confirmation is ENABLED, the user row is created when they click the
 *   confirmation link (handled by /auth/callback).
 *
 * Why NOT redirect inside the action?
 * - The client needs to show a toast ("check your email") vs redirect to /board.
 *   Returning a result lets the client decide the next step.
 */
export async function signUpWithEmail(payload: {
	name: string
	email: string
	password: string
	origin: string
}): Promise<SignUpResult> {
	const supabase = await createClient()

	const { data, error } = await supabase.auth.signUp({
		email: payload.email,
		password: payload.password,
		options: {
			data: { full_name: payload.name },
			emailRedirectTo: `${payload.origin}/auth/callback`,
		},
	})

	if (error) {
		return { error: error.message, requiresConfirmation: false }
	}

	// data.session is non-null when email confirmation is disabled — user is live.
	if (data.user && data.session) {
		try {
			await ensureUserExists(data.user)
		} catch (err) {
			console.error('[signUpWithEmail] ensureUserExists failed:', err)
			// Non-fatal: Supabase trigger will catch it on next login
		}
		return { error: null, requiresConfirmation: false }
	}

	// No session yet — confirmation email sent
	return { error: null, requiresConfirmation: true }
}
