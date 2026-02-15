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
