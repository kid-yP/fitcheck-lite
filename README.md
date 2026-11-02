# fitcheck.lite

> Wear more of what you own. A free digital wardrobe: photograph your clothes, build outfits on a
> dress form, and get styling suggestions based on the weather and the occasion.

**Live demo:** [your-deployed-link]  ·  **Built by:** Kidus Yosef

<!-- Add 3 screenshots here: landing page, wardrobe, outfit studio (dark mode looks great) -->

## What it does

- **Digitise a closet fast.** Drop a photo; the background is removed *in the browser* (on-device ML) and the
  dominant colour is detected. Confirm the details and save.
- **Outfit studio.** Compose looks on a dress form with replace/remove controls per slot; save them, mark them
  as worn, and wear counts update on every piece.
- **Stylist engine.** A deterministic, unit-tested ranking engine scores every combination on formality,
  season/temperature and colour harmony, and prefers rarely-worn pieces. It runs with no AI and no cost.
- **Streaming AI stylist chat.** Optional chat (Groq / Llama, or Gemini) that streams its answer word by word and
  is grounded in your wardrobe and the engine's suggestions. The API key stays server-side.
- **Live demo on the landing page.** Visitors can drag a temperature slider and watch the engine re-rank
  looks, with no sign-in required.
- **Polish.** Light/dark theme with no flash, ⌘K command palette, responsive layout with a mobile tab bar,
  keyboard-accessible controls, reduced-motion support.

## Tech and design decisions

| Area | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript | Current stack, typed end to end |
| Styling | Tailwind CSS 4 with CSS-variable design tokens, Geist fonts | Theming without a runtime library |
| Auth | Clerk | Sessions and sign-in without custom auth code |
| Backend | Convex (database, file storage, realtime queries) | Reactive UI with no API layer to maintain |
| Image ML | `@imgly/background-removal` in the browser | Free at any scale; photos never go to a third party |
| AI | Groq streaming (Llama); Gemini supported; provider-agnostic wrapper | Free tier, swappable, streamed over SSE |
| Tests | `node:test` + `tsx` (engine, AI streaming), `vitest` + `convex-test` (backend security) | 23 automated tests |

**Security notes.** Every Convex function resolves the signed-in user and scopes data to them; tests prove
one user cannot read, edit or delete another user's items or outfits. Inputs are validated server-side.
The AI route requires a session, trims untrusted text, and rate-limits per user.

## Run it locally

See `SETUP-GUIDE.md` for a step-by-step walkthrough (Clerk, Convex, free Groq key). In short:

```bash
npm install
npx convex dev      # terminal 1
npm run dev         # terminal 2 -> http://localhost:3000
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npx convex dev` | Sync backend functions and schema |
| `npm test` | Engine + AI unit tests |
| `npm run test:backend` | Backend tests (ownership, validation) |
| `npm run lint` / `npm run typecheck` | Static checks |
| `npm run build` | Production build |

## Honest limits

- The "try-on" is a flat dress-form collage, not a generated photo of the user. Realistic generated try-ons
  cost money per image, so they are intentionally out of scope for a free app.
- The free AI tier has rate limits set by the provider. If it is exhausted, the stylist engine keeps working.

## Credits

Inspired by Sonny Sangha's AI wardrobe tutorial. This is an independent implementation with its own code,
design and a free-first architecture.
