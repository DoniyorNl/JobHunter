import type { ResumeData } from '@/types/resume'

interface ClassicTemplateProps {
	data: ResumeData
}

/**
 * "Classic" resume template — traditional single-column layout.
 * Dark header, serif-style section titles, formal appearance.
 * Ideal for finance, law, consulting, and other traditional industries.
 */
export function ClassicTemplate({ data }: ClassicTemplateProps) {
	const { personalInfo: pi, experience, education, skills } = data

	return (
		<div
			className='bg-white text-[#1a1a1a]'
			style={{
				width: 794,
				minHeight: 1123,
				padding: '0',
				fontFamily: 'Georgia, "Times New Roman", serif',
				fontSize: 11,
				lineHeight: 1.55,
				boxSizing: 'border-box',
			}}
		>
			{/* ── Dark header ──────────────────────────────────────────────── */}
			<header
				style={{
					backgroundColor: '#1e293b',
					color: '#f8fafc',
					padding: '32px 52px 28px',
					marginBottom: 0,
				}}
			>
				<h1
					style={{
						fontSize: 28,
						fontWeight: 700,
						letterSpacing: '0.5px',
						color: '#ffffff',
						margin: 0,
						fontFamily: 'Georgia, serif',
					}}
				>
					{pi.name || 'Your Name'}
				</h1>

				<div
					style={{
						display: 'flex',
						flexWrap: 'wrap',
						gap: '4px 20px',
						marginTop: 8,
						fontSize: 10,
						color: '#94a3b8',
					}}
				>
					{pi.email && <span>{pi.email}</span>}
					{pi.phone && <span>{pi.phone}</span>}
					{pi.location && <span>{pi.location}</span>}
					{pi.linkedin && <span>{pi.linkedin}</span>}
					{pi.github && <span>{pi.github}</span>}
					{pi.website && <span>{pi.website}</span>}
				</div>
			</header>

			{/* ── Body ─────────────────────────────────────────────────────── */}
			<div style={{ padding: '28px 52px' }}>
				{/* Summary */}
				{pi.summary && (
					<ClassicSection title='Professional Summary'>
						<p style={{ margin: 0, color: '#374151', fontStyle: 'italic' }}>{pi.summary}</p>
					</ClassicSection>
				)}

				{/* Experience */}
				{experience.length > 0 && (
					<ClassicSection title='Experience'>
						{experience.map((exp, i) => (
							<div key={exp.id} style={{ marginBottom: i < experience.length - 1 ? 16 : 0 }}>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'baseline',
										borderBottom: '1px dotted #e5e7eb',
										paddingBottom: 3,
										marginBottom: 4,
									}}
								>
									<div>
										<span style={{ fontWeight: 700, fontSize: 12, color: '#111827' }}>
											{exp.title || 'Job Title'}
										</span>
										{exp.company && (
											<span style={{ color: '#475569', marginLeft: 8, fontSize: 11 }}>
												{exp.company}
											</span>
										)}
									</div>
									<span style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap' }}>
										{exp.startDate}
										{(exp.endDate || exp.current) &&
											` – ${exp.current ? 'Present' : exp.endDate}`}
									</span>
								</div>
								{exp.location && (
									<div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>
										{exp.location}
									</div>
								)}
								{exp.bullets.filter(Boolean).length > 0 && (
									<ul
										style={{
											margin: 0,
											paddingLeft: 18,
											listStyleType: 'disc',
											color: '#374151',
										}}
									>
										{exp.bullets.filter(Boolean).map((bullet, bi) => (
											<li key={bi} style={{ marginBottom: 2 }}>
												{bullet}
											</li>
										))}
									</ul>
								)}
							</div>
						))}
					</ClassicSection>
				)}

				{/* Education */}
				{education.length > 0 && (
					<ClassicSection title='Education'>
						{education.map((edu, i) => (
							<div key={edu.id} style={{ marginBottom: i < education.length - 1 ? 10 : 0 }}>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'baseline',
									}}
								>
									<span style={{ fontWeight: 700, fontSize: 11.5, color: '#111827' }}>
										{edu.school || 'School'}
									</span>
									<span style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap' }}>
										{edu.startDate}
										{edu.endDate && ` – ${edu.endDate}`}
									</span>
								</div>
								<div style={{ color: '#475569', fontSize: 10.5 }}>
									{[edu.degree, edu.field].filter(Boolean).join(' in ')}
									{edu.gpa && (
										<span style={{ color: '#64748b', marginLeft: 8 }}>GPA: {edu.gpa}</span>
									)}
								</div>
							</div>
						))}
					</ClassicSection>
				)}

				{/* Skills */}
				{skills.length > 0 && (
					<ClassicSection title='Skills'>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
							{skills.map((group, i) => (
								<div key={i} style={{ display: 'flex', gap: 8 }}>
									<span
										style={{ fontWeight: 700, color: '#1e293b', minWidth: 100, fontSize: 10.5 }}
									>
										{group.category}:
									</span>
									<span style={{ color: '#374151', flex: 1 }}>{group.items.join(', ')}</span>
								</div>
							))}
						</div>
					</ClassicSection>
				)}
			</div>
		</div>
	)
}

function ClassicSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section style={{ marginBottom: 22 }}>
			<h2
				style={{
					fontSize: 12,
					fontWeight: 700,
					letterSpacing: '0.5px',
					textTransform: 'uppercase',
					color: '#1e293b',
					borderBottom: '2px solid #1e293b',
					paddingBottom: 4,
					marginBottom: 10,
					margin: '0 0 10px 0',
					fontFamily: 'Georgia, serif',
				}}
			>
				{title}
			</h2>
			{children}
		</section>
	)
}
