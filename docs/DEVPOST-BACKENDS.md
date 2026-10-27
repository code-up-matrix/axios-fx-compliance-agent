# Live backend verification — 27 October 2026

Seven separate Neon Postgres projects are connected to the seven Vercel production deployments. All **154 live assertions passed** against real HTTPS endpoints and real database storage. Inputs and fixtures were synthetic. No sponsor API success, entrant eligibility, video, registration or final submission is implied.

The existing Neon account is on its Free plan. Each new project is in `aws-eu-central-1` with 0.25 CU compute and the plan's default idle suspension policy; the provider rejected a custom suspension interval, so it was left at the account default. No paid upgrade was made. The existing `HG` project was not modified.

## Verified flows

| Product | Passed assertions | Live result | Remaining event blocker |
| --- | ---: | --- | --- |
| FieldBrief | 16 | Session, database history, expiry cleanup and explicit missing-provider error | Nebius key, available NVIDIA model and real inference |
| CultureRoute | 16 | Session, database history, expiry cleanup and explicit missing-provider error | Qloo event key and real Qloo/Eve agent run |
| CrowdQuest | 19 | Session, database history, expiry cleanup and operator-only round authorization | Twitch broadcaster, OAuth grants, EventSub and live votes |
| FitReceipt | 16 | Session, database history, expiry cleanup and explicit missing-provider error | YouCam key and real consent/upload/try-on |
| ReLoop | 31 | Listing, concurrent claims, donor-only one-time confirmation and private claim views | Student eligibility hold |
| LessonScript | 28 | Exact compilation, save/read, cross-user isolation and own-record deletion | Event eligibility conflict |
| RhythmWeave | 28 | Deterministic artwork, save/read, cross-user isolation and own-record deletion | Event eligibility conflict |

Every app rejected anonymous history access, invalid access codes, foreign-origin mutations and unauthenticated cleanup. Successful sign-in issued a Secure, HttpOnly, SameSite=Strict cookie. Separate judge sign-ins received isolated empty histories. The authenticated cleanup endpoint removed newly inserted expired run, limiter and Twitch receipt fixtures. This tests the deployed handler; the next automatic daily scheduler invocation has not yet been observed.

LessonScript persisted the exact answers `29/24`, `15` and `-1/4`. RhythmWeave persisted its 25-step, 9-pulse, 8-ring recipe and generated SVG. In both apps, another judge could neither see nor delete the saved record; its owner could delete it.

ReLoop offered two synthetic units to three simultaneous one-unit claims. Exactly two requests succeeded and one returned 409. Self-claims, claimant confirmation and repeated donor confirmation were rejected. Exhausted stock disappeared from available listings. The synthetic handover records belong to temporary judge workspaces, contain no personal data and do not represent real material transfers.

## Database setup and permissions

The two source migrations, `db/001_core.sql` and `db/002-portfolio.sql`, were first applied on an isolated FieldBrief validation branch, then applied transactionally to each empty production database. All eight expected tables exist in each database. Shared empty product tables support the common cleanup route. No existing database was reset.

Applications connect through pooled TLS endpoints as `app_service`. Catalog checks confirmed no superuser, database creation, role creation, replication, RLS bypass or inherited role membership, and no ability to create objects in `public`. The role has SELECT/INSERT/UPDATE/DELETE on the application tables. Its URL is stored only as a sensitive production environment variable in the matching Vercel project.

Migration administration uses the separate `app_owner` role and a **direct, non-pooled** connection. For future migrations, supply that owner connection as the local migration command's `DATABASE_URL`; never change the deployed application to use the owner credential. The initial API-created, unused `app_runtime` role in FieldBrief is not used by any application; its credentials were never deployed. `app_service` was created through SQL so it has no inherited `neon_superuser` membership.

Identifiers and permission checks are in [neon-databases.json](../deploy/neon-databases.json). Exact tested deployments and source commits are in [vercel-deployments.json](../deploy/vercel-deployments.json). Machine-readable assertion results are in [live-backend-checks.json](../deploy/live-backend-checks.json); the repeatable runner is [verify-live-backends.py](../scripts/verify-live-backends.py). Supply private access-code files outside the repository. The runner refuses redirects and sends credentials only to the seven fixed project origins.

## Practical limits

Browser rendering and local worksheet/artwork interaction were checked separately in the earlier hosting record. This run verifies authenticated API and storage paths; authenticated browser form submission was not exercised. The missing sponsor keys are reported as 503 errors without mock results. A configuration endpoint reporting no missing variables still does not prove a sponsor call.

These are controlled hackathon workspaces. Operator sign-ins share one workspace; each judge sign-in has a fresh identity and an eight-hour cookie. Saved run records expire after 24 hours. Before a general consumer launch, complete account recovery and stronger tenant identity, budgets, backup restoration, service ownership and retention for handovers/game records. Required videos, truthful eligibility declarations and final Devpost submissions remain pending.
