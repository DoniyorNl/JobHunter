# Dars 01 — Prisma 7: Breaking Changes va Adapter Pattern

## Muammo nimada edi?

Loyiha `Prisma 7.x` ishlatadi. Bu versiya `Prisma 6`dan keskin farq qiladi — bir nechta **breaking changes** bor. Dastlab loyihani ishga tushirmoqchi bo'lganda quyidagi xatolar chiqdi:

```
error TS2688: Cannot find type definition file for 'react-pdf'.
Module '"@prisma/client"' has no exported member 'PrismaClient'.
Using engine type "client" requires either "adapter" or "accelerateUrl"
```

Keling, har birini tushunib chiqaylik.

---

## 1. `schema.prisma` dagi o'zgarishlar

### Prisma 6 da (eski usul)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")     // ✅ Prisma 6 da ishlardi
  directUrl = env("DIRECT_URL")       // ✅ Prisma 6 da ishlardi
}
```

### Prisma 7 da (yangi usul)

```prisma
datasource db {
  provider = "postgresql"
  // url va directUrl bu yerda EMAS
}
```

**Nima uchun olib tashlashdi?**
Prisma 7 connection URL larni `prisma.config.ts` fayliga ko'chirdi. Sababi — konfiguratsiya bir joyda bo'lsin, turli muhitlar (dev, staging, prod) uchun boshqaruv osonlashsin.

---

## 2. `prisma.config.ts` — Yangi konfiguratsiya

```typescript
// prisma.config.ts (loyiha ildizida)
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // CLI (migrate, db push) uchun URL
    // DIRECT_URL mavjud bo'lsa uni ishlat — Supabase uchun migrations da kerak
    url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'],
  },
})
```

**Nima uchun `DIRECT_URL ?? DATABASE_URL`?**

| URL | Maqsad |
|-----|--------|
| `DATABASE_URL` | App runtime uchun — pooled connection (port 6543) |
| `DIRECT_URL` | Prisma CLI migrations uchun — direct connection |

Prisma CLI schema o'zgarishlarini qo'llash uchun to'g'ridan-to'g'ri ulanish kerak. Connection pooler ba'zi SQL buyruqlarini qo'llab-quvvatlamaydi (`CREATE TYPE`, `ALTER TABLE` va h.k.).

---

## 3. Runtime Adapter — Eng Katta O'zgarish

Prisma 7 dan oldin PrismaClient o'zida Rust-based query engine birga kelardi. Prisma 7 bu engineni olib tashlab, to'g'ridan-to'g'ri Node.js database driveriga o'tdi.

**Bu nimani anglatadi?**
Endi PrismaClient yaratish uchun **adapter** berib yuborish shart.

### 3 ta variant bor:

**Variant A: `@prisma/adapter-pg` (PostgreSQL uchun)**
```typescript
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
```

**Variant B: Prisma Accelerate** (Prisma ning cloud xizmati)
```typescript
const prisma = new PrismaClient({ accelerateUrl: process.env.DATABASE_URL })
```

**Variant C: Boshqa adapterlar**
- `@prisma/adapter-neon` — Neon Postgres uchun
- `@prisma/adapter-better-sqlite3` — SQLite uchun
- `@prisma/adapter-libsql` — Turso uchun

**Biz nima tanladik va nima uchun?**
`@prisma/adapter-pg` — standart PostgreSQL (Supabase ichida ham pg ishlaydi). Bepul, hech qanday vendor lock-in yo'q.

---

## 4. Global Singleton + Lazy Proxy Pattern

### Muammo: Next.js dev server har saqlashda modullarni qayta yuklatadi (Hot Module Replacement)

Har safar HMR bo'lganda `new PrismaClient()` chaqirilsa — `Too many connections` xatosi chiqadi.

### Yechim 1: Global Singleton (keng tarqalgan, lekin etarli emas)

```typescript
// ❌ Muammo: build vaqtida DATABASE_URL yo'q bo'lishi mumkin
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

Build paytida Next.js API route modullarini yuklaydi. `new PrismaClient()` darhol chaqirilsa va `DATABASE_URL` env o'zgaruvchisi o'sha worker da mavjud bo'lmasa — xato.

### Yechim 2: Lazy Proxy (biz tanladik) ✅

```typescript
// src/lib/prisma.ts
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient()
  }
  return globalForPrisma.prisma
}

/**
 * Proxy — modul yuklanganda PrismaClient yaratilmaydi.
 * Faqat birinchi `.job.findMany()` kabi chaqiruv bo'lganda yaratiladi.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function'
      ? (value as (...a: unknown[]) => unknown).bind(client)
      : value
  },
})
```

**Proxy nima qiladi?**
`prisma.job.findMany(...)` chaqirilganda:
1. Proxy `get` ushlab oladi: `prop = "job"`
2. `getClient()` chaqiriladi — agar client yo'q bo'lsa yaratiladi
3. `client.job` qaytariladi
4. Keyin `.findMany(...)` o'sha client ustida ishlaydi

**Nima uchun bu yaxshiroq?**
- Build vaqtida modul yuklanadi — lekin `getClient()` chaqirilmaydi
- Faqat haqiqiy request kelganda client yaratiladi
- O'sha payt `DATABASE_URL` allaqachon mavjud

---

## 5. `@types/react-pdf` — Nega olib tashlandi?

```typescript
// ❌ package.json da bor edi
"@types/react-pdf": "^7.0.0"
```

`tsc --noEmit` quyidagi xatoni berdi:
```
error TS2688: Cannot find type definition file for 'react-pdf'.
```

**Sabab:** `@react-pdf/renderer` allaqachon o'zida TypeScript definitionlarni olib keladi (built-in types). `@types/react-pdf` alohida, eskirgan paket va hozir aslida mavjud emas — bu noto'g'ri qo'shilgan edi.

**Qoida:** Agar paket o'zida `types` yoki `typings` field bo'lsa `package.json` da — `@types/...` qo'shish shart emas.

---

## 6. `postinstall` script

```json
// package.json
"scripts": {
  "postinstall": "prisma generate"
}
```

**Nima uchun?**
Yangi odam reponi clone qilib `pnpm install` qilganda `prisma generate` avtomatik ishlaydi. Aks holda `@prisma/client` import qilinganda TypeScript xatosi chiqadi — chunki generated types `node_modules` da yo'q.

---

## Xulosa

| O'zgarish | Prisma 6 | Prisma 7 |
|-----------|----------|----------|
| Connection URL | `schema.prisma` da | `prisma.config.ts` da |
| Runtime engine | Rust-based (built-in) | Node.js driver adapter (shart) |
| Client yaratish | `new PrismaClient()` | `new PrismaClient({ adapter })` |
| Migrations | `migrate dev` (shadow DB bilan) | Xuddi shunday, lekin config o'zgardi |

**Bizning stack:**
```
DATABASE_URL (pooled, port 6543) → app runtime (PrismaPg adapter)
DIRECT_URL   (session, port 5432) → Prisma CLI migrations
```
