# ReDevOps Website

Marketing site for **ReDevOps** — hands-on DevOps consulting focused on cloud cost, reliability, and delivery speed.

## Stack
- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- Framer Motion (LazyMotion + `m.*`), hand-written WebGL, SVG and CSS
- Geist Sans / Geist Mono (local, via the `geist` package)

## Getting started

Prefer **pnpm**:

```bash
pnpm install
pnpm dev
```

You can also use npm or yarn if needed:

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Motion system ("THROUGHLINE")

The page plays like a film title sequence: one 1px line of cyan light (the *throughline*) is handed from
section to section — cold open → hero horizon → the chart inside each Services scene → the outcomes scope →
the process playhead → the final horizon → the booking button's underline.

- **Tokens** — `lib/motion/tokens.ts` (24 fps frame durations, named easings, springs) mirrored as CSS vars in
  `app/globals.css`. Don't introduce ad-hoc easings or durations.
- **Reveals** — server HTML is always the final state. Hidden starting states only apply under
  `html[data-ready][data-motion="full"]` via `data-reveal` / `data-reveal-intro` (see `components/motion/*`).
  Never hide server-rendered content with framer `initial`.
- **Motion preference** — a pre-paint boot script (`app/layout.tsx`) sets `html[data-motion]` from
  `prefers-reduced-motion` and the visitor's **MOTION** toggle; Tailwind variants `fx:` / `still:` key off it.
  Everything has a designed static state, and the site works fully without JavaScript.
- **Sections** — `components/<section>/*`; the section registry (reel numbers, nav) is `lib/sections.ts`.
- **Honesty** — the site promises no invented metrics. `pnpm check:honesty` fails on percentages, currency,
  multipliers and metric-like numbers in visible text. Run it (and `pnpm typecheck` — builds skip type
  checking) before shipping.

## Contact & booking

Primary CTAs:
- **Calendly** — book a free 30-minute consultation: https://calendly.com/eksiertu/30min
- **Email** — eksiertu@gmail.com

Shared constants live in `lib/contact.ts`.

## Branch

Default branch is `main`.
