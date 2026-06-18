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
  const [activeTab, setActiveTab] = useState('ALL');

  // Fetch pending review records queue
  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['workflow', 'queue'],
    queryFn: async () => {
      const res = await api.get('/workflow/queue');
      return res.data.data?.queue || res.data.data || [];
    },
  });

  const countFor = (tab) => tab === 'ALL' ? queue.length : queue.filter(r => r.record_type === tab).length;

  // Filter queue records based on type
  const filteredQueue = activeTab === 'ALL' ? queue : queue.filter(r => r.record_type === activeTab);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <ClipboardList className="text-[#0f52ba]" size={24} />
          <span>{t('nav.queue', 'Approval Desk')}</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Review pending records submitted from your jurisdiction and approve or return them for correction.
        </p>
      </div>

      {/* Record Category Tabs */}
      <div className="border-b-2 border-slate-200 flex flex-wrap gap-1">
        {['ALL', 'CASE', 'ARREST', 'PCR_CALL', 'MISSING', 'UIDB'].map((tab) => {
          const count = countFor(tab);
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3.5 text-sm font-bold tracking-wide border-b-[3px] transition-all cursor-pointer -mb-[2px] flex items-center gap-2 ${
                activeTab === tab
                  ? 'border-[#0f52ba] text-[#0f52ba] bg-[#0f52ba]/5 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {t(`recordTypes.${tab}`, tab)}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab ? 'bg-[#0f52ba] text-white' : 'bg-amber-100 text-amber-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Queue Listing */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-[3px] border-[#0f52ba]"></div>
          <p className="text-sm font-semibold">{t('common.loading', 'Syncing digital registry logs...')}</p>
        </div>
      ) : filteredQueue.length === 0 ? (
        <div className="border border-dashed border-slate-200 bg-white rounded-xl p-16 text-center text-slate-400 shadow-sm">
          <ShieldCheck size={56} className="mx-auto text-emerald-300 mb-4" />
          <p className="text-lg font-bold text-slate-700 mb-1">Queue Clean &amp; Approved</p>
          <p className="text-sm text-slate-400">
            There are no pending diary records in your station queue requiring action.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200 text-xs tracking-wider">
                  <th className="p-4 pl-5">{t('common.referenceId', 'Ref ID / Number')}</th>
                  <th className="p-4">Station Location</th>
                  <th className="p-4">Record Date</th>
                  <th className="p-4">Gist</th>
                  <th className="p-4">Current Status</th>
                  <th className="p-4 pr-5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
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
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-5 font-mono font-bold text-slate-800">{refId}</td>
                      <td className="p-4 text-slate-600">Parliament Street</td>
                      <td className="p-4 font-mono text-slate-600">{rec.data.record_date || 'N/A'}</td>
                      <td className="p-4 max-w-[280px] truncate text-slate-600" title={gist}>
                        {gist}
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {t(`status.${rec.current_status}`, rec.current_status)}
                        </span>
                      </td>
                      <td className="p-4 pr-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/records/${rec.id}`)}
                          className="bg-gradient-to-r from-[#0f52ba] to-[#16406d] hover:from-[#16406d] hover:to-[#0d2a4a] text-white px-5 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#0f52ba]/25 hover:shadow-lg hover:-translate-y-0.5 ml-auto"
                        >
                          <span>Review details</span>
                          <ArrowRight size={15} />
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
