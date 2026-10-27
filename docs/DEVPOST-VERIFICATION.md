# Verification record — 27 October 2026

## Published repositories

Eight separate public repositories were created under `code-up-matrix` and populated from the independently checked source archives. All eight `main` heads, Git tree identifiers and complete file lists were read back through GitHub and matched the publication records: 343 files in total. [Repository links and remaining requirements](DEVPOST-REPOSITORIES.md) and [exact commit/tree records](../deploy/published-repositories.json) are available. The initial publication changed repository/status documentation only. A later CultureRoute health-check fix now uses the official Vercel OIDC helper and passed its TypeScript check, five tests, Eve build and Next build. No deployment or submission is implied by publication.

## Independent project verification

The [independent repository packages](../releases/repository-seeds/README.md) have each been checked separately: FieldBrief 8 tests, CultureRoute 5, CrowdQuest 10, FitReceipt 8, ReLoop 6, LessonScript 9 and RhythmWeave 6. Every package passes TypeScript and its production build; CultureRoute also passes the Eve build. This is 52 test executions including repeated shared checks, not 52 distinct tests. The CrowdQuest root page was corrected to use a Next.js page wrapper before the final successful check. Check logs and export-time status are inside each archive.

The extraction generator keeps only the product's local dependency closure and required application routes, adds its own root homepage and configuration, and includes a full event-specific submission draft. Each archive excludes local secrets, dependencies and build outputs. HandoverShelf is packaged separately with its already-validated native Skill, PDF and initial ZIP. No new remote repositories or submissions were created by this packaging step.

## Shared portfolio verification

`npm run check` passed: TypeScript, **33 tests in five files**, Eve production build and Next.js production build. Next generated 37 pages/routes in its static generation pass. The official Qloo package is imported by its documented exec entry point; its real workflow help command runs in the packaging test without an API key. Eve's build completed at approximately 20 MB after including the harness.

## What was exercised

- FieldBrief citation-ID validation, duplicate-ID rejection, exact Nebius request/model selection and failure when the configured NVIDIA model is absent. Provider replies in these tests are stubs.
- Twitch HMAC verification against the raw body, tampering, stale/invalid timestamps and strict vote commands.
- Actual PostgreSQL semantics using PGlite: atomic ReLoop quantity reservations under contention; donor-only and one-time confirmation; rejected cross-origin mutation; Twitch challenge, delivery deduplication, first-vote deduplication and hidden answers until closure.
- Record ownership, inability to delete another workspace's record, expiry filtering, authenticated cleanup and preservation of unexpired records against the same PostgreSQL engine.
- YouCam upload ownership tokens, allowed provider hosts, no API credential in the browser response and the cloth-v4 request schema. Provider calls in these tests are stubs.
- LessonScript exact rational arithmetic, precedence, unary minus, division by zero, source-line errors, rejection of JavaScript and execution bounds.
- RhythmWeave pulse counts throughout the allowed range, deterministic SVG and absence of script content.
- The previous PayProof price, approval, ownership, capture and webhook-related tests remain passing.

The React review checked stable keys, effect cleanup, labeled inputs, visible errors, disabled submission while pending, no provider secrets in client components and deterministic rendering. Selected desktop browser interactions were subsequently observed as recorded in DEVPOST-HOSTING.md. Mobile and authenticated browser submission remain unverified.

## Native package and catalog

- UGREEN official starter checker 0.7.3 / catalog 2.0.0: `static-pass`, **zero errors and zero warnings**. The unchanged result is included at `native/handovershelf/verification/static-check.json`.
- The initial ZIP contains exactly `SKILL.md` and `references/acceptance.md`; no executables, binaries or separate manifest are inside it. ZIP size: 2,880 bytes.
- Proposal: 346 words across the ten substantive responses, two visually inspected A4 pages, 47,120 bytes (below 1 MB). No participant signature or accepted declaration is fabricated. Editable source is `scripts/build-handover-proposal.py`; hashes are in `native/handovershelf/releases/manifest.json`.
- Catalog: **52 distinct event plans**, required fields checked, rules sources labeled independently of directory-only observations. OpenCV expired during research, reducing the open-directory count to 51. This snapshot does not include future additions or undiscoverable private events.

## Still unverified

Live Nebius/Qloo/YouCam calls, actual Twitch OAuth/subscription/votes, real Eve agent execution, the automatic daily cron invocation, backup restoration, NAS installation/runtime, required videos and final submissions. Neon provisioning/migrations, deployed ownership controls and authenticated cleanup are now verified with 154 passing live assertions in [DEVPOST-BACKENDS.md](DEVPOST-BACKENDS.md). Hosting, health endpoints and selected browser interactions are verified in [DEVPOST-HOSTING.md](DEVPOST-HOSTING.md).

The local Eve build emitted a warning that no Docker/Vercel sandbox provider was available. Default tools are disabled and the authored integrations do not depend on that local sandbox; nevertheless, a completed build is not runtime proof. No fake runtime success was used to clear a gate.

Vercel and Neon account connections are active. Seven dedicated databases and production deployments are verified. Required sponsor credentials and final event acceptance remain pending.
