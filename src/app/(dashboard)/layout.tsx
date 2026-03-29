import { Sidebar } from '@/components/layout/Sidebar'
import { Toaster } from '@/components/ui/sonner'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const supabase = await createClient()

	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		redirect('/login')
	}

	const userProfile = {
		name: user.user_metadata?.full_name ?? null,
		email: user.email ?? null,
		avatarUrl: user.user_metadata?.avatar_url ?? null,
	}

	return (
		<div className='flex h-screen overflow-hidden bg-background'>
			<Sidebar user={userProfile} />

			<main className='flex-1 flex flex-col overflow-hidden'>
				<div className='flex-1 overflow-y-auto'>{children}</div>
			</main>

			<Toaster position='bottom-right' richColors />
		</div>
	)
}
