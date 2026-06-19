import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore.js";
import api from "../../utils/api.js";
import StationFilters from "../../components/common/StationFilters.jsx";
import StationSummaryCards from "../../components/common/StationSummaryCards.jsx";
import StationPerformanceTable from "../../components/common/StationPerformanceTable.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { Shield, MapPin, Activity, Users, AlertCircle, CheckCircle2, Clock3, Radio } from "lucide-react";

export default function StationPerformanceDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, activeNodeId } = useAuthStore();

  const isHq = location.pathname.startsWith("/hq");

  const [nodes, setNodes] = useState([]);
  const [records, setRecords] = useState([]);
  const [psStats, setPsStats] = useState([]);  // pre-aggregated from /analytics/by-ps
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    districtId: "",
    psId: "",
    recordType: "",
    dateFrom: "",
    dateTo: "",
  });

  // Fetch nodes, records, and pre-aggregated station metrics
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Load hierarchy nodes, raw records and pre-aggregated PS stats in parallel
        const [nodesRes, recordsRes, psStatsRes] = await Promise.all([
          api.get("/hierarchy/nodes"),
          api.get("/records"),
          api.get("/analytics/by-ps").catch(() => ({ data: { data: [] } })), // non-fatal
        ]);

        setNodes(nodesRes.data.data || []);
        setRecords(recordsRes.data.data?.cases || recordsRes.data.data || []);
        // Store station-level stats from the analytics endpoint
        setPsStats(psStatsRes.data?.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard metrics. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter districts list
  const districts = useMemo(() => {
    return nodes.filter((n) => n.node_type === "DISTRICT");
  }, [nodes]);

  // Filter stations list
  const stations = useMemo(() => {
    return nodes.filter((n) => n.node_type === "PS");
  }, [nodes]);

  // Resolve scope constraints
  const userDistrictNode = useMemo(() => {
    if (isHq) return null;
    // For District Officer, resolve their bound district node
    const userDistId = user?.district_id || user?.districtId;
    return districts.find((d) => d.id === userDistId) || districts.find((d) => d.id === activeNodeId) || null;
  }, [isHq, user, districts, activeNodeId]);

  // Filter stations shown in table based on role & selected district
  const scopedStations = useMemo(() => {
    let list = stations;

    // Helper to traverse hierarchy and verify if a station is under a district
    const isNodeUnderDistrict = (stationNode, districtId) => {
      let current = stationNode;
      while (current && current.parent_id) {
        if (current.parent_id === districtId) return true;
        const parent = nodes.find((n) => n.id === current.parent_id);
        current = parent;
      }
      return false;
    };

    if (!isHq && userDistrictNode) {
      // Limit to district nodes
      list = list.filter((s) => isNodeUnderDistrict(s, userDistrictNode.id));
    }

    return list;
  }, [stations, isHq, userDistrictNode, nodes]);

  // Compute final table row elements with in-memory aggregation
  const calculatedData = useMemo(() => {
    // 1. Filter raw records
    const filteredRecords = records.filter((r) => {
      if (filters.recordType && r.record_type !== filters.recordType) return false;
      if (filters.dateFrom && r.record_date < filters.dateFrom) return false;
      if (filters.dateTo && r.record_date > filters.dateTo) return false;

      if (isHq) {
        if (filters.districtId && r.district_id !== filters.districtId) return false;
        if (filters.psId && r.ps_id !== filters.psId) return false;
      } else if (userDistrictNode) {
        // District officer only sees records in their district
        if (r.district_id !== userDistrictNode.id) return false;
      }

      return true;
    });

    // 2. Group aggregates by station
    const statsMap = {};
    filteredRecords.forEach((r) => {
      const psId = r.ps_id;
      if (!statsMap[psId]) {
        statsMap[psId] = {
          cases: 0,
          arrests: 0,
          pcr: 0,
          missing: 0,
          pending: 0,
          approved: 0,
          last_activity: null,
        };
      }

      const stats = statsMap[psId];
      const type = (r.record_type || "").toUpperCase();

      if (type === "CASE" || type === "CASES") stats.cases++;
      else if (type === "ARREST") stats.arrests++;
      else if (type === "PCR_CALL") stats.pcr++;
      else if (type === "MISSING") stats.missing++;

      const status = r.current_status || "";
      if (["DRAFT", "SENT_BACK_HC", "PENDING_SHO", "DISTRICT_REVIEW"].includes(status)) {
        stats.pending++;
      } else if (["HQ_RECEIVED", "CLOSED", "COMPILED"].includes(status)) {
        stats.approved++;
      }

      if (!stats.last_activity || new Date(r.updated_at) > new Date(stats.last_activity)) {
        stats.last_activity = r.updated_at;
      }
    });

    // 3. Helper to find district name for a station
    const getDistrictName = (stationNode) => {
      let current = stationNode;
      while (current && current.parent_id) {
        const parent = nodes.find((n) => n.id === current.parent_id);
        if (parent && parent.node_type === "DISTRICT") {
          return parent.name_en || parent.name;
        }
        current = parent;
      }
      return "Unknown District";
    };

    // 4. Merge stations and calculated stats
    const listToProcess = isHq
      ? scopedStations.filter((s) => {
          if (filters.districtId && !s.parent_id.includes(filters.districtId) && !s.id.includes(filters.districtId)) {
            // Traverse nodes to verify parent district id match
            let isMatch = false;
            let current = s;
            while (current && current.parent_id) {
              if (current.parent_id === filters.districtId) {
                isMatch = true;
                break;
              }
              current = nodes.find((n) => n.id === current.parent_id);
            }
            if (!isMatch) return false;
          }
          if (filters.psId && s.id !== filters.psId) return false;
          return true;
        })
      : scopedStations;

    // Build a quick lookup: psName → {cases, arrests, pcr}
    const psApiMap = {};
    psStats.forEach((row) => {
      if (row.station) psApiMap[row.station] = row;
    });

    const isLocalFilterActive = Boolean(filters.dateFrom || filters.dateTo || filters.recordType);

    const finalStations = listToProcess.map((s) => {
      // Prefer the API-aggregated data only if no time/type filters are applied
      const apiRow = psApiMap[s.name_en || s.name];
      const clientAgg = statsMap[s.id] || {
        cases: 0, arrests: 0, pcr: 0, missing: 0, pending: 0, approved: 0, last_activity: null,
      };

      const useApi = !isLocalFilterActive && apiRow;

      return {
        id: s.id,
        name_en: s.name_en || s.name,
        district_id: userDistrictNode?.id || s.parent_id,
        district_name: isHq ? getDistrictName(s) : (userDistrictNode?.name_en || userDistrictNode?.name || "District"),
        cases:    useApi ? apiRow.cases : clientAgg.cases,
        arrests:  useApi ? apiRow.arrests : clientAgg.arrests,
        pcr:      useApi ? apiRow.pcr : clientAgg.pcr,
        missing:  clientAgg.missing,
        pending:  clientAgg.pending,
        approved: clientAgg.approved,
        last_activity: clientAgg.last_activity,
      };
    });

    // 5. Calculate summary indicators
    let totalCases = 0;
    let totalArrests = 0;
    let totalPcr = 0;

    finalStations.forEach((fs) => {
      totalCases += fs.cases;
      totalArrests += fs.arrests;
      totalPcr += fs.pcr;
    });

    const uniqueDistricts = new Set(finalStations.map((fs) => fs.district_name));

    const summary = {
      totalDistricts: uniqueDistricts.size,
      totalStations: finalStations.length,
      totalCases,
      totalArrests,
      totalPcr,
    };

    return {
      stations: finalStations,
      summary,
    };
  }, [scopedStations, records, filters, isHq, userDistrictNode, nodes, psStats]);

  const handleRowClick = (stationId) => {
    const basePath = isHq ? "/hq/stations" : "/district/stations";
    navigate(`${basePath}/${stationId}`);
  };

  /* ─────────────────────────── Loading screen ─────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4F9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          {/* Glowing icon */}
          <div className="relative">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-[#003087] to-[#0046C0] shadow-2xl shadow-blue-500/40 flex items-center justify-center">
              <Shield size={34} className="text-white" />
            </div>
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-[#003087]/30 to-[#0046C0]/30 blur-xl -z-10" />
            {/* Spinner badge */}
            <div className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-white shadow-md border border-[#E2E8F0] flex items-center justify-center">
              <Spinner size="sm" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-[#1A202C]">Loading Dashboard</p>
            <p className="text-xs text-[#718096] mt-1">Fetching station metrics &amp; records…</p>
          </div>
          {/* Animated dots */}
          <div className="flex gap-1.5 mt-1">
            <span className="h-1.5 w-8 rounded-full bg-[#003087] animate-pulse" />
            <span className="h-1.5 w-5 rounded-full bg-[#003087]/40 animate-pulse" style={{ animationDelay: "150ms" }} />
            <span className="h-1.5 w-3 rounded-full bg-[#003087]/20 animate-pulse" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────── Error screen ───────────────────────────── */
  if (error) {
    return (
      <div className="min-h-screen bg-[#F0F4F9] flex items-center justify-center px-6">
        <div className="rounded-3xl border border-[#FCA5A5] bg-white shadow-xl shadow-red-100 max-w-md w-full overflow-hidden">
          {/* Red accent top bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#DC2626] to-[#F87171]" />
          <div className="p-8 text-center">
            <div className="relative mx-auto mb-5 h-16 w-16">
              <div className="h-16 w-16 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center">
                <AlertCircle size={28} className="text-[#DC2626]" />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-red-100 blur-md -z-10" />
            </div>
            <h3 className="text-base font-bold text-[#1A202C]">Unable to Load Data</h3>
            <p className="mt-2 text-sm text-[#DC2626] font-medium">{error}</p>
            <p className="mt-1 text-xs text-[#718096]">Check your connection and try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#003087] to-[#0046C0] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────── Main render ────────────────────────────── */
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-[#1A202C]">

      {/* ══════════════ HERO GRADIENT HEADER ══════════════ */}
      <div className="relative bg-gradient-to-br from-[#0A1628] via-[#003087] to-[#0046C0] px-8 py-12 overflow-hidden">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/4 h-56 w-56 rounded-full bg-[#0046C0]/50 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 right-1/4 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        {/* Subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,white 0,white 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,white 0,white 1px,transparent 1px,transparent 48px)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-screen-xl">
          {/* Top badge row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm tracking-wide">
              <Shield size={12} className="text-amber-400" />
              {isHq ? "DELHI POLICE · HQ CONSOLIDATED COMMAND" : "DELHI POLICE · DISTRICT COMMAND CENTER"}
            </span>

            {/* Live data pill */}
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-4 py-1.5 backdrop-blur-sm">
              <Radio size={11} className="text-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-300 tracking-wide">LIVE DATA</span>
            </div>
          </div>

          {/* Heading + inline hero stats */}
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">
                Station Wise Performance
              </h1>
              <p className="mt-1 text-xl font-medium text-white/40 tracking-wide">
                {isHq ? "Consolidated Delhi Police Command" : `${userDistrictNode?.name_en || "District"} Boundary`}
              </p>
              <p className="mt-4 text-sm text-white/55 leading-relaxed max-w-lg">
                {isHq
                  ? "Cross-station performance analysis across all districts under Delhi Police HQ jurisdiction. Compare cases, arrests, and PCR response metrics."
                  : `Real-time performance monitoring for all police stations under the ${userDistrictNode?.name_en || "your"} district boundary.`}
              </p>

              {/* Breadcrumb location chips */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1">
                  <MapPin size={11} className="text-white/50" />
                  <span className="text-xs text-white/60">Delhi, India</span>
                </div>
                {isHq ? (
                  <div className="flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1">
                    <Users size={11} className="text-white/50" />
                    <span className="text-xs text-white/60">{calculatedData.summary.totalDistricts} Districts</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1">
                    <MapPin size={11} className="text-white/50" />
                    <span className="text-xs text-white/60">{userDistrictNode?.name_en || "District"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Hero metric tiles — derived from calculatedData, display only */}
            <div className="flex flex-wrap gap-3 xl:flex-shrink-0 bg-slate 200">
              {[
                { label: "Stations",  value: calculatedData.summary.totalStations,  color: "text-white",        bg: "bg-white/10",           border: "border-white/20" },
                { label: "Cases",     value: calculatedData.summary.totalCases,     color: "text-amber-300",    bg: "bg-amber-500/15",       border: "border-amber-400/30" },
                { label: "Arrests",   value: calculatedData.summary.totalArrests,   color: "text-emerald-300",  bg: "bg-emerald-500/15",     border: "border-emerald-400/30" },
                { label: "PCR Calls", value: calculatedData.summary.totalPcr,       color: "text-sky-300",      bg: "bg-sky-500/15",         border: "border-sky-400/30" },
              ].map((tile) => (
                <div
                  key={tile.label}
                  className={`rounded-2xl ${tile.bg} border ${tile.border} backdrop-blur-sm px-5 py-4 min-w-[96px] text-center transition-all duration-200 hover:scale-105 hover:bg-white/20`}
                >
                  <div className={`text-3xl font-bold ${tile.color} tabular-nums`}>{tile.value}</div>
                  <div className="text-xs text-white/50 mt-1 font-medium">{tile.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom fade line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* ══════════════ PAGE BODY ══════════════ */}
      <div className="mx-auto max-w-screen-xl px-6 pb-12">

        {/* ── KPI Summary Cards ── */}
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-[#003087] to-[#0046C0]" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#4A5568]">Performance Overview</h2>
            <div className="flex-1 h-px bg-[#E2E8F0]" />
          </div>
          <StationSummaryCards summary={calculatedData.summary} isHq={isHq} />
        </div>

        {/* ── Filters Panel ── */}
        <div className="mt-6 rounded-2xl border border-[#E2E8F0] bg-[#003080] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#003087]/5 hover:-translate-y-0.5">
          {/* Panel header */}
          <div className="flex items-center gap-3 border-b border-[#E2E8F0] bg-gradient-to-r from-blue 600 to-[#003087] to-blue 200 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-slate 200 to-slate 400 shadow-md shadow-blue-500/20 flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Filter &amp; Search</p>
              <p className="text-xs text-slate-400">Narrow results by district, station, record type or date range</p>
            </div>
            {/* Active filter badge */}
            {activeFilterCount > 0 ? (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#003087] px-3 py-1 text-xs font-semibold text-white shadow-sm">
                <Activity size={10} />
                {activeFilterCount} active
              </span>
            ) : (
              <span className="ml-auto rounded-full border border-[#E2E8F0] bg-[#F8FAFF] px-3 py-1 text-xs font-medium text-[#718096]">
                No filters
              </span>
            )}
          </div>
          <div className="p-6">
            <StationFilters
              districts={districts}
              stations={scopedStations}
              filters={filters}
              setFilters={setFilters}
              isHq={isHq}
              allNodes={nodes}
            />
          </div>
        </div>

        {/* ── Station Performance Table ── */}
        <div className="mt-6 rounded-3xl border border-[#E2E8F0] bg-[#003087] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#003087]/5">
          {/* Table panel header */}
          <div className="relative border-b border-[#003087] bg-gradient-to-r from-[#003087] via-blue 600 to-blue 400 px-6 py-5">
            {/* Left vertical accent */}
            <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b from-blue to-[#0046C0]" />

            <div className="flex flex-wrap items-start justify-between gap-4 pl-4">
              <div>
                <h2 className="text-base font-bold text-white">Station Comparative Analysis</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  {calculatedData.stations.length} station{calculatedData.stations.length !== 1 ? "s" : ""}
                  {isHq ? ` · ${calculatedData.summary.totalDistricts} district${calculatedData.summary.totalDistricts !== 1 ? "s" : ""}` : ""}
                  {" "}· Click any row to drill down
                </p>
              </div>

              {/* Metric legend pills */}
              <div className="flex flex-wrap gap-2 bg-[#003087]">
                <div className="flex items-center gap-1.5 rounded-xl bg-slate 400 border border-[#FDE68A] px-3 py-1.5 shadow-sm">
                  <Clock3 size={12} className="text-[#D97706]" />
                  <span className="text-xs font-semibold text-[#D97706]">{calculatedData.summary.totalCases} Cases</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-[#ECFDF5] border border-[#6EE7B7] px-3 py-1.5 shadow-sm">
                  <CheckCircle2 size={12} className="text-[#059669]" />
                  <span className="text-xs font-semibold text-[#059669]">{calculatedData.summary.totalArrests} Arrests</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] px-3 py-1.5 shadow-sm">
                  <Radio size={12} className="text-[#003087]" />
                  <span className="text-xs font-semibold text-[#003087]">{calculatedData.summary.totalPcr} PCR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table body */}
          <div className="p-6">
            <StationPerformanceTable
              stations={calculatedData.stations}
              isHq={isHq}
              onRowClick={handleRowClick}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="h-px flex-1 max-w-[80px] bg-[#E2E8F0]" />
          <p className="text-xs text-[#A0AEC5] font-medium">
            Delhi Police Command System · Data refreshes on page load · All times IST
          </p>
          <div className="h-px flex-1 max-w-[80px] bg-[#E2E8F0]" />
        </div>
      </div>
    </div>
  );
}