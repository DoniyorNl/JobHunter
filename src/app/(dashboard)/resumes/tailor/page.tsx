import type { Metadata } from 'next'
import { QueryProvider } from '@/components/shared/QueryProvider'
import { ResumeTailor } from '@/components/resume/tailor/ResumeTailor'

export const metadata: Metadata = { title: 'Resume Tailor | JobHunter' }

export default function ResumeTailorPage() {
	return (
		<div className='flex flex-col h-full'>
			<div className='px-6 py-4 border-b'>
				<div className='flex items-center gap-3'>
					<div>
						<h1 className='text-xl font-semibold'>Resume Tailor</h1>
						<p className='text-sm text-muted-foreground mt-0.5'>
							Paste a job description — AI will score your match and rewrite your bullets to fit.
						</p>
					</div>
				</div>
			</div>
			<div className='flex-1 overflow-y-auto px-6 py-6'>
				<QueryProvider>
					<ResumeTailor />
				</QueryProvider>
			</div>
		</div>
	)
}
