import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookOpen, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import DynamicForm from '../../components/forms/DynamicForm.jsx';
import api from '../../utils/api.js';
import { useCreateRecord } from '../../hooks/useCreateRecord.js';
import { useUpdateRecord } from '../../hooks/useUpdateRecord.js';

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

export default function NewRecord() {
  const { t } = useTranslation();
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: recordPayload, isLoading } = useQuery({
    queryKey: ['records', editId],
    queryFn: async () => {
      const res = await api.get(`/records/${editId}`);
      return res.data.data;
    },
    enabled: !!editId,
  });

  const record = recordPayload?.record;
  const transitions = recordPayload?.transitions || [];

  const createMutation = useCreateRecord(type);
  const updateMutation = useUpdateRecord(type || record?.record_type);

  const submitMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/records/${id}/submit`);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success(t('actions.submitSuccess', 'Record submitted to SHO successfully'));
      queryClient.invalidateQueries({ queryKey: ['records'] });
      navigate('/records');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit record');
    },
  });

  const handleFormSubmit = async (formData, activeId) => {
    try {
      let savedRecord;
      if (activeId || editId) {
        savedRecord = await updateMutation.mutateAsync({ id: activeId || editId, data: formData });
      } else {
        savedRecord = await createMutation.mutateAsync(formData);
      }
      const finalId = activeId || editId || savedRecord?.id;
      if (!finalId) throw new Error('No valid record ID found for submission.');
      await submitMutation.mutateAsync(finalId);
    } catch (e) {
      console.error('Failed to submit form', e);
      toast.error(e?.response?.data?.message || 'Failed to save or submit record.');
    }
  };

  const getSendBackDetails = () => {
    if (!record || record.current_status !== 'SENT_BACK_HC') return null;
    return transitions.find((tr) => tr.action === 'SEND_BACK') || null;
  };

  const sbDetails = getSendBackDetails();

  if (editId && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f52ba] mb-4" />
        <p>{t('common.loading', 'Loading record...')}</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 w-full police-watermark pb-12"
    >
      {/* Breadcrumb */}
      <motion.nav 
        variants={itemVariants}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"
      >
        <button onClick={() => navigate('/dashboard')} className="hover:text-[#0f52ba] transition-colors cursor-pointer border-none bg-transparent">
          {t('nav.dashboard', 'Dashboard')}
        </button>
        <ChevronRight size={12} />
        <button onClick={() => navigate('/records')} className="hover:text-[#0f52ba] transition-colors cursor-pointer border-none bg-transparent">
          {t('nav.records', 'Records')}
        </button>
        <ChevronRight size={12} />
        <span className="text-slate-800">
          {editId ? t('actions.edit', 'Edit Record') : `${t('actions.new', 'New')} ${t(`recordTypes.${type}`, type)}`}
        </span>
      </motion.nav>

      {/* Page Header */}
      <motion.div 
        variants={itemVariants}
        className="premium-glass-card p-5 flex items-center gap-3"
      >
        <button
          onClick={() => navigate('/records')}
          className="hover:bg-slate-50 text-slate-500 hover:text-slate-700 p-2 rounded-xl transition-all duration-200 cursor-pointer border border-slate-200 active:scale-95"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-wide font-display">
            <BookOpen className="text-[#0f52ba]" size={18} />
            <span>
              {editId
                ? `${t('actions.edit', 'Edit')} ${t(`recordTypes.${record?.record_type}`, record?.record_type || '')}`
                : `${t('actions.new', 'New')} ${t(`recordTypes.${type}`, type)} ${t('nav.record', 'Entry')}`}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">
            Secure operational entry for Delhi Police Daily General Diary record registry.
          </p>
        </div>
      </motion.div>

      {/* Send-back feedback banner */}
      {sbDetails && (
        <motion.div 
          variants={itemVariants}
          className="bg-rose-50 border border-rose-200 rounded-2xl p-4.5 flex gap-3 text-xs text-slate-700 shadow-sm"
        >
          <AlertTriangle className="text-rose-500 flex-shrink-0 mt-0.5" size={16} />
          <div className="space-y-1 w-full">
            <h4 className="font-extrabold text-rose-700 uppercase tracking-wide">
              {t('actions.correctionRequired', 'Reviewer Correction Requested')}
            </h4>
            <p className="font-semibold text-slate-600"><strong>Reviewer Officer:</strong> {sbDetails.performed_by}</p>
            <p className="bg-white p-3 rounded-xl border border-rose-200 text-rose-700 italic mt-1.5 font-medium shadow-sm">
              "{sbDetails.comment}"
            </p>
            {sbDetails.target_fields?.length > 0 && (
              <p className="text-[11px] text-slate-500 mt-1.5 font-semibold">
                Fields to correct:{' '}
                <span className="font-mono text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded border border-rose-200/50">
                  {sbDetails.target_fields.join(', ')}
                </span>
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Dynamic Form Engine */}
      <motion.div variants={itemVariants}>
        <DynamicForm
          recordType={type || record?.record_type}
          initialValues={record}
          onSubmit={handleFormSubmit}
          targetFields={sbDetails?.target_fields || []}
          readOnly={record && record.current_status !== 'DRAFT' && record.current_status !== 'SENT_BACK_HC'}
        />
      </motion.div>
    </motion.div>
  );
}
