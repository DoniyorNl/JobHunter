# Dars 02 — Supabase Connection Strings: Pooler vs Direct

## Muammo nimada edi?

`pnpm db:migrate` ishga tushirilganda bir nechta xato ketma-ket chiqdi:

```
Error: Connection url is empty
Error: P1000: Authentication failed
Error: FATAL: Tenant or user not found
Error: P1001: Can't reach database server at db.xxx.supabase.co:5432
```

Bu xatolarning har biri turli sabab bilan bog'liq edi. Keling, Supabase connection arxitekturasini chuqur tushunib chiqaylik.

---

## Supabase Database Arxitekturasi

```
Sizning App
    │
    ▼
┌─────────────────────────────────────┐
│         Supabase Pooler             │
│       (Supavisor — Elixir)          │
│                                     │
│  Transaction Mode  Session Mode     │
│  Port: 6543        Port: 5432       │
└──────────────────┬──────────────────┘
                   │
                   ▼
        ┌──────────────────┐
        │  PostgreSQL DB   │
        │  Port: 5432      │
        │ (Direct Access)  │
        └──────────────────┘
```

Supabase 3 xil ulanish usulini taklif qiladi:

---

## 1. Transaction Mode Pooler (port 6543)

```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
```

**Qanday ishlaydi?**
- Har bir SQL query uchun pool dan bitta connection olinadi
- Query tugashi bilan connection poolga qaytariladi
- Bir vaqtda yuzlab request bitta pool dan foydalana oladi

**Qachon ishlatiladi?**
- **App runtime** — `GET /api/jobs` kabi ko'plab parallel requestlar
- Serverless (Vercel) — har request yangi connection ochadi, pool bu muammoni hal qiladi

**Cheklov:** `SET` buyruqlari, prepared statements, PostgreSQL `LISTEN/NOTIFY` ishlamaydi — har query mustaqil.

---

## 2. Session Mode Pooler (port 5432, pooler hostida)

```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
```

**Qanday ishlaydi?**
- Bitta session davomida bitta dedicated connection
- Session tugaguncha o'sha connection saqlanadi
- Transaction mode ga qaraganda kam parallel request

**Qachon ishlatiladi?**
- Prisma CLI migrations — `CREATE TYPE`, `ALTER TABLE` kabi DDL buyruqlari session davomida ishlaydi
- `SET search_path` kabi session-level buyruqlar

---

## 3. Direct Connection (port 5432, `db.` hostida)

```
postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
```

**Qanday ishlaydi?**
- To'g'ridan-to'g'ri PostgreSQL ga ulanish, pooler orqali o'tmasdan
- Barcha PostgreSQL imkoniyatlari mavjud

**Muammo — bizda nima bo'ldi:**
```
Error: P1001: Can't reach database server at db.xxx.supabase.co:5432
```

Ko'plab ISP (internet provayderlar) va korxona tarmoqlari **port 5432 ni bloklab qo'yadi**. Bu xavfsizlik chorasi sifatida amalga oshiriladi — to'g'ridan-to'g'ri DB ga kirishni oldini olish uchun.

---

## Bizning .env Konfiguratsiyasi

```bash
# App runtime (Next.js API routes) → Transaction pooler
DATABASE_URL="postgresql://postgres.hgpcebyquinpsefjxxar:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

# Prisma CLI (migrate, db push) → Session pooler
# db.xxx.supabase.co:5432 ishlamadi (port bloklangan) — shuning uchun pooler:5432
DIRECT_URL="postgresql://postgres.hgpcebyquinpsefjxxar:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```

**Username format nima uchun `postgres.PROJECT_REF`?**
Supabase Pooler (Supavisor) bitta server da yuzlab project ushlab turadi. U qaysi project ga ulanish kerakligini `postgres.hgpcebyquinpsefjxxar` dagi `hgpcebyquinpsefjxxar` (project ref) orqali biladi. Bu "virtual hosting" ning database versiyasi.

---

## Xatolar Tahlili

### `Connection url is empty`
```
.env faylida DATABASE_URL yoki DIRECT_URL yo'q yoki bo'sh
```
**Yechim:** `.env` faylini to'ldirish.

---

### `P1000: Authentication failed`
```
Foydalanuvchi nomi yoki parol noto'g'ri
```
**Sabab:** Ko'p marta parol o'zgartirildi, `.env` eskicha qoldi.
**Yechim:** Supabase → Settings → Database → Reset password → yangi parolni `.env` ga qo'shish.

---

### `FATAL: Tenant or user not found`
```
Pooler username formatida PROJECT_REF noto'g'ri
```
**Sabab:** `postgres:PASSWORD@...` ishlatildi, lekin `postgres.PROJECT_REF:PASSWORD@...` kerak edi.

**Noto'g'ri:**
```
postgresql://postgres:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

**To'g'ri:**
```
postgresql://postgres.hgpcebyquinpsefjxxar:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

---

### `P1001: Can't reach database server`
```
db.xxx.supabase.co:5432 ga ulanib bo'lmadi
```
**Sabab:** ISP yoki tarmoq port 5432 ni bloklab qo'ygan.
**Yechim:** Direct connection o'rniga Session mode pooler (`aws-0-...:5432`) ishlatish.

---

### `FATAL: Tenant or user not found` (Session pooler bilan ham)
```
Parol noto'g'ri — pooler ham autentifikatsiya tekshiradi
```
**Yechim:** Supabase da parolni qayta o'rnatish.

---

## Prisma CLI `migrate dev` ishlamadi — Yechim

`pnpm db:migrate` (`prisma migrate dev`) Supabase Session pooler bilan ishlashni rad etdi. Sababi — `migrate dev` **shadow database** yaratishga harakat qiladi. Shadow DB — migration diff ni hisoblash uchun vaqtinchalik bo'sh DB. Supabase free tier da shadow DB yaratish imkoni yo'q.

**3 ta yechim:**

| Yechim | Tavsif | Kamchilik |
|--------|--------|-----------|
| `prisma db push` | Schema ni to'g'ridan-to'g'ri qo'llaydi, migration yaratmaydi | Production da xavfli (rollback yo'q) |
| `prisma migrate deploy` | Mavjud migration fayllarini qo'llaydi | Yangi migration yarata olmaydi |
| **SQL Editor** | Migration SQL ni Supabase da qo'lda ishlatish | Qo'lda, lekin ishonchli |

**Biz nima qildik:** `prisma migrate diff --from-empty --to-schema` buyrug'i bilan SQL generatsiya qildik, keyin Supabase SQL Editor orqali ishlatdik.

```bash
# SQL generatsiya
pnpm exec prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script -o migration.sql

# Natijani Supabase SQL Editor da ishlatdik → Success
```

---

## `.env.example` shablon

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...

# App runtime — Transaction pooler (port 6543)
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres"

# Prisma CLI — Session pooler (port 5432)
# Agar DIRECT_URL bo'lmasa, DATABASE_URL ishlatiladi (prisma.config.ts)
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

---

## Qoida — Connection String Tekshirish Ro'yxati

Xato chiqsa, ketma-ket tekshir:

- [ ] URL `postgresql://` yoki `postgres://` bilan boshlanadi
- [ ] Username `postgres.PROJECT_REF` formatida (pooler uchun)
- [ ] Parol to'g'ri va URL-encoded (maxsus belgilar uchun)
- [ ] Host to'g'ri (`aws-0-eu-west-1.pooler.supabase.com` yoki `db.XXX.supabase.co`)
- [ ] Port to'g'ri (transaction: 6543, session: 5432, direct: 5432)
- [ ] Database nomi `postgres`
- [ ] Supabase loyiha **paused** emasligini tekshir
- [ ] `.env` saqlangan va server qayta ishga tushirilgan
