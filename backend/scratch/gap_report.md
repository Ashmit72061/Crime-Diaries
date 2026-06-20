# Field Coverage Audit Report

This report compares columns in the four master spreadsheets under the `Master/` directory with the fields defined in the database seed (`seeds/seed.js`).

## Record Type: CASE (File: Sample Case Reg..xlsx)
- Total Excel Columns: 24
- Total Registered Fields in DB Seed: 25

### Column Gaps & Mappings

| Excel Column Index | Excel Column Name | Mapped DB Field Key | Status / Action | Detail / Match |
| --- | --- | --- | --- | --- |
| 1 | UID | `N/A` | **GAP** | No matching field found in seed |
| 2 | P.S. | `N/A` | **GAP** | No matching field found in seed |
| 3 | Case Reg. Type (CCTNS(Manual FIR)) | `N/A` | **GAP** | No matching field found in seed |
| 4 | FIR NO. | `N/A` | **GAP** | No matching field found in seed |
| 5 | Crime Head (Simple Hurt) | `N/A` | **GAP** | No matching field found in seed |
| 6 | U/S | `N/A` | **GAP** | No matching field found in seed |
| 7 | ACT/LAW | `N/A` | **GAP** | No matching field found in seed |
| 8 | DETAILS OF COMPLAINANT (NAME) | `N/A` | **GAP** | No matching field found in seed |
| 9 | DETAILS OF COMPLAINANT (Parents NAME) | `N/A` | **GAP** | No matching field found in seed |
| 10 | DETAILS OF COMPLAINANT (Address) | `N/A` | **GAP** | No matching field found in seed |
| 11 | DATE OF OCCURRENCE | `occurrence_date` | **MATCHED** | Maps to `occurrence_date` (label: "Date of Occurrence") |
| 12 | TIME OF OCCURRENCE | `N/A` | **GAP** | No matching field found in seed |
| 13 | PLACE OF OCCURRENCE | `occurrence_place` | **MATCHED** | Maps to `occurrence_place` (label: "Place of Occurrence") |
| 14 | GIST | `N/A` | **GAP** | No matching field found in seed |
| 15 | ARRESTED PERSON (NAME) | `N/A` | **GAP** | No matching field found in seed |
| 16 | ARRESTED PERSON (PARENTS NAME) | `N/A` | **GAP** | No matching field found in seed |
| 17 | ARRESTED PERSON (ADDRESS) | `N/A` | **GAP** | No matching field found in seed |
| 18 | ARRESTED PERSON (AGE) | `N/A` | **GAP** | No matching field found in seed |
| 19 | Stolen Property | `N/A` | **GAP** | No matching field found in seed |
| 20 | Recovery Property | `N/A` | **GAP** | No matching field found in seed |
| 21 | Case status (CHARGE SHEET) | `status` | **MATCHED** | Maps to `status` (label: "Case Status") |
| 22 | NAME OF IO | `io_name` | **MATCHED** | Maps to `io_name` (label: "Name of IO") |
| 23 | CONTACT OF IO | `N/A` | **GAP** | No matching field found in seed |
| 24 | PIS No. OF IO | `io_pis` | **MATCHED** | Maps to `io_pis` (label: "PIS No. of IO") |

### Unmapped DB Fields
Fields present in DB seed but not mapped to any column in the Excel:
- `fir_no` (TEXT): "FIR Number"
- `fir_date` (DATE): "FIR Date"
- `gd_no` (TEXT): "GD Number"
- `gd_date` (DATE): "GD Date"
- `gd_time` (TIME): "GD Time"
- `beat_no` (TEXT): "Beat No."
- `local_head` (SELECT): "Local Head (Crime)"
- `act_name` (TEXT): "Act / Law Name"
- `sections` (TEXT): "Sections"
- `brief_facts` (TEXTAREA): "Brief Facts of the Case"
- `complainant_name` (TEXT): "Complainant Name"
- `complainant_address` (TEXT): "Complainant Address"
- `accused_name` (TEXT): "Accused Name"
- `accused_address` (TEXT): "Accused Address"
- `io_mobile` (TEXT): "IO Mobile No."
- `property_description` (TEXTAREA): "Property Description"
- `property_status` (SELECT): "Property Status"
- `remarks` (TEXTAREA): "Remarks"
- `cctns_flag` (BOOLEAN): "CCTNS Flag"
- `zero_fir_flag` (BOOLEAN): "Zero FIR"

--------------------------------------------------

## Record Type: ARREST (File: Sample master Arrest.xlsx)
- Total Excel Columns: 29
- Total Registered Fields in DB Seed: 13

### Column Gaps & Mappings

| Excel Column Index | Excel Column Name | Mapped DB Field Key | Status / Action | Detail / Match |
| --- | --- | --- | --- | --- |
| 1 | UID | `N/A` | **GAP** | No matching field found in seed |
| 2 | FIR NO./DD No. | `N/A` | **GAP** | No matching field found in seed |
| 3 | Crime Head (Simple Hurt) | `crime_head` | **MATCHED** | Maps to `crime_head` (label: "Crime Head") |
| 4 | U/S | `N/A` | **GAP** | No matching field found in seed |
| 5 | ACT/LAW | `N/A` | **GAP** | No matching field found in seed |
| 6 | ARRESTED PERSON (NAME) | `N/A` | **GAP** | No matching field found in seed |
| 7 | ARRESTED PERSON (PARENTS NAME) | `N/A` | **GAP** | No matching field found in seed |
| 8 | ARRESTED PERSON (ADDRESS) | `N/A` | **GAP** | No matching field found in seed |
| 9 | ARRESTED PERSON (AGE) | `N/A` | **GAP** | No matching field found in seed |
| 10 | Date of Arrest | `arrest_date` | **MATCHED** | Maps to `arrest_date` (label: "Date of Arrest") |
| 11 | Time of Arrest | `N/A` | **GAP** | No matching field found in seed |
| 12 | Place of Arrest | `arrest_place` | **MATCHED** | Maps to `arrest_place` (label: "Place of Arrest") |
| 13 | NAME OF IO | `N/A` | **GAP** | No matching field found in seed |
| 14 | Contact of IO | `N/A` | **GAP** | No matching field found in seed |
| 15 | Status of Arrest (PC/JC/BAIL/Released) | `status` | **MATCHED** | Maps to `status` (label: "Custody Status") |
| 16 | PREV. INVOLVEMENT (NO. OF CASES) (Y/N) | `N/A` | **GAP** | No matching field found in seed |
| 17 | Is the person PO | `N/A` | **GAP** | No matching field found in seed |
| 18 | SEIZURE | `N/A` | **GAP** | No matching field found in seed |
| 19 | WHETHER ACCUSED IS BC OR NOT (Y/N) | `N/A` | **GAP** | No matching field found in seed |
| 20 | NAFIS Prepared (Y/N) | `nafis_prepared` | **MATCHED** | Maps to `nafis_prepared` (label: "NAFIS Prepared") |
| 21 | Dossier Prepared (Y/N) | `dossier_prepared` | **MATCHED** | Maps to `dossier_prepared` (label: "Dossier Prepared") |
| 22 | Arresting Officer | `io_name` | **MATCHED** | Maps to `io_name` (label: "Arresting Officer") |
| 23 | Contact of AO | `N/A` | **GAP** | No matching field found in seed |
| 24 | ARRESTED IN (INTEGRATED PI) | `N/A` | **GAP** | No matching field found in seed |
| 25 | ARRESTED IN (GROUP PATROLLING) | `N/A` | **GAP** | No matching field found in seed |
| 26 | ARRESTED IN (CYCLE PATROLLING) | `N/A` | **GAP** | No matching field found in seed |
| 27 | ARRESTED IN (BY ANTI-SNATCHING TEAM) | `N/A` | **GAP** | No matching field found in seed |
| 28 | ARRESTED IN (BY PRAHARI) | `N/A` | **GAP** | No matching field found in seed |
| 29 | ARRESTED IN (BY EYES & EARS SCHEME MEMBERS) | `N/A` | **GAP** | No matching field found in seed |

### Unmapped DB Fields
Fields present in DB seed but not mapped to any column in the Excel:
- `linked_fir_dd_no` (TEXT): "Linked FIR / DD No."
- `act_name` (TEXT): "Act / Law Name"
- `sections` (TEXT): "Sections"
- `arrested_name` (TEXT): "Name of Arrested Person"
- `arrested_address` (TEXT): "Address of Arrested"
- `other_status_reason` (TEXT): "Other Status Reason"

--------------------------------------------------

## Record Type: MISSING (File: Sample master missing.xlsx)
- Total Excel Columns: 22
- Total Registered Fields in DB Seed: 14

### Column Gaps & Mappings

| Excel Column Index | Excel Column Name | Mapped DB Field Key | Status / Action | Detail / Match |
| --- | --- | --- | --- | --- |
| 1 | S.NO. | `N/A` | **GAP** | No matching field found in seed |
| 2 | DD NO. | `N/A` | **GAP** | No matching field found in seed |
| 3 | DD DATE | `dd_date` | **MATCHED** | Maps to `dd_date` (label: "DD Date") |
| 4 | TYPE | `N/A` | **GAP** | No matching field found in seed |
| 5 | PCR Call | `N/A` | **GAP** | No matching field found in seed |
| 6 | NAME OF OPERATOR TO WHOM MPS | `N/A` | **GAP** | No matching field found in seed |
| 7 | NAME OF MISSING PERSON | `missing_name` | **MATCHED** | Maps to `missing_name` (label: "Name of Missing Person") |
| 8 | ADDRESS OF MISSING PERSON | `N/A` | **GAP** | No matching field found in seed |
| 9 | MISSING DATE | `N/A` | **GAP** | No matching field found in seed |
| 10 | Sex | `N/A` | **GAP** | No matching field found in seed |
| 11 | PHYSICAL DESCRIPTION (AGE) | `age` | **MATCHED** | Maps to `age` (label: "Age") |
| 12 | PHYSICAL DESCRIPTION (HEIGHT) | `physical_description` | **MATCHED** | Maps to `physical_description` (label: "Physical Description") |
| 13 | PHYSICAL DESCRIPTION (BUILT) | `physical_description` | **MATCHED** | Maps to `physical_description` (label: "Physical Description") |
| 14 | PHYSICAL DESCRIPTION (COMPLEXION) | `physical_description` | **MATCHED** | Maps to `physical_description` (label: "Physical Description") |
| 15 | PHYSICAL DESCRIPTION (FACE) | `physical_description` | **MATCHED** | Maps to `physical_description` (label: "Physical Description") |
| 16 | PHYSICAL DESCRIPTION (HAIR) | `physical_description` | **MATCHED** | Maps to `physical_description` (label: "Physical Description") |
| 17 | PHYSICAL DESCRIPTION (BEARD) | `physical_description` | **MATCHED** | Maps to `physical_description` (label: "Physical Description") |
| 18 | PHYSICAL DESCRIPTION (MUSTACHES) | `physical_description` | **MATCHED** | Maps to `physical_description` (label: "Physical Description") |
| 19 | PHYSICAL DESCRIPTION (UPPER DRESS COLOR) | `physical_description` | **MATCHED** | Maps to `physical_description` (label: "Physical Description") |
| 20 | PHYSICAL DESCRIPTION (LOWER DRESS COLOR) | `physical_description` | **MATCHED** | Maps to `physical_description` (label: "Physical Description") |
| 21 | PHYSICAL DESCRIPTION (NAME OF I.O.) | `physical_description` | **MATCHED** | Maps to `physical_description` (label: "Physical Description") |
| 22 | Status | `status` | **MATCHED** | Maps to `status` (label: "Current Status") |

### Unmapped DB Fields
Fields present in DB seed but not mapped to any column in the Excel:
- `dd_no` (TEXT): "DD Number"
- `gender` (SELECT): "Gender"
- `major_minor` (RADIO): "Major / Minor"
- `missing_date` (DATE): "Date Missing Since"
- `missing_place` (TEXT): "Last Seen Place"
- `informant_name` (TEXT): "Informant Name"
- `informant_mobile` (TEXT): "Informant Mobile"
- `io_name` (TEXT): "Assigned IO"
- `zipnet_no` (TEXT): "ZIPNET No."

--------------------------------------------------

## Record Type: UIDB (File: Sample master UIDB.xlsx)
- Total Excel Columns: 23
- Total Registered Fields in DB Seed: 11

### Column Gaps & Mappings

| Excel Column Index | Excel Column Name | Mapped DB Field Key | Status / Action | Detail / Match |
| --- | --- | --- | --- | --- |
| 1 | S.NO. | `N/A` | **GAP** | No matching field found in seed |
| 2 | DD NO. | `N/A` | **GAP** | No matching field found in seed |
| 3 | DD DATE | `N/A` | **GAP** | No matching field found in seed |
| 4 | U/S (If inquest) | `N/A` | **GAP** | No matching field found in seed |
| 5 | Name of Deceased | `N/A` | **GAP** | No matching field found in seed |
| 6 | Address of Deceased | `N/A` | **GAP** | No matching field found in seed |
| 7 | FOUND PLACE(with Lat. & Long.) | `N/A` | **GAP** | No matching field found in seed |
| 8 | FOUND DATE | `N/A` | **GAP** | No matching field found in seed |
| 9 | PHYSICAL DESCRIPTION (SEX) | `description` | **MATCHED** | Maps to `description` (label: "Physical Description") |
| 10 | PHYSICAL DESCRIPTION (AGE) | `description` | **MATCHED** | Maps to `description` (label: "Physical Description") |
| 11 | PHYSICAL DESCRIPTION (HEIGHT) | `description` | **MATCHED** | Maps to `description` (label: "Physical Description") |
| 12 | PHYSICAL DESCRIPTION (BUILT) | `description` | **MATCHED** | Maps to `description` (label: "Physical Description") |
| 13 | PHYSICAL DESCRIPTION (COMPLEXION) | `description` | **MATCHED** | Maps to `description` (label: "Physical Description") |
| 14 | PHYSICAL DESCRIPTION (FACE) | `description` | **MATCHED** | Maps to `description` (label: "Physical Description") |
| 15 | PHYSICAL DESCRIPTION (HAIR) | `description` | **MATCHED** | Maps to `description` (label: "Physical Description") |
| 16 | PHYSICAL DESCRIPTION (BEARD) | `description` | **MATCHED** | Maps to `description` (label: "Physical Description") |
| 17 | PHYSICAL DESCRIPTION (MUSTACHES) | `description` | **MATCHED** | Maps to `description` (label: "Physical Description") |
| 18 | PHYSICAL DESCRIPTION (UPPER DRESS COLOR) | `description` | **MATCHED** | Maps to `description` (label: "Physical Description") |
| 19 | PHYSICAL DESCRIPTION (LOWER DRESS COLOR) | `description` | **MATCHED** | Maps to `description` (label: "Physical Description") |
| 20 | NAME OF I.O. | `N/A` | **GAP** | No matching field found in seed |
| 21 | Contact OF I.O. | `N/A` | **GAP** | No matching field found in seed |
| 22 | CAUSE OF DEATH | `N/A` | **GAP** | No matching field found in seed |
| 23 | IF filed by ACP/SDM (DATE OF FILED BY ACP/SDM) | `N/A` | **GAP** | No matching field found in seed |

### Unmapped DB Fields
Fields present in DB seed but not mapped to any column in the Excel:
- `dd_no` (TEXT): "DD Number"
- `found_date` (DATE): "Date Body Found"
- `found_place` (TEXT): "Place Body Found"
- `gender` (SELECT): "Apparent Gender"
- `approx_age` (TEXT): "Approximate Age"
- `io_name` (TEXT): "Assigned IO"
- `informant_name` (TEXT): "Informant Name"
- `zipnet_no` (TEXT): "ZIPNET No."
- `identified` (BOOLEAN): "Body Identified"
- `status` (TEXT): "Current Status / Mortuary Remarks"

--------------------------------------------------

