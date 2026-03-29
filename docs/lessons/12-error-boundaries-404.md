# Dars 12 — Error Boundaries, 404 Page va SEO

## Nima qildik?

Loyihani production-ready holatga keltirish uchun uchta muhim narsa:

1. **404 page** — mavjud bo'lmagan sahifaga kirsa
2. **Error boundaries** — kutilmagan xato bo'lganda app qulab tushmaydi
3. **SEO metadata** — Open Graph, title template

---

## 1. 404 Page

### Muammo
Foydalanuvchi `/randompage` ga kirsa, Next.js default 404 sahifasini ko'rsatadi — bu branding siz, oddiy, professional emas.

### Yechim: `not-found.tsx`

```
src/app/
└── not-found.tsx    ← Next.js bu faylni avtomatik topadi
```

```tsx
// src/app/not-found.tsx
export default function NotFound() {
  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center space-y-6'>
        <p className='text-8xl font-black text-primary/20'>404</p>
        <h1 className='text-2xl font-bold'>Page not found</h1>
        <p className='text-muted-foreground text-sm'>...</p>
        <Link href='/board'>Back to board</Link>
      </div>
    </div>
  )
}
```

**Qanday ishlaydi?**

```
Foydalanuvchi /abc/xyz ga kiradi
        │
        ▼
Next.js routing — hech qanday page topilmadi
        │
        ▼
src/app/not-found.tsx render qilinadi
        │
        ▼
HTTP response: 404 status code bilan sahifa
```

**`notFound()` funksiyasi ham bor:**

```typescript
// Server component yoki API route ichida
import { notFound } from 'next/navigation'

export default async function ResumePage({ params }) {
  const resume = await getResume(params.id)
  if (!resume) notFound()  // ← not-found.tsx ga yo'naltiradi
  // ...
}
```

---

## 2. Error Boundaries

### Muammo
React komponent render bo'layotganda JavaScript xatosi chiqsa:

```
❌ Error boundaries yo'q holda:
Xato → Butun app qora ekran ("White screen of death")
Foydalanuvchi hech narsa ko'rmaydi, nima qilishni bilmaydi
```

### Next.js Error Boundary Pattern

Next.js da har bir segment uchun `error.tsx` fayli yaratish mumkin:

```
src/app/
├── error.tsx              ← Global (butun app uchun)
└── (dashboard)/
    └── error.tsx          ← Dashboard segment uchun
```

```tsx
// src/app/error.tsx
'use client'  // ← Error boundary MAJBURIY client component

export default function GlobalError({
  error,
  reset,   // Qayta urinish uchun funksiya
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)  // Monitoring uchun log
  }, [error])

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center space-y-6'>
        <h1>Something went wrong</h1>
        {error.digest && <p>Error ID: {error.digest}</p>}  {/* Production da */}
        <button onClick={reset}>Try again</button>
        <a href='/board'>Go home</a>
      </div>
    </div>
  )
}
```

**`error.digest`** nima?

```
Production da:
- Xato server loglarida saqlanadi
- Foydalanuvchiga faqat digest (ID) ko'rsatiladi
- ID bilan server logdan tafsilotlarni topish mumkin
- Xavfsiz: stack trace foydalanuvchiga ko'rinmaydi
```

### Ikki Darajali Error Boundary

```
Darajalar:
┌─────────────────────────────────────────────┐
│  src/app/error.tsx (global)                 │
│  ┌───────────────────────────────────────┐  │
│  │  src/app/(dashboard)/error.tsx        │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  /board page                    │  │  │
│  │  │  /metrics page                  │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**Nima uchun ikki daraja?**

```
Dashboard error.tsx xato tutsa:
  → Sidebar va header SAQLANIB qoladi
  → Faqat main content area "Something went wrong" ko'rsatadi
  → Foydalanuvchi boshqa sahifaga o'tishi mumkin

Global error.tsx xato tutsa:
  → Butun sahifa almashtriladi
  → Faqat minimal UI: xabar + "Try again" + "Go home"
```

### `'use client'` nima uchun majburiy?

```
Error boundary = React class component (componentDidCatch lifecycle)
              = yoki React 16+ ErrorBoundary pattern
              = faqat Client Component da ishlaydi

Server Component da useEffect, useState yo'q
→ error.tsx da 'use client' MAJBURIY
```

---

## 3. SEO Metadata

### Avval

```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  title: 'JobHunter — Job search tracker',
  description: '...',
}
```

**Muammo:** Har bir page uchun title bir xil — "JobHunter". Sahifa ni browser tab da ajratish qiyin.

### Keyin — Template Pattern

```typescript
export const metadata: Metadata = {
  title: {
    default: 'JobHunter — Track your job search',  // Sahifa title yo'q bo'lsa
    template: '%s | JobHunter',                     // Sahifa title bor bo'lsa
  },
  description: '...',
}
```

```typescript
// src/app/(dashboard)/metrics/page.tsx
export const metadata: Metadata = {
  title: 'Metrics',  // ← template bilan: "Metrics | JobHunter"
}
```

**Natija:**

| Sahifa | Browser tab |
|---|---|
| `/board` | `Board | JobHunter` |
| `/metrics` | `Metrics | JobHunter` |
| `/resumes` | `Resumes | JobHunter` |
| Noto'g'ri URL | `JobHunter — Track your job search` |

### Open Graph

```typescript
openGraph: {
  type: 'website',
  siteName: 'JobHunter',
  title: 'JobHunter — Track your job search',
  description: 'Kanban board, resume builder, contact & interview management.',
}
```

Open Graph — LinkedIn, Twitter, iMessage da link share qilinganda ko'rinadigan preview. Branding uchun muhim.

### `robots: noindex`

```typescript
robots: { index: false, follow: false }
```

**Nima uchun?**

Bu private app — har bir foydalanuvchi o'z board ini ko'radi. Google bu sahifalarni index qilmasligi kerak:
- Shaxsiy ma'lumotlar ommaviy bo'lib qolmasin
- Har bir user uchun `localhost:3000/board` ni index qilishning ma'nosi yo'q
- SEO keraksiz (app auth orqali kiradi)

---

## Yakuniy o'zgarishlar

### Yangi fayllar

```
src/app/not-found.tsx       ← 404 page
src/app/error.tsx           ← Global error boundary
src/app/(dashboard)/error.tsx  ← Dashboard-level error boundary
```

### O'zgartirilgan fayllar

| Fayl | Nima qo'shildi |
|---|---|
| `app/layout.tsx` | Title template, OpenGraph, robots noindex |

### Avval va keyin

| Holat | Avval | Keyin |
|---|---|---|
| Mavjud bo'lmagan URL | Next.js default 404 | Branding 404 + "Back to board" |
| React render xatosi | White screen of death | Error UI + "Try again" |
| Dashboard xatosi | Butun app qulab tushadi | Faqat content area xato ko'rsatadi |
| Browser tab title | "JobHunter" har yerda | "Metrics \| JobHunter" va h.k. |

---

## Qo'shimcha: Production Xatolarni Kuzatish

Haqiqiy production app da error monitoring kerak (Sentry, DataDog, va h.k.):

```typescript
// src/app/error.tsx
import * as Sentry from '@sentry/nextjs'  // kelajakda qo'shish mumkin

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error)  // Xatoni Sentry ga yuboradi
  }, [error])
  // ...
}
```

Hozir `console.error` bilan cheklanamiz — local development uchun yetarli.
