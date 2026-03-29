import type { Resume } from '@/types/resume'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const RESUME_KEYS = {
	all: ['resumes'] as const,
	lists: () => [...RESUME_KEYS.all, 'list'] as const,
	detail: (id: string) => [...RESUME_KEYS.all, 'detail', id] as const,
}

// ─── API functions ─────────────────────────────────────────────────────────────

async function fetchResumes(): Promise<Resume[]> {
	const res = await fetch('/api/resumes')
	if (!res.ok) throw new Error('Failed to fetch resumes')
	const { data } = await res.json()
	return data
}

async function createResume(input: {
	title: string
	targetRole?: string
	template?: 'modern' | 'classic' | 'minimal'
}): Promise<Resume> {
	const res = await fetch('/api/resumes', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	})
	if (!res.ok) {
		const body = await res.json()
		throw new Error(body.error?.message ?? 'Failed to create resume')
	}
	const { data } = await res.json()
	return data
}

async function deleteResume(id: string): Promise<void> {
	const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' })
	if (!res.ok) {
		const body = await res.json()
		throw new Error(body.error?.message ?? 'Failed to delete resume')
	}
}

async function duplicateResume(id: string): Promise<Resume> {
	// Fetch source resume data, then create a new resume with the same content
	const srcRes = await fetch(`/api/resumes/${id}`)
	if (!srcRes.ok) throw new Error('Failed to fetch source resume')
	const { data: source } = await srcRes.json() as { data: Resume }

	const res = await fetch('/api/resumes', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			title: `${source.title} (copy)`,
			targetRole: source.targetRole ?? undefined,
			template: source.template,
			sourceData: source.data,
		}),
	})
	if (!res.ok) {
		const body = await res.json()
		throw new Error(body.error?.message ?? 'Failed to duplicate resume')
	}
	const { data } = await res.json()
	return data
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

export function useResumes() {
	return useQuery({
		queryKey: RESUME_KEYS.lists(),
		queryFn: fetchResumes,
		staleTime: 60_000,
	})
}

export function useCreateResume() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: createResume,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: RESUME_KEYS.lists() })
			toast.success('Resume created')
		},
		onError: (err: Error) => {
			toast.error(err.message)
		},
	})
}

export function useDuplicateResume() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: duplicateResume,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: RESUME_KEYS.lists() })
			toast.success('Resume duplicated')
		},
		onError: (err: Error) => {
			toast.error(err.message)
		},
	})
}

export function useDeleteResume() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: deleteResume,
		onMutate: async id => {
			await queryClient.cancelQueries({ queryKey: RESUME_KEYS.lists() })
			const previousResumes = queryClient.getQueryData<Resume[]>(RESUME_KEYS.lists())

			queryClient.setQueryData<Resume[]>(RESUME_KEYS.lists(), old =>
				old?.filter(r => r.id !== id),
			)

			return { previousResumes }
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: RESUME_KEYS.lists() })
			toast.success('Resume deleted')
		},
		onError: (err: Error, _id, context) => {
			if (context?.previousResumes) {
				queryClient.setQueryData(RESUME_KEYS.lists(), context.previousResumes)
			}
			toast.error(err.message)
		},
	})
}
