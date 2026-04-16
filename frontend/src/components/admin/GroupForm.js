import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminGroupAPI, adminPermissionAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';
import { UserGroupIcon, ArrowLeftIcon, MagnifyingGlassIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

const GroupForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme } = useTheme();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [chosenPermissions, setChosenPermissions] = useState([]); // array of ids
  const [filterAvailable, setFilterAvailable] = useState('');
  const [filterChosen, setFilterChosen] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [permResp, groupResp] = await Promise.all([
          adminPermissionAPI.getPermissions(),
          isEdit ? adminGroupAPI.getGroup(id) : Promise.resolve({ data: null }),
        ]);
        setAvailablePermissions(permResp.data || []);
        if (groupResp.data) {
          setName(groupResp.data.name || '');
          setChosenPermissions(groupResp.data.permissions || []);
        }
      } catch (error) {
        console.error('Failed to load group/permissions', error);
        toast.error('Failed to load group information');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isEdit]);

  const handleMove = (source, ids) => {
    if (!ids.length) return;
    if (source === 'available') {
      setChosenPermissions((prev) => Array.from(new Set([...prev, ...ids])));
    } else {
      setChosenPermissions((prev) => prev.filter((pid) => !ids.includes(pid)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), permissions: chosenPermissions };
      if (isEdit) {
        await adminGroupAPI.updateGroup(id, payload);
        toast.success('Group updated successfully');
      } else {
        await adminGroupAPI.createGroup(payload);
        toast.success('Group created successfully');
      }
      navigate('/users-auth/groups');
    } catch (error) {
      console.error('Failed to save group', error);
      const resp = error.response?.data;
      const fieldErrors =
        resp && typeof resp === 'object'
          ? Object.entries(resp)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' | ')
          : null;
      toast.error(fieldErrors || 'Failed to save group');
    } finally {
      setSaving(false);
    }
  };

  const filteredAvailable = availablePermissions.filter((p) =>
    p.name.toLowerCase().includes(filterAvailable.toLowerCase()) && !chosenPermissions.includes(p.id)
  );

  const filteredChosen = availablePermissions.filter((p) =>
    chosenPermissions.includes(p.id) && p.name.toLowerCase().includes(filterChosen.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070B14] dark:bg-[#070B14] p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => navigate('/users-auth/groups')}
            className="group flex items-center text-xs font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-all"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
            Back to security groups
          </button>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <UserGroupIcon className="h-8 w-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">{isEdit ? 'Configure Group' : 'Initialize Group'}</h1>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Define group title and inherit system permissions across its nodes.</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="max-w-xl space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Group Title</label>
            <input
              type="text"
              className="block w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner font-bold"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Senior Developers"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Permissions Strategy</label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Available */}
              <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden flex flex-col">
                <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Registry</span>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{filteredAvailable.length} NODES</span>
                </div>
                <div className="p-4 bg-white/5 border-b border-white/10">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter nodes..."
                      className="block w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                      value={filterAvailable}
                      onChange={(e) => setFilterAvailable(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 max-h-96 overflow-y-auto custom-scrollbar divide-y divide-white/5">
                  {filteredAvailable.map((p) => {
                    const label = [p.content_type, p.name].filter(Boolean).join(' | ');
                    return (
                      <div key={p.id} className="group flex items-center px-6 py-3 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => handleMove('available', [p.id])}>
                        <div className="flex-1">
                          <div className="text-[11px] font-bold text-slate-200 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{label}</div>
                          <div className="text-[10px] font-black text-slate-600 tracking-tighter uppercase">{p.codename}</div>
                        </div>
                        <PlusIcon className="h-4 w-4 text-slate-600 group-hover:text-indigo-500 transition-all transform group-hover:rotate-90" />
                      </div>
                    );
                  })}
                  {!loading && filteredAvailable.length === 0 && (
                    <div className="px-6 py-12 text-center text-xs text-slate-600 font-bold uppercase tracking-widest italic opacity-50">Empty Registry</div>
                  )}
                </div>
              </div>

              {/* Chosen */}
              <div className="bg-indigo-500/5 rounded-3xl border border-indigo-500/20 overflow-hidden flex flex-col">
                <div className="px-6 py-4 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Permissions</span>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest bg-indigo-500 px-2 py-0.5 rounded-full">{filteredChosen.length} ACTIVE</span>
                </div>
                <div className="p-4 bg-white/5 border-b border-white/10">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter active..."
                      className="block w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                      value={filterChosen}
                      onChange={(e) => setFilterChosen(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 max-h-96 overflow-y-auto custom-scrollbar divide-y divide-white/5">
                  {filteredChosen.map((p) => {
                    const label = [p.content_type, p.name].filter(Boolean).join(' | ');
                    return (
                      <div key={p.id} className="group flex items-center px-6 py-3 hover:bg-red-500/5 transition-colors cursor-pointer" onClick={() => handleMove('chosen', [p.id])}>
                        <div className="flex-1">
                          <div className="text-[11px] font-bold text-white group-hover:text-red-400 transition-colors uppercase tracking-tight">{label}</div>
                          <div className="text-[10px] font-black text-slate-500 tracking-tighter uppercase">{p.codename}</div>
                        </div>
                        <MinusIcon className="h-4 w-4 text-slate-600 group-hover:text-red-500 transition-all transform group-hover:scale-125" />
                      </div>
                    );
                  })}
                  {!loading && filteredChosen.length === 0 && (
                    <div className="px-6 py-12 text-center text-xs text-slate-600 font-bold uppercase tracking-widest italic opacity-50">Zero Active Nodes</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-white/5 border-t border-white/10 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/users-auth/groups')}
            className="px-8 py-3 text-xs font-black rounded-2xl border border-white/10 text-slate-400 hover:bg-black/10 dark:bg-white/5/10 hover:text-white transition-all transform active:scale-95 uppercase tracking-widest"
          >
            DISCARD CHANGES
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`px-10 py-3 text-xs font-black rounded-2xl bg-gradient-to-r ${theme.primaryGradient} text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all disabled:opacity-50 transform hover:scale-105 active:scale-95 uppercase tracking-widest`}
          >
            {saving ? 'SYNCHRONIZING…' : 'DEPLOY GROUP CONFIG'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GroupForm;
