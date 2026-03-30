import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/shared/ThemeProvider'
import './globals.css'

/*
 * We load Geist as the named fallback in our system font stack.
 * The CSS variable `--font-geist-sans` is referenced in globals.css.
 * On macOS the browser will pick SF Pro; on Windows 11 it picks
 * Segoe UI Variable — Geist is only reached on Linux or unsupported platforms.
 */
const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
	display: 'swap',
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
	display: 'swap',
})

export const metadata: Metadata = {
	title: {
		default: 'JobHunter — Track your job search',
		template: '%s | JobHunter',
	},
	description:
		'A Huntr-style job search tracker. Kanban board, resume builder, contact & interview management — all in one place.',
	keywords: ['job search', 'job tracker', 'kanban', 'resume builder', 'interview tracker'],
	openGraph: {
		type: 'website',
		siteName: 'JobHunter',
		title: 'JobHunter — Track your job search',
		description: 'Kanban board, resume builder, contact & interview management.',
	},
	robots: { index: false, follow: false },
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		/*
		 * suppressHydrationWarning is required by next-themes.
		 * next-themes sets the class/attribute on <html> before React
		 * hydrates, which would otherwise cause a mismatch warning.
		 */
		<html
			lang='en'
			className={`${geistSans.variable} ${geistMono.variable} h-full`}
			suppressHydrationWarning
		>
			<body className='min-h-full flex flex-col'>
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	)
}
