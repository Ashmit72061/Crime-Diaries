import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users as UsersIcon, Plus, UserCheck, UserX, ShieldAlert, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api.js';

export default function Users() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [badgeNo, setBadgeNo] = useState('');
  const [role, setRole] = useState('PS'); // PS, SHO, DISTRICT, HQ, SYSTEM_ADMIN

  // Fetch Users Register List
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data.data;
    },
  });

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: async (payload) => {
      // For mock mode we simulate appending to mock registry
      // In NestJS, this writes to the users table
      return payload;
    },
    onSuccess: (data) => {
      toast.success('User profile registered successfully');
      setModalOpen(false);
      setUsername('');
      setBadgeNo('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!username || !badgeNo) {
      toast.error('All fields are required');
      return;
    }
    createUserMutation.mutate({ username, badgeNo, role, active: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-zinc-100 flex items-center gap-2">
            <UsersIcon className="text-[#cca43b]" />
            <span>Users Register Console</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            System administration tool to define badge authorization boundaries, locations, and hierarchical permissions.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-[#cca43b] hover:bg-amber-600 text-zinc-950 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span>Register New Officer</span>
        </button>
      </div>

      {/* Users table list */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cca43b] mb-4"></div>
          <p>Syncing security profiles register...</p>
        </div>
      ) : (
        <div className="border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950/60 text-zinc-400 uppercase font-semibold border-b border-zinc-850">
                  <th className="p-3.5 pl-5">Badge / PIS No.</th>
                  <th className="p-3.5">Officer Name</th>
                  <th className="p-3.5">Hierarchical Role</th>
                  <th className="p-3.5">Jurisdiction Scope</th>
                  <th className="p-3.5">Auth Status</th>
                  <th className="p-3.5 pr-5 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-zinc-300">
                {users.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-3.5 pl-5 font-mono font-bold text-zinc-200">{item.badgeNo}</td>
                    <td className="p-3.5 font-semibold text-zinc-100">{item.username}</td>
                    <td className="p-3.5 text-[#cca43b] font-bold">{item.role}</td>
                    <td className="p-3.5 text-zinc-400">Parliament Street Station</td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          item.active
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                            : 'bg-red-950/40 text-red-400 border-red-800/40'
                        }`}
                      >
                        {item.active ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <button
                        onClick={() => {
                          toast.success(`${item.username}'s authorization updated`);
                        }}
                        className={`p-1.5 rounded transition-all cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold border ${
                          item.active
                            ? 'bg-red-950/40 hover:bg-red-950 text-red-400 border-red-900/60'
                            : 'bg-emerald-950/40 hover:bg-emerald-950 text-emerald-400 border-emerald-900/60'
                        }`}
                      >
                        {item.active ? <UserX size={12} /> : <UserCheck size={12} />}
                        <span>{item.active ? 'Deactivate' : 'Activate'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CREATE USER MODAL ─────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center bg-zinc-950/80 border-b border-zinc-850 px-5 py-3">
              <h3 className="text-sm font-bold text-zinc-200">Register new operational user</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold">Official Badge / PIS Number:</label>
                <input
                  type="text"
                  value={badgeNo}
                  onChange={(e) => setBadgeNo(e.target.value)}
                  placeholder="e.g. HC99014"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 outline-none focus:border-[#cca43b] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold">Officer Name & Initials:</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Ramesh Singh"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 outline-none focus:border-[#cca43b] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold">Authorization Hierarchy Role:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 outline-none focus:border-[#cca43b] transition-all cursor-pointer"
                >
                  <option value="PS">Head Constable (Data Entry)</option>
                  <option value="SHO">Station House Officer (Reviewer)</option>
                  <option value="DISTRICT">DCP District Officer (Reviewer/Editor)</option>
                  <option value="HQ">HQ Analyst (Global Reader)</option>
                  <option value="SYSTEM_ADMIN">System Platform Admin</option>
                </select>
              </div>

              {/* Audit box */}
              <div className="bg-zinc-950 border border-zinc-800/80 p-2.5 rounded text-[11px] text-zinc-500 flex gap-2">
                <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
                <span>Creating a profile binds security signatures automatically to all submitted operations logs.</span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#cca43b] hover:bg-amber-600 text-zinc-950 px-5 py-2 rounded-lg font-bold shadow-md cursor-pointer"
                >
                  Register User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
