# Design System — Prism

**Date:** 2026-06-05
**Scope:** Design tokens, component inventory, communication patterns, and navigation structure for v0.2 through v0.4. Configured in `packages/ui`.

---

## Personality

**Data/research focused, dark-first.** Prism is a personal knowledge tool — not a consumer chatbot. The visual language communicates precision and depth. References: Perplexity dark, Obsidian, Supabase.

- Dark by default (light mode deferred to v0.6 polish)
- Dense but not cramped — information breathes
- Violet accent anchors the AI/research identity
- Geist Sans for a modern, code-adjacent feel

---

## Color Tokens

### CSS Variables (`:root` in `packages/ui/src/index.css`)

```css
:root {
  /* Backgrounds */
  --background:        #0d0d14;   /* page background — dark violet-tinted */
  --surface:           #15151f;   /* cards, inputs, dropdowns */
  --surface-raised:    #1e1e2e;   /* modals, popovers, hover states */
  --border:            #2a2a3d;   /* borders, dividers */

  /* Text */
  --text-primary:      #f4f4f8;   /* headings, body */
  --text-secondary:    #a1a1c2;   /* subtitles, descriptions */
  --text-muted:        #6b6b8a;   /* metadata, labels, placeholders */

  /* Accent — Violet */
  --accent:            #7c3aed;   /* primary button, active nav link bg */
  --accent-foreground: #ffffff;   /* text on accent background */
  --accent-text:       #a78bfa;   /* violet-colored text, links */
  --accent-subtle:     #7c3aed22; /* subtle violet bg for badges/highlights */
  --accent-border:     #7c3aed44; /* violet border for focused inputs */

  /* Semantic — Document status */
  --success:           #4ade80;   /* badge: ready */
  --success-subtle:    #4ade8022;
  --success-border:    #4ade8033;

  --warning:           #fbbf24;   /* badge: processing */
  --warning-subtle:    #fbbf2422;
  --warning-border:    #fbbf2433;

  --danger:            #f87171;   /* badge: error, destructive actions */
  --danger-subtle:     #f8717122;
  --danger-border:     #f8717133;

  /* Telemetry — Chat source badges (v0.3+) */
  --source-parametric:        #a1a1aa;   /* gray — no tools used */
  --source-parametric-subtle: #71717a22;
  --source-embeddings:        #4ade80;   /* green — user documents */
  --source-embeddings-subtle: #4ade8022;
  --source-web:               #60a5fa;   /* blue — Tavily web search */
  --source-web-subtle:        #60a5fa22;
  --source-mixed:             #a78bfa;   /* violet — docs + web */
  --source-mixed-subtle:      #a78bfa22;
}
```

### Tailwind Config (`packages/ui/tailwind.config.ts`)

Map CSS variables to Tailwind tokens via `hsl()` wrappers or hex direct references:

```ts
theme: {
  extend: {
    colors: {
      background:     "var(--background)",
      surface:        "var(--surface)",
      "surface-raised": "var(--surface-raised)",
      border:         "var(--border)",
      "text-primary": "var(--text-primary)",
      "text-secondary":"var(--text-secondary)",
      "text-muted":   "var(--text-muted)",
      accent:         "var(--accent)",
      "accent-text":  "var(--accent-text)",
    },
    fontFamily: {
      sans: ["Geist", "system-ui", "sans-serif"],
    },
    borderRadius: {
      DEFAULT: "8px",
      sm:      "6px",
      lg:      "12px",
      full:    "9999px",
    },
  },
},
```

---

## Typography

**Font:** Geist Sans via Google Fonts CDN. No Geist Mono for now (no code blocks until v0.3+).

**Loading:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
```
Added to `apps/web/index.html`.

**Scale (Tailwind defaults, no overrides needed):**

| Class | Size | Weight | Use |
|-------|------|--------|-----|
| `text-xs` | 11px | 400/500 | Metadata, uppercase labels |
| `text-sm` | 13px | 400/500 | Body, list items, form fields |
| `text-base` | 15px | 400 | Chat message content |
| `text-lg` | 18px | 600 | Page titles (`h1`) |
| `text-xl` | 20px | 600 | Large section headings |

**Line-height:**
- `leading-tight` (1.25) — titles
- `leading-normal` (1.5) — body default
- `leading-relaxed` (1.625) — chat messages (long reading)

---

## Spacing & Radius

- **Border radius:** `8px` default for cards, inputs, buttons. `9999px` (full) for status pills.
- **Page max-width:** `680px` centered with `px-6` horizontal padding.
- **Page top padding:** `py-10` (40px).
- **Gap between doc list items:** `6px`.
- **Card padding:** `px-4 py-3` (16px / 12px).

---

## Component Inventory

### Entering in v0.2 (install via shadcn)

| Component | Source | Notes |
|-----------|--------|-------|
| `Button` | Already exists | Variants: default, outline, ghost, destructive |
| `Badge` | shadcn add badge | Two styles — see below |
| `Input` | shadcn add input | 3 states: default, focus, error |
| `Card` | shadcn add card | Used for document list items |
| `Sonner` | shadcn add sonner | Toast provider in App root |

### Reserved for v0.4–v0.6

| Component | When | Use |
|-----------|------|-----|
| `Tooltip` | v0.4 | Badge hover summary |
| `Sheet` | v0.4 | Expandable telemetry panel |
| `Skeleton` | v0.6 | Loading states |
| `Dialog` | v0.6 | Confirmation modals |
| `Textarea` | v0.3 | Chat input |

---

## Badge: Two Styles

**Status badge** (document state) — pill shape:
```tsx
// ready
<Badge variant="success">ready</Badge>
// processing
<Badge variant="warning">processing</Badge>
// error
<Badge variant="danger">error</Badge>
```
Style: `rounded-full`, subtle background + border, no hover.

**Telemetry badge** (chat source) — chip shape, expandable:
```tsx
<Badge variant="source-embeddings" expandable>embeddings ↗</Badge>
```
Style: `rounded` (8px), clickable, opens Sheet panel with chunk details (v0.4). The `↗` icon signals interactivity. In v0.2/v0.3 rendered as non-clickable chip — expandable behavior added in v0.4.

**Telemetry badge colors:**

| `variant` | Text color | Background |
|-----------|-----------|------------|
| `source-parametric` | `#a1a1aa` | `#71717a22` |
| `source-embeddings` | `#4ade80` | `#4ade8022` |
| `source-web` | `#60a5fa` | `#60a5fa22` |
| `source-mixed` | `#a78bfa` | `#a78bfa22` |

---

## Communication Patterns

### Toasts (Sonner)

Global feedback for async operations. Positioned bottom-right. Dark theme matching design system.

**Trigger events:**
| Event | Toast type | Message |
|-------|-----------|---------|
| Document ingested | success | `"Document ingested"` + filename + chunk count |
| Ingestion failed | error | `"Ingestion failed"` + reason |
| File type rejected | error | `"Unsupported file type"` |
| (v0.3) Chat error | error | `"Something went wrong"` |

**No toast for:** list fetching, page loads, navigation.

### Inline States

| State | How | Where |
|-------|-----|-------|
| Loading (page mount) | Centered `"Loading…"` text — no spinner yet (v0.6 adds Skeleton) | DocumentsPage |
| Empty list | Muted paragraph: `"No documents yet. Upload a PDF, .txt, or .md file above."` | DocumentList |
| Upload in progress | Button disabled + label `"Uploading…"` | UploadForm |

### Error Handling

- API errors (non-2xx): caught in `lib/api.ts`, thrown as `Error`. Page-level: shown via toast.
- File type validation: rejected immediately by the file input `accept` attr AND by the API (400). Toast on API error.
- No inline error banners in v0.2 — toasts only.

---

## Navigation

Top navigation bar, sticky. Minimal — two links for v0.2/v0.3.

```
● Prism          Documents   Chat
```

- Logo: violet dot (`●`) + "Prism" text
- Active link: `bg-accent-subtle text-accent-text rounded-md`
- Inactive link: `text-text-secondary hover:bg-surface-raised hover:text-text-primary`
- Height: `52px`, `border-bottom: 1px solid var(--border)`
- Horizontal padding: `px-8`
- Chat link: `opacity-40 pointer-events-none` in v0.2 (route not yet implemented) — becomes active in v0.3

---

## packages/ui Structure

```
packages/ui/src/
  index.css                    ← CSS variables (:root) + @tailwind directives
  index.ts                     ← re-exports all components
  lib/
    utils.ts                   ← cn() helper (exists)
  components/
    button.tsx                 ← exists, no changes needed
    badge.tsx                  ← new (shadcn + custom variants)
    input.tsx                  ← new (shadcn)
    card.tsx                   ← new (shadcn)
    sonner.tsx                 ← new (shadcn Toaster wrapper)
```

`apps/web/tailwind.config.ts` extended to consume `packages/ui/tailwind.config.ts` tokens (preset or content path).

---

## Mockup Reference

Final approved mockup saved at:
`.superpowers/brainstorm/90983-1780663456/content/documents-page-mockup.html`

Key patterns from mockup:
- Upload zone: dashed border (`border-dashed border-border`), surface background, icon + text + button row
- Doc card: surface bg, border, flex row with name/meta left + badge right
- Toast: surface bg with colored border (success/error), icon + title + subtitle + close
