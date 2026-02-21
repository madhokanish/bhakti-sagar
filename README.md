# Bhakti Chat

Bhakti Chat is a Next.js + Prisma devotional platform with Bhakti Chat chat guides.

## Local setup

1. Install dependencies

```bash
npm install
```

2. Copy environment template

```bash
cp .env.example .env.local
```

3. Generate Prisma client + apply migrations

```bash
npm run prisma:generate
npx prisma migrate dev
```

4. Run app

```bash
npm run dev
```

## Auth architecture

The app uses **Auth.js (NextAuth v5)** with:

- Prisma adapter
- **Database sessions** (not JWT)
- Providers: **Google**, **Apple**, **Email magic link**
- Resend for magic link delivery in production
- Console magic-link fallback in local dev when `RESEND_API_KEY` is missing

### Important routes

- `/api/auth/[...nextauth]` Auth.js handler
- `/?auth=1&callbackUrl=/path` opens the auth modal from any page
- `/signin` thin compatibility route that redirects to modal flow
- `/profile` protected profile page

### Environment variables (auth)

Required:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APPLE_CLIENT_ID`
- `APPLE_TEAM_ID`
- `APPLE_KEY_ID`
- `APPLE_PRIVATE_KEY`

Recommended:

- `NEXTAUTH_URL` (production canonical URL)

Optional:

- `VERCEL_URL` (Auth.js derives URL when `NEXTAUTH_URL` is unset)
- `APPLE_CLIENT_SECRET` (manual override for generated Apple client secret)
- `RESEND_API_KEY` (required for production email sending)
- `EMAIL_FROM` (default sender)
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (durable magic-link rate limiting)

Generate a strong auth secret:

```bash
openssl rand -base64 32
```

### Magic-link behavior

- Email provider id is `email`
- Subject: `Sign in to Bhakti Chat`
- Cooldown + limits enforced server-side:
  - max 5 sends/hour per email
  - max 10 sends/hour per IP
  - 30 second resend cooldown
- Responses are privacy-safe and do not reveal account existence

## Vercel notes

- Set all auth env vars in Vercel Project Settings.
- For preview deployments, if `NEXTAUTH_URL` is unset, runtime derives `https://$VERCEL_URL`.
- Apple callbacks require a real HTTPS domain configured in Apple Developer settings.

## Bhakti Chat chat

- `/bhaktigpt/chat` guide chat experience
- `/api/bhaktigpt/chat` streaming assistant endpoint
- Anonymous free usage threshold is handled server-side; sign-in unlocks continuity.

## Scripts

- `npm run dev` start local dev server
- `npm run build` production build
- `npm run lint` lint
- `npm run test` tests
- `npm run prisma:generate` regenerate Prisma client
