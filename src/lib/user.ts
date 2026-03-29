import type { User as SupabaseUser } from '@supabase/supabase-js'
import { prisma } from './prisma'

/**
 * Ensures a User row exists in our DB that mirrors the Supabase auth user.
 *
 * Why upsert (not insert)?
 * - Called from multiple places (callback, signup) — safe to call twice.
 * - `update` block only refreshes email (email changes are rare but possible).
 * - Name is NOT overwritten on update: user might have edited it in their profile.
 *
 * Why not call this on every API request?
 * - We use a Supabase DB trigger as the primary mechanism (see supabase/triggers.sql).
 * - This function is the safety net: covers users who signed up before the trigger
 *   was installed, or if the trigger failed for any reason.
 */
export async function ensureUserExists(supabaseUser: SupabaseUser) {
	const name =
		(supabaseUser.user_metadata?.full_name as string | undefined) ??
		(supabaseUser.user_metadata?.name as string | undefined) ??
		supabaseUser.email?.split('@')[0] ??
		'User'

	return prisma.user.upsert({
		where: { id: supabaseUser.id },
		update: {
			// Always keep email in sync (user might change it in Supabase)
			email: supabaseUser.email!,
		},
		create: {
			id: supabaseUser.id,
			email: supabaseUser.email!,
			name,
		},
	})
}
