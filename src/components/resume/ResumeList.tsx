'use client'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeleteResume, useDuplicateResume, useResumes } from '@/hooks/useResumes'
import { cn } from '@/lib/utils'
import type { Resume } from '@/types/resume'
import { formatDistanceToNow } from 'date-fns'
import {
	Copy,
	FileText,
	FileUp,
	MoreHorizontal,
	Pencil,
	PenLine,
	Plus,
	Star,
	Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CreateResumeModal } from './CreateResumeModal'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const TEMPLATE_LABELS: Record<Resume['template'], string> = {
	modern: 'Modern',
	classic: 'Classic',
	minimal: 'Minimal',
}

// ─── Resume Card ──────────────────────────────────────────────────────────────

function ResumeCard({ resume }: { resume: Resume }) {
	const deleteResume = useDeleteResume()
	const duplicateResume = useDuplicateResume()
	const router = useRouter()

	const updatedAgo = formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })

	return (
		<div className='group relative flex flex-col rounded-xl border bg-card hover:border-primary/30 hover:shadow-sm transition-all'>
			{/* Card preview area */}
			<Link href={`/resumes/${resume.id}`} className='block'>
				<div className='h-44 rounded-t-xl bg-muted/50 flex items-center justify-center border-b overflow-hidden'>
					<ResumePreviewThumb template={resume.template} />
				</div>
			</Link>

			{/* Card footer */}
			<div className='flex items-start justify-between gap-2 p-4'>
				<div className='min-w-0'>
					<div className='flex items-center gap-1.5'>
						<p className='text-sm font-semibold text-foreground truncate'>{resume.title}</p>
						{resume.isDefault && (
							<Star className='w-3 h-3 text-amber-500 fill-amber-500 shrink-0' />
						)}
					</div>
					<p className='text-xs text-muted-foreground mt-0.5'>
						{TEMPLATE_LABELS[resume.template]}
						{resume.targetRole && ` · ${resume.targetRole}`}
					</p>
					<p className='text-xs text-muted-foreground mt-1'>Updated {updatedAgo}</p>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger
						render={props => (
							<Button
								{...props}
								variant='ghost'
								size='icon'
								className={cn(
									'w-7 h-7 shrink-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity',
									props.className,
								)}
								onClick={e => {
									e.preventDefault()
									props.onClick?.(e)
								}}
							>
								<MoreHorizontal className='w-4 h-4' />
							</Button>
						)}
					/>
					<DropdownMenuContent align='end' className='w-44'>
						<DropdownMenuItem onClick={() => router.push(`/resumes/${resume.id}`)}>
							<Pencil className='w-3.5 h-3.5 mr-2' />
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => duplicateResume.mutate(resume.id)}
							disabled={duplicateResume.isPending}
						>
							<Copy className='w-3.5 h-3.5 mr-2' />
							Duplicate
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className='text-destructive'
							onClick={() => deleteResume.mutate(resume.id)}
						>
							<Trash2 className='w-3.5 h-3.5 mr-2' />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	)
}

/** Minimal SVG-like visual preview of the resume template */
function ResumePreviewThumb({ template }: { template: Resume['template'] }) {
	const accentColor =
		template === 'modern'
			? 'bg-blue-500'
			: template === 'classic'
				? 'bg-slate-700'
				: 'bg-zinc-400'

	return (
		<div className='w-28 h-36 bg-white rounded shadow-sm p-2.5 flex flex-col gap-1.5 border'>
			{/* Header */}
			<div className={cn('h-1.5 w-2/3 rounded-full', accentColor)} />
			<div className='h-1 w-1/2 rounded-full bg-gray-200' />
			<div className='mt-0.5 h-px bg-gray-100' />
			{/* Content lines */}
			{Array.from({ length: 5 }).map((_, i) => (
				<div
					key={i}
					className={cn('h-1 rounded-full bg-gray-100', i % 3 === 0 ? 'w-full' : 'w-4/5')}
				/>
			))}
			<div className={cn('h-1 w-1/3 rounded-full mt-0.5', accentColor, 'opacity-40')} />
			{Array.from({ length: 3 }).map((_, i) => (
				<div key={i} className='h-1 rounded-full bg-gray-100 w-full' />
			))}
		</div>
	)
}

// ─── Create Button Card ───────────────────────────────────────────────────────

function NewResumeCard({ onClick }: { onClick: () => void }) {
	return (
		<button
			onClick={onClick}
			className={cn(
				'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed',
				'h-full min-h-64 text-muted-foreground',
				'hover:border-primary/40 hover:text-foreground hover:bg-muted/30',
				'transition-all cursor-pointer',
			)}
		>
			<div className='w-12 h-12 rounded-full bg-muted flex items-center justify-center'>
				<Plus className='w-6 h-6' />
			</div>
			<p className='text-sm font-medium'>Add resume</p>
		</button>
	)
}

// ─── Main list ────────────────────────────────────────────────────────────────

export function ResumeList() {
	const { data: resumes, isLoading } = useResumes()
	const [isCreateOpen, setIsCreateOpen] = useState(false)

	if (isLoading) {
		return (
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className='h-64 rounded-xl' />
				))}
			</div>
		)
	}

	const isEmpty = !resumes || resumes.length === 0

	return (
		<>
		{isEmpty ? (
			/* Full-page empty state — two options side by side */
			<div className='flex flex-col items-center justify-center py-16 gap-8'>
				<div className='text-center space-y-1'>
					<div className='w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4'>
						<FileText className='w-8 h-8 text-muted-foreground' />
					</div>
					<h3 className='text-base font-semibold'>No resumes yet</h3>
					<p className='text-sm text-muted-foreground max-w-xs'>
						Build a new resume from scratch or import your existing PDF — AI will do the heavy lifting.
					</p>
				</div>

				{/* Two option cards */}
				<div className='grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md'>
					<button
						onClick={() => setIsCreateOpen(true)}
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
							<p className='text-xs text-muted-foreground'>Start with an empty template</p>
						</div>
					</button>

					<button
						onClick={() => setIsCreateOpen(true)}
						className={cn(
							'flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center',
							'transition-all hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-border',
						)}
					>
						<div className='w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center'>
							<FileUp className='w-6 h-6 text-emerald-600 dark:text-emerald-400' />
						</div>
						<div className='space-y-0.5'>
							<p className='text-sm font-semibold'>Import PDF resume</p>
							<p className='text-xs text-muted-foreground'>AI extracts your content</p>
						</div>
					</button>
				</div>
			</div>
			) : (
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
					{resumes.map(resume => (
						<ResumeCard key={resume.id} resume={resume} />
					))}
					<NewResumeCard onClick={() => setIsCreateOpen(true)} />
				</div>
			)}

			<CreateResumeModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />
		</>
	)
}
