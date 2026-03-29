import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
})

export const metadata: Metadata = {
	title: {
		default: 'JobHunter — Track your job search',
		template: '%s | JobHunter',
	},
	description: 'A Huntr-style job search tracker. Kanban board, resume builder, contact & interview management — all in one place.',
	keywords: ['job search', 'job tracker', 'kanban', 'resume builder', 'interview tracker'],
	openGraph: {
		type: 'website',
		siteName: 'JobHunter',
		title: 'JobHunter — Track your job search',
		description: 'Kanban board, resume builder, contact & interview management.',
	},
	robots: { index: false, follow: false }, // private app — no indexing
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='en' className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
			<body className='min-h-full flex flex-col'>{children}</body>
		</html>
	)
}
