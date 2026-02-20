# Bhakti Sagar

A calm, devotional site for aartis and bhajans. Built with Next.js + Tailwind.

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Add environment variables

```bash
cp .env.example .env.local
```

3. Run the dev server

```bash
npm run dev
```

## Environment Variables

See `.env.example` for required values. Set `OPENAI_MODEL` to the model you want to use.

### Authentication (Google and Apple)

This project uses NextAuth (Auth.js) + Prisma adapter for OAuth sign-in.

Required variables:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APPLE_ID`
- `APPLE_TEAM_ID`
- `APPLE_PRIVATE_KEY`
- `APPLE_KEY_ID`
- `APPLE_CLIENT_SECRET` (optional override if you pre-generate Apple JWT secret)

Setup notes:

1. Copy env template: `cp .env.example .env.local`
2. Fill OAuth credentials in `.env.local`
3. Generate Prisma client: `npm run prisma:generate`
4. Apply schema to DB (dev): `npm run prisma:push`
5. Start app: `npm run dev`

Apple local-dev note:

- Apple Sign In does not support plain localhost callback URLs.
- For local testing, use a secure tunnel (for example `ngrok`) and set that URL in Apple + `NEXTAUTH_URL`.

Routes:

- `/signin` OAuth entry page
- `/account` user account page (protected)
- `/api/auth/[...nextauth]` NextAuth route handler

Testing checklist:

- Google login works and returns to `/account`
- Apple login works and returns to `/account`
- First login creates `User` + `UserProfile`
- Re-login does not create duplicate `UserProfile`
- Session persists after refresh
- Sign out works from `/account`
- `/account` redirects to `/signin` when logged out
- Existing public pages still load

### Online Puja Email Service Setup

The `/api/online-puja-interest` endpoint sends form submissions via SMTP using `nodemailer`.

Required SMTP variables:

- `SMTP_HOST`
- `SMTP_PORT` (usually `587` for TLS or `465` for SSL)
- `SMTP_USER`
- `SMTP_PASS`

Optional:

- `SMTP_FROM` (defaults to `SMTP_USER`)
- `ONLINE_PUJA_RECIPIENT_EMAIL` (defaults to `SMTP_USER`)

Local setup:

```bash
cp .env.example .env.local
# Then fill SMTP_* values in .env.local
```

Vercel production setup:

```bash
vercel env add SMTP_HOST production
vercel env add SMTP_PORT production
vercel env add SMTP_USER production
vercel env add SMTP_PASS production
vercel env add SMTP_FROM production
vercel env add ONLINE_PUJA_RECIPIENT_EMAIL production
```

After setting env vars, redeploy:

```bash
vercel --prod
```

If SMTP is missing, the API now returns which env keys are missing.

## Content

Aartis and categories live in `src/data/aartis.json` and `src/data/categories.json`.
Replace the placeholder `youtubeUrl` values with real URLs to enable embeds.
