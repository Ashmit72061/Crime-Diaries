import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, Calendar, Download, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api.js';

export default function ReportBuilder() {
  const queryClient = useQueryClient();
  const [template, setTemplate] = useState('Cases Daily Diary Summary');
  const [fromDate, setFromDate] = useState(() => new Date(Date.now() - 3600000 * 24 * 7).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [format, setFormat] = useState('xlsx');

  // Background report task state
  const [generating, setGenerating] = useState(false);
  const [reportResult, setReportResult] = useState(null);

  // Simulated reports history registry
  const [history, setHistory] = useState([
    { id: 'rep-5028', template: 'Arrest Master Registers', period: '2026-06-01 to 2026-06-14', format: 'xlsx', status: 'READY', url: '#' },
    { id: 'rep-4912', template: 'PCR Kalandra Calls Log', period: '2026-06-10 to 2026-06-15', format: 'csv', status: 'READY', url: '#' }
  ]);

  // Generate Report Mutation
  const generateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/reports/generate', payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      setGenerating(true);
      toast.loading('Compiling spreadsheet report in background...', { id: 'report-toast' });
      
      // Poll report status
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts += 1;
        try {
          const statusRes = await api.get(`/reports/status/${data.reportId}`);
          if (statusRes.data.data.status === 'READY' || attempts >= 3) {
            clearInterval(interval);
            setGenerating(false);
            setReportResult(statusRes.data.data);
            
            // Add to history list
            setHistory(prev => [
              {
                id: statusRes.data.data.reportId,
                template,
                period: `${fromDate} to ${toDate}`,
                format,
                status: 'READY',
                url: statusRes.data.data.downloadUrl
              },
              ...prev
            ]);
            
            toast.success('Spreadsheet compiled and ready for download!', { id: 'report-toast' });
          }
        } catch (e) {
          clearInterval(interval);
          setGenerating(false);
          toast.error('Failed to compile report', { id: 'report-toast' });
        }
      }, 2000);
    },
    onError: (err) => {
      toast.error('Failed to trigger report compilation');
    }
  });

  const handleGenerate = (e) => {
    e.preventDefault();
    setReportResult(null);
    generateMutation.mutate({ template, fromDate, toDate, format });
  };

  // Helper to trigger direct download of mock excel bytes
  const handleDownloadFile = (item) => {
    // Generate a simple CSV content representing the dynamic excel file data
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Delhi Police Daily Operational Log\n"
      + `Report Template: ${item.template}\n`
      + `Scope Period: ${item.period}\n`
      + `Generated On: ${new Date().toLocaleDateString()}\n\n`
      + "Ref ID,Record Type,Gist,Status,Date\n"
      + "210/2026,CASE,Theft report at Parliament St Market,PENDING_SHO,2026-06-15\n"
      + "45B,PCR_CALL,Altercation resolved at Parliament St flats,SENT_BACK_HC,2026-06-15\n"
      + "Arrest-01,ARREST,Suraj Pal detained at Palika Bazaar,DRAFT,2026-06-16\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pharos_compiled_${item.id}.${item.format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Spreadsheet downloaded successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-zinc-100 flex items-center gap-2">
          <FileSpreadsheet className="text-[#cca43b]" />
          <span>Excel Export Manager</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-1">
          Compile hierarchy-scoped data registers, morning general diaries, or crime head tallies into formatted spreadsheets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Parameter Card */}
        <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4 h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2 flex items-center gap-1.5">
            <Calendar size={14} className="text-[#cca43b]" />
            <span>Export Parameters</span>
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">Report Proforma Template:</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 outline-none focus:border-[#cca43b] transition-all cursor-pointer"
              >
                <option value="Cases Daily Diary Summary">Cases Daily Diary Summary (Cases Master)</option>
                <option value="Arrest Master Registers">Arrest Master Registers (Arrests logs)</option>
                <option value="PCR Kalandra Calls Log">PCR Kalandra Calls Log (PCR emergency logs)</option>
                <option value="Missing Persons Register">Missing Persons Register (Missing logs)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold">From Date:</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 outline-none focus:border-[#cca43b] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold">To Date:</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 outline-none focus:border-[#cca43b] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold">File Spreadsheet Format:</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                  <input
                    type="radio"
                    checked={format === 'xlsx'}
                    onChange={() => setFormat('xlsx')}
                    className="accent-[#cca43b]"
                  />
                  <span>Excel (.xlsx)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                  <input
                    type="radio"
                    checked={format === 'csv'}
                    onChange={() => setFormat('csv')}
                    className="accent-[#cca43b]"
                  />
                  <span>CSV File (.csv)</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full bg-[#cca43b] hover:bg-amber-600 text-zinc-950 font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Compiling Registry...</span>
                </>
              ) : (
                <>
                  <FileText size={14} />
                  <span>Generate Excel Report</span>
                </>
              )}
            </button>
          </form>

          {/* Direct download banner */}
          {reportResult && (
            <div className="bg-emerald-950/25 border border-emerald-800/40 rounded-xl p-3 text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex gap-1.5 items-center text-emerald-400 font-semibold">
                <CheckCircle2 size={14} />
                <span>Spreadsheet ready!</span>
              </div>
              <button
                onClick={() => handleDownloadFile({ id: reportResult.reportId, template, format })}
                className="w-full bg-emerald-650 hover:bg-emerald-600 text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download size={12} />
                <span>Download Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Columns: Generated archives logs history */}
        <div className="lg:col-span-2 border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2">
            Export History Log
          </h3>

          <div className="overflow-x-auto border border-zinc-850 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950/60 text-zinc-400 uppercase font-semibold border-b border-zinc-850">
                  <th className="p-3 pl-4">Export ID</th>
                  <th className="p-3">Template</th>
                  <th className="p-3">Scope Date Range</th>
                  <th className="p-3">Format</th>
                  <th className="p-3 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-zinc-300">
                {history.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-3 pl-4 font-mono font-bold text-zinc-400">{item.id}</td>
                    <td className="p-3 font-semibold text-zinc-200">{item.template}</td>
                    <td className="p-3 text-[11px] text-zinc-400 font-mono">{item.period}</td>
                    <td className="p-3 uppercase font-bold text-[#cca43b]">{item.format}</td>
                    <td className="p-3 pr-4 text-right">
                      <button
                        onClick={() => handleDownloadFile(item)}
                        className="bg-zinc-850 hover:bg-zinc-850 text-zinc-300 hover:text-white px-2 py-1 rounded text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Download size={10} />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
