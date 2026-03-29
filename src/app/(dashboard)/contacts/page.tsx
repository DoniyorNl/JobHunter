import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Contacts | JobTracker' }

export default function ContactsPage() {
	return (
		<div className='px-6 py-4'>
			<h1 className='text-xl font-semibold'>Contacts</h1>
			<p className='text-muted-foreground text-sm mt-1'>Coming in Phase 4</p>
		</div>
	)
}
