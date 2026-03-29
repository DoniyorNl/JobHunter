import type { Job, JobStatus } from '@/types/job'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface BoardState {
	jobs: Job[]
	selectedJobId: string | null
	isDetailOpen: boolean

	// Actions
	setJobs: (jobs: Job[]) => void
	addJob: (job: Job) => void
	updateJob: (id: string, updates: Partial<Job>) => void
	removeJob: (id: string) => void
	moveJob: (id: string, newStatus: JobStatus) => void
	selectJob: (id: string | null) => void
	setDetailOpen: (open: boolean) => void
}

export const useBoardStore = create<BoardState>()(
	immer(set => ({
		jobs: [],
		selectedJobId: null,
		isDetailOpen: false,

		setJobs: jobs =>
			set(state => {
				state.jobs = jobs
			}),

		addJob: job =>
			set(state => {
				state.jobs.unshift(job)
			}),

		updateJob: (id, updates) =>
			set(state => {
				const idx = state.jobs.findIndex(j => j.id === id)
				if (idx !== -1) {
					Object.assign(state.jobs[idx], updates)
				}
			}),

		removeJob: id =>
			set(state => {
				state.jobs = state.jobs.filter(j => j.id !== id)
			}),

		moveJob: (id, newStatus) =>
			set(state => {
				const job = state.jobs.find(j => j.id === id)
				if (job) {
					job.status = newStatus
				}
			}),

		selectJob: id =>
			set(state => {
				state.selectedJobId = id
				state.isDetailOpen = id !== null
			}),

		setDetailOpen: open =>
			set(state => {
				state.isDetailOpen = open
				if (!open) state.selectedJobId = null
			}),
	})),
)
