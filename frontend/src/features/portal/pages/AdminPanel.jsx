import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore.js';
import axios from 'axios';
import { 
  Settings, Users, Plus, Check, X, ShieldAlert, Key, 
  ToggleLeft, ToggleRight, ListFilter, SlidersHorizontal, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminPanel = () => {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('users');

  // jurisdictions fetched once
  const [districts, setDistricts] = useState([]);
  const [subdivisions, setSubdivisions] = useState([]);
  const [stations, setStations] = useState([]);

  const loadJurisdictions = async () => {
    try {
      const response = await axios.get('/api/v1/admin/jurisdictions');
      const { districts: d, subDivisions: s, policeStations: p } = response.data.data;
      setDistricts(d);
      setSubdivisions(s);
      setStations(p);
    } catch (e) {
      toast.error('Failed to load structural parameters.');
    }
  };

  useEffect(() => {
    loadJurisdictions();
  }, []);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-2">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-zinc-100 flex items-center gap-2">
            <Settings className="text-amber-500" />
            <span>Operational Administration Panel</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Configure system users and design localized dynamic custom fields.
          </p>
        </div>

        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${activeTab === 'users' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              User Accounts
            </button>
          )}
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${activeTab === 'fields' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Custom Field Manager
          </button>
        </div>
      </div>

      {activeTab === 'users' && currentUser.role === 'admin' ? (
        <UserSection districts={districts} subdivisions={subdivisions} stations={stations} />
      ) : (
        <FieldsSection districts={districts} subdivisions={subdivisions} stations={stations} />
      )}
    </div>
  );
};

// ── SUB-TAB: USER ACCOUNT MANAGER ──────────────────────────────────────────────
const UserSection = ({ districts, subdivisions, stations }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ps');
  const [district, setDistrict] = useState('');
  const [subDivision, setSubDivision] = useState('');
  const [policeStation, setPoliceStation] = useState('');

  // Dropdown list overrides
  const [filteredSubdivs, setFilteredSubdivs] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/admin/users');
      setUsers(res.data.data.users);
    } catch (e) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter subdivs based on district choice
  useEffect(() => {
    if (district) {
      setFilteredSubdivs(subdivisions.filter(s => s.district_id === district));
    } else {
      setFilteredSubdivs([]);
    }
    setSubDivision('');
  }, [district]);

  // Filter stations based on subdiv choice
  useEffect(() => {
    if (subDivision) {
      setFilteredStations(stations.filter(p => p.sub_division_id === subDivision));
    } else {
      setFilteredStations([]);
    }
    setPoliceStation('');
  }, [subDivision]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password || !role) {
      toast.error('Please fill in username, email, password, and role.');
      return;
    }

    try {
      await axios.post('/api/v1/admin/users', {
        username, email, password, role,
        district: role !== 'hq' && role !== 'admin' ? district : null,
        subDivision: role === 'ps' || role === 'acp' ? subDivision : null,
        policeStation: role === 'ps' ? policeStation : null
      });

      toast.success('User account registered successfully.');
      setUsername('');
      setEmail('');
      setPassword('');
      setRole('ps');
      setDistrict('');
      setSubDivision('');
      setPoliceStation('');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user account.');
    }
  };

  const handleDeactivate = async (id, isActive) => {
    try {
      await axios.put(`/api/v1/admin/users/${id}`, { isActive: !isActive });
      toast.success(isActive ? 'User account deactivated.' : 'User account reactivated.');
      fetchUsers();
    } catch (e) {
      toast.error('Failed to change user status.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Create form */}
      <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-6 bg-zinc-900/10 h-fit">
        <h2 className="text-md font-bold text-zinc-200 border-b border-zinc-800 pb-3 flex items-center gap-2">
          <Key className="text-amber-500" />
          <span>Register User</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">Username / Badge ID</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-350 focus:outline-none"
              placeholder="e.g. ps_adarsh_nagar"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">E-Mail Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-350 focus:outline-none"
              placeholder="operator@delhipolice.gov.in"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-350 focus:outline-none"
              placeholder="••••••••••••"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">Role Access Level</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300"
            >
              <option value="ps">PS Operator (Data Entry)</option>
              <option value="acp">ACP Sub-Division Reviewer</option>
              <option value="dcp">DCP District Manager</option>
              <option value="hq">HQ Command Auditor</option>
              <option value="admin">System Admin</option>
            </select>
          </div>

          {/* District Selector (Scoping) */}
          {role !== 'hq' && role !== 'admin' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">District Scoping</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300"
              >
                <option value="">Select District...</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sub Division Selector */}
          {(role === 'ps' || role === 'acp') && district && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Sub-Division Scoping</label>
              <select
                value={subDivision}
                onChange={(e) => setSubDivision(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300"
              >
                <option value="">Select Sub-Division...</option>
                {filteredSubdivs.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* PS Selector */}
          {role === 'ps' && subDivision && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Police Station Assignment</label>
              <select
                value={policeStation}
                onChange={(e) => setPoliceStation(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300"
              >
                <option value="">Select PS...</option>
                {filteredStations.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <Plus size={16} />
            <span>Create Account</span>
          </button>
        </form>
      </div>

      {/* Users grid list */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-md font-bold text-zinc-300 flex items-center gap-2">
          <Users className="text-amber-500" />
          <span>Active Operator Directories</span>
        </h2>

        <div className="glass-card rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/10">
          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-500">Querying user accounts...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-900 border-b border-zinc-850">
                    <th className="p-4 uppercase font-bold text-zinc-400">Username</th>
                    <th className="p-4 uppercase font-bold text-zinc-400">E-Mail</th>
                    <th className="p-4 uppercase font-bold text-zinc-400">Access Role</th>
                    <th className="p-4 uppercase font-bold text-zinc-400">Jurisdiction Scope</th>
                    <th className="p-4 uppercase font-bold text-zinc-400 text-right">Ledger Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="p-4 font-semibold text-zinc-200">{u.username}</td>
                      <td className="p-4 text-zinc-400">{u.email}</td>
                      <td className="p-4 text-zinc-300 uppercase font-mono">{u.role}</td>
                      <td className="p-4 text-zinc-400">
                        {u.policeStationName || u.subDivisionName || u.districtName || 'National Command'}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeactivate(u.id, u.isActive === 1)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${u.isActive === 1 ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400' : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-green-500/10 hover:border-green-500/20 hover:text-green-400'}`}
                        >
                          {u.isActive === 1 ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── SUB-TAB: CUSTOM FIELDS CONFIGURATOR ────────────────────────────────────────
const FieldsSection = ({ districts }) => {
  const { user: currentUser } = useAuthStore();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Inputs
  const [module, setModule] = useState('cases');
  const [fieldKey, setFieldKey] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [optionsStr, setOptionsStr] = useState(''); // Comma separated for dropdown
  const [isRequired, setIsRequired] = useState(false);
  const [scopeLevel, setScopeLevel] = useState('hq');
  const [scopeId, setScopeId] = useState('');

  const fetchFields = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/admin/custom-fields');
      setFields(res.data.data.customFields);
    } catch (e) {
      toast.error('Failed to load fields configurations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
    
    // Automatically set district scoping for DCP role
    if (currentUser.role === 'dcp') {
      setScopeLevel('district');
      setScopeId(currentUser.district);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fieldKey || !fieldLabel || !fieldType) {
      toast.error('Field key, label, and type are required.');
      return;
    }

    const options = fieldType === 'dropdown' ? optionsStr.split(',').map(o => o.trim()).filter(Boolean) : null;

    try {
      await axios.post('/api/v1/admin/custom-fields', {
        module,
        fieldKey: fieldKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        fieldLabel: fieldLabel.trim(),
        fieldType,
        options,
        isRequired,
        scopeLevel: currentUser.role === 'dcp' ? 'district' : scopeLevel,
        scopeId: currentUser.role === 'dcp' ? currentUser.district : (scopeLevel === 'district' ? scopeId : null)
      });

      toast.success('Custom field successfully appended to register.');
      setFieldKey('');
      setFieldLabel('');
      setFieldType('text');
      setOptionsStr('');
      setIsRequired(false);
      fetchFields();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to define custom field.');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await axios.delete(`/api/v1/admin/custom-fields/${id}`);
      toast.success('Custom field de-activated.');
      fetchFields();
    } catch (e) {
      toast.error('Failed to deactivate custom field.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Create form */}
      <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-6 bg-zinc-900/10 h-fit">
        <h2 className="text-md font-bold text-zinc-200 border-b border-zinc-800 pb-3 flex items-center gap-2">
          <SlidersHorizontal className="text-amber-500" />
          <span>Define Custom Field</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">Target Module</label>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
            >
              <option value="cases">Cases (FIR)</option>
              <option value="arrests">Arrests Master</option>
              <option value="pcr">PCR Call / Kalandra</option>
              <option value="missing">Missing / Recovered</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">Field Key Identifier (lowercase, no spaces)</label>
            <input
              type="text"
              value={fieldKey}
              onChange={(e) => setFieldKey(e.target.value)}
              placeholder="e.g. tracking_gis_id"
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">Field Label (Visible UI text)</label>
            <input
              type="text"
              value={fieldLabel}
              onChange={(e) => setFieldLabel(e.target.value)}
              placeholder="e.g. GIS Reference ID"
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">Field Type</label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
            >
              <option value="text">Single Line Text</option>
              <option value="long_text">Multi-Line Text Area</option>
              <option value="number">Number Value</option>
              <option value="date">Calendar Date</option>
              <option value="dropdown">Selection Dropdown</option>
            </select>
          </div>

          {/* Conditional field for dropdown options */}
          {fieldType === 'dropdown' && (
            <div className="space-y-1 bg-zinc-950 p-3 rounded-lg border border-zinc-850">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Dropdown Options (Comma separated)</label>
              <input
                type="text"
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                placeholder="Option A, Option B, Option C"
                className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
              />
            </div>
          )}

          {/* Scope selection for Admin role */}
          {currentUser.role === 'admin' && (
            <div className="space-y-3 p-3 bg-zinc-950 rounded-lg border border-zinc-850">
              <label className="text-[10px] font-bold text-zinc-400 uppercase block">Field Geographic Scope</label>
              
              <div className="flex items-center gap-4 text-xs">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-zinc-300">
                  <input
                    type="radio"
                    name="scope-group"
                    checked={scopeLevel === 'hq'}
                    onChange={() => setScopeLevel('hq')}
                  />
                  <span>Delhi-wide (HQ)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-zinc-300">
                  <input
                    type="radio"
                    name="scope-group"
                    checked={scopeLevel === 'district'}
                    onChange={() => setScopeLevel('district')}
                  />
                  <span>District Only</span>
                </label>
              </div>

              {scopeLevel === 'district' && (
                <select
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-300 focus:outline-none"
                >
                  <option value="">Select Target District...</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRequiredCheck"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="w-4 h-4 bg-zinc-950 border border-zinc-800 text-amber-500 focus:ring-amber-500 rounded"
            />
            <label htmlFor="isRequiredCheck" className="text-xs text-zinc-400 select-none cursor-pointer">
              Mark this field as Mandatory
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <Plus size={16} />
            <span>Append Field</span>
          </button>
        </form>
      </div>

      {/* Custom fields list */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-md font-bold text-zinc-300 flex items-center gap-2">
          <SlidersHorizontal className="text-amber-500" />
          <span>Active Dynamic Form Templates</span>
        </h2>

        <div className="glass-card rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/10">
          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-500">Querying field mapping schemas...</div>
          ) : fields.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">No dynamic fields defined.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-900 border-b border-zinc-850">
                    <th className="p-4 uppercase font-bold text-zinc-400">Module</th>
                    <th className="p-4 uppercase font-bold text-zinc-400">Field UI Label (Key)</th>
                    <th className="p-4 uppercase font-bold text-zinc-400">Data Type</th>
                    <th className="p-4 uppercase font-bold text-zinc-400">Scope Level</th>
                    <th className="p-4 uppercase font-bold text-zinc-400">Mandatory?</th>
                    <th className="p-4 uppercase font-bold text-zinc-400 text-right">Schema Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {fields.map((f) => (
                    <tr key={f.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="p-4 text-zinc-300 uppercase font-bold">{f.module}</td>
                      <td className="p-4">
                        <span className="font-semibold text-zinc-200 block">{f.field_label}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">({f.field_key})</span>
                      </td>
                      <td className="p-4 text-zinc-450 uppercase text-[10px] font-mono">{f.field_type}</td>
                      <td className="p-4 text-zinc-400">
                        {f.scope_level === 'hq' ? 'Delhi-wide (HQ)' : `${f.scope_id} District`}
                      </td>
                      <td className="p-4">
                        {f.is_required === 1 ? (
                          <span className="text-red-400 font-bold">Yes</span>
                        ) : (
                          <span className="text-zinc-500">No</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeactivate(f.id)}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                        >
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
