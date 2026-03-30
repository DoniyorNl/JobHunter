import type { Metadata } from 'next'
import { Bell, Mail, Shield, User } from 'lucide-react'

export const metadata: Metadata = { title: 'Settings' }

const SECTIONS = [
	{
		icon: User,
		title: 'Profile',
		description: 'Your name and email are managed through your Google account.',
	},
	{
		icon: Bell,
		title: 'Notifications',
		description: 'Follow-up reminders are sent manually from the Job Board — click the bell icon on any Applied or Phone Screen card.',
	},
	{
		icon: Mail,
		title: 'Email',
		description: 'Reminder emails are sent to your account email via Resend. No newsletter or marketing emails.',
	},
	{
		icon: Shield,
		title: 'Privacy',
		description: 'Your data is private and never indexed by search engines. All job data is scoped to your account only.',
	},
]

export default function SettingsPage() {
	return (
		<div className='flex flex-col h-full'>
			<div className='flex items-center justify-between px-6 py-4 border-b shrink-0'>
				<div>
					<h1 className='text-xl font-semibold'>Settings</h1>
					<p className='text-sm text-muted-foreground'>Manage your account preferences</p>
				</div>
			</div>

			<div className='flex-1 overflow-y-auto px-6 py-6 max-w-2xl'>
				<div className='space-y-3'>
					{SECTIONS.map(({ icon: Icon, title, description }) => (
						<div
							key={title}
							className='flex gap-4 p-5 rounded-xl border bg-card'
						>
							<div className='w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5'>
								<Icon className='w-4 h-4 text-muted-foreground' />
							</div>
							<div>
								<p className='text-sm font-semibold'>{title}</p>
								<p className='text-sm text-muted-foreground mt-0.5 leading-relaxed'>
									{description}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
