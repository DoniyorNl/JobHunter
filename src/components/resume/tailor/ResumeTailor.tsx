'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import {
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Download,
	FileText,
	Loader2,
	Sparkles,
	Target,
	Trash2,
	XCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ResumeData } from '@/types/resume'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ResumeListItem {
	id: string
	title: string
	targetRole: string | null
}

interface TailoredListItem {
	id: string
	resumeId: string
	jobId: string | null
	jobTitle: string
	company: string
	matchScore: number | null
	createdAt: string
}

interface KeywordAnalysis {
	technicalSkills: string[]
	softSkills: string[]
	matchScore: number
	missingKeywords: string[]
	matchedKeywords: string[]
}

interface TailorResult {
	analysis: KeywordAnalysis
	tailoredData: ResumeData
	savedId: string | null
}

// ── Form schema ────────────────────────────────────────────────────────────────

const schema = z.object({
	resumeId: z.string().min(1, 'Please select a resume'),
	jobTitle: z.string().min(1, 'Job title is required').max(200),
	company: z.string().min(1, 'Company is required').max(200),
	jobDescription: z.string().min(50, 'Paste at least 50 characters of the job description').max(10_000),
})
type FormValues = z.infer<typeof schema>

// ── API helpers ────────────────────────────────────────────────────────────────

async function fetchResumes(): Promise<ResumeListItem[]> {
	const res = await fetch('/api/resumes')
	if (!res.ok) throw new Error('Failed to load resumes')
	const { data } = await res.json()
	return data
}

async function fetchTailored(resumeId: string): Promise<TailoredListItem[]> {
	const res = await fetch(`/api/resumes/${resumeId}/tailored`)
	if (!res.ok) return []
	const { data } = await res.json()
	return data
}

async function runTailor(input: FormValues & { save: boolean }): Promise<TailorResult> {
	const res = await fetch('/api/ai/tailor', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	})
	if (!res.ok) {
		const b = await res.json().catch(() => ({}))
		throw new Error(b.error ?? 'Tailoring failed')
	}
	const { data } = await res.json()
	return data
}

async function deleteTailored(resumeId: string, tailoredId: string): Promise<void> {
	const res = await fetch(`/api/resumes/${resumeId}/tailored/${tailoredId}`, { method: 'DELETE' })
	if (!res.ok) throw new Error('Failed to delete')
}

// ── Score badge ────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
	const color =
		score >= 80
			? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
			: score >= 60
				? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
				: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'

	return (
		<span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-semibold', color)}>
			<Target className='w-3.5 h-3.5' />
			{score}% match
		</span>
	)
}

// ── Score ring ─────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
	const radius = 36
	const circumference = 2 * Math.PI * radius
	const dash = (score / 100) * circumference
	const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444'

	return (
		<div className='relative w-24 h-24 flex items-center justify-center'>
			<svg width='96' height='96' className='-rotate-90'>
				<circle cx='48' cy='48' r={radius} fill='none' stroke='currentColor'
					className='text-muted/30' strokeWidth='8' />
				<circle cx='48' cy='48' r={radius} fill='none' stroke={color}
					strokeWidth='8' strokeDasharray={`${dash} ${circumference}`}
					strokeLinecap='round' className='transition-all duration-700' />
			</svg>
			<span className='absolute text-xl font-black' style={{ color }}>{score}%</span>
		</div>
	)
}

// ── Keyword chip ───────────────────────────────────────────────────────────────

function KeywordChip({ label, matched }: { label: string; matched: boolean }) {
	return (
		<span className={cn(
			'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
			matched
				? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
				: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
		)}>
			{matched
				? <CheckCircle2 className='w-3 h-3' />
				: <XCircle className='w-3 h-3' />}
			{label}
		</span>
	)
}

// ── Analysis panel ─────────────────────────────────────────────────────────────

function AnalysisPanel({ result, resumeId }: { result: TailorResult; resumeId: string }) {
	const { analysis, tailoredData } = result
	const [showBullets, setShowBullets] = useState(false)

	async function handleDownload() {
		// Lazy-load PDF export to keep initial bundle small
		const { exportToPDF } = await import('@/lib/pdf-export')
		const element = document.getElementById('tailor-pdf-target')
		if (!element) {
			toast.error('Preview not ready — try again')
			return
		}
		toast.promise(exportToPDF('tailor-pdf-target', `tailored-resume`), {
			loading: 'Generating PDF…',
			success: 'PDF downloaded',
			error: 'PDF export failed',
		})
	}

	return (
		<div className='rounded-xl border bg-card divide-y'>
			{/* Score header */}
			<div className='flex items-center gap-6 p-6'>
				<ScoreRing score={analysis.matchScore} />
				<div className='space-y-1'>
					<h3 className='text-base font-semibold'>Match Analysis</h3>
					<p className='text-sm text-muted-foreground'>
						Your resume matches <strong>{analysis.matchScore}%</strong> of the job requirements.
					</p>
					{analysis.matchScore < 70 && (
						<p className='flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400'>
							<AlertCircle className='w-3.5 h-3.5 shrink-0' />
							Add missing keywords to improve your chances.
						</p>
					)}
				</div>
				<Button variant='outline' size='sm' className='ml-auto gap-2 shrink-0' onClick={handleDownload}>
					<Download className='w-3.5 h-3.5' />
					Download PDF
				</Button>
			</div>

			{/* Keywords */}
			<div className='p-6 space-y-4'>
				{analysis.matchedKeywords.length > 0 && (
					<div className='space-y-2'>
						<p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
							Matched ({analysis.matchedKeywords.length})
						</p>
						<div className='flex flex-wrap gap-2'>
							{analysis.matchedKeywords.map(k => (
								<KeywordChip key={k} label={k} matched />
							))}
						</div>
					</div>
				)}

				{analysis.missingKeywords.length > 0 && (
					<div className='space-y-2'>
						<p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
							Missing ({analysis.missingKeywords.length}) — add these to your resume
						</p>
						<div className='flex flex-wrap gap-2'>
							{analysis.missingKeywords.map(k => (
								<KeywordChip key={k} label={k} matched={false} />
							))}
						</div>
					</div>
				)}
			</div>

			{/* Tailored bullets preview */}
			{tailoredData.experience.length > 0 && (
				<div className='p-6 space-y-3'>
					<button
						onClick={() => setShowBullets(v => !v)}
						className='flex items-center gap-2 text-sm font-semibold w-full text-left'
					>
						<Sparkles className='w-4 h-4 text-primary' />
						AI-tailored bullet points
						{showBullets ? <ChevronUp className='w-4 h-4 ml-auto' /> : <ChevronDown className='w-4 h-4 ml-auto' />}
					</button>

					{showBullets && (
						<div className='space-y-4 pt-2'>
							{tailoredData.experience.map(exp => (
								<div key={exp.id} className='space-y-1.5'>
									<p className='text-xs font-medium text-muted-foreground'>
										{exp.title} @ {exp.company}
									</p>
									<ul className='space-y-1'>
										{exp.bullets.map((b, i) => (
											<li key={i} className='flex items-start gap-2 text-sm'>
												<span className='text-primary mt-1 shrink-0'>•</span>
												{b}
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Hidden full-size resume for PDF export */}
			<div id='tailor-pdf-target' style={{ position: 'fixed', left: -9999, top: 0, zIndex: -1 }}>
				<TailoredResumePreview data={tailoredData} resumeId={resumeId} />
			</div>
		</div>
	)
}

/**
 * Lazy component — renders the appropriate template for PDF export.
 * Uses useEffect (not useState) to load the template dynamically.
 */
function TailoredResumePreview({ data, resumeId }: { data: ResumeData; resumeId: string }) {
	const { data: resumeInfo } = useQuery({
		queryKey: ['resume', resumeId],
		queryFn: async () => {
			const res = await fetch(`/api/resumes/${resumeId}`)
			return res.ok ? (await res.json()).data : null
		},
	})

	const template = resumeInfo?.template ?? 'modern'
	const [TemplateComp, setTemplateComp] = useState<React.ComponentType<{ data: ResumeData }> | null>(null)

	useEffect(() => {
		let cancelled = false
		async function load() {
			let comp: React.ComponentType<{ data: ResumeData }>
			if (template === 'classic') {
				const { ClassicTemplate } = await import('../builder/ClassicTemplate')
				comp = ClassicTemplate
			} else if (template === 'minimal') {
				const { MinimalTemplate } = await import('../builder/MinimalTemplate')
				comp = MinimalTemplate
			} else {
				const { ModernTemplate } = await import('../builder/ModernTemplate')
				comp = ModernTemplate
			}
			if (!cancelled) setTemplateComp(() => comp)
		}
		load()
		return () => { cancelled = true }
	}, [template])

	if (!TemplateComp) return null
	return <TemplateComp data={data} />
}

// ── Saved tailored versions list ───────────────────────────────────────────────

function SavedVersions({ resumeId }: { resumeId: string }) {
	const qc = useQueryClient()
	const { data: versions, isLoading } = useQuery({
		queryKey: ['tailored', resumeId],
		queryFn: () => fetchTailored(resumeId),
		enabled: !!resumeId,
		staleTime: 30_000,
	})

	const deleteMutation = useMutation({
		mutationFn: ({ tailoredId }: { tailoredId: string }) => deleteTailored(resumeId, tailoredId),
		onMutate: async ({ tailoredId }) => {
			await qc.cancelQueries({ queryKey: ['tailored', resumeId] })
			const prev = qc.getQueryData<TailoredListItem[]>(['tailored', resumeId])
			qc.setQueryData<TailoredListItem[]>(['tailored', resumeId], old => old?.filter(t => t.id !== tailoredId))
			return { prev }
		},
		onSuccess: () => toast.success('Deleted'),
		onError: (_e, _v, ctx) => {
			if (ctx?.prev) qc.setQueryData(['tailored', resumeId], ctx.prev)
			toast.error('Delete failed')
		},
	})

	if (isLoading) return <Skeleton className='h-20 rounded-xl' />
	if (!versions || versions.length === 0) return null

	return (
		<div className='space-y-2'>
			<h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
				Saved versions ({versions.length})
			</h3>
			<div className='space-y-2'>
				{versions.map(v => (
					<div key={v.id} className='flex items-center gap-3 rounded-lg border bg-card px-4 py-3'>
						<div className='flex-1 min-w-0'>
							<p className='text-sm font-medium truncate'>{v.jobTitle} · {v.company}</p>
							<p className='text-xs text-muted-foreground'>
								{format(new Date(v.createdAt), 'MMM d, yyyy')}
							</p>
						</div>
						{v.matchScore !== null && <ScoreBadge score={v.matchScore} />}
						<Button
							variant='ghost'
							size='icon'
							className='w-8 h-8 text-muted-foreground hover:text-destructive'
							onClick={() => deleteMutation.mutate({ tailoredId: v.id })}
							disabled={deleteMutation.isPending}
						>
							<Trash2 className='w-4 h-4' />
						</Button>
					</div>
				))}
			</div>
		</div>
	)
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ResumeTailor() {
	const qc = useQueryClient()
	const [result, setResult] = useState<TailorResult | null>(null)

	const { data: resumes, isLoading: resumesLoading } = useQuery({
		queryKey: ['resumes'],
		queryFn: fetchResumes,
		staleTime: 60_000,
	})

	const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
		resolver: zodResolver(schema),
	})

	const selectedResumeId = watch('resumeId')

	const tailor = useMutation({
		mutationFn: (values: FormValues) => runTailor({ ...values, save: true }),
		onSuccess: (data) => {
			setResult(data)
			// Invalidate tailored list so saved version appears immediately
			qc.invalidateQueries({ queryKey: ['tailored', selectedResumeId] })
			toast.success('Analysis complete — result saved')
		},
		onError: (e: Error) => toast.error(e.message),
	})

	async function onSubmit(values: FormValues) {
		setResult(null)
		tailor.mutate(values)
	}

	return (
		<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
			{/* Left — Input form */}
			<div className='space-y-6'>
				<form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
					{/* Resume selector */}
					<div className='space-y-1.5'>
						<Label>Resume <span className='text-destructive'>*</span></Label>
						{resumesLoading ? (
							<Skeleton className='h-10 rounded-lg' />
						) : !resumes || resumes.length === 0 ? (
							// Empty state — guide user to create a resume first
							<div className='flex items-center gap-3 rounded-lg border-2 border-dashed border-muted px-4 py-3'>
								<FileText className='w-5 h-5 text-muted-foreground shrink-0' />
								<div className='text-sm'>
									<p className='text-muted-foreground'>No resumes yet.</p>
									<Link
										href='/resumes'
										className='font-medium text-primary underline-offset-4 hover:underline'
									>
										Create your first resume →
									</Link>
								</div>
							</div>
						) : (
							<Select onValueChange={(v: string | null) => { if (v) { setValue('resumeId', v); setResult(null) } }}>
								<SelectTrigger className='w-full'>
									<SelectValue placeholder='Select a resume to tailor…' />
								</SelectTrigger>
								<SelectContent>
									{resumes.map(r => (
										<SelectItem key={r.id} value={r.id}>
											{r.title}
											{r.targetRole ? ` · ${r.targetRole}` : ''}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
						{errors.resumeId && <p className='text-xs text-destructive'>{errors.resumeId.message}</p>}
					</div>

					{/* Job info */}
					<div className='grid grid-cols-2 gap-3'>
						<div className='space-y-1.5'>
							<Label>Job Title <span className='text-destructive'>*</span></Label>
							<Input {...register('jobTitle')} placeholder='Software Engineer' />
							{errors.jobTitle && <p className='text-xs text-destructive'>{errors.jobTitle.message}</p>}
						</div>
						<div className='space-y-1.5'>
							<Label>Company <span className='text-destructive'>*</span></Label>
							<Input {...register('company')} placeholder='Google' />
							{errors.company && <p className='text-xs text-destructive'>{errors.company.message}</p>}
						</div>
					</div>

					{/* Job description */}
					<div className='space-y-1.5'>
						<Label>Job Description <span className='text-destructive'>*</span></Label>
						<Textarea
							{...register('jobDescription')}
							placeholder='Paste the full job description here…'
							rows={12}
							className='resize-none font-mono text-xs leading-relaxed'
						/>
						{errors.jobDescription && (
							<p className='text-xs text-destructive'>{errors.jobDescription.message}</p>
						)}
						<p className='text-xs text-muted-foreground'>
							Tip: paste the complete job description for the most accurate match analysis.
						</p>
					</div>

					<Button type='submit' className='w-full gap-2' disabled={tailor.isPending}>
						{tailor.isPending ? (
							<>
								<Loader2 className='w-4 h-4 animate-spin' />
								Analysing with AI…
							</>
						) : (
							<>
								<Sparkles className='w-4 h-4' />
								Tailor my resume
							</>
						)}
					</Button>
				</form>

				{/* Saved versions for the selected resume */}
				{selectedResumeId && <SavedVersions resumeId={selectedResumeId} />}
			</div>

			{/* Right — Results */}
			<div className='space-y-6'>
				{tailor.isPending && (
					<div className='rounded-xl border bg-card p-8 space-y-4'>
						<div className='flex items-center gap-3'>
							<Loader2 className='w-5 h-5 animate-spin text-primary' />
							<p className='text-sm font-medium'>AI is analysing your resume…</p>
						</div>
						<div className='space-y-2'>
							<Skeleton className='h-3 w-full rounded-full' />
							<Skeleton className='h-3 w-5/6 rounded-full' />
							<Skeleton className='h-3 w-4/6 rounded-full' />
						</div>
						<p className='text-xs text-muted-foreground'>
							This takes 5–15 seconds. We're extracting keywords, scoring your match, and rewriting bullet points.
						</p>
					</div>
				)}

				{result && !tailor.isPending && (
					<AnalysisPanel result={result} resumeId={selectedResumeId} />
				)}

				{!result && !tailor.isPending && (
					<div className='rounded-xl border-2 border-dashed border-muted flex flex-col items-center justify-center gap-3 py-24 text-center'>
						<div className='w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center'>
							<Target className='w-6 h-6 text-primary' />
						</div>
						<div className='space-y-1'>
							<p className='text-sm font-semibold'>Results will appear here</p>
							<p className='text-xs text-muted-foreground max-w-xs'>
								Select a resume, paste a job description, and click "Tailor my resume" to see your match score and AI suggestions.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
