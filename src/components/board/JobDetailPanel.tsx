'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CalendarDays, DollarSign, ExternalLink, Link2, MapPin, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useDeleteJob, useUpdateJob } from '@/hooks/useJobs'
import { cn } from '@/lib/utils'
import { useBoardStore } from '@/stores/boardStore'
import { JOB_STATUS_LABELS, type Job, type JobStatus } from '@/types/job'

// ─── Form Schema ──────────────────────────────────────────────────────────────

const panelSchema = z.object({
	title: z.string().min(1, 'Required'),
	company: z.string().min(1, 'Required'),
	status: z.enum([
		'WISHLIST',
		'APPLIED',
		'PHONE_SCREEN',
		'INTERVIEW',
		'OFFER',
		'REJECTED',
		'WITHDRAWN',
	]),
	location: z.string().optional(),
	salary: z.string().optional(),
	// URL: valid URL or empty string (cleared field)
	url: z.string().url('Invalid URL').optional().or(z.literal('')),
	appliedAt: z.string().optional(), // "YYYY-MM-DD" from <input type="date">
	deadlineAt: z.string().optional(),
	description: z.string().optional(),
	notes: z.string().optional(),
})

type PanelForm = z.infer<typeof panelSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a Date | string | null → "YYYY-MM-DD" for <input type="date"> */
function toDateInput(val: Date | string | null | undefined): string {
	if (!val) return ''
	try {
		return format(new Date(val), 'yyyy-MM-dd')
	} catch {
		return ''
	}
}

function jobToForm(job: Job): PanelForm {
	return {
		title: job.title,
		company: job.company,
		status: job.status,
		location: job.location ?? '',
		salary: job.salary ?? '',
		url: job.url ?? '',
		// Default to today so the user doesn't have to pick a date manually
		appliedAt: toDateInput(job.appliedAt) || format(new Date(), 'yyyy-MM-dd'),
		deadlineAt: toDateInput(job.deadlineAt),
		description: job.description ?? '',
		notes: job.notes ?? '',
	}
}

// ─── Root Panel (Sheet wrapper) ───────────────────────────────────────────────

/**
 * JobDetailPanel reads `selectedJobId` and `isDetailOpen` from Zustand store.
 * Rendered once at the board level — always mounted, visibility driven by store state.
 *
 * Why rendered at board level (not inside JobCard)?
 * If we put <Sheet> inside each JobCard, we'd have N Sheet instances mounted.
 * One shared Sheet with selectedJobId is the standard pattern.
 */
export function JobDetailPanel() {
	const selectedJobId = useBoardStore(s => s.selectedJobId)
	const isDetailOpen = useBoardStore(s => s.isDetailOpen)
	const setDetailOpen = useBoardStore(s => s.setDetailOpen)
	const job = useBoardStore(s => s.jobs.find(j => j.id === selectedJobId) ?? null)

	return (
		<Sheet open={isDetailOpen} onOpenChange={setDetailOpen}>
			<SheetContent
				side='right'
				showCloseButton={false}
				className={cn(
					'flex flex-col p-0 gap-0',
					// Override the default sm:max-w-sm to give more space for job details
					'sm:max-w-[480px]',
				)}
			>
				{job ? (
					/*
					 * key={job.id} — React remounts PanelContent entirely when the user
					 * clicks a different card while the panel is already open.
					 * This resets the form without needing a useEffect.
					 */
					<PanelContent key={job.id} job={job} />
				) : (
					<div className='flex-1 flex items-center justify-center text-muted-foreground text-sm'>
						No job selected
					</div>
				)}
			</SheetContent>
		</Sheet>
	)
}

// ─── Panel Content (form) ─────────────────────────────────────────────────────

function PanelContent({ job }: { job: Job }) {
	const updateJob = useUpdateJob()
	const deleteJob = useDeleteJob()
	const setDetailOpen = useBoardStore(s => s.setDetailOpen)

	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors, isDirty },
	} = useForm<PanelForm>({
		resolver: zodResolver(panelSchema),
		defaultValues: jobToForm(job),
	})

	/**
	 * Keep form in sync when the server updates the job (e.g. drag-drop status change
	 * mutates the store → job prop changes → form should reflect new values).
	 * We only reset if NOT dirty to avoid overwriting user's unsaved edits.
	 */
	useEffect(() => {
		reset(jobToForm(job), { keepDirty: true })
	}, [job, reset])

	async function onSubmit(data: PanelForm) {
		try {
			await updateJob.mutateAsync({
				id: job.id,
				input: {
					title: data.title,
					company: data.company,
					status: data.status as JobStatus,
					location: data.location || undefined,
					salary: data.salary || undefined,
					url: data.url || undefined,
					description: data.description || undefined,
					notes: data.notes || undefined,
					// Date strings from <input type="date"> → Date objects
					appliedAt: data.appliedAt ? new Date(data.appliedAt) : null,
					deadlineAt: data.deadlineAt ? new Date(data.deadlineAt) : null,
				},
			})
			// Close after a successful save so the user returns to the board
			setDetailOpen(false)
		} catch {
			// Error toast is already fired by useUpdateJob's onError handler
		}
	}

	function handleDelete() {
		deleteJob.mutate(job.id)
		setDetailOpen(false)
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className='flex flex-col h-full'>
			{/* ── Header ──────────────────────────────────────────────────── */}
			<div className='px-5 pt-5 pb-4 border-b shrink-0'>
				<div className='flex items-start gap-3 pr-6'>
					<CompanyLogo company={job.company} />
					<div className='min-w-0 flex-1'>
						{/*
						 * Title and company as inline-editable bare inputs.
						 * They look like plain text but become active on focus.
						 * This pattern avoids a cluttered "Edit" button UX.
						 */}
						<input
							{...register('title')}
							className={cn(
								'w-full text-base font-semibold bg-transparent outline-none leading-snug',
								'border-b border-transparent hover:border-border focus:border-ring transition-colors',
								errors.title && 'border-destructive',
							)}
							placeholder='Job title'
						/>
						<input
							{...register('company')}
							className={cn(
								'w-full text-sm text-muted-foreground bg-transparent outline-none mt-0.5',
								'border-b border-transparent hover:border-border focus:border-ring transition-colors',
								errors.company && 'border-destructive',
							)}
							placeholder='Company name'
						/>
					</div>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						className='shrink-0 w-7 h-7 text-muted-foreground hover:text-foreground'
						onClick={() => setDetailOpen(false)}
					>
						<span className='sr-only'>Close</span>
						<svg
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
							className='w-4 h-4'
						>
							<path d='M18 6 6 18M6 6l12 12' />
						</svg>
					</Button>
				</div>

				{/* Status + external link row */}
				<div className='mt-3 flex items-center gap-2 flex-wrap'>
					<Controller
						control={control}
						name='status'
						render={({ field }) => (
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger size='sm' className='w-auto min-w-28'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(Object.entries(JOB_STATUS_LABELS) as [JobStatus, string][]).map(
										([value, label]) => (
											<SelectItem key={value} value={value}>
												{label}
											</SelectItem>
										),
									)}
								</SelectContent>
							</Select>
						)}
					/>

					{job.url && (
						<a href={job.url} target='_blank' rel='noopener noreferrer' className='ml-auto'>
							<Button
								type='button'
								variant='ghost'
								size='sm'
								className='gap-1.5 text-xs h-7 text-muted-foreground'
							>
								<ExternalLink className='w-3.5 h-3.5' />
								View posting
							</Button>
						</a>
					)}
				</div>
			</div>

			{/* ── Tabs ────────────────────────────────────────────────────── */}
			<Tabs defaultValue='details' className='flex flex-col flex-1 min-h-0'>
				<TabsList
					variant='line'
					className='justify-start w-full px-5 rounded-none border-b h-10 bg-transparent'
				>
					<TabsTrigger value='details'>Details</TabsTrigger>
					<TabsTrigger value='notes'>Notes</TabsTrigger>
				</TabsList>

				{/* Details tab */}
				<TabsContent
					value='details'
					className='flex-1 overflow-y-auto p-5 space-y-4 data-active:flex data-active:flex-col'
				>
					<FieldRow icon={<MapPin />} label='Location'>
						<Input
							{...register('location')}
							placeholder='e.g. Remote, New York'
							className='h-8 text-sm'
						/>
					</FieldRow>

					<FieldRow icon={<DollarSign />} label='Salary / Compensation'>
						<Input
							{...register('salary')}
							placeholder='e.g. $120k – $150k'
							className='h-8 text-sm'
						/>
					</FieldRow>

					<FieldRow icon={<Link2 />} label='Job posting URL'>
						<Input
							{...register('url')}
							type='url'
							placeholder='https://...'
							className='h-8 text-sm'
						/>
						{errors.url && (
							<p className='text-xs text-destructive mt-1'>{errors.url.message}</p>
						)}
					</FieldRow>

					<FieldRow icon={<CalendarDays />} label='Applied on'>
						<Input {...register('appliedAt')} type='date' className='h-8 text-sm w-44' />
					</FieldRow>

					<FieldRow icon={<CalendarDays />} label='Deadline'>
						<Input {...register('deadlineAt')} type='date' className='h-8 text-sm w-44' />
					</FieldRow>

					<div className='space-y-1.5'>
						<Label className='text-xs text-muted-foreground font-medium'>
							Job description
						</Label>
						<Textarea
							{...register('description')}
							placeholder='Paste the job description here to help the AI tailor your resume later...'
							className='min-h-32 text-sm resize-none'
						/>
					</div>
				</TabsContent>

				{/* Notes tab */}
				<TabsContent
					value='notes'
					className='flex-1 overflow-y-auto p-5 data-active:flex data-active:flex-col'
				>
					<div className='flex-1 flex flex-col space-y-1.5'>
						<Label className='text-xs text-muted-foreground font-medium'>
							Personal notes
						</Label>
						<p className='text-xs text-muted-foreground'>
							Interview prep, recruiter contact, follow-up tasks, salary negotiation notes...
						</p>
						<Textarea
							{...register('notes')}
							placeholder='Write anything here...'
							className='flex-1 min-h-64 text-sm resize-none'
						/>
					</div>
				</TabsContent>
			</Tabs>

			{/* ── Footer ──────────────────────────────────────────────────── */}
			<div className='px-5 py-3 border-t shrink-0 flex items-center gap-2'>
				<Button
					type='submit'
					size='sm'
					disabled={!isDirty || updateJob.isPending}
					className='flex-1'
				>
					{updateJob.isPending ? 'Saving...' : isDirty ? 'Save changes' : 'Saved'}
				</Button>

				<Button
					type='button'
					variant='ghost'
					size='icon'
					className={cn(
						'shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10',
						'transition-colors',
					)}
					onClick={handleDelete}
					disabled={deleteJob.isPending}
					title='Delete job'
				>
					<Trash2 className='w-4 h-4' />
					<span className='sr-only'>Delete job</span>
				</Button>
			</div>
		</form>
	)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldRow({
	icon,
	label,
	children,
}: {
	icon: ReactNode
	label: string
	children: ReactNode
}) {
	return (
		<div className='flex items-start gap-3'>
			<div className='mt-[9px] text-muted-foreground shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5'>
				{icon}
			</div>
			<div className='flex-1 min-w-0'>
				<Label className='text-xs text-muted-foreground font-medium block mb-1'>{label}</Label>
				{children}
			</div>
		</div>
	)
}

function CompanyLogo({ company }: { company: string }) {
	const domain = company
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '')
		.concat('.com')

	return (
		<div className='relative shrink-0 w-10 h-10'>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
				alt={`${company} logo`}
				className='w-10 h-10 rounded-lg object-contain bg-white border p-1'
				onError={e => {
					e.currentTarget.style.display = 'none'
					const fallback = e.currentTarget.nextElementSibling as HTMLElement | null
					fallback?.classList.remove('hidden')
					fallback?.classList.add('flex')
				}}
			/>
			<div className='hidden absolute inset-0 rounded-lg bg-primary/10 items-center justify-center text-sm font-bold uppercase text-primary'>
				{company.slice(0, 2)}
			</div>
		</div>
	)
}
