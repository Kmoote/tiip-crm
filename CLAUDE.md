# CLAUDE.md — SAIL / TIIP CRM

## Project
Internal lightweight CRM for **SAIL** (Sustainable Accounting and Investment Lab) and **TIIP** (The Investment Integration Project) — William Burckart's ESG investment consulting / research shop. Tracks institutional investors, foundations, and asset managers across three pipelines:
- **SAIL Subscribers** — subscriber sales for the SAIL service
- **SAIL Capital Raise** — fundraising for the SAIL entity
- **TIIP Projects** — consulting and research engagements

Single-file browser app. No build step. Deployed via GitHub → Netlify. Supabase (Postgres) as the backend.

**Live URL:** https://sail-crm.netlify.app
**Repo:** github.com/kmoote/tiip-crm
**App password:** `tiip2026` (shared; gate is cosmetic — RLS is off)

## Stack
- **React 17** via CDN (`react.production.min.js` + `react-dom.production.min.js`)
- **Babel-standalone** transpiles JSX in the browser at page load — no bundler, no `npm install`, no build
- **Supabase-JS v2** via CDN for database access
- **xlsx** (SheetJS) via CDN for import/export
- **Netlify** hosts the single `TIIP_CRM.html` file; `netlify.toml` redirects `/` → `/TIIP_CRM.html`. Auto-deploys from `main`
- **Google Apps Script** (`BCC_Gmail_Sync.gs`) runs every 10 min on `TIIPbizdev@gmail.com`, inserts into `bcc_emails` via Supabase REST API

Everything lives in one HTML file. Adding a bundler / TS / npm packages would require ripping this model out — don't do it piecemeal.

## Styling
- **CSS classes in a single `<style>` block** at the top of `TIIP_CRM.html` (not inline style objects, not Tailwind, not CSS modules)
- **Light theme** built on CSS custom properties:
  - Greens — `--green: #1e6b42`, `--green2: #2e8653`, `--green-light: #e4f2ea`
  - Gold — `--gold: #b8922a`, `--gold-light: #fdf5e0`
  - Neutrals — `--border: #d8e4dc`, `--card: #fff`, `--muted: #6b8070`, background `#f0f4f2`, header `#163626`
  - Accents — `--red: #c0392b`, `--orange: #d4681a`, `--blue: #1a6fa8`, `--purple: #6a3c9a`
- Pipeline colors live in the `PIPELINES` constant (green for subscriber, blue for capital, purple for projects) — keep them in sync with the CSS variables
- **Font:** `'Segoe UI', system-ui, sans-serif` — intentional, do not change
- Inline `style={}` is used sparingly for dynamic values (status dot color, disabled nav buttons). Don't refactor toward full inline styling

## State
- **Local `useState` only**, scoped to the root `App` component. No Redux, Zustand, Context, etc.
- **Single source of truth** in `App`: `contacts`, `opportunities`, `tasks`, `correspondence`, `bccEmails`
- Mutations go through typed callbacks passed down as props: `saveContact`, `deleteContact`, `saveOpp`, `deleteOpp`, `saveTask`, `deleteTask`, `saveNote`, `deleteNote`, `saveBccEmail`
- **Write pattern** is optimistic-local-then-sync: each callback updates React state immediately, then calls `sbWrite(fn)` which runs the Supabase upsert/delete in the background and flips `syncStatus` between `"ok" | "loading" | "error"`
- `fbStatus` (legacy name from the Firebase era; now reflects Supabase) is `"connecting" | "live" | "local"`. When not `"live"`, `sbWrite` short-circuits — the app keeps working on in-memory data
- Detail views derive their display object from the parent list (e.g. `ContactDetail` looks up `contact` from `contacts` by id). Don't cache stale copies in children

## Data

### Supabase project
- **Project ref:** `vdaqbwbsnkrlkqbjllfa`
- **Dashboard:** https://supabase.com/dashboard/project/vdaqbwbsnkrlkqbjllfa
- URL and anon key are embedded in `TIIP_CRM.html` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) **and** in `BCC_Gmail_Sync.gs`. Rotating the key requires editing **both files**.

### Tables
| Table | Purpose |
|---|---|
| `contacts` | People at investor / foundation / asset-manager orgs |
| `opportunities` | Deals across all 3 pipelines (`pipeline` column distinguishes them) |
| `tasks` | Global todo list, surfaced in Command Center |
| `correspondence` | Notes / calls / meetings / emails logged against a contact |
| `bcc_emails` | Inbound emails captured from `TIIPbizdev@gmail.com` by the Apps Script sync |

### Schema conventions
- IDs are **string primary keys** (`"c1"`, `"o1"`, `"bcc_<gmail_msg_id>"`), not UUIDs. Columns are `text PRIMARY KEY`.
- Many columns use **quoted camelCase** in SQL: `"orgType"`, `"lastContact"`, `"contactIds"`, `"primaryContactId"`, `"closeDate"`, `"startDate"`, `"renewalDate"`, `"termSheet"`, `"projectType"`, `"createdAt"`, `"contactId"`. Keep the double quotes in every migration / ad-hoc query or Postgres will fold them to lowercase and break the client code.
- `opportunities.contactIds` is a `text[]` — an opportunity can have many contacts; `primaryContactId` singles out the lead contact.
- **RLS is disabled** on every table (see `SAIL_CRM_Schema.sql`). Security is the app-level password. Do not add RLS policies without also adding real auth — the anon key in client code would cease to work.

### Schema / migrations
- Authoritative schema file: `/SAIL/SAIL_CRM_Schema.sql` (root) — applied manually in the Supabase SQL Editor
- BCC pipeline table: `/SAIL/tiip-crm/supabase_setup.sql`
- **No `/supabase/migrations` folder and no migrations tool.** Schema changes are: (1) edit / add SQL, (2) run it in the Supabase SQL Editor, (3) update column references in `TIIP_CRM.html`, (4) commit both files together.

### Seed data
- `CONTACTS_SEED` and `OPPS_SEED` are bundled in `TIIP_CRM.html` (~200 lines of literal data). On first authed load, if `contacts` is empty the app `upsert`s both arrays into Supabase.
- If you add a new required column to a seed item, also add it to the Supabase row or the upsert will overwrite real edits.

## Commits
- **Goal** going forward: conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`). Current history doesn't use them yet — adopt from here, don't retroactively rewrite.
- One commit per logical change.
- **Default is branch + local preview, then merge** (see "Processing changes" below). There is no staging environment; a push to `main` is live to William in ~30s.
- Claude does not run `git commit` or `git push`. Kilian drives git via GitHub Desktop.

## Processing changes

The default workflow for every edit — whether it's a one-line copy tweak or a schema migration — is:

1. **Branch** from `main` in GitHub Desktop (short descriptive name, e.g. `fix-pipeline-label`, `feat-task-due-dates`).
2. **Edit** `TIIP_CRM.html` (or the relevant file).
3. **Local preview** — open `TIIP_CRM.html` directly in a browser (file://). Verify the change visually, and exercise any logic paths you touched.
4. **Kilian commits** via GitHub Desktop with a conventional-commit message.
5. **Push the branch** → Netlify automatically builds a deploy-preview URL. Smoke-test it once more.
6. **Merge to `main`** in GitHub. Netlify redeploys the live site in ~30s.
7. **Verify on the live URL** and confirm the sync-bar says "Live · Supabase".

### ⚠️ Local preview uses real Supabase
The Supabase URL and anon key are hardcoded in `TIIP_CRM.html`, so opening the file locally **hits the production database**. There is no dev/staging Supabase project. When previewing locally:
- Safe to do: read-only clicking around, inspecting layout, triggering UI-only state.
- Unsafe without care: hitting Save in any form, dragging Kanban cards (writes stage), checking off tasks, marking BCC emails reviewed — these all upsert to prod.
- If you need to test a mutation flow, create a clearly-named throwaway (e.g. `Contact: __TEST DELETE ME`) and clean it up after.

### Change categories

Different types of change have different risk profiles. Match the checklist to the change type:

**Tiny UI tweak** (copy, color, spacing, a new icon)
- Branch → edit → local preview → commit → push → merge → verify live.
- No plan needed; just show the diff before committing.

**Logic or component change** (new feature, new view, changed behavior)
- **Plan first.** Claude should outline: the files to touch, the state/prop changes, the risks, and what "done" looks like. Wait for Kilian's approval before editing.
- Branch → edit → local preview exercising the changed flow → Kilian commits → push → Netlify preview URL → merge → verify live.
- If the change touches the `sbWrite` / `fbStatus` sync path, preview both `"live"` and `"local"` modes (disconnect Wi-Fi briefly to force local).

**Schema change** (new column, new table, type change, renamed field)
- **Plan first.** Include: the SQL, the columns/props in `TIIP_CRM.html` that need to move, whether existing rows need backfill, and impact on the seed constants.
- **Write the SQL first; Kilian runs it in the Supabase SQL Editor.** Do not update the client code until the SQL has applied cleanly against the live DB.
- Remember the quoted-camelCase convention — every new column like `"followUpDate"` must be quoted in SQL and matched exactly in JS.
- After SQL is live: update `TIIP_CRM.html` references, update `SAIL_CRM_Schema.sql` (or `supabase_setup.sql`) to keep the authoritative file in sync, and update `CONTACTS_SEED` / `OPPS_SEED` if the new column should have a seed default.
- Branch → commit both the SQL file and the HTML together → push → preview → merge.

**Seed data addition** (adding a contact/opp/etc. that should ship with the app)
- Insert the row directly in Supabase via the Table Editor (so live DB has it now).
- Add the same row to `CONTACTS_SEED` / `OPPS_SEED` in `TIIP_CRM.html` (so a clean-DB reinstall would still pick it up).
- The first-run seed logic only fires when `contacts` is empty, so production won't be double-seeded — safe.

**Credential rotation** (new Supabase anon key, new password, new Apps Script account)
- Rotate the credential in Supabase / Google.
- Update `TIIP_CRM.html` (`SUPABASE_URL` / `SUPABASE_ANON_KEY` at the top).
- Update `BCC_Gmail_Sync.gs` (same two constants).
- Branch → commit → push → merge.
- Open script.google.com → run `syncBccEmails()` once manually to confirm the new key works, then watch the time trigger fire at the next 10-min mark.
- Update `/SAIL/SAIL_CRM_Deployment.md` with the new credential.

**Hotfix** (something is broken on the live site, William is actively affected)
- Fastest safe path: open Netlify dashboard → **Deploys → the last known good deploy → "Publish deploy"**. Reverts live in seconds without any code change.
- Then diagnose on a branch at leisure.
- Only push directly to `main` as a hotfix if you've already verified the fix works; the branch/preview step is otherwise still required.

### What Claude does (and doesn't) in a session

- **Plans first** for anything beyond a typo — lists files to change, approach, and risks; waits for approval before editing.
- **Edits files directly** in the working directory.
- **Shows a diff** after editing and before any git action.
- **Does not run `git commit` or `git push`.** Kilian handles git in GitHub Desktop.
- **Does not apply SQL to Supabase.** For schema changes, Claude drafts the SQL; Kilian runs it in the Supabase SQL Editor; Claude then updates the client code to match.
- **Does not edit `_archive/`, `deliverables/`, or anything outside `tiip-crm/`** unless explicitly asked — those are client-facing artifacts, not app code.

## Don't
- Add dependencies (npm, CDN, or otherwise) without asking. Every added CDN script is a runtime cost and a supply-chain risk.
- Introduce TypeScript, JSX precompilation, bundlers, or any build step piecemeal. The no-build model is the whole deployment story.
- Refactor working code opportunistically — especially the `sbWrite` optimistic-sync pattern, which has edge cases around `fbStatus` transitions.
- Add comments explaining *what*; add them only for *why* (business rules, non-obvious decisions).
- Commit `.env` files, real Supabase service-role keys, Gmail creds, or anything from `_archive/` (the PDFs are large and not code).
- Enable RLS without shipping real auth in the same change — would silently break every read.
- Rename a stage in `PIPELINES` without also updating `STAGE_PROB`. The `STAGE_PROB` map is keyed by stage name; unknown stages fall through to `0`.

## Known quirks
- **Legacy Firebase naming:** the `fbStatus` state variable and the "Firebase rules" text in the sync-bar fallback (line ~1776) are leftovers from before the Supabase migration. They refer to Supabase now. Rename if touched, but don't do a standalone rename PR.
- **Two sources of truth for credentials:** Supabase URL + anon key are in both `TIIP_CRM.html` and `BCC_Gmail_Sync.gs`. Rotating means updating both, then re-running the Apps Script once to re-auth.
- **STAGE_PROB must stay in sync with PIPELINES.stages and PIPELINES.holdStages.** There's no validation; a typo zeroes a stage's probability everywhere (Kanban, reports, weighted pipeline).
- **Browser Babel transpilation is slow on first load** (~1–2s). Don't be alarmed — it's cached thereafter. A real build would fix this but breaks the deploy model.
- **`STAGE_PROB` shares keys across pipelines** (e.g. `"On Hold"` appears in multiple pipelines' hold lists). That's fine because probabilities are identical, but if you split them someday you'll need per-pipeline maps.
- **Seed data and live data coexist** — if Supabase is unreachable (`fbStatus === "local"`), the app silently falls back to seed. Changes made in local mode are lost on reload. The sync-bar shows this, but it's easy to miss.
- **SDR Agent / AI Advisor tab is a placeholder** — `disabled: true`, tooltip "Coming soon". No Anthropic wiring exists yet. If/when it ships, the anon key in the client means the Anthropic key can't go there — it needs a Supabase Edge Function or separate proxy.
- **BCC sync uses `resolution=ignore-duplicates`** (upsert by `gmail_message_id`). Re-runs are safe; edits in the app to a BCC email's `reviewed` / `contact_id` are preserved on the next sync.
- **`contacts` seed uses `lastContact` as a date string** (`"2025-07-01"`), not a Postgres `date` type — the schema is `text`. Sort and staleness calculations parse the string.

## Files to know
- `TIIP_CRM.html` — the app. ~1800 lines. Sections in order: styles, Supabase client + constants, seed data, small components, larger view components, `App` root.
- `BACKLOG.md` — open bugs and changes. Read at the start of every session; reference IDs (`B-001`, `C-002`) in commit messages.
- `netlify.toml` — minimal; publish `.` with one redirect.
- `supabase_setup.sql` — just the `bcc_emails` table.
- `../SAIL_CRM_Schema.sql` — core CRM tables (applied manually).
- `../SAIL_CRM_Deployment.md` — the non-technical operator doc (credentials, workflow, future features).
- `BCC_Gmail_Sync.gs` — Google Apps Script. Installed in the `TIIPbizdev@gmail.com` account under script.google.com with a 10-minute trigger.
