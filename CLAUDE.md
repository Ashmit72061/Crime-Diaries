# PHAROS — Project Context for AI Assistants

**Police Hierarchical Automated Reporting & Operations System**
Repo: `Crime-Diaries` | Stack: Node.js/Express + PostgreSQL + RabbitMQ + React/Vite

---

# AI Agent Rules

Before modifying code:

1. Read affected module completely.
2. Prefer existing patterns over introducing new ones.
3. Do not add new dependencies without justification.
4. Do not bypass RabbitMQ for cross-module communication.
5. Show implementation plan before large refactors.
6. Preserve backward compatibility for API routes.

---

## 1. Architecture Pillars (NON-NEGOTIABLE)

| Pillar | Rule |
|--------|------|
| Dynamic Field Registry | Forms render from `field_registry` DB rows. Zero hardcoded form fields ever. |
| JSONB Records | All domain data lives in `records.data JSONB`. New fields = insert to `field_registry`, not ALTER TABLE. |
| Event Bus Isolation | Modules never call each other directly. All cross-module comms via RabbitMQ `publish/subscribe`. |
| Append-only Audit | Every mutation writes to `record_revisions` + `audit_logs`. Records are never deleted — only status-changed. |
| Hierarchy as Config | `hierarchy_nodes` is a self-referencing tree. New PS/District/level = new row, zero code change. |
| Bilingual | Every label has `label_en` + `label_hi`. i18n is baked in from Day 1. |
| Config over Code | Workflow transitions, report templates, role permissions — all DB rows, not hardcoded logic. |

---

## 2. Hierarchy & Roles

```
HC (Head Constable) → SHO → DISTRICT_OFFICER → JCP → SCP → HQ_ANALYST / HQ_ADMIN / SYSTEM_ADMIN
```

| Role | Level | Scope |
|------|-------|-------|
| HC | PS | Own PS only (`ps_id`) |
| SHO | PS | Own PS only (`ps_id`) |
| DISTRICT_OFFICER | DISTRICT | Own district (`district_id`) |
| JCP | JCP | Sub-division (`sub_div_id`) |
| SCP | SCP | Range |
| HQ_ANALYST | HQ | All districts (read-only) |
| HQ_ADMIN | HQ | All districts + config |
| SYSTEM_ADMIN | SYSTEM | Everything |

---

## 3. Workflow States

```
DRAFT → PENDING_SHO → DISTRICT_REVIEW → COMPILED → JCP_REVIEW → SCP_REVIEW → HQ_RECEIVED → ARCHIVED
              ↓ send-back           ↓ send-back
         SENT_BACK (→ HC)      SENT_BACK_PS (→ SHO)

Special: LEGACY_IMPORTED (bypasses all workflow), AMENDMENT_PENDING
```

**State machine lives in** `records.service.js` → `transitionRecord()` TRANSITIONS config object.  
Adding new state = add entry to TRANSITIONS. Do NOT add if/else chains.

---

## 4. Backend — Directory Structure

```
backend/
├── src/
│   ├── app.js                    # Express setup, route registration, event handler init
│   ├── config/
│   │   ├── db.js                 # Knex PostgreSQL pool
│   │   ├── env.js                # All env vars (validated)
│   │   └── swagger.js            # Swagger spec
│   ├── events/
│   │   ├── eventBus.js           # RabbitMQ publish/subscribe (topic exchange: 'pharos')
│   │   └── handlers/
│   │       ├── auditHandler.js   # Subscribes 'record.*' → writes record_revisions
│   │       └── notifyHandler.js  # Subscribes 'record.status_changed', 'compilation.submitted'
│   ├── middleware/
│   │   ├── auth.middleware.js    # authMiddleware — JWT Bearer verify → req.user
│   │   ├── rbac.middleware.js    # allow(...roles), enforceScope, verifyRecordAccess
│   │   ├── validate.middleware.js # express-validator error collector → 422
│   │   ├── rateLimiter.middleware.js
│   │   ├── upload.middleware.js  # Multer config
│   │   └── error.middleware.js
│   ├── modules/
│   │   ├── auth/                 # login, refresh, logout, /me, change-password [Dev 1]
│   │   ├── users/                # CRUD for user management [Dev 1]
│   │   ├── hierarchy/            # hierarchy_nodes CRUD + tree API [Dev 1]
│   │   ├── audit/                # getRecordAudit, getUserAudit, getAuditLogs [Dev 1]
│   │   ├── reports/              # Puppeteer PDF + CSV, 5 templates, async jobs [Dev 1]
│   │   ├── records/              # CRUD + submit/approve/send-back/override [Dev 2]
│   │   ├── fields/               # field_registry CRUD + /form/:record_type [Dev 2]
│   │   ├── workflow/             # Queue endpoint (delegates to records.service) [Dev 2]
│   │   ├── compilation/          # District roll-up → HQ submission [Dev 2]
│   │   ├── analytics/            # overview, trends, by-ps, by-crime-head, status-breakdown [Dev 2]
│   │   ├── notifications/        # list, unread count, mark-read, event handlers [Dev 2]
│   │   ├── upload/               # File upload (Multer/Cloudinary) [Dev 2]
│   │   └── admin/                # customFields, admin stats [Dev 1]
│   └── utils/
│       ├── ApiError.js           # throw new ApiError(statusCode, message)
│       ├── ApiResponse.js
│       ├── generateToken.js      # JWT sign/verify
│       ├── logger.js             # Winston
│       └── helpers.js
├── scripts/
│   ├── migrations.js             # Run once: node scripts/migrations.js
│   ├── seed-fields.js            # Seeds field_registry from master sheet
│   └── seed-mock-data.js         # Seeds 9 PS, 3 districts, 50+ records
└── index.js                      # Entry point (delegates to app.js startServer)
```

**File naming:** Each module has `*.router.js` (active, imported by app.js). Old `*.routes.js` files are orphaned — do NOT import them.

---

## 5. Database Tables (12 core)

| Table | Purpose |
|-------|---------|
| `hierarchy_nodes` | Self-referencing PS/District/JCP/HQ tree |
| `users` | badge_no, role, ps_id, station_id, district_id, sub_div_id, password_hash |
| `field_registry` | field_key, field_type, label_en/hi, applicable_record_types, validation_rules, section, sort_order |
| `records` | id, record_type, ps_id, district_id, sub_div_id, data JSONB, current_status, current_level, record_date, created_by, updated_by |
| `record_revisions` | Append-only ledger: record_id, revision_number, change_type, field_changes JSONB, changed_by, ip_address, reason |
| `workflow_transitions` | from_status, to_status, from_level, to_level, action, performed_by, comment, target_fields JSONB |
| `audit_logs` | table_name, record_id, action, changed_by_id, changed_by_role, field_name, old_value, new_value, ip_address |
| `compilations` | district_id, period, status, record_ids JSONB, compiled_by, target_route, submitted_by |
| `report_jobs` | template_id, filters JSONB, format, status (pending/READY/FAILED), file_path, created_by |
| `notifications` | user_id, type, title, body, message, record_id, related_entity_id, is_read |
| `custom_field_definitions` | EAV field definitions |
| `custom_field_values` | EAV field values per record |

**Run migrations:** `node scripts/migrations.js` (idempotent — uses `CREATE TABLE IF NOT EXISTS`)

---

## 6. API Conventions

- Base URL: `/api/v1/` and `/api/` (both registered — dual compatibility)
- All responses: `{ success: true/false, data: {}, message?: "" }`  
- Errors: `{ success: false, message: "..." }` with appropriate HTTP status
- Auth: `Authorization: Bearer <token>` header
- Pagination: `?page=1&limit=20` → response includes `meta: { page, limit, total }`

**Key endpoints:**

| Module | Endpoint | Auth |
|--------|----------|------|
| Auth | `POST /api/auth/login` | Public |
| Auth | `GET /api/auth/me` | Bearer |
| Records | `POST /api/records` | HC only |
| Records | `POST /api/records/:id/submit` | HC only |
| Records | `POST /api/records/:id/approve` | SHO, DISTRICT_OFFICER |
| Records | `POST /api/records/:id/send-back` | SHO, DISTRICT_OFFICER |
| Records | `PATCH /api/records/:id/override` | DISTRICT_OFFICER, HQ_ADMIN |
| Records | `GET /api/records/queue` | All roles (scoped) |
| Fields | `GET /api/fields/form/:record_type` | Authenticated |
| Workflow | `GET /api/workflow/queue` | SHO, DISTRICT_OFFICER |
| Compilations | `POST /api/compilations` | DISTRICT_OFFICER |
| Reports | `POST /api/reports/generate` | Authenticated |
| Reports | `GET /api/reports/status/:id` | Authenticated |
| Analytics | `GET /api/analytics/overview` | Authenticated |
| Audit | `GET /api/audit/record/:recordId` | Authenticated |

---

## 7. RBAC Implementation

```js
// In router:
router.use(authMiddleware, enforceScope);        // sets req.user + req.jurisdictionQuery
router.post('/', allow('HC'), controller.create); // role check

// enforceScope sets req.jurisdictionQuery:
// HC/SHO → { ps_id }
// DISTRICT_OFFICER → { district_id }
// HQ_ANALYST/HQ_ADMIN/SYSTEM_ADMIN → {} (global)

// In service — always pass jurisdictionQuery to filter queries:
if (jurisdictionQuery.ps_id) query = query.where('records.ps_id', jurisdictionQuery.ps_id);
```

**verifyRecordAccess(recordId, user)** — called on every single-record operation to check geographical ownership.

---

## 8. Event Bus

```js
// Publish
await publish('record.status_changed', { recordId, action, from_status, to_status, performed_by });

// Subscribe (in handler files initialized in app.js startServer())
await subscribe('record.*', 'audit-queue', async (payload) => { /* write to record_revisions */ });

// Active events:
// record.created, record.updated, record.submitted, record.approved, record.sent_back
// record.status_changed, record.overridden
// compilation.submitted
// legacy.batch_imported (Phase 2)
```

---

## 9. Frontend — Directory Structure

```
frontend/src/
├── api/
│   ├── axios.js          # Axios instance with Bearer token interceptor
│   └── auth.api.js       # Auth API calls
├── components/
│   ├── DynamicForm/
│   │   └── DynamicForm.jsx   # Renders fields from GET /fields/form/:record_type
│   ├── layout/           # Shell, PoliceSidebar, PoliceNavbar, DashboardLayout
│   └── ui/               # Button, Card, Input, Modal, Spinner, ReportModal
├── context/
│   └── AuthContext.jsx   # React Context — user state, login/logout
├── features/
│   └── auth/             # LoginPage, RegisterPage
├── hooks/
│   ├── useAuth.js        # Reads AuthContext
│   └── useDebounce.js
├── i18n/
│   ├── config.js         # react-i18next setup
│   ├── en.json           # English strings
│   └── hi.json           # Hindi strings
├── pages/
│   ├── Dashboard.jsx / DashboardPage.jsx
│   ├── ArrestManagement.jsx
│   ├── CaseManagement.jsx
│   ├── PCRCallEntry.jsx
│   ├── MissingPersonEntry.jsx
│   ├── UIDBManagement.jsx
│   ├── queue/QueuePage.jsx       # SHO approval queue
│   ├── records/RegistrationPage.jsx
│   ├── analytics/AnalyticsPage.jsx
│   ├── reports/ReportsPage.jsx
│   ├── admin/
│   │   ├── UsersPage.jsx
│   │   ├── HierarchyPage.jsx
│   │   └── AuditPage.jsx
│   └── sho/              # SHO-specific pages (from recent pull)
├── routes/
│   ├── AppRouter.jsx     # All routes + lazy loading
│   └── ProtectedRoute.jsx # Redirects to login if no token
├── store/
│   └── authStore.js      # Zustand store for auth state
└── utils/
    ├── api.js            # Shared API helpers (from recent pull)
    ├── constants.js
    ├── formatters.js
    ├── hierarchyData.js
    ├── policeData.js
    └── validators.js
```

**DynamicForm contract:**
```jsx
<DynamicForm
  recordType="ARREST"           // fetches fields from /api/fields/form/ARREST
  initialData={record.data}     // pre-fill on edit
  onSubmit={handleSubmit}
  readOnly={false}
  highlightedFields={[]}        // Phase 2: amber highlight on send-back fields
  visibleFields={[]}            // Phase 2: Level Data Contract filtering
  showDiff={{ old, new }}       // Phase 2: audit diff view
/>
```

---

## 10. records.service.js — Key Functions

| Function | Description |
|----------|-------------|
| `listRecords(type, filters, jurisdictionQuery)` | Joins ps/district/user, applies scope + filters |
| `getRecordDetails(id)` | Record + revisions + transitions + customFields |
| `createRecord(user, type, date, data, ip)` | DB transaction: insert record + revision + audit_log, publish event |
| `updateRecord(id, user, data, ip)` | DB transaction: diff, update, revision, audit_log |
| `submitRecord(id, user)` | DRAFT/SENT_BACK → PENDING_SHO, writes transition + audit |
| `transitionRecord(id, user, action, comment, targetFields, ip)` | State machine — TRANSITIONS config object |
| `overrideCaseHead(id, user, newHead, reason, ip)` | HEAD_OVERRIDE revision, requires reason ≥ 10 chars |

**TRANSITIONS config (in transitionRecord):**
```js
PENDING_SHO: {
  approve:    { to: 'DISTRICT_REVIEW', toLevel: 'DISTRICT' },
  send_back:  { to: 'SENT_BACK', toLevel: 'PS', requiresComment: true }
},
DISTRICT_REVIEW: {
  approve:    { to: 'HQ_RECEIVED', toLevel: 'HQ' },
  send_back:  { to: 'SENT_BACK', toLevel: 'PS', requiresComment: true }
}
```

---

## 11. Environment Variables

```env
# backend/.env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pharos_db
DB_USER=postgres
DB_PASSWORD=...
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=...
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
FRONTEND_URL=http://localhost:5173
REPORTS_DIR=./generated-reports
```

---

## 12. Running the Project

```bash
# Start all services (from repo root)
npm run dev                    # runs backend + frontend via concurrently

# Backend only
cd backend && npm run dev      # nodemon on index.js

# Frontend only
cd frontend && npm run dev     # Vite dev server on :5173

# First time DB setup
cd backend && node scripts/migrations.js
node scripts/seed-fields.js
node scripts/seed-mock-data.js

# Docker (PostgreSQL + RabbitMQ)
docker-compose up -d
```

---

## 13. Known Issues & Important Notes

1. **`records.router.js` has local changes** — stash before `git pull` or it aborts merge.
2. **Old `*.routes.js` files** in modules — orphaned, not imported, ignore them.
3. **Dual router files** — `analytics.routes.js` + `analytics.router.js` both exist. Only `*.router.js` is imported by `app.js`.
4. **`validate.middleware.js` exists** but is **NOT wired to any route** — no `express-validator` chains anywhere. API bodies are largely unvalidated at the controller layer (only basic existence checks).
5. **notifications.service.js** — `initSubscriptions()` uses a different `subscribe` signature than `auditHandler.js`. The notification subscriptions may not be initialized on startup (check `notifyHandler.js` `init()` instead).
6. **Report templates** are in-memory arrays in `reports.controller.js` — not in a DB `report_templates` table. Adding new templates requires a code deploy.

---

## 14. Phase Roadmap

| Phase | Status | Scope |
|-------|--------|-------|
| Phase 1 | ✅ Done | JWT auth, RBAC, 3 record types, HC→SHO→District workflow, compilation, audit, basic analytics, PDF/CSV reports, RabbitMQ, i18n, mock data |
| Phase 2 | 🔵 Active (8–10 weeks) | Keycloak/MFA, legacy import, JCP/SCP chain, Level Data Contracts, filter engine, 10+ report templates, advanced analytics, MinIO, offline PWA, admin UI, scheduled reports, hash-sealed audit |
| Phase 3 | Planned | Infrastructure hardening, Elasticsearch, performance testing (250 PS load) |
| Phase 4 | Planned | Full district rollout (15–20 PS) |

### Phase 2 New DB Tables Needed
- `workflow_transitions_config` — DB-driven state machine config
- `legacy_import_batches` — tracks import jobs
- `legacy_amendments` — correction requests for imported records
- `level_data_contracts` — which fields each level sees
- `filter_presets` — saved AND/OR filter specs
- Columns on `records`: `is_legacy`, `source_system`, `imported_at`, `imported_by`, `legacy_ref`

### Phase 2 New API Modules
- `POST /legacy/import` — CSV/XLSX bulk import with dry-run mode
- `GET /filters/presets`, `POST /filters/apply` — filter engine
- `GET /records/check-duplicate` — dedup check
- `GET /analytics/ps-comparison`, `GET /analytics/beat-wise` — advanced analytics
- `POST /reports/schedule` — cron-based scheduled reports

---

## 15. Code Conventions

- **ES Modules** throughout (`import/export`, `"type": "module"` in package.json)
- **Async/await** everywhere — no callbacks
- **DB transactions** for all multi-table writes: `db.transaction(async trx => { ... })`
- **Error pattern**: throw `new Error('message')` in services; controllers catch and return appropriate HTTP status
- **Always publish event AFTER transaction commits** (outside the `db.transaction` block)
- **Router pattern**: `router.use(authMiddleware, enforceScope)` at top, then `router.get('/', handler)` without repeating middleware
- **Knex** for all DB queries — no raw SQL except for complex JSONB operations
- **Logger**: use `logger.info/error/warn` from `utils/logger.js` — never `console.log` in production paths
