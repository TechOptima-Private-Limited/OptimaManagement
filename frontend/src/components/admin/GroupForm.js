import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminGroupAPI, adminPermissionAPI } from '../../services/api';
import { toast } from 'react-toastify';

const GroupForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/users-auth/groups')}
            className="text-xs text-indigo-600 hover:text-indigo-800 mb-1"
          >
             Back to groups
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Change group' : 'Add group'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
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
          <label className="block text-xs font-medium text-gray-700 mb-2">Permissions</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Available */}
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="font-semibold text-gray-800">Available permissions</span>
              </div>
              <div className="px-3 py-2 border-b border-gray-100">
                <input
                  type="text"
                  placeholder="Filter"
                  className="block w-full rounded-md border-gray-300 shadow-sm text-xs"
                  value={filterAvailable}
                  onChange={(e) => setFilterAvailable(e.target.value)}
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredAvailable.map((p) => {
                  const label = [p.content_type, p.name].filter(Boolean).join(' | ');
                  return (
                    <label key={p.id} className="flex items-center px-3 py-1 space-x-2 cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        onChange={(e) =>
                          handleMove('available', e.target.checked ? [p.id] : [])
                        }
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
                {!loading && filteredAvailable.length === 0 && (
                  <div className="px-3 py-2 text-gray-400">No permissions</div>
                )}
              </div>
            </div>

            {/* Chosen */}
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-teal-700 text-white border-b border-gray-200 flex items-center justify-between">
                <span className="font-semibold">Chosen permissions</span>
              </div>
              <div className="px-3 py-2 border-b border-gray-100">
                <input
                  type="text"
                  placeholder="Filter"
                  className="block w-full rounded-md border-gray-300 shadow-sm text-xs"
                  value={filterChosen}
                  onChange={(e) => setFilterChosen(e.target.value)}
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredChosen.map((p) => {
                  const label = [p.content_type, p.name].filter(Boolean).join(' | ');
                  return (
                    <label key={p.id} className="flex items-center px-3 py-1 space-x-2 cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        defaultChecked
                        onChange={(e) =>
                          handleMove('chosen', e.target.checked ? [p.id] : [])
                        }
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
                {!loading && filteredChosen.length === 0 && (
                  <div className="px-3 py-2 text-gray-400">No chosen permissions</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => navigate('/users-auth/groups')}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-md border border-transparent text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GroupForm;
