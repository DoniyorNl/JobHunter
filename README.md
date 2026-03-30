# JobHunter

> A production-ready Huntr.co-style job search tracker built with Next.js, Supabase, and Gemini AI.

---

## Features

| Module | What it does |
|---|---|
| **Kanban Board** | Drag-and-drop job cards across 7 status columns (Wishlist → Offer) |
| **Job Detail Panel** | Edit every field inline, auto-closes on save, follow-up email reminder |
| **Resume Builder** | 3 templates (Modern / Classic / Minimal), real-time preview, PDF export |
| **Resume Tailor** | Paste a job description → AI scores match %, extracts missing keywords, rewrites bullets |
| **AI Tools** | Gemini-powered bullet generator and professional summary writer |
| **Contact Tracker** | Save recruiters, hiring managers, referrals — linked to jobs |
| **Interview Tracker** | Schedule interviews with type, time, location, notes; Upcoming/Past split |
| **Metrics Dashboard** | 30-day application timeline, status donut, pipeline funnel |
| **Email Reminders** | One-click follow-up reminder sent to your inbox via Resend |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 (driver adapter pattern) |
| Auth | Supabase Auth (Google OAuth + Email) |
| AI | Google Gemini 2.0 Flash |
| Email | Resend |
| State | Zustand + TanStack Query |
| Charts | Recharts |

---

## Getting Started

### Prerequisites

- Node.js 20.19+ (22 LTS recommended)
- pnpm 9+
- [Supabase](https://supabase.com) project (PostgreSQL)
- [Google AI Studio](https://aistudio.google.com) API key (free)
- [Resend](https://resend.com) API key (free tier: 3000 emails/month)

### 1. Clone and install

```bash
git clone <repo-url> JobHunter
cd JobHunter
pnpm install
```

`postinstall` automatically runs `prisma generate`.

### 2. Environment variables

Copy and fill in the values:

```bash
cp .env.example .env
```

```env
# ─── App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# ─── Database (direct connection — required for Prisma 7 adapter)
DATABASE_URL=postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres

# ─── AI
GEMINI_API_KEY=<your-gemini-api-key>

# ─── Email
RESEND_API_KEY=<your-resend-api-key>
EMAIL_FROM=JobHunter <you@yourdomain.com>

# ─── Rate limiting (optional — app works without it)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### 3. Database migration

```bash
pnpm prisma migrate dev --name init
```

### 4. Supabase Auth — Google OAuth

1. Go to **Supabase → Authentication → Providers → Google**
2. Enable Google and add your Client ID + Secret from [Google Cloud Console](https://console.cloud.google.com)
3. Add `http://localhost:3000/auth/callback` to allowed redirect URIs

### 5. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, callback pages
│   ├── (dashboard)/     # Protected: board, resumes, contacts, interviews, metrics
│   └── api/             # REST API routes
│       ├── jobs/
│       ├── resumes/
│       ├── contacts/
│       ├── interviews/
│       ├── metrics/
│       ├── ai/          # Gemini AI endpoints
│       └── reminders/
├── components/
│   ├── board/           # Kanban board, cards, detail panel
│   ├── resume/          # Builder, templates, tailor
│   ├── contacts/
│   ├── interviews/
│   ├── metrics/
│   └── layout/          # Sidebar, topbar
├── hooks/               # TanStack Query hooks
├── lib/                 # Prisma, Supabase, Gemini, Resend clients
├── stores/              # Zustand stores
└── types/               # TypeScript types
```

---

## Key Architectural Decisions

### Why Prisma 7 + Adapter?

Prisma 7 requires an explicit driver adapter (`@prisma/adapter-pg`). The connection string is passed at runtime via `prisma.ts` rather than `schema.prisma`. This gives us SSL control (`rejectUnauthorized: false`) needed for Supabase's self-signed certificate chain.

### Why Zustand + TanStack Query?

- **TanStack Query** — server state (jobs, resumes, contacts): caching, optimistic updates, background refetch
- **Zustand** — UI state (which job is selected, sidebar open): lightweight, no boilerplate

### Why Gemini over OpenAI?

Gemini 2.0 Flash is free at 60 requests/minute — no credit card required. Identical quality for our use cases (bullet rewriting, keyword extraction, summary generation).

---

## Docs / Lessons

All architectural decisions, patterns, and "why" explanations are documented in `docs/lessons/`:

| # | Topic |
|---|---|
| 01 | Prisma 7 breaking changes |
| 02 | Supabase connection types (pooler vs direct) |
| 03 | Auth architecture (Supabase + Next.js) |
| 04 | User sync (auth.users ↔ public.User) |
| 05 | Server Actions vs API Routes |
| 06 | Zod validation patterns |
| 07 | Optimistic updates + rollback |
| 08 | UI polish (animations, auto-close) |
| 09 | Resume Builder (templates, PDF export) |
| 10 | Metrics Dashboard (aggregation, Recharts) |
| 11 | Contact & Interview Tracker (CRUD pattern) |
| 12 | Error Boundaries & 404 |

---

## License

MIT
