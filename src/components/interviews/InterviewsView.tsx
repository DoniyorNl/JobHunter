'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, isFuture, isPast, isToday } from 'date-fns'
import {
	Calendar,
	Clock,
	MapPin,
	MoreHorizontal,
	NotebookText,
	Plus,
	Trash2,
} from 'lucide-react'

import { parseJsonSafe } from '@/lib/fetch-json'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

const INTERVIEW_TYPES = ['PHONE_SCREEN', 'TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'TAKE_HOME', 'FINAL', 'OFFER_CALL'] as const
type InterviewType = typeof INTERVIEW_TYPES[number]

const TYPE_LABELS: Record<InterviewType, string> = {
	PHONE_SCREEN: 'Phone Screen',
	TECHNICAL: 'Technical',
	BEHAVIORAL: 'Behavioral',
	SYSTEM_DESIGN: 'System Design',
	TAKE_HOME: 'Take Home',
	FINAL: 'Final Round',
	OFFER_CALL: 'Offer Call',
}

const TYPE_COLORS: Record<InterviewType, string> = {
	PHONE_SCREEN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
	TECHNICAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
	BEHAVIORAL: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
	SYSTEM_DESIGN: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
	TAKE_HOME: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
	FINAL: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
	OFFER_CALL: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

interface Interview {
	id: string
	type: InterviewType
	scheduledAt: string
	duration: number | null
	location: string | null
	notes: string | null
	feedback: string | null
	createdAt: string
	job: { id: string; title: string; company: string }
}

// ── API ────────────────────────────────────────────────────────────────────────

async function fetchInterviews(): Promise<Interview[]> {
	const res = await fetch('/api/interviews')
	const body = await parseJsonSafe<{ data?: Interview[]; error?: string }>(res)
	if (!res.ok) throw new Error(body?.error ?? `Failed to fetch interviews (${res.status})`)
	return body?.data ?? []
}

async function fetchJobs(): Promise<{ id: string; title: string; company: string }[]> {
	const res = await fetch('/api/jobs')
	const body = await parseJsonSafe<{ data?: { id: string; title: string; company: string }[] }>(res)
	if (!res.ok) return []
	return body?.data ?? []
}

async function createInterview(input: object): Promise<Interview> {
	const res = await fetch('/api/interviews', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	})
	if (!res.ok) {
		const b = await parseJsonSafe<{ error?: string }>(res)
		throw new Error(b?.error ?? `Failed (${res.status})`)
	}
	const parsed = await parseJsonSafe<{ data: Interview }>(res)
	if (!parsed?.data) throw new Error('Invalid response from server')
	return parsed.data
}

async function deleteInterview(id: string): Promise<void> {
	const res = await fetch(`/api/interviews/${id}`, { method: 'DELETE' })
	if (!res.ok) throw new Error('Failed to delete')
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

function useInterviews() {
	return useQuery({ queryKey: ['interviews'], queryFn: fetchInterviews, staleTime: 60_000 })
}

function useJobs() {
	return useQuery({ queryKey: ['jobs'], queryFn: fetchJobs, staleTime: 300_000 })
}

function useCreateInterview() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: createInterview,
		onSuccess: () => { qc.invalidateQueries({ queryKey: ['interviews'] }); toast.success('Interview scheduled') },
		onError: (e: Error) => toast.error(e.message),
	})
}

function useDeleteInterview() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: deleteInterview,
		onMutate: async (id) => {
			await qc.cancelQueries({ queryKey: ['interviews'] })
			const prev = qc.getQueryData<Interview[]>(['interviews'])
			qc.setQueryData<Interview[]>(['interviews'], old => old?.filter(i => i.id !== id))
			return { prev }
		},
		onSuccess: () => toast.success('Interview removed'),
		onError: (e: Error, _id, ctx) => {
			if (ctx?.prev) qc.setQueryData(['interviews'], ctx.prev)
			toast.error(e.message)
		},
	})
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getStatusTag(scheduledAt: string) {
	const date = new Date(scheduledAt)
	if (isToday(date)) return { label: 'Today', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
	if (isFuture(date)) return { label: 'Upcoming', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
	return { label: 'Past', className: 'bg-muted text-muted-foreground' }
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function InterviewsView() {
	const { data: interviews, isLoading } = useInterviews()
	const deleteInterview = useDeleteInterview()
	const [isOpen, setIsOpen] = useState(false)

	if (isLoading) {
		return (
			<div className='space-y-3'>
				{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className='h-28 rounded-xl' />)}
			</div>
		)
	}

	const isEmpty = !interviews || interviews.length === 0

	// Split into upcoming and past
	const upcoming = interviews?.filter(i => !isPast(new Date(i.scheduledAt)) || isToday(new Date(i.scheduledAt))) ?? []
	const past = interviews?.filter(i => isPast(new Date(i.scheduledAt)) && !isToday(new Date(i.scheduledAt))) ?? []

	return (
		<>
			<div className='flex items-center justify-between mb-6'>
				<p className='text-sm text-muted-foreground'>
					{isEmpty ? 'No interviews yet' : `${upcoming.length} upcoming · ${past.length} past`}
				</p>
				<Button size='sm' className='gap-2' onClick={() => setIsOpen(true)}>
					<Plus className='w-4 h-4' />
					Schedule interview
				</Button>
			</div>

			{isEmpty ? (
				<div className='flex flex-col items-center justify-center py-24 gap-4'>
					<div className='w-16 h-16 rounded-2xl bg-muted flex items-center justify-center'>
						<Calendar className='w-8 h-8 text-muted-foreground' />
					</div>
					<div className='text-center space-y-1'>
						<h3 className='text-base font-semibold'>No interviews scheduled</h3>
						<p className='text-sm text-muted-foreground max-w-xs'>
							Keep track of all your interviews, times, formats, and notes in one place.
						</p>
					</div>
					<Button className='gap-2' onClick={() => setIsOpen(true)}>
						<Plus className='w-4 h-4' />
						Schedule your first interview
					</Button>
				</div>
			) : (
				<div className='space-y-8'>
					{upcoming.length > 0 && (
						<Section title='Upcoming'>
							{upcoming.map(interview => (
								<InterviewCard
									key={interview.id}
									interview={interview}
									onDelete={() => deleteInterview.mutate(interview.id)}
								/>
							))}
						</Section>
					)}
					{past.length > 0 && (
						<Section title='Past'>
							{past.map(interview => (
								<InterviewCard
									key={interview.id}
									interview={interview}
									onDelete={() => deleteInterview.mutate(interview.id)}
								/>
							))}
						</Section>
					)}
				</div>
			)}

			<AddInterviewModal open={isOpen} onOpenChange={setIsOpen} />
		</>
	)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div>
			<h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3'>{title}</h3>
			<div className='space-y-3'>{children}</div>
		</div>
	)
}

// ── Interview card ────────────────────────────────────────────────────────────

function InterviewCard({ interview, onDelete }: { interview: Interview; onDelete: () => void }) {
	const status = getStatusTag(interview.scheduledAt)

	return (
		<div className='group rounded-xl border bg-card p-4 flex gap-4 hover:border-primary/30 hover:shadow-sm transition-all'>
			{/* Date column */}
			<div className='flex flex-col items-center justify-center w-12 shrink-0 text-center'>
				<span className='text-lg font-bold leading-none text-foreground'>
					{format(new Date(interview.scheduledAt), 'd')}
				</span>
				<span className='text-xs text-muted-foreground uppercase'>
					{format(new Date(interview.scheduledAt), 'MMM')}
				</span>
			</div>

			{/* Divider */}
			<div className='w-px bg-border shrink-0' />

			{/* Content */}
			<div className='flex-1 min-w-0 space-y-2'>
				<div className='flex items-start justify-between gap-2'>
					<div className='space-y-0.5 min-w-0'>
						<p className='text-sm font-semibold truncate'>{interview.job.company}</p>
						<p className='text-xs text-muted-foreground truncate'>{interview.job.title}</p>
					</div>

					<div className='flex items-center gap-1.5 shrink-0'>
						<span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', status.className)}>
							{status.label}
						</span>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={props => (
									<Button
										{...props}
										variant='ghost'
										size='icon'
										className={cn('w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity', props.className)}
										onClick={e => { e.preventDefault(); props.onClick?.(e) }}
									>
										<MoreHorizontal className='w-4 h-4' />
									</Button>
								)}
							/>
							<DropdownMenuContent align='end' className='w-36'>
								<DropdownMenuItem className='text-destructive' onClick={onDelete}>
									<Trash2 className='w-3.5 h-3.5 mr-2' />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Meta row */}
				<div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
					<span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', TYPE_COLORS[interview.type])}>
						{TYPE_LABELS[interview.type]}
					</span>
					<span className='flex items-center gap-1 text-xs text-muted-foreground'>
						<Clock className='w-3 h-3' />
						{format(new Date(interview.scheduledAt), 'h:mm a')}
						{interview.duration && ` · ${interview.duration} min`}
					</span>
					{interview.location && (
						<span className='flex items-center gap-1 text-xs text-muted-foreground truncate'>
							<MapPin className='w-3 h-3 shrink-0' />
							{interview.location}
						</span>
					)}
				</div>

				{interview.notes && (
					<p className='flex items-start gap-1 text-xs text-muted-foreground line-clamp-2'>
						<NotebookText className='w-3 h-3 mt-0.5 shrink-0' />
						{interview.notes}
					</p>
				)}
			</div>
		</div>
	)
}

// ── Add Interview Modal ───────────────────────────────────────────────────────

const formSchema = z.object({
	jobId: z.string().min(1, 'Please select a job'),
	type: z.enum(INTERVIEW_TYPES),
	date: z.string().min(1, 'Date is required'),
	time: z.string().min(1, 'Time is required'),
	duration: z.string().optional(),
	location: z.string().max(500).optional(),
	notes: z.string().max(5000).optional(),
})
type FormValues = z.infer<typeof formSchema>

function AddInterviewModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
	const createInterview = useCreateInterview()
	const { data: jobs } = useJobs()

	const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { type: 'PHONE_SCREEN' },
	})

	async function onSubmit(data: FormValues) {
		const scheduledAt = new Date(`${data.date}T${data.time}`).toISOString()
		const durationNum = data.duration ? parseInt(data.duration, 10) : undefined
		await createInterview.mutateAsync({
			jobId: data.jobId,
			type: data.type,
			scheduledAt,
			duration: durationNum && !isNaN(durationNum) ? durationNum : undefined,
			location: data.location,
			notes: data.notes,
		})
		reset()
		onOpenChange(false)
	}

	const watchedType = watch('type')

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Schedule interview</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-4 py-2'>
					<div className='grid grid-cols-2 gap-3'>
						{/* Job */}
						<div className='space-y-1.5 col-span-2'>
							<Label>Job <span className='text-destructive'>*</span></Label>
							<Select onValueChange={(v: string | null) => { if (v) setValue('jobId', v) }}>
								<SelectTrigger>
									<SelectValue placeholder='Select a job...' />
								</SelectTrigger>
								<SelectContent>
									{(jobs ?? []).map(job => (
										<SelectItem key={job.id} value={job.id}>
											{job.title} · {job.company}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.jobId && <p className='text-xs text-destructive'>{errors.jobId.message}</p>}
						</div>

						{/* Type */}
						<div className='space-y-1.5 col-span-2'>
							<Label>Type <span className='text-destructive'>*</span></Label>
							<Select value={watchedType} onValueChange={(v: string | null) => { if (v) setValue('type', v as InterviewType) }}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{INTERVIEW_TYPES.map(t => (
										<SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Date & Time */}
						<div className='space-y-1.5'>
							<Label>Date <span className='text-destructive'>*</span></Label>
							<Input {...register('date')} type='date' />
							{errors.date && <p className='text-xs text-destructive'>{errors.date.message}</p>}
						</div>
						<div className='space-y-1.5'>
							<Label>Time <span className='text-destructive'>*</span></Label>
							<Input {...register('time')} type='time' />
							{errors.time && <p className='text-xs text-destructive'>{errors.time.message}</p>}
						</div>

						{/* Duration */}
						<div className='space-y-1.5'>
							<Label>Duration (min)</Label>
							<Input {...register('duration')} type='number' placeholder='60' min={5} max={480} />
						</div>

						{/* Location */}
						<div className='space-y-1.5'>
							<Label>Location / Link</Label>
							<Input {...register('location')} placeholder='Zoom, On-site...' />
						</div>

						{/* Notes */}
						<div className='space-y-1.5 col-span-2'>
							<Label>Notes</Label>
							<Textarea {...register('notes')} placeholder='Topics to prepare, interviewer names...' rows={3} className='resize-none' />
						</div>
					</div>

					<DialogFooter>
						<Button type='button' variant='ghost' onClick={() => onOpenChange(false)} disabled={createInterview.isPending}>Cancel</Button>
						<Button type='submit' disabled={createInterview.isPending}>
							{createInterview.isPending ? 'Scheduling...' : 'Schedule'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
