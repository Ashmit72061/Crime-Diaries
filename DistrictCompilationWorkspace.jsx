import { useState, useRef, useEffect, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const REPORTS = [
  { tableName: "excel_1manual_fir",                label: "Manual FIR",                        type: "list",    num: 1  },
  { tableName: "excel_2eburglary_cases",           label: "E-Burglary Cases",                  type: "list",    num: 2  },
  { tableName: "excel_3ehouse_theft_cases",        label: "E-House Theft Cases",               type: "list",    num: 3  },
  { tableName: "excel_4eother_theft_cases",        label: "E-Other Theft Cases",               type: "list",    num: 4  },
  { tableName: "excel_5mvt_cases",                 label: "MVT Cases",                         type: "list",    num: 5  },
  { tableName: "excel_6arrested_all_heads",        label: "Arrested - All Heads",              type: "summary", num: 6  },
  { tableName: "excel_7arrested_east_district",    label: "Arrested - District",               type: "list",    num: 7  },
  { tableName: "excel_8arrested_kalandara",        label: "Arrested - Kalandara / Preventive", type: "list",    num: 8  },
  { tableName: "excel_9arrested_efir_theft",       label: "Arrested - E-FIR Theft",            type: "list",    num: 9  },
  { tableName: "excel_10arrested_efir_mv_theft",   label: "Arrested - E-FIR MV Theft",         type: "list",    num: 10 },
  { tableName: "excel_11proclaimed_offenders",     label: "Proclaimed Offenders",              type: "list",    num: 11 },
  { tableName: "excel_12listed_criminals_action",  label: "Listed Criminals Action",           type: "list",    num: 12 },
  { tableName: "excel_13arrested_24_hrs_list",     label: "Arrested - Last 24 Hrs",            type: "list",    num: 13 },
  { tableName: "excel_14pi_disposal_manual",       label: "PI Disposal - Manual",              type: "list",    num: 14 },
  { tableName: "excel_15pi_disposal_eproperty",    label: "PI Disposal - E-Property",          type: "list",    num: 15 },
  { tableName: "excel_16pi_disposal_emvt",         label: "PI Disposal - E-MVT",               type: "list",    num: 16 },
  { tableName: "excel_17juveniles_conflict_law",   label: "Juveniles in Conflict with Law",    type: "list",    num: 17 },
  { tableName: "excel_18missing_persons",          label: "Missing Persons",                   type: "list",    num: 18 },
  { tableName: "excel_19uidb",                     label: "UIDB (Unidentified Bodies)",        type: "list",    num: 19 },
  { tableName: "excel_20abandoned_persons",        label: "Abandoned Persons",                 type: "list",    num: 20 },
  { tableName: "excel_21traced_persons",           label: "Traced Persons",                    type: "list",    num: 21 },
  { tableName: "excel_22women_missing",            label: "Women Missing",                     type: "summary", num: 22 },
  { tableName: "excel_23children_missing",         label: "Children Missing",                  type: "summary", num: 23 },
  { tableName: "excel_24preventive_action",        label: "Preventive Action",                 type: "list",    num: 24 },
  { tableName: "excel_25inquest_registered",       label: "Inquest Registered",                type: "list",    num: 25 },
  { tableName: "excel_26inquest_acpsdm_disposal",  label: "Inquest ACP/SDM Disposal",          type: "list",    num: 26 },
  { tableName: "excel_27important_cases",          label: "Important Cases",                   type: "list",    num: 27 },
  { tableName: "excel_28fir_goswara_summary",      label: "FIR Goswara Summary",               type: "summary", num: 28 },
  { tableName: "excel_29financial_fraud_arrest",   label: "Financial Fraud Arrest",            type: "list",    num: 29 },
  { tableName: "excel_30patrolling_checking",      label: "Patrolling / Checking",             type: "summary", num: 30 },
  { tableName: "excel_31ndps_action",              label: "NDPS Action",                       type: "summary", num: 31 },
  { tableName: "excel_32servant_verification",     label: "Servant Verification",              type: "summary", num: 32 },
  { tableName: "excel_33mobile_recovered_ps",      label: "Mobile Recovered - PS",             type: "list",    num: 33 },
  { tableName: "excel_34mobile_recovered_summary", label: "Mobile Recovered Summary",          type: "summary", num: 34 },
];

const LIST_REPORTS    = REPORTS.filter(r => r.type === "list");
const SUMMARY_REPORTS = REPORTS.filter(r => r.type === "summary");

const MOCK_PS_LIST = [
  { id: "PS_NDD_01", name: "Connaught Place",    code: "CP"  },
  { id: "PS_NDD_02", name: "Tilak Marg",         code: "TM"  },
  { id: "PS_NDD_03", name: "Barakhamba Road",    code: "BR"  },
  { id: "PS_NDD_04", name: "Patel Marg",         code: "PM"  },
  { id: "PS_NDD_05", name: "Chanakyapuri",       code: "CKP" },
  { id: "PS_NDD_06", name: "Diplomatic Enclave", code: "DE"  },
  { id: "PS_NDD_07", name: "Parliament Street",  code: "PST" },
  { id: "PS_NDD_08", name: "Mandir Marg",        code: "MM"  },
  { id: "PS_NDD_09", name: "Karol Bagh",         code: "KB"  },
  { id: "PS_NDD_10", name: "Rajendra Nagar",     code: "RN"  },
  { id: "PS_NDD_11", name: "Patel Nagar",        code: "PN"  },
  { id: "PS_NDD_12", name: "Kishanganj",         code: "KSG" },
  { id: "PS_NDD_13", name: "Saraswati Vihar",   code: "SV"  },
  { id: "PS_NDD_14", name: "Delhi Cantt.",       code: "DC"  },
  { id: "PS_NDD_15", name: "Naraina",            code: "NAR" },
];

const ARCHIVES = [
  { period: "30 June 2026",  status: "DRAFT",     id: "#COMP_NDD_JUN", summary: null, submittedAt: null },
  { period: "31 May 2026",   status: "SUBMITTED", id: "#COMP_NDD_MAY", summary: { cases: 0, arrests: 0, pcr: 0, missing: 0, uidb: 0, total: 8 }, submittedAt: "1/6/2026, 2:30:00 pm" },
];

const API_BASE = "http://localhost:5000/api/v1";

// ─── Icons ─────────────────────────────────────────────────────────────────────

function ChevronDown({ size = 16, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function CheckIcon({ size = 13, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function SearchIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function BuildingIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}
function CompileIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
function DispatchIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
function SpinnerIcon({ size = 14, color = "#fff" }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      border: "2px solid rgba(255,255,255,0.3)", borderTopColor: color,
      borderRadius: "50%", animation: "spin 0.7s linear infinite",
    }} />
  );
}

// ─── Checkbox ──────────────────────────────────────────────────────────────────

function Checkbox({ checked, indeterminate = false, onChange, id }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return (
    <div style={{ position: "relative", width: 16, height: 16, flexShrink: 0 }}>
      <input ref={ref} id={id} type="checkbox" checked={checked} onChange={onChange}
        style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", margin: 0, cursor: "pointer", zIndex: 1 }} />
      <div style={{
        width: 16, height: 16, borderRadius: 4,
        background: checked || indeterminate ? "#2563EB" : "#fff",
        border: "1.5px solid " + (checked || indeterminate ? "#2563EB" : "#CBD5E1"),
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.12s",
      }}>
        {checked && <CheckIcon size={10} color="#fff" />}
        {indeterminate && !checked && (
          <div style={{ width: 8, height: 2, background: "#fff", borderRadius: 1 }} />
        )}
      </div>
    </div>
  );
}

// ─── CountBadge ────────────────────────────────────────────────────────────────

function CountBadge({ count }) {
  if (count === undefined || count === null) return null;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
      background: count > 0 ? "#DBEAFE" : "#F1F5F9",
      color: count > 0 ? "#1D4ED8" : "#94A3B8",
      border: "1px solid " + (count > 0 ? "#BFDBFE" : "#E2E8F0"),
      minWidth: 22, textAlign: "center", flexShrink: 0,
    }}>
      {count}
    </span>
  );
}

// ─── GroupHeader ───────────────────────────────────────────────────────────────

function GroupHeader({ label, count, selectedCount, allSel, someSel, onToggle, color, bg }) {
  return (
    <div style={{
      padding: "8px 14px", background: bg,
      display: "flex", alignItems: "center", gap: 10,
      borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 1,
    }}>
      <Checkbox checked={allSel} indeterminate={someSel} onChange={onToggle} id={"grp-" + label} />
      <label htmlFor={"grp-" + label}
        style={{ fontSize: 10, fontWeight: 800, color: color, letterSpacing: 0.8, cursor: "pointer", userSelect: "none" }}>
        {label}
      </label>
      <span style={{ fontSize: 10, color: "#94A3B8" }}>{selectedCount}/{count} selected</span>
    </div>
  );
}

// ─── FieldRow ──────────────────────────────────────────────────────────────────

function FieldRow({ report, checked, count, countsLoading, onToggle }) {
  const [hover, setHover] = useState(false);
  return (
    <label
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 14px 9px 32px",
        background: checked ? "rgba(37,99,235,0.04)" : hover ? "#F8FAFC" : "transparent",
        borderBottom: "1px solid #F1F5F9",
        cursor: "pointer", transition: "background 0.08s", userSelect: "none",
        borderLeft: checked ? "3px solid #2563EB" : "3px solid transparent",
      }}
    >
      <Checkbox checked={checked} onChange={onToggle} id={"field-" + report.tableName} />
      <span style={{ fontSize: 10, fontWeight: 700, color: "#CBD5E1", width: 20, textAlign: "right", flexShrink: 0 }}>
        {String(report.num).padStart(2, "0")}
      </span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: checked ? 600 : 400, color: checked ? "#1E293B" : "#374151" }}>
        {report.label}
      </span>
      <span style={{
        fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 3, flexShrink: 0, letterSpacing: 0.3,
        background: report.type === "summary" ? "#EFF6FF" : "#F8FAFC",
        color: report.type === "summary" ? "#2563EB" : "#64748B",
        border: "1px solid " + (report.type === "summary" ? "#BFDBFE" : "#E2E8F0"),
      }}>
        {report.type === "summary" ? "SUM" : "LIST"}
      </span>
      {countsLoading
        ? <span style={{ width: 28, display: "flex", justifyContent: "center" }}><SpinnerIcon size={10} color="#94A3B8" /></span>
        : <CountBadge count={count} />
      }
    </label>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DistrictCompilationWorkspace() {
  const [date, setDate]                     = useState("2026-06-19");
  const [psList, setPsList]                 = useState([]);
  const [psLoading, setPsLoading]           = useState(true);
  const [selectedPS, setSelectedPS]         = useState(null);
  const [psSearch, setPsSearch]             = useState("");
  const [psDropOpen, setPsDropOpen]         = useState(false);
  const [selectedFields, setSelectedFields] = useState(new Set(REPORTS.map(r => r.tableName)));
  const [fieldSearch, setFieldSearch]       = useState("");
  const [fieldCounts, setFieldCounts]       = useState({});
  const [countsLoading, setCountsLoading]   = useState(false);
  const [compiling, setCompiling]           = useState(false);
  const [toast, setToast]                   = useState(null);

  const psDropRef   = useRef(null);
  const psSearchRef = useRef(null);

  // ── Fetch PS list on mount ────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken") || "";
    fetch(API_BASE + "/hierarchy/nodes?type=PS&districtId=DIST_NDD", {
      headers: token ? { Authorization: "Bearer " + token } : {},
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const list = (data?.data?.nodes || data?.data || []).map(n => ({
          id:   n.id   || n._id,
          name: n.name || n.ps_name,
          code: n.code || n.ps_code || "",
        }));
        setPsList(list.length ? list : MOCK_PS_LIST);
      })
      .catch(() => setPsList(MOCK_PS_LIST))
      .finally(() => setPsLoading(false));
  }, []);

  // ── Fetch counts whenever PS or date changes ──────────────────────────────
  const fetchCounts = useCallback((psId, targetDate) => {
    setCountsLoading(true);
    const token  = localStorage.getItem("token") || localStorage.getItem("authToken") || "";
    const params = new URLSearchParams({ date: targetDate });
    if (psId) params.set("psId", psId);
    fetch(API_BASE + "/daily-diary/records-preview?" + params, {
      headers: token ? { Authorization: "Bearer " + token } : {},
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const sheets = data?.data?.sheetsPreview || {};
        const map = {};
        Object.values(sheets).forEach(s => { map[s.tableName] = s.count ?? 0; });
        setFieldCounts(map);
      })
      .catch(() => setFieldCounts({}))
      .finally(() => setCountsLoading(false));
  }, []);

  useEffect(() => { fetchCounts(selectedPS?.id || null, date); }, [selectedPS, date, fetchCounts]);

  // ── Close PS dropdown on outside click ───────────────────────────────────
  useEffect(() => {
    function handleClick(e) {
      if (psDropRef.current && !psDropRef.current.contains(e.target)) {
        setPsDropOpen(false);
        setPsSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (psDropOpen && psSearchRef.current) setTimeout(() => psSearchRef.current?.focus(), 50);
  }, [psDropOpen]);

  // ── Filtered lists ────────────────────────────────────────────────────────
  const filteredPS = psList.filter(ps =>
    ps.name.toLowerCase().includes(psSearch.toLowerCase()) ||
    ps.code.toLowerCase().includes(psSearch.toLowerCase())
  );
  const filteredReports = REPORTS.filter(r =>
    r.label.toLowerCase().includes(fieldSearch.toLowerCase()) ||
    String(r.num).includes(fieldSearch)
  );
  const filteredList    = filteredReports.filter(r => r.type === "list");
  const filteredSummary = filteredReports.filter(r => r.type === "summary");

  // ── Selection state flags ─────────────────────────────────────────────────
  const allSelected  = selectedFields.size === REPORTS.length;
  const noneSelected = selectedFields.size === 0;
  const someSelected = !allSelected && !noneSelected;

  const listAll  = LIST_REPORTS.every(r => selectedFields.has(r.tableName));
  const listNone = LIST_REPORTS.every(r => !selectedFields.has(r.tableName));
  const listSome = !listAll && !listNone;

  const summaryAll  = SUMMARY_REPORTS.every(r => selectedFields.has(r.tableName));
  const summaryNone = SUMMARY_REPORTS.every(r => !selectedFields.has(r.tableName));
  const summarySome = !summaryAll && !summaryNone;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function toggleField(tableName) {
    setSelectedFields(prev => {
      const next = new Set(prev);
      next.has(tableName) ? next.delete(tableName) : next.add(tableName);
      return next;
    });
  }
  function toggleAll() {
    if (allSelected) setSelectedFields(new Set());
    else setSelectedFields(new Set(REPORTS.map(r => r.tableName)));
  }
  function toggleGroup(group) {
    const gr  = group === "list" ? LIST_REPORTS : SUMMARY_REPORTS;
    const all = gr.every(r => selectedFields.has(r.tableName));
    setSelectedFields(prev => {
      const next = new Set(prev);
      if (all) gr.forEach(r => next.delete(r.tableName));
      else     gr.forEach(r => next.add(r.tableName));
      return next;
    });
  }
  function selectPS(ps) {
    setSelectedPS(ps);
    setPsDropOpen(false);
    setPsSearch("");
    setSelectedFields(new Set(REPORTS.map(r => r.tableName)));
  }
  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }
  function formatDate(d) {
    if (!d) return "";
    const [y, m, day] = d.split("-");
    return day + "/" + m + "/" + y;
  }

  // ── Compile ───────────────────────────────────────────────────────────────
  function handleCompile() {
    if (noneSelected) {
      showToast("error", "Koi bhi report field select nahi hai. Kam se kam ek field chunein.");
      return;
    }
    setCompiling(true);
    const token  = localStorage.getItem("token") || localStorage.getItem("authToken") || "";
    const params = new URLSearchParams({ date });
    if (selectedPS) params.set("psId", selectedPS.id);
    params.set("tableNames", [...selectedFields].join(","));

    fetch(API_BASE + "/daily-diary/export?" + params, {
      headers: token ? { Authorization: "Bearer " + token } : {},
    })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a   = Object.assign(document.createElement("a"), {
          href: url,
          download: "Daily_Diary_" + date + (selectedPS ? "_" + selectedPS.code : "") + ".xlsx",
        });
        a.click();
        URL.revokeObjectURL(url);
        showToast("success", "Downloaded — " + (selectedPS ? selectedPS.name : "All Stations") + " · " + selectedFields.size + " fields · " + formatDate(date));
      })
      .catch(() => {
        showToast("success", "Compile triggered — " + (selectedPS ? selectedPS.name : "All Stations") + " · " + selectedFields.size + "/" + REPORTS.length + " fields · " + formatDate(date));
      })
      .finally(() => setCompiling(false));
  }

  const canCompile = !compiling && !noneSelected;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: "#F4F6FA", minHeight: "100vh" }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#1E293B", letterSpacing: "-0.2px" }}>Command Center</div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {[
            ["STATIONS", (selectedPS ? "1" : String(psList.length)) + "/15", "#374151"],
            ["PENDING",  "2",        "#DC2626"],
            ["SYSTEM",   "● ONLINE", "#16A34A"],
            ["SYNC",     "3:22 PM",  "#374151"],
          ].map(([k, v, c]) => (
            <div key={k} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, letterSpacing: 0.5 }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</div>
            </div>
          ))}
          <div style={{ background: "#F1F5F9", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 600, color: "#475569", border: "1px solid #E2E8F0" }}>
            DISTRICT VIEW | NEW DELHI DISTRICT
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1E40AF", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>D</div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 28 }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: "4px 0", fontSize: 18 }}>&#8592;</button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>&#x1F4D2;</span>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.4px" }}>
                District Compilation Workspace
              </h1>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#6B7280" }}>
              Select a Police Station and Daily Diary fields to compile for{" "}
              <span style={{ color: "#B45309", fontWeight: 600 }}>DIST_NDD</span>{" "}
              before sending to Headquarters.
            </p>
          </div>
        </div>

        {/* ── Compilation card ─────────────────────────────────────────────── */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: "26px 28px 24px", marginBottom: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>

          {/* Step 1 label */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#FEF3C7", border: "1.5px solid #FCD34D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#92400E", flexShrink: 0 }}>1</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#92400E", letterSpacing: 1 }}>SELECT DATE &amp; POLICE STATION</span>
          </div>
          <p style={{ margin: "0 0 18px 24px", fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
            Records at{" "}
            <span style={{ color: "#B45309", fontWeight: 600, background: "#FEF3C7", padding: "1px 6px", borderRadius: 4 }}>DISTRICT_REVIEW</span>{" "}
            status will be bundled into the compilation.
          </p>

          {/* Row 1: Date + PS */}
          <div style={{ display: "flex", gap: 12, alignItems: "stretch", flexWrap: "wrap", marginLeft: 4 }}>

            {/* Date picker */}
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                height: 42, padding: "0 14px", border: "1.5px solid #D1D5DB", borderRadius: 8,
                fontSize: 14, color: "#1E293B", background: "#fff", outline: "none",
                cursor: "pointer", fontFamily: "inherit", fontWeight: 500, flexShrink: 0,
              }}
            />

            {/* PS Dropdown */}
            <div ref={psDropRef} style={{ position: "relative", flex: 1, minWidth: 260 }}>
              <button
                onClick={() => setPsDropOpen(o => !o)}
                style={{
                  width: "100%", height: 42, padding: "0 12px",
                  border: "1.5px solid " + (psDropOpen ? "#2563EB" : selectedPS ? "#6366F1" : "#D1D5DB"),
                  borderRadius: 8, background: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 13.5, fontFamily: "inherit",
                  boxShadow: psDropOpen ? "0 0 0 3px rgba(37,99,235,0.1)" : selectedPS ? "0 0 0 2px rgba(99,102,241,0.08)" : "none",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ color: selectedPS ? "#6366F1" : "#94A3B8", display: "flex", flexShrink: 0 }}>
                  <BuildingIcon size={15} />
                </span>
                <span style={{ flex: 1, textAlign: "left", fontWeight: selectedPS ? 600 : 400, color: selectedPS ? "#1E293B" : "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {psLoading ? "Loading stations…" : selectedPS ? selectedPS.name : "Select Police Station…"}
                </span>
                {selectedPS && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#EEF2FF", color: "#6366F1", border: "1px solid #C7D2FE", flexShrink: 0 }}>
                    {selectedPS.code}
                  </span>
                )}
                <ChevronDown size={15} style={{ transform: psDropOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", color: "#6B7280", flexShrink: 0 }} />
              </button>

              {/* PS dropdown panel */}
              {psDropOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 60,
                  background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 10,
                  boxShadow: "0 8px 28px rgba(0,0,0,0.12)", overflow: "hidden",
                }}>
                  {/* Search */}
                  <div style={{ padding: "10px 10px 6px", borderBottom: "1px solid #F1F5F9" }}>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", display: "flex" }}>
                        <SearchIcon size={13} />
                      </span>
                      <input
                        ref={psSearchRef}
                        value={psSearch}
                        onChange={e => setPsSearch(e.target.value)}
                        placeholder="Search police station…"
                        style={{
                          width: "100%", padding: "7px 10px 7px 32px", border: "1.5px solid #E5E7EB",
                          borderRadius: 6, fontSize: 13, outline: "none", fontFamily: "inherit",
                          color: "#1E293B", background: "#F8F9FB",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5, paddingLeft: 2 }}>
                      {filteredPS.length} of {psList.length} stations
                    </div>
                  </div>

                  {/* All Stations option */}
                  <button
                    onClick={() => selectPS(null)}
                    style={{
                      width: "100%", padding: "9px 14px", display: "flex", alignItems: "center", gap: 10,
                      background: !selectedPS ? "#EFF6FF" : "transparent", border: "none", cursor: "pointer",
                      borderLeft: !selectedPS ? "3px solid #2563EB" : "3px solid transparent",
                    }}
                    onMouseEnter={e => { if (selectedPS) e.currentTarget.style.background = "#F8FAFC"; }}
                    onMouseLeave={e => { if (selectedPS) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ fontSize: 15 }}>&#x1F3DB;</span>
                    <span style={{ flex: 1, textAlign: "left", fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>All Stations (District-wide)</span>
                    {!selectedPS && <CheckIcon size={13} color="#2563EB" />}
                  </button>
                  <div style={{ height: 1, background: "#E5E7EB" }} />

                  {/* PS list */}
                  <div style={{ maxHeight: 260, overflowY: "auto" }}>
                    {filteredPS.length === 0
                      ? <div style={{ padding: "20px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>No stations found</div>
                      : filteredPS.map((ps, idx) => {
                          const isSel = selectedPS?.id === ps.id;
                          return (
                            <button
                              key={ps.id}
                              onClick={() => selectPS(ps)}
                              style={{
                                width: "100%", padding: "9px 14px", display: "flex", alignItems: "center", gap: 10,
                                background: isSel ? "#EEF2FF" : "transparent", border: "none", cursor: "pointer",
                                borderLeft: isSel ? "3px solid #6366F1" : "3px solid transparent",
                                transition: "background 0.1s",
                              }}
                              onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "#F8FAFC"; }}
                              onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                            >
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", width: 20, textAlign: "right", flexShrink: 0 }}>
                                {String(idx + 1).padStart(2, "0")}
                              </span>
                              <span style={{ flex: 1, textAlign: "left", fontSize: 13.5, fontWeight: isSel ? 600 : 400, color: "#374151" }}>
                                {ps.name}
                              </span>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 5px", borderRadius: 3, background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0", flexShrink: 0 }}>
                                {ps.code}
                              </span>
                              {isSel && <CheckIcon size={13} color="#6366F1" />}
                            </button>
                          );
                        })
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#F1F5F9", margin: "22px 0 20px" }} />

          {/* Step 2 label */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#EFF6FF", border: "1.5px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#1D4ED8", flexShrink: 0 }}>2</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#1E40AF", letterSpacing: 1 }}>SELECT REPORT FIELDS</span>
            {countsLoading && <SpinnerIcon size={12} color="#2563EB" />}
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#64748B" }}>
              <strong style={{ color: noneSelected ? "#94A3B8" : "#0F172A" }}>{selectedFields.size}</strong>
              <span style={{ color: "#94A3B8" }}> / {REPORTS.length} selected</span>
            </span>
          </div>

          {/* Field search + master controls */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", display: "flex" }}>
                <SearchIcon size={13} />
              </span>
              <input
                value={fieldSearch}
                onChange={e => setFieldSearch(e.target.value)}
                placeholder="Search report fields…"
                style={{
                  width: "100%", padding: "8px 10px 8px 30px", border: "1.5px solid #E5E7EB",
                  borderRadius: 7, fontSize: 13, outline: "none", fontFamily: "inherit",
                  color: "#1E293B", background: "#F8F9FB",
                }}
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "6px 10px", borderRadius: 6, border: "1.5px solid #E5E7EB", background: "#F8F9FB", userSelect: "none", flexShrink: 0 }}>
              <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} id="master-all" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>All Fields</span>
            </label>
            <button
              onClick={() => setSelectedFields(new Set())}
              style={{ padding: "6px 12px", borderRadius: 6, border: "1.5px solid #FCA5A5", background: "#FFF5F5", color: "#DC2626", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
            >
              Clear
            </button>
          </div>

          {/* Field panel */}
          <div style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, overflow: "hidden", background: "#FAFBFD", maxHeight: 380, overflowY: "auto" }}>
            {filteredList.length > 0 && (
              <>
                <GroupHeader
                  label="LIST REPORTS" count={LIST_REPORTS.length}
                  selectedCount={LIST_REPORTS.filter(r => selectedFields.has(r.tableName)).length}
                  allSel={listAll} someSel={listSome}
                  onToggle={() => toggleGroup("list")}
                  color="#475569" bg="#F1F5F9"
                />
                {filteredList.map(report => (
                  <FieldRow key={report.tableName} report={report}
                    checked={selectedFields.has(report.tableName)}
                    count={fieldCounts[report.tableName]}
                    countsLoading={countsLoading}
                    onToggle={() => toggleField(report.tableName)}
                  />
                ))}
              </>
            )}
            {filteredSummary.length > 0 && (
              <>
                {filteredList.length > 0 && <div style={{ height: 1, background: "#E5E7EB" }} />}
                <GroupHeader
                  label="SUMMARY REPORTS" count={SUMMARY_REPORTS.length}
                  selectedCount={SUMMARY_REPORTS.filter(r => selectedFields.has(r.tableName)).length}
                  allSel={summaryAll} someSel={summarySome}
                  onToggle={() => toggleGroup("summary")}
                  color="#1D4ED8" bg="#EFF6FF"
                />
                {filteredSummary.map(report => (
                  <FieldRow key={report.tableName} report={report}
                    checked={selectedFields.has(report.tableName)}
                    count={fieldCounts[report.tableName]}
                    countsLoading={countsLoading}
                    onToggle={() => toggleField(report.tableName)}
                  />
                ))}
              </>
            )}
            {filteredList.length === 0 && filteredSummary.length === 0 && (
              <div style={{ padding: "28px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                No fields match "{fieldSearch}"
              </div>
            )}
          </div>

          {/* Selection summary strip + Compile button */}
          <div style={{
            marginTop: 16, padding: "10px 16px",
            background: noneSelected ? "#FFF5F5" : "#F0FDF4",
            border: "1px solid " + (noneSelected ? "#FCA5A5" : "#86EFAC"),
            borderRadius: 8, display: "flex", alignItems: "center", gap: 10, fontSize: 12, flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 15 }}>{noneSelected ? "⚠️" : "✅"}</span>
            <span style={{ fontWeight: 700, color: noneSelected ? "#B91C1C" : "#15803D" }}>
              {selectedPS ? selectedPS.name : "All Stations"}
            </span>
            <span style={{ color: "#CBD5E1" }}>·</span>
            <span style={{ color: "#374151" }}>
              <strong>{selectedFields.size}</strong>
              <span style={{ color: "#9CA3AF" }}>/{REPORTS.length} fields</span>
              {allSelected && <span style={{ color: "#16A34A", fontWeight: 600 }}> (Full Diary)</span>}
              {noneSelected && <span style={{ color: "#DC2626" }}> — select at least one</span>}
            </span>
            <span style={{ color: "#CBD5E1" }}>·</span>
            <span style={{ color: "#6B7280" }}>
              Date: <strong style={{ color: "#374151" }}>{formatDate(date)}</strong>
            </span>
            {!noneSelected && !allSelected && (
              <button
                onClick={toggleAll}
                style={{ fontSize: 11, color: "#2563EB", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0, fontFamily: "inherit" }}
              >
                Select all ↩
              </button>
            )}
            <button
              onClick={handleCompile}
              disabled={!canCompile}
              style={{
                marginLeft: "auto", height: 36, padding: "0 18px",
                background: canCompile ? "#B45309" : "#E5E7EB",
                color: canCompile ? "#fff" : "#9CA3AF",
                border: "none", borderRadius: 7,
                cursor: canCompile ? "pointer" : "not-allowed",
                fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 7,
                boxShadow: canCompile ? "0 1px 4px rgba(0,0,0,0.2)" : "none",
                transition: "all 0.15s", whiteSpace: "nowrap", fontFamily: "inherit",
              }}
            >
              {compiling
                ? <><SpinnerIcon size={13} color={canCompile ? "#fff" : "#9CA3AF"} /> Compiling…</>
                : <><CompileIcon /> Compile &amp; Download</>
              }
            </button>
          </div>
        </div>

        {/* ── Archives ─────────────────────────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 15 }}>&#x1F5C4;&#xFE0F;</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: 0.8 }}>COMPILED DISTRICT ARCHIVES</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ARCHIVES.map(arch => {
              const ss = ({
                DRAFT:     { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
                SUBMITTED: { bg: "#DCFCE7", text: "#15803D", border: "#86EFAC" },
                APPROVED:  { bg: "#EFF6FF", text: "#1D4ED8", border: "#93C5FD" },
              })[arch.status] || { bg: "#F1F5F9", text: "#374151", border: "#CBD5E1" };
              return (
                <div key={arch.id} style={{
                  background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10,
                  padding: "18px 20px", display: "flex", alignItems: "center",
                  justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  flexWrap: "wrap", gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Period: {arch.period}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, letterSpacing: 0.4, background: ss.bg, color: ss.text, border: "1px solid " + ss.border }}>
                        {arch.status}
                      </span>
                      <span style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>{arch.id}</span>
                    </div>
                    {arch.summary ? (
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        {[["Cases", arch.summary.cases], ["Arrests", arch.summary.arrests], ["PCR", arch.summary.pcr], ["Missing", arch.summary.missing], ["UIDB", arch.summary.uidb]].map(([lbl, val]) => (
                          <span key={lbl} style={{ fontSize: 12, color: "#6B7280" }}>{lbl}: <strong style={{ color: "#374151" }}>{val}</strong></span>
                        ))}
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Total: {arch.summary.total} records</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>No summary data available</span>
                    )}
                    {arch.submittedAt && (
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Submitted: {arch.submittedAt}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {arch.status === "SUBMITTED" && (
                      <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 500 }}>&#x2705; Received by HQ</span>
                    )}
                    {arch.status === "DRAFT" && (
                      <button style={{
                        height: 36, padding: "0 16px", border: "1.5px solid #86EFAC", borderRadius: 7,
                        background: "#F0FDF4", color: "#15803D", cursor: "pointer", fontSize: 13, fontWeight: 600,
                        display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
                      }}>
                        <DispatchIcon /> Dispatch to HQ
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 100,
          background: toast.type === "error" ? "#7F1D1D" : "#0F172A",
          color: "#fff", padding: "13px 18px", borderRadius: 10,
          fontSize: 13, fontWeight: 500, maxWidth: 440,
          boxShadow: "0 4px 20px rgba(0,0,0,0.28)",
          display: "flex", alignItems: "flex-start", gap: 10,
          animation: "slideUp 0.25s ease",
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{toast.type === "error" ? "⚠️" : "✅"}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
        ::-webkit-scrollbar       { width: 5px; }
        ::-webkit-scrollbar-track { background: #F8F9FB; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
      `}</style>
    </div>
  );
}
