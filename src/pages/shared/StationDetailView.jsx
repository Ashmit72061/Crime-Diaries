import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Shield, Building, PhoneCall, UserX, HelpCircle, Calendar, LineChart as ChartIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import api from "../../utils/api.js";
import { Spinner } from "../../components/ui/Spinner.jsx";

export default function StationDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isHq = location.pathname.startsWith("/hq");
  
  const [nodes, setNodes] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch nodes and records
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [nodesRes, recordsRes] = await Promise.all([
          api.get("/hierarchy/nodes"),
          api.get("/records"),
        ]);
        
        setNodes(nodesRes.data.data || []);
        setRecords(recordsRes.data.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching station details:", err);
        setError("Failed to load station profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Find the selected station node
  const stationNode = useMemo(() => {
    return nodes.find((n) => n.id === id);
  }, [nodes, id]);

  // Find parent district node
  const districtNode = useMemo(() => {
    if (!stationNode) return null;
    let current = stationNode;
    while (current && current.parent_id) {
      const parent = nodes.find((n) => n.id === current.parent_id);
      if (parent && parent.node_type === "DISTRICT") {
        return parent;
      }
      current = parent;
    }
    return null;
  }, [nodes, stationNode]);

  // Filter records belonging to this station
  const stationRecords = useMemo(() => {
    return records.filter((r) => r.ps_id === id);
  }, [records, id]);

  // Compute metrics and categorised lists
  const calculations = useMemo(() => {
    // Categories
    const cases = stationRecords.filter((r) => r.record_type === "CASE" || r.record_type === "CASES");
    const arrests = stationRecords.filter((r) => r.record_type === "ARREST");
    const pcrs = stationRecords.filter((r) => r.record_type === "PCR_CALL");
    const missing = stationRecords.filter((r) => r.record_type === "MISSING");
    
    // Status counts
    const pending = stationRecords.filter((r) =>
      ["DRAFT", "SENT_BACK_HC", "PENDING_SHO", "DISTRICT_REVIEW"].includes(r.current_status)
    ).length;
    const approved = stationRecords.filter((r) =>
      ["HQ_RECEIVED", "CLOSED", "COMPILED"].includes(r.current_status)
    ).length;

    // Sort logs descending
    const sortByDate = (arr) => {
      return [...arr].sort((a, b) => new Date(b.created_at || b.record_date) - new Date(a.created_at || a.record_date)).slice(0, 5);
    };

    // Group trends by date
    const dateMap = {};
    stationRecords.forEach((r) => {
      const dateStr = r.record_date; // YYYY-MM-DD
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { date: dateStr, cases: 0, pcr: 0, arrests: 0 };
      }
      const type = (r.record_type || "").toUpperCase();
      if (type === "CASE" || type === "CASES") dateMap[dateStr].cases++;
      else if (type === "PCR_CALL") dateMap[dateStr].pcr++;
      else if (type === "ARREST") dateMap[dateStr].arrests++;
    });

    const trendData = Object.values(dateMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7)
      .map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
      }));

    return {
      casesTotal: cases.length,
      arrestsTotal: arrests.length,
      pcrTotal: pcrs.length,
      missingTotal: missing.length,
      pending,
      approved,
      recentCases: sortByDate(cases),
      recentArrests: sortByDate(arrests),
      recentPcrs: sortByDate(pcrs),
      recentMissing: sortByDate(missing),
      trendData,
    };
  }, [stationRecords]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !stationNode) {
    return (
      <div className="page-wrapper font-sans text-slate-100">
        <div className="card p-6 border border-red-500/30 bg-red-950/20 text-red-400">
          <p>{error || "Station not found."}</p>
          <button
            onClick={() => navigate(isHq ? "/hq/stations" : "/district/stations")}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm font-semibold flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "FIR CASES", value: calculations.casesTotal, icon: Shield, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "ARRESTS", value: calculations.arrestsTotal, icon: UserX, color: "text-red-500", bg: "bg-red-500/10" },
    { title: "PCR CALLS", value: calculations.pcrTotal, icon: PhoneCall, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "MISSING", value: calculations.missingTotal, icon: HelpCircle, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "PENDING DECI.", value: calculations.pending, icon: Calendar, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "APPROVED", value: calculations.approved, icon: Shield, color: "text-indigo-500", bg: "bg-indigo-500/10" }
  ];

  return (
    <div className="page-wrapper font-sans text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isHq ? "/hq/stations" : "/district/stations")}
            className="p-2 border border-slate-700 hover:bg-slate-800 rounded transition-colors text-slate-400"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
              {stationNode.name_en || stationNode.name}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Station Code: <span className="font-mono font-bold text-amber-500">{stationNode.code || "N/A"}</span> | District: <span className="font-bold text-slate-300">{districtNode?.name_en || "N/A"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="card p-4 flex items-center justify-between border"
              style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-card)' }}
            >
              <div>
                <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-1">{card.title}</p>
                <h4 className="text-xl font-bold text-slate-100 tabular-numbers">{card.value}</h4>
              </div>
              <div className={`p-2.5 rounded-full ${card.bg} ${card.color}`}>
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Trend Chart */}
      <div className="card p-6 border mb-6" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-card)' }}>
        <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-4 flex items-center gap-2">
          <ChartIcon size={16} className="text-amber-500" />
          Volume Trend Analysis (Last 7 Active Days)
        </h3>
        <div className="h-[280px] w-full">
          {calculations.trendData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No recent volume data found for this station.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calculations.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "var(--border-light)" }} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Line type="monotone" dataKey="cases" name="Cases" stroke="#cca43b" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="pcr" name="PCR Calls" stroke="#0f52ba" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="arrests" name="Arrests" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Records Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases */}
        <div className="card border overflow-hidden" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-card)' }}>
          <div className="p-4 border-b flex items-center gap-2 bg-slate-900" style={{ borderColor: 'var(--border-light)' }}>
            <Shield size={16} className="text-emerald-500" />
            <h3 className="text-xs font-bold tracking-wider text-slate-200 uppercase">Recent Cases (FIR)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b" style={{ borderColor: 'var(--border-light)' }}>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">FIR No / UID</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">FIR Date</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Complainant</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {calculations.recentCases.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-5 text-center text-xs text-slate-500">No recent FIR records found.</td>
                  </tr>
                ) : (
                  calculations.recentCases.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/20 text-xs">
                      <td className="px-4 py-2.5 font-bold text-slate-200 font-mono">
                        {r.data?.fir_no || r.uid || r.id.substring(0, 8)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">
                        {r.data?.fir_date || r.record_date}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">
                        {r.data?.complainant_name || "Unknown"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.current_status === 'CLOSED' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
                          {r.current_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Arrests */}
        <div className="card border overflow-hidden" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-card)' }}>
          <div className="p-4 border-b flex items-center gap-2 bg-slate-900" style={{ borderColor: 'var(--border-light)' }}>
            <UserX size={16} className="text-red-500" />
            <h3 className="text-xs font-bold tracking-wider text-slate-200 uppercase">Recent Arrests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b" style={{ borderColor: 'var(--border-light)' }}>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Arrestee Name</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Arrest Date</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Classification</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Custody Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {calculations.recentArrests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-5 text-center text-xs text-slate-500">No recent arrest records found.</td>
                  </tr>
                ) : (
                  calculations.recentArrests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/20 text-xs">
                      <td className="px-4 py-2.5 font-bold text-slate-200">
                        {r.data?.arrested_name || "Unknown"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">
                        {r.data?.arrest_date || r.record_date}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300 font-bold">
                        {r.data?.crime_head || "General"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          {r.data?.status || "In Custody"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PCR Calls */}
        <div className="card border overflow-hidden" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-card)' }}>
          <div className="p-4 border-b flex items-center gap-2 bg-slate-900" style={{ borderColor: 'var(--border-light)' }}>
            <PhoneCall size={16} className="text-blue-500" />
            <h3 className="text-xs font-bold tracking-wider text-slate-200 uppercase">Recent PCR Calls</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b" style={{ borderColor: 'var(--border-light)' }}>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">GD No / Time</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Category</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Caller</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {calculations.recentPcrs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-5 text-center text-xs text-slate-500">No recent PCR records found.</td>
                  </tr>
                ) : (
                  calculations.recentPcrs.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/20 text-xs">
                      <td className="px-4 py-2.5 font-bold text-slate-200 font-mono">
                        {r.data?.gd_no || "N/A"} ({r.data?.gd_time || "N/A"})
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">
                        {r.data?.call_head || "General"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">
                        {r.data?.complainant_name || "Anonymous"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          {r.data?.status || "Closed"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Missing Persons */}
        <div className="card border overflow-hidden" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-card)' }}>
          <div className="p-4 border-b flex items-center gap-2 bg-slate-900" style={{ borderColor: 'var(--border-light)' }}>
            <HelpCircle size={16} className="text-purple-500" />
            <h3 className="text-xs font-bold tracking-wider text-slate-200 uppercase">Recent Missing Person Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b" style={{ borderColor: 'var(--border-light)' }}>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Missing Name</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Age/Gender</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Missing Since</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {calculations.recentMissing.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-5 text-center text-xs text-slate-500">No recent missing records found.</td>
                  </tr>
                ) : (
                  calculations.recentMissing.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/20 text-xs">
                      <td className="px-4 py-2.5 font-bold text-slate-200">
                        {r.data?.missing_name || "Unknown"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">
                        {r.data?.age || "N/A"} yrs / {r.data?.gender || "N/A"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">
                        {r.data?.missing_date || r.record_date}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.data?.status === 'Traced' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                          {r.data?.status || "Missing"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
