# Phase 3 — Dev1 (Vaibhav) Execution Brief
### Backend: Report Engine + Bulk Import + Python Worker, reconciled with the official Phase 3 spec

> **How to use this:** Paste this into Antigravity together with **two kinds of source material**: `phase3.html` (already in the project — attach/reference it directly; authoritative for *mechanism*), **and** the five master register templates — `Sample_Case_Reg_.xlsx`, `Sample_master_Arrest.xlsx`, `Sample_master_missing.xlsx`, `Sample_master_UIDB.xlsx`, and the FIR / Arrest / PCR / Missing Person / UIDB field-name reference image — which are authoritative for *field content* (see §1). Do not let Antigravity treat `phase3.html` as the complete picture on its own. You are acting as **Dev1 — Vaibhav, Backend Lead** for Phase 3 of the PHAROS project. This is one task among four parallel dev tracks (Raja, Shahista, Akshat) on the same codebase — staying inside your lane is as important as the code itself.

---

## 1. Authority & reconciliation with earlier report-engine work — read this first

`phase3.html` is the **single source of truth** for schema, API contracts, and architecture in this phase. It was written by the team lead and is what the other three devs (Raja, Shahista, Akshat) are already building against in parallel — Shahista's frontend components are being coded right now against the exact response shapes in §08/§11, and Akshat is writing Postman collections from those same shapes. **Any deviation from phase3.html's contracts breaks their work, not just yours.**

This supersedes an earlier, more exploratory report-engine design produced in an earlier session — a "data warehouse" approach with separate `dim_*`/`fact_*` tables, a normalized star-schema query layer, and synchronous REST query/export endpoints. That earlier design and phase3.html solve the same problem (flexible, filterable reporting across record types) but with a **fundamentally different storage and execution model**: phase3.html keeps all records in a single polymorphic `records` table (`record_type` + `data JSONB`), drives every field list from `field_registry`, and generates reports **asynchronously** via a Python worker over RabbitMQ rather than querying live in a request/response cycle.

### 1A. Two sources of authority — they cover different things, don't conflate them

- **`phase3.html` is authoritative for *mechanism***: how fields are stored (`records.data` JSONB), how they're served (`field_registry`-driven), how reports are generated (RabbitMQ + Python worker), and the exact API contracts. Trust it completely for *how things work*.
- **`phase3.html` is NOT authoritative for *field content*.** It only ever gives a handful of illustrative `field_key`s inside code examples — `fir_no`, `accused_name`, `crime_head`, `date_of_arrest`, `complainant_name`, `father_husband_name`, and similar — as illustrations of the pattern. It never enumerates a complete field list for any register, and `field_registry`'s actual seeded content is Raja's job, not something phase3.html guarantees is already correct or complete.
- **The five master register templates are authoritative for *field content***: the full field list per register (FIR, Arrest Person, PCR/Kalandra, Missing Person, UIDB), their data types, and — critically — the exact fixed vocabularies for every dropdown/SELECT field (Crime Head's ~95 values, Case Status, Case Reg. Type, Arrestee Status, the multi-select "Arrested In" options, and the Missing Person `Current Log Status` values, which are *conditional* on whether `Missing Register Category Sub-Type` is Missing or Found). Treat these templates as the checklist `field_registry` must satisfy, not the other way around.
- **Do not assume `field_registry` is already complete just because phase3.html references it confidently.** Verify it against the master templates; don't take it on faith.

### 1B. A real scope gap to surface, not silently resolve

Every place `phase3.html` enumerates `record_type` — the import path param, `POST /import/validate`'s body, the `import_batches.record_type` column, the report `filter_spec.record_type`, the `GET /reports/fields?record_type=` query param, and the `ImportPanel` component's `recordType` prop wired into ArrestManagement/PCRCallEntry/CaseManagement — it lists **only `ARREST`, `PCR_CALL`, `CASE`**. The Missing Person and UIDB registers, the 4th and 5th master tables, do not appear anywhere in the document.

- Do **not** silently extend the `record_type` enum to add `MISSING`/`UIDB` on your own judgment, and do **not** silently drop them either — either move could break the contract Shahista and Akshat are already building against.
- Build your Phase 3 deliverables strictly against the 3 confirmed types, exactly as `phase3.html` specifies.
- But record this exact discrepancy as an explicit open question in the handoff doc (§6) — phrased so the team lead can resolve it (deliberately deferred to a later phase, vs. an oversight in the spec) without having to re-derive the gap themselves.

**Before writing any code:**
1. Inventory what already exists in the repo relevant to reporting/import — any earlier `modules/reports/` code, warehouse/dimension-table migrations, dynamic filter/query-engine code, or report endpoints from prior exploratory work or earlier phases.
2. For each piece found, classify it as one of:
   - **Keep & adapt** — conceptually correct, just needs to be re-expressed against `field_registry`/`records` instead of a warehouse schema. Examples: RBAC/jurisdiction scoping (HC → own PS only, DISTRICT_OFFICER → own district — phase3.html §08/§07 already encodes this exact rule), SELECT-field validation against a fixed vocabulary (now `field_registry.options` instead of a `dim_*` lookup table), bilingual EN/HI field labels.
   - **Replace** — structurally incompatible with phase3.html and must not survive in any form that contradicts it: any separate warehouse/`dim_*`/`fact_*` schema, any synchronous report-query endpoint that bypasses the `report_jobs` + RabbitMQ + Python-worker pattern, anything that reads field lists from somewhere other than `field_registry`.
   - **Out of current scope, not to be built now** — ideas that were genuinely good but are **not part of the official Phase 3 plan**, most notably a side-by-side analytics/aggregate dashboard view. Do not implement this now. Note it in the handoff doc (§6) as a possible future phase so the idea isn't lost, but do not let it expand scope, complicate the schema, or delay the actual Phase 3 deliverables below.
3. Cross-check `field_registry`'s actual content against the five master register templates (§1A) for the 3 in-scope record types (CASE↔FIR Master, ARREST↔Arrest Person Master, PCR_CALL↔PCR/Kalandra Master). Produce a gap list of any field that's in the relevant master template but missing or mismatched (wrong type, incomplete `options[]`) in `field_registry` — this becomes a blocker list for Raja, not something you silently patch by inventing seed data yourself.
4. Write a short comparison note (what's being kept, replaced, or deferred from the earlier exploration, and why) plus the field-coverage gap list from step 3, and include both verbatim in the handoff document required by §6 — don't just act on any of this silently.

---

## 2. Non-negotiable constraints

- **Follow phase3.html exactly** for the DB schema (§03), `template_definition` structure (§04), worker code patterns (§06–07), and API contracts (§08, §11) — field names, status enums, response shapes, all of it. These are being built against by two other people in parallel right now.
- **Stay strictly inside your ownership** (phase3.html §16): you own `modules/reports/`, `modules/import/`, and the **generation logic inside** `python_worker/` — specifically `generator.py`. The worker's skeleton (`main.py`, `db.py`, `events.py`, `requirements.txt`, `.env`) is **Akshat's** task 01 to scaffold first so you can hand off into it; coordinate rather than duplicating his setup if it already exists.
  - **Do not author the migration file.** That's Raja's deliverable (§16, Raja task 01), copied verbatim from §03. Your job is to **review** it, then **run** it. If it hasn't landed yet, stop and flag this rather than improvising your own — per the doc, this is the literal starting gun: *"Nothing else starts until tables exist."*
  - **Do not touch any frontend file** (`src/pages/reports/...`, `src/components/ImportPanel.jsx`, `hooks/useReportJob.js`, etc.) — that's Shahista's ownership. Your only obligation toward her is that every response your endpoints return matches §08/§11 byte-for-byte in shape, so her mock-data components swap to real calls with a one-line change, as the doc intends.
  - **Do not scaffold `python_worker/`, write Postman collections, or merge to `main`.** Akshat owns the worker skeleton and is the explicit sign-off gate before anything reaches `main`. You flag `feature/be-reports` as ready, he tests it, signs off, *then* you proceed to `feature/be-import`; same cycle repeats.
- **Do not disturb already-working Phase 1/2 functionality.** `records`, `field_registry`, `hierarchy_nodes`, existing auth/RBAC middleware, `audit_logs`, `record_revisions`, and the existing CRUD endpoints for ARREST/PCR_CALL/CASE must keep working exactly as before. Your **only** sanctioned change to existing (non-reports/import) source is the SELECT-field normalisation check inside `records.service.js`'s `createRecord()`/`updateRecord()`, exactly as specified in §10 — nothing else in that file changes, and no other Phase 1/2 file is touched at all.
- **Branch discipline:** work on `feature/be-reports` first (controller + RabbitMQ + `generator.py` single-sheet, then composite mode), then `feature/be-import` (import module + router + normalisation). Never push directly to `main`; `feature/be-*` branches go to Akshat for testing, then to an integration branch with Shahista's frontend, then to `main` only after his sign-off.

---

## 3. Your task list (phase3.html §16, Dev1 — Vaibhav), in order

1. **Field-coverage audit.** Before touching code: walk `field_registry`'s rows for `CASE`, `ARREST`, and `PCR_CALL` against the corresponding master register templates (FIR Master, Arrest Person Master, PCR/Kalandra Master) and confirm every field is present with the correct type and — for SELECT fields — the complete, exactly-matching `options[]` vocabulary (Crime Head, Case Status, Case Reg. Type, Arrestee Status, "Arrested In", etc.). Output the gap list described in §1's step 3. This isn't optional groundwork — `generator.py` and the import templates will silently produce wrong or incomplete output for any field this misses.
2. **Run the DB migration.** After Raja's migration file (copied from §03) is reviewed by you, run it. Confirm: `report_jobs` has the new `custom_definition` and `error_message` columns; `report_templates` has `template_type`; `import_batches` and `import_batch_errors` exist as specified.
3. **Reports controller → RabbitMQ.** Remove the existing `setImmediate(generateReportInternal)` synchronous-generation call and replace it with the `publish('report.requested', …)` flow from §07's `reports.controller.js` example — adapt it to match the real existing code style/imports/error-handling conventions found in the repo rather than copy-pasting blind. Include the RBAC scope check (HC locked to own `ps_id`) and the custom-definition field_key validation shown in that same example.
4. **Import module — 5 endpoints**, exactly per §09 and §11:
   - `GET /api/import/template/:record_type` — generated on-the-fly from `field_registry`, with the 3-row template structure (hidden field_key row, visible label row, hint row) and Excel dropdown data-validation on `SELECT` columns.
   - `POST /api/import/validate` — dry-run parser using the column-key-map approach (Row 1 of the uploaded file maps columns to `field_key`s, order-independent), full per-cell validation per the rule table in §09, batch persisted to `import_batches`/`import_batch_errors`, temp file retained with an `expires_at`.
   - `POST /api/import/confirm/:batchId` — re-reads the saved temp file, skips invalid rows, commits valid rows in chunks of 100 inside their own transactions, writes `records` + `record_revisions` + `audit_logs` per row, publishes `record.batch_imported`, deletes the temp file, updates batch status.
   - `GET /api/import/batches` and `GET /api/import/batches/:batchId` — paginated list and full detail-with-errors, scoped to the requesting user.
5. **Python `generator.py`.** Single-sheet generation first (one record type → one `.xlsx`, via the field_registry-driven SQL/pandas pattern in §04) — get this working and verified end-to-end before starting composite mode. Then composite mode: loop `sub_template_ids`, one worksheet per sub-template, 34 sheets for the full Daily Diary (§05). Include the empty-report safeguard from §06 (write a notice row instead of a blank sheet).
6. **Write + wire `import.router.js`.** Mirror the existing `reports.router.js` pattern already in the repo. Register at both `/api/import` and `/api/v1/import` in `app.js`. You own this file entirely.
7. **SELECT normalisation in `records.service.js`.** Add the pre-insert validation block from §10 to both `createRecord()` and `updateRecord()` — reject with HTTP 422 if a SELECT field's submitted value isn't in `field_registry.options[].value`.
8. **Temp-file cleanup cron.** This is named as your deliverable in §17's build-order timeline but isn't given exact code in the doc — design it yourself, consistent with the rest of the system. It should delete `import_batches.file_path` temp files and mark the batch `EXPIRED` once past its `expires_at` (the field already exists, returned from `/import/validate`). Use whatever scheduling mechanism (cron library, `node-schedule`, an existing job-runner pattern already in the repo) fits the codebase; if nothing comparable exists yet, propose the lightest addition and call it out explicitly in the handoff doc as a new dependency.

---

## 4. Validations & RBAC to carry through every endpoint

Restated from §07/§08/§11 so nothing gets missed: template must exist and be `is_active`; custom report `field_keys` must all exist in `field_registry`; HC role is locked to their own `ps_id` on generate, DISTRICT_OFFICER locked to their own `district_id`; requested `format` must be one of the template's `output_formats`; job-status/download endpoints check `created_by = req.user.id` (403 otherwise); `is_legacy` import flag cannot be set by HC role; import confirm runs in 100-row transactional chunks with `audit_logs` + `record_revisions` written per row; temp files are deleted after confirm (and now also by the cleanup cron for abandoned/expired batches).

---

## 5. Definition of done

- [ ] Field-coverage audit complete: every field in the FIR/Arrest/PCR master templates has a matching, correctly-typed `field_registry` row, with a written gap list for anything missing.
- [ ] The MISSING/UIDB scope gap (§1B) is explicitly written up as an open question for the team lead — not silently assumed either way.
- [ ] Migration applied; all 4 new/altered tables verified in the DB.
- [ ] `POST /api/reports/generate` returns `{ job_id, status: 'PENDING' }` immediately, and a `report.requested` message lands on `report-generation-queue`.
- [ ] The Python worker (your `generator.py`, running inside Akshat's skeleton) consumes the job and correctly produces the file for all three modes — predefined, custom, and composite (Daily Diary) — updating `report_jobs.status` to `READY` or `FAILED` with `error_message` set on failure.
- [ ] All 5 import endpoints behave exactly as specified, including dropdown-validated template download and the full dry-run → review → confirm flow.
- [ ] `records.service.js` rejects out-of-vocabulary SELECT values with a 422 on both create and update, and nothing else in that file changed.
- [ ] No Phase 1/2 functionality and no other dev's owned files changed.
- [ ] `feature/be-reports`, then `feature/be-import`, flagged to Akshat in that order, each only after you've self-tested it against the request/response shapes in §08/§11.

---

## 6. Required output: a clean handoff document

Alongside the code, produce `docs/dev1-vaibhav-phase3-handoff.md` so that **someone who has never seen this conversation — only the repo and this file — can understand what was built and continue the frontend integration or testing work.** It must contain:

- The reconciliation/comparison note from §1: what was kept, replaced, or deliberately deferred from the earlier report-engine exploration, and why.
- The field-coverage gap list from §1A/§3 task 1: any field present in the master register templates but missing or mismatched in `field_registry`, per record type.
- The MISSING/UIDB scope question from §1B, stated plainly enough that the team lead can answer it without re-reading this brief.
- A plain-English reference for every endpoint you built — path, method, who's allowed to call it, request shape, response shape — usable without re-opening `phase3.html`.
- The RabbitMQ routing keys and payload shapes actually in use (`report.requested`, `report.generated`, `record.batch_imported`).
- How to run `python_worker/generator.py` locally against a dev database, including any setup steps beyond what Akshat's skeleton already provides.
- **What Shahista needs to know**: exact response shapes for each endpoint, the Daily-Diary template UUID placeholder convention until Raja shares the real one, the expected polling interval, and anything about error states (`FAILED` + `error_message`) her UI needs to handle.
- **What Akshat needs to know**: how to trigger each of the three report modes for testing, how to deliberately produce validation errors for the import dry-run (e.g. a row with a bad date and a row with an invalid `crime_head`), where temp files land on disk, and what "ready for testing" means for each of your two feature branches.
- Open questions or assumptions you had to make where `phase3.html` was silent — most notably the cleanup-cron scheduling choice from §3 item 8.
