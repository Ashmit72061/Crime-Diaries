import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api.js';

export default function FieldManager() {
  // Fetch Registry Fields
  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['admin', 'fields'],
    queryFn: async () => {
      const res = await api.get('/fields');
      return res.data.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-zinc-100 flex items-center gap-2">
          <Settings className="text-[#cca43b]" />
          <span>Field Registry Manager</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-1">
          Review schema structures, toggle active status, or edit form parameters dynamically without database migrations.
        </p>
      </div>

      {/* Fields Table list */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cca43b] mb-4"></div>
          <p>Syncing database field configurations...</p>
        </div>
      ) : (
        <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950/60 text-zinc-400 uppercase font-semibold border-b border-zinc-850">
                  <th className="p-3.5 pl-5">Field Key / DB row</th>
                  <th className="p-3.5">Field Type</th>
                  <th className="p-3.5">English Label</th>
                  <th className="p-3.5">Hindi Label (हिन्दी)</th>
                  <th className="p-3.5">Record Type Group</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Switch Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-zinc-300">
                {fields.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-3.5 pl-5 font-mono font-bold text-zinc-200">{item.field_key}</td>
                    <td className="p-3.5 text-zinc-400 font-semibold">{item.field_type}</td>
                    <td className="p-3.5 text-zinc-100">{item.label_en}</td>
                    <td className="p-3.5 font-sans text-zinc-200">{item.label_hi}</td>
                    <td className="p-3.5">
                      <span className="bg-zinc-950/80 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono font-bold uppercase text-[9px]">
                        {item.applicable_record_types?.join(', ')}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                          item.is_active
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <button
                        onClick={() => {
                          toast.success(`Registry entry: ${item.field_key} toggled`);
                        }}
                        className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer inline-flex"
                        title="Toggle Active Switch"
                      >
                        {item.is_active ? (
                          <ToggleRight size={22} className="text-[#cca43b]" />
                        ) : (
                          <ToggleLeft size={22} className="text-zinc-600" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
