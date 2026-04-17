import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { adminUserAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { CheckIcon, XMarkIcon, KeyIcon, UserIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { getAllRoleOptions } from '../../utils/roleOptions';
import { getRoleDisplayName } from '../../utils/roleConfig';
import { useTheme } from '../../context/ThemeContext';

const UsersAuthManagement = () => {
  const { theme } = useTheme();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [originalUser, setOriginalUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: '', password_confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [activeSection, setActiveSection] = useState('USERS'); // GROUPS | PERMISSIONS | USERS
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);
  // Role-based access state
  const [roleAccess, setRoleAccess] = useState(null);
  const [extraPermissionIds, setExtraPermissionIds] = useState([]);
  const [originalExtraPermissionIds, setOriginalExtraPermissionIds] = useState([]);
  const [accessFilterAvailable, setAccessFilterAvailable] = useState('');
  const [accessFilterGranted, setAccessFilterGranted] = useState('');
  const roleOptions = getAllRoleOptions();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data } = await adminUserAPI.getUsers();
      setUsers(data || []);
      // Only auto-select the first user when no specific user is requested via URL
      const params = new URLSearchParams(location.search);
      const targetUserId = params.get('user');
      if (!targetUserId && !selectedUserId && data && data.length > 0) {
        handleSelectUser(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load users', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => { };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordSave = async () => {
    if (!selectedUser) return;
    if (!passwordForm.password || !passwordForm.password_confirm) {
      toast.error('Both password fields are required');
      return;
    }
    setPasswordSaving(true);
    try {
      await adminUserAPI.setPassword(selectedUser.id, passwordForm);
      toast.success('Password updated successfully');
      setShowPasswordModal(false);
      setPasswordForm({ password: '', password_confirm: '' });
    } catch (error) {
      console.error('Failed to update password', error);
      const resp = error.response?.data;
      const message =
        typeof resp === 'object' && resp?.detail
          ? resp.detail
          : 'Failed to update password';
      toast.error(message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSelectUser = async (userId) => {
    setSelectedUserId(userId);
    try {
      const { data } = await adminUserAPI.getUser(userId);
      const normalized = {
        ...data,
        groups: Array.isArray(data.groups) ? data.groups : [],
        user_permissions: Array.isArray(data.user_permissions) ? data.user_permissions : [],
      };
      setSelectedUser(normalized);
      setOriginalUser(normalized);
      // Load role-based access snapshot
      try {
        const { data: access } = await adminUserAPI.getUserRoleAccess(userId);
        setRoleAccess(access);
        setExtraPermissionIds(Array.isArray(access.extra_permission_ids) ? access.extra_permission_ids : []);
        setOriginalExtraPermissionIds(Array.isArray(access.extra_permission_ids) ? access.extra_permission_ids : []);
      } catch (e) {
        console.error('Failed to load role access', e);
        setRoleAccess(null);
        setExtraPermissionIds([]);
        setOriginalExtraPermissionIds([]);
      }
    } catch (error) {
      console.error('Failed to load user details', error);
      toast.error('Failed to load user details');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetUserId = params.get('user');

    if (targetUserId) {
      handleSelectUser(targetUserId);
    }

    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Render page and rely on backend permissions (403) instead of client-side blocking

  const params = new URLSearchParams(location.search);
  const singleUserMode = !!params.get('user');

  const handleFieldChange = (field, value) => {
    setSelectedUser((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGroupMove = (source, ids) => {
    if (!selectedUser || !ids || !ids.length) return;
    const current = Array.isArray(selectedUser.groups) ? selectedUser.groups : [];
    let next;
    if (source === 'available') {
      next = Array.from(new Set([...current, ...ids]));
    } else {
      next = current.filter((id) => !ids.includes(id));
    }
    setSelectedUser((prev) => ({
      ...prev,
      groups: next,
    }));
  };

  const handleUserPermMove = (source, ids) => {
    if (!selectedUser || !ids || !ids.length) return;
    const current = Array.isArray(selectedUser.user_permissions) ? selectedUser.user_permissions : [];
    let next;
    if (source === 'available') {
      next = Array.from(new Set([...current, ...ids]));
    } else {
      next = current.filter((id) => !ids.includes(id));
    }
    setSelectedUser((prev) => ({
      ...prev,
      user_permissions: next,
    }));
  };

  const handleProfileFieldChange = (field, value) => {
    setSelectedUser((prev) => ({
      ...prev,
      profile: {
        ...(prev?.profile || {}),
        [field]: value,
      },
    }));
  };

  const handleToggle = (field) => {
    setSelectedUser((prev) => ({
      ...prev,
      [field]: !prev?.[field],
    }));
  };

  const computeChanges = (prev, curr) => {
    const changes = [];
    if (!prev || !curr) return changes;

    const simpleFields = [
      ['username', 'Username'],
      ['email', 'Email'],
      ['first_name', 'First name'],
      ['last_name', 'Last name'],
    ];
    simpleFields.forEach(([key, label]) => {
      if ((prev?.[key] || '') !== (curr?.[key] || '')) {
        changes.push(label);
      }
    });

    if (!!prev?.is_active !== !!curr?.is_active) changes.push('Active status');
    if (!!prev?.is_staff !== !!curr?.is_staff) changes.push('Staff status');
    if (!!prev?.is_superuser !== !!curr?.is_superuser) changes.push('Superuser status');

    const prevProfile = prev.profile || {};
    const currProfile = curr.profile || {};
    const profileFields = [
      ['role', 'Role'],
      ['phone_number', 'Phone'],
      ['address', 'Address'],
      ['date_of_birth', 'Date of birth'],
      ['emergency_contact', 'Emergency contact'],
    ];
    profileFields.forEach(([key, label]) => {
      if ((prevProfile?.[key] || '') !== (currProfile?.[key] || '')) {
        changes.push(label);
      }
    });

    // Track extra permissions changes (role baseline is fixed)
    if (originalExtraPermissionIds && extraPermissionIds) {
      const a = [...originalExtraPermissionIds].sort().join(',');
      const b = [...extraPermissionIds].sort().join(',');
      if (a !== b) changes.push('Extra permissions');
    }

    return changes;
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    const changes = computeChanges(originalUser, selectedUser);
    if (!changes.length) {
      toast.info('No changes to save');
      return;
    }

    setPendingChanges(changes);
    setShowConfirmModal(true);
  };

  const handleCancel = () => {
    if (!originalUser) return;
    // Revert all edits back to the last loaded/saved state
    setSelectedUser(originalUser);
    setShowConfirmModal(false);
    setPendingChanges([]);
  };

  const handleConfirmSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      // Save extra permissions first so the snapshot is current
      if (selectedUserId) {
        const { data: updatedAccess } = await adminUserAPI.setUserExtraPermissions(
          selectedUserId,
          extraPermissionIds
        );
        setRoleAccess(updatedAccess);
        setOriginalExtraPermissionIds(
          Array.isArray(updatedAccess.extra_permission_ids) ? updatedAccess.extra_permission_ids : []
        );
      }
      const payload = {
        username: selectedUser.username,
        email: selectedUser.email,
        first_name: selectedUser.first_name,
        last_name: selectedUser.last_name,
        is_active: selectedUser.is_active,
        is_staff: selectedUser.is_staff,
        is_superuser: selectedUser.is_superuser,
        profile: selectedUser.profile
          ? {
            phone_number: selectedUser.profile.phone_number || '',
            address: selectedUser.profile.address || '',
            date_of_birth: selectedUser.profile.date_of_birth || null,
            emergency_contact: selectedUser.profile.emergency_contact || '',
            role: selectedUser.profile.role,
          }
          : undefined,
      };
      const { data } = await adminUserAPI.updateUser(selectedUser.id, payload);

      setSelectedUser(data);
      // Re-fetch role access AFTER role changes are saved so baseline updates
      try {
        const { data: accessAfter } = await adminUserAPI.getUserRoleAccess(selectedUser.id);
        setRoleAccess(accessAfter);
        setExtraPermissionIds(Array.isArray(accessAfter.extra_permission_ids) ? accessAfter.extra_permission_ids : []);
        setOriginalExtraPermissionIds(Array.isArray(accessAfter.extra_permission_ids) ? accessAfter.extra_permission_ids : []);
      } catch (e) {
        console.error('Failed to refresh role access after save', e);
      }
      setOriginalUser({
        ...data,
        groups: Array.isArray(data.groups) ? data.groups : [],
        user_permissions: Array.isArray(data.user_permissions) ? data.user_permissions : [],
      });
      toast.success(`Changes saved: ${pendingChanges.join(', ')}`);
      setShowConfirmModal(false);
      setPendingChanges([]);
      loadUsers();
    } catch (error) {
      console.error('Failed to update user', error);
      const resp = error.response?.data;
      const fieldErrors =
        resp && typeof resp === 'object'
          ? Object.entries(resp)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' | ')
          : null;
      toast.error(fieldErrors || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  // Helpers for rendering and editing access
  const baselineIds = roleAccess?.baseline_permission_ids || [];
  const allPerms = React.useMemo(() => {
    const a = roleAccess?.granted_permissions || [];
    const b = roleAccess?.not_granted_permissions || [];
    const map = new Map();
    [...a, ...b].forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [roleAccess]);

  const computedGranted = allPerms.filter(
    (p) => baselineIds.includes(p.id) || extraPermissionIds.includes(p.id)
  );
  const computedAvailable = allPerms.filter(
    (p) => !baselineIds.includes(p.id) && !extraPermissionIds.includes(p.id)
  );

  const handleAccessAdd = (id) => {
    if (!extraPermissionIds.includes(id)) {
      setExtraPermissionIds((prev) => [...prev, id]);
    }
  };
  const handleAccessRemove = (id) => {
    if (baselineIds.includes(id)) return; // cannot remove baseline
    setExtraPermissionIds((prev) => prev.filter((x) => x !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Users and Authentication</h1>
          <p className="text-sm text-slate-400">
            Manage application users, basic permissions and roles.
          </p>
        </div>
      </div>

      {/* Authentication and Authorization cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Groups card */}
        <button
          type="button"
          onClick={() => window.location.assign('/users-auth/groups')}
          className="group relative flex flex-col items-stretch text-left bg-white/5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl hover:border-black/20 dark:border-white/20 hover:bg-black/10 dark:bg-white/5/10 transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-bold text-white uppercase tracking-widest">Groups</span>
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-black rounded-full border border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
              Auth System
            </span>
          </div>
          <div className="px-6 pb-4 flex items-center space-x-2 text-xs">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-indigo-500/20 text-indigo-400 bg-indigo-500/5 font-bold uppercase tracking-tighter">
              Admin Access
            </span>
            <div className="ml-auto text-indigo-400 group-hover:translate-x-1 transition-transform">
              &rarr;
            </div>
          </div>
        </button>

        {/* Permissions card */}
        <button
          type="button"
          onClick={() => window.location.assign('/users-auth/permissions')}
          className="group relative flex flex-col items-stretch text-left bg-white/5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl hover:border-black/20 dark:border-white/20 hover:bg-black/10 dark:bg-white/5/10 transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-bold text-white uppercase tracking-widest">Permissions</span>
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-black rounded-full border border-purple-500/30 text-purple-400 bg-purple-500/10">
              Security
            </span>
          </div>
          <div className="px-6 pb-4 flex items-center space-x-2 text-xs">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-purple-500/20 text-purple-400 bg-purple-500/5 font-bold uppercase tracking-tighter">
              Policy Editor
            </span>
            <div className="ml-auto text-purple-400 group-hover:translate-x-1 transition-transform">
              &rarr;
            </div>
          </div>
        </button>
      </div>

      {
        showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#070B14]/80 backdrop-blur-sm" onClick={() => { setShowConfirmModal(false); setPendingChanges([]); }}></div>
            <div className="relative bg-[#0B1120] rounded-2xl shadow-2xl max-w-md w-full border border-white/10 overflow-hidden transform animate-in fade-in zoom-in duration-300">
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Confirm changes</h3>
                <button onClick={() => { setShowConfirmModal(false); setPendingChanges([]); }} className="text-slate-400 hover:text-white transition-colors">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 py-6 space-y-4">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  You are about to save the following changes:
                </p>
                <ul className="space-y-2">
                  {pendingChanges.map((c) => (
                    <li key={c} className="flex items-center text-sm text-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3"></span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-white/10 text-slate-400 hover:bg-black/10 dark:bg-white/5/10 hover:text-white transition-all"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingChanges([]);
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`px-6 py-2 text-xs font-black rounded-xl bg-gradient-to-r ${theme.primaryGradient} text-white shadow-lg transition-all disabled:opacity-60 transform hover:scale-105 active:scale-95`}
                  onClick={handleConfirmSave}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Confirm and save'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
        {/* User list (hidden in single user mode) */}
        {!singleUserMode && (
          <div className="lg:col-span-1 bg-white/5 rounded-2xl shadow-2xl border border-white/10 overflow-hidden backdrop-blur-xl">
            <div className="px-6 py-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-200 uppercase tracking-widest">User Profiles</h2>
              {loading && <span className="text-[10px] text-indigo-400 animate-pulse font-black uppercase">Loading...</span>}
            </div>
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10">
              {users.map((user) => {
                const isActive = selectedUserId === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user.id)}
                    className={`w-full text-left px-6 py-5 flex items-center justify-between hover:bg-white/5 focus:outline-none transition-all duration-300 ${isActive ? 'bg-indigo-500/10 border-l-4 border-indigo-500' : ''
                      }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                        {user.email}
                      </div>
                      <div className="text-[10px] text-slate-400 font-black uppercase truncate mt-1 tracking-wider">
                        {user.username || '—'}
                      </div>
                      <div className={`text-[10px] font-black uppercase tracking-widest mt-2 ${isActive ? 'text-indigo-400' : 'text-indigo-500/70'}`}>
                        {user.profile?.role ? getRoleDisplayName(user.profile.role) : 'Standard User'}
                      </div>
                    </div>
                    {isActive && (
                      <div className="ml-4 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]"></div>
                    )}
                  </button>
                );
              })}
              {!loading && users.length === 0 && (
                <div className="px-6 py-12 text-xs text-slate-500 text-center font-bold italic tracking-widest uppercase opacity-50">No users found</div>
              )}
            </div>
          </div>
        )}

        {/* User details */}
        <div
          className={`bg-white/5 rounded-2xl shadow-2xl border border-white/10 overflow-hidden backdrop-blur-xl ${singleUserMode ? 'lg:col-span-3' : 'lg:col-span-2'
            }`}
        >
          {selectedUser ? (
            <div className="divide-y divide-white/5">
              {/* Account section */}
              <div className="px-8 py-6 bg-white/5 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Account</h2>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Primary access credentials</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 rounded-xl border border-indigo-500/30 text-[11px] font-black text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white transition-all transform hover:scale-105"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <KeyIcon className="h-3.5 w-3.5 mr-2" />
                  SET PASSWORD
                </button>
              </div>
              <div className="px-8 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Username</label>
                  <input
                    type="text"
                    className="block w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                    value={selectedUser.username || ''}
                    onChange={(e) => handleFieldChange('username', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                  <input
                    type="email"
                    className="block w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                    value={selectedUser.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                  />
                </div>
              </div>

              {/* Personal info */}
              <div className="px-8 py-4 bg-white/5 flex items-center space-x-3 border-y border-white/10">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest">Personal Identification</h3>
              </div>
              <div className="px-8 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">First Name</label>
                  <input
                    type="text"
                    className="block w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                    value={selectedUser.first_name || ''}
                    onChange={(e) => handleFieldChange('first_name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Last Name</label>
                  <input
                    type="text"
                    className="block w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                    value={selectedUser.last_name || ''}
                    onChange={(e) => handleFieldChange('last_name', e.target.value)}
                  />
                </div>
              </div>

              {/* Permissions */}
              <div className="px-8 py-4 bg-white/5 flex items-center space-x-3 border-y border-white/10 font-black uppercase tracking-widest text-xs text-slate-200">
                <ShieldCheckIcon className="h-4 w-4 text-indigo-400" />
                <span>System Permissions</span>
              </div>
              <div className="px-8 py-6 space-y-4">
                {[
                  { id: 'is_active', label: 'Active', desc: 'Designates whether this user should be treated as active.' },
                  { id: 'is_staff', label: 'Staff status', desc: 'Allows user to access admin areas.' },
                  { id: 'is_superuser', label: 'Superuser status', desc: 'User has all permissions without assigning them explicitly.' }
                ].map((item) => (
                  <div key={item.id} className="flex items-start space-x-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 rounded border-white/10 dark:border-white/10 bg-white/5 text-indigo-500 focus:ring-offset-0 focus:ring-indigo-500/50"
                      checked={!!selectedUser[item.id]}
                      onChange={() => handleToggle(item.id)}
                    />
                    <div className="flex-1">
                      <label className="text-xs font-bold text-white uppercase tracking-wider">{item.label}</label>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
                {/* Role selector */}
                <div className="px-8 py-4 bg-white/5 flex items-center space-x-3 border-y border-white/10 font-black uppercase tracking-widest text-xs text-slate-200">
                  <UserIcon className="h-4 w-4 text-indigo-400" />
                  <span>Assign Role</span>
                </div>
                <div className="px-8 py-6">
                  <div className="relative">
                    <select
                      className="appearance-none block w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                      value={selectedUser?.profile?.role || 'INTERN'}
                      onChange={async (e) => {
                        const newRole = e.target.value;
                        handleProfileFieldChange('role', newRole);
                        if (selectedUserId) {
                          try {
                            const { data: preview } = await adminUserAPI.getUserRoleAccess(selectedUserId, newRole);
                            setRoleAccess(preview);
                            setExtraPermissionIds(Array.isArray(preview.extra_permission_ids) ? preview.extra_permission_ids : []);
                            setOriginalExtraPermissionIds(Array.isArray(preview.extra_permission_ids) ? preview.extra_permission_ids : []);
                          } catch (err) {
                            console.error('Failed to preview access for role', newRole, err);
                          }
                        }
                      }}
                    >
                      {Object.entries(
                        roleOptions.reduce((acc, role) => {
                          acc[role.category] = acc[role.category] || [];
                          acc[role.category].push(role);
                          return acc;
                        }, {})
                      ).map(([category, roles]) => (
                        <optgroup key={category} label={category.replace(/_/g, ' ')} className="bg-[#0B1120]">
                          {roles.map(role => (
                            <option key={role.value} value={role.value} className="bg-[#0B1120]">
                              {role.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 px-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone</label>
                    <input
                      type="text"
                      className="block w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                      value={selectedUser.profile?.phone_number || ''}
                      onChange={(e) => handleProfileFieldChange('phone_number', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Address</label>
                    <textarea
                      className="block w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                      rows={2}
                      value={selectedUser.profile?.address || ''}
                      onChange={(e) => handleProfileFieldChange('address', e.target.value)}
                    />
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Date of birth</label>
                      <input
                        type="date"
                        className="block w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner [color-scheme:dark]"
                        value={selectedUser.profile?.date_of_birth || ''}
                        onChange={(e) => handleProfileFieldChange('date_of_birth', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Emergency Contact</label>
                    <input
                      type="text"
                      className="block w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                      value={selectedUser.profile?.emergency_contact || ''}
                      onChange={(e) => handleProfileFieldChange('emergency_contact', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Access (role-based + extras) */}
              <div className="px-8 py-4 bg-white/5 flex items-center space-x-3 border-y border-white/10">
                <ShieldCheckIcon className="h-4 w-4 text-purple-400" />
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest">Access Control</h3>
                <span className="ml-auto text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                  Baseline: <span className="text-indigo-400">{roleAccess?.role || '—'}</span>
                </span>
              </div>
              <div className="px-8 py-8 space-y-6">
                {!roleAccess && (
                  <div className="text-xs text-slate-500 italic py-4 text-center">No access data available.</div>
                )}
                {roleAccess && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Granted (baseline + extras) */}
                    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-inner">
                      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Granted permissions</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400">
                          {computedGranted.length}
                        </span>
                      </div>
                      <div className="px-4 py-2 bg-white/5">
                        <input
                          type="text"
                          placeholder="Filter granted..."
                          className="block w-full bg-transparent border-none focus:ring-0 text-xs text-white placeholder-slate-600 px-0 py-1"
                          value={accessFilterGranted}
                          onChange={(e) => setAccessFilterGranted(e.target.value)}
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 divide-y divide-white/5">
                        {computedGranted
                          .filter((p) =>
                            (p.name || '').toLowerCase().includes(accessFilterGranted.toLowerCase()) ||
                            (p.codename || '').toLowerCase().includes(accessFilterGranted.toLowerCase()) ||
                            (p.content_type || '').toLowerCase().includes(accessFilterGranted.toLowerCase())
                          )
                          .map((p) => {
                            const isBaseline = baselineIds.includes(p.id);
                            const isExtra = extraPermissionIds.includes(p.id);
                            return (
                              <div
                                key={p.id}
                                className="px-4 py-3 hover:bg-white/5 flex items-center justify-between group transition-colors"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="text-[11px] font-bold text-slate-200 truncate">{p.content_type} | {p.name}</div>
                                  <div className="text-[9px] text-slate-400 font-black uppercase tracking-tighter truncate">{p.codename}</div>
                                </div>
                                <div className="flex items-center space-x-2 shrink-0">
                                  {isBaseline && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black border border-white/10 dark:border-white/10 text-slate-400 bg-white/5 uppercase tracking-tighter">Role</span>
                                  )}
                                  {isExtra && (
                                    <button
                                      type="button"
                                      className="px-2 py-0.5 rounded-lg border border-red-500/30 text-[9px] font-black text-red-400 hover:bg-red-500 hover:text-white transition-all transform hover:scale-110"
                                      onClick={() => handleAccessRemove(p.id)}
                                      disabled={isBaseline}
                                    >
                                      REMOVE
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        {computedGranted.length === 0 && (
                          <div className="px-4 py-8 text-[10px] text-slate-600 text-center font-black uppercase tracking-widest italic opacity-50">None granted</div>
                        )}
                      </div>
                    </div>

                    {/* Available (not baseline and not extra) */}
                    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-inner">
                      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-indigo-500/10">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Available to Grant</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-slate-400">
                          {computedAvailable.length}
                        </span>
                      </div>
                      <div className="px-4 py-2 bg-white/5">
                        <input
                          type="text"
                          placeholder="Search available..."
                          className="block w-full bg-transparent border-none focus:ring-0 text-xs text-white placeholder-slate-600 px-0 py-1"
                          value={accessFilterAvailable}
                          onChange={(e) => setAccessFilterAvailable(e.target.value)}
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 divide-y divide-white/5">
                        {computedAvailable
                          .filter((p) =>
                            (p.name || '').toLowerCase().includes(accessFilterAvailable.toLowerCase()) ||
                            (p.codename || '').toLowerCase().includes(accessFilterAvailable.toLowerCase()) ||
                            (p.content_type || '').toLowerCase().includes(accessFilterAvailable.toLowerCase())
                          )
                          .map((p) => (
                            <div
                              key={p.id}
                              className="px-4 py-3 hover:bg-white/5 flex items-center justify-between group transition-colors"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="text-[11px] font-bold text-slate-200 truncate">{p.content_type} | {p.name}</div>
                                <div className="text-[9px] text-slate-400 font-black uppercase tracking-tighter truncate">{p.codename}</div>
                              </div>
                              <button
                                type="button"
                                className="px-2 py-0.5 rounded-lg border border-indigo-500/30 text-[9px] font-black text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all transform hover:scale-110 shadow-lg"
                                onClick={() => handleAccessAdd(p.id)}
                              >
                                ADD
                              </button>
                            </div>
                          ))}
                        {computedAvailable.length === 0 && (
                          <div className="px-4 py-8 text-[10px] text-slate-600 text-center font-black uppercase tracking-widest italic opacity-50">None available</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Important dates */}
              <div className="px-8 py-4 bg-white/5 flex items-center space-x-3 border-y border-white/10">
                <ClockIcon className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest">Audit Timeline</h3>
              </div>
              <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Authentication</div>
                  <div className="text-sm font-bold text-white">
                    {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Created</div>
                  <div className="text-sm font-bold text-white">
                    {selectedUser.date_joined ? new Date(selectedUser.date_joined).toLocaleDateString() : '—'}
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-[#070B14]/50 border-t border-white/10 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-2.5 text-xs font-black rounded-xl border border-white/10 text-slate-400 hover:bg-white/5/10 hover:text-white transition-all disabled:opacity-50"
                >
                  DISCARD CHANGES
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-8 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r ${theme.primaryGradient} text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all disabled:opacity-50 transform hover:scale-105 active:scale-95`}
                >
                  {saving ? 'PROCESSING...' : 'SAVE CONFIGURATION'}
                </button>
              </div>
            </div>
          ) : (
            <div className="px-8 py-20 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-600">
                <UserIcon className="h-8 w-8" />
              </div>
              <div className="max-w-xs">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">No Profile Selected</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">Choose a user from the left panel to begin managing their account and permissions.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#070B14]/80 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}></div>
          <div className="relative bg-[#0B1120] rounded-2xl shadow-2xl w-full max-w-md border border-white/10 overflow-hidden transform animate-in fade-in zoom-in duration-300">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center space-x-3">
                <KeyIcon className="h-5 w-5 text-indigo-400" />
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Update Security</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="px-8 py-8 space-y-6">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
                Setting password for: <span className="text-white">{selectedUser.email}</span>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Password</label>
                <input
                  type="password"
                  className="block w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                  value={passwordForm.password}
                  onChange={(e) => handlePasswordChange('password', e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Confirm Password</label>
                <input
                  type="password"
                  className="block w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                  value={passwordForm.password_confirm}
                  onChange={(e) => handlePasswordChange('password_confirm', e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter flex items-start space-x-2">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span>Min 8 characters, non-numeric requirement applies.</span>
              </p>
            </div>
            <div className="px-8 py-4 bg-white/5 border-t border-white/5 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-white/5 text-slate-400 hover:bg-white/5/10 hover:text-white transition-all"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={passwordSaving}
                onClick={handlePasswordSave}
                className={`px-6 py-2 text-xs font-black rounded-xl bg-gradient-to-r ${theme.primaryGradient} text-white shadow-lg transition-all disabled:opacity-50 transform hover:scale-105 active:scale-95`}
              >
                {passwordSaving ? 'UPDATING...' : 'UPDATE PASSWORD'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAuthManagement;
