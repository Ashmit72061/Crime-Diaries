# Delhi Police Crime Diary Portal – Daily Diary Reporting Backend

This document is the integration reference for the **Daily Diary** reporting module
(`backend/src/modules/daily-diary`). It covers the HTTP API, the exact response
shapes, the full catalog of the **34 reports**, scoping/auth rules, and the known
gaps a frontend developer needs to plan around.

The module dynamically queries the existing transaction database (`records`),
aggregates/filters in memory, and emits the Daily Diary package. It is fully
decoupled from the Puppeteer HTML→PDF report backend.

> **Status for frontend:** the API can produce per-report **counts** (JSON) and a
> compiled **XLSX** download. It does **not** yet return per-report **row data as
> JSON** — see [§7 Frontend Data Access](#7-frontend-data-access--current-limitation).

---

## 1. Quick Start

| | |
|---|---|
| Base URL (dev) | `http://localhost:5000` (the backend `PORT` in `backend/.env` is **5000**; `3000` is only the in-code fallback) |
| Auth | `Authorization: Bearer <JWT>` on every request |
| Versioned path | `/api/v1/daily-diary/...` |
| Legacy path | `/api/daily-diary/...` (identical behavior) |
| Content (export) | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| Content (preview) | `application/json` |

---

## 2. API Endpoints

Both endpoints accept the **same** query params:

| Param | Required | Format | Notes |
|-------|----------|--------|-------|
| `date` | No | `YYYY-MM-DD` | Defaults to **today** (server local date). Any other format → `400`. |
| `psId` | No | string id | Filter to one Police Station. Honored only if the caller's role is allowed to see that PS (see §4). |
| `districtId` | No | string id | Filter to one District. Honored only for HQ roles or the matching DISTRICT_OFFICER. |

### 2.1 `GET /records-preview`
Returns the count of rows that **would** appear in each of the 34 reports — use this
to render a summary/landing screen before triggering a download.

**Response `200`:**
```json
{
  "status": "success",
  "success": true,
  "data": {
    "date": "2026-06-19",
    "totalRecordsFetched": 28,
    "sheetsPreview": {
      "1manual fir":      { "tableName": "excel_1manual_fir", "count": 8 },
      "2eburglary cases": { "tableName": "excel_2eburglary_cases", "count": 1 },
      "7arrested east district": { "tableName": "excel_7arrested_east_district", "count": 12 }
      /* ...34 entries total... */
    }
  }
}
```

> **Preview key format gotcha:** the keys of `sheetsPreview` are derived as
> `tableName.replace('excel_','').replace(/_/g,' ')`, so they look like
> `"1manual fir"` (the leading number is glued to the first word, rest are
> space-separated). Prefer keying off the stable `tableName` field, not the
> object key. The canonical `tableName` list is in [§5](#5-report-catalog).

### 2.2 `GET /export`
Generates and streams the compiled **XLSX** workbook (all 34 reports as styled
worksheets, built from the original template).

**Response `200`:** binary `.xlsx` stream with
`Content-Disposition: attachment; filename=Daily_Diary_<date>.xlsx`.

**Frontend download snippet:**
```js
const res = await axios.get(`/api/v1/daily-diary/export?date=${date}`, {
  headers: { Authorization: `Bearer ${token}` },
  responseType: 'blob',
});
const url = URL.createObjectURL(res.data);
const a = Object.assign(document.createElement('a'), { href: url, download: `Daily_Diary_${date}.xlsx` });
a.click();
URL.revokeObjectURL(url);
```

---

## 3. Error Responses

| Status | When | Body |
|--------|------|------|
| `400` | `date` present but not `YYYY-MM-DD` | `{ "status":"error", "success":false, "code":"BAD_REQUEST", "message":"Invalid date format. Expected YYYY-MM-DD." }` |
| `401` | Missing/invalid Bearer token | `{ "status":"error", "success":false, "code":"UNAUTHORIZED", "message":"Authentication required: Bearer token is missing" }` |
| `5xx` | Unhandled server error | Passed to the global error middleware |

---

## 4. Access Control & Scoping

Auth (`requireAuth`) + `enforceScope` run on both routes. Results are automatically
filtered to the caller's jurisdiction; `psId`/`districtId` can only **narrow** within
what the role may already see.

| Role | Scope | `psId` filter | `districtId` filter |
|------|-------|---------------|---------------------|
| `HC`, `SHO` | Own PS (`ps_id`) | Only own PS | — |
| `DISTRICT_OFFICER` | Own District (`district_id`) | PS within own district | Only own district |
| `ACP` | Sub-division (`sub_div_id`) | — | — |
| `HQ_ANALYST`, `HQ_ADMIN`, `SYSTEM_ADMIN` | Global (all districts) | Any PS | Any district |

**Status filter:** records with `current_status = 'DRAFT'` are **always excluded** —
only submitted/approved records appear in the diary.

---

## 5. Report Catalog

34 reports, grouped by source record type. **Type** = how the frontend should render it:
`list` (zero-to-many rows → table) or `summary` (always exactly one aggregate row →
stat card / single row). `tableName` is the stable key returned by `/records-preview`.

| # | `tableName` | Title | Source | Type |
|---|-------------|-------|--------|------|
| 1 | `excel_1manual_fir` | Manual FIR | CASE | list |
| 2 | `excel_2eburglary_cases` | E-Burglary Cases | CASE (burglary) | list |
| 3 | `excel_3ehouse_theft_cases` | E-House Theft Cases | CASE (house theft) | list |
| 4 | `excel_4eother_theft_cases` | E-Other Theft Cases | CASE (theft, non-house) | list |
| 5 | `excel_5mvt_cases` | MVT Cases | CASE (mvct / emvt) | list |
| 6 | `excel_6arrested_all_heads` | Arrested – All Heads (counts) | ARREST | summary |
| 7 | `excel_7arrested_east_district` | Arrested – District | ARREST (all) | list |
| 8 | `excel_8arrested_kalandara` | Arrested – Kalandara/Preventive | ARREST (126/109/110/preventive) | list |
| 9 | `excel_9arrested_efir_theft` | Arrested – E-FIR Theft | ARREST (theft) | list |
| 10 | `excel_10arrested_efir_mv_theft` | Arrested – E-FIR MV Theft | ARREST (mvt) | list |
| 11 | `excel_11proclaimed_offenders` | Proclaimed Offenders | ARREST (PO) | list |
| 12 | `excel_12listed_criminals_action` | Listed Criminals Action | ARREST (listed) | list |
| 13 | `excel_13arrested_24_hrs_list` | Arrested – Last 24 Hrs | ARREST (all) | list |
| 14 | `excel_14pi_disposal_manual` | PI Disposal – Manual | CASE (chargesheeted/closed) | list |
| 15 | `excel_15pi_disposal_eproperty` | PI Disposal – E-Property | CASE (theft + disposed) | list |
| 16 | `excel_16pi_disposal_emvt` | PI Disposal – E-MVT | CASE (mvt + disposed) | list |
| 17 | `excel_17juveniles_conflict_law` | Juveniles in Conflict with Law | ARREST (age < 18) | list |
| 18 | `excel_18missing_persons` | Missing Persons | MISSING (all) | list |
| 19 | `excel_19uidb` | UIDB (Unidentified Bodies) | UIDB | list |
| 20 | `excel_20abandoned_persons` | Abandoned Persons | MISSING (abandoned) | list |
| 21 | `excel_21traced_persons` | Traced Persons | MISSING (traced) | list |
| 22 | `excel_22women_missing` | Women Missing (counts) | MISSING (female) | summary |
| 23 | `excel_23children_missing` | Children Missing (counts) | MISSING (age < 18) | summary |
| 24 | `excel_24preventive_action` | Preventive Action | ARREST (preventive) | list |
| 25 | `excel_25inquest_registered` | Inquest Registered | CASE (inquest) | list |
| 26 | `excel_26inquest_acpsdm_disposal` | Inquest ACP/SDM Disposal | CASE (inquest + closed) | list |
| 27 | `excel_27important_cases` | Important Cases | CASE (murder/robbery/…) | list |
| 28 | `excel_28fir_goswara_summary` | FIR Goswara Summary (counts) | CASE | summary |
| 29 | `excel_29financial_fraud_arrest` | Financial Fraud Arrest | ARREST (fraud/cyber) | list |
| 30 | `excel_30patrolling_checking` | Patrolling/Checking (counts) | ARREST + static | summary |
| 31 | `excel_31ndps_action` | NDPS Action (counts) | CASE+ARREST (ndps) | summary |
| 32 | `excel_32servant_verification` | Servant Verification (counts) | static placeholder | summary |
| 33 | `excel_33mobile_recovered_ps` | Mobile Recovered (PS) | CASE (mobile/phone) | list |
| 34 | `excel_34mobile_recovered_summary` | Mobile Recovered Summary (counts) | derived from #33 | summary |

### 5.1 Column reference (field keys per report)
These are the exact column keys emitted per row (also the CSV headers). Use them as
table column ids when the data API (§7) lands.

```
1  manual_fir: ps, fir_no, us, name_of_complainant, father_husband_name_of_complainant, address_of_complainant, time_of_occurrence, place_of_occurrence, time_of_occurrence_1, place_of_occurrence_1, gist, arrested_person, name_of_accused
2  eburglary_cases: sr_no, ps, efir_no, us, name_of_complainant, father_husband_name_of_complainant, address_of_complainant, time_of_occurrence, stolen_items, place_of_occurrence, io_name, io_mobile_no, beat_no
3  ehouse_theft_cases: sr_no, ps, efir_no, us, name_of_complainant, father_husband_name_of_complainant, address_of_complainant, place_of_occurrence, time_of_occurrence, stolen_items, place_of_occurrence_1, io_name, io_mobile_no, beat_no
4  eother_theft_cases: sr_no, ps, efir_no, us, name_of_complainant, father_husband_name_of_complainant, address_of_complainant, time_of_occurrence, stolen_items, place_of_occurrence, io_name, io_mobile_no, beat_no
5  mvt_cases: sr, ps, fir_no, us, date_of_occurrence, time_of_occurrence, place_of_occurrence, name_of_complainant, father_husband_name_of_complainant, address_of_complainant, vehicle_no, vehicle_type, io_name, io_mobile_no, beat_no, 1st_cd_uploaded_in_24_hrs_yesno, whether_footage_is_collected_or_not
6  arrested_all_heads: bnsipc, total_no_dd_126170_bnss, total_no_dd_126169_bnss, total_no_dd_109_bnss, 109_g, total_l_no_dd_110_bnss, 110_g, 929397_dp_act, total_no_dd_40_ex, 40_ex, 351d, aact, gact, 33_ex, ndps, others_act, others_bnss, po
7  arrested_east_district: sn, fir_no, us, name, father_husband_name, address, age, name_of_io, pcjcbail, prev_involvement_no_of_cases, recovery, whether_accused_is_bc_or_not, integrated_pi, group_patrolling, cycle_patrolling, by_antisnatching_team, by_prahari, by_eyes_ears_scheme_members
8  arrested_kalandara: (cols of #7) + firdd_no, place_of_occurrence, io, prev_involvement, integrated_pick
9  arrested_efir_theft: (cols of #7) + firdd_no, prev_involvement_no_of_cases_head, group_rolling
10 arrested_efir_mv_theft: (cols of #7) + integrated_rate_picked
11 proclaimed_offenders: sn, ps, dd_nofir_no, us, details_of_po_name, details_of_po_parental, details_of_po_address, case_in_which_declared_po, name_of_court_which_declared_po
12 listed_criminals_action: sn, name_of_ps, name_of_criminal, category, normal_arrest_in_fir, 126169_bnss, 126170_bnss, 129_bnss_110_g_crpc, arrest_of_po, externment_proposal, history_sheet_proposal, tracing_an_absent_bc, 107_bnss, 111_bnss, 112_bnss, others, remarks
13 arrested_24_hrs_list: s_no, name_nick_name, father_namehusband_name, address, age, firdd_no, us, police_station, name_of_io, rank_of_io, mobile_no_of_io, remarks_pc_remand_formal_arrest_bail_etc
14 pi_disposal_manual / 15 pi_disposal_eproperty / 16 pi_disposal_emvt: s_no, fir_no, date, us, rc, challan_untrace_cancel
17 juveniles_conflict_law: sr_no, police_station, firdd_no, date, us, name_of_juvenile, fathjer_husband_name_of_juvenile, address_of_juvenile, category_of_juvenile, age_of_juvenile, action_intervention_by_police_iojwongo, present_status_of_juvenile, order_by_cwcjjb, brief_factsremarks
18 missing_persons: sno, dd_no, dd_date, name_of_operator_to_whom_mps, name_of_missing_person, address_of_missing_person, missing_date, age, height, built, complexion, face, hair, beard, mustaches, upper_dress_color, lower_dress_color, name_of_io
19 uidb: sno, dd_no, dd_date, found_place, found_date, sex, age, height, built, complexion, face, hair, beard, mustaches, upper_dress_color, lower_dress_color, name_of_io
20 abandoned_persons: sno, dd_no, found_place, found_date, sex, age, height, built, complexion, face, hair, beard, mustaches, upper_dress_color, lower_dress_color, name_of_io
21 traced_persons: sno, dd_no, dd_date, name_of_operator_to_whom_mps, name_of_traced_person, fatherhusband_name_of_traced_person, address_of_traced_person, name_of_io
22 women_missing: pcr_call, dd_entry_complaint, total, traced, case_registered, pending
23 children_missing: pcr_call_male, pcr_call_female, dd_entrycomplaint_male, dd_entrycomplaint_female, total_male, total_female, traced_male, traced_female, case_registered_male, case_registered_female
24 preventive_action: persons_detained, dd_no_us_661_66_dp_act, no_of_us_661_66_dp_act, dd_no_129_bnss_128_bnss, no_of_129_bnss_128_bnss, dd_no_40a_b_delhi_excise_act, no_of_40a_b_delhi_excise_act, dd_no_126169_bnss, no_of_126169_bnss, dd_no_126170_bnss, no_of_126170_bnss, dd_no_bc_check, no_of_bc_check, dd_no_929397_dp_act, no_of_929397_dp_act
25 inquest_registered: sn, dd_no, date, us, name_of_deceased, fatherhusband_name_of_deceased, address_of_deceased, sex, age, cause_of_death, place_of_occurrence, io
26 inquest_acpsdm_disposal: sno, dd_no, date, us, name_of_deceased, fatherhusband_name_of_deceased, address_of_deceased, sex, age, cause_of_death, date_of_filed_by_acpsdm
27 important_cases: s_no, case_type_category_of_offence, police_station, district, fir_no, date_ddmmyyyy, under_sections_act_ipc_bns_bnss, brief_facts_of_the_case, accused_person_name, fathers_name, recovery_made_property_weapon_cash_etc
28 fir_goswara_summary: district, manual_fir, theft_efir, house_theft_efir, burglary_efir, mvt_motor_vehicle_theft, total
29 financial_fraud_arrest: zone, range, district, case_fir_no, us, date, ps, cheated_amount, modus_operandi, no_of_accused_arrested, respective_role_of_accused
30 patrolling_checking: district, no_of_vulnerable_areas_parks_other_crime_spots, time_slot_for_conducting_patrolling_checking_caso, excise, gambling, other_legal_action, sec_65_dp_act..., sec_66_dp_act..., sec_40a40b_excise_act..., sec_126169_bnss..., sec_126170_bnss..., sec_128_bnss..., sec_129_bnss..., counselling_of_juveniles
31 ndps_action: s_no, district, no_of_ps, cases_registered_under_ndps_act, qty_recovered, persons_arrested_bound_down
32 servant_verification: s_no, district, no_of_ps, verification_form_filled_up_today, verification_form_filled_up_upto_date, sent_for_address_verification_within_delhi, sent_for_address_verification_outside_delhi
33 mobile_recovered_ps: sr_no, fir_no_comp_no, fir_date, police_station, mobile_model, status, recovery_date, handed_over_seized, name_of_police_officer_who_recovered_the_mobile
34 mobile_recovered_summary: sno, police_station, no_of_mobile_phones_recovered_by_ps, mobile_recovered_by_mobile_tracing_team, total
```

> Source of truth for these mappings: `mapRecordsToSheets()` in
> `backend/src/modules/daily-diary/daily-diary.service.js`. Some fields are
> currently hard-coded placeholders (e.g. missing-person `height: '165 cm'`,
> `rank_of_io: 'Inspector'`); treat those as TODO data, not real values.

---

## 6. Excel Generation Mechanics
1. **Workbook init** — loads `backend/src/modules/daily-diary/templates/Daily dairy all tables NO MULTIVALUED (1).xlsx` via `exceljs` (this in-module copy is the one actually used).
2. **Layout preservation** — merged cells, column widths, double headers, colors, and fonts are inherited from the template.
3. **Data appending** — for each worksheet it locates the data rows after the headers, clears placeholders, and appends mapped rows.
4. **Style inheritance** — new cells inherit borders/alignment from the template headers.

---

## 7. Frontend Data Access — Current Limitation

There are **three** ways data leaves this module today:

| Need | Available? | How |
|------|-----------|-----|
| Per-report **counts** for a dashboard | ✅ Yes | `GET /records-preview` |
| Compiled **XLSX** download | ✅ Yes | `GET /export` |
| Per-report **row data as JSON** (to render tables in the browser) | ❌ **No endpoint** | — |

If the frontend must **display** report tables (not just offer an Excel download),
it needs a JSON data endpoint that returns the mapped rows. The mapping already
exists server-side (`mapRecordsToSheets`); exposing it is a small addition. Two
options to decide on:

- **A. One endpoint, all reports:** `GET /data?date=` → `{ <tableName>: Row[] }`.
- **B. One report at a time:** `GET /data/:tableName?date=` → `Row[]` (lighter payloads, supports lazy-loading per tab).

> **Decision needed before frontend table rendering begins.** Until then, the
> frontend can ship the counts dashboard (#preview) + the XLSX download button.
> A CSV path is **not** part of the API — see §8.

---

## 8. Testing & Sample Data

Sample data and verification live in `backend/scratch/`:

| Script | Purpose |
|--------|---------|
| `node scratch/seed_daily_diary_sample.js [YYYY-MM-DD]` | Idempotent seed (id prefix `R_DD_TEST_`) inserting ~28 records on a test date (default `2026-06-19`) crafted so **all 34 reports populate**. Re-running replaces the prior test rows. |
| `node scratch/export_daily_diary_csv.js [YYYY-MM-DD]` | Boots the app, exercises `/records-preview` + `/export` (incl. `401`/`400` guards), then writes **all 34 reports as CSV** plus the XLSX into `backend/scratch/daily-diary-csv/`. |
| `node scratch/verify_excel_gen.js` | Older standalone XLSX builder check → `scratch/Daily_Diary_2026-05-28.xlsx`. |

The CSV files are **test/inspection artifacts only** — they are produced by the
script, not served by the API.

### Manual testing (Postman / curl)
```http
GET http://localhost:5000/api/v1/daily-diary/records-preview?date=2026-06-19
Authorization: Bearer <token>

GET http://localhost:5000/api/v1/daily-diary/export?date=2026-06-19
Authorization: Bearer <token>
```

---

## 9. Key Assumptions
- **Drafts excluded:** `current_status = 'DRAFT'` records never appear.
- **Date column:** `records.record_date` is a SQL `DATE`; the `date` query param is matched as a string (`YYYY-MM-DD`). The driver may *display* it with a `T18:30:00Z` IST offset, but matching is correct.
- **Blank optionals:** fields absent from a record's JSONB render blank.
- **Hard-coded placeholders:** several descriptive fields are static stubs in the mapper (see §5.1 note) and should be wired to real data later.
- **No schema changes / no new tables:** the module is read-only over `records`, `hierarchy_nodes`, and `users`.
```
