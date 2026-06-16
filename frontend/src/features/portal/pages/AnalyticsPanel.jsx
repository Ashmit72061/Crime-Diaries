import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore.js';
import axios from 'axios';
import { 
  BarChart3, Calendar, MapPin, FileSpreadsheet, RefreshCw, 
  TrendingUp, Scale, CheckSquare, Layers 
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AnalyticsPanel = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Filter states
  const [recordType, setRecordType] = useState('cases');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedPs, setSelectedPs] = useState('');

  // Dropdowns Lists (fetched from admin routes)
  const [districts, setDistricts] = useState([]);
  const [allSubDivisions, setAllSubDivisions] = useState([]);
  const [subDivisions, setSubDivisions] = useState([]);
  const [policeStations, setPoliceStations] = useState([]);
  const [allStations, setAllStations] = useState([]); // unfiltered list

  // Analytics Output States
  const [summary, setSummary] = useState({ cases: 0, arrests: 0, pcr: 0, missing: 0 });
  const [trends, setTrends] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [compareAxis, setCompareAxis] = useState('station');
  const [requestedAxis, setRequestedAxis] = useState(
    user.role === 'hq' || user.role === 'admin' ? 'district' :
    user.role === 'dcp' ? 'sub_division' :
    user.role === 'acp' ? 'station' : 'beat'
  );
  
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [selectedSubDivisions, setSelectedSubDivisions] = useState([]);
  const [selectedStations, setSelectedStations] = useState([]);
  const [beatsFilter, setBeatsFilter] = useState('');

  // Load structure selectors
  const loadSelectors = async () => {
    try {
      const response = await axios.get('/api/v1/admin/jurisdictions');
      const { districts: dst, subDivisions: sdv, policeStations: pst } = response.data.data;
      setDistricts(dst);
      setAllSubDivisions(sdv || []);
      setAllStations(pst);

      // Scoped default selections
      if (user.role === 'ps') {
        setPoliceStations(pst.filter(p => p.id === user.policeStation));
      } else if (user.role === 'acp') {
        const subdivisionStations = pst.filter(p => p.sub_division_id === user.subDivision);
        setPoliceStations(subdivisionStations);
      } else if (user.role === 'dcp') {
        setSubDivisions((sdv || []).filter(s => s.district_id === user.district));
        setPoliceStations(pst.filter(p => p.district_id === user.district));
      } else {
        // HQ / Admin: can choose everything
        setSubDivisions(sdv || []);
        setPoliceStations(pst);
      }
    } catch (e) {
      toast.error('Failed to load geographical filters.');
    }
  };

  // Adjust PS selector when District selection changes (HQ only)
  useEffect(() => {
    if (user.role === 'hq' || user.role === 'admin') {
      if (selectedDistricts.length > 0) {
        setSubDivisions(allSubDivisions.filter(s => selectedDistricts.includes(s.district_id.toString())));
        setPoliceStations(allStations.filter(p => selectedDistricts.includes(p.district_id.toString())));
      } else {
        setSubDivisions(allSubDivisions);
        setPoliceStations(allStations);
      }
    }
    // reset lower selections
    setSelectedSubDivisions([]);
    setSelectedStations([]);
  }, [selectedDistricts]);

  // Adjust PS selector when Sub-Division selection changes
  useEffect(() => {
    if (user.role === 'hq' || user.role === 'admin' || user.role === 'dcp') {
      if (selectedSubDivisions.length > 0) {
        setPoliceStations(allStations.filter(p => selectedSubDivisions.includes(p.sub_division_id.toString())));
      } else {
        // Fall back to district level filter if applicable
        if (selectedDistricts.length > 0) {
          setPoliceStations(allStations.filter(p => selectedDistricts.includes(p.district_id.toString())));
        } else if (user.role === 'dcp') {
          setPoliceStations(allStations.filter(p => p.district_id === user.district));
        } else {
          setPoliceStations(allStations);
        }
      }
      setSelectedStations([]);
    }
  }, [selectedSubDivisions]);

  const runQueries = async () => {
    try {
      setLoading(true);
      const params = {
        recordType,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(requestedAxis && { compareAxis: requestedAxis }),
        ...(selectedDistricts.length > 0 && { districts: selectedDistricts.join(',') }),
        ...(selectedSubDivisions.length > 0 && { subDivisions: selectedSubDivisions.join(',') }),
        ...(selectedStations.length > 0 && { stations: selectedStations.join(',') }),
        ...(beatsFilter && { beats: beatsFilter })
      };

      // 1. Fetch live summaries
      const summaryRes = await axios.get('/api/v1/analytics/summary', { params });
      setSummary(summaryRes.data.data.summary);

      // 2. Fetch monthly trend groupings
      const trendsRes = await axios.get('/api/v1/analytics/trends', { params });
      setTrends(trendsRes.data.data.trends);

      // 3. Fetch side-by-side comparison axis data
      const compareRes = await axios.get('/api/v1/analytics/compare', { params });
      setComparisons(compareRes.data.data.comparisons);
      setCompareAxis(compareRes.data.data.axis);

    } catch (err) {
      toast.error('Aggregation query failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSelectors();
  }, []);

  useEffect(() => {
    runQueries();
  }, [recordType, dateFrom, dateTo]);

  const triggerExport = () => {
    const query = new URLSearchParams({
      recordType,
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(requestedAxis && { compareAxis: requestedAxis }),
      ...(selectedDistricts.length > 0 && { districts: selectedDistricts.join(',') }),
      ...(selectedSubDivisions.length > 0 && { subDivisions: selectedSubDivisions.join(',') }),
      ...(selectedStations.length > 0 && { stations: selectedStations.join(',') }),
      ...(beatsFilter && { beats: beatsFilter })
    }).toString();
    window.open(`/api/v1/analytics/export?${query}`, '_blank');
  };

  // Get list of unique classifications present in comparisons to render table columns
  const getUniqueClassifications = () => {
    const list = new Set();
    comparisons.forEach(c => {
      Object.keys(c.classifications || {}).forEach(k => list.add(k));
    });
    return Array.from(list);
  };

  const uniqueClasses = getUniqueClassifications();

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-zinc-100 flex items-center gap-2">
            <BarChart3 className="text-amber-500" />
            <span>Jurisdiction Analytics Dashboard</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Generate compiled operational summaries, monthly trends, and comparative reports.
          </p>
        </div>

        <button
          onClick={triggerExport}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          <FileSpreadsheet size={16} />
          <span>Export Scoped Report</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="glass-card p-5 rounded-2xl border border-zinc-800 space-y-4 bg-zinc-900/10">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Layers size={14} className="text-amber-500" />
          <span>Report Filter Constraints</span>
        </h3>

        <div className="flex flex-wrap gap-4 items-start">
          {/* Module Select */}
          <div className="space-y-1.5 flex-1 min-w-[160px]">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">Operational Module</label>
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
            >
              <option value="cases">Cases (FIR/DD)</option>
              <option value="arrests">Arrests Master</option>
              <option value="pcr">PCR Calls & Kalandra</option>
              <option value="missing">Missing / Recovered</option>
            </select>
          </div>

          {/* Date range from */}
          <div className="space-y-1.5 flex-1 min-w-[160px]">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">Start Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-xs text-zinc-300 focus:outline-none"
            />
          </div>

          {/* Date range to */}
          <div className="space-y-1.5 flex-1 min-w-[160px]">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">End Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-xs text-zinc-300 focus:outline-none"
            />
          </div>

          {/* Districts Select (HQ only) */}
          {(user.role === 'hq' || user.role === 'admin') && (
            <div className="space-y-1.5 flex-1 min-w-[160px]">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Compare Districts</label>
              <div className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-xs text-zinc-300 focus:outline-none h-24 overflow-y-auto custom-scrollbar space-y-1">
                {districts.map(d => (
                  <label key={d.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-zinc-900 px-1 py-0.5 rounded transition-colors">
                    <input
                      type="checkbox"
                      value={d.id.toString()}
                      checked={selectedDistricts.includes(d.id.toString())}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedDistricts(prev => 
                          e.target.checked ? [...prev, val] : prev.filter(id => id !== val)
                        );
                      }}
                      className="w-3.5 h-3.5 bg-zinc-900 border border-zinc-700 rounded text-amber-500 focus:ring-amber-500 focus:ring-1"
                    />
                    <span className="truncate">{d.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Divisions Select (HQ, DCP) */}
          {(user.role === 'hq' || user.role === 'admin' || user.role === 'dcp') && (
            <div className="space-y-1.5 flex-1 min-w-[160px]">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Compare Sub-Divs</label>
              <div className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-xs text-zinc-300 focus:outline-none h-24 overflow-y-auto custom-scrollbar space-y-1">
                {subDivisions.map(s => (
                  <label key={s.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-zinc-900 px-1 py-0.5 rounded transition-colors">
                    <input
                      type="checkbox"
                      value={s.id.toString()}
                      checked={selectedSubDivisions.includes(s.id.toString())}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedSubDivisions(prev => 
                          e.target.checked ? [...prev, val] : prev.filter(id => id !== val)
                        );
                      }}
                      className="w-3.5 h-3.5 bg-zinc-900 border border-zinc-700 rounded text-amber-500 focus:ring-amber-500 focus:ring-1"
                    />
                    <span className="truncate">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Specific Station Select (HQ, DCP, ACP) */}
          {user.role !== 'ps' && (
            <div className="space-y-1.5 flex-1 min-w-[160px]">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Compare Stations</label>
              <div className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-xs text-zinc-300 focus:outline-none h-24 overflow-y-auto custom-scrollbar space-y-1">
                {policeStations.map(ps => (
                  <label key={ps.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-zinc-900 px-1 py-0.5 rounded transition-colors">
                    <input
                      type="checkbox"
                      value={ps.id.toString()}
                      checked={selectedStations.includes(ps.id.toString())}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedStations(prev => 
                          e.target.checked ? [...prev, val] : prev.filter(id => id !== val)
                        );
                      }}
                      className="w-3.5 h-3.5 bg-zinc-900 border border-zinc-700 rounded text-amber-500 focus:ring-amber-500 focus:ring-1"
                    />
                    <span className="truncate">{ps.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Beat Text Filter (PS) */}
          {user.role === 'ps' && recordType === 'cases' && (
            <div className="space-y-1.5 flex-1 min-w-[160px]">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Filter Beat(s)</label>
              <input
                type="text"
                placeholder="e.g. 1A, 2B (comma separated)"
                value={beatsFilter}
                onChange={(e) => setBeatsFilter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-xs text-zinc-300 focus:outline-none"
              />
              <p className="text-[9px] text-zinc-500 leading-none">Enter exact beat numbers</p>
            </div>
          )}

          {/* Grouping Select */}
          {user.role !== 'ps' && (
            <div className="space-y-1.5 flex-1 min-w-[160px]">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Grouping Level</label>
              <select
                value={requestedAxis}
                onChange={(e) => setRequestedAxis(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
              >
                {(user.role === 'hq' || user.role === 'admin') && <option value="district">District-wise</option>}
                {(user.role === 'hq' || user.role === 'admin' || user.role === 'dcp') && <option value="sub_division">Sub-Division-wise</option>}
                <option value="station">Police Station-wise</option>
                {recordType === 'cases' && <option value="beat">Beat-wise</option>}
              </select>
            </div>
          )}

          {/* Scoped selectors info */}
          <div className="space-y-1.5 flex flex-col justify-center min-w-[140px] pt-5">
            <button
              onClick={runQueries}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-750 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid summary counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'cases', val: summary.cases, label: 'Cases Registered' },
          { key: 'arrests', val: summary.arrests, label: 'Arrests Detailed' },
          { key: 'pcr', val: summary.pcr, label: 'PCR Dispatch Calls' },
          { key: 'missing', val: summary.missing, label: 'Missing / Recovery Files' },
        ].map(item => (
          <div key={item.key} className="glass-card p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/10">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">{item.label}</span>
            <span className="text-2xl font-black text-zinc-100 mt-1 block">{item.val}</span>
          </div>
        ))}
      </div>

      {/* Row: Comparisons and Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Comparative Analysis Table */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-md font-bold text-zinc-300 flex items-center gap-2">
            <Scale className="text-amber-500" />
            <span>Comparative Analysis (Live Submitted Data)</span>
          </h2>

          <div className="glass-card rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/10">
            {loading ? (
              <div className="p-8 text-center text-xs text-zinc-500">Recalculating comparison matrix...</div>
            ) : comparisons.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">No comparative records available inside range.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-850">
                      <th className="p-4 uppercase font-bold tracking-wider text-zinc-400">
                        {compareAxis === 'district' ? 'District' : compareAxis === 'sub_division' ? 'Sub-Division' : compareAxis === 'station' ? 'Police Station' : 'Beat ID'}
                      </th>
                      {uniqueClasses.map(cls => (
                        <th key={cls} className="p-4 uppercase font-bold tracking-wider text-zinc-400 text-center">
                          {cls}
                        </th>
                      ))}
                      <th className="p-4 uppercase font-bold tracking-wider text-amber-500 text-right">
                        Total Sum
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {comparisons.map((row) => (
                      <tr key={row.key} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="p-4 font-semibold text-zinc-200">{row.label}</td>
                        {uniqueClasses.map(cls => (
                          <td key={cls} className="p-4 text-center text-zinc-400">
                            {row.classifications[cls] || 0}
                          </td>
                        ))}
                        <td className="p-4 text-right font-black text-amber-500">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trend Grid */}
        <div className="space-y-4">
          <h2 className="text-md font-bold text-zinc-300 flex items-center gap-2">
            <TrendingUp className="text-amber-500" />
            <span>Monthly Trends</span>
          </h2>

          <div className="glass-card p-5 rounded-2xl border border-zinc-800 bg-zinc-900/10 space-y-4">
            {loading ? (
              <div className="text-center py-6 text-xs text-zinc-500">Recalculating trend charts...</div>
            ) : trends.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500">No trend data found.</div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {trends.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">
                        Month: {t._id.month}/{t._id.year}
                      </span>
                      <div className="text-xs font-bold text-zinc-300">
                        {t._id.classification.code}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-sm text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                        {t.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
