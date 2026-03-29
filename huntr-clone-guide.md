# 🎯 Huntr.co Clone — 0 dan Production-Ready ga Complete Guide

> **Stack**: Next.js 15 · TypeScript · Tailwind CSS · Supabase · OpenAI/Gemini · Vercel  
> **Narx**: $0 (barcha free tierlar)  
> **Maqsad**: Portfolio + SaaS uchun production-ready loyiha

---

## 📌 MUNDARIJA

1. [Loyiha Arxitekturasi](#1-loyiha-arxitekturasi)
2. [Tech Stack — Versiyalar va Sabablari](#2-tech-stack)
3. [File Struktura](#3-file-struktura)
4. [Database Schema](#4-database-schema)
5. [Authentication](#5-authentication)
6. [Core Features — Implementation](#6-core-features)
7. [AI Integration](#7-ai-integration)
8. [External API Integration](#8-external-api-integration)
9. [Chrome Extension](#9-chrome-extension)
10. [Testing Strategy](#10-testing-strategy)
11. [CI/CD Pipeline](#11-cicd-pipeline)
12. [Deploy — Qayerga va Nima Uchun](#12-deploy)
13. [Phase Roadmap — Bosqichma-bosqich](#13-phase-roadmap)
14. [Free Tier Limitlar va Monitoring](#14-free-tier-limitlar)

---

## 1. LOYIHA ARXITEKTURASI

### Qanday tizimdan iborat?

```
┌─────────────────────────────────────────────────────────┐
│                    HUNTR CLONE                          │
├─────────────────┬───────────────────┬───────────────────┤
│   WEB APP       │  CHROME EXTENSION  │   ADMIN PANEL    │
│  (Next.js 15)   │  (React + MV3)    │  (Next.js route) │
└────────┬────────┴─────────┬─────────┴────────┬──────────┘
         │                  │                   │
         ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│              API LAYER (Next.js App Router)              │
│         /api/jobs · /api/resumes · /api/ai · ...        │
└──────────────────────────┬──────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌──────────┐    ┌──────────────┐   ┌──────────────┐
   │ Supabase │    │  OpenAI API  │   │  Resend API  │
   │ (DB+Auth │    │  (GPT-4o-   │   │  (Emaillar)  │
   │ +Storage)│    │   mini)     │   └──────────────┘
   └──────────┘    └──────────────┘
```

### Frontend vs Backend

Huntr clone uchun **Frontend + Backend = bitta Next.js loyiha (monorepo)**. Alohida backend server kerak emas, chunki:
- Next.js App Router API Routes backend vazifasini bajaradi
- Supabase serverless DB — server boshqarish yo'q
- Vercel Edge Functions — global CDN bepul

**Faqat frontend emas** — backend ham bor, lekin Next.js API routes orqali.

---

## 2. TECH STACK

### Core

| Texnologiya | Versiya | Nima uchun |
|---|---|---|
| **Next.js** | 15.x | App Router, Server Components, API Routes |
| **React** | 19.x | Next.js bilan birga keladi |
| **TypeScript** | 5.x | Type safety, katta loyihada majburiy |
| **Tailwind CSS** | 4.x | Tezkor styling |
| **shadcn/ui** | latest | Production-grade UI components |

### Backend / Database

| Texnologiya | Versiya | Nima uchun | Free Tier |
|---|---|---|---|
| **Supabase** | latest | PostgreSQL + Auth + Storage + Realtime | 500MB DB, 1GB storage |
| **Prisma** | 6.x | Type-safe ORM, migrations boshqaruvi | - |
| **Zod** | 3.x | API validation, schema | - |

> **Nima uchun Supabase + Prisma birga?** Supabase to'g'ridan-to'g'ri PostgreSQL DB beradi. Prisma esa type-safe query va migration uchun ishlatiladi. Bu kombinatsiya professional standart.

### AI

| Texnologiya | Nima uchun | Free Tier |
|---|---|---|
| **Google Gemini API** | Resume generation, keyword extraction | **60 req/min BEPUL** |
| **OpenAI API** | Backup / GPT-4o-mini (arzon) | Pay-per-use (backup) |
| **Vercel AI SDK** | AI streaming, React hooks | Bepul |

> **Muhim**: Gemini 2.0 Flash — bepul, tez, va yetarlicha kuchli. AI CV Builder loyihangizda ham Gemini ishlatgansiz.

### Auth

| Texnologiya | Nima uchun |
|---|---|
| **Supabase Auth** | Email/password + Google OAuth + magic link |

### Email

| Texnologiya | Free Tier |
|---|---|
| **Resend** | 3,000 email/oy bepul |

### PDF Generation

| Texnologiya | Nima uchun |
|---|---|
| **@react-pdf/renderer** | Browser + server-side PDF |
| **puppeteer-core** | Complex PDF (HTML → PDF) |

### State Management

| Texnologiya | Nima uchun |
|---|---|
| **Zustand** | Global state (lightweight) |
| **TanStack Query** | Server state, caching, refetch |

### Drag & Drop (Kanban uchun)

| Texnologiya | Nima uchun |
|---|---|
| **@dnd-kit/core** | Modern, accessible DnD |

### Testing

| Texnologiya | Nima uchun |
|---|---|
| **Vitest** | Unit tests (tez, Vite-based) |
| **React Testing Library** | Component tests |
| **Playwright** | E2E tests |

### Deploy

| Servis | Nima uchun | Free Tier |
|---|---|---|
| **Vercel** | Next.js uchun eng yaxshi host | 100GB bandwidth/oy |
| **Supabase** | DB hosting | 500MB, 2 projects |

---

## 3. FILE STRUKTURA

```
huntr-clone/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Test + lint har PR da
│       ├── deploy-preview.yml        # Preview deploy (Vercel)
│       └── keep-supabase-alive.yml   # DB uchun ping (5 kunda bir)
│
├── apps/                             # (Agar monorepo qilsangiz)
│   └── web/                          # Asosiy web app
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Route group - auth sahifalar
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/              # Route group - himoyalangan sahifalar
│   │   │   ├── board/                # Kanban Job Tracker
│   │   │   │   └── page.tsx
│   │   │   ├── resumes/              # Resume builder
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx      # Resume editor
│   │   │   │   │   └── tailor/
│   │   │   │   │       └── page.tsx  # Resume tailor
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── contacts/             # Contact tracker
│   │   │   │   └── page.tsx
│   │   │   ├── interviews/           # Interview tracker
│   │   │   │   └── page.tsx
│   │   │   ├── metrics/              # Analytics
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Dashboard layout (sidebar, nav)
│   │   │
│   │   ├── api/                      # API Routes (Backend)
│   │   │   ├── health/
│   │   │   │   └── route.ts          # Health check (Supabase alive)
│   │   │   ├── auth/
│   │   │   │   └── callback/
│   │   │   │       └── route.ts      # OAuth callback
│   │   │   ├── jobs/
│   │   │   │   ├── route.ts          # GET list, POST create
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # GET, PATCH, DELETE
│   │   │   ├── resumes/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── export/
│   │   │   │       │   └── route.ts  # PDF export
│   │   │   │       └── tailor/
│   │   │   │           └── route.ts  # AI tailoring
│   │   │   ├── ai/
│   │   │   │   ├── generate-summary/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── generate-bullets/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── cover-letter/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── review-resume/
│   │   │   │   │   └── route.ts
│   │   │   │   └── extract-keywords/
│   │   │   │       └── route.ts
│   │   │   ├── contacts/
│   │   │   │   └── route.ts
│   │   │   └── webhooks/
│   │   │       └── stripe/
│   │   │           └── route.ts      # (Kelajakda premium uchun)
│   │   │
│   │   ├── (marketing)/              # Landing page
│   │   │   ├── page.tsx              # Home
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── globals.css
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ... (50+ component)
│   │   │
│   │   ├── board/                    # Kanban Board
│   │   │   ├── BoardColumn.tsx
│   │   │   ├── JobCard.tsx
│   │   │   ├── AddJobModal.tsx
│   │   │   ├── JobDetailSheet.tsx    # Side panel
│   │   │   └── BoardView.tsx
│   │   │
│   │   ├── resume/                   # Resume Builder
│   │   │   ├── ResumeEditor.tsx
│   │   │   ├── ResumePreview.tsx
│   │   │   ├── sections/
│   │   │   │   ├── PersonalInfo.tsx
│   │   │   │   ├── Experience.tsx
│   │   │   │   ├── Education.tsx
│   │   │   │   ├── Skills.tsx
│   │   │   │   └── Summary.tsx
│   │   │   ├── templates/
│   │   │   │   ├── ModernTemplate.tsx
│   │   │   │   ├── ClassicTemplate.tsx
│   │   │   │   └── MinimalTemplate.tsx
│   │   │   └── AIAssistPanel.tsx     # AI suggestions panel
│   │   │
│   │   ├── tailor/                   # Resume Tailor
│   │   │   ├── KeywordMatcher.tsx
│   │   │   ├── MatchScore.tsx
│   │   │   ├── JobDescriptionInput.tsx
│   │   │   └── SuggestionList.tsx
│   │   │
│   │   ├── contacts/
│   │   │   ├── ContactCard.tsx
│   │   │   └── AddContactModal.tsx
│   │   │
│   │   ├── metrics/
│   │   │   ├── ApplicationFunnel.tsx
│   │   │   ├── WeeklyChart.tsx
│   │   │   └── StatsCard.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── MobileNav.tsx
│   │   │
│   │   └── shared/
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server component client
│   │   │   └── middleware.ts         # Auth middleware helper
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── ai/
│   │   │   ├── gemini.ts             # Gemini client setup
│   │   │   ├── prompts.ts            # Barcha AI promptlar
│   │   │   └── parser.ts             # AI response parser
│   │   ├── pdf/
│   │   │   └── generator.ts          # PDF generation logic
│   │   └── utils.ts                  # cn(), formatDate(), etc.
│   │
│   ├── hooks/
│   │   ├── useJobs.ts                # TanStack Query hooks
│   │   ├── useResume.ts
│   │   ├── useAI.ts                  # AI streaming hook
│   │   └── useAuth.ts
│   │
│   ├── stores/
│   │   ├── boardStore.ts             # Zustand - kanban state
│   │   ├── resumeStore.ts            # Resume editor state
│   │   └── uiStore.ts                # Modal, sidebar state
│   │
│   ├── types/
│   │   ├── job.ts
│   │   ├── resume.ts
│   │   ├── contact.ts
│   │   └── api.ts
│   │
│   └── middleware.ts                 # Next.js middleware (auth guard)
│
├── prisma/
│   ├── schema.prisma                 # DB schema
│   └── migrations/                   # Auto-generated migrations
│
├── extension/                        # Chrome Extension
│   ├── manifest.json
│   ├── popup/
│   │   ├── index.html
│   │   └── popup.tsx
│   ├── content/
│   │   └── content.ts               # Job page scraper
│   ├── background/
│   │   └── service-worker.ts
│   └── public/
│       └── icons/
│
├── tests/
│   ├── unit/                         # Vitest
│   ├── integration/
│   └── e2e/                          # Playwright
│
├── .env.local                        # Local env (git ignore)
├── .env.example                      # Template
├── middleware.ts                     # Auth protection
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── playwright.config.ts
```

---

## 4. DATABASE SCHEMA

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")      // Supabase uchun
}

// ─── USER ───────────────────────────────────────────
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  avatarUrl String?
  plan      Plan     @default(FREE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  jobs       Job[]
  resumes    Resume[]
  contacts   Contact[]
  interviews Interview[]
}

enum Plan {
  FREE
  PRO
}

// ─── JOB (Tracker) ──────────────────────────────────
model Job {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  title       String
  company     String
  location    String?
  salary      String?
  url         String?
  description String?   @db.Text
  notes       String?   @db.Text

  status      JobStatus @default(WISHLIST)
  stage       Int       @default(0)  // Kanban ordering
  color       String?   // Company color

  appliedAt   DateTime?
  deadlineAt  DateTime?

  keywords    String[]   // Extracted from description
  contacts    Contact[]
  interviews  Interview[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@index([userId, status])
}

enum JobStatus {
  WISHLIST
  APPLIED
  PHONE_SCREEN
  INTERVIEW
  OFFER
  REJECTED
  WITHDRAWN
}

// ─── RESUME ─────────────────────────────────────────
model Resume {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  title      String   // "Software Engineer Resume"
  targetRole String?
  template   String   @default("modern")
  isDefault  Boolean  @default(false)

  // Resume JSON data (flexible structure)
  data       Json     // ResumeData type

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  tailoredVersions TailoredResume[]

  @@index([userId])
}

model TailoredResume {
  id           String @id @default(cuid())
  resumeId     String
  resume       Resume @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  jobId        String?

  jobTitle     String
  company      String
  jobDesc      String  @db.Text
  matchScore   Int?    // 0-100

  data         Json    // Modified resume data
  createdAt    DateTime @default(now())
}

// ─── CONTACT ────────────────────────────────────────
model Contact {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobId     String?
  job       Job?     @relation(fields: [jobId], references: [id])

  name      String
  title     String?
  company   String?
  email     String?
  phone     String?
  linkedin  String?
  twitter   String?
  notes     String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ─── INTERVIEW ──────────────────────────────────────
model Interview {
  id          String        @id @default(cuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  jobId       String
  job         Job           @relation(fields: [jobId], references: [id])

  type        InterviewType
  scheduledAt DateTime
  duration    Int?          // minutes
  location    String?       // "Zoom", "Office", etc.
  notes       String?       @db.Text
  feedback    String?       @db.Text

  createdAt   DateTime @default(now())
}

enum InterviewType {
  PHONE_SCREEN
  TECHNICAL
  BEHAVIORAL
  SYSTEM_DESIGN
  TAKE_HOME
  FINAL
  OFFER_CALL
}
```

**Resume `data` JSON struktura:**
```typescript
// types/resume.ts
export interface ResumeData {
  personalInfo: {
    name: string
    email: string
    phone?: string
    location?: string
    linkedin?: string
    github?: string
    website?: string
    summary?: string
  }
  experience: Array<{
    id: string
    company: string
    title: string
    location?: string
    startDate: string
    endDate?: string | 'Present'
    bullets: string[]
  }>
  education: Array<{
    id: string
    school: string
    degree: string
    field: string
    startDate: string
    endDate?: string
    gpa?: string
  }>
  skills: Array<{
    category: string
    items: string[]
  }>
  certifications?: Array<{
    name: string
    issuer: string
    date: string
    url?: string
  }>
}
```

---

## 5. AUTHENTICATION

Supabase Auth ishlatamiz — minimal konfiguratsiya, ko'p imkoniyat.

**Qo'llab-quvvatlanadigan usullar:**
- Email + Password
- Google OAuth (bepul)
- Magic Link (email orqali)
- GitHub OAuth (developers uchun)

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        ),
      },
    }
  )
}
```

```typescript
// src/middleware.ts
import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
  ],
}
```

**Protected routes:** `/board`, `/resumes`, `/contacts`, `/interviews`, `/metrics` — barchasi middleware orqali himoyalangan.

---

## 6. CORE FEATURES

### 6.1 Kanban Board (Job Tracker)

**Mantiq:**
- 6 column: Wishlist → Applied → Phone Screen → Interview → Offer → Rejected
- Drag & drop: `@dnd-kit`
- Har bir karta: company logo, title, salary, deadline
- Card ustiga bosish → side panel (detail view)
- Optimistic updates: server javob kutmasdan UI yangilanadi

```typescript
// components/board/BoardView.tsx
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useBoardStore } from '@/stores/boardStore'
import { useUpdateJobStatus } from '@/hooks/useJobs'

const COLUMNS: JobStatus[] = [
  'WISHLIST', 'APPLIED', 'PHONE_SCREEN',
  'INTERVIEW', 'OFFER', 'REJECTED'
]

export function BoardView() {
  const { jobs, moveJob } = useBoardStore()
  const updateStatus = useUpdateJobStatus()

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const newStatus = over.id as JobStatus
    moveJob(active.id as string, newStatus)  // Optimistic
    updateStatus.mutate({ id: active.id, status: newStatus })
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto h-full pb-4">
        {COLUMNS.map(status => (
          <BoardColumn
            key={status}
            status={status}
            jobs={jobs.filter(j => j.status === status)}
          />
        ))}
      </div>
    </DndContext>
  )
}
```

### 6.2 Resume Builder

**Mantiq:**
- Split view: chap = editor, o'ng = real-time preview
- Section drag & drop (tartiblash)
- AI assist button har bullet point yonida
- Export: PDF (react-pdf)
- 3 template: Modern, Classic, Minimal

**State management:**
```typescript
// stores/resumeStore.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface ResumeStore {
  data: ResumeData
  isDirty: boolean
  activeSection: string | null

  updatePersonalInfo: (info: Partial<PersonalInfo>) => void
  addExperience: () => void
  updateBullet: (expId: string, idx: number, text: string) => void
  reorderSections: (from: number, to: number) => void
}

export const useResumeStore = create<ResumeStore>()(
  immer((set) => ({
    // ... implementation
  }))
)
```

### 6.3 Resume Tailor

**Mantiq:**
1. User job description paste qiladi
2. AI keywords extract qiladi
3. Resume bilan taqqoslanadi → match score
4. Missing keywords highlighted
5. AI bullet suggestions beradi

```typescript
// api/ai/extract-keywords/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  const { jobDescription, resumeText } = await req.json()

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `
    Analyze this job description and extract:
    1. Required technical skills (array)
    2. Soft skills (array)
    3. Key responsibilities (array)
    4. Must-have qualifications (array)

    Then compare with the provided resume and give a match score (0-100).

    Job Description: ${jobDescription}
    Resume: ${resumeText}

    Return ONLY valid JSON:
    {
      "technicalSkills": [],
      "softSkills": [],
      "responsibilities": [],
      "qualifications": [],
      "matchScore": 75,
      "missingKeywords": [],
      "matchedKeywords": []
    }
  `

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const data = JSON.parse(text.replace(/```json|```/g, '').trim())

  return Response.json(data)
}
```

---

## 7. AI INTEGRATION

### Qaysi AI ishlatamiz?

**Asosiy: Google Gemini 2.0 Flash**
- Bepul: 60 request/minute, 1M token/day
- Tez (1-3 soniya)
- Ko'p til qo'llab-quvvatlaydi

**Backup: OpenAI GPT-4o-mini**
- Pay-per-use (juda arzon: $0.15/1M token)
- Gemini quota tugaganda ishlatiladi

### AI Xususiyatlar

```typescript
// src/lib/ai/prompts.ts

export const AI_PROMPTS = {

  GENERATE_SUMMARY: (role: string, experience: string) => `
    Write a professional resume summary for a ${role}.
    Experience context: ${experience}
    Rules:
    - 2-3 sentences max
    - Start with title/years of experience
    - Mention 2-3 key skills
    - Include one quantifiable achievement
    - Professional but not generic
    - NO "passionate" or "results-driven" clichés
    Return ONLY the summary text.
  `,

  GENERATE_BULLET: (company: string, role: string, context: string) => `
    Write a strong resume bullet point for:
    Company: ${company}, Role: ${role}
    Context: ${context}
    Rules:
    - Start with strong action verb
    - Include measurable impact (%, $, #)
    - Max 20 words
    - Past tense
    Return ONLY the bullet point.
  `,

  COVER_LETTER: (jobTitle: string, company: string, resumeData: string, jobDesc: string) => `
    Write a compelling cover letter for:
    Position: ${jobTitle} at ${company}
    Resume Data: ${resumeData}
    Job Description: ${jobDesc}
    Rules:
    - 3 paragraphs
    - Opening: Why this company specifically
    - Middle: 2 matching achievements
    - Closing: Call to action
    - Professional, not sycophantic
    - Max 300 words
  `,

  REVIEW_RESUME: (resumeText: string, targetRole: string) => `
    You are a senior career coach. Review this resume for ${targetRole}.
    Resume: ${resumeText}
    Provide feedback in JSON:
    {
      "overallScore": 75,
      "sections": {
        "summary": { "score": 80, "feedback": "...", "suggestions": [] },
        "experience": { "score": 70, "feedback": "...", "suggestions": [] },
        "skills": { "score": 90, "feedback": "...", "suggestions": [] }
      },
      "topIssues": ["Issue 1", "Issue 2"],
      "quickWins": ["Fix 1", "Fix 2"]
    }
  `,
}
```

### AI Streaming (Real-time)

```typescript
// hooks/useAI.ts
import { useStreamingText } from '@/lib/ai/streaming'

export function useGenerateSummary() {
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function generate(role: string, context: string) {
    setIsLoading(true)
    setText('')

    const response = await fetch('/api/ai/generate-summary', {
      method: 'POST',
      body: JSON.stringify({ role, context }),
    })

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setText(prev => prev + decoder.decode(value))
    }

    setIsLoading(false)
  }

  return { text, isLoading, generate }
}
```

### Rate Limiting (muhim!)

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'  // Upstash Redis - bepul tier
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),  // 10 req/min per user
  analytics: true,
})

// API route ichida ishlatish:
export async function POST(req: Request) {
  const userId = await getUserId(req)
  const { success, limit, remaining } = await ratelimit.limit(userId)

  if (!success) {
    return Response.json(
      { error: 'AI limit exceeded. Try again in 1 minute.' },
      { status: 429 }
    )
  }
  // ... AI call
}
```

> **Upstash Redis**: Bepul tier — 10,000 commands/day. Rate limiting uchun yetarli.

---

## 8. EXTERNAL API INTEGRATION

### 8.1 Job Data (ixtiyoriy)

```typescript
// Agar job search integratsiya qilsak:
// JSearch API (RapidAPI) — 100 req/oy bepul
// The Muse API — bepul

// Hozircha manual job saving yetarli
```

### 8.2 Company Data / Logos

```typescript
// Clearbit Logo API — BEPUL
// Usage: https://logo.clearbit.com/{domain}
// Misol: https://logo.clearbit.com/google.com

// components/board/JobCard.tsx
function CompanyLogo({ company }: { company: string }) {
  const domain = getDomainFromCompany(company)
  return (
    <img
      src={`https://logo.clearbit.com/${domain}`}
      onError={(e) => { e.target.src = '/default-company.svg' }}
      className="w-8 h-8 rounded"
    />
  )
}
```

### 8.3 PDF Export

```typescript
// src/lib/pdf/generator.ts
import { pdf } from '@react-pdf/renderer'
import { ModernTemplate } from '@/components/resume/templates/pdf/ModernTemplate'

export async function generateResumePDF(data: ResumeData): Promise<Blob> {
  const blob = await pdf(<ModernTemplate data={data} />).toBlob()
  return blob
}

// API route:
// GET /api/resumes/[id]/export
export async function GET(req: Request, { params }) {
  const resume = await getResume(params.id)
  const pdfBlob = await generateResumePDF(resume.data)

  return new Response(pdfBlob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${resume.title}.pdf"`,
    },
  })
}
```

### 8.4 Email (Resend)

```typescript
// src/lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: 'hello@yourdomain.com',
    to: email,
    subject: 'Welcome to JobTracker!',
    html: `<h1>Hi ${name}!</h1><p>Start tracking your job search today.</p>`,
  })
}

export async function sendInterviewReminder(email: string, interview: Interview) {
  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to: email,
    subject: `Interview Reminder: ${interview.job.company} — Tomorrow`,
    html: `...`,
  })
}
```

---

## 9. CHROME EXTENSION

Chrome Extension — alohida loyiha, lekin bir repo ichida.

```
extension/
├── manifest.json              # MV3 (Manifest Version 3)
├── popup/
│   ├── index.html
│   └── App.tsx               # React mini app
├── content/
│   └── content.ts            # Job page scraping
└── background/
    └── service-worker.ts     # Background tasks
```

**manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "JobTracker - Save Jobs",
  "version": "1.0.0",
  "description": "Save jobs and autofill applications",
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": ["<all_urls>"],
  "action": {
    "default_popup": "popup/index.html",
    "default_icon": "public/icons/icon128.png"
  },
  "content_scripts": [{
    "matches": ["*://*/jobs/*", "*://careers.*/*", "*://linkedin.com/jobs/*"],
    "js": ["content/content.js"]
  }],
  "background": {
    "service_worker": "background/service-worker.js"
  }
}
```

**Content Script — Job Scraper:**
```typescript
// content/content.ts
// LinkedIn, Indeed, Glassdoor, Greenhouse kabi saytlardan ma'lumot oladi

const SCRAPERS: Record<string, () => JobData> = {
  'linkedin.com': () => ({
    title: document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent,
    company: document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent,
    location: document.querySelector('.job-details-jobs-unified-top-card__bullet')?.textContent,
    description: document.querySelector('#job-details')?.textContent,
    url: window.location.href,
  }),
  'greenhouse.io': () => ({
    title: document.querySelector('.app-title')?.textContent,
    company: document.querySelector('.company-name')?.textContent,
    // ...
  }),
  // + Indeed, Glassdoor, Lever, Workday, etc.
}

// Popup ga ma'lumot yuborish
function scrapeCurrentPage(): JobData {
  const hostname = window.location.hostname
  const key = Object.keys(SCRAPERS).find(k => hostname.includes(k))
  return key ? SCRAPERS[key]() : {}
}

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg.type === 'SCRAPE_JOB') {
    respond({ data: scrapeCurrentPage() })
  }
})
```

**Extension Deploy:**
- Chrome Web Store: $5 bir marta developer account
- Yoki personal use uchun developer mode dan yüklab ishlatish (bepul)

---

## 10. TESTING STRATEGY

### 10.1 Unit Tests (Vitest)

```typescript
// tests/unit/resume-parser.test.ts
import { describe, it, expect } from 'vitest'
import { calculateMatchScore } from '@/lib/ai/parser'

describe('Resume Match Score', () => {
  it('returns 100 for perfect match', () => {
    const resumeKeywords = ['React', 'TypeScript', 'Node.js']
    const jobKeywords = ['React', 'TypeScript', 'Node.js']
    expect(calculateMatchScore(resumeKeywords, jobKeywords)).toBe(100)
  })

  it('returns 0 for no match', () => {
    expect(calculateMatchScore(['Python'], ['React'])).toBe(0)
  })
})
```

### 10.2 Integration Tests

```typescript
// tests/integration/jobs-api.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestClient } from '@/tests/helpers'

describe('Jobs API', () => {
  it('POST /api/jobs creates a job', async () => {
    const client = createTestClient()
    const res = await client.post('/api/jobs', {
      title: 'Frontend Developer',
      company: 'Acme Corp',
      status: 'WISHLIST'
    })
    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Frontend Developer')
  })
})
```

### 10.3 E2E Tests (Playwright)

```typescript
// tests/e2e/board.spec.ts
import { test, expect } from '@playwright/test'

test('user can add job to board', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=email]', 'test@example.com')
  await page.fill('[name=password]', 'password123')
  await page.click('button[type=submit]')

  await page.waitForURL('/board')
  await page.click('button:has-text("Add Job")')

  await page.fill('[name=title]', 'Senior Frontend Developer')
  await page.fill('[name=company]', 'Google')
  await page.click('button:has-text("Save")')

  await expect(page.locator('text=Senior Frontend Developer')).toBeVisible()
})
```

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      threshold: { lines: 70 }
    }
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') }
  }
})
```

---

## 11. CI/CD PIPELINE

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm run type-check
      - run: pnpm run test:unit
      - run: pnpm run build

  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm run test:e2e
      env:
        TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
        TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

```yaml
# .github/workflows/keep-supabase-alive.yml
name: Keep Supabase Alive

on:
  schedule:
    - cron: '0 9 */5 * *'  # Har 5 kunda soat 9:00 UTC
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Health Endpoint
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            https://your-app.vercel.app/api/health)
          echo "Status: $STATUS"
          if [ "$STATUS" != "200" ]; then exit 1; fi
```

---

## 12. DEPLOY

### Qayerga va Nima Uchun?

#### ✅ Vercel — Frontend + API Routes

**Nima uchun Vercel:**
- Next.js ni Vercel yaratgan — native qo'llab-quvvatlash
- Har push da auto-deploy
- Preview deploylar (har PR uchun alohida URL)
- Edge network — 30+ region
- Free tier: 100GB bandwidth/oy, unlimited deploy

**Deploy jarayoni:**
```bash
# 1. Vercel CLI o'rnatish
npm i -g vercel

# 2. Loyihani bog'lash
vercel link

# 3. Environment variables qo'shish
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add DATABASE_URL
vercel env add GEMINI_API_KEY
vercel env add RESEND_API_KEY
# ...

# 4. Deploy
vercel --prod
```

**Vercel da nimalarga e'tibor berish:**
- `NEXT_PUBLIC_*` — browser da ko'rinadigan env variables (xavfsiz)
- `DATABASE_URL` — faqat server da ishlatiladi (xavfsiz)
- **HECH QACHON** API keylarni `NEXT_PUBLIC_` bilan boshlamang!
- Vercel free tierda **serverless functions max 10 seconds** ishlaydi
- AI calls uzoq bo'lsa → `maxDuration: 60` qo'shing (Pro plan kerak emas, 60s free)

```typescript
// Serverless function timeout sozlash:
export const maxDuration = 30  // seconds, free tierda max 60
```

#### ✅ Supabase — Database + Auth + Storage

**Nima uchun Supabase (free tier):**
- 500MB PostgreSQL database
- 50,000 MAU (monthly active users)
- 1GB file storage
- Unlimited API requests
- Realtime websockets

**Supabase setup:**
```bash
# Supabase CLI
npm i -g supabase

# Local development
supabase start          # Docker orqali local Supabase
supabase db push        # Migrations production ga yuborish
supabase gen types      # TypeScript types generate
```

**Production e'tiborlar:**
- Supabase free tier — **inactive 1 hafta → pause** qilinadi
- Shuning uchun GitHub Actions `keep-supabase-alive.yml` shart!
- Connection pooling: `DATABASE_URL` — Supavisor orqali (pool)
- Direct connection: `DIRECT_URL` — migrations uchun

#### ✅ Upstash Redis — Rate Limiting

**Nima uchun Upstash:**
- Serverless Redis (Vercel bilan mos)
- Free: 10,000 commands/day
- AI rate limiting uchun yetarli

#### Deploy workflow qanday ishlaydi?

```
Developer pushes code
        │
        ▼
GitHub Actions CI yuguriladi
(lint + typecheck + test)
        │
        ├─── ❌ Fail → Deploy to'xtaydi, email keladi
        │
        ▼
✅ Pass → Vercel auto-deploy boshlanadi
        │
        ├── PR → Preview URL yaratiladi
        │         (https://myapp-git-feature-xyz.vercel.app)
        │
        └── main → Production deploy
                   (https://myapp.vercel.app)
        │
        ▼
Vercel environment variables injected
        │
        ▼
Build: next build (SSG + SSR)
        │
        ▼
Edge network ga tarqatiladi (30+ location)
        │
        ▼
🚀 LIVE!
```

#### Custom Domain (bepul)

```
Vercel → Settings → Domains → Add domain
DNS provideringizda: CNAME → cname.vercel-dns.com
SSL sertifikat: Vercel avtomatik Let's Encrypt
```

---

## 13. PHASE ROADMAP

### 📅 Phase 1 — Foundation (1-2 hafta)

**Maqsad: Auth + DB + Basic Board ishlashi**

```
✅ Week 1:
□ pnpm create next-app@latest huntr-clone
□ TypeScript, Tailwind, shadcn/ui setup
□ Supabase loyihasi yaratish
□ Prisma schema + migration
□ Auth (signup, login, logout, Google OAuth)
□ Protected routes middleware
□ Dashboard layout (sidebar + header)
□ Vercel ga deploy (auth ishlashi kerak)

✅ Week 2:
□ Job CRUD (create, read, update, delete)
□ Kanban board UI (6 column)
□ Drag & drop (dnd-kit)
□ Job detail side panel
□ Optimistic updates (TanStack Query)
□ Mobile responsive board
```

### 📅 Phase 2 — Resume Builder (2-3 hafta)

```
✅ Week 3:
□ Resume data model + API
□ Resume list page
□ Personal info section
□ Experience section (add/remove/reorder)
□ Education section
□ Skills section

✅ Week 4:
□ Real-time PDF preview
□ 3 resume template
□ PDF export
□ Resume storage (Supabase Storage)

✅ Week 5 (ixtiyoriy):
□ Spell check
□ Resume checker (score)
□ Resume duplicate/copy
```

### 📅 Phase 3 — AI Features (2 hafta)

```
✅ Week 6:
□ Gemini API setup + rate limiting
□ AI summary generator
□ AI bullet generator
□ AI skills suggestions
□ Streaming response UI

✅ Week 7:
□ Resume Tailor feature
□ Keyword extraction
□ Match score calculation
□ Missing keywords highlight
□ AI tailoring suggestions
```

### 📅 Phase 4 — Secondary Features (1-2 hafta)

```
✅ Week 8:
□ Contact Tracker
□ Interview Tracker + Calendar view
□ Job Search Metrics (charts)
□ Email reminders (Resend)
```

### 📅 Phase 5 — Chrome Extension (1 hafta)

```
✅ Week 9:
□ Extension boilerplate
□ LinkedIn job scraper
□ Indeed, Glassdoor scrapers
□ Popup UI (mini React app)
□ "Save to board" button
□ Chrome Web Store publish
```

### 📅 Phase 6 — Polish + Testing (1 hafta)

```
✅ Week 10:
□ Vitest unit tests (>70% coverage)
□ Playwright E2E tests (critical flows)
□ Performance audit (Lighthouse)
□ Error boundaries
□ Loading states
□ Empty states
□ 404 page
□ SEO meta tags
□ README.md yozish
```

**Jami: ~10 hafta yoki 2.5 oy** (parallel ishlasa tezroq)

---

## 14. FREE TIER LIMITLAR VA MONITORING

### Limitlar jadvali

| Servis | Free Limit | Warning belgisi |
|---|---|---|
| **Vercel** | 100GB bandwidth/oy | 80% dan monitoring |
| **Supabase DB** | 500MB | 400MB dan alert |
| **Supabase Auth** | 50,000 MAU | — |
| **Supabase Storage** | 1GB | 800MB dan alert |
| **Gemini API** | 60 req/min, 1M token/day | Rate limit 429 |
| **Resend** | 3,000 email/oy | 2,500 dan ehtiyot |
| **Upstash Redis** | 10,000 cmd/day | 8,000 dan ehtiyot |

### Monitoring Setup

```typescript
// src/app/api/health/route.ts
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'connected'
    })
  } catch {
    return Response.json({ status: 'error', db: 'disconnected' }, { status: 503 })
  }
}
```

**Uptime monitoring (bepul):**
- [UptimeRobot](https://uptimerobot.com) — 50 ta monitor bepul, 5 daqiqada bir tekshiradi
- Supabase ni ham ping qiladi → free tier pause bo'lmaydi

### Environment Variables (.env.example)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres

# AI
GEMINI_API_KEY=AIza...
OPENAI_API_KEY=sk-...     # Backup (ixtiyoriy)

# Email
RESEND_API_KEY=re_...

# Rate Limiting
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.vercel.app
```

---

## 🎯 YAKUNIY ESLATMALAR

### Portfolio uchun muhim narsalar:

1. **README.md** — screenshots, demo link, features list, tech stack
2. **LIVE DEMO** — Vercel URL albatta bo'lsin
3. **Mobile responsive** — recruiter telefondan ko'rishi mumkin
4. **Error handling** — AI xato qilsa yaxshilik bilan ko'rsatsin
5. **Loading states** — har bir async action uchun skeleton/spinner

### Ketma-ketlik:

```
Setup → Auth → DB → Board → Resume → AI → Extension → Tests → Deploy ✅
```

**Hech qachon:**
- ❌ Hammani bir vaqtda qilishga urinmang
- ❌ AI ni birinchi qilmang (foundation keyin)
- ❌ Testing ni oxiriga qoldirmang (har feature dan keyin yozing)
- ✅ Har Phase oxirida deploy qiling — ishlayotganini ko'ring
```
