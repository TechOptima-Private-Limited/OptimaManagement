import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminPermissionAPI } from '../../services/api';
import { toast } from 'react-toastify';

const PermissionsManagement = () => {
  const navigate = useNavigate();
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/users-auth')}
            className="text-xs text-indigo-600 hover:text-indigo-800 mb-1"
          >
             Back to Users and Authentication
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>
          <p className="text-sm text-gray-500">All system permissions.</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex items-center space-x-2 max-w-md">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search permissions"
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
          <span>PERMISSION</span>
          <span>{loading ? 'Loading…' : `${permissions.length} permissions`}</span>
        </div>
        <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
          {permissions.map((p) => {
            const label = [p.content_type, p.name].filter(Boolean).join(' | ');
            return (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/users-auth/permissions/${p.id}`)}
              className="w-full px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-50 text-left"
            >
              <div>
                <div className="text-gray-900">{label}</div>
                <div className="text-[11px] text-gray-500">{p.codename}</div>
              </div>
            </button>
          );})}
          {!loading && permissions.length === 0 && (
            <div className="px-4 py-4 text-sm text-gray-500">No permissions found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionsManagement;
