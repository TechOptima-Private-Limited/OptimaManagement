import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminUserAPI, employeeAPI } from '../../services/api';
import { isAdmin } from '../../utils/auth';
import { toast } from 'react-toastify';

const UsersAuthHome = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmUser, setConfirmUser] = useState(null);
;
  const getUserRoleLabel = (user) => {
    if (!user) return 'Employee';
    if (user.is_superuser) return 'ADMIN';
    const role = user.profile?.role || 'EMPLOYEE';
    switch (role) {
      case 'HR_MANAGER':
        return 'HR Manager';
      case 'IT_SUPPORTER':
        return 'IT Supporter';
      case 'MANAGER':
        return 'Manager';
      case 'ADMIN':
        return 'ADMIN';
      default:
        return 'Employee';
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const { data } = await adminUserAPI.getUsers();
        setUsers(data || []);
      } catch (error) {
        console.error('Failed to load users', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Render page and rely on backend permissions (403) instead of client-side blocking

  const handleUserClick = (userId) => {
    navigate(`/users-auth/users?user=${userId}`);
  };

  const openConfirm = (user, e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    setConfirmUser(user);
    setShowConfirm(true);
  };

  const closeConfirm = () => {
    if (deletingId) return;
    setShowConfirm(false);
    setConfirmUser(null);
  };

  const removeEmployeeIfExists = async (userId) => {
    try {
      const tryFetch = async (params) => {
        const resp = await employeeAPI.getEmployees(params);
        const list = Array.isArray(resp.data) ? resp.data : (Array.isArray(resp.data?.results) ? resp.data.results : []);
        return list;
      };
      let list = await tryFetch({ user: userId });
      if (!Array.isArray(list) || list.length === 0) {
        list = await tryFetch({ user_id: userId });
      }
      if (!Array.isArray(list) || list.length === 0) {
        list = await tryFetch({});
      }
      const emp = Array.isArray(list) ? list.find((e) => e?.user === userId || e?.user?.id === userId) : null;
      if (emp?.id) {
        await employeeAPI.deleteEmployee(emp.id);
        toast.success('Employee record removed');
      }
    } catch (e) {
      console.warn('Could not remove employee record', e);
    }
  };

  const handleDelete = async (user, e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (!user || !user.id) return;
    setShowConfirm(false);
    try {
      setDeletingId(user.id);
      await adminUserAPI.deleteUser(user.id);
      setUsers((prev) => (Array.isArray(prev) ? prev.filter((u) => u.id !== user.id) : prev));
      toast.success('User deleted');
      await removeEmployeeIfExists(user.id);
    } catch (err) {
      console.error('Failed to delete user', err);
      const status = err?.response?.status;
      const resp = err?.response?.data;
      const serverMsg = (resp && (resp.detail || resp.message || resp.error)) || '';
      // Fallback: backend may not allow DELETE; try soft-delete by deactivating the user
      if (status === 405 || /method\s*"?delete"?\s*not allowed/i.test(serverMsg)) {
        try {
          await adminUserAPI.updateUser(user.id, { is_active: false, is_staff: false });
          // Remove from UI list to emulate delete behavior when backend doesn't support DELETE
          setUsers((prev) => (Array.isArray(prev) ? prev.filter((u) => u.id !== user.id) : prev));
          toast.success('User deactivated and removed (delete not supported)');
          await removeEmployeeIfExists(user.id);
          return;
        } catch (deactErr) {
          console.error('Failed to deactivate user as fallback', deactErr);
          const deResp = deactErr?.response?.data;
          const deMsg = (deResp && (deResp.detail || deResp.message || deResp.error)) || 'Failed to deactivate user';
          toast.error(deMsg);
          return;
        }
      }
      const msg = serverMsg || 'Failed to delete user';
      toast.error(msg);
    } finally {
      setDeletingId(null);
      setConfirmUser(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users and Authentication</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage application users, basic permissions and roles.
          </p>
        </div>
        <Link
          to="/users-auth/add"
          className="inline-flex items-center px-3 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium shadow-sm hover:bg-indigo-700"
        >
          + Add user
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Groups card */}
        <Link
          to="/users-auth/groups"
          className="border border-indigo-200 rounded-xl p-4 hover:border-indigo-400 hover:shadow-sm transition bg-white flex flex-col justify-between"
        >
          <div>
            <div className="text-xs font-semibold text-indigo-600 mb-1">Groups</div>
            <div className="text-sm text-gray-800 font-medium">Manage role-based access</div>
            <div className="mt-1 text-[11px] text-gray-500">
              Add and edit groups and the permissions they contain.
            </div>
          </div>
          <div className="mt-3 text-xs font-semibold text-indigo-600">Open &rarr;</div>
        </Link>

        {/* Permissions card */}
        <Link
          to="/users-auth/permissions"
          className="border border-indigo-200 rounded-xl p-4 hover:border-indigo-400 hover:shadow-sm transition bg-white flex flex-col justify-between"
        >
          <div>
            <div className="text-xs font-semibold text-indigo-600 mb-1">Permissions</div>
            <div className="text-sm text-gray-800 font-medium">System permissions</div>
            <div className="mt-1 text-[11px] text-gray-500">
              Review and edit individual permission definitions.
            </div>
          </div>
          <div className="mt-3 text-xs font-semibold text-indigo-600">Open &rarr;</div>
        </Link>
      </div>

      {/* User list below groups/permissions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">User Profiles</h2>
          {loading && <span className="text-xs text-gray-400">Loading...</span>}
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  First name
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Last name
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Staff status
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-2 text-indigo-600 font-medium truncate max-w-[160px]">
                    {user.username || '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-900 truncate max-w-[220px]">{user.email}</td>
                  <td className="px-4 py-2 text-gray-700">{user.first_name || '—'}</td>
                  <td className="px-4 py-2 text-gray-700">{user.last_name || '—'}</td>
                  <td className="px-4 py-2 text-gray-700 text-xs font-medium">{getUserRoleLabel(user)}</td>
                  <td className="px-4 py-2 text-center">
                    {user.is_staff ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                        ✕
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={(e) => openConfirm(user, e)}
                      disabled={deletingId === user.id}
                      className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-sm text-gray-500 text-center"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeConfirm}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Delete user</h3>
            </div>
            <div className="px-6 py-4 text-sm text-gray-700">
              Are you sure you want to delete
              <span className="font-semibold"> {confirmUser?.username || confirmUser?.email}</span>? This action cannot be undone.
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
                onClick={() => handleDelete(confirmUser)}
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

export default UsersAuthHome;
