import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  UserX, 
  PhoneCall, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ArrowRight,
  AlertTriangle,
  Layers,
  FileSpreadsheet,
  Filter,
  Printer,
  ShieldCheck,
  X,
  Award,
  BookOpen
} from "lucide-react";
import useAuthStore from "../store/authStore.js";
import { 
  findNodeById, 
  getNodePath, 
  getMetricsForNode, 
  getMockLogsForNode, 
  getStationsForNode,
  POLICE_HIERARCHY,
  DISTRICT_MAP
} from "../utils/hierarchyData.js";

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeNodeId } = useAuthStore();
  
  // Retrieve node details and dynamic metrics
  const activeNode = findNodeById(activeNodeId) || POLICE_HIERARCHY;
  const metrics = getMetricsForNode(activeNodeId);
  const path = getNodePath(activeNodeId) || [POLICE_HIERARCHY];
  const rawLogs = getMockLogsForNode(activeNodeId);

  // HQ Filters State
  const [filterDistrict, setFilterDistrict] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterTime, setFilterTime] = useState("All");

  // Morning Diary and Fortnightly Report Modals State
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState(""); // "fortnightly" or "morning"

  // Formatter helpers
  const formatNumber = (num) => new Intl.NumberFormat("en-IN").format(num);

  const getSystemDate = (dateString) => {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
    }).format(new Date(dateString));
  };

  const getIndianDateString = () => {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "long",
    }).format(new Date());
  };

  // Filters calculation for HQ Panel
  const getFilteredLogs = () => {
    return rawLogs.filter(log => {
      // District filter
      if (filterDistrict !== "All") {
        const distNode = findNodeById(filterDistrict);
        if (distNode) {
          const stations = getStationsForNode(distNode).map(ps => ps.stationName);
          if (!stations.includes(log.station)) return false;
        }
      }
      // Crime type filter
      if (filterType !== "All") {
        if (log.crimeHead !== filterType) return false;
      }
      // Status filter
      if (filterStatus !== "All") {
        if (log.status !== filterStatus) return false;
      }
      return true;
    });
  };

  const filteredLogs = getFilteredLogs();

  // Stats definition based on node scope
  const stats = [
    { 
      label: "Total Registered FIRs", 
      value: metrics.firs, 
      icon: FileText, 
      trend: "+12% from last month", 
      trendType: "up",
      colorClass: "primary"
    },
    { 
      label: "Accused Arrested", 
      value: metrics.arrests, 
      icon: UserX, 
      trend: "+8% this week", 
      trendType: "up",
      colorClass: "success"
    },
    { 
      label: "PCR Response Dispatches", 
      value: metrics.pcrCalls, 
      icon: PhoneCall, 
      trend: "Avg response 7 mins", 
      trendType: "up",
      colorClass: "warning"
    },
    { 
      label: "Missing Found Status", 
      value: metrics.missingFound, 
      icon: Search, 
      trend: `${metrics.missingTotal} total reported`, 
      trendType: "up",
      colorClass: "danger"
    }
  ];

  return (
    <div className="page-wrapper">
      {/* Dynamic Header with Scope Breadcrumb */}
      <div className="page-header flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-900/40 text-blue-300 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded border border-blue-800 uppercase" translate="no">
              {activeNode.type} Scope Console
            </span>
            <div className="flex items-center text-xs text-slate-400 gap-1.5" translate="no">
              {path.map((node, index) => (
                <React.Fragment key={node.id}>
                  {index > 0 && <span className="text-slate-600">/</span>}
                  <span className={index === path.length - 1 ? "text-slate-200 font-semibold" : ""}>
                    {node.name.replace("District: ", "").replace("PS: ", "")}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
          <h1 translate="no" className="text-pretty font-serif font-bold text-3xl tracking-tight text-white">
            {activeNode.type === "HQ" ? "Delhi Police Headquarters Console" : `${activeNode.name} Console`}
          </h1>
          <p className="page-desc text-slate-400">
            {activeNode.type === "HQ" 
              ? "Global command metrics overview, command filters, and reports across all ranges and districts."
              : `Scoped data logs, metrics, and activities for ${activeNode.name}.`}
          </p>
        </div>

        {/* Console Action Buttons */}
        <div className="flex gap-2">
          {activeNode.type === "PS" && (
            <button 
              type="button" 
              className="btn btn-primary flex items-center gap-1.5"
              onClick={() => navigate("/dashboard/case-management")}
              aria-label="Create a new PRISM record"
            >
              <span>New Entry Form</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}

          {activeNode.type === "DISTRICT" && (
            <button 
              type="button" 
              className="btn btn-primary flex items-center gap-1.5"
              onClick={() => {
                setReportType("morning");
                setDiaryOpen(true);
              }}
            >
              <BookOpen size={16} aria-hidden="true" />
              <span>Generate Morning Diary</span>
            </button>
          )}

          {activeNode.type === "HQ" && (
            <button 
              type="button" 
              className="btn btn-primary flex items-center gap-1.5"
              onClick={() => {
                setReportType("fortnightly");
                setReportOpen(true);
              }}
            >
              <FileSpreadsheet size={16} aria-hidden="true" />
              <span>Generate Fortnightly Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Metrics Row */}
      <div className="dashboard-grid mb-6">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="stat-card transition-standard">
              <div className={`stat-icon ${item.colorClass}`} aria-hidden="true">
                <Icon size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label text-xs uppercase tracking-wider text-slate-400">{item.label}</span>
                <span className="stat-value tabular-numbers font-bold text-white text-2xl">{formatNumber(item.value)}</span>
                <span className={`stat-trend ${item.trendType} flex items-center text-xs mt-1 text-slate-300`}>
                  {item.trendType === "up" ? (
                    <TrendingUp size={12} className="mr-1 inline text-emerald-500" aria-hidden="true" />
                  ) : (
                    <TrendingDown size={12} className="mr-1 inline text-rose-500" aria-hidden="true" />
                  )}
                  {item.trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Senior Officer Child Comparison (Zone/Range Level UI) */}
      {(activeNode.type === "ZONE" || activeNode.type === "RANGE") && (
        <div className="card mb-6 transition-standard">
          <div className="card-title flex items-center gap-2">
            <Layers size={18} className="text-blue-500" aria-hidden="true" />
            <span>Range & District Workload Comparison (Simulation)</span>
          </div>
          <p className="page-desc mb-4">Command workload distribution across child jurisdictions.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeNode.children?.map(child => {
              const childMetrics = getMetricsForNode(child.id);
              const percentage = Math.min(100, Math.round((childMetrics.firs / (metrics.firs || 1)) * 100));
              return (
                <div key={child.id} className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-md">
                  <span className="text-xs text-blue-400 font-bold uppercase" translate="no">{child.type} View</span>
                  <h3 className="text-sm font-semibold text-white mt-1 mb-3">{child.name}</h3>
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Cases Percentage</span>
                        <span className="font-semibold text-slate-200">{percentage}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div style={{ width: `${percentage}%`, height: "100%", backgroundColor: "var(--primary-accent)" }}></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-700/60 text-xs">
                      <div>
                        <span className="text-slate-400 block">FIRs</span>
                        <strong className="text-slate-200 tabular-numbers">{formatNumber(childMetrics.firs)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Arrests</span>
                        <strong className="text-slate-200 tabular-numbers">{formatNumber(childMetrics.arrests)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HQ INTERACTIVE COMMAND FILTER PANEL */}
      {activeNode.type === "HQ" && (
        <div className="card mb-6 transition-standard">
          <div className="card-title flex items-center gap-2">
            <Filter size={18} className="text-amber-500" aria-hidden="true" />
            <span>Interactive Command Filter Panel</span>
          </div>
          <p className="page-desc mb-4">Filter registered crime dockets across all ranges and districts in real-time.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="form-group">
              <label htmlFor="filter-district" className="form-label text-slate-300">District Boundary</label>
              <select
                id="filter-district"
                className="form-control"
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
              >
                <option value="All">All Districts</option>
                {Object.entries(DISTRICT_MAP).map(([code, name]) => (
                  <option key={code} value={`DIST_${code}`}>{name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="filter-type" className="form-label text-slate-300">Crime Category</label>
              <select
                id="filter-type"
                className="form-control"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Robbery">Robbery</option>
                <option value="Theft">Property Theft</option>
                <option value="Snatching">Snatching</option>
                <option value="Assault">Assault / Altercation</option>
                <option value="Kidnapping">Kidnapping</option>
                <option value="UIDB">UIDB corpse</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="filter-status" className="form-label text-slate-300">Docket Status</label>
              <select
                id="filter-status"
                className="form-control"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active Investigation">Active Investigation</option>
                <option value="Approved">Approved</option>
                <option value="Resolved">Resolved</option>
                <option value="Traced & Recovered">Traced & Recovered</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="filter-time" className="form-label text-slate-300">Time Range</label>
              <select
                id="filter-time"
                className="form-control"
                value={filterTime}
                onChange={(e) => setFilterTime(e.target.value)}
              >
                <option value="All">All Times</option>
                <option value="24">Previous 24 Hours</option>
                <option value="7">Last 7 Days</option>
                <option value="14">Fortnightly (14 Days)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
            <span>Showing {filteredLogs.length} matching dockets based on command filters.</span>
            <button 
              type="button" 
              className="text-amber-500 hover:underline flex items-center gap-1 font-semibold"
              onClick={() => window.print()}
            >
              <Printer size={12} />
              <span>Print Filtered Log</span>
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Log & Docket Table */}
      <div className="card transition-standard">
        <div className="card-title flex items-center gap-2">
          <Clock size={18} className="text-blue-500" aria-hidden="true" />
          <span>
            {activeNode.type === "HQ" 
              ? "Filtered Command Feeds" 
              : `${activeNode.name} Logs & Docket Feeds`}
          </span>
        </div>
        <div className="list-table-container">
          <table className="list-table">
            <thead>
              <tr>
                <th scope="col">Docket / Ref</th>
                <th scope="col">Station Context</th>
                <th scope="col">Entry Type</th>
                <th scope="col">Time Registered</th>
                <th scope="col">Description</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {(activeNode.type === "HQ" ? filteredLogs : rawLogs).length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-400">
                    No active dockets recorded under this console scope.
                  </td>
                </tr>
              ) : (
                (activeNode.type === "HQ" ? filteredLogs : rawLogs).map((act) => (
                  <tr key={act.id} className="hover:bg-slate-800/20">
                    <td className="tabular-numbers font-semibold text-blue-400" translate="no">{act.id}</td>
                    <td className="text-slate-300">{act.station}</td>
                    <td className="font-medium">{act.type}</td>
                    <td className="tabular-numbers text-slate-400">{getSystemDate(act.time)}</td>
                    <td className="text-slate-200">{act.details}</td>
                    <td>
                      <span className={`badge badge-${act.badge}`}>{act.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISTRICT DAILY MORNING DIARY COMPILE MODAL */}
      {diaryOpen && (
        <div className="modal-overlay" onClick={() => setDiaryOpen(false)} role="dialog" aria-modal="true" aria-labelledby="diary-modal-title">
          <div className="modal-content report-modal transition-standard text-black" onClick={(e) => e.stopPropagation()} style={{ overscrollBehavior: "contain" }}>
            <div className="modal-header border-b border-slate-300 pb-3">
              <h2 id="diary-modal-title" className="flex items-center gap-2 font-serif font-bold text-slate-800 text-lg">
                <BookOpen size={20} className="text-blue-600" />
                <span>Daily Morning Diary compilation (District DCP)</span>
              </h2>
              <button type="button" className="nav-icon-btn text-slate-600 hover:text-slate-900" onClick={() => setDiaryOpen(false)} aria-label="Close diary">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body py-4 font-sans text-xs">
              <div className="report-header-section text-center mb-6 pb-4 border-b border-black">
                <h1 className="text-xl font-bold tracking-wider font-serif">DELHI POLICE</h1>
                <h2 className="text-sm font-semibold uppercase">{activeNode.name.toUpperCase()}</h2>
                <h3 className="text-xs font-medium mt-1">DAILY MORNING DIARY (COMPILATION REPORT)</h3>
                <p className="text-[10px] mt-1">Generated: {getIndianDateString()} | Previous 24-Hours Summary</p>
              </div>

              <div className="mb-4">
                <h4 className="font-bold text-slate-800 border-b border-slate-400 pb-1 mb-2">1. Crime Incidents & FIRs Summary</h4>
                <table className="w-full border-collapse border border-slate-400 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-400 p-1 text-left">Station</th>
                      <th className="border border-slate-400 p-1 text-left">FIR/DD No</th>
                      <th className="border border-slate-400 p-1 text-left">Classification</th>
                      <th className="border border-slate-400 p-1 text-left">Incident Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawLogs.filter(l => l.type === "Case Entry").map(log => (
                      <tr key={log.id}>
                        <td className="border border-slate-400 p-1">{log.station}</td>
                        <td className="border border-slate-400 p-1 font-semibold">{log.id}</td>
                        <td className="border border-slate-400 p-1">{log.crimeHead}</td>
                        <td className="border border-slate-400 p-1">{log.details}</td>
                      </tr>
                    ))}
                    {rawLogs.filter(l => l.type === "Case Entry").length === 0 && (
                      <tr>
                        <td colSpan="4" className="border border-slate-400 p-1 text-center text-slate-500">No FIR cases recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mb-4">
                <h4 className="font-bold text-slate-800 border-b border-slate-400 pb-1 mb-2">2. Active PCR Dispatches Log</h4>
                <table className="w-full border-collapse border border-slate-400 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-400 p-1 text-left">Station</th>
                      <th className="border border-slate-400 p-1 text-left">GD Code</th>
                      <th className="border border-slate-400 p-1 text-left">Dispatch details</th>
                      <th className="border border-slate-400 p-1 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawLogs.filter(l => l.type === "PCR Dispatch").map(log => (
                      <tr key={log.id}>
                        <td className="border border-slate-400 p-1">{log.station}</td>
                        <td className="border border-slate-400 p-1 font-semibold">{log.id}</td>
                        <td className="border border-slate-400 p-1">{log.details}</td>
                        <td className="border border-slate-400 p-1 font-semibold text-green-700">{log.status}</td>
                      </tr>
                    ))}
                    {rawLogs.filter(l => l.type === "PCR Dispatch").length === 0 && (
                      <tr>
                        <td colSpan="4" className="border border-slate-400 p-1 text-center text-slate-500">No PCR dispatches.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mb-4">
                <h4 className="font-bold text-slate-800 border-b border-slate-400 pb-1 mb-2">3. Arrests & Suspect Custody</h4>
                <table className="w-full border-collapse border border-slate-400 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-400 p-1 text-left">Station</th>
                      <th className="border border-slate-400 p-1 text-left">Arrest Ref</th>
                      <th className="border border-slate-400 p-1 text-left">Details</th>
                      <th className="border border-slate-400 p-1 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawLogs.filter(l => l.type === "Arrest Report").map(log => (
                      <tr key={log.id}>
                        <td className="border border-slate-400 p-1">{log.station}</td>
                        <td className="border border-slate-400 p-1 font-semibold">{log.id}</td>
                        <td className="border border-slate-400 p-1">{log.details}</td>
                        <td className="border border-slate-400 p-1 text-blue-700">{log.status}</td>
                      </tr>
                    ))}
                    {rawLogs.filter(l => l.type === "Arrest Report").length === 0 && (
                      <tr>
                        <td colSpan="4" className="border border-slate-400 p-1 text-center text-slate-500">No arrests registered.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-8 pt-4 border-t border-black text-[10px]">
                <div>
                  <span>Generated By: System Operator console</span>
                </div>
                <div className="text-center">
                  <div className="h-6 w-32 border-b border-black mx-auto mb-1"></div>
                  <strong>DCP, {activeNode.name.replace("District: ", "")}</strong>
                </div>
              </div>
            </div>
            <div className="modal-footer border-t border-slate-300 pt-3 flex justify-end gap-2">
              <button type="button" className="btn btn-secondary flex items-center gap-1" onClick={() => window.print()}>
                <Printer size={14} />
                <span>Print Diary</span>
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setDiaryOpen(false)}>
                <span>Approve & Archive</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HQ FORTNIGHTLY COMMAND REPORT MODAL */}
      {reportOpen && (
        <div className="modal-overlay" onClick={() => setReportOpen(false)} role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
          <div className="modal-content report-modal transition-standard text-black" onClick={(e) => e.stopPropagation()} style={{ overscrollBehavior: "contain" }}>
            <div className="modal-header border-b border-slate-300 pb-3">
              <h2 id="report-modal-title" className="flex items-center gap-2 font-serif font-bold text-slate-800 text-lg">
                <FileSpreadsheet size={20} className="text-amber-500" />
                <span>Fortnightly Command Report (Headquarters)</span>
              </h2>
              <button type="button" className="nav-icon-btn text-slate-600 hover:text-slate-900" onClick={() => setReportOpen(false)} aria-label="Close report">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body py-4 font-sans text-xs">
              <div className="report-header-section text-center mb-6 pb-4 border-b border-black">
                <h1 className="text-xl font-bold tracking-wider font-serif">DELHI POLICE HEADQUARTERS</h1>
                <h2 className="text-sm font-semibold uppercase">SUPREME COMMAND AND CONTROL CENTRE</h2>
                <h3 className="text-xs font-medium mt-1">FORTNIGHTLY PERFORMANCE & CRIME ANALYSIS REPORT</h3>
                <p className="text-[10px] mt-1">Compiled: {getIndianDateString()} | Fortnight Range: 14 Days Analysis</p>
              </div>

              <div className="mb-4">
                <h4 className="font-bold text-slate-800 border-b border-slate-400 pb-1 mb-2">1. Fortnightly Crime Volume & Recovery Summary</h4>
                <table className="w-full border-collapse border border-slate-400 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-400 p-1 text-left">Metrics Type</th>
                      <th className="border border-slate-400 p-1 text-center">Volume logged</th>
                      <th className="border border-slate-400 p-1 text-center">Previous 14-days</th>
                      <th className="border border-slate-400 p-1 text-center">Variance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-400 p-1">Total FIR Cases Filed</td>
                      <td className="border border-slate-400 p-1 text-center font-bold">{metrics.firs}</td>
                      <td className="border border-slate-400 p-1 text-center">{(metrics.firs * 0.9).toFixed(0)}</td>
                      <td className="border border-slate-400 p-1 text-center text-red-600 font-semibold">+10.0%</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-1">Total Accused Arrested</td>
                      <td className="border border-slate-400 p-1 text-center font-bold">{metrics.arrests}</td>
                      <td className="border border-slate-400 p-1 text-center">{(metrics.arrests * 0.95).toFixed(0)}</td>
                      <td className="border border-slate-400 p-1 text-center text-green-600 font-semibold">+5.3%</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-1">PCR Distress Calls Received</td>
                      <td className="border border-slate-400 p-1 text-center font-bold">{metrics.pcrCalls}</td>
                      <td className="border border-slate-400 p-1 text-center">{(metrics.pcrCalls * 1.05).toFixed(0)}</td>
                      <td className="border border-slate-400 p-1 text-center text-green-600 font-semibold">-4.8%</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-1">Missing Persons Successfully Traced</td>
                      <td className="border border-slate-400 p-1 text-center font-bold">{metrics.missingFound}</td>
                      <td className="border border-slate-400 p-1 text-center">{(metrics.missingFound * 0.88).toFixed(0)}</td>
                      <td className="border border-slate-400 p-1 text-center text-green-600 font-semibold">+13.6%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mb-4">
                <h4 className="font-bold text-slate-800 border-b border-slate-400 pb-1 mb-2">2. Zone-wise Crime Share Compilation</h4>
                <div className="grid grid-cols-2 gap-4 text-[10px]">
                  {POLICE_HIERARCHY.children.map(zone => {
                    const zoneMetrics = getMetricsForNode(zone.id);
                    return (
                      <div key={zone.id} className="p-2 border border-slate-300 rounded">
                        <strong className="text-slate-800 block mb-1">{zone.name}</strong>
                        <div>Total FIRs: <strong>{zoneMetrics.firs}</strong></div>
                        <div>Total Arrests: <strong>{zoneMetrics.arrests}</strong></div>
                        <div>PCR Calls: <strong>{zoneMetrics.pcrCalls}</strong></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center mt-12 pt-4 border-t border-black text-[10px]">
                <div>
                  <span>Compiled by: Headquarters Data Cell</span>
                </div>
                <div className="text-center">
                  <div className="h-6 w-32 border-b border-black mx-auto mb-1"></div>
                  <strong>Spl. CP (HQ), Delhi Police</strong>
                </div>
              </div>
            </div>
            <div className="modal-footer border-t border-slate-300 pt-3 flex justify-end gap-2">
              <button type="button" className="btn btn-secondary flex items-center gap-1" onClick={() => window.print()}>
                <Printer size={14} />
                <span>Print Report</span>
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setReportOpen(false)}>
                <span>Close & File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
