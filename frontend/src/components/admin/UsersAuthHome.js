import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminUserAPI, employeeAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { ClockIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getRoleDisplayName } from '../../utils/roleConfig';
import { useTheme } from '../../context/ThemeContext';

const UsersAuthHome = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmUser, setConfirmUser] = useState(null);
  ;
  // const getUserRoleLabel = (user) => {
  //   if (!user) return 'Employee';
  //   if (user.is_superuser) return 'ADMIN';
  //   const role = user.profile?.role || 'EMPLOYEE';
  //   switch (role) {
  //     case 'HR_MANAGER':
  //       return 'HR Manager';
  //     case 'IT_SUPPORTER':
  //       return 'IT Supporter';
  //     case 'MANAGER':
  //       return 'Manager';
  //     case 'ADMIN':
  //       return 'ADMIN';
  //     default:
  //       return 'Employee';
  //   }
  // };
  const getUserRoleLabel = (user) => {
    if (!user) return '—';
    return user.profile?.role
      ? getRoleDisplayName(user.profile.role)
      : '—';
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Users and Authentication</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage application users, basic permissions and roles.
          </p>
        </div>
        <Link
          to="/users-auth/add"
          className={`inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r ${theme.primaryGradient} text-white text-sm font-bold shadow-lg hover:shadow-indigo-500/20 transition-all transform hover:scale-105 active:scale-95`}
        >
          <span className="mr-2 text-lg">+</span> Add user
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Groups card */}
        <Link
          to="/users-auth/groups"
          className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 bg-white/5 border border-white/10 backdrop-blur-xl hover:border-black/20 dark:border-white/20 hover:bg-black/10 dark:bg-white/10 hover:shadow-2xl hover:-translate-y-1"
        >
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Groups</div>
              <div className="text-lg text-white font-bold mb-2">Manage role-based access</div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Add and edit groups and the permissions they contain.
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
              Open Dashboard <span className="ml-2 transform group-hover:translate-x-1 transition-transform">&rarr;</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
        </Link>

        {/* Permissions card */}
        <Link
          to="/users-auth/permissions"
          className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 bg-white/5 border border-white/10 backdrop-blur-xl hover:border-black/20 dark:border-white/20 hover:bg-black/10 dark:bg-white/10 hover:shadow-2xl hover:-translate-y-1"
        >
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2">Permissions</div>
              <div className="text-lg text-white font-bold mb-2">System permissions</div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Review and edit individual permission definitions.
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-bold text-purple-400 group-hover:text-purple-300 transition-colors">
              Review Permissions <span className="ml-2 transform group-hover:translate-x-1 transition-transform">&rarr;</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors"></div>
        </Link>
      </div>

      {/* User list below groups/permissions */}
      <div className="bg-white/5 rounded-2xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">User Profiles</h2>
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-400 font-medium">Loading...</span>
            </div>
          )}
        </div>
        <div className="max-h-[600px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                  Username
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                  First name
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                  Last name
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                  Role
                </th>
                <th className="px-6 py-4 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className="group hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 text-indigo-400 font-bold truncate max-w-[160px]">
                    {user.username || '—'}
                  </td>
                  <td className="px-6 py-4 text-slate-200 font-medium truncate max-w-[220px]">{user.email}</td>
                  <td className="px-6 py-4 text-slate-400">{user.first_name || '—'}</td>
                  <td className="px-6 py-4 text-slate-400">{user.last_name || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-300 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                      {getUserRoleLabel(user)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user.is_staff ? (
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner border border-emerald-500/20">
                          <CheckIcon className="h-4 w-4" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-slate-400/10 flex items-center justify-center text-slate-400 border border-white/5">
                          <XMarkIcon className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => openConfirm(user, e)}
                      disabled={deletingId === user.id}
                      className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold border border-white/10 bg-white/5 text-slate-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 disabled:opacity-50 transform hover:scale-105"
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
                    className="px-6 py-12 text-sm text-slate-400 text-center font-medium italic"
                  >
                    No users found in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#070B14]/80 backdrop-blur-sm" onClick={closeConfirm}></div>
          <div className="relative bg-[#0B1120] rounded-2xl shadow-2xl w-full max-w-sm border border-white/10 overflow-hidden transform animate-in fade-in zoom-in duration-300">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/5">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Delete user</h3>
              <button onClick={closeConfirm} className="text-slate-400 hover:text-white transition-colors">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-8 text-sm text-slate-200 leading-relaxed">
              Are you sure you want to delete
              <span className="font-black text-white mx-1"> {confirmUser?.username || confirmUser?.email}</span>?
              <p className="mt-2 text-red-400 font-bold">This action cannot be undone.</p>
            </div>
            <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 text-xs font-bold rounded-xl border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                onClick={closeConfirm}
                disabled={!!deletingId}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-2 text-xs font-black rounded-xl bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-900/20 transition-all disabled:opacity-60 transform hover:scale-105 active:scale-95"
                onClick={() => handleDelete(confirmUser)}
                disabled={!!deletingId}
              >
                {deletingId ? 'Deleting…' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAuthHome;
