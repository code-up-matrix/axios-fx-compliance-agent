> **Devpost portfolio branch — 27 October 2026**
> Start at `/lab` for seven new product modules, `/lab/catalog` for the event/idea matrix and `/lab/history` for saved work. Source is prepared; live deployment and sponsor verification are pending.
>
> Read [the Devpost catalog](docs/DEVPOST-CATALOG.md), [deployment and blockers](docs/DEVPOST-DEPLOYMENT.md), [demo plans](docs/DEVPOST-DEMO-PLANS.md), and [verification](docs/DEVPOST-VERIFICATION.md). [HandoverShelf](native/handovershelf/README.md) includes the UGREEN native package and proposal. This branch also retains the existing PayProof application below.

# AXIOS PayProof

An AI purchase planner that keeps exact prices, explicit human approval and PayPal verification in the same workflow.

**Target:** PayPal AI Hackathon.

**Status:** implemented and locally tested. Vercel team authorization and live backend/provider setup remain required. No production deployment or competition submission is claimed.

Repository: https://github.com/code-up-matrix/axios-fx-compliance-agent

## Run and verify

Requires Node 24. Install with `npm ci`, then run `npm run check`. These checks do not require live credentials. See `.env.example` for configuration names.

Before connected development, link the correct Vercel project, attach its database and pull its environment. Run `npm run db:migrate`, then `npm run dev`. Open the workspace and use `/access` for connected operations. Public sample behavior is explicitly labeled.

## Product and integration

The connected planner selects a digital demonstration service from a fixed catalog using structured AI output. Server code computes prices in integer cents and signs an expiring quote. Checkout requires a human click, records an idempotent order in Postgres, and redirects to PayPal sandbox. The return page asks for explicit capture, then verifies amount, currency, owner and completion. Signature-verified webhooks retain an event audit and flag refunds for review. No real goods are delivered by this demonstration.

Create a PayPal sandbox REST app and separate sandbox buyer/business accounts. Register `/api/webhooks/paypal` for capture completed, refunded and reversed events and set its webhook ID. Never put live PayPal credentials into this application: its provider endpoint is intentionally sandbox-only.

Live proof still needed: successful AI request, signed quote, buyer approval, matching completed capture, webhook delivery/replay, database ownership check and demo video. Mocked HTTP tests establish adapter behavior, not provider acceptance. The existing title-only repository was repurposed for this new application; it does not implement FX compliance.

## Evidence and handoff

- [Deployment and operations](docs/DEPLOYMENT.md)
- [Hackathon fit and submission checklist](docs/HACKATHON.md)
- [Demo recording script](docs/DEMO.md)
- [Research and event links](docs/RESEARCH.md)
- [Verification record](docs/VERIFICATION.md)

New application code is MIT licensed. AI-assisted implementation with Codex is disclosed. Third-party dependencies remain under their own licenses. Review and understand the code before submission; eligibility and awards are the organizer's decision.
