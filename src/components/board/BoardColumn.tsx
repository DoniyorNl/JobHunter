'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Job, JobStatus } from '@/types/job'
import { JOB_STATUS_LABELS } from '@/types/job'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { JobCard } from './JobCard'

const COLUMN_COLORS: Record<JobStatus, string> = {
	WISHLIST: 'border-t-slate-400',
	APPLIED: 'border-t-blue-400',
	PHONE_SCREEN: 'border-t-purple-400',
	INTERVIEW: 'border-t-amber-400',
	OFFER: 'border-t-green-400',
	REJECTED: 'border-t-red-400',
	WITHDRAWN: 'border-t-gray-400',
}

interface BoardColumnProps {
	status: JobStatus
	jobs: Job[]
	onAddJob?: (status: JobStatus) => void
}

export function BoardColumn({ status, jobs, onAddJob }: BoardColumnProps) {
	const { setNodeRef, isOver } = useDroppable({ id: status })

	const label = JOB_STATUS_LABELS[status]
	const count = jobs.length

	return (
		<div className='flex flex-col w-72 shrink-0'>
			{/* Column header */}
			<div className='flex items-center justify-between px-1 mb-2'>
				<div className='flex items-center gap-2'>
					<h3 className='text-sm font-semibold text-foreground'>{label}</h3>
					<span className='text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full'>
						{count}
					</span>
				</div>
				{onAddJob && (
					<Button
						variant='ghost'
						size='icon'
						className='w-6 h-6 rounded-sm'
						onClick={() => onAddJob(status)}
					>
						<Plus className='w-3.5 h-3.5' />
					</Button>
				)}
			</div>

			{/* Drop zone */}
			<div
				ref={setNodeRef}
				className={cn(
					'flex flex-col gap-2 flex-1 min-h-24 p-2 rounded-lg border-2 border-t-4 transition-colors',
					COLUMN_COLORS[status],
					isOver ? 'border-primary/30 bg-primary/5' : 'border-transparent bg-muted/40',
				)}
			>
				<SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
					{jobs.map(job => (
						<JobCard key={job.id} job={job} />
					))}
				</SortableContext>

				{jobs.length === 0 && (
					<div className='flex items-center justify-center h-16 text-xs text-muted-foreground'>
						Drop jobs here
					</div>
				)}
			</div>
		</div>
	)
}
