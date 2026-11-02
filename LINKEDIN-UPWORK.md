# Portfolio copy (edit the [brackets] before posting)

## LinkedIn post

I just shipped fitcheck.lite: a free digital wardrobe that helps you wear more of what you already own.

What it does
→ Drop a photo of a garment: the background is removed in the browser (on-device ML, so no per-image cost)
→ Compose outfits on a dress form and track how often each piece is worn
→ A ranking engine scores every outfit on formality, temperature and colour harmony
→ A streaming AI stylist (Groq / Llama) answers questions grounded in your wardrobe

What I focused on
• Next.js 16 + React 19 + TypeScript, Tailwind 4 design tokens, light/dark theme, ⌘K command palette
• Convex backend with ownership checks on every function, covered by automated tests
• Provider-agnostic AI wrapper with SSE streaming, server-side keys and rate limiting
• Everything runs on free tiers, by design

One decision I'm proud of: realistic AI try-on images cost money per render, so I built a deterministic
styling engine that works at zero cost and made AI an optional layer on top.

Live: [link]   Code: [GitHub link]
You can try the styling engine on the landing page without signing in.

#nextjs #react #typescript #webdev #buildinpublic

## Upwork portfolio item

**Title:** fitcheck.lite: full-stack wardrobe app with an AI stylist

**Description:** A web app I designed and built end to end: authentication, a real-time database with file
storage, in-browser image processing, a tested recommendation engine, and a streaming AI chat. Responsive,
themeable and accessible. Deployed on Vercel with a Convex backend.

**Skills:** Next.js, React, TypeScript, Tailwind CSS, Convex, Clerk, SSE streaming, LLM integration, testing

## CV / resume bullets
- Built and deployed a full-stack wardrobe app (Next.js 16, React 19, TypeScript, Convex, Clerk) with 23 automated tests.
- Designed a deterministic outfit-ranking engine (formality, season, colour harmony) and an SSE-streaming LLM chat with server-side keys and per-user rate limiting.
- Implemented on-device background removal, so image processing costs nothing at any scale.
