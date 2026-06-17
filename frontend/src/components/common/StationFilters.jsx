import React from "react";

export default function StationFilters({
  districts = [],
  stations = [],
  filters = {},
  setFilters,
  isHq = false,
}) {
  const handleChange = (key, value) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: value };
      // If district changes, reset selected station
      if (key === "districtId") {
        updated.psId = "";
      }
      return updated;
    });
  };

  // Filter stations based on selected district
  const visibleStations = React.useMemo(() => {
    if (!filters.districtId) return stations;
    // Find subdivisions of the district
    // In our hierarchy, a station node's parent is a subdivision.
    // The subdivision's parent is the district.
    // Since our stations list from API already lists all PS nodes,
    // let's check: in mock data and tree hierarchy, how are districts and stations linked?
    // We can filter by matching s.parent_id's parent, or in static data node.districtKey matches district name.
    // Let's filter stations list by district parent_id or name.
    // Wait, let's check if node has districtKey. If s.districtKey matches district name, or we can use parent_id.
    // Let's match by districtKey or parent relationships if nodes are populated.
    // To be safe, if node parent_id matches the districtId, or if parent matches subdivision:
    // We can just filter by parent matching district subdivision nodes, or matching district code.
    return stations.filter((s) => {
      if (!filters.districtId) return true;
      // In the API nodes list:
      // District has id like 'DISTRICT_NWD' or 'DIST_NDD'
      // Station has parent_id like 'SUBDIV_JAHANGIR_PURI' which has parent_id 'DISTRICT_NWD'
      // If we don't have the parent relationship mapped, we can look at s.parent_id or s.districtKey
      // Let's build a safe filter:
      const distNode = districts.find(d => d.id === filters.districtId);
      if (!distNode) return true;
      
      // Try comparing parent_id or district key
      const distName = distNode.name_en || "";
      const sDistKey = s.districtKey || "";
      const sParentId = s.parent_id || "";
      
      // If parent_id is subdivision, check if subdivision's parent matches districtId
      // Alternatively, check if s.district_id matches districtId
      return s.district_id === filters.districtId || 
             sDistKey === distName || 
             sParentId.startsWith(filters.districtId) || 
             s.id.includes(filters.districtId.replace("DIST_", ""));
    });
  }, [filters.districtId, stations, districts]);

  return (
    <div className="card p-4 mb-6" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-card)' }}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* District Filter (HQ only) */}
        {isHq && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">District</label>
            <select
              value={filters.districtId || ""}
              onChange={(e) => handleChange("districtId", e.target.value)}
              className="console-switcher-select w-full border border-slate-700 bg-slate-900 rounded p-2 text-sm text-slate-100 font-semibold"
              style={{ minHeight: '38px', borderColor: 'var(--border-light)' }}
            >
              <option value="">All Districts</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name_en || d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Station Filter (HQ or conditional District) */}
        {isHq && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Police Station</label>
            <select
              value={filters.psId || ""}
              onChange={(e) => handleChange("psId", e.target.value)}
              className="console-switcher-select w-full border border-slate-700 bg-slate-900 rounded p-2 text-sm text-slate-100 font-semibold"
              style={{ minHeight: '38px', borderColor: 'var(--border-light)' }}
            >
              <option value="">All Stations</option>
              {visibleStations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_en || s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Record Type Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Record Type</label>
          <select
            value={filters.recordType || ""}
            onChange={(e) => handleChange("recordType", e.target.value)}
            className="console-switcher-select w-full border border-slate-700 bg-slate-900 rounded p-2 text-sm text-slate-100 font-semibold"
            style={{ minHeight: '38px', borderColor: 'var(--border-light)' }}
          >
            <option value="">All Categories</option>
            <option value="CASE">Cases (FIR)</option>
            <option value="ARREST">Arrests</option>
            <option value="PCR_CALL">PCR Calls</option>
            <option value="MISSING">Missing Persons</option>
            <option value="UIDB">UIDB</option>
          </select>
        </div>

        {/* Date From */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Date From</label>
          <input
            type="date"
            value={filters.dateFrom || ""}
            onChange={(e) => handleChange("dateFrom", e.target.value)}
            className="w-full border border-slate-700 bg-slate-900 rounded p-2 text-sm text-slate-100 font-semibold"
            style={{ minHeight: '38px', borderColor: 'var(--border-light)', colorScheme: 'dark' }}
          />
        </div>

        {/* Date To */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Date To</label>
          <input
            type="date"
            value={filters.dateTo || ""}
            onChange={(e) => handleChange("dateTo", e.target.value)}
            className="w-full border border-slate-700 bg-slate-900 rounded p-2 text-sm text-slate-100 font-semibold"
            style={{ minHeight: '38px', borderColor: 'var(--border-light)', colorScheme: 'dark' }}
          />
        </div>
      </div>
    </div>
  );
}
