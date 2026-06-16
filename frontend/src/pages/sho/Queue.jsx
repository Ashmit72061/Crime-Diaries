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
      return res.data.data;
    },
  });

  // Filter queue records based on type
  const filteredQueue = queue.filter(r => r.record_type === activeTab);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-zinc-100 flex items-center gap-2">
          <ClipboardList className="text-[#cca43b]" />
          <span>{t('nav.queue', 'Approval Desk')}</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-1">
          Review pending records submitted from your jurisdiction and approve or return them for correction.
        </p>
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

      {/* Queue Listing */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 text-zinc-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cca43b] mb-4"></div>
          <p>{t('common.loading', 'Syncing digital registry logs...')}</p>
        </div>
      ) : filteredQueue.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
          <ShieldCheck size={48} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-sm font-semibold">Queue Clean & Approved</p>
          <p className="text-xs text-zinc-600 mt-1">
            There are no pending diary records in your station queue requiring action.
          </p>
        </div>
      ) : (
        <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950/60 text-zinc-400 uppercase font-semibold border-b border-zinc-850">
                  <th className="p-3.5 pl-5">{t('common.referenceId', 'Ref ID / Number')}</th>
                  <th className="p-3.5">Station Location</th>
                  <th className="p-3.5">Record Date</th>
                  <th className="p-3.5">Gist</th>
                  <th className="p-3.5">Current Status</th>
                  <th className="p-3.5 pr-5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-zinc-300">
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
                    <tr key={rec.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-3.5 pl-5 font-mono font-bold text-zinc-200">{refId}</td>
                      <td className="p-3.5">Parliament Street</td>
                      <td className="p-3.5 font-mono">{rec.data.record_date || 'N/A'}</td>
                      <td className="p-3.5 max-w-[280px] truncate" title={gist}>
                        {gist}
                      </td>
                      <td className="p-3.5">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-amber-950/40 text-amber-400 border-amber-800/60">
                          {t(`status.${rec.current_status}`, rec.current_status)}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/records/${rec.id}`)}
                          className="bg-[#cca43b] hover:bg-amber-600 text-zinc-950 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all inline-flex cursor-pointer"
                        >
                          <span>Review details</span>
                          <ArrowRight size={12} />
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
  );
}
