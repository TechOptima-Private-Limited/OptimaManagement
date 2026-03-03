import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGroupAPI } from '../../services/api';
import { toast } from 'react-toastify';

const GroupsManagement = () => {
  const navigate = useNavigate();
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-sm text-gray-500">Select group to change.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/users-auth/groups/add')}
          className="inline-flex items-center px-3 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium shadow-sm hover:bg-indigo-700"
        >
          Add group
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex items-center space-x-2 max-w-md">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search groups"
            className="block w-full rounded-md border-gray-300 shadow-sm pl-3 pr-10 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="px-3 py-2 rounded-md border border-gray-300 text-sm bg-white text-gray-700 hover:bg-gray-50"
        >
          Search
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>GROUP</span>
          <span>{loading ? 'Loading…' : `${groups.length} groups`}</span>
        </div>
        <div className="divide-y divide-gray-100">
          {groups.map((group) => (
            <div
              key={group.id}
              className="w-full px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
            >
              <button
                type="button"
                onClick={() => navigate(`/users-auth/groups/${group.id}`)}
                className="text-left flex-1"
              >
                <span className="text-gray-800">{group.name}</span>
              </button>
              <div className="flex items-center space-x-3">
                <span className="text-[11px] text-gray-400">{group.permissions_count} permissions</span>
                <button
                  type="button"
                  onClick={(e) => openConfirm(group, e)}
                  className="px-2 py-1 text-[11px] rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!loading && groups.length === 0 && (
            <div className="px-4 py-4 text-sm text-gray-500">No groups found.</div>
          )}
        </div>
      </div>
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeConfirm}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Delete group</h3>
            </div>
            <div className="px-6 py-4 text-sm text-gray-700">
              Are you sure you want to delete
              <span className="font-semibold"> {confirmGroup?.name}</span>? This action cannot be undone.
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={closeConfirm}
                disabled={!!deletingId}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                onClick={(e) => handleDelete(confirmGroup, e)}
                disabled={!!deletingId}
              >
                {deletingId ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsManagement;
