# fitcheck.lite: Complete Setup (start to deployed)

Everything here is free. Follow the steps in order and tick each box. Time: about 45 minutes.

Commands go in a terminal, one line at a time, then Enter. This guide assumes Windows with **Git Bash**
(the terminal you already used). On Mac, use Terminal; the commands are the same.

---

## STEP 0: Check your tools

```
node -v
node -p "process.arch"
npm -v
git --version
```

- [ ] `node -v` is **v20.9 or higher** (v22 or v24 is best).
- [ ] `process.arch` prints **x64**. If it prints `ia32`, you installed 32-bit Node. Uninstall it and install the 64-bit LTS from https://nodejs.org. (This was behind your earlier "not a valid Win32 application" error.)
- [ ] `npm` and `git` print version numbers.

---

## STEP 1: Put the project in a safe place

1. Delete your old `fitcheck-lite` folder (you are starting clean).
2. Unzip `fitcheck-lite.zip` to a **short path with no OneDrive**: `C:\dev` is ideal. Create it if needed.
3. You should have `C:\dev\fitcheck-lite\package.json`.
4. In the terminal:

```
cd /c/dev/fitcheck-lite
```

(In PowerShell: `cd C:\dev\fitcheck-lite`)

- [ ] `ls` shows `package.json`, `src`, `convex`.

---

## STEP 2: Install packages

```
npm install
```

Wait until it finishes (2 to 5 minutes). Warnings are normal. Do **not** close the terminal. Then verify the install is healthy:

```
ls node_modules/@clerk/shared/dist/keys.mjs
node -e "require('@next/swc-win32-x64-msvc'); console.log('swc OK')"
```

- [ ] The first prints a path, the second prints `swc OK`.

If either fails: `rm -rf node_modules .next`, then `npm cache clean --force`, then `npm install` again.

---

## STEP 3: Create your settings file

Copy `.env.example` to a new file named `.env.local`:

```
cp .env.example .env.local
```

Open it in VS Code (`code .`). You will fill it in during the next steps. Never share it or upload it.

---

## STEP 4: Clerk (login)

1. https://dashboard.clerk.com, sign up, **Create application**, name it `fitcheck lite`, enable **Email** and/or **Google**.
2. Copy the two keys from **API keys** into `.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

3. **Connect Clerk to Convex:** in the Clerk dashboard open **Integrations** (may be under Configure or Developers), find **Convex**, click **Activate**.
   Fallback if you can't find it: **Configure, JWT templates, New template, Convex, Save**.
4. Copy your **Frontend API URL** (looks like `https://something-12.clerk.accounts.dev`) into a notepad.

- [ ] Both keys are in `.env.local`. I have my Frontend API URL.

---

## STEP 5: Convex (database)

```
npx convex dev
```

Log in in the browser, choose **create a new project** named `fitcheck-lite`. If it asks about Convex AI files / agent skills, either answer is fine. It writes `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` into `.env.local`.

**Leave this terminal running.** It will complain about `CLERK_JWT_ISSUER_DOMAIN`. Fix it:

1. https://dashboard.convex.dev, open your project, **Development** deployment.
2. **Settings, Environment Variables, Add**: name `CLERK_JWT_ISSUER_DOMAIN`, value = your Clerk Frontend API URL (no slash at the end). Save.
3. The terminal should print **Convex functions ready** with no red errors.

- [ ] Convex terminal is running and ready.

---

## STEP 6: Free AI key (2 minutes)

1. https://console.groq.com/keys, sign up (no card), **Create API Key**, copy it.
2. Add to `.env.local`:

```
GROQ_API_KEY=your_key_here
```

Nothing is truly unlimited for free. Groq's free plan currently allows thousands of questions per day, shared across all users of your app. If the limit is hit, the chat tells the user, and the built-in stylist keeps working. Check current limits at console.groq.com/settings/limits.

---

## STEP 7: Run the app

Open a **second** terminal in the same folder:

```
npm run dev
```

(This uses webpack mode, which works on your PC. The first page load takes 20 to 60 seconds. That is normal.)

Open http://localhost:3000.

---

## STEP 8: Test checklist

- [ ] Landing page loads. Drag the temperature slider in the demo; the looks change. Click the moon/sun icon: theme switches.
- [ ] Sign up, land on **Wardrobe** (empty).
- [ ] **Add clothes**: pick a photo of one garment (JPG/PNG/WebP, not HEIC). First photo downloads a small AI model (1 to 3 minutes, needs internet). Check name and category, **Save to wardrobe**.
- [ ] Add at least a top, a bottom, and shoes.
- [ ] **Outfits, New outfit**: choose pieces; they appear on the dress form. Save it.
- [ ] Press **Ctrl+K**: the command palette opens. Try "Go to Wardrobe".
- [ ] Click **Ask stylist**: a panel opens beside the page. Slide the temperature. Type a question; the answer streams in.
- [ ] **Outfits, I wore this today**; wear counts rise in Wardrobe.

---

## STEP 9: Put it on GitHub

1. Create a new **empty** repo on github.com named `fitcheck-lite` (no README).
2. In the project folder:

```
git init
git add .
git commit -m "fitcheck.lite"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/fitcheck-lite.git
git push -u origin main
```

`.env.local` is ignored by git, so your keys are not uploaded. Add 3 screenshots to `README.md`.

---

## STEP 10: Deploy (Vercel + Convex production)

1. Deploy the database: stop `npx convex dev` (Ctrl+C), then

```
npx convex deploy
```

2. In the Convex dashboard, switch to the **Production** deployment and add `CLERK_JWT_ISSUER_DOMAIN` there too (same value). Copy the production **Deployment URL** (ends in `.convex.cloud`).
3. https://vercel.com, **Add New, Project**, import your GitHub repo, and add these **Environment Variables**:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | your pk_test key |
| `CLERK_SECRET_KEY` | your sk_test key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/wardrobe` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/wardrobe` |
| `NEXT_PUBLIC_CONVEX_URL` | the **production** Convex URL |
| `GROQ_API_KEY` | your Groq key |

4. Click **Deploy**. Open the link, sign up, add a piece, and run the checklist again.

Clerk **development** keys work on a Vercel link (Clerk shows a small "development mode" note). A production Clerk instance needs your own domain, which costs money, so it is optional for a portfolio.

- [ ] Live link works. Put it in `README.md` and in `LINKEDIN-UPWORK.md`.

---

## Every time you come back

Two terminals in `C:\dev\fitcheck-lite`: `npx convex dev` and `npm run dev`.

## Troubleshooting

| What you see | Fix |
|---|---|
| `not a valid Win32 application` or `Module not found: @clerk/shared/...` | Broken install. `rm -rf node_modules .next`, `npm cache clean --force`, `npm install`, then redo the checks in Step 2. Confirm `process.arch` is `x64`. |
| `Turbopack is not supported on this platform` | Use `npm run dev` (it already includes `--webpack`). |
| "NEXT_PUBLIC_CONVEX_URL is missing" | Run `npx convex dev`, confirm `.env.local` has the URL, restart `npm run dev`. |
| Wardrobe stuck on "Loading…" or "Not signed in" | Clerk-Convex link wrong. Re-check Step 4 (integration activated) and Step 5 (issuer value equals your Frontend API URL exactly). Refresh. |
| Chat says "AI chat isn't set up" | Add `GROQ_API_KEY` to `.env.local` and restart `npm run dev` (on Vercel: add it and redeploy). |
| Chat says "limit reached" | Wait a minute. The built-in stylist still works. |
| Background removal never finishes | Untick "Remove background" and add the photo anyway, or check your internet. |
| "This image type is not supported" | Phone HEIC photo. Use JPG or PNG. |

If you are stuck, send me the step number and the exact red error text.
