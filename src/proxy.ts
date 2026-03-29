import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

/**
 * Next.js 16: "middleware" convention renamed to "proxy".
 * Function must be named `proxy` (not `middleware`).
 */
export async function proxy(request: NextRequest) {
	return await updateSession(request)
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization)
		 * - favicon.ico
		 * - public folder assets
		 * - api/health (uptime ping — must be publicly accessible)
		 */
		'/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/health).*)',
	],
}
