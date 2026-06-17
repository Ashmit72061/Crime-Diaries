import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, FileEdit, Trash2, Send, Filter, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api.js';

export default function MyRecords() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('CASE'); // CASE, ARREST, PCR_CALL, MISSING, UIDB
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Fetch all records
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['records'],
    queryFn: async () => {
      const res = await api.get('/records');
      return res.data.data;
    },
  });

  // Submit Draft to SHO mutation
  const submitMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/records/${id}/submit`);
      return res.data;
    },
    onSuccess: () => {
      toast.success(t('actions.submitSuccess', 'Record submitted to SHO successfully'));
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit record');
    },
  });

  // Delete Draft mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/records/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success(t('actions.deleteSuccess', 'Local draft deleted successfully'));
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete draft');
    },
  });

  // Filter records
  const filteredRecords = records.filter((rec) => {
    if (rec.record_type !== activeTab) return false;
    if (statusFilter !== 'ALL' && rec.current_status !== statusFilter) return false;
    return true;
  });

  // Render Status Badge
  const renderStatusBadge = (status) => {
    const badges = {
      DRAFT: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      PENDING_SHO: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
      DISTRICT_REVIEW: 'bg-blue-950/40 text-blue-400 border-blue-800/60',
      SENT_BACK_HC: 'bg-red-950/40 text-red-400 border-red-800/60',
      COMPILED: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60',
    };
    return (
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badges[status] || badges.DRAFT}`}>
        {t(`status.${status}`, status)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <FileText className="text-[#0f52ba]" size={22} />
            <span>{t('nav.records', 'My Records Desk')}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {t('common.recordsSubtitle', 'Create, manage and submit daily diaries for cases, arrests, and PCR incident logs.')}
          </p>
        </div>

        {/* Creation actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-slate-500 font-semibold whitespace-nowrap">{t('actions.createNew', 'Create New:')}</span>
          <div className="flex gap-2.5 flex-wrap">
            {['CASE', 'ARREST', 'PCR_CALL', 'MISSING', 'UIDB'].map((type) => (
              <button
                key={type}
                onClick={() => navigate(`/records/new/${type}`)}
                className="bg-[#0f52ba] hover:bg-[#16406d] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-[#0f52ba]/20 hover:shadow-[#0f52ba]/40 hover:-translate-y-0.5 cursor-pointer border-none"
              >
                <Plus size={16} />
                <span>{t(`recordTypes.${type}`, type)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Record Category Tabs */}
      <div className="border-b-2 border-slate-200 flex flex-wrap gap-1">
        {['CASE', 'ARREST', 'PCR_CALL', 'MISSING', 'UIDB'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3.5 text-sm font-bold tracking-wide border-b-[3px] transition-all cursor-pointer -mb-[2px] ${
              activeTab === tab
                ? 'border-[#0f52ba] text-[#0f52ba] bg-[#0f52ba]/5 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {t(`recordTypes.${tab}`, tab)}
          </button>
        ))}
      </div>

      {/* Filters Section */}
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 flex-wrap">
        <Filter size={16} className="text-slate-400 flex-shrink-0" />
        <span className="text-slate-600 font-bold text-sm">{t('actions.filterStatus', 'Status:')}</span>
        <div className="flex gap-2.5 flex-wrap">
          {['ALL', 'DRAFT', 'PENDING_SHO', 'DISTRICT_REVIEW', 'SENT_BACK_HC', 'COMPILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#0f52ba] text-white shadow-md shadow-[#0f52ba]/25'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-[#0f52ba] hover:text-[#0f52ba] hover:bg-[#0f52ba]/5 shadow-sm'
              }`}
            >
              {st === 'ALL' ? t('common.all', 'All') : t(`status.${st}`, st)}
            </button>
          ))}
        </div>
      </div>

      {/* Records Listing Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 text-zinc-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cca43b] mb-4"></div>
          <p>{t('common.loading', 'Syncing digital registry logs...')}</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
          <FileText size={48} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-sm font-semibold">{t('common.noRecords', 'No Daily Log Entries Found')}</p>
          <p className="text-xs text-zinc-600 mt-1">
            {t('common.noRecordsDetail', 'Select a creation form above to enter your daily general diary records.')}
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200 text-xs tracking-wider">
                  <th className="p-4 pl-5">{t('common.referenceId', 'Ref ID / Number')}</th>
                  <th className="p-4">{t('common.recordDate', 'Record Date')}</th>
                  <th className="p-4">{t('common.details', 'Brief Gist')}</th>
                  <th className="p-4">{t('common.status', 'Status')}</th>
                  <th className="p-4 pr-5 text-right">{t('common.actions', 'Console Operations')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRecords.map((rec) => {
                  const refId =
                    rec.data.fir_no ||
                    rec.data.gd_no ||
                    rec.data.linked_fir_dd_no ||
                    rec.data.dd_fir_no ||
                    rec.data.uidbNumber ||
                    'N/A';

                  const gist =
                    rec.data.brief_facts ||
                    rec.data.call_gist ||
                    rec.data.recovered_material ||
                    rec.data.physical_description ||
                    rec.data.description ||
                    rec.data.foundPlace ||
                    'No description text logged';

                  const isEditable = rec.current_status === 'DRAFT' || rec.current_status === 'SENT_BACK_HC';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-5 font-mono font-bold text-slate-800 text-sm">{refId}</td>
                      <td className="p-4 font-mono text-slate-600">{rec.data.record_date || 'N/A'}</td>
                      <td className="p-4 max-w-[280px] truncate text-slate-600" title={gist}>
                        {gist}
                      </td>
                      <td className="p-4">{renderStatusBadge(rec.current_status)}</td>
                      <td className="p-3.5 pr-5 text-right space-x-2 whitespace-nowrap">
                        {/* View Action */}
                        <button
                          onClick={() => navigate(`/records/${rec.id}`)}
                          className="bg-slate-100 hover:bg-[#0f52ba] text-slate-500 hover:text-white p-2.5 rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer border border-slate-200 hover:border-[#0f52ba] hover:shadow-md"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Edit Action */}
                        {isEditable && (
                          <button
                            onClick={() => navigate(`/records/new/${rec.record_type}?edit=${rec.id}`)}
                            className="bg-amber-50 hover:bg-[#cca43b] text-amber-600 hover:text-white p-2.5 rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer border border-amber-200 hover:border-[#cca43b] hover:shadow-md"
                            title="Edit Record"
                          >
                            <FileEdit size={15} />
                          </button>
                        )}

                        {/* Submit Action */}
                        {isEditable && (
                          <button
                            onClick={() => {
                              if (window.confirm(t('actions.confirmSubmit', 'Confirm submission to SHO? This locks the record.'))) {
                                submitMutation.mutate(rec.id);
                              }
                            }}
                            className="bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white p-2.5 rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer border border-emerald-200 hover:border-emerald-500 hover:shadow-md"
                            title="Submit to SHO"
                          >
                            <Send size={15} />
                          </button>
                        )}

                        {/* Delete Action */}
                        {rec.current_status === 'DRAFT' && (
                          <button
                            onClick={() => {
                              if (window.confirm(t('actions.confirmDelete', 'Delete this draft record forever?'))) {
                                deleteMutation.mutate(rec.id);
                              }
                            }}
                            className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white p-2.5 rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer border border-red-200 hover:border-red-500 hover:shadow-md"
                            title="Delete Draft"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
