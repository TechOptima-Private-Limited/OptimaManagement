import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGroupAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';
import { UserGroupIcon, ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const GroupsManagement = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmGroup, setConfirmGroup] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadGroups = async (term = '') => {
    try {
      setLoading(true);
      const { data } = await adminGroupAPI.getGroups(term ? { search: term } : undefined);
      setGroups(data || []);
    } catch (error) {
      console.error('Failed to load groups', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadGroups(search.trim());
  };

  const openConfirm = (group, e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    setConfirmGroup(group);
    setShowConfirm(true);
  };

  const closeConfirm = () => {
    if (deletingId) return;
    setShowConfirm(false);
    setConfirmGroup(null);
  };

  const handleDelete = async (group, e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (!group?.id) return;
    try {
      setDeletingId(group.id);
      await adminGroupAPI.deleteGroup(group.id);
      setGroups((prev) => (Array.isArray(prev) ? prev.filter((g) => g.id !== group.id) : prev));
      toast.success('Group deleted');
    } catch (err) {
      console.error('Failed to delete group', err);
      const resp = err?.response?.data;
      const msg = (resp && (resp.detail || resp.message || resp.error)) || 'Failed to delete group';
      toast.error(msg);
    } finally {
      setDeletingId(null);
      setConfirmGroup(null);
      setShowConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070B14] p-8 space-y-8">
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
            <div className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
              <UserGroupIcon className="h-8 w-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">System Groups</h1>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Manage role-based permissions and group memberships.</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/users-auth/groups/add')}
          className={`inline-flex items-center px-6 py-3 rounded-2xl bg-gradient-to-r ${theme.primaryGradient} text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-indigo-500/20 transition-all transform hover:scale-105 active:scale-95`}
        >
          Add new group
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex items-center space-x-4 max-w-xl">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search groups..."
            className="block w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-900 dark:text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="px-8 py-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-black/10 dark:bg-white/10 hover:text-slate-900 dark:text-white transition-all transform active:scale-95"
        >
          SEARCH
        </button>
      </form>

      <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-black/5 dark:border-white/5 shadow-2xl overflow-hidden">
        <div className="px-8 py-4 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GROUP IDENTITY</span>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{loading ? 'SYNCHRONIZING…' : `${groups.length} TOTAL GROUPS`}</span>
        </div>
        <div className="divide-y divide-white/5">
          {groups.map((group) => (
            <div
              key={group.id}
              className="group w-full px-8 py-4 flex items-center justify-between hover:bg-black/5 dark:bg-white/5 transition-all duration-300"
            >
              <button
                type="button"
                onClick={() => navigate(`/users-auth/groups/${group.id}`)}
                className="text-left flex-1"
              >
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{group.name}</div>
              </button>
              <div className="flex items-center space-x-6">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full">{group.permissions_count} permissions</span>
                <button
                  type="button"
                  onClick={(e) => openConfirm(group, e)}
                  className="px-4 py-2 text-[10px] font-black rounded-xl border border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-slate-900 dark:text-white transition-all transform active:scale-95 uppercase tracking-widest"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!loading && groups.length === 0 && (
            <div className="px-8 py-12 text-center text-sm text-slate-500 font-medium italic opacity-50">No security groups located in database.</div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeConfirm}></div>
          <div className="relative bg-[#0B1120] rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-black/5 dark:border-white/5">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">System Deletion</h3>
            </div>
            <div className="px-8 py-8">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Confirm deletion of security group <span className="text-indigo-400 font-bold">{confirmGroup?.name}</span>? This operation is permanent.
              </p>
            </div>
            <div className="px-8 py-6 bg-black/5 dark:bg-white/5 border-t border-black/5 dark:border-white/5 flex justify-end space-x-4">
              <button
                type="button"
                className="px-6 py-2 text-xs font-black rounded-xl border border-black/10 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-black/10 dark:bg-white/10 hover:text-slate-900 dark:text-white transition-all"
                onClick={closeConfirm}
                disabled={!!deletingId}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="px-6 py-2 text-xs font-black rounded-xl bg-red-500 text-slate-900 dark:text-white hover:bg-red-600 disabled:opacity-30 transition-all shadow-lg shadow-red-500/20"
                onClick={(e) => handleDelete(confirmGroup, e)}
                disabled={!!deletingId}
              >
                {deletingId ? 'DELETING…' : 'CONFIRM DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsManagement;
