import type { ResumeData } from '@/types/resume'

interface ModernTemplateProps {
	data: ResumeData
}

/**
 * HTML resume template — "Modern" style.
 *
 * Why HTML not react-pdf for the preview?
 * @react-pdf/renderer renders into a canvas / PDF worker and has ~2s cold-start.
 * For a live preview that updates on every keystroke, HTML is far superior.
 * The PDF export (Phase 2 Week 4) will use @react-pdf/renderer on a button click
 * only — the user waits ~2s once instead of on every change.
 *
 * The A4 paper dimensions (794px × 1123px at 96dpi) are enforced so the preview
 * matches what will actually be printed.
 */
export function ModernTemplate({ data }: ModernTemplateProps) {
	const { personalInfo: pi, experience, education, skills } = data

	return (
		<div
			className='bg-white text-[#1a1a1a] font-sans'
			style={{
				width: 794,
				minHeight: 1123,
				padding: '48px 52px',
				fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
				fontSize: 11,
				lineHeight: 1.5,
				boxSizing: 'border-box',
			}}
		>
			{/* ── Header ──────────────────────────────────────────────────── */}
			<header style={{ marginBottom: 24, borderBottom: '2px solid #2563eb', paddingBottom: 16 }}>
				<h1
					style={{
						fontSize: 26,
						fontWeight: 700,
						letterSpacing: '-0.5px',
						color: '#111827',
						margin: 0,
					}}
				>
					{pi.name || 'Your Name'}
				</h1>

				{/* Contact row */}
				<div
					style={{
						display: 'flex',
						flexWrap: 'wrap',
						gap: '6px 16px',
						marginTop: 6,
						fontSize: 10,
						color: '#4b5563',
					}}
				>
					{pi.email && <ContactItem>{pi.email}</ContactItem>}
					{pi.phone && <ContactItem>{pi.phone}</ContactItem>}
					{pi.location && <ContactItem>{pi.location}</ContactItem>}
					{pi.linkedin && <ContactItem>{pi.linkedin}</ContactItem>}
					{pi.github && <ContactItem>{pi.github}</ContactItem>}
					{pi.website && <ContactItem>{pi.website}</ContactItem>}
				</div>
			</header>

			{/* ── Summary ─────────────────────────────────────────────────── */}
			{pi.summary && (
				<Section title='Summary'>
					<p style={{ margin: 0, color: '#374151' }}>{pi.summary}</p>
				</Section>
			)}

			{/* ── Experience ──────────────────────────────────────────────── */}
			{experience.length > 0 && (
				<Section title='Experience'>
					{experience.map((exp, i) => (
						<div key={exp.id} style={{ marginBottom: i < experience.length - 1 ? 14 : 0 }}>
							{/* Job header */}
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'baseline',
								}}
							>
								<div>
									<span style={{ fontWeight: 600, fontSize: 11.5, color: '#111827' }}>
										{exp.title || 'Job Title'}
									</span>
									{exp.company && (
										<span style={{ color: '#2563eb', marginLeft: 6, fontSize: 11 }}>
											— {exp.company}
										</span>
									)}
								</div>
								<span style={{ fontSize: 10, color: '#6b7280', whiteSpace: 'nowrap' }}>
									{exp.startDate}
									{(exp.endDate || exp.current) && ` – ${exp.current ? 'Present' : exp.endDate}`}
								</span>
							</div>
							{exp.location && (
								<div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>{exp.location}</div>
							)}
							{/* Bullets */}
							{exp.bullets.filter(Boolean).length > 0 && (
								<ul
									style={{
										margin: '5px 0 0',
										paddingLeft: 14,
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
				</Section>
			)}

			{/* ── Education ───────────────────────────────────────────────── */}
			{education.length > 0 && (
				<Section title='Education'>
					{education.map((edu, i) => (
						<div key={edu.id} style={{ marginBottom: i < education.length - 1 ? 10 : 0 }}>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'baseline',
								}}
							>
								<div>
									<span style={{ fontWeight: 600, fontSize: 11.5, color: '#111827' }}>
										{edu.school || 'School'}
									</span>
								</div>
								<span style={{ fontSize: 10, color: '#6b7280', whiteSpace: 'nowrap' }}>
									{edu.startDate}
									{edu.endDate && ` – ${edu.endDate}`}
								</span>
							</div>
							<div style={{ color: '#374151', marginTop: 1 }}>
								{[edu.degree, edu.field].filter(Boolean).join(' · ')}
								{edu.gpa && (
									<span style={{ color: '#6b7280', marginLeft: 8 }}>GPA: {edu.gpa}</span>
								)}
							</div>
						</div>
					))}
				</Section>
			)}

			{/* ── Skills ──────────────────────────────────────────────────── */}
			{skills.length > 0 && (
				<Section title='Skills'>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
						{skills.map((group, i) => (
							<div key={i} style={{ display: 'flex', gap: 8 }}>
								<span style={{ fontWeight: 600, color: '#111827', minWidth: 90, fontSize: 10.5 }}>
									{group.category}:
								</span>
								<span style={{ color: '#374151', flex: 1 }}>{group.items.join(', ')}</span>
							</div>
						))}
					</div>
				</Section>
			)}
		</div>
	)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section style={{ marginBottom: 20 }}>
			<h2
				style={{
					fontSize: 10,
					fontWeight: 700,
					letterSpacing: '1px',
					textTransform: 'uppercase',
					color: '#2563eb',
					borderBottom: '1px solid #e5e7eb',
					paddingBottom: 3,
					marginBottom: 10,
					margin: '0 0 10px 0',
				}}
			>
				{title}
			</h2>
			{children}
		</section>
	)
}

function ContactItem({ children }: { children: React.ReactNode }) {
	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 4,
			}}
		>
			{children}
		</span>
	)
}
