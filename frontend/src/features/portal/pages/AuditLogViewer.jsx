import { useState, useEffect } from 'react';
import axios from 'axios';
import { History, Search, Calendar, RefreshCw, Eye, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [tableName, setTableName] = useState('');
  const [actionType, setActionType] = useState('');
  const [username, setUsername] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selected Log detail modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        ...(tableName && { tableName }),
        ...(actionType && { actionType }),
        ...(username && { username }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      };

      const response = await axios.get('/api/v1/audit', { params });
      setLogs(response.data.data.logs);
    } catch (e) {
      toast.error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [tableName, actionType]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-zinc-100 flex items-center gap-2">
          <History className="text-amber-500" />
          <span>System Audit Ledger Logs</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-1">
          Review a complete history of database creations, operational edits, and DCP classification overrides.
        </p>
      </div>

      {/* Filter panel */}
      <div className="glass-card p-4 rounded-xl border border-zinc-800 flex flex-wrap items-center gap-4 bg-zinc-900/20">
        <div className="flex-1 min-w-[200px] relative">
          <input
            type="text"
            placeholder="Search by username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 focus:outline-none px-3.5 py-2 rounded-lg text-xs text-zinc-200"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500">Module</span>
          <select
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-300"
          >
            <option value="">All Tables</option>
            <option value="cases">Cases</option>
            <option value="arrests">Arrests</option>
            <option value="pcr_klandras">PCR Calls</option>
            <option value="missing_persons">Missing Files</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500">Action</span>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-300"
          >
            <option value="">All Actions</option>
            <option value="create">CREATE</option>
            <option value="update">UPDATE</option>
            <option value="override">OVERRIDE</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 px-2 py-1.5 rounded-lg text-xs text-zinc-350"
          />
        </div>

        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Apply</span>
        </button>
      </div>

      {/* Grid listing */}
      <div className="glass-card rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/10">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500">Querying ledger logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">No logs matching filter bounds.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-900 border-b border-zinc-850">
                  <th className="p-4 uppercase font-bold text-zinc-400">Timestamp</th>
                  <th className="p-4 uppercase font-bold text-zinc-400">User (Role)</th>
                  <th className="p-4 uppercase font-bold text-zinc-400">Registry Table</th>
                  <th className="p-4 uppercase font-bold text-zinc-400 text-center">Action</th>
                  <th className="p-4 uppercase font-bold text-zinc-400">Changed field</th>
                  <th className="p-4 uppercase font-bold text-zinc-400">Comments / Reason</th>
                  <th className="p-4 uppercase font-bold text-zinc-400 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-4 text-zinc-400 font-mono">
                      {new Date(log.changed_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold text-zinc-200">
                      {log.user_name} <span className="text-[10px] text-zinc-500 uppercase">({log.changed_by_role})</span>
                    </td>
                    <td className="p-4 text-zinc-400">{log.table_name}</td>
                    <td className="p-4 text-center">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${log.action === 'override' ? 'bg-red-500/10 border-red-500/20 text-red-400' : log.action === 'update' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-300 font-mono">{log.field_name || 'All'}</td>
                    <td className="p-4 text-zinc-400 max-w-[200px] truncate">{log.reason || 'N/A'}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 max-w-2xl w-full rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
              <h3 className="font-bold text-zinc-200 flex items-center gap-2">
                <AlertCircle className="text-amber-500" />
                <span>Audit Log Details</span>
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-zinc-500 hover:text-zinc-300 text-sm font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-500 block">Record ID reference</span>
                <span className="text-zinc-300 font-semibold">{selectedLog.record_id}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Operator IP</span>
                <span className="text-zinc-300 font-semibold">{selectedLog.ip_address}</span>
              </div>
            </div>

            {selectedLog.old_value && (
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs block">Previous / Old Value</span>
                <pre className="p-3 bg-zinc-950 border border-zinc-850 text-[10px] text-zinc-400 rounded-lg max-h-[120px] overflow-y-auto font-mono whitespace-pre-wrap">
                  {selectedLog.old_value}
                </pre>
              </div>
            )}

            {selectedLog.new_value && (
              <div className="space-y-1">
                <span className="text-zinc-500 text-xs block">Updated / New Value</span>
                <pre className="p-3 bg-zinc-950 border border-zinc-850 text-[10px] text-zinc-400 rounded-lg max-h-[150px] overflow-y-auto font-mono whitespace-pre-wrap">
                  {selectedLog.new_value}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
