# JobHunter

Huntr.co uslubidagi job search tracker: **Next.js (App Router)**, **Supabase Auth**, **PostgreSQL + Prisma**, **Kanban board**, keyinchalik resume / AI (guide: `huntr-clone-guide.md`).

## Talablar

- Node.js 20.19+ (22.x tavsiya)
- [pnpm](https://pnpm.io) 9+
- [Supabase](https://supabase.com) loyihasi (PostgreSQL)

## 1. Repozitoriy va paketlar

```bash
git clone <repo-url> JobHunter
cd JobHunter
pnpm install
```

`postinstall` avtomatik `prisma generate` ishga tushadi.

## 2. Supabase

1. Supabase-da yangi loyiha yarating.
2. **Settings → API**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Settings → Database**: connection stringlar:
   - **Pool mode** (Transaction) — `.env` dagi `DATABASE_URL` (odatda `?pgbouncer=true`).
   - **Direct** — `DIRECT_URL` (migratsiyalar uchun; session mode yoki to‘g‘ri host).

## 3. Environment

```bash
cp .env.example .env
```

`.env` ni to‘ldiring (guide §14 bilan bir xil):

| O‘zgaruvchi | Ma’nosi |
|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key |
| `DATABASE_URL` | Pooled PostgreSQL (app + Prisma client) |
| `DIRECT_URL` | Direct PostgreSQL (Prisma CLI migrate) |
| `GEMINI_API_KEY` | AI (keyingi bosqich) |
| `RESEND_API_KEY` | Email (ixtiyoriy) |
| `UPSTASH_REDIS_REST_*` | Rate limit (ixtiyoriy) |
| `NEXT_PUBLIC_APP_URL` | Masalan `http://localhost:3000` |

**Google OAuth** (ixtiyoriy): Supabase → Authentication → Providers → Google.

**Redirect URL**: `http://localhost:3000/auth/callback` (va production domeningiz).

## 4. Database schema

`.env` da `DIRECT_URL` yoki `DATABASE_URL` bo‘lmasa, Prisma CLI `Connection url is empty` beradi — avvalo Supabase qiymatlarini kiriting.

Birinchi marta (lokal dev, migratsiya yaratadi + qo‘llaydi):

```bash
pnpm db:migrate
```

Repo bilan kelgan migratsiyani faqat **qo‘llash** (masalan Vercel / CI):

```bash
pnpm exec prisma migrate deploy
```

Tezkor prototip (migratsiyasiz, faqat dev):

```bash
pnpm db:push
```

Boshlang‘ich SQL allaqachon `prisma/migrations/20260328140000_init/` da — yangi Supabase DB uchun yuqoridagi buyruqlar yetarli.

## 5. Ishga tushirish

```bash
pnpm dev
```

- **Landing**: [http://localhost:3000](http://localhost:3000)  
- **Login / Signup**: `/login`, `/signup`  
- **Dashboard** (himoyalangan): `/board`, `/resumes`, …

## 6. Tekshiruvlar

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## 7. Loyiha tuzilishi

Guide’dagi `huntr-clone-guide.md` §3 bilan moslashtirilgan: `src/app/(marketing)`, `(auth)`, `(dashboard)`, `src/app/api/*`, `prisma/schema.prisma`.

Hozircha guide’dan **amalda yo‘q** yoki qisman: kengaytirilgan `/api/resumes`, `/api/ai`, Chrome extension, Vitest/Playwright konfiglari, CI workflow — keyingi fazalar.

## Texnologiyalar

Next.js 16, React 19, Tailwind 4, Prisma 7 (+ `pg` adapter), Supabase, TanStack Query, Zustand, dnd-kit.
