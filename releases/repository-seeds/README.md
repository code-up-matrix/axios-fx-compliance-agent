# Independent Devpost project sources

These archives contain separate, runnable source trees that have now been published to [eight public repositories in code-up-matrix](../../docs/DEVPOST-REPOSITORIES.md). The archives preserve their original export-time status and checksums; the current remote URLs and verified commits are recorded separately in [published-repositories.json](../../deploy/published-repositories.json).

| Event | Product source | Local verification | Submission status |
| --- | --- | --- | --- |
| Nebius × NVIDIA | [FieldBrief](fieldbrief-devpost-2026.zip) | 8 tests; TypeScript and production build pass | Draft; live Nebius run and demo pending |
| Qloo | [CultureRoute](cultureroute-devpost-2026.zip) | 5 tests; TypeScript, Eve and Next builds pass | Draft; real Qloo/agent run and demo pending |
| Codex × TwitchCon | [CrowdQuest](crowdquest-devpost-2026.zip) | 10 tests; TypeScript and production build pass | Draft; Twitch flow, genuine session ID and video pending |
| YouCam | [FitReceipt](fitreceipt-devpost-2026.zip) | 8 tests; TypeScript and production build pass | Draft; actual try-on and video pending |
| Arbiter Hacks V1 | [ReLoop](reloop-devpost-2026.zip) | 6 tests; TypeScript and production build pass | Student eligibility hold |
| Syntax Summit | [LessonScript](lessonscript-devpost-2026.zip) | 9 tests; TypeScript and production build pass | Eligibility conflict unresolved |
| InnovArt 2027 | [RhythmWeave](rhythmweave-devpost-2026.zip) | 6 tests; TypeScript and production build pass | Eligibility conflict unresolved |
| UGREEN Round 1 | [HandoverShelf](handovershelf-devpost-2026.zip) | Official static checker pass; PDF and initial ZIP included | Entrant declarations and final upload pending |

The seven web apps each contain their own homepage, product API, database migrations, environment template, tests, production configuration, source provenance, verification log and event-specific submission draft. CultureRoute includes the Eve agent and official Qloo harness integration. HandoverShelf is a native NAS Skill; it has no Vercel requirement.

There are **52 passing test executions across the seven packages**, including repeated shared security/ownership checks. They are not 52 distinct tests. Provider replies are stubbed where documented, while database tests use actual PostgreSQL semantics through PGlite. No live integration, deployed browser test or cloud production completion is claimed.

The archives exclude node_modules, build outputs, credentials and local environment files. `.env.example` contains names only. Exact SHA-256 checksums and export-time status are in [manifest.json](manifest.json). The existing PayProof repository remains separate and is not duplicated here.

## Reproduce and provision

From the portfolio repository, after npm ci:

```sh
node scripts/export-event-repositories.mjs /tmp/devpost-event-repositories
```

Run npm run check in each exported web project and record its real verification result before packaging. `scripts/package-event-repositories.py` refuses a package without a passing recorded result. Exporting alone does not verify or deploy anything.

`python scripts/provision-event-repositories.py` validates the checksums and prints the original eight-repository creation plan. Its `--apply` mode is not needed now: all eight repositories already exist. Creation was completed through authenticated GitHub UI, followed by source publication through the GitHub connector. The helper was only run in plan mode and refuses to overwrite an existing repository.

Vercel still requires the exact team grant for emmanuel-dukes-projects. Each web project then needs its own database, selected provider credentials, live verification and recording. All final Devpost submissions remain outstanding. Preserve the original source reference and disclose shared infrastructure and Codex assistance.
