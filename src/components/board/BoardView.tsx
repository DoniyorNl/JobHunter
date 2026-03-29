'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { useJobs, useUpdateJob } from '@/hooks/useJobs'
import { useBoardStore } from '@/stores/boardStore'
import type { Job, JobStatus } from '@/types/job'
import { BOARD_COLUMNS } from '@/types/job'
import {
	closestCorners,
	DndContext,
	DragEndEvent,
	DragOverEvent,
	DragOverlay,
	DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { useState } from 'react'
import { AddJobModal } from './AddJobModal'
import { BoardColumn } from './BoardColumn'
import { JobCard } from './JobCard'

export function BoardView() {
	const { jobs, moveJob } = useBoardStore()
	const { isLoading } = useJobs()
	const updateJob = useUpdateJob()

	const [activeJob, setActiveJob] = useState<Job | null>(null)
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)
	const [defaultAddStatus, setDefaultAddStatus] = useState<JobStatus>('WISHLIST')

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 5 }, // 5px drag before activation — allows click
		}),
	)

	function handleDragStart(event: DragStartEvent) {
		const job = jobs.find(j => j.id === event.active.id)
		if (job) setActiveJob(job)
	}

	function handleDragOver(event: DragOverEvent) {
		const { active, over } = event
		if (!over) return

		const activeId = active.id as string
		const overId = over.id as string

		const activeJob = jobs.find(j => j.id === activeId)
		if (!activeJob) return

		// Dragging over a column
		const isOverColumn = BOARD_COLUMNS.includes(overId as JobStatus)
		if (isOverColumn && activeJob.status !== overId) {
			moveJob(activeId, overId as JobStatus)
		}

		// Dragging over another card (same or different column)
		const overJob = jobs.find(j => j.id === overId)
		if (overJob && overJob.id !== activeId && activeJob.status !== overJob.status) {
			moveJob(activeId, overJob.status)
		}
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		setActiveJob(null)

		if (!over) return

		const activeId = active.id as string
		const overId = over.id as string

		const activeJobItem = jobs.find(j => j.id === activeId)
		if (!activeJobItem) return

		// Final status after drag
		const newStatus: JobStatus = BOARD_COLUMNS.includes(overId as JobStatus)
			? (overId as JobStatus)
			: (jobs.find(j => j.id === overId)?.status ?? activeJobItem.status)

		if (activeJobItem.status !== newStatus) {
			updateJob.mutate({ id: activeId, input: { status: newStatus } })
		}
	}

	function handleAddJob(status: JobStatus) {
		setDefaultAddStatus(status)
		setIsAddModalOpen(true)
	}

	if (isLoading) {
		return <BoardSkeleton />
	}

	return (
		<>
			<DndContext
				sensors={sensors}
				collisionDetection={closestCorners}
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDragEnd={handleDragEnd}
			>
				<div className='flex gap-4 overflow-x-auto h-full pb-4 px-6 pt-4'>
					{BOARD_COLUMNS.map(status => (
						<BoardColumn
							key={status}
							status={status}
							jobs={jobs.filter(j => j.status === status)}
							onAddJob={handleAddJob}
						/>
					))}
				</div>

				<DragOverlay>
					{activeJob && (
						<div className='rotate-2 opacity-90'>
							<JobCard job={activeJob} />
						</div>
					)}
				</DragOverlay>
			</DndContext>

			<AddJobModal
				open={isAddModalOpen}
				onOpenChange={setIsAddModalOpen}
				defaultStatus={defaultAddStatus}
			/>
		</>
	)
}

function BoardSkeleton() {
	return (
		<div className='flex gap-4 overflow-x-auto h-full pb-4 px-6 pt-4'>
			{BOARD_COLUMNS.map(status => (
				<div key={status} className='w-72 shrink-0 space-y-2'>
					<Skeleton className='h-6 w-32' />
					<div className='space-y-2'>
						{Array.from({ length: 2 }).map((_, i) => (
							<Skeleton key={i} className='h-24 w-full rounded-lg' />
						))}
					</div>
				</div>
			))}
		</div>
	)
}
