import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: {
		template: '%s | JobTracker',
		default: 'Sign In | JobTracker',
	},
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className='min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4'>
			<div className='w-full max-w-md'>{children}</div>
		</div>
	)
}
