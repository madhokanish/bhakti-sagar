# Divine Image QA Tickets

Date: 2026-03-27

## P0: Production Divine Image API route returns website 404 instead of JSON

- Owner: Web/backend deployment
- Affected path: `POST https://bhaktichat.com/api/bhaktigpt/divine-image`
- Repro:
  1. Send a POST request to the production route with JSON body:
     `{"mode":"PHOTO_WITH_GOD","prompt":"test divine image"}`
  2. Observe `HTTP/2 404`
  3. Response `Content-Type` is `text/html; charset=utf-8`
  4. Response headers include:
     - `x-matched-path: /_not-found`
     - `x-next-error-status: 404`
- Expected:
  - The route should return JSON from the API handler in `src/app/api/bhaktigpt/divine-image/route.ts`
- Actual:
  - Production serves the website 404 page instead of the API handler
- Evidence:
  - The route exists in repo at:
    - `/Users/anishmadhok/Documents/New project/src/app/api/bhaktigpt/divine-image/route.ts`
  - Direct production curl returns HTML 404, matching the iOS screenshot
- Suggested fix:
  - Verify the deployed Vercel project includes the current `src/app/api/bhaktigpt/divine-image/route.ts`
  - Confirm the correct root directory/project is deployed
  - Confirm Next.js app routing is not excluding `src/app/api/**`
  - Redeploy and verify the endpoint returns JSON

## P1: Add production smoke test for critical API routes

- Owner: Web/platform
- Problem:
  - The mobile clients rely on `/api/bhaktigpt/chat` and `/api/bhaktigpt/divine-image`
  - A missing deploy/regression can silently ship and only surface in mobile UI
- Suggested fix:
  - Add a post-deploy smoke test for:
    - `POST /api/bhaktigpt/chat`
    - `POST /api/bhaktigpt/divine-image`
  - Fail the release if either endpoint returns non-JSON or non-2xx/expected 4xx validation JSON

## P1: Keep API error responses consistently JSON

- Owner: Web/backend
- Problem:
  - When the route is missing, clients receive HTML instead of an API-shaped JSON error
  - This creates poor UX and makes debugging harder
- Suggested fix:
  - Ensure API routes always resolve under `/api/**`
  - Add middleware or hosting guardrails so API requests never fall through to the site 404 page

## P2: Divine Image iOS client should never show raw HTML in error UI

- Owner: iOS
- Problem:
  - The iOS result screen was showing the full HTML 404 page contents to the user
- Status:
  - Fixed locally in the current iOS workspace by sanitizing HTML server responses into a friendly error message
- Follow-up:
  - Keep this behavior in future refactors so infrastructure failures remain readable to users
