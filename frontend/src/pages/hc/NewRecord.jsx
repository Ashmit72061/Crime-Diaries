import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookOpen, AlertTriangle } from 'lucide-react';
import { Breadcrumb, message, notification } from 'antd';
import DynamicForm from '../../components/forms/DynamicForm.jsx';
import api from '../../utils/api.js';

// Import our custom hooks
import { useCreateRecord } from '../../hooks/useCreateRecord.js';
import { useUpdateRecord } from '../../hooks/useUpdateRecord.js';

export default function NewRecord() {
  const { t } = useTranslation();
  const { type } = useParams(); // CASE, ARREST, PCR_CALL, MISSING
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load record details if in edit mode
  const { data: record, isLoading } = useQuery({
    queryKey: ['records', editId],
    queryFn: async () => {
      const res = await api.get(`/records/${editId}`);
      return res.data.data;
    },
    enabled: !!editId,
  });

  // Create or Update Record Mutations from custom hooks
  const createMutation = useCreateRecord(type);
  const updateMutation = useUpdateRecord(type || record?.record_type);

  // Final Submission Mutation
  const submitMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/records/${id}/submit`);
      return res.data.data;
    },
    onSuccess: () => {
      notification.success({
        message: t('actions.submitSuccessTitle', 'Record Submitted'),
        description: t('actions.submitSuccess', 'Record submitted to SHO successfully'),
        placement: 'topRight',
        duration: 4,
      });
      queryClient.invalidateQueries({ queryKey: ['records'] });
      navigate('/records');
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to submit record');
    },
  });

  // Submit form handler
  const handleFormSubmit = async (formData, activeId) => {
    try {
      let savedRecord;
      if (activeId || editId) {
        // Save using update mutation
        savedRecord = await updateMutation.mutateAsync({ id: activeId || editId, data: formData });
      } else {
        // Save using create mutation
        savedRecord = await createMutation.mutateAsync(formData);
      }
      
      const finalId = activeId || editId || savedRecord?.id;
      if (!finalId) {
        throw new Error('No valid record ID found for submission.');
      }
      
      // Submit the saved record
      await submitMutation.mutateAsync(finalId);
    } catch (e) {
      console.error('Failed to submit form', e);
      message.error('Failed to save or submit record.');
    }
  };

  // Extract Send Back feedback if the record was returned
  const getSendBackDetails = () => {
    if (!record || record.current_status !== 'SENT_BACK_HC') return null;
    // Find the latest transition that requested a send back
    const latestSb = record.transitions?.find((t) => t.action === 'SEND_BACK');
    return latestSb || null;
  };

  const sbDetails = getSendBackDetails();

  if (editId && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f52ba] mb-4"></div>
        <p>{t('common.loading', 'Syncing digital registry logs...')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Ant Design Breadcrumb */}
      <Breadcrumb
        items={[
          { title: <span className="cursor-pointer text-slate-500 hover:text-[#0f52ba]" onClick={() => navigate('/dashboard')}>{t('nav.dashboard', 'Dashboard')}</span> },
          { title: <span className="cursor-pointer text-slate-500 hover:text-[#0f52ba]" onClick={() => navigate('/records')}>{t('nav.records', 'Records')}</span> },
          { title: editId ? t('actions.edit', 'Edit Record') : `${t('actions.new', 'New')} ${t(`recordTypes.${type}`, type)}` }
        ]}
        className="text-xs font-semibold"
      />

      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/records')}
            className="hover:bg-slate-100 text-slate-500 hover:text-slate-700 p-2 rounded-lg transition-colors cursor-pointer border border-slate-200"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-wide">
              <BookOpen className="text-[#0f52ba]" size={18} />
              <span>
                {editId
                  ? `${t('actions.edit', 'Edit')} ${t(`recordTypes.${record?.record_type}`, record?.record_type)}`
                  : `${t('actions.new', 'New')} ${t(`recordTypes.${type}`, type)} ${t('nav.record', 'Entry')}`}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Secure operational entry for Delhi Police Daily General Diary record registry.
            </p>
          </div>
        </div>
      </div>

      {/* Reviewer feedback banner if the record was sent back */}
      {sbDetails && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-xs text-slate-700 shadow-sm">
          <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
          <div className="space-y-1 w-full">
            <h4 className="font-bold text-red-700 uppercase tracking-wide">
              {t('actions.correctionRequired', 'Reviewer Correction Requested')}
            </h4>
            <p>
              <strong>Reviewer Officer:</strong> {sbDetails.performed_by}
            </p>
            <p className="bg-white p-2.5 rounded border border-red-200 text-red-700 italic mt-1.5 font-medium shadow-sm">
              "{sbDetails.comment}"
            </p>
            {sbDetails.target_fields?.length > 0 && (
              <p className="text-[11px] text-slate-500 mt-1.5">
                Fields to correct: <span className="font-mono text-red-600 bg-red-100 px-1.5 py-0.5 rounded border border-red-200/50">{sbDetails.target_fields.join(', ')}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Form Engine */}
      <DynamicForm
        recordType={type || record?.record_type}
        initialValues={record}
        onSubmit={handleFormSubmit}
        targetFields={sbDetails?.target_fields || []}
        readOnly={record && record.current_status !== 'DRAFT' && record.current_status !== 'SENT_BACK_HC'}
      />
    </div>
  );
}
