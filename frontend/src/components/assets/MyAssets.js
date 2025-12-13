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
    const base = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border';
    if (status === 'ASSIGNED') return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
    if (status === 'AVAILABLE') return `${base} bg-gray-50 text-gray-700 border-gray-200`;
    if (status === 'DAMAGED') return `${base} bg-amber-50 text-amber-700 border-amber-200`;
    if (status === 'LOST') return `${base} bg-rose-50 text-rose-700 border-rose-200`;
    return `${base} bg-gray-50 text-gray-700 border-gray-200`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold bg-gradient-to-r ${theme.primaryGradient} bg-clip-text text-transparent`}>My Assets</h1>
            <p className="text-gray-600 mt-1">Assets currently assigned to you</p>
          </div>
          <div className={`h-12 w-12 bg-gradient-to-r ${theme.primaryGradient} rounded-xl flex items-center justify-center shadow-lg`}>
            <ComputerDesktopIcon className="h-6 w-6 text-white" />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
            {error}
          </div>
        )}

        {assets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
            <ComputerDesktopIcon className="h-12 w-12 text-gray-300 mx-auto" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No assets assigned</h3>
            <p className="mt-1 text-gray-500">When assets are assigned to you, they will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-600 rounded-lg">
                      <ComputerDesktopIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-gray-900 font-semibold">{a.name}</div>
                      <div className="text-xs text-gray-500">#{a.id}</div>
                    </div>
                  </div>
                  <span className={getStatusBadge(a.status)}>{a.status}</span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  <div className="flex items-center">
                    <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="font-medium">Asset Tag:</span>
                    <span className="ml-2 text-indigo-700">{a.asset_tag}</span>
                  </div>
                  {a.serial_number ? (
                    <div className="flex items-center">
                      <HashtagIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-medium">Serial:</span>
                      <span className="ml-2">{a.serial_number}</span>
                    </div>
                  ) : null}
                  {a.purchased_date ? (
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-medium">Purchased:</span>
                      <span className="ml-2">{a.purchased_date}</span>
                    </div>
                  ) : null}
                  {a.laptop_age_pretty ? (
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-medium">In use:</span>
                      <span className="ml-2">{a.laptop_age_pretty}</span>
                    </div>
                  ) : null}
                  {/* Show previous user only for non-software assets */}
                  {a.previously_used_by_info && assetTypeCategory[a.asset_type] !== 'SOFTWARE' ? (
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-medium">Prev. user:</span>
                      <span className="ml-2">{a.previously_used_by_info.name}</span>
                    </div>
                  ) : null}
                </div>

                {assignments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600">
                    Assigned via {assignments[0]?.employee_info?.name || 'assignment'} on {new Date(assignments[0]?.assigned_at || Date.now()).toLocaleDateString()}
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
