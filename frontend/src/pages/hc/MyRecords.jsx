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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-zinc-100 flex items-center gap-2">
            <FileText className="text-[#cca43b]" />
            <span>{t('nav.records', 'My Records Desk')}</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            {t('common.recordsSubtitle', 'Create, manage and submit daily diaries for cases, arrests, and PCR incident logs.')}
          </p>
        </div>

        {/* Creation actions dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-semibold">{t('actions.createNew', 'Create New:')}</span>
          <div className="flex gap-1.5 flex-wrap">
            {['CASE', 'ARREST', 'PCR_CALL', 'MISSING', 'UIDB'].map((type) => (
              <button
                key={type}
                onClick={() => navigate(`/records/new/${type}`)}
                className="bg-zinc-900 border border-zinc-800 hover:border-[#cca43b] text-zinc-300 hover:text-zinc-100 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus size={12} className="text-[#cca43b]" />
                <span>{t(`recordTypes.${type}`, type)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Record Category Tabs */}
      <div className="border-b border-zinc-800 flex flex-wrap gap-2">
        {['CASE', 'ARREST', 'PCR_CALL', 'MISSING', 'UIDB'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === tab
                ? 'border-[#cca43b] text-[#cca43b] font-extrabold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t(`recordTypes.${tab}`, tab)}
          </button>
        ))}
      </div>

      {/* Filters Section */}
      <div className="flex items-center gap-2 bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-3 text-xs">
        <Filter size={14} className="text-zinc-500" />
        <span className="text-zinc-400 font-semibold">{t('actions.filterStatus', 'Status:')}</span>
        <div className="flex gap-1.5 flex-wrap">
          {['ALL', 'DRAFT', 'PENDING_SHO', 'DISTRICT_REVIEW', 'SENT_BACK_HC', 'COMPILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#cca43b]/10 border border-[#cca43b] text-[#cca43b] font-bold'
                  : 'bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
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
        <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950/60 text-zinc-400 uppercase font-semibold border-b border-zinc-850">
                  <th className="p-3.5 pl-5">{t('common.referenceId', 'Ref ID / Number')}</th>
                  <th className="p-3.5">{t('common.recordDate', 'Record Date')}</th>
                  <th className="p-3.5">{t('common.details', 'Brief Gist')}</th>
                  <th className="p-3.5">{t('common.status', 'Status')}</th>
                  <th className="p-3.5 pr-5 text-right">{t('common.actions', 'Console Operations')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-zinc-300">
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
                    <tr key={rec.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-3.5 pl-5 font-mono font-bold text-zinc-200">{refId}</td>
                      <td className="p-3.5 font-mono">{rec.data.record_date || 'N/A'}</td>
                      <td className="p-3.5 max-w-[280px] truncate" title={gist}>
                        {gist}
                      </td>
                      <td className="p-3.5">{renderStatusBadge(rec.current_status)}</td>
                      <td className="p-3.5 pr-5 text-right space-x-1.5 whitespace-nowrap">
                        {/* View Action */}
                        <button
                          onClick={() => navigate(`/records/${rec.id}`)}
                          className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white p-1.5 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={12} />
                        </button>

                        {/* Edit Action */}
                        {isEditable && (
                          <button
                            onClick={() => navigate(`/records/new/${rec.record_type}?edit=${rec.id}`)}
                            className="bg-zinc-800/80 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 p-1.5 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Edit Record"
                          >
                            <FileEdit size={12} />
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
                            className="bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 p-1.5 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Submit to SHO"
                          >
                            <Send size={12} />
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
                            className="bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 p-1.5 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Delete Draft"
                          >
                            <Trash2 size={12} />
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
