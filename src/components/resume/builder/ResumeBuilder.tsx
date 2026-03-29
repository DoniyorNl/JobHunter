'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Download, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useResumeStore } from '@/stores/resumeStore'
import type { Resume } from '@/types/resume'
import { exportToPDF } from '@/lib/pdf-export'

import { PersonalInfoSection } from './PersonalInfoSection'
import { ExperienceSection } from './ExperienceSection'
import { EducationSection } from './EducationSection'
import { SkillsSection } from './SkillsSection'
import { ResumePreview } from './ResumePreview'
import { ModernTemplate } from './ModernTemplate'
import { ClassicTemplate } from './ClassicTemplate'
import { MinimalTemplate } from './MinimalTemplate'

interface ResumeBuilderProps {
	resume: Resume
}

/**
 * Main Resume Builder — split view (editor left, preview right).
 *
 * Auto-save: watches `isDirty` and debounces the PATCH call by 2 seconds.
 * This gives a Google Docs–like experience: edits save automatically without
 * the user needing to think about it.
 *
 * Why debounce and NOT save on every keystroke?
 * Each PATCH call hits the DB. Debouncing collapses 50 rapid keystrokes into
 * 1 call, preventing unnecessary DB writes and flickering "Saving…" indicators.
 */
export function ResumeBuilder({ resume }: ResumeBuilderProps) {
	const load = useResumeStore(s => s.load)
	const data = useResumeStore(s => s.data)
	const isDirty = useResumeStore(s => s.isDirty)
	const isSaving = useResumeStore(s => s.isSaving)
	const setIsSaving = useResumeStore(s => s.setIsSaving)
	const markSaved = useResumeStore(s => s.markSaved)
	const resumeTitle = useResumeStore(s => s.resumeTitle)
	const resumeId = useResumeStore(s => s.resumeId)
	const template = useResumeStore(s => s.template)

	const [isExporting, setIsExporting] = useState(false)

	// Hydrate store from server-fetched data on mount
	useEffect(() => {
		load({
			id: resume.id,
			title: resume.title,
			template: resume.template,
			data: resume.data,
		})
	}, [resume, load])

	// ── Auto-save ──────────────────────────────────────────────────────────────
	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const save = useCallback(async () => {
		if (!resumeId) return
		setIsSaving(true)
		try {
			const res = await fetch(`/api/resumes/${resumeId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ data }),
			})
			if (!res.ok) throw new Error('Save failed')
			markSaved()
		} catch {
			toast.error('Failed to save resume')
			setIsSaving(false)
		}
	}, [resumeId, data, setIsSaving, markSaved])

	useEffect(() => {
		if (!isDirty) return

		// Clear any pending save before starting a new one
		if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

		saveTimerRef.current = setTimeout(() => {
			void save()
		}, 2000)

		return () => {
			if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
		}
	}, [isDirty, data, save])

	async function handleExportPDF() {
		setIsExporting(true)
		try {
			// Render the full-size (unscaled) template into a hidden div, capture it
			await exportToPDF('resume-export-target', resumeTitle ?? 'resume')
		} catch {
			toast.error('Failed to export PDF')
		} finally {
			setIsExporting(false)
		}
	}

	return (
		<div className='flex flex-col h-full'>
			{/* ── Builder header ────────────────────────────────────────── */}
			<header className='flex items-center justify-between px-4 h-13 border-b bg-background shrink-0 gap-3'>
				<div className='flex items-center gap-3 min-w-0'>
					<Link href='/resumes'>
						<Button variant='ghost' size='icon' className='w-8 h-8 shrink-0'>
							<ArrowLeft className='w-4 h-4' />
						</Button>
					</Link>
					<h1 className='text-sm font-semibold text-foreground truncate'>{resumeTitle}</h1>
				</div>

				{/* Save status + Export */}
				<div className='flex items-center gap-2 shrink-0'>
					{isSaving ? (
						<span className='flex items-center gap-1.5 text-xs text-muted-foreground'>
							<Loader2 className='w-3.5 h-3.5 animate-spin' />
							Saving…
						</span>
					) : isDirty ? (
						<Button size='sm' className='h-7 gap-1.5 text-xs' onClick={() => void save()}>
							<Save className='w-3.5 h-3.5' />
							Save
						</Button>
					) : (
						<span className='flex items-center gap-1.5 text-xs text-muted-foreground'>
							<Check className='w-3.5 h-3.5 text-green-500' />
							Saved
						</span>
					)}

					<Button
						variant='outline'
						size='sm'
						className='h-7 gap-1.5 text-xs'
						onClick={handleExportPDF}
						disabled={isExporting}
					>
						{isExporting ? (
							<Loader2 className='w-3.5 h-3.5 animate-spin' />
						) : (
							<Download className='w-3.5 h-3.5' />
						)}
						{isExporting ? 'Exporting…' : 'Export PDF'}
					</Button>
				</div>
			</header>

			{/* ── Split view ────────────────────────────────────────────── */}
			<div className='flex flex-1 overflow-hidden'>
				{/* Left: Editor (scrollable) */}
				<div className='w-full lg:w-[55%] flex flex-col border-r overflow-hidden'>
					{/*
					 * Tabs on mobile so the preview is still accessible.
					 * On lg+ screens, the preview panel is always visible to the right.
					 */}
					<Tabs defaultValue='edit' className='flex flex-col flex-1 min-h-0 lg:hidden'>
						<TabsList variant='line' className='justify-start w-full px-4 rounded-none border-b h-10 bg-transparent shrink-0'>
							<TabsTrigger value='edit'>Editor</TabsTrigger>
							<TabsTrigger value='preview'>Preview</TabsTrigger>
						</TabsList>
						<TabsContent
							value='edit'
							className='flex-1 overflow-y-auto data-active:flex data-active:flex-col'
						>
							<EditorSections />
						</TabsContent>
						<TabsContent
							value='preview'
							className='flex-1 overflow-y-auto bg-muted/30 data-active:flex data-active:flex-col'
						>
							<div className='flex justify-center p-4'>
								<ResumePreview />
							</div>
						</TabsContent>
					</Tabs>

					{/* Desktop: editor always visible */}
					<div className='hidden lg:flex flex-col flex-1 overflow-y-auto'>
						<EditorSections />
					</div>
				</div>

			{/* Right: Preview (desktop only) */}
			<div className='hidden lg:flex flex-1 overflow-y-auto bg-muted/30 items-start justify-center p-6'>
				<ResumePreview />
			</div>
		</div>

		{/*
		 * Hidden full-size render target for PDF export.
		 * html2canvas captures this element at 1:1 scale (794px wide = A4).
		 * position:fixed + left:-9999px keeps it off-screen but still rendered.
		 */}
		<div
			id='resume-export-target'
			style={{ position: 'fixed', left: -9999, top: 0, zIndex: -1 }}
		>
			{template === 'classic' ? (
				<ClassicTemplate data={data} />
			) : template === 'minimal' ? (
				<MinimalTemplate data={data} />
			) : (
				<ModernTemplate data={data} />
			)}
		</div>
	</div>
	)
}

/** All editor sections stacked vertically */
function EditorSections() {
	return (
		<div className='px-5 py-5 space-y-6 pb-20'>
			<PersonalInfoSection />
			<ExperienceSection />
			<EducationSection />
			<SkillsSection />
		</div>
	)
}
