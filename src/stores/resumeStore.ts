import type { Education, ResumeData, SkillGroup, WorkExperience } from '@/types/resume'
import { EMPTY_RESUME_DATA } from '@/types/resume'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface ResumeEditorState {
	resumeId: string
	resumeTitle: string
	template: 'modern' | 'classic' | 'minimal'
	data: ResumeData
	isDirty: boolean
	isSaving: boolean

	/** Called once on mount to hydrate with server-fetched data */
	load: (params: {
		id: string
		title: string
		template: 'modern' | 'classic' | 'minimal'
		data: ResumeData
	}) => void

	// ── Personal info ──────────────────────────────────────────────────────────
	updatePersonalInfo: (updates: Partial<ResumeData['personalInfo']>) => void

	// ── Experience ─────────────────────────────────────────────────────────────
	addExperience: () => void
	updateExperience: (id: string, updates: Partial<WorkExperience>) => void
	removeExperience: (id: string) => void
	addBullet: (expId: string) => void
	updateBullet: (expId: string, index: number, text: string) => void
	removeBullet: (expId: string, index: number) => void

	// ── Education ──────────────────────────────────────────────────────────────
	addEducation: () => void
	updateEducation: (id: string, updates: Partial<Education>) => void
	removeEducation: (id: string) => void

	// ── Skills ─────────────────────────────────────────────────────────────────
	addSkillGroup: () => void
	updateSkillGroup: (index: number, updates: Partial<SkillGroup>) => void
	removeSkillGroup: (index: number) => void
	addSkillItem: (groupIndex: number, skill: string) => void
	removeSkillItem: (groupIndex: number, skillIndex: number) => void

	// ── Meta ───────────────────────────────────────────────────────────────────
	markSaved: () => void
	setIsSaving: (saving: boolean) => void
}

export const useResumeStore = create<ResumeEditorState>()(
	immer(set => ({
		resumeId: '',
		resumeTitle: '',
		template: 'modern',
		data: EMPTY_RESUME_DATA,
		isDirty: false,
		isSaving: false,

		load: ({ id, title, template, data }) =>
			set(state => {
				state.resumeId = id
				state.resumeTitle = title
				state.template = template
				state.data = data
				state.isDirty = false
			}),

		// ── Personal info ────────────────────────────────────────────────────────
		updatePersonalInfo: updates =>
			set(state => {
				Object.assign(state.data.personalInfo, updates)
				state.isDirty = true
			}),

		// ── Experience ───────────────────────────────────────────────────────────
		addExperience: () =>
			set(state => {
				state.data.experience.push({
					id: crypto.randomUUID(),
					company: '',
					title: '',
					startDate: '',
					current: false,
					bullets: [''],
				})
				state.isDirty = true
			}),

		updateExperience: (id, updates) =>
			set(state => {
				const exp = state.data.experience.find(e => e.id === id)
				if (exp) Object.assign(exp, updates)
				state.isDirty = true
			}),

		removeExperience: id =>
			set(state => {
				state.data.experience = state.data.experience.filter(e => e.id !== id)
				state.isDirty = true
			}),

		addBullet: expId =>
			set(state => {
				const exp = state.data.experience.find(e => e.id === expId)
				if (exp) exp.bullets.push('')
				state.isDirty = true
			}),

		updateBullet: (expId, index, text) =>
			set(state => {
				const exp = state.data.experience.find(e => e.id === expId)
				if (exp) exp.bullets[index] = text
				state.isDirty = true
			}),

		removeBullet: (expId, index) =>
			set(state => {
				const exp = state.data.experience.find(e => e.id === expId)
				if (exp) exp.bullets.splice(index, 1)
				state.isDirty = true
			}),

		// ── Education ────────────────────────────────────────────────────────────
		addEducation: () =>
			set(state => {
				state.data.education.push({
					id: crypto.randomUUID(),
					school: '',
					degree: '',
					field: '',
					startDate: '',
				})
				state.isDirty = true
			}),

		updateEducation: (id, updates) =>
			set(state => {
				const edu = state.data.education.find(e => e.id === id)
				if (edu) Object.assign(edu, updates)
				state.isDirty = true
			}),

		removeEducation: id =>
			set(state => {
				state.data.education = state.data.education.filter(e => e.id !== id)
				state.isDirty = true
			}),

		// ── Skills ───────────────────────────────────────────────────────────────
		addSkillGroup: () =>
			set(state => {
				state.data.skills.push({ category: 'Skills', items: [] })
				state.isDirty = true
			}),

		updateSkillGroup: (index, updates) =>
			set(state => {
				const group = state.data.skills[index]
				if (group) Object.assign(group, updates)
				state.isDirty = true
			}),

		removeSkillGroup: index =>
			set(state => {
				state.data.skills.splice(index, 1)
				state.isDirty = true
			}),

		addSkillItem: (groupIndex, skill) =>
			set(state => {
				const group = state.data.skills[groupIndex]
				if (group && skill.trim()) {
					group.items.push(skill.trim())
					state.isDirty = true
				}
			}),

		removeSkillItem: (groupIndex, skillIndex) =>
			set(state => {
				const group = state.data.skills[groupIndex]
				if (group) {
					group.items.splice(skillIndex, 1)
					state.isDirty = true
				}
			}),

		// ── Meta ─────────────────────────────────────────────────────────────────
		markSaved: () =>
			set(state => {
				state.isDirty = false
				state.isSaving = false
			}),

		setIsSaving: saving =>
			set(state => {
				state.isSaving = saving
			}),
	})),
)
