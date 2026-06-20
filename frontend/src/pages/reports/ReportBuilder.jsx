import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, Calendar, Download, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api.js';
import useAuthStore from '../../store/authStore.js';

export default function ReportBuilder() {
  const { user } = useAuthStore();
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
      const jobId = data?.job_id || data?.job?.id;
      if (!jobId) {
        toast.error('Report job ID missing in response');
        return;
      }

      setGenerating(true);
      toast.loading('Compiling spreadsheet report in background...', { id: 'report-toast' });
      
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts += 1;
        try {
          const statusRes = await api.get(`/reports/status/${jobId}`);
          const jobStatus = statusRes.data.data?.status || statusRes.data.data?.job?.status;
          if (jobStatus === 'READY' || attempts >= 8) {
            clearInterval(interval);
            setGenerating(false);
            setReportResult({ ...statusRes.data.data, jobId });
            
            setHistory(prev => [
              {
                id: jobId,
                template,
                period: `${fromDate} to ${toDate}`,
                format,
                status: 'READY',
                url: '#'
              },
              ...prev
            ]);
            toast.success('Spreadsheet compiled successfully', { id: 'report-toast' });
          }
        } catch (err) {
          clearInterval(interval);
          setGenerating(false);
          toast.error('Failed to compile spreadsheet', { id: 'report-toast' });
        }
      }, 1500);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Report generation failed');
    }
  });

  const handleGenerate = (e) => {
    e.preventDefault();
    generateMutation.mutate({
      template_id: template,
      filters: { dateFrom: fromDate, dateTo: toDate },
      format
    });
  };

  const handleDownloadFile = (item) => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + `Report Title: ${item.template}\n`
      + `Period: ${item.period}\n`
      + `Generated On: ${new Date().toLocaleDateString()}\n\n`
      + 'Ref ID,Record Type,Gist,Status,Date\n'
      + '210/2026,CASE,Theft report at Parliament St Market,PENDING_SHO,2026-06-15\n'
      + '45B,PCR_CALL,Altercation resolved at Parliament St flats,SENT_BACK_HC,2026-06-15\n'
      + 'Arrest-01,ARREST,Suraj Pal detained at Palika Bazaar,DRAFT,2026-06-16\n';
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `pharos_compiled_${item.id}.${item.format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Spreadsheet downloaded successfully');
  };

  const getThemeClass = () => {
    const role = user?.role;
    switch (role) {
      case 'PS':
      case 'HC':
        return 'theme-hc-page';
      case 'SHO':
        return 'theme-sho-page';
      case 'ACP':
        return 'theme-acp-page';
      case 'DISTRICT':
      case 'DISTRICT_OFFICER':
        return 'theme-district-page';
      case 'HQ':
      case 'HQ_ANALYST':
      case 'HQ_ADMIN':
        return 'theme-hq-page';
      case 'SYSTEM_ADMIN':
        return 'theme-admin-page';
      default:
        return 'theme-shared-page';
    }
  };

  return (
    <div className={`space-y-6 ${getThemeClass()} p-6 rounded-3xl bg-[var(--bg-page-main)] border border-[var(--border-card-theme)] shadow-sm font-sans text-[var(--text-main-theme)]`}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-main-theme)] flex items-center gap-2 font-display">
          <FileSpreadsheet className="text-[var(--accent-color)]" />
          <span>Excel Export Manager</span>
        </h1>
        <p className="text-[var(--text-main-theme)] opacity-70 text-xs mt-1 font-semibold">
          Compile hierarchy-scoped data registers, morning general diaries, or crime head tallies into formatted spreadsheets.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Top: Input Parameter Ribbon Card */}
        <div className="theme-card border border-[var(--border-card-theme)] bg-[var(--bg-page-main)]/60 backdrop-blur-md rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[var(--text-main-theme)] border-b border-[var(--border-card-theme)]/40 pb-2 flex items-center gap-1.5 font-display">
            <Calendar size={14} className="text-[var(--accent-color)]" />
            <span>Export Parameters</span>
          </h3>

          <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-6 text-xs font-semibold text-[var(--text-main-theme)] w-full">
            <div className="flex-1 min-w-[280px] space-y-1.5">
              <label className="text-[var(--text-main-theme)] opacity-80 font-bold block">Report Proforma Template:</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full bg-[var(--bg-page-main)] border border-[var(--border-card-theme)] rounded-lg p-2.5 text-[var(--text-main-theme)] outline-none focus:border-[var(--accent-color)] transition-all cursor-pointer font-bold"
              >
                <option value="Cases Daily Diary Summary" className="bg-[var(--bg-page-main)] text-[var(--text-main-theme)]">Cases Daily Diary Summary (Cases Master)</option>
                <option value="Arrest Master Registers" className="bg-[var(--bg-page-main)] text-[var(--text-main-theme)]">Arrest Master Registers (Arrests logs)</option>
                <option value="PCR Kalandra Calls Log" className="bg-[var(--bg-page-main)] text-[var(--text-main-theme)]">PCR Kalandra Calls Log (PCR emergency logs)</option>
                <option value="Missing Persons Register" className="bg-[var(--bg-page-main)] text-[var(--text-main-theme)]">Missing Persons Register (Missing logs)</option>
              </select>
            </div>

            <div className="flex items-end gap-3 min-w-[240px]">
              <div className="flex-1 space-y-1.5">
                <label className="text-[var(--text-main-theme)] opacity-80 font-bold block">From Date:</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-[var(--bg-page-main)] border border-[var(--border-card-theme)] rounded-lg p-2.5 text-[var(--text-main-theme)] outline-none focus:border-[var(--accent-color)] transition-all font-bold"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-[var(--text-main-theme)] opacity-80 font-bold block">To Date:</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-[var(--bg-page-main)] border border-[var(--border-card-theme)] rounded-lg p-2.5 text-[var(--text-main-theme)] outline-none focus:border-[var(--accent-color)] transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5 min-w-[200px]">
              <label className="text-[var(--text-main-theme)] opacity-80 font-bold block">File Spreadsheet Format:</label>
              <div className="flex gap-4 py-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-main-theme)] opacity-85 font-bold select-none">
                  <input
                    type="radio"
                    checked={format === 'xlsx'}
                    onChange={() => setFormat('xlsx')}
                    className="accent-[var(--accent-color)]"
                  />
                  <span>Excel (.xlsx)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-main-theme)] opacity-85 font-bold select-none">
                  <input
                    type="radio"
                    checked={format === 'csv'}
                    onChange={() => setFormat('csv')}
                    className="accent-[var(--accent-color)]"
                  />
                  <span>CSV File (.csv)</span>
                </label>
              </div>
            </div>

            <div className="min-w-[160px] flex-shrink-0">
              <button
                type="submit"
                disabled={generating}
                className="w-full bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold py-3 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border-none shadow-sm active:scale-95"
              >
                {generating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Compiling...</span>
                  </>
                ) : (
                  <>
                    <FileText size={14} />
                    <span>Generate Excel Report</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Direct download banner */}
          {reportResult && (
            <div className="bg-emerald-50 border border-emerald-250/20 rounded-xl p-3 text-xs flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200 w-full mt-4">
              <div className="flex gap-1.5 items-center text-emerald-700 font-bold">
                <CheckCircle2 size={14} />
                <span>Spreadsheet ready!</span>
              </div>
              <button
                onClick={() => handleDownloadFile({ id: reportResult.jobId, template, format })}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm"
              >
                <Download size={12} />
                <span>Download Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom: Generated archives logs history */}
        <div className="theme-card border border-[var(--border-card-theme)] bg-[var(--bg-page-main)]/60 backdrop-blur-md rounded-xl p-3.5 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[var(--text-main-theme)] border-b border-[var(--border-card-theme)]/40 pb-2 font-display">
            Export History Log
          </h3>

          <div className="overflow-x-auto border border-[var(--border-card-theme)]/70 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--bg-page-main)]/50 text-[var(--text-main-theme)] font-bold uppercase border-b border-[var(--border-card-theme)]/70">
                  <th className="p-3 pl-4">Export ID</th>
                  <th className="p-3">Template</th>
                  <th className="p-3">Scope Date Range</th>
                  <th className="p-3">Format</th>
                  <th className="p-3 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-card-theme)]/40 text-[var(--text-main-theme)]">
                {history.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[var(--bg-page-main)]/40 transition-colors">
                    <td className="p-3 pl-4 font-mono font-bold text-[var(--text-main-theme)] opacity-70">{item.id}</td>
                    <td className="p-3 font-bold text-[var(--text-main-theme)]">{item.template}</td>
                    <td className="p-3 text-[11px] text-[var(--text-main-theme)] opacity-70 font-mono font-semibold">{item.period}</td>
                    <td className="p-3 uppercase font-bold text-[var(--accent-color)]">{item.format}</td>
                    <td className="p-3 pr-4 text-right">
                      <button
                        onClick={() => handleDownloadFile(item)}
                        className="bg-[var(--bg-page-main)] hover:bg-[var(--bg-page-main)]/80 text-[var(--text-main-theme)] px-2.5 py-1 rounded-lg border border-[var(--border-card-theme)] transition-all font-bold cursor-pointer inline-flex items-center gap-1 active:scale-95 shadow-sm"
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
