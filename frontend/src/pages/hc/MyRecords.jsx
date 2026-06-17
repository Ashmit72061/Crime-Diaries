import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, FileEdit, Trash2, Send, Filter, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api.js';

const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, filter: "blur(3px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 95, damping: 14 } }
};

export default function MyRecords() {
  const { t, i18n } = useTranslation();
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
      DRAFT: 'bg-slate-100 text-slate-600 border-slate-200/80',
      PENDING_SHO: 'bg-amber-50 text-amber-700 border-amber-200/60',
      DISTRICT_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200/60',
      SENT_BACK_HC: 'bg-rose-50 text-rose-700 border-rose-200/60',
      COMPILED: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    };
    const dotColors = {
      DRAFT: 'bg-slate-400',
      PENDING_SHO: 'bg-amber-500',
      DISTRICT_REVIEW: 'bg-blue-500',
      SENT_BACK_HC: 'bg-rose-500',
      COMPILED: 'bg-emerald-500',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${badges[status] || badges.DRAFT}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || dotColors.DRAFT}`} />
        {t(`status.${status}`, status)}
      </span>
    );
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5 font-display">
            <div className="crest-frame">
              <FileText className="text-[#0f52ba]" size={20} />
            </div>
            <span>{t('nav.records', 'My Records Desk')}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            {t('common.recordsSubtitle', 'Create, manage and submit daily diaries for cases, arrests, and PCR incident logs.')}
          </p>
        </div>

        {/* Creation actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">{t('actions.createNew', 'Create New:')}</span>
          <div className="flex gap-2 flex-wrap">
            {['CASE', 'ARREST', 'PCR_CALL', 'MISSING', 'UIDB'].map((type) => (
              <button
                key={type}
                onClick={() => navigate(`/records/new/${type}`)}
                className="bg-[#0f52ba] hover:bg-[#16406d] text-white px-4.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#0f52ba]/10 hover:shadow-[#0f52ba]/25 hover:-translate-y-0.5 cursor-pointer border-none active:scale-[0.98]"
              >
                <Plus size={14} className="text-amber-400" />
                <span>{t(`recordTypes.${type}`, type)}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Record Category Tabs */}
      <motion.div 
        variants={itemVariants}
        className="bg-slate-100 p-1 rounded-2xl flex gap-1 flex-wrap w-fit border border-slate-200/50"
      >
        {['CASE', 'ARREST', 'PCR_CALL', 'MISSING', 'UIDB'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border-none ${
              activeTab === tab
                ? 'bg-white text-[#0f52ba] shadow-sm font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t(`recordTypes.${tab}`, tab)}
          </button>
        ))}
      </motion.div>

      {/* Filters Section */}
      <motion.div 
        variants={itemVariants}
        className="flex items-center gap-3 bg-white border border-slate-200/60 shadow-sm rounded-2xl p-4 flex-wrap"
      >
        <Filter size={16} className="text-slate-400 flex-shrink-0" />
        <span className="text-slate-500 font-extrabold text-xs uppercase tracking-wider">{t('actions.filterStatus', 'Status:')}</span>
        <div className="flex gap-2.5 flex-wrap">
          {['ALL', 'DRAFT', 'PENDING_SHO', 'DISTRICT_REVIEW', 'SENT_BACK_HC', 'COMPILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#0f52ba] text-white shadow-md shadow-[#0f52ba]/20'
                  : 'bg-slate-50 border border-slate-100 text-slate-600 hover:border-[#0f52ba] hover:text-[#0f52ba] hover:bg-[#0f52ba]/5'
              }`}
            >
              {st === 'ALL' ? t('common.all', 'All') : t(`status.${st}`, st)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Records Listing Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f52ba] mb-4"></div>
          <p className="text-xs font-semibold">{t('common.loading', 'Syncing digital registry logs...')}</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <motion.div 
          variants={itemVariants}
          className="border border-dashed border-slate-200 bg-white rounded-2xl p-16 text-center text-slate-400 shadow-sm"
        >
          <FileText size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-700">{t('common.noRecords', 'No Daily Log Entries Found')}</p>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {t('common.noRecordsDetail', 'Select a creation form above to enter your daily general diary records.')}
          </p>
        </motion.div>
      ) : (
        <motion.div 
          variants={itemVariants}
          className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase font-bold border-b border-slate-200 text-xs tracking-wider">
                  <th className="p-4 pl-6">{t('common.referenceId', 'Ref ID / Number')}</th>
                  <th className="p-4">{t('common.recordDate', 'Record Date')}</th>
                  <th className="p-4">{t('common.details', 'Brief Gist')}</th>
                  <th className="p-4">{t('common.status', 'Status')}</th>
                  <th className="p-4 pr-6 text-right">{t('common.actions', 'Console Operations')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRecords.map((rec, index) => {
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
                    <motion.tr 
                      key={rec.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.3 }}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="p-4 pl-6 font-mono font-bold text-slate-800 text-sm">{refId}</td>
                      <td className="p-4 font-mono text-slate-500 font-semibold">{rec.data.record_date || 'N/A'}</td>
                      <td className="p-4 max-w-[280px] truncate text-slate-500 font-medium" title={gist}>
                        {gist}
                      </td>
                      <td className="p-4">{renderStatusBadge(rec.current_status)}</td>
                      <td className="p-3.5 pr-6 text-right space-x-2 whitespace-nowrap">
                        {/* View Action */}
                        <button
                          onClick={() => navigate(`/records/${rec.id}`)}
                          className="bg-slate-50 hover:bg-[#0f52ba] text-slate-500 hover:text-white p-2 rounded-xl transition-all duration-200 inline-flex items-center justify-center cursor-pointer border border-slate-200 hover:border-[#0f52ba] hover:shadow-md active:scale-95"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Edit Action */}
                        {isEditable && (
                          <button
                            onClick={() => navigate(`/records/new/${rec.record_type}?edit=${rec.id}`)}
                            className="bg-amber-50 hover:bg-[#cca43b] text-amber-700 hover:text-white p-2 rounded-xl transition-all duration-200 inline-flex items-center justify-center cursor-pointer border border-amber-200 hover:border-[#cca43b] hover:shadow-md active:scale-95"
                            title="Edit Record"
                          >
                            <FileEdit size={14} />
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
                            className="bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white p-2 rounded-xl transition-all duration-200 inline-flex items-center justify-center cursor-pointer border border-emerald-200 hover:border-emerald-500 hover:shadow-md active:scale-95"
                            title="Submit to SHO"
                          >
                            <Send size={14} />
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
                            className="bg-rose-50 hover:bg-rose-500 text-rose-700 hover:text-white p-2 rounded-xl transition-all duration-200 inline-flex items-center justify-center cursor-pointer border border-rose-200 hover:border-rose-500 hover:shadow-md active:scale-95"
                            title="Delete Draft"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
