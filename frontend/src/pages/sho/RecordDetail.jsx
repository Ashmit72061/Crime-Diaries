import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckSquare, X, Send, AlertTriangle, ShieldCheck, History, Edit, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import DynamicForm from '../../components/forms/DynamicForm.jsx';
import { formSchemas } from '../../utils/api.js';
import useAuthStore from '../../store/authStore.js';
import api from '../../utils/api.js';

export default function RecordDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [sendBackModalOpen, setSendBackModalOpen] = useState(false);
  const [sendBackComment, setSendBackComment] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);
  
  // DCP Override States
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideVal, setOverrideVal] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  // Fetch record details
  const { data: record, isLoading } = useQuery({
    queryKey: ['records', id],
    queryFn: async () => {
      const res = await api.get(`/records/${id}`);
      return res.data.data;
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/records/${id}/approve`);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Record approved successfully');
      queryClient.invalidateQueries({ queryKey: ['records', id] });
      queryClient.invalidateQueries({ queryKey: ['workflow', 'queue'] });
      navigate('/queue');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to approve record');
    },
  });

  // Send back mutation
  const sendBackMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post(`/records/${id}/send-back`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Record sent back to Head Constable for correction');
      setSendBackModalOpen(false);
      setSendBackComment('');
      setSelectedFields([]);
      queryClient.invalidateQueries({ queryKey: ['records', id] });
      queryClient.invalidateQueries({ queryKey: ['workflow', 'queue'] });
      navigate('/queue');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send record back');
    },
  });

  // DCP Override Mutation
  const overrideMutation = useMutation({
    mutationFn: async (payload) => {
      // For mock mode we simulate updating the field registry and record
      // In NestJS, this overrides Case/Crime Head
      const res = await api.put(`/records/${id}`, {
        data: {
          ...record.data,
          local_head: payload.new_value,
          crime_head: payload.new_value
        }
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Classification overridden successfully');
      setOverrideOpen(false);
      setOverrideReason('');
      queryClient.invalidateQueries({ queryKey: ['records', id] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Override failed');
    },
  });

  // Handles Send Back submission
  const handleSendBackSubmit = () => {
    if (!sendBackComment) {
      toast.error('Feedback comment is required');
      return;
    }
    sendBackMutation.mutate({
      comment: sendBackComment,
      target_fields: selectedFields
    });
  };

  // Handles DCP Override Save
  const handleOverrideSave = () => {
    if (!overrideVal) {
      toast.error('Please select a new classification head');
      return;
    }
    if (overrideReason.length < 10) {
      toast.error('Mandatory audit reason must be at least 10 characters');
      return;
    }
    overrideMutation.mutate({
      new_value: overrideVal,
      reason: overrideReason
    });
  };

  // Toggle field selection for send-back correction request
  const toggleField = (fieldKey) => {
    if (selectedFields.includes(fieldKey)) {
      setSelectedFields(selectedFields.filter(f => f !== fieldKey));
    } else {
      setSelectedFields([...selectedFields, fieldKey]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-zinc-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cca43b] mb-4"></div>
        <p>{t('common.loading', 'Syncing digital registry logs...')}</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <AlertTriangle className="mx-auto text-amber-500 mb-2" />
        <p>Record details not found</p>
      </div>
    );
  }

  // Check if active user can perform action in hierarchy
  const isPendingReview = 
    (record.current_status === 'PENDING_SHO' && user?.role === 'SHO') ||
    (record.current_status === 'DISTRICT_REVIEW' && (user?.role === 'DISTRICT' || user?.role === 'DISTRICT_OFFICER'));

  const isDCP = user?.role === 'DISTRICT' || user?.role === 'DISTRICT_OFFICER';

  // Get field keys for multi-select checklist in send-back
  const getAvailableFields = () => {
    const schemas = formSchemas[record.record_type] || [];
    return schemas.flatMap(sec => sec.fields);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Detail Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 p-2 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-zinc-700"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-serif font-bold text-zinc-100 flex items-center gap-2">
              <span>Record Registry Details</span>
              <span className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded uppercase font-mono font-bold tracking-wider">
                {record.record_type}
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Author: <strong className="text-zinc-200">{record.created_by}</strong> · Created on: <span className="font-mono">{new Date(record.created_at).toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Workflow actions tray */}
        <div className="flex items-center gap-2">
          {isPendingReview && (
            <>
              <button
                onClick={() => setSendBackModalOpen(true)}
                className="bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {t('actions.sendBack', 'Send Back')}
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Confirm approval and escalation of this record?')) {
                    approveMutation.mutate();
                  }
                }}
                className="bg-[#cca43b] hover:bg-amber-600 text-zinc-950 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <ShieldCheck size={14} />
                <span>{t('actions.approve', 'Approve & Escalate')}</span>
              </button>
            </>
          )}

          {isDCP && (
            <button
              onClick={() => setOverrideOpen(true)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-750 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Edit size={14} className="text-[#cca43b]" />
              <span>Override Classification</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form content */}
        <div className="lg:col-span-2 space-y-6">
          <DynamicForm
            recordType={record.record_type}
            initialValues={record}
            readOnly={true}
          />
        </div>

        {/* Right Col: Timeline history details */}
        <div className="space-y-6">
          {/* Status info box */}
          <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Current Status</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-200">
                {t(`status.${record.current_status}`, record.current_status)}
              </span>
              <span className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded">
                Level: {record.current_level}
              </span>
            </div>
            <p className="text-zinc-500 text-[11px] leading-relaxed">
              Records are visible in the hierarchy immediately after HC submission.
            </p>
          </div>

          {/* Workflow logs timeline */}
          <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <History size={14} className="text-[#cca43b]" />
              <span>Workflow Transition History</span>
            </h3>

            <div className="relative border-l border-zinc-800 pl-4 ml-1 space-y-5 text-xs">
              {record.transitions?.length === 0 ? (
                <p className="text-zinc-500 italic p-1">No hierarchy transitions completed yet.</p>
              ) : (
                record.transitions?.map((tran, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] top-1 bg-zinc-950 border border-zinc-800 h-2.5 w-2.5 rounded-full" />
                    <div className="space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <strong className="text-zinc-200">{tran.action}</strong>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(tran.performed_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-[11px]">By: {tran.performed_by}</p>
                      {tran.comment && (
                        <p className="bg-zinc-950/40 text-zinc-400 p-2 rounded border border-zinc-800/60 mt-1 italic text-[11px]">
                          "{tran.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Diffs & Revisions logs */}
          <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <FileSpreadsheet size={14} className="text-[#cca43b]" />
              <span>Field revision log</span>
            </h3>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {record.revisions?.map((rev, idx) => (
                <div key={idx} className="bg-zinc-950/30 border border-zinc-850 p-3 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between items-center border-b border-zinc-850 pb-1">
                    <span className="font-bold text-zinc-200">Revision #{rev.revision_number}</span>
                    <span className="text-[10px] text-zinc-500">{new Date(rev.changed_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">By: {rev.changed_by}</p>
                  
                  {rev.field_changes?.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {rev.field_changes.map((ch, cIdx) => (
                        <div key={cIdx} className="bg-zinc-950/50 p-1.5 rounded text-[11px] border border-zinc-900">
                          <div className="text-[#cca43b] font-semibold">{ch.field_key}</div>
                          <div className="grid grid-cols-2 gap-1.5 text-zinc-400 mt-0.5">
                            <span className="truncate border-r border-zinc-800 pr-1">Old: <span className="line-through text-red-400">{String(ch.old_value)}</span></span>
                            <span className="truncate pl-1">New: <span className="text-emerald-400">{String(ch.new_value)}</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SEND BACK CORRECTION MODAL ────────────────────────────────────────── */}
      {sendBackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center bg-zinc-950/80 border-b border-zinc-850 px-5 py-3">
              <h3 className="text-sm font-bold text-zinc-200">Return record for correction</h3>
              <button
                onClick={() => setSendBackModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">Select fields requiring correction (Optional):</label>
                <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto bg-zinc-950 p-3 rounded-lg border border-zinc-855">
                  {getAvailableFields().map((f) => (
                    <button
                      key={f.field_key}
                      onClick={() => toggleField(f.field_key)}
                      className={`text-left p-1.5 rounded transition-all text-xs flex items-center gap-2 cursor-pointer ${
                        selectedFields.includes(f.field_key)
                          ? 'bg-amber-950/30 border border-amber-800 text-amber-400 font-semibold'
                          : 'hover:bg-zinc-900 border border-transparent text-zinc-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(f.field_key)}
                        readOnly
                        className="accent-amber-500"
                      />
                      <span className="truncate">{f.label_en}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Mandatory Feedback Comment for HC:</label>
                <textarea
                  rows={4}
                  value={sendBackComment}
                  onChange={(e) => setSendBackComment(e.target.value)}
                  placeholder="Explain exactly what correction is needed..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 outline-none focus:border-[#cca43b] transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 bg-zinc-950/80 border-t border-zinc-850 px-5 py-3 text-xs">
              <button
                onClick={() => setSendBackModalOpen(false)}
                className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg font-semibold cursor-pointer"
              >
                {t('actions.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleSendBackSubmit}
                className="bg-red-800 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-bold shadow-md cursor-pointer"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DCP OVERRIDE CLASSIFICATION MODAL ───────────────────────────────────── */}
      {overrideOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center bg-zinc-950/80 border-b border-zinc-850 px-5 py-3">
              <h3 className="text-sm font-bold text-zinc-200">Override crime classification</h3>
              <button
                onClick={() => setOverrideOpen(false)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Current Classification:</label>
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 text-xs text-zinc-300 font-mono">
                  {record.data.local_head || record.data.crime_head || 'Not Classified'}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">New Classification Category:</label>
                <select
                  value={overrideVal}
                  onChange={(e) => setOverrideVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 px-3 py-2 rounded-lg outline-none focus:border-[#cca43b] transition-all"
                >
                  <option value="">-- Choose Category --</option>
                  <option value="Theft">Theft</option>
                  <option value="Robbery">Robbery</option>
                  <option value="Snatching">Snatching</option>
                  <option value="Burglary">Burglary</option>
                  <option value="Murder">Murder / Attempt</option>
                  <option value="Other">Other BNS offences</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">Mandatory Override Reason (min 10 chars):</label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why this re-classification is being made..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 outline-none focus:border-[#cca43b] transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 bg-zinc-950/80 border-t border-zinc-850 px-5 py-3 text-xs">
              <button
                onClick={() => setOverrideOpen(false)}
                className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg font-semibold cursor-pointer"
              >
                {t('actions.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleOverrideSave}
                className="bg-[#cca43b] hover:bg-amber-600 text-zinc-950 px-5 py-2 rounded-lg font-bold shadow-md cursor-pointer"
              >
                Save Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
