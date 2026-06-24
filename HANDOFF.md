# PHAROS — Claude Session Handoff Document

**Branch:** `report-generation-ashmit`  
**Prepared by:** Claude (Sonnet 4.6) — Session ending June 2026  
**Purpose:** Allow a fresh Claude session to continue without re-analysing the repository

---

## 1. Repository Architecture Overview

PHAROS (Police Hierarchical Automated Reporting & Operations System) is a multi-tier police records management system for Delhi Police. It handles case FIRs, arrests, PCR calls, missing persons, and unidentified bodies (UIDB) across a PS → District → Sub-Division → JCP → HQ hierarchy.

### Stack
- **Backend:** Node.js / Express (ESM modules), Knex.js, PostgreSQL 15, RabbitMQ, Winston logger
- **Frontend:** React 18 / Vite, Ant Design, Zustand, react-i18next
- **Python Worker:** Separate process, connects to same PostgreSQL DB, receives jobs via RabbitMQ, generates Excel (openpyxl) and PDF (WeasyPrint)
- **Infra:** Docker Compose (PostgreSQL + RabbitMQ), env-validated config

### Key Architectural Pillars (from CLAUDE.md — non-negotiable)
1. **Dynamic Field Registry** — forms render from `field_registry` table rows, never hardcoded
2. **JSONB Records** — all domain data in `records.data JSONB`; new fields = new `field_registry` row, never ALTER TABLE
3. **Event Bus Isolation** — modules never call each other directly; all cross-module comms via RabbitMQ topic exchange `pharos`
4. **Append-only Audit** — every mutation writes to `record_revisions` + `audit_logs`
5. **Hierarchy as Config** — `hierarchy_nodes` is a self-referencing tree; new PS/District = new row, zero code change
6. **Bilingual** — every label has `label_en` + `label_hi`

### Workflow States
```
DRAFT → PENDING_SHO → DISTRICT_REVIEW → COMPILED → JCP_REVIEW → SCP_REVIEW → HQ_RECEIVED → ARCHIVED
              ↓ send-back                 ↓ send-back
         SENT_BACK (→ HC)           SENT_BACK_PS (→ SHO)

Special: LEGACY_IMPORTED, AMENDMENT_PENDING
```

---

## 2. Module Map and Key Interactions

```
HTTP Request
    │
    ▼
Express (app.js)
    │
    ├── authMiddleware (JWT verify → req.user)
    ├── enforceScope (sets req.jurisdictionQuery based on role)
    │
    ├── /api/records → records.router.js → records.service.js
    │       └── publishes record.* events → RabbitMQ
    │
    ├── /api/daily-diary → daily-diary.router.js → daily-diary.controller.js
    │       └── daily-diary.service.js (in-memory classification)
    │               └── publishes report.queue → RabbitMQ (after Phase 3)
    │
    ├── /api/reports → reports.router.js → reports.controller.js
    │       └── publishes report.requested → RabbitMQ
    │
    ├── /api/report-builder → reportBuilder.router.js → reportBuilder.controller.js
    │       └── queryEngine.js (filter spec → Knex query)
    │       └── publishes report.requested → RabbitMQ (for export jobs)
    │
    ├── /api/analytics → analytics.router.js → analytics.controller.js
    │       └── direct Knex queries (LIVE mode) or warehouse.db.js (WAREHOUSE mode)
    │
    ├── /api/compilations → compilation.controller.js → compilation.service.js
    │
    ├── /api/warehouse → warehouse.router.js → warehouse.controller.js
    │       └── warehouse.db.js (abstraction layer: rpt.fact_* vs rpt_fact_*)
    │
    └── /api/fields → fields.router.js → fields.service.js
            └── reads field_registry, returns sections with show_when


RabbitMQ (topic exchange: 'pharos')
    │
    ├── 'record.*' → audit-queue → auditHandler.js
    │       └── writes record_revisions + audit_logs
    │
    ├── 'record.status_changed' → notifyHandler.js
    │       └── writes notifications table
    │
    └── 'report.requested' / 'report.queue' → Python worker
            └── generator.py → generates file → marks report_jobs READY
                                              → publishes report.generated
```

### Role → Jurisdiction Scope Mapping
```
HC/SHO               → { ps_id: user.ps_id }
DISTRICT_OFFICER     → { district_id: user.district_id }
JCP (ACP)            → { sub_div_id: user.sub_div_id }
SCP/HQ_ANALYST/HQ_ADMIN/SYSTEM_ADMIN → {} (global)
```

---

## 3. Files Inspected During This Session

| File | Key Finding |
|------|-------------|
| `backend/src/config/db.js` | 31 lines, MISSING pg.types.setTypeParser DATE fix |
| `backend/src/modules/analytics/analytics.controller.js` | Has dead SQLite code (getJsonPathSql), type normalization bug, getSummary key mismatch |
| `backend/src/modules/compilation/compilation.service.js` | Raw INSERT with no UPSERT — fails on recompile of same district+period |
| `backend/src/modules/daily-diary/daily-diary.service.js` | Complete (REPORTS, REPORT_COLUMNS, classification helpers, mapRecordsToSheets), but ExcelJS export is inline sync |
| `backend/src/modules/daily-diary/daily-diary.controller.js` | Has resolveScope + getValidatedDate, but exportExcel streams buffer directly |
| `backend/src/modules/report-builder/queryEngine.js` | ALREADY EXISTS in current branch, NO SQLite code, complete 15+ operators |
| `backend/src/modules/report-builder/reportBuilder.router.js` | ALREADY EXISTS and mounted |
| `backend/src/modules/report-builder/reportableFields.config.js` | ALREADY EXISTS |
| `backend/src/modules/warehouse/warehouse.db.js` | resolveQueryMode(), isWarehouseReady(), whTable() — use these in new analytics endpoints |
| `backend/src/modules/record-links/` | All three files exist (service, controller, router) |
| `frontend/src/components/forms/FormSection.jsx` | Has show_when logic (lines 57–63) but only single-string match, not array |
| `frontend/src/components/forms/DynamicForm.jsx` | ~817 lines, has validation skip for show_when but also single-string only |
| `frontend/src/components/DynamicForm/DynamicForm.jsx` | Ant Design version, ~174 lines, NO show_when logic at all |
| `python_worker/generator.py` | ~369 lines, handles PROFORMA/COMPOSITE/LINKED, has else-clause silent failure for unknown templates |
| `python_worker/templates/` | Only 2 files: `arrested-24hr-list.json`, `manual-fir.json` |
| `backend/migrations/` | 9 migration files; record_linkage and conditional_fields MISSING from Knex migrations |
| `backend/scripts/migrations.js` | Creates record_links and link_type_registry outside Knex migration system |

### Feature Branch Files Inspected (read-only via `git show`)
- `remotes/origin/feature/daily-diary-compilation:backend/src/modules/daily-diary/daily-diary.service.js`
- `remotes/origin/feature/daily-diary-compilation:backend/src/modules/daily-diary/daily-diary.controller.js`
- `remotes/origin/feature/daily-diary-compilation:backend/src/modules/daily-diary/daily-diary.router.js`
- `remotes/origin/feature/daily-diary-compilation:backend/src/modules/report-builder/queryEngine.js`
- `remotes/origin/feature/daily-diary-compilation:backend/src/config/db.js`
- `remotes/origin/feature/daily-diary-compilation:backend/migrations/20260621000000_record_linkage.js`
- `remotes/origin/feature/daily-diary-compilation:backend/migrations/20260620500000_conditional_fields.js`
- `remotes/origin/feature/daily-diary-compilation:backend/src/modules/analytics/analytics.controller.js`
- `remotes/origin/feature/daily-diary-compilation:backend/src/modules/compilation/compilation.service.js`

---

## 4. Design Decisions and Reasoning

### Decision 1: Daily Diary Excel goes through Python worker (not ExcelJS inline)
**Reasoning:** The current feature branch exports daily diary Excel synchronously in Node.js using ExcelJS, streaming the buffer directly in the response. This blocks the event loop for large datasets (a PS with 500+ records generating 34 sheets could take 5–10 seconds). The project already has a Python worker + RabbitMQ + `report_jobs` job queue for exactly this use case. Routing daily diary export through the same pipeline:
- Keeps Node.js non-blocking
- Makes daily diary exports cancellable and pollable (same frontend flow as other reports)
- Keeps all file generation in Python (one language for one concern)
- Allows Python to leverage the physical Excel template file (`Daily dairy all tables NO MULTIVALUED (1).xlsx`) instead of rebuilding formatting from scratch

**Tradeoff:** Slightly more latency (job round-trip vs immediate stream). Mitigated by the 202-with-job_id response — frontend already knows how to poll `GET /api/reports/status/:jobId`.

### Decision 2: Node.js classifies, Python formats
**Reasoning:** The classification logic (`mapRecordsToSheets` + 11 helper functions) encodes deep police domain knowledge in JavaScript. Porting this to Python would add ~500 lines of Python that must be kept in sync with the JS version. Instead:
- Node.js runs `mapRecordsToSheets` (fast in-memory operation, already done)
- Serialises the result as `{type: "DAILY_DIARY", date, sheets: {...}}` into `report_jobs.custom_definition`
- Python reads the pre-classified data and just does the formatting

This keeps domain logic in one place and formatting logic in one place.

**Data size concern:** 34 sheets × ~100 rows × ~15 fields = ~51,000 values. JSON serialized ≈ 2–5 MB. PostgreSQL JSONB handles this fine (limit is 1 GB). For very large districts (1000+ records), consider chunking in a future phase.

### Decision 3: queryEngine.js stays in Node.js
The feature branch's queryEngine.js is 845 lines. It was already copied into the current branch. It connects to Knex (which is Node.js-native), handles LIVE/WAREHOUSE dual mode using `warehouse.db.js`, and supports role-based PII filtering. No reason to port it to Python.

### Decision 4: Warehouse layer for comparative analytics
The warehouse (rpt schema: fact_fir, fact_arrest, fact_pcr, fact_missing, fact_uidb + dimension tables) auto-syncs every 5 minutes. For period comparison and year-over-year, using the warehouse gives:
- Pre-normalized data (no JSONB extraction needed)
- Indexed numeric columns for fast GROUP BY
- Historical data preserved even if live records are modified

The `resolveQueryMode()` function in `warehouse.db.js` handles automatic fallback to LIVE mode if warehouse is not ready. New analytics endpoints should call this and branch accordingly.

### Decision 5: FormSection.jsx array show_when (not a new DSL)
The `show_when` column is already a JSON object with shape `{field, value}`. The only change needed is making `value` support both a string and an array of strings. The feature branch already has this exact change. Rather than inventing a more complex condition DSL (e.g., `AND`/`OR` conditions), the array approach handles the common case (show when crime head is in a set of values) cleanly.

### Decision 6: Two separate DynamicForm implementations
The repo has **two** DynamicForm components:
- `frontend/src/components/DynamicForm/DynamicForm.jsx` — Ant Design version (~174 lines), used by newer pages
- `frontend/src/components/forms/DynamicForm.jsx` — custom multi-step version (~817 lines), used by older pages

Both need show_when support. The Ant Design version needs it added from scratch (use Form.Item `dependencies` pattern). The multi-step version has validation-skip logic but only for single-string — needs array upgrade. The `FormSection.jsx` (used by the multi-step version) has rendering logic — also needs array upgrade.

---

## 5. Potential Risks and Edge Cases

### Risk 1: Daily Diary template file path
The Python worker's `generate_daily_diary_workbook` function needs the physical `.xlsx` template file at `python_worker/templates/Daily dairy all tables NO MULTIVALUED (1).xlsx`. This file contains the sheet names and multi-level header rows that define the column layout. If this file doesn't exist or is renamed, the daily diary export will fail silently (Python will raise FileNotFoundError which becomes a FAILED job status — not silent, but confusing).

**Mitigation:** Before Phase 3 implementation, verify:
```bash
ls python_worker/templates/
```
If the file doesn't exist, the alternative is to have Python create the workbook from scratch using the `REPORT_COLUMNS` dict and hardcoded header definitions. This is more work but eliminates the file dependency.

### Risk 2: record_linkage migration vs scripts/migrations.js
The `scripts/migrations.js` (Node.js, not Knex) also creates `record_links` and `link_type_registry`. After adding the Knex migration `20260621000000_record_linkage.js`, running both would fail with "table already exists." The fix is to add `hasTable` guards in `scripts/migrations.js` for these two tables:
```js
if (!(await knex.schema.hasTable('link_type_registry'))) {
  // create table
}
```
This must be done simultaneously with adding the Knex migration.

### Risk 3: Analytics endpoint — warehouse fallback logic
The new `getPeriodComparison` and `getYearOverYear` endpoints use `resolveQueryMode()` to decide LIVE vs WAREHOUSE. In development, the warehouse may not be populated (requires the background sync to have run at least once). If `WAREHOUSE_QUERY_MODE=AUTO` and warehouse is empty, the fallback to LIVE mode must handle the PostgreSQL JSONB extraction for `local_head` correctly. Test with an empty warehouse first.

### Risk 4: show_when migration timestamp collision
There are already migrations with timestamps `20260620400000` through `20260622000000`. The `conditional_fields` migration is given timestamp `20260620500000` — this fits between existing migrations. Verify that no other migration with this exact timestamp exists before creating the file. If the timestamp is taken, shift to `20260620510000`.

### Risk 5: DynamicForm.jsx (Ant Design) — Form.Item dependencies
The Form.Item `dependencies` prop triggers re-render when the named field changes. If the `show_when.field` references a field that hasn't been rendered yet (e.g., crime head is in a later section), the reactive update won't fire. This is an Ant Design limitation. Mitigation: ensure `local_head` and similar trigger fields appear in an earlier section than the conditional fields. Check `sort_order` values in `field_registry`.

### Risk 6: Custom definition size in report_jobs
Storing pre-classified daily diary data in `report_jobs.custom_definition` (JSONB) works for normal datasets. For a large district with 2000+ records, the JSON payload could be 20+ MB. PostgreSQL can handle it, but the Python worker loading this much data from the DB into memory per job could be slow.

**Future mitigation (not in current plan):** Store classified data in a temp file and store the file path in `custom_definition` instead. Not needed now, but document for Phase 3 if performance is poor.

### Risk 7: Analytics getSummary — map key mismatch
Current code initialises `data = { CASES: 0, ARREST: 0, PCR: 0, MISSING: 0 }`. DB stores `record_type` as `CASE` (not `CASES`) and `PCR_CALL` (not `PCR`). So the map never gets populated. The fix changes the keys AND the mapping logic. After fixing, ensure frontend dashboards are updated if they expect `CASES` as a key name.

### Risk 8: Python worker generator.py — silent failure pattern
The `get_predefined_definition()` function has an else-clause that returns a generic CASE report (uid/fir_no/fir_date only) for any unknown template ID. Jobs complete as READY with wrong data — no error raised. This is a pre-existing issue, not introduced by this plan. It should be fixed at some point by raising a ValueError for truly unknown templates.

### Risk 9: ExcelJS still imported in daily-diary.service.js after Phase 3
After removing the ExcelJS export, the `import ExcelJS from 'exceljs'` at the top of the service must also be removed, or Node.js startup will fail if ExcelJS is not installed (it's a dev dependency). Check `backend/package.json` to confirm ExcelJS is in `dependencies` (not just `devDependencies`). If it's used elsewhere (reports.controller.js), leave the package installed.

---

## 6. Non-Obvious Discoveries

### Discovery 1: report-builder module already exists in current branch
The previous conversation assumed `queryEngine.js`, `reportBuilder.router.js`, and `reportableFields.config.js` only existed in the feature branch. They actually exist in the current branch (`report-generation-ashmit`) and are mounted in app.js. No copying needed — the current branch's `queryEngine.js` has NO SQLite code (grep confirmed zero matches). This saves significant work.

### Discovery 2: daily-diary module already exists in current branch
Same situation. `daily-diary.service.js`, `daily-diary.controller.js`, and `daily-diary.router.js` all exist and are mounted. The service is fully implemented including all 34 REPORTS, all REPORT_COLUMNS definitions, and all classification helpers. The only issue is that the Excel export is done synchronously with ExcelJS instead of through the Python worker job queue.

### Discovery 3: record-links module already exists
`record-links.service.js`, `record-links.controller.js`, and `record-links.router.js` all exist and are mounted at `/api/record-links`. The record_links and link_type_registry **tables** exist (seeded via `scripts/migrations.js`), but the Knex migration tracking them doesn't exist — so `knex migrate:status` shows them as untracked. This creates a gap when setting up fresh environments.

### Discovery 4: analytics.controller.js has dead SQLite code
`getJsonPathSql()` function checks `db.client.config.client === 'sqlite3'` and branches. The project is PostgreSQL-only. This dead code must be removed before using the analytics module in a comparison/analytics expansion, or the `json_extract()` SQLite syntax might interfere with PostgreSQL queries in edge cases (though in practice, the `isPg` check would return true on PostgreSQL, so it's dead rather than wrong).

### Discovery 5: Warehouse layer is more complete than expected
The warehouse module is fully implemented: ETL sync every 5 minutes, backfill script, dimension + fact tables, `resolveQueryMode()` abstraction, LIVE/WAREHOUSE/AUTO modes. The `getWarehouseStats()` function returns counts from all tables. The new comparative analytics endpoints should plug into `resolveQueryMode()` immediately — it's designed for exactly this use case.

### Discovery 6: Two form component families, same props interface
Both DynamicForm families accept `recordType`, `initialData`, `onSubmit`, `readOnly`, `targetFields`. However, they're not interchangeable — different pages use different versions. Conditional field logic must be added to **both** to ensure consistent behaviour across the app. The Ant Design version (`DynamicForm/DynamicForm.jsx`) is likely used by newer HC/SHO entry forms. The multi-step version (`forms/DynamicForm.jsx`) is likely used by older registration pages.

### Discovery 7: compilation.service.js throws on re-compile
The `createCompilation` function does a raw INSERT with no uniqueness check. If a DISTRICT_OFFICER calls it twice for the same period (e.g., to pick up newly approved records), the second call throws a PostgreSQL unique constraint violation (compilations table has a unique index on source_entity_id+period). The feature branch fixes this with an UPSERT pattern. This is a real production bug, not a theoretical one.

### Discovery 8: Migrations are not in strict timestamp order
Some migrations have `.js` files out of numeric order in the filesystem. Knex uses the timestamp prefix for ordering. Verify the new migrations' timestamps don't conflict with existing ones before creating them. Current gaps where new files fit:
- `20260620500000` — between add_fields_metadata and record_linkage (SAFE, not taken)
- `20260621000000` — between conditional_fields and drop_fk (SAFE, not taken)
- `20260623000000` — after drop_fk (SAFE, not taken)

---

## 7. Current Implementation Status

| Phase | Component | Status | Notes |
|-------|-----------|--------|-------|
| 0.1 | db.js DATE fix | ❌ NOT DONE | One import + one line |
| 0.2 | record_linkage Knex migration | ❌ NOT DONE | Tables exist in DB via scripts/migrations.js |
| 1.1 | analytics SQLite cleanup | ❌ NOT DONE | getJsonPathSql() still present |
| 1.2 | analytics type normalization | ❌ NOT DONE | CASES/PCR bug active |
| 1.3 | analytics getSummary key fix | ❌ NOT DONE | Returns zeros for all types |
| 1.4 | compilation UPSERT | ❌ NOT DONE | Re-compile throws 500 |
| 2.1 | conditional_fields migration | ❌ NOT DONE | show_when values unset in DB |
| 2.2 | phone detail fields migration | ❌ NOT DONE | Fields don't exist in field_registry |
| 2.3 | FormSection.jsx array show_when | ❌ NOT DONE | Only single-string match |
| 2.4 | forms/DynamicForm.jsx array match | ❌ NOT DONE | Same issue in validation |
| 2.5 | DynamicForm/DynamicForm.jsx show_when | ❌ NOT DONE | No conditional logic at all |
| 3.1 | daily-diary.service.js queue export | ❌ NOT DONE | Still uses ExcelJS inline |
| 3.2 | daily-diary.controller.js 202 response | ❌ NOT DONE | Still streams buffer directly |
| 3.3 | generator.py DAILY_DIARY handler | ❌ NOT DONE | No branch for this type |
| 4.1 | analytics getPeriodComparison | ❌ NOT DONE | Endpoint doesn't exist |
| 4.2 | analytics getYearOverYear | ❌ NOT DONE | Endpoint doesn't exist |
| 4.3 | analytics.router.js new routes | ❌ NOT DONE | Routes not registered |

---

## 8. Recommended Execution Order

The phases have dependencies. Follow this exact order:

### Step 1 — Phase 0 (do together, they're small)
1. `backend/src/config/db.js` — add DATE type parser (2 lines)
2. `backend/migrations/20260621000000_record_linkage.js` — create file
3. Update `scripts/migrations.js` — add hasTable guard for record_links and link_type_registry

### Step 2 — Phase 1 (analytics cleanup, no dependencies on Phase 0)
4. `backend/src/modules/analytics/analytics.controller.js` — three bug fixes (SQLite removal, type norm, getSummary keys)
5. `backend/src/modules/compilation/compilation.service.js` — UPSERT logic

### Step 3 — Phase 2.1 + 2.2 (migrations first, then frontend)
6. `backend/migrations/20260620500000_conditional_fields.js` — create file (property show_when)
7. `backend/migrations/20260623000000_phone_detail_fields.js` — create file (phone fields + show_when)
8. Run `knex migrate:latest` to apply all new migrations
9. Verify via `GET /api/fields/form/CASE` that `show_when` is populated

### Step 4 — Phase 2.3–2.5 (frontend conditionals, can be done in parallel after Step 3)
10. `frontend/src/components/forms/FormSection.jsx` — array show_when (lines 57–63)
11. `frontend/src/components/forms/DynamicForm.jsx` — array match in validation skip
12. `frontend/src/components/DynamicForm/DynamicForm.jsx` — add Form.Item dependencies pattern

### Step 5 — Phase 3 (verify template file exists first)
13. Verify `python_worker/templates/Daily dairy all tables NO MULTIVALUED (1).xlsx` exists
14. `python_worker/generator.py` — add DAILY_DIARY branch + `generate_daily_diary_workbook()`
15. `backend/src/modules/daily-diary/daily-diary.service.js` — replace ExcelJS export with `queueDailyDiaryExport()`
16. `backend/src/modules/daily-diary/daily-diary.controller.js` — update exportExcel to return 202

### Step 6 — Phase 4 (independent, can be done after Step 2)
17. `backend/src/modules/analytics/analytics.controller.js` — add `getPeriodComparison` + `getYearOverYear`
18. `backend/src/modules/analytics/analytics.router.js` — register two new routes

---

## 9. Files to Create (New)

| File | Phase | Purpose |
|------|-------|---------|
| `backend/migrations/20260621000000_record_linkage.js` | 0.2 | Knex migration for record_links + link_type_registry |
| `backend/migrations/20260620500000_conditional_fields.js` | 2.1 | Sets show_when on property_description, property_status |
| `backend/migrations/20260623000000_phone_detail_fields.js` | 2.2 | Inserts phone_make, phone_model, phone_imei, phone_color, phone_status into field_registry |

---

## 10. Files to Modify (Existing)

| File | Phase | Change Summary |
|------|-------|----------------|
| `backend/src/config/db.js` | 0.1 | +2 lines: pg import + setTypeParser |
| `backend/scripts/migrations.js` | 0.2 | +hasTable guard around record_links/link_type_registry create blocks |
| `backend/src/modules/analytics/analytics.controller.js` | 1.1 + 1.2 + 1.3 + 4.1 | Remove SQLite code, fix type norm, fix getSummary, add 2 new endpoints |
| `backend/src/modules/analytics/analytics.router.js` | 4.3 | +2 routes |
| `backend/src/modules/compilation/compilation.service.js` | 1.4 | UPSERT pattern in createCompilation |
| `frontend/src/components/forms/FormSection.jsx` | 2.3 | Array show_when (7 lines, replace 6) |
| `frontend/src/components/forms/DynamicForm.jsx` | 2.4 | Array match in validation skip |
| `frontend/src/components/DynamicForm/DynamicForm.jsx` | 2.5 | Add show_when rendering logic |
| `backend/src/modules/daily-diary/daily-diary.service.js` | 3.1 | Replace exportDailyDiaryExcel with queueDailyDiaryExport |
| `backend/src/modules/daily-diary/daily-diary.controller.js` | 3.2 | Update exportExcel to 202+job_id |
| `python_worker/generator.py` | 3.3 | Add DAILY_DIARY branch, generate_daily_diary_workbook(), _mark_ready() helper |

---

## 11. Key Functions to Reuse (Don't Reinvent)

| Function | Location | Purpose |
|----------|----------|---------|
| `resolveQueryMode()` | `backend/src/modules/warehouse/warehouse.db.js` | Returns 'WAREHOUSE' or 'LIVE'; auto-fallback if warehouse empty |
| `wh(tableName)` | same file | Knex QueryBuilder for warehouse table (handles rpt schema prefix) |
| `publish(event, payload)` | `backend/src/events/eventBus.js` | RabbitMQ publish; always call AFTER transaction commits |
| `mapRecordsToSheets(records, date)` | `backend/src/modules/daily-diary/daily-diary.service.js` | Core 34-sheet classification — don't replicate in Python |
| `getRawRecords(date, psId, districtId, subDivId)` | same file | Compilation-aware scoped DB query |
| `resolveScope(user, query)` | `backend/src/modules/daily-diary/daily-diary.controller.js` | Role → {psId, districtId, subDivId} mapping |
| `getValidatedDate(req)` | same file | Timezone-correct date default + format validation |
| `parseSummary(row)` | `backend/src/modules/compilation/compilation.service.js` | Parses JSON columns from compilation rows |
| `logger` | `backend/src/utils/logger.js` | Winston — use logger.info/error, never console.log |

---

## 12. Environment Context

- PostgreSQL: `pharos_db` on localhost:5432
- RabbitMQ: amqp://localhost:5672 (Docker Compose)
- Python worker: separate process, reads same DB; started via `python python_worker/main.py` or similar
- Frontend: Vite dev server on :5173
- Backend: Express on :3000
- Reports directory: `./generated-reports/` (backend-relative, created on first use)

### Knex Migration Command
```bash
cd backend && node -e "import('./knexfile.js').then(m => import('knex').then(k => k.default(m.default.development).migrate.latest().then(console.log)))"
```
Or if there's a script in package.json: `npm run migrate`

---

## 13. What the Plan Does NOT Cover (Future Work)

1. **Frontend daily diary pages** — `DailyDiaryPage.jsx`, `DailyDiaryPreview.jsx` — these need to be built or updated to use the 202+poll flow. Currently unknown if they exist.
2. **Silent failure in generator.py** — the `get_predefined_definition()` else-clause returns generic CASE data for unknown templates. Should raise ValueError for truly unknown IDs.
3. **Report builder UI** — `reportBuilder.router.js` provides the API, but no frontend page uses it yet.
4. **JCP/SCP review chain** — workflow is currently HC→SHO→District→HQ. JCP and SCP levels in the TRANSITIONS config are incomplete.
5. **Large district data size** — if a district has 2000+ records, the DAILY_DIARY custom_definition JSON could be 20+ MB. May need chunking or file-based handoff to Python.
6. **ExcelJS in daily-diary.service.js** — after Phase 3 removes the inline export, the ExcelJS import and `__filename`/`__dirname` lines should also be cleaned up. Verify ExcelJS is still used elsewhere before removing the npm dependency.
