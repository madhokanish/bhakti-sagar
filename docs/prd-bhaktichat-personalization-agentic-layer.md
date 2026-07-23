# PRD: BhaktiChat Personalization & Agentic Access Layer

**Status:** Draft v1
**Owner:** Anish Madhok
**Date:** July 20, 2026
**Related surfaces:** Web (Next.js), iOS, Android — shared backend

---

## 1. Why

### The problem

BhaktiChat currently treats every user identically at the point of highest leverage: guide selection. A user opens the app, sees the same five-guide grid (Krishna, Shiv, Hanuman, Shani, Lakshmi) every time, and has to self-diagnose which guide fits what they're going through right now. We already capture the raw material to do better — every conversation is stored (`BhaktiGptConversation` / `BhaktiGptMessage`) — but nothing downstream of that storage does anything with it. A user who has opened three conversations about money anxiety this month gets the exact same homepage as someone opening the app for the first time.

This is the same gap Amex's platform team is solving for card members: the company already has the data to know a customer landed in Lisbon and books upscale hotels, but nothing connects that insight to what the customer actually sees. Here, we already know a user keeps circling back to fear and financial stress — nothing connects that to what they see.

### Why now

- **Retention risk is invisible today.** We have no signal for "this user is drifting" beyond raw session counts. A user who found real value from Shani during a hard month, then stopped coming back, looks identical in our data to a user who never needed the app.
- **Guide selection is a cold start every time.** New and returning users face the same undifferentiated grid. There's no compounding value from having used the app before.
- **This is the highest-leverage place to practice the exact skill this role requires** — turning stored interaction data into a structured profile, then exposing that profile as a service multiple surfaces (and eventually agents) can consume, rather than hardcoding personalization into one screen.

### The opportunity, stated simply

If BhaktiChat can tell that a user is in a stuck, anxious, or fear-driven phase — from what they've actually said, not from a form they filled out — it can meet them there: surface the right guide first, nudge them back with something specific to what they were working through, and eventually let their own AI assistant check in on their behalf. Right now none of that is possible because the "insight" a conversation contains dies the moment the conversation ends.

---

## 2. What

A three-layer system, mirroring how Amex's own platform team structures this problem (foundation data → structured profile → shared access layer):

1. **Signal extraction** — a lightweight classification pass that turns each conversation into structured, storable insight (life domain, emotional register, engagement depth) instead of leaving it as opaque chat text.
2. **A user-level spiritual profile** — an aggregated, recency-weighted view of what a user has been working through, built from accumulated signal, not a single conversation.
3. **A shared personalization service** — one internal API that the guide-selection screen, a future re-engagement nudge, and (later) an agent-facing tool all call, instead of three separate one-off implementations.

We are explicitly **not** building a new chat feature, a new guide, or a diagnostic/astrology feature. This PRD is about making the data we already generate actually useful.

---

## 3. Who

**Primary user:** an existing BhaktiChat user with at least one completed conversation. They benefit from faster, more relevant guide selection and a reason to come back.

**Secondary user (internal):** future BhaktiChat features — a re-engagement notification system, a "check in on me" proactive flow, or a personal-assistant-facing MCP tool — all become consumers of this same profile service instead of needing their own logic.

**Explicitly out of scope for v1:** anonymous/pre-signup users. Profile-building requires a persistent `userId`, so this only applies post sign-in (per the existing Auth.js flow).

---

## 4. Goals & success metrics

| Goal | Metric | How measured |
|---|---|---|
| Guide selection feels relevant, not generic | % of sessions where the user engages with the recommended/highlighted guide vs. overrides it and manually picks another | New event logging on the guide-grid interaction |
| Increase return engagement | 7-day and 30-day return rate for users with a profile vs. users without (once profiles exist for >50% of active users, compare cohorts) | Existing session data + new profile flag |
| Recommendation quality improves over time | Recommendation override rate trending down release over release | Same event as above, tracked longitudinally |
| Foundation is reusable, not single-purpose | At least one additional consumer (e.g., re-engagement nudge) built on the same profile service within 60 days of v1 ship, without duplicating extraction logic | Engineering — is a second caller added to the service, or is logic copy-pasted? |

**Guardrail metric (the one that matters most):** override rate. If users are consistently dismissing or ignoring what's surfaced, the profile is wrong or the surfacing is wrong — this is the signal to go deeper into re-segmenting rather than declaring success on engagement lift alone.

---

## 5. Non-goals (v1)

- No user-facing display of "here's what we think you're going through" as a literal readout — this must be inferred and applied to *surfacing*, not shown back as a diagnosis. (See Section 8, Guardrails — this is a trust and safety line, not a nice-to-have.)
- No cross-guide conversation merging or memory *within* a single chat (that's a separate, larger feature).
- No external MCP/agent exposure in v1 — that is explicitly Phase 3 and depends on v1/v2 proving the profile is accurate first.
- No changes to the underlying guide personas or system prompts.
- No anonymous-user personalization.

---

## 6. User stories

- As a returning user who's talked to Lakshmi three times this month about money stress, when I open the app, I want to see Lakshmi surfaced first (not buried in a flat grid), so I don't have to re-decide who to talk to every time.
- As a user who talked to Shani about staying disciplined and then went quiet for 10 days, I want a specific, non-generic nudge back ("pick up where you left off on staying steady") rather than a generic "come back!" push notification.
- As a user who's never used the app before, I want the experience to be unaffected by this system — I should see the same clean, unbiased grid until I have enough history to personalize from.
- As the BhaktiChat team, we want the personalization logic to live in one place, so that the next feature that wants "what is this user going through" doesn't have to rebuild extraction and scoring from scratch.

---

## 7. Requirements, by layer

### 7.1 Signal extraction layer

- On conversation completion (or after N user turns, whichever comes first), run a single structured-output classification call against the conversation transcript.
- Output must be **strictly structured** (fixed enum fields), not freeform text — this is a hard requirement, not a preference. Fields:
  - `lifeDomain`: one of `money | relationships | career | health | fear_anxiety | discipline_procrastination | grief | decision_paralysis | general`
  - `emotionalRegister`: one of `anxious | stuck | seeking_courage | seeking_calm | grateful | neutral`
  - `guideFit`: was the guide the user chose actually a good fit for the domain detected, or is there a mismatch worth learning from?
- Store as a new `ConversationInsight` record, one per conversation, linked 1:1 to `BhaktiGptConversation`.
- Classification model choice: cheap/fast model is sufficient — this is a labeling task, not a generative one. Model choice should go through the same kind of eval Amex platform teams run before defaulting to the more expensive option (see Section 9).
- Failure mode: if classification fails or times out, the conversation is simply left unlabeled. Never block the chat experience on this running synchronously.

### 7.2 Profile layer

- New `UserSpiritualProfile` record, one per user, updated asynchronously whenever a new `ConversationInsight` is written.
- Recency-weighted scoring per `lifeDomain` — a domain mentioned yesterday should outweigh the same domain mentioned four months ago. Exact decay function is an engineering decision, not a product one, but the requirement is: **older signal fades, it doesn't disappear or stay equally weighted forever.**
- Profile surfaces: top 1–2 current life domains, best-fit guide (which may differ from most-used guide), and a simple "engagement state" (active / cooling / dormant) based on recency of last session.
- Profile must be computable/backfillable for existing users from historical conversation data, not just net-new going forward — otherwise we're re-cold-starting our entire existing user base.

### 7.3 Shared personalization service

- One internal service/endpoint (e.g., `getRecommendation(userId)`) that returns: recommended guide, one-line reason context (used internally, not shown verbatim to the user as a "diagnosis"), and engagement-state flag.
- **This must not be built as logic embedded directly in the guide-grid component.** The requirement is a reusable service with one caller in v1 (the guide grid) but designed for a second caller (re-engagement) in v2 without rework. This is the actual point of the exercise — building the integration pattern once.
- New users / users below a minimum signal threshold (e.g., fewer than 2 classified conversations) get the existing flat grid, unchanged. No personalization on insufficient data — this is a hard gate, not a soft preference.

---

## 8. Guardrails & safety (read this section twice — it matters more here than in a typical product)

This app deals with users' fear, grief, and money anxiety. The bar for restraint here should be at least as high as the one your own past NLP-policy-layer example set at Arrive (structured output only, no unrequested assumptions, human-reviewable), and arguably higher given the emotional subject matter:

- Never surface an explicit "we think you are anxious/stuck/grieving" label back to the user. Inference informs *what* gets surfaced (which guide, which nudge copy), never a stated diagnosis.
- No proactive notification should reference specific painful content back to the user in a way that could feel surveilled (e.g., never "we noticed you're worried about money" — instead, a guide-native, warm nudge in Lakshmi's own voice).
- Classification errors should fail toward the neutral, unpersonalized default (the flat grid), not toward a wrong or upsetting guess.
- No profile data leaves the personalization service in raw form — consumers get a recommendation + minimal context, not the full classified history.

---

## 9. Evaluation approach (pre-launch)

Mirrors the eval structure used for narrow-scope classification layers elsewhere: a manual check set (hand-label ~50–100 real historical conversations against the four `lifeDomain`/`emotionalRegister` categories and compare to model output), an automated check (does the output conform to the fixed schema, every time, no exceptions), and a live guardrail metric post-launch (override rate, tracked weekly for the first month).

---

## 10. Rollout plan

- **Phase 1 (this PRD):** signal extraction + profile + guide-grid personalization only. Single consumer.
- **Phase 2:** re-engagement nudges as a second consumer of the same service — proves the "build once, reuse" thesis.
- **Phase 3 (explicitly future, not committed here):** agent-facing exposure — an MCP-style tool that lets an external or in-app agent query a user's profile to ground a proactive check-in. Depends on Phase 1/2 proving recommendation accuracy first.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Classification is inaccurate, personalization feels random or wrong | Manual eval set before launch; hard fallback to flat grid below signal threshold; override rate as an ongoing kill-switch signal |
| Feels invasive/surveilled given emotionally sensitive content | No literal diagnosis surfaced to user; guide-voice-native copy only; guardrails in Section 8 |
| Personalization logic gets embedded ad hoc in the UI instead of as a reusable service, defeating the point | Explicit architecture requirement in 7.3; code review checkpoint before merge |
| Cold-start for new/low-history users | Hard threshold gate — unpersonalized default until minimum signal exists |

---

## 12. Open questions

- What's the minimum number of classified conversations before we trust a profile enough to personalize (2? 3?) — needs a real threshold, not a guess, ideally validated against the eval set.
- Should `guideFit` mismatches (user picks Krishna for what's classified as a money question) ever surface as an in-app suggestion ("Lakshmi might also help with this"), or is that a v2 decision?
- Where does classification run — synchronously after each conversation, or batched? Affects cost and latency but not the product requirements above.
- Do we need explicit user consent/disclosure that conversations inform personalization, beyond what's already covered by the existing privacy policy?
