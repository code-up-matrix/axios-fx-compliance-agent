# Devpost portfolio: deployment and acceptance

This isolated branch preserves the existing PayProof app and adds seven distinct web products plus a UGREEN native Skill. It is a tested source implementation, not a claim of completed production deployment or accepted hackathon entries.

## Current external blockers

- GitHub access is resolved: Google sign-in and GitHub two-factor authentication succeeded, and [eight separate public repositories](DEVPOST-REPOSITORIES.md) were created under `code-up-matrix`. Their published `main` commits and complete file lists were verified. The combined source remains on `devpost/portfolio-2026` in `axios-fx-compliance-agent`.
- Vercel: team access is authorized. Seven dedicated projects are deployed and their latest builds report READY. [Live URLs and evidence](DEVPOST-HOSTING.md) distinguish hosting from unfinished backend setup.
- No database or sponsor credential has been provisioned for these new apps. Random signing/access/cron secrets and exact production origins are configured in Vercel. Local tests use synthetic inputs, stubbed provider replies and an actual in-memory PostgreSQL engine. They do not establish live sponsor connectivity.

## Deployable products

| Product | Route | Required integration in addition to shared configuration |
| --- | --- | --- |
| FieldBrief | `/lab/fieldbrief` | `NEBIUS_API_KEY`, exact available `NEBIUS_NVIDIA_MODEL` starting with `nvidia/` |
| CultureRoute | `/lab/cultureroute` and assistant `/s` | event-issued `QLOO_API_KEY`; AI Gateway authentication for Eve |
| CrowdQuest | `/lab/crowdquest` | `TWITCH_BROADCASTER_ID`, random `TWITCH_WEBHOOK_SECRET`, real EventSub subscription |
| FitReceipt | `/lab/fitreceipt` | `YOUCAM_API_KEY` with cloth-v4 access and quota |
| ReLoop | `/lab/reloop` | Postgres; student eligibility still unconfirmed |
| LessonScript | `/lab/lessonscript` | Postgres for saving; local compilation works without it; eligibility conflict |
| RhythmWeave | `/lab/rhythmweave` | Postgres for saving; local composition/export works without it; eligibility conflict |
| AXIOS PayProof | `/checkout` | existing PayPal sandbox variables and webhook |

Every app uses `DATABASE_URL`, `SESSION_SECRET`, `APP_ORIGIN`, `OPERATOR_ACCESS_CODE`, `JUDGE_ACCESS_CODE` for protected operations. Use random, independent values; the secret must be at least 32 characters and codes at least 12. `CRON_SECRET` must also be random and at least 32 characters. Never use a `NEXT_PUBLIC_` secret. Use separate databases and credentials for preview and production.

The portfolio source tree is also exported as [eight independent repository packages](../releases/repository-seeds/README.md), now published in [eight actual repositories](DEVPOST-REPOSITORIES.md). Each web project has a product homepage at `/`, the required API and its own environment template. `deploy/portfolio.json` records the repository URLs, verified commits and portfolio landing paths. Preserve the MIT license and original source provenance, and disclose reused scaffolding in each entry. Avoid deploying unrelated provider credentials to each project. The standalone projects have their own deployment instructions under `docs/DEPLOYMENT.md`; the sequence below describes the combined Eve portfolio.

## Provisioning sequence

1. The exact team grant and seven dedicated projects are in place. Use the project IDs in `deploy/vercel-deployments.json`. For further local setup, link the intended project. This Eve project requires `eve link --non-interactive --project <confirmed-name-or-id> --team team_64IDAvx3sgtTRCQpQavfF3cG`. Do not start a local dev server before linking and selecting its environment.
2. Install a dedicated Neon Postgres database through Vercel Marketplace, review the selected free/paid plan and region, and attach its URL to the correct project. Avoid paid upgrades without a chosen budget.
3. Set shared secrets and the product's provider values using the platform secret store. Pull the correct environment without printing secrets. Set `APP_ORIGIN` to the exact final HTTPS origin.
4. Run `npm ci`, `npm run check`, then `npm run db:migrate` against the selected empty project database. Migrations are additive/idempotent and never run during the build. Verify all three migration files were applied. Do not reset an existing database.
5. Deploy using `eve deploy --non-interactive --yes --project <confirmed-name-or-id>`. Capture the actual deployment ID, commit and URL. The official Qloo harness exec entry point is imported in-process, so Next and Eve can trace its runtime dependencies. It uses the same validated workflow as the CLI, with an allowlisted environment and no user shell commands.
6. Verify the browser → API → provider → database → browser result on the real deployment. Use synthetic/non-sensitive data and sandbox/test environments where available. Record provider response/transaction identifiers with secrets redacted.
7. Configure budget limits, error monitoring, backup/restore ownership, webhook delivery monitoring and the daily retention job. Confirm `/api/internal/cleanup` rejects requests without `Authorization: Bearer <CRON_SECRET>`.
8. Provide a separate judge code through private judging instructions, verify access remains available through each event's judging period, record the required demo, and complete entry declarations personally.

## Twitch setup

Register a Twitch application and complete the official OAuth grants before calling the subscription script. `channel.chat.message` v1 requires `user:read:chat`; with an app access token, the chatbot also needs `user:bot`, and the broadcaster must grant `channel:bot` or make the bot a moderator. Use Twitch's current documentation to confirm the actual grant state.

Set the script-only `TWITCH_CLIENT_ID`, `TWITCH_APP_ACCESS_TOKEN`, and `TWITCH_CHATBOT_USER_ID`. Run `node --env-file-if-exists=.env.local scripts/twitch-subscribe.mjs` for a redacted dry run, then add `--apply` only when the HTTPS callback and grants are ready. It creates a subscription, never sends chat messages. Twitch must verify the challenge and report the subscription enabled. A queued or verification-pending response is not successful live integration.

Official references: https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage and https://dev.twitch.tv/docs/eventsub/handling-webhook-events/.

## Data and identity limits

This is controlled hackathon workspace access, not a general multi-organization identity product. Operator logins share an operator workspace; each judge login starts a new session identity. Cookies expire after eight hours, so export judge work before logging out. Before public consumer launch, add per-user account recovery, consent/terms appropriate to the service and stronger organizational identity controls.

`portfolio_runs` become unreadable after 24 hours. The configured daily cron deletes expired records, meaning physical deletion can take up to another daily cycle; this has not yet been verified on Vercel. Manual deletion affects only the local record. Perfect Corp controls provider image retention. ReLoop handovers, Twitch rounds/votes and PayProof audit records are not automatically purged; define their retention before collecting real personal data. Twitch voter IDs are HMAC-hashed and chat message text is not stored. `rate_limits` are purged after 24 hours and signed Twitch receipts after two days.

FieldBrief validates citation identifiers, not the semantic truth of a model's claims. Human source review remains necessary. CultureRoute reports cultural affinity, not a personal or sensitive-trait prediction. FitReceipt is a visual preview, not a sizing guarantee. ReLoop reports confirmed self-declared mass, not measured emissions reduction.

## Evidence required before calling this production complete

- Successful deployment of the exact commit and responsive desktop/mobile flow.
- Real Postgres write/read, ownership isolation and a tested backup/restore procedure.
- Real sponsor API success, an actual failure path and enforced quotas.
- Twitch challenge + signed live vote, YouCam consent + real upload/render, Qloo resolved result + actual agent tool call, or Nebius catalog-confirmed NVIDIA inference as appropriate.
- Working judge access, event-specific video and remaining submission artifacts.
- A documented service owner, budget and retention policy.

Rollback by promoting the previous verified Vercel deployment. Database changes are additive. Cloud hosting is recorded in DEVPOST-HOSTING.md. No successful database/provider workflow, recording, participant registration or submission is asserted by this document.
