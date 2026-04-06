import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
	const checks: Record<string, string> = {}

	// Check env vars
	checks.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'MISSING'
	checks.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'ok' : 'MISSING'
	checks.DATABASE_URL = process.env.DATABASE_URL ? 'ok' : 'MISSING'

	const missingVars = Object.entries(checks).filter(([, v]) => v === 'MISSING')
	if (missingVars.length > 0) {
		return NextResponse.json({
			status: 'error',
			checks,
			message: `Missing env vars: ${missingVars.map(([k]) => k).join(', ')}`,
		}, { status: 503 })
	}

	try {
		const supabase = await createClient()
		// Ping any known table — "User" always exists in our schema
		const { error } = await supabase.from('User').select('id').limit(1)
		// PGRST116 = no rows (fine), anything else is a real problem
		if (error && error.code !== 'PGRST116') {
			checks.supabase = `error: ${error.message}`
		} else {
			checks.supabase = 'ok'
		}
	} catch (err) {
		checks.supabase = `exception: ${String(err)}`
	}

	const hasErrors = Object.values(checks).some(v => v !== 'ok')
	return NextResponse.json({
		status: hasErrors ? 'degraded' : 'ok',
		checks,
		timestamp: new Date().toISOString(),
	}, { status: hasErrors ? 503 : 200 })
}
