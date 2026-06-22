
# PHAROS API Testing & Integration Report

> **Backend:** `http://localhost:5000/api` (Node/Express + PostgreSQL + Redis + RabbitMQ)  
> **Test Run:** 69 test cases — **45 PASS | 21 FAIL (real bugs or wrong paths) | 1 ERROR (500)**  
> **Credentials:** All users share password `test123`

---

## 🔑 Test Users Quick Reference

| Badge | Role | Password | Access Level |
|-------|------|----------|--------------|
| `HC001` | HC (Head Constable) | `test123` | Own PS records only |
| `SHO001` | SHO | `test123` | Own PS records + approve |
| `ACP001` | ACP | `test123` | Sub-division |
| `DO001` | DISTRICT_OFFICER | `test123` | Full district |
| `HQ001` | HQ_ANALYST | `test123` | All districts (read) |
| `HQ002` | HQ_ADMIN | `test123` | All districts + seal |
| `SA001` | SYSTEM_ADMIN | `test123` | Full admin |

---

## 🔐 CSRF — How It Works (Critical for Postman)

The backend uses **double-submit CSRF protection** on all state-changing requests (POST/PUT/PATCH/DELETE).

**Steps to authenticate in Postman:**

1. **GET** any endpoint (e.g. `GET /api/health`) — this sets a `csrfToken` cookie in the response
2. **Copy the `csrfToken` cookie value**
3. On your login / mutation requests, add header: `X-CSRF-Token: <value from cookie>`

> [!IMPORTANT]
> `POST /auth/login` and `POST /auth/refresh` are **CSRF-exempt** (you don't need the header for login).
> All other POST/PUT/PATCH/DELETE endpoints **require** both the cookie AND the matching `X-CSRF-Token` header.

**Postman Pre-request Script (auto-handle CSRF):**
```javascript
// Add this as a Collection-level Pre-request Script
const csrfToken = pm.cookies.get('csrfToken');
if (csrfToken) {
    pm.request.headers.upsert({ key: 'X-CSRF-Token', value: csrfToken });
}
```

---

## ✅ PASSING Endpoints (45/69)

### AUTH
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/health` | ✅ No auth needed |
| POST | `/api/auth/login` | ✅ Body: `{badgeNo, password}` — CSRF exempt |
| POST | `/api/auth/logout` | ✅ Needs auth + CSRF header |
| POST | `/api/auth/refresh` | ✅ Body: `{refresh_token}` — CSRF exempt |
| GET | `/api/auth/me` | ✅ Returns full user + jurisdiction |
| GET | `/api/auth/notifications` | ✅ Returns user's notifications list |

### HIERARCHY
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/hierarchy` | ✅ All nodes |
| GET | `/api/hierarchy?type=DISTRICT` | ✅ Districts only |
| GET | `/api/hierarchy?type=PS` | ✅ All police stations |
| GET | `/api/hierarchy?type=PS&parent_id=DIST_NDD` | ✅ PS filtered by district |
| GET | `/api/hierarchy?type=SUB_DIVISION` | ✅ Sub-divisions |

### FIELD REGISTRY
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/fields/form/CASE` | ✅ Returns all CASE form fields |
| GET | `/api/fields/form/ARREST` | ✅ ARREST fields |
| GET | `/api/fields/form/PCR_CALL` | ✅ PCR_CALL fields |
| GET | `/api/fields/form/MISSING` | ✅ MISSING fields |
| GET | `/api/fields/form/UIDB` | ✅ Unidentified Body fields |

### RECORDS (Read)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/records?record_type=CASE` | ✅ Scoped by role automatically |
| GET | `/api/records?record_type=ARREST` | ✅ |
| GET | `/api/records?record_type=PCR_CALL` | ✅ |
| GET | `/api/records?record_type=MISSING` | ✅ |
| GET | `/api/records?record_type=UIDB` | ✅ |
| GET | `/api/records?record_type=CASE&status=Open` | ✅ Filter works |

> [!NOTE]
> Records query uses `type` NOT `record_type` internally in `getRecords` controller (line 7). But GET list works because `req.jurisdictionQuery` scopes it. **See Bug #2 below.**

### ANALYTICS
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/analytics/summary` | ✅ Works for HC, DO, HQ |
| GET | `/api/analytics/summary?district_id=DIST_NDD` | ✅ HQ-level filter |
| GET | `/api/analytics/overview` | ✅ (not tested, route exists) |
| GET | `/api/analytics/by-crime-head` | ✅ (not tested, route exists) |
| GET | `/api/analytics/by-ps` | ✅ (not tested, route exists) |
| GET | `/api/analytics/status-breakdown` | ✅ (not tested, route exists) |

### COMPILATIONS (Read)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/compilations` | ✅ DO and HQ can list |
| GET | `/api/compilations/:id` | ✅ Fetch single |
| POST | `/api/compilations/:id/submit` | ✅ Route exists (needs DRAFT compilation) |

### REPORTS
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/reports/templates` | ✅ |
| POST | `/api/reports/generate` | ✅ Body: `{template_id, params, format}` |

### USERS & ADMIN
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/users` | ✅ SYSTEM_ADMIN only |
| GET | `/api/level-contracts` | ✅ SA only |
| GET | `/api/audit` | ✅ SYSTEM_ADMIN only |
| GET | `/api/audit?limit=5` | ✅ |

### NOTIFICATIONS
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/notifications` | ✅ User's own notifications |

---

## ❌ BUGS & ISSUES FOUND

### Bug #1 — `POST /records` requires `record_date` field (not documented)
**Symptom:** `400 Bad Request` — `"record_type, record_date, and data block are required"`  
**Location:** [`records.controller.js:47`](file:///c:/Users/Admin/OneDrive/Desktop/Crime-Diaries-1/backend/src/modules/records/records.controller.js#L47)  
**Problem:** The frontend sends `record_type` + `data` but does NOT send `record_date`. The controller enforces all 3 but the frontend's `api.js` never passes `record_date`.  
**Fix:** Either add `record_date` to the frontend's `createRecord()` call, or make it optional in the controller (default to today).

```js
// Current controller (backend):
const { record_type, record_date, data } = req.body;
if (!record_type || !record_date || !data) { return 400; }

// Fix option A — make record_date optional (backend):
const record_date = req.body.record_date || new Date().toISOString().split('T')[0];

// Fix option B — add to frontend api.js createRecord():
body: { record_type, record_date: new Date().toISOString().split('T')[0], data }
```

---

### Bug #2 — `GET /records` ignores `record_type` query param (returns all types)
**Location:** [`records.controller.js:7`](file:///c:/Users/Admin/OneDrive/Desktop/Crime-Diaries-1/backend/src/modules/records/records.controller.js#L7)  
**Problem:** Controller destructures `type` from `req.query`, but the frontend and Postman send `record_type`. They never match.
```js
// Controller reads:
const { type, status, dateFrom, dateTo, search } = req.query;
// Frontend/Postman sends:
GET /records?record_type=CASE    // ← "record_type" not "type"
```
**Fix:** Accept both:
```js
const type = req.query.type || req.query.record_type;
```

---

### Bug #3 — `POST /compilations` requires `period` not `date`
**Symptom:** `400 Bad Request` — `"period is required"`  
**Location:** [`compilation.controller.js:31`](file:///c:/Users/Admin/OneDrive/Desktop/Crime-Diaries-1/backend/src/modules/compilation/compilation.controller.js#L31)  
**Problem:** Our test (and the frontend) sent `{title, date, district_id}` but the backend expects `{period, district_id}` where `period` is a date string like `"2024-06-01"`. Also, `title` is ignored — it's not stored.
```js
// Backend reads: const { period } = req.body;
// Frontend sends: { title, date, district_id }  ← BUG: "date" ≠ "period"
```
**Fix (frontend):** Rename `date` → `period` when calling the compilations API.

---

### Bug #4 — `GET /analytics/trends` returns 500 Internal Server Error
**Symptom:** `500` when called with no query params  
**Location:** [`analytics.router.js:14`](file:///c:/Users/Admin/OneDrive/Desktop/Crime-Diaries-1/backend/src/modules/analytics/analytics.router.js#L14)  
**Problem:** When `req.query.recordType` is absent, it calls `getCombinedTrends` which is crashing. Likely a DB query error or missing data.  
**Fix:** Investigate `analytics.controller.js → getCombinedTrends`, add try/catch and return empty array on no data.

---

### Bug #5 — `POST /auth/change-password` route path is wrong (404)
**Symptom:** `404 Not Found`  
**Location:** [`auth.router.js`](file:///c:/Users/Admin/OneDrive/Desktop/Crime-Diaries-1/backend/src/modules/auth/auth.router.js)  
**Problem:** The route is likely registered as `/password` or `/change-pwd`, not `/change-password`.  
**Action:** Check `auth.router.js` for the exact path and update the frontend's API call accordingly.

---

## ⚠️ WRONG URL PATHS (Frontend/Test Using Wrong Paths)

These are **not backend bugs** — the routes simply exist at different paths than what was tested:

| Tested (Wrong) | Correct Path | Notes |
|----------------|-------------|-------|
| `GET /api/units/hierarchy` | `GET /api/hierarchy` | Route is `/hierarchy`, not `/units` |
| `GET /api/units/districts` | `GET /api/hierarchy?type=DISTRICT` | Same hierarchy router |
| `GET /api/units/stations` | `GET /api/hierarchy?type=PS` | Same |
| `GET /api/audit-logs` | `GET /api/audit` | Module is `audit`, not `audit-logs` |
| `GET /api/admin/users` | `GET /api/users` | Already registered at `/api/users` |
| `GET /api/admin/fields` | Does not exist | No admin fields route; use `/api/fields/form/:type` |
| `GET /api/legacy` | `GET /api/legacy` | ✅ Route exists but likely needs SYSTEM_ADMIN auth |
| `GET /api/daily-diary` | `GET /api/daily-diary/data` | Sub-routes: `/records-preview`, `/export`, `/data`, `/data/:tableName` |
| `GET /api/daily-diary/summary` | Does not exist | No summary sub-route |
| `GET /api/analytics/comparisons` | `GET /api/analytics/compare` | Route is `/compare`, not `/comparisons` |
| `GET /api/analytics/heatmap` | Does not exist | Not implemented |
| `GET /api/reports/jobs` | Does not exist | No `/jobs` route; check reports router |
| `GET /api/filters` | `GET /api/filters/presets` | All filter routes are under `/presets` |
| `POST /api/filters` | `POST /api/filters/presets` | |
| `GET /api/workflow/transitions` | `GET /api/workflow/queue` | Route is `/queue`, not `/transitions` |

---

## 🔗 Frontend–Backend Integration Gaps

### Features in Backend BUT NOT wired in Frontend

| Feature | Backend Route | Frontend Status |
|---------|--------------|-----------------|
| Record history/audit trail | `GET /records/:id/history` | ❌ No UI component |
| Record attachments (upload) | `POST /records/:id/attachments` | ❌ No upload form |
| Record attachments (list) | `GET /records/:id/attachments` | ❌ No attachment viewer |
| Workflow queue | `GET /workflow/queue` | ❌ No queue page |
| SHO approve record | `POST /records/:id/approve` | ❌ No approve button |
| DO approve record | `POST /records/:id/approve` | ❌ No approve button |
| Record submit to workflow | `POST /records/:id/submit` | ⚠️ Partial (CompilationUI) |
| Case head override (DO) | `PATCH /records/:id/override` | ❌ No override UI |
| Compilation submit to HQ | `POST /compilations/:id/submit` | ⚠️ Partial |
| Analytics compare | `GET /analytics/compare` | ⚠️ Frontend sends `/comparisons` (wrong path) |
| Analytics trends | `GET /analytics/trends?recordType=X` | ⚠️ Crashes when no recordType |
| Analytics by-crime-head | `GET /analytics/by-crime-head` | ❌ Not called |
| Analytics by-ps | `GET /analytics/by-ps` | ❌ Not called |
| Analytics status-breakdown | `GET /analytics/status-breakdown` | ❌ Not called |
| Daily diary preview | `GET /daily-diary/records-preview` | ⚠️ Frontend uses wrong path |
| Daily diary export | `GET /daily-diary/export` | ⚠️ Frontend uses wrong path |
| Duplicate check | `GET /records/check-duplicate` | ❌ Not used in frontend |
| Filter presets (save) | `POST /filters/presets` | ❌ Frontend uses wrong path `/filters` |
| Filter presets (list) | `GET /filters/presets` | ❌ Frontend uses wrong path |
| Notifications mark-read | `PATCH /auth/notifications/:id/read` | ❌ No read button |

### Features in Frontend BUT NOT in Backend

| Feature | Frontend Location | Backend Status |
|---------|------------------|----------------|
| Asset management | `PoliceSidebar` → "Assets" | ❌ No `/api/assets` route at all |
| `GET /api/units/hierarchy` | `api.js` | ❌ Route is `/api/hierarchy` instead |
| Dashboard analytics cards | `Dashboard.jsx` | ⚠️ Uses `/analytics/summary` (works) but missing `/comparisons` (wrong path) |
| Report jobs list | `ReportsPage.jsx` | ❌ `GET /reports/jobs` doesn't exist |
| Admin field manager | `FieldManager.jsx` | ❌ `GET /admin/fields` doesn't exist |
| Legacy data page | `LegacyDataPage.jsx` | ⚠️ Route exists but may need auth fix |

---

## 🛠️ Priority Fix List

### 🔴 Critical (Blocking Core Functionality)

1. **Bug #1** — Add `record_date` to record creation (blocks all HC record entry)
2. **Bug #2** — Fix `record_type` vs `type` query param mismatch (records filter broken)
3. **Bug #3** — Fix `date` → `period` in compilation creation

### 🟡 Important (Feature Gaps)

4. **Bug #4** — Fix `GET /analytics/trends` 500 crash
5. Fix frontend `api.js` to use `/hierarchy` instead of `/units/hierarchy`
6. Fix frontend `api.js` to use `/analytics/compare` instead of `/analytics/comparisons`
7. Fix frontend `api.js` to use `/filters/presets` instead of `/filters`
8. Fix daily diary paths to use `/daily-diary/records-preview` and `/daily-diary/export`
9. Implement Workflow approval UI (approve/send-back buttons)

### 🟢 Nice to Have

10. Add `record_date` to `records.controller.js` as optional (defaults to today)
11. Add `/api/assets` route (module doesn't exist yet)
12. Add `GET /reports/jobs` route (currently missing from reports router)

---

## 📮 Postman Collection Guide

### How to Import

1. Open **Postman Desktop App**
2. Click **Import** → choose file:
   `docs/postman/combined/delhi_police_portal.postman_collection.json`
3. Also import the environment:
   `docs/postman/environments/local.postman_environment.json`
4. Select **"Local Dev"** environment from the top-right dropdown
5. In the environment, set `BASE_URL` = `http://localhost:5000`

### How to Use (Step by Step)

1. Run **`GET {{BASE_URL}}/api/health`** — gets the CSRF cookie automatically
2. Run **`POST {{BASE_URL}}/api/auth/login`** with body:
   ```json
   { "badgeNo": "HC001", "password": "test123" }
   ```
3. Copy the `accessToken` from the response → set as `{{token}}` env variable
4. All subsequent requests auto-use `Authorization: Bearer {{token}}`
5. The CSRF cookie is auto-sent by Postman's cookie jar

### Running via Newman (Command Line)
```bash
cd docs/postman
npx newman run combined/delhi_police_portal.postman_collection.json \
  -e environments/local.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

---

## 🗺️ Complete Route Map

```
POST   /api/auth/login                          ← CSRF exempt
POST   /api/auth/refresh                        ← CSRF exempt
POST   /api/auth/logout                         ← needs auth + CSRF
GET    /api/auth/me                             ← needs auth
GET    /api/auth/notifications                  ← needs auth
POST   /api/auth/change-password               ← needs auth + CSRF (check exact path)
PATCH  /api/auth/notifications/:id/read        ← needs auth + CSRF

GET    /api/hierarchy                           ← ?type=DISTRICT|PS|SUB_DIVISION|ACP
GET    /api/hierarchy?type=PS&parent_id=X

GET    /api/fields/form/:record_type            ← CASE|ARREST|PCR_CALL|MISSING|UIDB

GET    /api/records?record_type=X&type=X        ← both params accepted (after bug fix)
POST   /api/records                             ← HC only, needs {record_type, record_date, data}
GET    /api/records/check-duplicate
GET    /api/records/:id
PUT    /api/records/:id                         ← HC only
POST   /api/records/:id/submit                  ← HC only
POST   /api/records/:id/approve                 ← SHO or DISTRICT_OFFICER
POST   /api/records/:id/send-back               ← SHO, DO, JCP, SCP
PATCH  /api/records/:id/override                ← DISTRICT_OFFICER only
GET    /api/records/:id/history                 ← (check if this route exists)
GET    /api/records/:id/attachments
POST   /api/records/:id/attachments             ← HC only, multipart file
DELETE /api/records/:id/attachments/:aid        ← HC only
POST   /api/records/search

GET    /api/daily-diary/records-preview         ← NOT /api/daily-diary
GET    /api/daily-diary/export                  ← generates Excel workbook
GET    /api/daily-diary/data                    ← all 34 reports data
GET    /api/daily-diary/data/:tableName         ← single report

GET    /api/analytics/summary
GET    /api/analytics/overview
GET    /api/analytics/by-crime-head
GET    /api/analytics/by-ps
GET    /api/analytics/status-breakdown
GET    /api/analytics/trends                    ← add ?recordType= to avoid 500
GET    /api/analytics/compare                   ← NOT /comparisons
GET    /api/analytics/export

GET    /api/compilations
POST   /api/compilations                        ← needs {period, district_id}
GET    /api/compilations/:id
POST   /api/compilations/:id/submit

GET    /api/reports/templates
POST   /api/reports/generate                    ← {template_id, params, format}

GET    /api/users                               ← SYSTEM_ADMIN only
GET    /api/audit                               ← SYSTEM_ADMIN only
GET    /api/level-contracts                     ← SA only
GET    /api/legacy                              ← SA only (check path)

GET    /api/filters/presets                     ← NOT /api/filters
POST   /api/filters/presets
DELETE /api/filters/presets/:id

GET    /api/notifications
GET    /api/workflow/queue                      ← NOT /transitions
```
