import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminPermissionAPI } from '../../services/api';
import { toast } from 'react-toastify';

const PermissionDetail = () => {
  const navigate = useNavigate();
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
      <div className="px-4 py-6 text-sm text-gray-500">Loading permission…</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/users-auth/permissions')}
            className="text-xs text-indigo-600 hover:text-indigo-800 mb-1"
          >
             Back to permissions
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Change permission</h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Codename</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 shadow-sm text-sm"
            value={permission.codename}
            disabled
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Content type</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 shadow-sm text-sm"
            value={permission.content_type}
            disabled
          />
        </div>

        <div className="pt-4 border-t border-gray-200 flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => navigate('/users-auth/permissions')}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-md border border-transparent text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PermissionDetail;
