# Lesson 14 — Design System: Warm Retro-Modern + Dark Mode

## What We Built

A complete design system overhaul:
- **Warm retro-modern monochrome** color palette (light + dark)
- **System font stack** — SF Pro on Mac, Segoe UI Variable on Windows
- **Dark mode** with OS preference detection + manual toggle
- **Sharp radius** (0.35 rem instead of 0.625 rem)
- **ThemeProvider** using `next-themes`

---

## Why the Default Looked Bad (Root Cause)

Before this lesson, the app looked plain even though Geist font was installed.
The CSS was broken in a subtle way:

```css
/* ❌ What was in globals.css — circular reference! */
@theme inline {
  --font-sans: var(--font-sans);  /* references itself → undefined! */
}
```

`--font-sans` was pointing to itself. Tailwind's `font-sans` utility resolved to
`undefined`, so the browser fell back to the system default (Times New Roman on Mac,
or whatever the browser default is). **The font was never applied at all.**

**The fix:**
```css
/* ✅ Fixed — Geist is the fallback, not the primary */
@theme inline {
  --font-sans:
    -apple-system, BlinkMacSystemFont,
    "Segoe UI Variable Display", "Segoe UI",
    system-ui, ui-sans-serif,
    var(--font-geist-sans),   ← now references the Next.js font variable correctly
    sans-serif;
}
```

---

## Font Philosophy: System Fonts First

```css
--font-sans:
  -apple-system,                    /* macOS/iOS: SF Pro (Apple's font) */
  BlinkMacSystemFont,               /* older Chrome on macOS */
  "Segoe UI Variable Display",      /* Windows 11: variable-weight Segoe */
  "Segoe UI Variable Text",         /* Windows 11: text variant */
  "Segoe UI",                       /* Windows 10 / older */
  system-ui,                        /* generic system font on any OS */
  ui-sans-serif,                    /* CSS4 standard fallback */
  var(--font-geist-sans),           /* Geist (loaded via next/font) */
  sans-serif;                       /* absolute last resort */
```

**Why system fonts instead of Geist as primary?**

| Concern | System Font | Web Font (Geist) |
|---|---|---|
| Render quality | ✅ Native hinting, pixel-perfect | 🟡 Good, but not native |
| Load time | ✅ Zero (already on OS) | 🟡 1 network request (even with `next/font`) |
| readability | ✅ Tuned for the specific display | 🟡 Generic |
| Consistency across OS | 🟡 Looks different per OS | ✅ Same everywhere |

For a **professional productivity app** (not a marketing site), consistency across OS
matters less than rendering quality on the user's own device. SF Pro on macOS looks
stunning. Segoe UI Variable on Windows 11 is excellent.

**Geist stays as the fallback** — so Linux users and unusual setups still get a clean,
designed font instead of generic sans-serif.

---

## Color Palette Design: Warm Monochrome

The palette uses **zero-saturation** base colors with a **tiny warmth shift** (hue ~55–80 in OKLCH).
Pure cool gray (#888888) is fatiguing to read for long periods — a slight warmth makes
text feel more like ink on paper.

### OKLCH Color Space

We use `oklch()` instead of `hsl()` or hex because:
- **Perceptually uniform** — L (lightness) 0→1 is a straight line of perceived brightness
- **Better dark mode** — it's easier to create balanced pairs of light/dark values

```
oklch(L C H)
      │ │ └─ Hue: 0–360° (55–80 = yellowish warm)
      │ └─── Chroma: 0 = gray, higher = more colorful (we use 0.005–0.010)
      └───── Lightness: 0 = black, 1 = white
```

### Light Mode — "Warm Paper"

```css
:root {
  --background:       oklch(0.985 0.005 75);  /* cream white  ≈ #FAF9F7 */
  --foreground:       oklch(0.13  0.010 55);  /* warm black   ≈ #1C1917 */
  --card:             oklch(1     0     0);   /* pure white (lifts from bg) */
  --border:           oklch(0.900 0.006 75);  /* warm light gray */
  --muted-foreground: oklch(0.50  0.008 58);  /* readable warm gray */
  --radius: 0.35rem;                          /* sharper than default 0.625rem */
}
```

**Why different background and card?** When cards are `pure white` on a `#FAF9F7` background,
they naturally lift off — subtle depth without shadows. Pure white on pure white = no depth.

### Dark Mode — "Warm Night"

```css
.dark {
  --background:   oklch(0.110 0.008 55);  /* charcoal-black ≈ #161412 */
  --foreground:   oklch(0.968 0.006 72);  /* cream white    ≈ #F5F2EE */
  --card:         oklch(0.150 0.008 55);  /* slightly lighter than bg */
  --border:       oklch(1 0 0 / 9%);     /* semi-transparent white */
}
```

**Why `oklch(1 0 0 / 9%)` for dark borders?** Semi-transparent white borders
automatically adapt to any background color — they look natural whether the background
is very dark or medium dark. A specific gray value would look wrong if card colors vary.

---

## ThemeProvider Architecture

```
layout.tsx
  └── <html suppressHydrationWarning>     ← critical!
        └── <ThemeProvider>               ← next-themes manages "dark" class
              └── {children}              ← entire app
```

### Why `suppressHydrationWarning` on `<html>`?

`next-themes` sets the `class` attribute on `<html>` **before React hydrates** by
injecting an inline script. This means the server renders `<html class="">` but
the client sees `<html class="dark">` (or `"light"`). React would warn about this
mismatch — `suppressHydrationWarning` tells React to accept the diff silently.

```tsx
// src/app/layout.tsx
<html
  lang='en'
  className={`${geistSans.variable} ${geistMono.variable} h-full`}
  suppressHydrationWarning   ← next-themes requires this
>
```

### ThemeProvider Options

```typescript
<NextThemesProvider
  attribute='class'        // applies "dark" as a class → .dark {} in CSS
  defaultTheme='system'    // first visit: check prefers-color-scheme
  enableSystem             // enables OS-level detection
  disableTransitionOnChange // prevents full-page transition flash on switch
>
```

**Why `disableTransitionOnChange`?** Without it, when the theme switches, CSS
`transition` on every element creates a jarring full-page animation. Disabling
transitions for the one render cycle where the theme changes makes it instant.

### How the Toggle Works

```typescript
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <Button onClick={() => setTheme(isDark ? 'light' : 'dark')}>
      {isDark ? <Sun /> : <Moon />}
      {isDark ? 'Light mode' : 'Dark mode'}
    </Button>
  )
}
```

**`resolvedTheme` vs `theme`:** `theme` can be `'system'` (user hasn't manually
chosen). `resolvedTheme` always gives the actual result (`'light'` or `'dark'`).
Always use `resolvedTheme` for conditional rendering.

---

## Radius Philosophy: Sharp Corners = Retro Feel

| Value | Feel |
|---|---|
| `0rem` | Technical/industrial |
| `0.25rem` | Sharp professional |
| `0.35rem` | Our choice — "typeset" feel |
| `0.625rem` | Shadcn default — friendly/modern |
| `1rem+` | Pill/playful |

The "retro modern" aesthetic sits at 0.25–0.375 rem — enough rounding to be
modern (not cold/technical) but sharp enough to evoke printed materials.

---

## Typography Improvements

```css
body {
  line-height: 1.55;                            /* tighter than default 1.6–1.75 */
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1;  /* kerning, ligatures */
  -webkit-font-smoothing: antialiased;          /* thinner, crisper on Retina */
}

h1, h2, h3, h4, h5, h6 {
  letter-spacing: -0.025em;  /* tighter tracking = more confident, editorial feel */
  font-weight: 600;
  line-height: 1.25;
}
```

**Font smoothing explained:**
- `antialiased` = thinner strokes, looks better on high-DPI (Retina) displays
- `auto` (default) = subpixel rendering, looks better on low-DPI (some Windows monitors)
- We use `antialiased` because most modern displays are Retina-class, and it makes
  the system font (SF Pro, Segoe UI Variable) render at its designed weight

**Negative letter-spacing on headings:** Most professional design systems
(Linear, Vercel, Notion) use `-0.02em` to `-0.03em` on headings. It creates
visual density and confidence — headings feel "set" rather than "typed".

**`font-feature-settings`:**
- `kern` — adjusts spacing between specific letter pairs (AV, Ty, etc.)
- `liga` — replaces character sequences with ligatures (fi, fl, ff)
- `calt` — contextual alternates (font adapts letterforms based on context)

---

## What Changed

| File | Change | Why |
|---|---|---|
| `src/app/globals.css` | Complete rewrite — system font stack, warm palette, base typography | Fix font bug, add design system |
| `src/app/layout.tsx` | Added `ThemeProvider`, `suppressHydrationWarning`, `display:'swap'` | Dark mode support |
| `src/components/shared/ThemeProvider.tsx` | Created — wraps next-themes | Centralize theme setup |
| `src/components/layout/Sidebar.tsx` | Added `ThemeToggle`, "JobHunter" branding | Dark mode UI |
| `src/app/(auth)/login/page.tsx` | "JobTracker" → "JobHunter" | Branding consistency |
| `src/app/(auth)/signup/page.tsx` | "JobTracker" → "JobHunter" | Branding consistency |

---

## Visual Comparison

```
BEFORE:                          AFTER:
─────────────────────────        ─────────────────────────
Background: #FFFFFF (cold)       Background: #FAF9F7 (warm paper)
Text: #000000 (harsh black)      Text: #1C1917 (ink black)
Font: Not applied (circular ref) Font: SF Pro / Segoe UI Variable
Radius: 0.625rem (rounded)       Radius: 0.35rem (sharp)
Dark mode: Not working            Dark mode: Full support with toggle
Name: "JobTracker"               Name: "JobHunter"
```
