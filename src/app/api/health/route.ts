import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
	const supabase = await createClient()

	const { error } = await supabase.from('_health').select('1').limit(1).maybeSingle()

	if (error && error.code !== 'PGRST116') {
		// PGRST116 = table not found — that's fine for a ping
		// Other errors indicate real connectivity issues
		return NextResponse.json({ status: 'error', message: error.message }, { status: 503 })
	}

	return NextResponse.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
	})
}
