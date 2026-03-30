export const AI_PROMPTS = {
	GENERATE_SUMMARY: (role: string, experience: string) =>
		`
Write a professional resume summary for a ${role}.
Experience context: ${experience}

Rules:
- 2-3 sentences max
- Start with title/years of experience
- Mention 2-3 key skills
- Include one quantifiable achievement if possible
- Professional but not generic
- NO "passionate", "results-driven", or "self-starter" clichés

Return ONLY the summary text, no additional commentary.
  `.trim(),

	GENERATE_BULLET: (company: string, role: string, context: string) =>
		`
Write a strong resume bullet point for:
Company: ${company}
Role: ${role}
Context: ${context}

Rules:
- Start with a strong action verb (past tense)
- Include measurable impact (%, $, numbers, time saved)
- Max 20 words
- Be specific, not generic

Return ONLY the bullet point text.
  `.trim(),

	COVER_LETTER: (jobTitle: string, company: string, resumeData: string, jobDesc: string) =>
		`
Write a compelling cover letter for:
Position: ${jobTitle} at ${company}
Resume Data: ${resumeData}
Job Description: ${jobDesc}

Rules:
- 3 paragraphs
- Opening: Why this company specifically (research-based)
- Middle: 2 matching achievements from resume
- Closing: Clear call to action
- Professional, not sycophantic
- Max 300 words

Return ONLY the cover letter text.
  `.trim(),

	REVIEW_RESUME: (resumeText: string, targetRole: string) =>
		`
You are a senior career coach. Review this resume for a ${targetRole} position.
Resume: ${resumeText}

Return feedback ONLY as valid JSON (no markdown code blocks):
{
  "overallScore": 75,
  "sections": {
    "summary": { "score": 80, "feedback": "...", "suggestions": ["..."] },
    "experience": { "score": 70, "feedback": "...", "suggestions": ["..."] },
    "skills": { "score": 90, "feedback": "...", "suggestions": ["..."] }
  },
  "topIssues": ["Issue 1", "Issue 2"],
  "quickWins": ["Fix 1", "Fix 2"]
}
  `.trim(),

	EXTRACT_KEYWORDS: (jobDescription: string, resumeText: string) =>
		`
Analyze this job description and extract structured data, then compare with the resume.

Job Description: ${jobDescription}
Resume: ${resumeText}

Return ONLY valid JSON (no markdown code blocks):
{
  "technicalSkills": [],
  "softSkills": [],
  "responsibilities": [],
  "qualifications": [],
  "matchScore": 75,
  "missingKeywords": [],
  "matchedKeywords": []
}
  `.trim(),

	/**
	 * Used with Gemini multimodal (PDF inlineData).
	 * Returns a JSON object matching our ResumeData shape.
	 */
	PARSE_RESUME_PDF: () => `
You are a resume parser. Read the attached resume PDF and extract all information.

Return ONLY valid JSON (no markdown code blocks) matching this exact structure:
{
  "personalInfo": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "website": "",
    "summary": ""
  },
  "experience": [
    {
      "id": "exp-1",
      "company": "",
      "title": "",
      "location": "",
      "startDate": "Jan 2022",
      "endDate": "Mar 2024",
      "current": false,
      "bullets": ["Achieved X by doing Y, resulting in Z"]
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "school": "",
      "degree": "",
      "field": "",
      "startDate": "2018",
      "endDate": "2022",
      "gpa": ""
    }
  ],
  "skills": [
    {
      "category": "Programming Languages",
      "items": ["Python", "TypeScript"]
    }
  ],
  "certifications": [
    {
      "id": "cert-1",
      "name": "",
      "issuer": "",
      "date": "",
      "url": ""
    }
  ]
}

Rules:
- Extract every piece of information visible in the resume
- For dates, use "MMM YYYY" format (e.g. "Jan 2022") or just "YYYY"
- If "current" job, set endDate to null and current to true
- Group skills by category (Languages, Frameworks, Tools, etc.)
- Keep bullet points as-is from the original, do not rewrite them
- If a field is missing, use empty string "" for strings or [] for arrays
- Generate unique IDs: "exp-1", "exp-2", "edu-1", etc.
`.trim(),

	TAILOR_BULLETS: (originalBullets: string[], jobDescription: string, targetRole: string) =>
		`
Rewrite these resume bullets to better match the job description for a ${targetRole} role.

Original bullets:
${originalBullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Job Description excerpt: ${jobDescription.slice(0, 1000)}

Rules:
- Keep the same number of bullets
- Preserve factual accuracy
- Incorporate relevant keywords from the job description naturally
- Maintain strong action verbs and measurable impact

Return ONLY valid JSON array of strings:
["bullet 1", "bullet 2", ...]
  `.trim(),
}
