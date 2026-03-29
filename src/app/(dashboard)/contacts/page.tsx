import type { Metadata } from 'next'
import { QueryProvider } from '@/components/shared/QueryProvider'
import { ContactsView } from '@/components/contacts/ContactsView'

export const metadata: Metadata = { title: 'Contacts | JobTracker' }

export default function ContactsPage() {
	return (
		<div className='flex flex-col h-full'>
			<div className='px-6 py-4 border-b'>
				<h1 className='text-xl font-semibold'>Contacts</h1>
				<p className='text-muted-foreground text-sm mt-0.5'>
					Recruiters, hiring managers, and referrals — all in one place.
				</p>
			</div>
			<div className='flex-1 overflow-y-auto px-6 py-6'>
				<QueryProvider>
					<ContactsView />
				</QueryProvider>
			</div>
		</div>
	)
}
