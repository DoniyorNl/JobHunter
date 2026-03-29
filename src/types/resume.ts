export interface PersonalInfo {
	name: string
	email: string
	phone?: string
	location?: string
	linkedin?: string
	github?: string
	website?: string
	summary?: string
}

export interface WorkExperience {
	id: string
	company: string
	title: string
	location?: string
	startDate: string
	endDate?: string | 'Present'
	current: boolean
	bullets: string[]
}

export interface Education {
	id: string
	school: string
	degree: string
	field: string
	startDate: string
	endDate?: string
	gpa?: string
}

export interface SkillGroup {
	category: string
	items: string[]
}

export interface Certification {
	id: string
	name: string
	issuer: string
	date: string
	url?: string
}

export interface ResumeData {
	personalInfo: PersonalInfo
	experience: WorkExperience[]
	education: Education[]
	skills: SkillGroup[]
	certifications?: Certification[]
}

export interface Resume {
	id: string
	userId: string
	title: string
	targetRole: string | null
	template: 'modern' | 'classic' | 'minimal'
	isDefault: boolean
	data: ResumeData
	createdAt: Date
	updatedAt: Date
}

export interface TailoredResume {
	id: string
	resumeId: string
	jobId: string | null
	jobTitle: string
	company: string
	jobDesc: string
	matchScore: number | null
	data: ResumeData
	createdAt: Date
}

export const EMPTY_RESUME_DATA: ResumeData = {
	personalInfo: {
		name: '',
		email: '',
	},
	experience: [],
	education: [],
	skills: [],
	certifications: [],
}
