# TIIP CRM Backlog

Last updated: 2026-04-23

IDs are stable — reference them in commit messages (e.g. `fix: B-001 — ...`). Order within each section = priority (top = most urgent). When an item ships, move it to the Shipped section with its merge commit hash; prune Shipped entries older than ~30 days.

## Bugs

## Changes / features

- [ ] **C-002** Wire up SDR Agent tab (currently disabled "SOON") · 2026-04-21
  Nav tab and placeholder already exist. Implementation needs: (1) Supabase Edge Function to proxy Anthropic API (key can't live in client), (2) UI for prompt/draft/send flow, (3) ties back to `correspondence` table for logged outreach. Non-trivial — schedule its own planning session.

## Shipped (last 30 days)

- [x] **S-016** C-007 visual — ★ primary / ○ secondary badge on ContactDetail opp cards · 2026-04-23 (Batch 3)
- [x] **S-015** C-006 — Primary/secondary contact UI in OppForm (click ○ to promote to ★) · 2026-04-23 (Batch 3)
- [x] **S-014** C-005 — Rename Capital Raise "Closed" stage to "Won" · 2026-04-23 (Batch 3)
- [x] **S-013** C-004 — Remove Status (termSheet/onboarded) checkboxes from OppForm · 2026-04-23 (Batch 3)
- [x] **S-012** B-006 — Fix contact-picker checkbox interactivity · 2026-04-23 (Batch 3)
- [x] **S-011** C-001 — Dev-time STAGE_PROB validation warning · 2026-04-22 (Batch 6)
- [x] **S-010** C-010 — Parking-lot stages render as columns to the right of active stages · 2026-04-22 (Batch 5)
- [x] **S-009** C-009 — Remove Capital Raise block from SAIL Report tab · 2026-04-22 (Batch 5)
- [x] **S-008** B-003/B-004/C-003 — Full email body search, auto-link by To:, delete button · 2026-04-22 (Batch 4)
- [x] **S-007** B-001/B-002/B-005 — Rename fbStatus→dbStatus, fix modal stacking, fix PDF color export · 2026-04-22 (Batch 2)
- [x] **S-006** C-007 orgType + C-008 projectType dropdown additions · 2026-04-22 (Batch 1)
- [x] **S-005** Fix email-to-contact matching to use recipient (To:) not sender · merged 2026-04-20 (`dab5744`)
- [x] **S-004** Messages tab + full email body storage + BCC→contact linking · merged 2026-04-20 (`3141858`)
- [x] **S-003** Wire up BCC Inbox — Gmail sync to Supabase · merged 2026-04-20 (`a6c8d92`)
- [x] **S-002** Migrate to Supabase + fix Netlify deployment · merged 2026-04-19 (`8273b9e`)
- [x] **S-001** CRM v2 — redesigned React CRM with three pipelines, Command Center, Reports · merged 2026-04-19 (`1ee2be5`)
