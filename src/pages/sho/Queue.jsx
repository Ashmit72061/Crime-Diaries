import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Filter, Eye, ArrowRight, ShieldCheck } from 'lucide-react';
import useAuthStore from '../../store/authStore.js';
import api from '../../utils/api.js';

export default function Queue() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('CASE'); // CASE, ARREST, PCR_CALL, MISSING, UIDB

  // Fetch pending review records queue
  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['workflow', 'queue'],
    queryFn: async () => {
      const res = await api.get('/workflow/queue');
      return res.data.data?.queue || res.data.data || [];
    },
  });

  // Filter queue records based on type
  const filteredQueue = queue.filter(r => r.record_type === activeTab);

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-[#1A202C]">

      {/* Hero Header — mirrors Dashboard's gradient banner */}
      <div className="bg-gradient-to-br from-[#0A1628] via-[#003087] to-[#0046C0] px-8 py-10 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full border border-white/5" />
        <div className="pointer-events-none absolute -top-8 -right-8 h-48 w-48 rounded-full border border-white/5" />

        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 border border-white/20">
            <ClipboardList size={13} /> APPROVAL DESK
          </span>
          <h1 className="mt-4 text-3xl font-bold text-white flex items-center gap-3">
            {t('nav.queue', 'Approval Desk')}
          </h1>
          <p className="mt-2 text-sm text-white/60 max-w-xl">
            Review pending records submitted from your jurisdiction and approve or return them for correction.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-10">

        {/* Record Category Tabs */}
        <div className="mt-6 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm px-2 py-2 flex flex-wrap gap-1">
          {['CASE', 'ARREST', 'PCR_CALL', 'MISSING', 'UIDB'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-semibold tracking-wide rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#003087] to-[#0046C0] text-white shadow-md shadow-blue-500/20'
                  : 'text-[#4A5568] hover:bg-[#EFF6FF] hover:text-[#003087]'
              }`}
            >
              {t(`recordTypes.${tab}`, tab)}
            </button>
          ))}
        </div>

        {/* Queue Listing */}
        <div className="mt-5">
          {isLoading ? (
            <div className="rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col items-center justify-center p-20 text-[#718096] gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-[3px] border-[#003087]" />
              <p className="text-sm font-semibold text-[#4A5568]">
                {t('common.loading', 'Syncing digital registry logs...')}
              </p>
            </div>

          ) : filteredQueue.length === 0 ? (
            <div className="rounded-3xl bg-white border border-[#E2E8F0] shadow-sm p-16 text-center">
              <div className="flex items-center justify-center mb-5">
                <div className="h-20 w-20 rounded-2xl bg-[#ECFDF5] flex items-center justify-center">
                  <ShieldCheck size={40} className="text-[#059669]" />
                </div>
              </div>
              <p className="text-lg font-bold text-[#1A202C] mb-1">Queue Clean &amp; Approved</p>
              <p className="text-sm text-[#718096] max-w-sm mx-auto">
                There are no pending diary records in your station queue requiring action.
              </p>
            </div>

          ) : (
            <div className="rounded-3xl bg-white border border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                      <th className="p-4 pl-6 text-xs font-semibold uppercase tracking-wider text-[#718096]">
                        {t('common.referenceId', 'Ref ID / Number')}
                      </th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-[#718096]">Station Location</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-[#718096]">Record Date</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-[#718096]">Gist</th>
                      <th className="p-4 text-xs font-semibold uppercase tracking-wider text-[#718096]">Current Status</th>
                      <th className="p-4 pr-6 text-xs font-semibold uppercase tracking-wider text-[#718096] text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] text-[#1A202C]">
                    {filteredQueue.map((rec) => {
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
                        'No description logged';

                      return (
                        <tr
                          key={rec.id}
                          className="group hover:bg-[#EFF6FF] transition-all duration-150"
                        >
                          <td className="p-4 pl-6 font-mono font-bold text-[#0A1628]">{refId}</td>
                          <td className="p-4 text-[#4A5568]">Parliament Street</td>
                          <td className="p-4 font-mono text-[#4A5568]">{rec.data.record_date || 'N/A'}</td>
                          <td className="p-4 max-w-[280px] truncate text-[#4A5568]" title={gist}>
                            {gist}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                              {t(`status.${rec.current_status}`, rec.current_status)}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right whitespace-nowrap">
                            <button
                              onClick={() => navigate(`/records/${rec.id}`)}
                              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#003087] to-[#0046C0] hover:from-[#0A1628] hover:to-[#003087] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:shadow-blue-500/25 hover:-translate-y-0.5"
                            >
                              <span>Review</span>
                              <ArrowRight size={14} />
                            </button>
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
      </div>
    </div>
  );
}