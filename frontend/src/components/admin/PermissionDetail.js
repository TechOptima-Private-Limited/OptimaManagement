import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminPermissionAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';
import { ShieldCheckIcon, ArrowLeftIcon, KeyIcon, FingerPrintIcon } from '@heroicons/react/24/outline';

const PermissionDetail = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { id } = useParams();
  const [permission, setPermission] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await adminPermissionAPI.getPermission(id);
        setPermission(data);
        setName(data.name || '');
      } catch (error) {
        console.error('Failed to load permission', error);
        toast.error('Failed to load permission');
      }
    };
    load();
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminPermissionAPI.updatePermission(id, { name });
      toast.success('Permission updated successfully');
      navigate('/users-auth/permissions');
    } catch (error) {
      console.error('Failed to update permission', error);
      toast.error('Failed to update permission');
    } finally {
      setSaving(false);
    }
  };

  if (!permission) {
    return (
      <div className="min-h-screen bg-[#070B14] dark:bg-[#070B14] p-8 flex items-center justify-center">
        <div className="text-indigo-400 text-xs font-black uppercase tracking-widest animate-pulse">Initializing Node…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] dark:bg-[#070B14] p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => navigate('/users-auth/permissions')}
            className="group flex items-center text-xs font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-all"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
            Back to permissions registry
          </button>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <ShieldCheckIcon className="h-8 w-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">Configure Access Node</h1>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Override display name for granular system permissions.</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-w-2xl">
        <div className="p-8 space-y-8">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Display Name</label>
            <input
              type="text"
              className="block w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner font-bold"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="System display title"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">System Codename</label>
              <div className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 opacity-70">
                <KeyIcon className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-400 tracking-tight">{permission.codename}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Content Classification</label>
              <div className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 opacity-70">
                <FingerPrintIcon className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-400 tracking-tight">{permission.content_type}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-white/5 border-t border-white/10 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/users-auth/permissions')}
            className="px-8 py-3 text-xs font-black rounded-2xl border border-white/10 text-slate-400 hover:bg-black/10 dark:bg-white/5/10 hover:text-white transition-all transform active:scale-95 uppercase tracking-widest"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`px-10 py-3 text-xs font-black rounded-2xl bg-gradient-to-r ${theme.primaryGradient} text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all disabled:opacity-50 transform hover:scale-105 active:scale-95 uppercase tracking-widest`}
          >
            {saving ? 'UPDATING…' : 'COMMIT REGISTRY UPDATE'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PermissionDetail;
