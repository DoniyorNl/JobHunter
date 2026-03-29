# 📋 Daily Work Log — JobHunter

> Bu fayl har kuni qilingan ishlar, uchrashadigan muammolar va ularning yechimlari haqida qisqa lug'atdir.

---

## 📅 2026-03-29 — Foundation Setup (Day 1)

### ✅ Qilingan ishlar

#### 1. Loyiha tuzilishi yaratildi
- `huntr-clone/` papkasi ildizga ko'chirildi (alohida git submodule olib tashlandi)
- Fayl strukturasi `huntr-clone-guide.md §3` bilan moslashtirилди
- `(marketing)/`, `(auth)/`, `(dashboard)/` route guruhlari tasdiqlandi

#### 2. Prisma 7 → to'liq migration qilindi

**Muammo:** Prisma 7 da quyidagi breaking changes:
- `schema.prisma` da `url`/`directUrl` endi qo'llab-quvvatlanmaydi
- Runtime uchun `adapter` majburiy (eski engine yo'q)
- `@prisma/client` dan `PrismaClient` import qilish uchun generate kerak

**Yechim:**
```typescript
// src/lib/prisma.ts — Prisma 7 + pg adapter + lazy singleton
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = (globalForPrisma.prisma ??= createClient())
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(client) : value
  },
})
```

**`prisma.config.ts`** — CLI uchun `DIRECT_URL ?? DATABASE_URL`:
```typescript
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'],
  },
})
```

#### 3. Qo'shilgan paketlar
| Paket | Sabab |
|-------|-------|
| `@prisma/adapter-pg` | Prisma 7 runtime adapter (majburiy) |
| `pg` + `@types/pg` | PostgreSQL driver |
| `dotenv` | `prisma.config.ts` da env yuklash |

#### 4. ESLint / TypeScript xatolari tuzatildi
| Fayl | Muammo | Yechim |
|------|--------|--------|
| `BoardView.tsx` | `setJobs` unused var | Olib tashlandi |
| `AddJobModal.tsx` | `watch()` React Compiler ogohlantirishi | `useWatch({ control })` ga o'zgartirildi |
| `JobCard.tsx` | `asChild` Base UI da yo'q | `render` prop ishlatildi |
| `login/page.tsx` | `useSearchParams` Suspense ichida emas | `<Suspense>` bilan o'raldi |
| `pricing/page.tsx` | Apostrophe unescaped | `&apos;` bilan almashtirildi |

#### 5. Route tuzilishi to'g'rilandi
- **Muammo:** `/` uchun ikkita `page.tsx` bor edi (`src/app/page.tsx` va `(marketing)/page.tsx`)
- **Yechim:** `src/app/page.tsx` olib tashlandi; asosiy landing endi `(marketing)/page.tsx` orqali

#### 6. `package.json` scripts qo'shildi
```json
"typecheck": "tsc --noEmit",
"db:generate": "prisma generate",
"db:migrate": "prisma migrate dev",
"db:push": "prisma db push",
"db:studio": "prisma studio",
"postinstall": "prisma generate"
```

#### 7. Database schema yaratildi
- **Muammo:** `pnpm db:migrate` Supabase pooler bilan ishlamadi
  - `FATAL: Tenant or user not found` — pooler session mode bilan autentifikatsiya muammosi
  - `P1001: Can't reach database server` — ISP/tarmoq port 5432 ni bloklagan
  - Prisma 7 schema engine pooler bilan mos kelmaslik

- **Yechim:** SQL to'g'ridan-to'g'ri **Supabase SQL Editor** orqali ishlatildi:
  - `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` → SQL olindi
  - Supabase Dashboard → SQL Editor → SQL ishlatildi → ✅ Success

- **Yaratilgan jadvallar:**
  - `User` — foydalanuvchilar
  - `Job` — ish e'lonlari (kanban)
  - `Resume` + `TailoredResume` — resume builder
  - `Contact` — kontaktlar
  - `Interview` — intervyu tracker

#### 8. README.md to'liq yozildi
- O'rnatish bosqichlari, Supabase sozlash, env vars, DB migrate yo'riqnomasi

---

### 🐛 Muammolar va yechimlari

#### Supabase DB ulanish muammolari (eng ko'p vaqt ketgan)

| Xato | Sabab | Yechim |
|------|-------|--------|
| `Connection url is empty` | `.env` to'ldirilmagan | `.env` da `DATABASE_URL` kiritildi |
| `P1000: Authentication failed` | Noto'g'ri parol | Supabase dashboard dan parol reset qilindi |
| `FATAL: Tenant or user not found` | Prisma 7 schema engine + pooler muammosi | SQL Editor orqali to'g'ridan-to'g'ri |
| `P1001: Can't reach database server` | ISP/tarmoq port 5432 bloklagan | `db.host:5432` o'rniga `pooler:5432` ishlatildi |
| `P1013: Invalid scheme` | `.env` dagi URL format noto'g'ri | To'g'ri `postgresql://` format bilan almashtrildi |

#### Supabase connection string to'g'ri format
```bash
# App uchun (Transaction pooler — port 6543)
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres"

# Migrate CLI uchun (Session pooler — port 5432)
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

> **Eslatma:** Yangi Supabase loyihalarida `db.PROJECT_REF.supabase.co:5432` ko'pincha tarmoq tomonidan bloklangan. Har ikki URL ham pooler hostida ishlatilishi kerak.

---

### 🏗️ Loyiha holati (eod)

```
✅ Next.js 16 + React 19 + TypeScript
✅ Tailwind CSS 4 + Base UI + shadcn/ui components
✅ Supabase Auth (email/password + Google OAuth tayyor)
✅ Prisma 7 + pg adapter + lazy singleton
✅ Database schema (5 jadval)
✅ Kanban board UI (drag & drop bilan)
✅ Jobs CRUD API (/api/jobs, /api/jobs/[id])
✅ Auth middleware (protected routes)
✅ Marketing landing + pricing pages
✅ pnpm dev ishlayapti — localhost:3000
⬜ User sync (signup → DB ga User yozish)
⬜ Job detail side panel
⬜ Resume builder (Phase 2)
⬜ AI integration (Phase 3)
```

---

## 📅 Keyingi ish kunlari — Reja

### 🎯 Phase 1 qolgan qismi (1–2 kun)

**Bugungi muhim bug:** Foydalanuvchi signup qilganda Supabase Auth da yaratiladi, lekin `User` jadvali (Prisma) ga yozilmaydi. Bu keyingi birinchi vazifa.

**Prioritet tartib:**

1. **User sync** — Supabase trigger yoki signup API orqali `User` jadvaliga yozish
2. **Job detail side panel** — kartaga bosish → `Sheet` component, barcha maydonlar
3. **Optimistic updates** — board drag & drop da server javobini kutmasdan UI yangilanishi (allaqachon qisman bor)
4. **Mobile responsive** — board va sidebar mobile ko'rinish
5. **Error boundaries + loading states** — har bir async action uchun

### 🎯 Phase 2 (Resume Builder — 1 hafta)

- Resume CRUD API (`/api/resumes`, `/api/resumes/[id]`)
- Resume list + editor sahifasi
- PDF preview (react-pdf)
- 3 shablon (Modern, Classic, Minimal)

### 🎯 Phase 3 (AI — 1 hafta)

- Gemini API sozlash + rate limiting (Upstash Redis bor)
- AI bullet generator, summary, cover letter
- Resume tailor (keyword matching)

---
