import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookOpen, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import DynamicForm from '../../components/forms/DynamicForm.jsx';
import api from '../../utils/api.js';

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

  // Create or Update Record Mutation
  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      if (editId) {
        // Edit record PUT
        const res = await api.put(`/records/${editId}`, { data: formData });
        return res.data.data;
      } else {
        // Create record POST
        const res = await api.post('/records', { record_type: type, data: formData });
        return res.data.data;
      }
    },
    onSuccess: (savedRecord) => {
      toast.success(
        editId 
          ? t('actions.draftUpdated', 'Draft record updated successfully') 
          : t('actions.draftSaved', 'Draft record saved successfully')
      );
      queryClient.invalidateQueries({ queryKey: ['records'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save record draft');
    },
  });

  // Final Submission Mutation
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

  // Auto save draft handler (triggered automatically on input changes)
  const handleAutoSave = (formData) => {
    saveMutation.mutate(formData);
  };

  // Submit form handler
  const handleFormSubmit = async (formData) => {
    try {
      // First save the current data as draft
      const saved = await saveMutation.mutateAsync(formData);
      const activeId = editId || saved.id;
      // Then submit the saved record
      await submitMutation.mutateAsync(activeId);
    } catch (e) {
      console.error('Failed to submit form', e);
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
      <div className="flex flex-col items-center justify-center p-20 text-zinc-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cca43b] mb-4"></div>
        <p>{t('common.loading', 'Syncing digital registry logs...')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back navigation header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/records')}
            className="hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 p-2 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-zinc-700"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-serif font-bold text-zinc-100 flex items-center gap-2">
              <BookOpen className="text-[#cca43b]" size={20} />
              <span>
                {editId
                  ? `${t('actions.edit', 'Edit')} ${t(`recordTypes.${record?.record_type}`, record?.record_type)}`
                  : `${t('actions.new', 'New')} ${t(`recordTypes.${type}`, type)} ${t('nav.record', 'Entry')}`}
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Secure operational entry for Delhi Police Daily General Diary record registry.
            </p>
          </div>
        </div>
      </div>

      {/* Reviewer feedback banner if the record was sent back */}
      {sbDetails && (
        <div className="bg-red-950/20 border border-red-800/40 rounded-xl p-4 flex gap-3 text-xs text-zinc-300">
          <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
          <div className="space-y-1">
            <h4 className="font-bold text-red-400 uppercase tracking-wide">
              {t('actions.correctionRequired', 'Reviewer Correction Requested')}
            </h4>
            <p>
              <strong>Reviewer Officer:</strong> {sbDetails.performed_by}
            </p>
            <p className="bg-zinc-950/50 p-2.5 rounded border border-zinc-800 text-zinc-300 italic mt-1.5">
              "{sbDetails.comment}"
            </p>
            {sbDetails.target_fields?.length > 0 && (
              <p className="text-[11px] text-zinc-400 mt-1">
                Fields to correct: <span className="font-mono text-amber-400">{sbDetails.target_fields.join(', ')}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Form Engine */}
      <DynamicForm
        recordType={type || record?.record_type}
        initialValues={record}
        onSaveDraft={handleAutoSave}
        onSubmit={handleFormSubmit}
        targetFields={sbDetails?.target_fields || []}
        readOnly={record && record.current_status !== 'DRAFT' && record.current_status !== 'SENT_BACK_HC'}
      />
    </div>
  );
}
