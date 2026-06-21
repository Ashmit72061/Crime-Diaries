import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, Calendar, Download, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api.js';
import useAuthStore from '../../store/authStore.js';

export default function ReportBuilder() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

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
        return 'theme-hq-page';
    }
  };
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
      // Backend expects: { template_id, filters: { dateFrom, dateTo }, format }
      const res = await api.post('/reports/generate', payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      // Backend returns job_id (not reportId)
      const jobId = data?.job_id || data?.job?.id;
      if (!jobId) {
        toast.error('Report job ID missing in response');
        return;
      }

      setGenerating(true);
      toast.loading('Compiling spreadsheet report in background...', { id: 'report-toast' });
      
      // Poll report status using job_id
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
            
            // Add to history list
            setHistory(prev => [
              {
                id: jobId,
                template,
                period: `${fromDate} to ${toDate}`,
                format,
                status: jobStatus || 'READY',
                url: `/api/v1/reports/download/${jobId}`
              },
              ...prev
            ]);
            
            if (jobStatus === 'READY') {
              toast.success('Spreadsheet compiled and ready for download!', { id: 'report-toast' });
            } else {
              toast.error('Report is taking longer than expected. Check history later.', { id: 'report-toast' });
            }
          }
        } catch (e) {
          clearInterval(interval);
          setGenerating(false);
          toast.error('Failed to compile report', { id: 'report-toast' });
        }
      }, 2000);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to trigger report compilation');
    }
  });

  const handleGenerate = (e) => {
    e.preventDefault();
    setReportResult(null);
    // Map frontend state to backend API field names
    const templateIdMap = {
      'Cases Daily Diary Summary': 'cases-register',
      'Arrest Master Registers': 'arrest-summary',
      'PCR Kalandra Calls Log': 'pcr-call-log',
      'Missing Persons Register': 'daily-status',
    };
    generateMutation.mutate({
      template_id: templateIdMap[template] || 'cases-register',
      filters: { dateFrom: fromDate, dateTo: toDate },
      format,
    });
  };

  // Trigger real download from backend for real report jobs, CSV fallback for mock
  const handleDownloadFile = async (item) => {
    // If it's a real report job (UUID-shaped id), download from backend
    const isRealJob = item.id && item.id.includes('-') && item.id.length > 20;
    if (isRealJob) {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`/api/v1/reports/download/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Pharos_Report_${item.id}.${item.format === 'xlsx' ? 'xlsx' : item.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Report downloaded successfully');
        return;
      } catch (err) {
        toast.error('Download failed: ' + err.message);
        return;
      }
    }

    // Fallback: generate a local CSV for mock history entries
    const csvContent = 'data:text/csv;charset=utf-8,'
      + 'Delhi Police Daily Operational Log\n'
      + `Report Template: ${item.template}\n`
      + `Scope Period: ${item.period}\n`
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

  return (
    <div className={`space-y-6 p-6 rounded-3xl bg-[var(--bg-page-main)]/60 border border-[var(--border-card-theme)] backdrop-blur-md shadow-sm font-sans text-[var(--text-main-theme)] ${getThemeClass()}`}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-[var(--text-main-theme)] flex items-center gap-2.5">
          <FileSpreadsheet className="text-[var(--accent-color)]" size={26} />
          <span>Excel Export Manager</span>
        </h1>
        <p className="text-[var(--text-main-theme)]/70 text-xs mt-1">
          Compile hierarchy-scoped data registers, morning general diaries, or crime head tallies into formatted spreadsheets.
        </p>
      </div>

      {/* Main Containers Stacked Vertically (Up Down) */}
      <div className="space-y-6">
        {/* Top: Input Parameter Card */}
        <div className="bg-[var(--bg-card-theme)] border border-[var(--border-card-theme)] rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main-theme)] border-b border-[var(--border-card-theme)] pb-2 flex items-center gap-1.5">
            <Calendar size={14} className="text-[var(--accent-color)]" />
            <span>Export Parameters</span>
          </h3>

          <form onSubmit={handleGenerate} className="space-y-5 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Report Proforma Selection */}
              <div className="col-span-1 md:col-span-5 space-y-1.5">
                <label className="text-[var(--text-main-theme)]/80 font-bold">Report Proforma Template:</label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full bg-[var(--bg-page-main)] border border-[var(--border-card-theme)] rounded-xl p-2.5 text-[var(--text-main-theme)] outline-none focus:border-[var(--accent-color)] transition-all cursor-pointer font-semibold shadow-sm text-sm"
                >
                  <option value="Cases Daily Diary Summary">Cases Daily Diary Summary (Cases Master)</option>
                  <option value="Arrest Master Registers">Arrest Master Registers (Arrests logs)</option>
                  <option value="PCR Kalandra Calls Log">PCR Kalandra Calls Log (PCR emergency logs)</option>
                  <option value="Missing Persons Register">Missing Persons Register (Missing logs)</option>
                </select>
              </div>

              {/* From Date */}
              <div className="col-span-1 md:col-span-3 space-y-1.5">
                <label className="text-[var(--text-main-theme)]/80 font-bold">From Date:</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-[var(--bg-page-main)] border border-[var(--border-card-theme)] rounded-xl p-2 text-[var(--text-main-theme)] outline-none focus:border-[var(--accent-color)] transition-all font-semibold shadow-sm text-sm"
                />
              </div>

              {/* To Date */}
              <div className="col-span-1 md:col-span-3 space-y-1.5">
                <label className="text-[var(--text-main-theme)]/80 font-bold">To Date:</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-[var(--bg-page-main)] border border-[var(--border-card-theme)] rounded-xl p-2 text-[var(--text-main-theme)] outline-none focus:border-[var(--accent-color)] transition-all font-semibold shadow-sm text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-8 pt-4">
              {/* Actions button */}
              <div>
                <button
                  type="submit"
                  disabled={generating}
                  className="bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] text-white font-bold px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none shadow-sm flex items-center gap-1.5 active:scale-95 text-sm"
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
              </div>

              {/* Format selection */}
              <div className="space-y-1 text-sm">
                <label className="text-[var(--text-main-theme)]/80 font-bold block">File Spreadsheet Format:</label>
                <div className="flex gap-6 py-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-main-theme)]/80 font-semibold">
                    <input
                      type="radio"
                      checked={format === 'xlsx'}
                      onChange={() => setFormat('xlsx')}
                      className="accent-[var(--accent-color)] w-4 h-4"
                    />
                    <span>Excel (.xlsx)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-main-theme)]/80 font-semibold">
                    <input
                      type="radio"
                      checked={format === 'csv'}
                      onChange={() => setFormat('csv')}
                      className="accent-[var(--accent-color)] w-4 h-4"
                    />
                    <span>CSV File (.csv)</span>
                  </label>
                </div>
              </div>

              {/* Direct download banner */}
              {reportResult && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl px-4 py-2 text-xs flex items-center gap-3 animate-in fade-in duration-200">
                  <div className="flex gap-1.5 items-center font-semibold">
                    <CheckCircle2 size={14} />
                    <span>Spreadsheet ready!</span>
                  </div>
                  <button
                    onClick={() => handleDownloadFile({ id: reportResult.jobId, template, format })}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer border-none shadow-sm active:scale-95"
                  >
                    <Download size={12} />
                    <span>Download Now</span>
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Bottom: Generated archives logs history */}
        <div className="bg-[var(--bg-card-theme)] border border-[var(--border-card-theme)] rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main-theme)] border-b border-[var(--border-card-theme)] pb-2">
            Export History Log
          </h3>

          <div className="overflow-x-auto border border-[var(--border-card-theme)]/70 rounded-xl bg-[var(--bg-card-theme)]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--bg-page-main)]/50 text-[var(--text-main-theme)]/80 uppercase font-semibold border-b border-[var(--border-card-theme)]/70">
                  <th className="p-3 pl-6 font-bold text-[var(--text-main-theme)]">Export ID</th>
                  <th className="p-3 font-bold text-[var(--text-main-theme)]">Template</th>
                  <th className="p-3 font-bold text-[var(--text-main-theme)]">Scope Date Range</th>
                  <th className="p-3 font-bold text-[var(--text-main-theme)]">Format</th>
                  <th className="p-3 pr-6 text-right font-bold text-[var(--text-main-theme)]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-card-theme)]/30 text-[var(--text-main-theme)]">
                {history.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[var(--bg-page-main)]/30 transition-colors duration-150">
                    <td className="p-3 pl-6 font-mono font-bold text-[var(--text-main-theme)] opacity-60">{item.id}</td>
                    <td className="p-3 font-semibold text-[var(--text-main-theme)]">{item.template}</td>
                    <td className="p-3 text-[13px] text-[var(--text-main-theme)]/70 font-mono">{item.period}</td>
                    <td className="p-3 uppercase font-bold text-[var(--accent-color)]">{item.format}</td>
                    <td className="p-3 pr-6 text-right">
                      <button
                        onClick={() => handleDownloadFile(item)}
                        className="bg-[var(--bg-page-main)] hover:bg-[var(--bg-page-main)]/85 text-[var(--accent-color)] font-bold px-3 py-1.5 rounded-lg text-xs transition-colors inline-flex items-center gap-1 cursor-pointer border border-[var(--border-card-theme)]/60 shadow-sm active:scale-95"
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
