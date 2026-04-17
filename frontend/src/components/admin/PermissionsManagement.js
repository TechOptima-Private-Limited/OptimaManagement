import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminPermissionAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';
import { ShieldCheckIcon, ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const PermissionsManagement = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [permissions, setPermissions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const loadPermissions = async (term = '') => {
    try {
      setLoading(true);
      const { data } = await adminPermissionAPI.getPermissions(
        term ? { search: term } : undefined
      );
      setPermissions(data || []);
    } catch (error) {
      console.error('Failed to load permissions', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadPermissions(search.trim());
  };

  return (
    <div className="min-h-screen bg-[#070B14] dark:bg-[#070B14] p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => navigate('/users-auth')}
            className="group flex items-center text-xs font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-all"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
            Back to Users and Authentication
          </button>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <ShieldCheckIcon className="h-8 w-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">System Permissions</h1>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Granular control oversight for all application access nodes.</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex items-center space-x-4 max-w-xl">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search permissions..."
            className="block w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-black/10 dark:bg-white/5/10 hover:text-white transition-all transform active:scale-95"
        >
          SEARCH
        </button>
      </form>

      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-8 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">REGISTRY ENTRY</span>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{loading ? 'SCANNING…' : `${permissions.length} NODES IDENTIFIED`}</span>
        </div>
        <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
          {permissions.map((p) => {
            const label = [p.content_type, p.name].filter(Boolean).join(' | ');
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`/users-auth/permissions/${p.id}`)}
                className="group w-full px-8 py-4 text-sm flex items-center justify-between hover:bg-white/5 text-left transition-all duration-300"
              >
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{label}</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 opacity-70">{p.codename}</div>
                </div>
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  <ArrowLeftIcon className="h-4 w-4 text-slate-600 rotate-180" />
                </div>
              </button>
            );
          })}
          {!loading && permissions.length === 0 && (
            <div className="px-8 py-12 text-center text-sm text-slate-500 font-medium italic opacity-50">No access nodes detected in search results.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionsManagement;
