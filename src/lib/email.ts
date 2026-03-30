import { Resend } from 'resend'

/**
 * Lazily instantiate Resend — only throws at call time, not at module load.
 * This lets `next build` succeed even when RESEND_API_KEY is absent from
 * the build environment (e.g. CI/CD that doesn't inject runtime secrets).
 */
function getResend(): Resend {
	const apiKey = process.env.RESEND_API_KEY
	if (!apiKey) throw new Error('RESEND_API_KEY is not set')
	return new Resend(apiKey)
}

const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'JobHunter <onboarding@resend.dev>'

// ── Email templates ───────────────────────────────────────────────────────────

function followUpEmailHtml(jobTitle: string, company: string, daysAgo: number): string {
	return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 24px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; max-width: 480px; margin: 0 auto; border: 1px solid #e5e7eb; }
    h1 { color: #111827; font-size: 20px; margin: 0 0 8px; }
    p  { color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .badge { display: inline-block; background: #eff6ff; color: #2563eb; border-radius: 6px; padding: 4px 12px; font-size: 13px; font-weight: 600; margin-bottom: 24px; }
    .btn { display: inline-block; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; padding: 12px 24px; font-size: 14px; font-weight: 600; }
    .footer { color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Follow-up reminder</span>
    <h1>Time to follow up on your application</h1>
    <p>
      You applied to <strong>${jobTitle}</strong> at <strong>${company}</strong> ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago
      and haven&apos;t heard back yet.
    </p>
    <p>
      A short, polite follow-up email can increase your chances of getting a response. Keep it brief — express continued interest and ask if there are any updates.
    </p>
    <a class="btn" href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/board">
      Open your job board →
    </a>
    <div class="footer">
      You&apos;re receiving this because you enabled follow-up reminders in JobHunter.<br />
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/settings" style="color: #9ca3af;">Manage reminders</a>
    </div>
  </div>
</body>
</html>
  `.trim()
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface SendFollowUpReminderInput {
	to: string
	jobTitle: string
	company: string
	daysAgo: number
}

export async function sendFollowUpReminder(input: SendFollowUpReminderInput): Promise<void> {
	const resend = getResend()

	const { error } = await resend.emails.send({
		from: FROM_ADDRESS,
		to: input.to,
		subject: `Reminder: Follow up on your ${input.company} application`,
		html: followUpEmailHtml(input.jobTitle, input.company, input.daysAgo),
	})

	if (error) {
		throw new Error(`Resend error: ${error.message}`)
	}
}
