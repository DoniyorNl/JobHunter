import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { ThemeProvider } from '@/components/shared/ThemeProvider'
import { THEME_INIT_SCRIPT } from '@/lib/theme-config'
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
		 * suppressHydrationWarning: `beforeInteractive` script sets `dark` on
		 * <html> before hydration; without this React would warn on class mismatch.
		 */
		<html
			lang='en'
			className={`${geistSans.variable} ${geistMono.variable} h-full`}
			suppressHydrationWarning
		>
			<body className='min-h-full flex flex-col'>
				{/*
				 * Theme flash prevention — NOT via a <script> inside a client
				 * component (React 19 disallows that). next/script beforeInteractive
				 * injects into the document early, outside the client tree.
				 */}
				<Script id='theme-init' strategy='beforeInteractive'>
					{THEME_INIT_SCRIPT}
				</Script>
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	)
}
