import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Guide §3 — `(marketing)/` = public landing. Logged-in users → dashboard.
 */
export default async function MarketingHomePage() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (user) redirect('/board')

	return (
		<div className='flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))] py-12 px-4 sm:px-6 lg:px-8'>
			<div className='text-center'>
				<h1 className='text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl'>
					Manage Your Job Search with Ease
				</h1>
				<p className='mt-3 max-w-md mx-auto text-base text-muted-foreground sm:text-lg md:mt-5 md:text-xl md:max-w-3xl'>
					Track applications, tailor resumes with AI, and ace your interviews.
				</p>
				<div className='mt-10 flex flex-wrap justify-center gap-3'>
					<Link
						href='/signup'
						className='inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary hover:opacity-90'
					>
						Get started for free
					</Link>
					<Link
						href='/login'
						className='inline-flex items-center justify-center px-5 py-3 border border-border text-base font-medium rounded-md bg-background hover:bg-muted'
					>
						Sign in
					</Link>
					<Link
						href='/pricing'
						className='inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-muted hover:bg-muted/80'
					>
						Pricing
					</Link>
				</div>
			</div>

			<div className='mt-20 w-full max-w-4xl'>
				<h2 className='text-3xl font-extrabold text-foreground text-center mb-10'>Features</h2>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
					<div className='bg-card border overflow-hidden shadow-sm rounded-lg p-6'>
						<h3 className='text-xl font-semibold text-foreground'>Kanban Board</h3>
						<p className='mt-2 text-base text-muted-foreground'>
							Visually track your job applications through different stages.
						</p>
					</div>
					<div className='bg-card border overflow-hidden shadow-sm rounded-lg p-6'>
						<h3 className='text-xl font-semibold text-foreground'>AI Resume Tailor</h3>
						<p className='mt-2 text-base text-muted-foreground'>
							Use AI to optimize your resume for specific job descriptions.
						</p>
					</div>
					<div className='bg-card border overflow-hidden shadow-sm rounded-lg p-6'>
						<h3 className='text-xl font-semibold text-foreground'>Interview Tracker</h3>
						<p className='mt-2 text-base text-muted-foreground'>
							Keep track of all your interviews, notes, and feedback.
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
