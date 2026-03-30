'use client'

import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import {
	CheckCircle2,
	FileText,
	FileUp,
	Loader2,
	PenLine,
	Upload,
	X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateResume } from '@/hooks/useResumes'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

type Mode = 'choose' | 'scratch' | 'import'

const TEMPLATES = [
	{ value: 'modern' as const, label: 'Modern', description: 'Clean layout with accent colors', accent: 'bg-blue-500' },
	{ value: 'classic' as const, label: 'Classic', description: 'Traditional single-column format', accent: 'bg-slate-700' },
	{ value: 'minimal' as const, label: 'Minimal', description: 'Ultra-clean, typography-focused', accent: 'bg-zinc-400' },
]

// ── Build-from-scratch form ───────────────────────────────────────────────────

const scratchSchema = z.object({
	title: z.string().min(1, 'Title is required').max(200),
	targetRole: z.string().max(200).optional(),
	template: z.enum(['modern', 'classic', 'minimal']),
})
type ScratchForm = z.infer<typeof scratchSchema>

function ScratchForm({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
	const createResume = useCreateResume()
	const router = useRouter()

	const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ScratchForm>({
		resolver: zodResolver(scratchSchema),
		defaultValues: { template: 'modern' },
	})

	async function onSubmit(data: ScratchForm) {
		const resume = await createResume.mutateAsync({
			title: data.title,
			targetRole: data.targetRole || undefined,
			template: data.template,
		})
		reset()
		onClose()
		router.push(`/resumes/${resume.id}`)
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className='space-y-5 py-2'>
			<div className='space-y-1.5'>
				<Label htmlFor='scratch-title'>Resume name</Label>
				<Input id='scratch-title' {...register('title')} placeholder='e.g. Software Engineer Resume' autoFocus />
				{errors.title && <p className='text-xs text-destructive'>{errors.title.message}</p>}
			</div>

			<div className='space-y-1.5'>
				<Label htmlFor='scratch-role'>
					Target role <span className='text-muted-foreground font-normal'>(optional)</span>
				</Label>
				<Input id='scratch-role' {...register('targetRole')} placeholder='e.g. Senior Frontend Engineer' />
			</div>

			<div className='space-y-2'>
				<Label>Template</Label>
				<Controller
					control={control}
					name='template'
					render={({ field }) => (
						<div className='grid grid-cols-3 gap-2'>
							{TEMPLATES.map(t => (
								<button
									key={t.value}
									type='button'
									onClick={() => field.onChange(t.value)}
									className={cn(
										'relative flex flex-col gap-2 p-3 rounded-lg border-2 text-left transition-all',
										field.value === t.value
											? 'border-primary bg-primary/5'
											: 'border-border hover:border-border/80 hover:bg-muted/50',
									)}
								>
									<div className='space-y-1'>
										<div className={cn('h-1.5 w-3/4 rounded-full', t.accent)} />
										<div className='h-1 w-full rounded-full bg-muted-foreground/20' />
										<div className='h-1 w-5/6 rounded-full bg-muted-foreground/20' />
										<div className='h-1 w-2/3 rounded-full bg-muted-foreground/20' />
									</div>
									<div>
										<p className='text-xs font-semibold'>{t.label}</p>
										<p className='text-[10px] text-muted-foreground leading-tight'>{t.description}</p>
									</div>
									{field.value === t.value && (
										<CheckCircle2 className='absolute top-2 right-2 w-3.5 h-3.5 text-primary' />
									)}
								</button>
							))}
						</div>
					)}
				/>
			</div>

			<DialogFooter>
				<Button type='button' variant='ghost' onClick={onBack} disabled={createResume.isPending}>Back</Button>
				<Button type='submit' disabled={createResume.isPending}>
					{createResume.isPending ? 'Creating…' : 'Create resume'}
				</Button>
			</DialogFooter>
		</form>
	)
}

// ── Import-PDF form ───────────────────────────────────────────────────────────

const importSchema = z.object({
	title: z.string().min(1, 'Resume name is required').max(200),
	targetRole: z.string().max(200).optional(),
	template: z.enum(['modern', 'classic', 'minimal']),
})
type ImportForm = z.infer<typeof importSchema>

async function parseResume(input: {
	pdfBase64: string
	title: string
	targetRole?: string
	template: string
}) {
	const res = await fetch('/api/ai/parse-resume', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...input, mimeType: 'application/pdf' }),
	})
	if (!res.ok) {
		const b = await res.json().catch(() => ({}))
		throw new Error(b.error ?? 'Parsing failed')
	}
	const { data } = await res.json()
	return data
}

function readFileAsBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => {
			// result is "data:application/pdf;base64,<ACTUAL_BASE64>"
			// We only need the base64 part after the comma
			const result = reader.result as string
			const base64 = result.split(',')[1]
			if (!base64) reject(new Error('Failed to read file'))
			else resolve(base64)
		}
		reader.onerror = () => reject(new Error('Failed to read file'))
		reader.readAsDataURL(file)
	})
}

function ImportPDFForm({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
	const router = useRouter()
	const qc = useQueryClient()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [file, setFile] = useState<File | null>(null)
	const [isDragging, setIsDragging] = useState(false)

	const { register, handleSubmit, control, formState: { errors } } = useForm<ImportForm>({
		resolver: zodResolver(importSchema),
		defaultValues: { template: 'modern' },
	})

	const importMutation = useMutation({
		mutationFn: async (data: ImportForm) => {
			if (!file) throw new Error('Please select a PDF file')
			const pdfBase64 = await readFileAsBase64(file)
			return parseResume({
				pdfBase64,
				title: data.title,
				targetRole: data.targetRole || undefined,
				template: data.template,
			})
		},
		onSuccess: (resume) => {
			qc.invalidateQueries({ queryKey: ['resumes'] })
			onClose()
			router.push(`/resumes/${resume.id}`)
		},
		onError: (e: Error) => toast.error(e.message),
	})

	function handleFileSelect(selected: File | null) {
		if (!selected) return
		if (selected.type !== 'application/pdf') {
			toast.error('Only PDF files are supported')
			return
		}
		if (selected.size > 10 * 1024 * 1024) {
			toast.error('File must be smaller than 10 MB')
			return
		}
		setFile(selected)
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault()
		setIsDragging(false)
		handleFileSelect(e.dataTransfer.files[0] ?? null)
	}

	return (
		<form onSubmit={handleSubmit(data => importMutation.mutate(data))} className='space-y-5 py-2'>
			{/* Drop zone */}
			<div
				onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
				onDragLeave={() => setIsDragging(false)}
				onDrop={handleDrop}
				onClick={() => !file && fileInputRef.current?.click()}
				className={cn(
					'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 transition-all',
					file
						? 'border-primary/40 bg-primary/5 cursor-default'
						: isDragging
							? 'border-primary bg-primary/10 cursor-copy'
							: 'border-muted-foreground/30 hover:border-primary/40 hover:bg-muted/30 cursor-pointer',
				)}
			>
				<input
					ref={fileInputRef}
					type='file'
					accept='application/pdf'
					className='sr-only'
					onChange={e => handleFileSelect(e.target.files?.[0] ?? null)}
				/>

				{file ? (
					<>
						<div className='w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center'>
							<FileText className='w-6 h-6 text-primary' />
						</div>
						<div className='text-center space-y-0.5'>
							<p className='text-sm font-medium text-foreground'>{file.name}</p>
							<p className='text-xs text-muted-foreground'>
								{(file.size / 1024).toFixed(0)} KB — Ready to import
							</p>
						</div>
						<Button
							type='button'
							variant='ghost'
							size='sm'
							className='absolute top-2 right-2 w-7 h-7 p-0'
							onClick={e => { e.stopPropagation(); setFile(null) }}
						>
							<X className='w-3.5 h-3.5' />
						</Button>
					</>
				) : (
					<>
						<div className='w-12 h-12 rounded-xl bg-muted flex items-center justify-center'>
							<Upload className='w-6 h-6 text-muted-foreground' />
						</div>
						<div className='text-center space-y-1'>
							<p className='text-sm font-medium'>Drop your PDF here</p>
							<p className='text-xs text-muted-foreground'>or click to browse — max 10 MB</p>
						</div>
					</>
				)}
			</div>

			{/* Resume name */}
			<div className='space-y-1.5'>
				<Label htmlFor='import-title'>Resume name</Label>
				<Input
					id='import-title'
					{...register('title')}
					placeholder='e.g. My Resume'
					autoFocus
				/>
				{errors.title && <p className='text-xs text-destructive'>{errors.title.message}</p>}
			</div>

			<div className='space-y-1.5'>
				<Label htmlFor='import-role'>
					Target role <span className='text-muted-foreground font-normal'>(optional)</span>
				</Label>
				<Input id='import-role' {...register('targetRole')} placeholder='e.g. Product Manager' />
			</div>

			{/* Template pick */}
			<div className='space-y-2'>
				<Label>Template</Label>
				<Controller
					control={control}
					name='template'
					render={({ field }) => (
						<div className='grid grid-cols-3 gap-2'>
							{TEMPLATES.map(t => (
								<button
									key={t.value}
									type='button'
									onClick={() => field.onChange(t.value)}
									className={cn(
										'relative flex flex-col gap-2 p-3 rounded-lg border-2 text-left transition-all',
										field.value === t.value
											? 'border-primary bg-primary/5'
											: 'border-border hover:border-border/80 hover:bg-muted/50',
									)}
								>
									<div className='space-y-1'>
										<div className={cn('h-1.5 w-3/4 rounded-full', t.accent)} />
										<div className='h-1 w-full rounded-full bg-muted-foreground/20' />
										<div className='h-1 w-5/6 rounded-full bg-muted-foreground/20' />
									</div>
									<p className='text-xs font-semibold'>{t.label}</p>
									{field.value === t.value && (
										<CheckCircle2 className='absolute top-2 right-2 w-3.5 h-3.5 text-primary' />
									)}
								</button>
							))}
						</div>
					)}
				/>
			</div>

			{/* AI notice */}
			<p className='text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2'>
				AI will extract your name, contact info, experience, education, and skills from the PDF.
				You can edit everything afterwards in the builder.
			</p>

			<DialogFooter>
				<Button type='button' variant='ghost' onClick={onBack} disabled={importMutation.isPending}>
					Back
				</Button>
				<Button type='submit' disabled={importMutation.isPending || !file} className='gap-2'>
					{importMutation.isPending ? (
						<><Loader2 className='w-4 h-4 animate-spin' />Parsing with AI…</>
					) : (
						<><FileUp className='w-4 h-4' />Import resume</>
					)}
				</Button>
			</DialogFooter>
		</form>
	)
}

// ── Choose mode ───────────────────────────────────────────────────────────────

function ChooseMode({ onChoose }: { onChoose: (m: 'scratch' | 'import') => void }) {
	return (
		<div className='grid grid-cols-2 gap-3 py-4'>
			<button
				onClick={() => onChoose('scratch')}
				className={cn(
					'flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center',
					'transition-all hover:border-primary/50 hover:bg-primary/5 border-border',
				)}
			>
				<div className='w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center'>
					<PenLine className='w-6 h-6 text-primary' />
				</div>
				<div className='space-y-0.5'>
					<p className='text-sm font-semibold'>Build from scratch</p>
					<p className='text-xs text-muted-foreground leading-relaxed'>
						Start with an empty template and fill in your details
					</p>
				</div>
			</button>

			<button
				onClick={() => onChoose('import')}
				className={cn(
					'flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center',
					'transition-all hover:border-primary/50 hover:bg-primary/5 border-border',
				)}
			>
				<div className='w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center'>
					<FileUp className='w-6 h-6 text-emerald-600 dark:text-emerald-400' />
				</div>
				<div className='space-y-0.5'>
					<p className='text-sm font-semibold'>Import PDF resume</p>
					<p className='text-xs text-muted-foreground leading-relaxed'>
						Upload your existing resume — AI extracts all content
					</p>
				</div>
			</button>
		</div>
	)
}

// ── Modal root ─────────────────────────────────────────────────────────────────

interface CreateResumeModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

const MODE_TITLES: Record<Mode, string> = {
	choose: 'Add resume',
	scratch: 'Build from scratch',
	import: 'Import PDF resume',
}
const MODE_DESCRIPTIONS: Record<Mode, string> = {
	choose: 'Create a new resume or import an existing one.',
	scratch: 'Choose a template and give your resume a name to get started.',
	import: 'Upload a PDF — AI will extract and structure all the content for you.',
}

export function CreateResumeModal({ open, onOpenChange }: CreateResumeModalProps) {
	const [mode, setMode] = useState<Mode>('choose')

	function handleClose() {
		onOpenChange(false)
		// Reset to choose mode after animation
		setTimeout(() => setMode('choose'), 300)
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>{MODE_TITLES[mode]}</DialogTitle>
					<DialogDescription>{MODE_DESCRIPTIONS[mode]}</DialogDescription>
				</DialogHeader>

				{mode === 'choose' && <ChooseMode onChoose={setMode} />}
				{mode === 'scratch' && <ScratchForm onBack={() => setMode('choose')} onClose={handleClose} />}
				{mode === 'import' && <ImportPDFForm onBack={() => setMode('choose')} onClose={handleClose} />}
			</DialogContent>
		</Dialog>
	)
}
