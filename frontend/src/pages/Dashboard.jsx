import React from "react";
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
  AlertTriangle
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  // Format numbers as per locale rules in skill.md
  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };

  const getSystemDate = (dateString) => {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
    }).format(new Date(dateString));
  };

  const stats = [
    { 
      label: "Total Registered FIRs", 
      value: 1245, 
      icon: FileText, 
      trend: "+12% from last month", 
      trendType: "up",
      colorClass: "primary"
    },
    { 
      label: "Accused Arrested", 
      value: 384, 
      icon: UserX, 
      trend: "+8% this week", 
      trendType: "up",
      colorClass: "success"
    },
    { 
      label: "Today's PCR Dispatches", 
      value: 142, 
      icon: PhoneCall, 
      trend: "-3% vs yesterday", 
      trendType: "down",
      colorClass: "warning"
    },
    { 
      label: "Missing Found Status", 
      value: 89, 
      icon: Search, 
      trend: "82% success rate", 
      trendType: "up",
      colorClass: "danger"
    }
  ];

  const recentActivities = [
    { 
      id: "FIR-2026/0452", 
      type: "Case Entry", 
      time: "2026-06-13T10:30:00Z", 
      details: "Attempted robbery near Connaught Place", 
      status: "Active Investigation",
      badge: "warning" 
    },
    { 
      id: "ARR-2026/0112", 
      type: "Arrest Report", 
      time: "2026-06-13T09:15:00Z", 
      details: "NAFIS verified arrest under Sec 379 IPC", 
      status: "Approved",
      badge: "success" 
    },
    { 
      id: "PCR-2026/8891", 
      type: "PCR Dispatch", 
      time: "2026-06-13T08:45:00Z", 
      details: "Traffic dispute handled at ITO crossing", 
      status: "Resolved",
      badge: "success" 
    },
    { 
      id: "UIDB-2026/004", 
      type: "UIDB Entry", 
      time: "2026-06-12T17:20:00Z", 
      details: "Unidentified male corpse recovered at Yamuna Bank", 
      status: "ZIPNET Matching",
      badge: "info" 
    },
    { 
      id: "MIS-2026/0991", 
      type: "Missing Child", 
      time: "2026-06-12T14:10:00Z", 
      details: "Missing 14-year-old child reported from Karol Bagh", 
      status: "Traced & Recovered",
      badge: "success" 
    }
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 translate="no" className="text-pretty">Delhi Police Command Console</h1>
          <p className="page-desc">Real-time crime statistics, daily dairies, and automatic report pipelines.</p>
        </div>
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={() => navigate("/dashboard/case-management")}
          aria-label="Create a new Crime Diary entry"
        >
          <span>New Entry Form</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="dashboard-grid">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="stat-card">
              <div className={`stat-icon ${item.colorClass}`} aria-hidden="true">
                <Icon size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label text-xs">{item.label}</span>
                <span className="stat-value tabular-numbers">{formatNumber(item.value)}</span>
                <span className={`stat-trend ${item.trendType} flex items-center text-xs mt-1`}>
                  {item.trendType === "up" ? (
                    <TrendingUp size={12} className="mr-1 inline" aria-hidden="true" />
                  ) : (
                    <TrendingDown size={12} className="mr-1 inline" aria-hidden="true" />
                  )}
                  {item.trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="analytics-charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h2>Monthly Registered Crime Trends</h2>
            <span className="badge badge-info text-pretty">Updated Hourly</span>
          </div>
          
          <div className="chart-container" aria-label="Monthly crime trend chart showing crime rates from January to June">
            {/* June */}
            <div className="chart-bar-group">
              <div className="chart-bar" style={{ height: "80%" }}>
                <span className="chart-bar-value tabular-numbers">{formatNumber(480)}</span>
              </div>
              <span className="chart-label">Jun</span>
            </div>
            {/* May */}
            <div className="chart-bar-group">
              <div className="chart-bar" style={{ height: "65%" }}>
                <span className="chart-bar-value tabular-numbers">{formatNumber(390)}</span>
              </div>
              <span className="chart-label">May</span>
            </div>
            {/* April */}
            <div className="chart-bar-group">
              <div className="chart-bar" style={{ height: "72%" }}>
                <span className="chart-bar-value tabular-numbers">{formatNumber(430)}</span>
              </div>
              <span className="chart-label">Apr</span>
            </div>
            {/* March */}
            <div className="chart-bar-group">
              <div className="chart-bar" style={{ height: "55%" }}>
                <span className="chart-bar-value tabular-numbers">{formatNumber(330)}</span>
              </div>
              <span className="chart-label">Mar</span>
            </div>
            {/* February */}
            <div className="chart-bar-group">
              <div className="chart-bar" style={{ height: "45%" }}>
                <span className="chart-bar-value tabular-numbers">{formatNumber(270)}</span>
              </div>
              <span className="chart-label">Feb</span>
            </div>
            {/* January */}
            <div className="chart-bar-group">
              <div className="chart-bar" style={{ height: "50%" }}>
                <span className="chart-bar-value tabular-numbers">{formatNumber(300)}</span>
              </div>
              <span className="chart-label">Jan</span>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h2>PCR Dispatch Status</h2>
          <p className="page-desc mb-4">Current workload for response vehicles.</p>
          
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Average Response Time</span>
                <span className="tabular-numbers font-semibold">11&nbsp;Mins</span>
              </div>
              <div className="h-2 bg-slate-200 rounded">
                <div style={{ width: "85%", height: "100%", backgroundColor: "var(--primary-accent)", borderRadius: "4px" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Active PCR Cars Dispatched</span>
                <span className="tabular-numbers font-semibold">42 / 60</span>
              </div>
              <div className="h-2 bg-slate-200 rounded">
                <div style={{ width: "70%", height: "100%", backgroundColor: "var(--success)", borderRadius: "4px" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Pending Dispatch Calls</span>
                <span className="tabular-numbers font-semibold">8 Calls</span>
              </div>
              <div className="h-2 bg-slate-200 rounded">
                <div style={{ width: "15%", height: "100%", backgroundColor: "var(--danger)", borderRadius: "4px" }}></div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-slate-100 rounded flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs font-medium text-slate-600">
              High Call Volumes reported in East Delhi District today.
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card">
        <div className="card-title">
          <Clock size={18} aria-hidden="true" />
          <span>Real-time Log & Docket Feeds</span>
        </div>
        <div className="list-table-container">
          <table className="list-table">
            <thead>
              <tr>
                <th scope="col">Docket / Ref</th>
                <th scope="col">Entry Type</th>
                <th scope="col">Time Registered</th>
                <th scope="col">Description</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((act) => (
                <tr key={act.id}>
                  <td className="tabular-numbers font-semibold" translate="no">{act.id}</td>
                  <td>{act.type}</td>
                  <td className="tabular-numbers">{getSystemDate(act.time)}</td>
                  <td>{act.details}</td>
                  <td>
                    <span className={`badge badge-${act.badge}`}>{act.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
