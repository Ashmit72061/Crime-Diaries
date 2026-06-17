import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore.js";
import api from "../../utils/api.js";
import StationFilters from "../../components/common/StationFilters.jsx";
import StationSummaryCards from "../../components/common/StationSummaryCards.jsx";
import StationPerformanceTable from "../../components/common/StationPerformanceTable.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { Shield } from "lucide-react";

export default function StationPerformanceDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, activeNodeId } = useAuthStore();
  
  const isHq = location.pathname.startsWith("/hq");
  
  const [nodes, setNodes] = useState([]);
  const [records, setRecords] = useState([]);
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

  // Fetch nodes and records
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Load hierarchy nodes and all records
        const [nodesRes, recordsRes] = await Promise.all([
          api.get("/hierarchy/nodes"),
          api.get("/records"),
        ]);
        
        setNodes(nodesRes.data.data || []);
        setRecords(recordsRes.data.data?.cases || recordsRes.data.data || []);
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

    const finalStations = listToProcess.map((s) => {
      const agg = statsMap[s.id] || {
        cases: 0,
        arrests: 0,
        pcr: 0,
        missing: 0,
        pending: 0,
        approved: 0,
        last_activity: null,
      };
      
      return {
        id: s.id,
        name_en: s.name_en || s.name,
        district_id: userDistrictNode?.id || s.parent_id,
        district_name: isHq ? getDistrictName(s) : (userDistrictNode?.name_en || userDistrictNode?.name || "District"),
        ...agg,
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
  }, [scopedStations, records, filters, isHq, userDistrictNode, nodes]);

  const handleRowClick = (stationId) => {
    const basePath = isHq ? "/hq/stations" : "/district/stations";
    navigate(`${basePath}/${stationId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper font-sans text-slate-100">
        <div className="card p-6 border border-red-500/30 bg-red-950/20 text-red-400">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper font-sans text-slate-100">
      <div className="page-header flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            <Shield className="text-amber-500" size={24} />
            Station Wise Performance Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isHq 
              ? "HQ Consolidated Police Station Performance Comparison Console (Consolidated Delhi)" 
              : `Police Station metrics under ${userDistrictNode?.name_en || "District"} boundary`}
          </p>
        </div>
      </div>

      {/* Summary KPIs */}
      <StationSummaryCards summary={calculatedData.summary} isHq={isHq} />

      {/* Dropdown Filters */}
      <StationFilters
        districts={districts}
        stations={scopedStations}
        filters={filters}
        setFilters={setFilters}
        isHq={isHq}
        allNodes={nodes}
      />


      {/* Main Comparative Grid */}
      <StationPerformanceTable
        stations={calculatedData.stations}
        isHq={isHq}
        onRowClick={handleRowClick}
      />
    </div>
  );
}
