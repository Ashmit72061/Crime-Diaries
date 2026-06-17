import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Network, Folder, ChevronRight, ChevronDown, Award } from 'lucide-react';
import api from '../../utils/api.js';

export default function HierarchyManager() {
  const { data: hierarchy = {}, isLoading } = useQuery({
    queryKey: ['admin', 'hierarchy'],
    queryFn: async () => {
      const res = await api.get('/hierarchy');
      return res.data.data;
    },
  });

  // Simple nested node rendering helper
  const TreeNode = ({ node }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div className="pl-4 border-l border-zinc-800 ml-2 mt-2 text-xs">
        <div className="flex items-center gap-2 py-1">
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded cursor-pointer"
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="w-5" />
          )}

          <Folder size={14} className="text-[#cca43b]" />
          <strong className="text-zinc-200">{node.name || node.name_en}</strong>
          <span className="bg-zinc-900 border border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">
            {node.type || node.node_type}
          </span>
          <span className="text-[10px] text-zinc-400">
            ({node.officerName || 'N/A'} - {node.rank || 'N/A'})
          </span>
        </div>

        {hasChildren && expanded && (
          <div className="space-y-1">
            {node.children.map((child, idx) => (
              <TreeNode key={idx} node={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-zinc-100 flex items-center gap-2">
          <Network className="text-[#cca43b]" />
          <span>Hierarchy Node Configurator</span>
        </h1>
        <p className="text-zinc-400 text-xs mt-1">
          Interactive map to inspect, edit, or adjust parent-child relationships of Ranges, Districts, and Station jurisdictions.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cca43b] mb-4"></div>
          <p>Loading Delhi Police hierarchy maps...</p>
        </div>
      ) : (
        <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl p-5 shadow-lg">
          <div className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-xl max-h-[500px] overflow-y-auto">
            <TreeNode node={hierarchy} />
          </div>
        </div>
      )}
    </div>
  );
}
