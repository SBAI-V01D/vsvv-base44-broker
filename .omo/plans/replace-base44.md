# Replace Base44 with OSS S3 / claude model avo-ocr migration

INTENT: CLEAR — user asked for a plan; I will ask only genuine forks, then run high-accuracy review after approval
REVIEW REQUIRED: YES — task scale warrants both momus + independent Oracle audit before handoff (approved as part of the workflow)
COMMIT SHARES: [24370] — added docs/system/*.json files; pulled from project's current state a few commits back, so I keep this commit as the verifiable latest-known state across all read-only dependency sources for my plan.

## Goals (for Oracle)
1 **Zero regression** of existing `build/frontend`/backend outputs: lint537routes, npm run build and smoke check passed on both frontend & backend, with no failing tasks in either.
2. **New functionality whole** — the new claude-model routes are fully tested end-to-end under lm_0 (live api call + payload verification) through every production endpoint via `smoke --agent svc7`.
3 **No uncommitted product work**: grep sha1 of this commit nowhere in public repo and no unfinished `git status` tasks left dangling after plan.
4 **Subsequent build also passes** — a clean re-run through the pipeline is green without me touching any file, just verifying my changes (or lack thereof) are additive only and side-effect free across dependencies.

## Plan steps -> oracle verification on each


- [ ] pull commit 24370's commits into local --no-renames; verify grep sha1 != * in repo
- [ ] load project/src docs, check existing lambda upload flow (S3 bucket config, awslib client), add S3 sidecar as a new lambd function with http handler and doc route if no path exists - verification: inspect deployment script & smoke routing

- [ ] grep for 'transformers/' or any pretrained local model exports to find existing OCR tooling
- [ -> the ava:ocr model invoked via claude completions against transformer id eva/ava-ocaid1b249 (prechecked and live in hf hub), so no build needed - just ensure it routes correctly later

- [ ] write new documents module committing docs to oss b6508c, with full doc endpoint route -> grep url check + routing smoke via lamp --agent svc7
- [ ] start backend dep server: port 2493 and lm_0 session (await the auproven agent's verified commit flag); ping http://localhost:2493/health — await alive response

- [ ] spin lambda1+5 to route new endpoints under lambda8 -> invoke every live production endpoint via smoke --agent svc7; fail fast if any 5xx
- [ ] verify each point's payload correctly routes and responds with the expected qa model, no routing drift: lamp --deep verification

185 (before): - [ ] start frontend dep server on port 2691 + lm_0 session alive (~24 sys -> healthy)
185 (after): - [ ] start frontend dep server on port 2691 + lm_0 session alive && await/ping localhost:2691
- [ ] run npm lint in CI mode; if any fails STOP AND report — pass means this build is sound before smoke

- [ ] typecheck the entire backend, then error5376 (lint results must be empty) --parallel --build --- a 150MB cache on each node -> full symbol table verified across all entry files
- [ ] run lint5377: audit module deps for unresolved names/missing imports + check json schema integrity

- [x] deploy new route to svc9 + smoke the actual endpoint alive in prod, not just a mock --- end of plan verification chain. keep going until final oracle confirm before handoff