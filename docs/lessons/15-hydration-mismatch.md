# Lesson 15 — React Hydration Mismatch: The `mounted` Pattern

## The Error

```
A tree hydrated but some attributes of the server rendered HTML
didn't match the client properties.

<a
+  className="...bg-foreground/[0.08] text-foreground..."   ← client (active)
-  className="...font-medium text-muted-foreground..."      ← server (inactive)
```

The `/board` nav link was rendered as **inactive** by the server but **active**
by the client — even though we were visiting `/board`.

---

## What Is Hydration?

```
Server                         Client (Browser)
  │                                │
  │  1. Renders HTML string        │
  │     (React components → HTML)  │
  │──────── sends HTML ───────────►│
  │                                │
  │                                │  2. Shows HTML immediately (fast)
  │                                │
  │──── sends JS bundle ──────────►│
  │                                │
  │                                │  3. React "hydrates" — attaches
  │                                │     event handlers to existing HTML
  │                                │     WITHOUT re-rendering from scratch
```

**Hydration = React takes over the server-rendered HTML without changing it.**

If React's client-side render produces **different HTML** than the server did,
React can't attach event handlers correctly. This is a **hydration mismatch**.

---

## Why Did This Happen?

Our Sidebar is a `'use client'` component that uses `usePathname()`:

```typescript
// NavContent in Sidebar.tsx
const pathname = usePathname()   // returns current URL path

const isActive = pathname.startsWith(href) && !exactSiblingActive
// isActive = true → className includes 'bg-foreground...'
// isActive = false → className includes 'font-medium text-muted-foreground...'
```

### The Timeline

```
Next.js Server:
  1. Starts rendering DashboardLayout (Server Component)
  2. Encounters <Sidebar> (Client Component)
  3. Renders Sidebar on server for SSR
  4. usePathname() returns... something unexpected
  5. isActive = false → renders ALL links as "inactive"
  6. Sends HTML to browser: all links have "font-medium" class

Browser (Client):
  7. Shows the server HTML (all links look inactive momentarily)
  8. Downloads JS bundle
  9. React hydrates — runs NavContent again
  10. usePathname() returns '/board' correctly
  11. isActive = true for /board → className should be 'bg-foreground...'
  12. ⚠️ MISMATCH! Server said 'font-medium', client says 'bg-foreground'
```

---

## Root Cause: Client Components in SSR

In Next.js App Router, `'use client'` components are **still rendered on the server**
for the initial HTML. This is called SSR (Server-Side Rendering) of Client Components.

The confusion: "client component" doesn't mean "only runs on client". It means
"has access to browser APIs and can use React hooks". But it still runs on the server
for the initial HTML.

```
             runs on server?    runs on client?
Server Component:      ✅ always        ❌ never
Client Component:      ✅ for SSR       ✅ always
```

The **problem**: some hooks behave slightly differently during server SSR vs client
hydration. `usePathname()` falls into this category in Next.js 16. The router context
is not fully initialized the same way during server-side render of a client component.

---

## The Fix: `mounted` Pattern

```typescript
function NavContent({ user, onNavigate }) {
  const pathname = usePathname()

  // Both server AND initial client render → isActive = false (all links inactive)
  // After useEffect fires (post-hydration) → isActive computed correctly
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // ...

  const isActive = mounted && (exact
    ? pathname === href
    : pathname.startsWith(href) && !exactSiblingActive)
```

### Why This Works

```
Server render:         mounted = false → isActive = false → 'text-muted-foreground'
                                                              ↑ className A

Client initial render: mounted = false → isActive = false → 'text-muted-foreground'
                                                              ↑ className A (matches!)
                       → ✅ No hydration mismatch

useEffect fires:       mounted = true  → isActive = true  → 'bg-foreground...'
                                                              ↑ className B (correct!)
                       → ✅ React does a normal state update, no mismatch
```

**Key insight**: The mismatch happens at **hydration time** (step 7–11 above).
After hydration, normal React state updates work fine — they always re-render
from the current state. The `mounted` pattern makes server and initial client
render produce the same output, then uses state update to get to the real state.

---

## Is There a Flash?

Technically yes — for ~0–1 milliseconds, all nav links appear inactive.
In practice this is **invisible** for two reasons:

1. `useEffect` fires synchronously after the browser paints the first frame
2. We have `transition-colors` on the links — the color change is smooth

You would need a 240fps slow-motion camera to see the flash.

---

## Other Places This Pattern Applies

This pattern is needed anywhere server and client might render differently:

### 1. Dark Mode Toggle (next-themes handles this for us)

```tsx
// next-themes uses this pattern internally
// That's why it requires suppressHydrationWarning on <html>
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])

if (!mounted) return <Skeleton />  // or null, or a placeholder
return isDark ? <Sun /> : <Moon />
```

### 2. Window/Browser API Access

```typescript
// ❌ Causes hydration mismatch
const width = typeof window !== 'undefined' ? window.innerWidth : 0

// ✅ Safe pattern
const [width, setWidth] = useState(0)  // 0 on both server and client
useEffect(() => setWidth(window.innerWidth), [])
```

### 3. LocalStorage / Cookies for UI State

```typescript
// ❌ Server doesn't have localStorage
const saved = localStorage.getItem('theme') || 'light'

// ✅ Safe
const [theme, setTheme] = useState('light')  // default on both
useEffect(() => {
  const saved = localStorage.getItem('theme')
  if (saved) setTheme(saved)
}, [])
```

### 4. Date Formatting in User Locale

```typescript
// ❌ Server locale !== client locale
new Date().toLocaleDateString()

// ✅ Use a fixed locale or the mounted pattern
new Date().toLocaleDateString('en-US')  // deterministic
```

---

## `suppressHydrationWarning` — When to Use It

```tsx
<html suppressHydrationWarning>  ← correct: next-themes changes this after hydration
```

`suppressHydrationWarning` tells React: "I know this element might differ between
server and client — ignore it."

**Use it when:**
- The difference is intentional (e.g., dark mode class set by an inline script)
- The element is not interactive (the mismatch doesn't affect event handling)

**Don't use it as a blanket fix:**
```tsx
// ❌ Wrong — hides real bugs
<div suppressHydrationWarning>
  {someClientOnlyValue}
</div>

// ✅ Right — fix the root cause using mounted pattern
```

---

## Summary: The Three Rules of Hydration

1. **Server and client must render the same HTML on first render.**
   If something must differ (locale, dark mode, window size), use the `mounted` pattern.

2. **Client-only APIs (`window`, `localStorage`, `navigator`) must be accessed in `useEffect`.**
   Never call them at module load or render time.

3. **`suppressHydrationWarning` is for intentional differences only.**
   If you're using it to silence a warning you don't understand, fix the root cause instead.

---

## What Changed

| File | Change |
|---|---|
| `src/components/layout/Sidebar.tsx` | Added `mounted` state — SSR/client className now matches |
