import React, { useEffect, useState } from 'react';
import { assetsAPI } from '../../services/api';
import { getCurrentUser } from '../../utils/auth';
import { useTheme } from '../../context/ThemeContext';
import { ComputerDesktopIcon, TagIcon, HashtagIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const MyAssets = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [assetTypeCategory, setAssetTypeCategory] = useState({}); // id -> category
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const current = getCurrentUser();
        const params = current?.id ? { employee_id: current.id } : undefined;
        const res = await assetsAPI.getMyAssignments(params);
        const data = res.data.results || res.data || [];
        setAssignments(data);
        const ids = Array.from(new Set((data || []).flatMap(a => a.assets || [])));
        if (ids.length === 0) {
          setAssets([]);
          return;
        }
        const details = await Promise.all(ids.map(id => assetsAPI.getAsset(id).then(r => r.data)));
        setAssets(details);

        // Fetch asset type categories so we can hide prev user for SOFTWARE
        const typeIds = Array.from(new Set(details.map(d => d.asset_type).filter(Boolean)));
        if (typeIds.length > 0) {
          const types = await Promise.all(typeIds.map(tid => assetsAPI.getAssetType(tid).then(r => r.data)));
          const map = {};
          types.forEach(t => { map[t.id] = t.category; });
          setAssetTypeCategory(map);
        } else {
          setAssetTypeCategory({});
        }
      } catch (e) {
        const msg = e?.response?.data?.detail || 'Failed to load assets';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const getStatusBadge = (status) => {
    const base = 'inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all';
    if (status === 'ASSIGNED') return `${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`;
    if (status === 'AVAILABLE') return `${base} bg-blue-500/10 text-blue-400 border-blue-500/20`;
    if (status === 'DAMAGED') return `${base} bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]`;
    if (status === 'LOST') return `${base} bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]`;
    return `${base} bg-[#070B14]0/10 text-slate-400 border-slate-500/20`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] dark:bg-[#070B14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto shadow-[0_0_15px_rgba(99,102,241,0.2)]"></div>
          <p className="mt-4 text-slate-400 font-bold tracking-wide animate-pulse uppercase text-xs">Loading your assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] dark:bg-[#070B14] py-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 bg-white/5/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 p-8 flex items-center justify-between group overflow-hidden relative">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-slate-800 dark:from-white dark:to-slate-400">My Assets</h1>
            <p className="text-lg text-slate-400 font-medium">Assets currently assigned to you</p>
          </div>
          <div className="relative z-10 h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-110 group-hover:rotate-6 border border-black/20 dark:border-white/20">
            <ComputerDesktopIcon className="h-8 w-8 text-white" />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 font-bold tracking-tight shadow-lg backdrop-blur-md">
            <div className="flex items-center">
              <span className="mr-3 p-2 bg-rose-500/20 rounded-lg">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {assets.length === 0 ? (
          <div className="bg-white/5/5 backdrop-blur-xl rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl p-20 text-center">
            <ComputerDesktopIcon className="h-20 w-20 text-white/5 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white tracking-tight">No assets assigned</h3>
            <p className="mt-2 text-slate-400 font-medium">When assets are assigned to you, they will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((a) => (
              <div key={a.id} className="bg-white/5/5 backdrop-blur-xl rounded-2xl border border-black/10 dark:border-white/10 shadow-xl p-6 hover:bg-black/10 dark:bg-white/5/10 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-lg ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                      <ComputerDesktopIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-bold tracking-tight text-lg">{a.name}</div>
                      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">#{a.id}</div>
                    </div>
                  </div>
                  <span className={getStatusBadge(a.status)}>{a.status}</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center px-4 py-3 bg-white/5/5 rounded-xl border border-white/10 group-hover:border-black/20 dark:border-white/20 transition-all">
                    <TagIcon className="h-4 w-4 text-indigo-400 mr-3" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Asset Tag</div>
                      <div className="text-slate-200 font-black tracking-tight">{a.asset_tag}</div>
                    </div>
                  </div>
                  {a.serial_number ? (
                    <div className="flex items-center px-4 py-3 bg-white/5/5 rounded-xl border border-white/10 group-hover:border-black/20 dark:border-white/20 transition-all">
                      <HashtagIcon className="h-4 w-4 text-indigo-400 mr-3" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Serial Number</div>
                        <div className="text-slate-200 font-black tracking-tight">{a.serial_number}</div>
                      </div>
                    </div>
                  ) : null}
                  {a.purchased_date ? (
                    <div className="flex items-center px-4 py-3 bg-white/5/5 rounded-xl border border-white/10 group-hover:border-black/20 dark:border-white/20 transition-all">
                      <ClockIcon className="h-4 w-4 text-indigo-400 mr-3" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Purchased</div>
                        <div className="text-slate-200 font-black tracking-tight">{a.purchased_date}</div>
                      </div>
                    </div>
                  ) : null}
                  {a.laptop_age_pretty ? (
                    <div className="flex items-center px-4 py-3 bg-white/5/5 rounded-xl border border-white/10 group-hover:border-black/20 dark:border-white/20 transition-all">
                      <ClockIcon className="h-4 w-4 text-indigo-400 mr-3" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Duration In Use</div>
                        <div className="text-slate-200 font-black tracking-tight">{a.laptop_age_pretty}</div>
                      </div>
                    </div>
                  ) : null}
                  {/* Show previous user only for non-software assets */}
                  {a.previously_used_by_info && assetTypeCategory[a.asset_type] !== 'SOFTWARE' ? (
                    <div className="flex items-center px-4 py-3 bg-white/5/5 rounded-xl border border-white/10 group-hover:border-black/20 dark:border-white/20 transition-all">
                      <CheckCircleIcon className="h-4 w-4 text-emerald-400 mr-3" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Previous User</div>
                        <div className="text-slate-200 font-black tracking-tight">{a.previously_used_by_info.name}</div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {assignments.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 italic opacity-60">
                      <span>Assigned via {assignments[0]?.employee_info?.name || 'assignment'}</span>
                      <span>{new Date(assignments[0]?.assigned_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAssets;
