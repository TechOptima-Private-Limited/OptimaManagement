import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { adminUserAPI } from '../../services/api';
import { isAdmin } from '../../utils/auth';
import { toast } from 'react-toastify';

const UsersAuthManagement = () => {
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

  const loadLookups = async () => {};

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
              role: selectedUser.profile.role || 'EMPLOYEE',
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
          <h1 className="text-2xl font-bold text-gray-900">Users and Authentication</h1>
          <p className="text-sm text-gray-500">
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
          className="flex flex-col items-stretch text-left bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
        >
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Groups</span>
            <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full border border-indigo-200 text-indigo-600 bg-indigo-50">
              Auth
            </span>
          </div>
          <div className="px-4 pb-3 flex items-center space-x-2 text-xs">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-indigo-200 text-indigo-600 bg-white">
              Add
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-gray-200 text-gray-600 bg-white">
              Admin
            </span>
          </div>
        </button>

        {/* Permissions card */}
        <button
          type="button"
          onClick={() => window.location.assign('/users-auth/permissions')}
          className="flex flex-col items-stretch text-left bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
        >
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Permissions</span>
            <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full border border-indigo-200 text-indigo-600 bg-indigo-50">
              Auth
            </span>
          </div>
          <div className="px-4 pb-3 flex items-center space-x-2 text-xs">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-indigo-200 text-indigo-600 bg-white">
              Add
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-gray-200 text-gray-600 bg-white">
              Admin
            </span>
          </div>
        </button>

      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Confirm changes</h3>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm text-gray-700">
              <p className="text-xs text-gray-500">
                You are about to save the following changes for this user:
              </p>
              <ul className="list-disc list-inside text-sm">
                {pendingChanges.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
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
                className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                onClick={handleConfirmSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Confirm and save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User list (hidden in single user mode) */}
        {!singleUserMode && (
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">User Profiles</h2>
              {loading && <span className="text-xs text-gray-400">Loading...</span>}
            </div>
            <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
              {users.map((user) => {
                const isActive = selectedUserId === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user.id)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 focus:outline-none ${
                      isActive ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      <div className="text-xs text-gray-500">
                        {user.first_name || user.last_name
                          ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                          : 'No name set'}
                      </div>
                    </div>
                  </button>
                );
              })}
              {!loading && users.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500 text-center">No users found.</div>
              )}
            </div>
          </div>
        )}

        {/* User details */}
        <div
          className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${
            singleUserMode ? 'lg:col-span-3' : 'lg:col-span-2'
          }`}
        >
          {selectedUser ? (
            <div className="divide-y divide-gray-200">
              {/* Account section */}
              <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">Account</h2>
                  <p className="text-xs text-gray-500">Username and password-based access.</p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 rounded-md border border-indigo-600 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Set password
                </button>
              </div>
              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                    value={selectedUser.username || ''}
                    onChange={(e) => handleFieldChange('username', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                    value={selectedUser.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                  />
                </div>
              </div>

              {/* Personal info */}
              <div className="px-6 py-3 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">Personal info</h3>
              </div>
              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                    value={selectedUser.first_name || ''}
                    onChange={(e) => handleFieldChange('first_name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                    value={selectedUser.last_name || ''}
                    onChange={(e) => handleFieldChange('last_name', e.target.value)}
                  />
                </div>
              </div>

              {/* Permissions */}
              <div className="px-6 py-3 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">Permissions</h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <label className="inline-flex items-center text-xs text-gray-700">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                      checked={!!selectedUser.is_active}
                      onChange={() => handleToggle('is_active')}
                    />
                    Active
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Designates whether this user should be treated as active.
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="inline-flex items-center text-xs text-gray-700">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                      checked={!!selectedUser.is_staff}
                      onChange={() => handleToggle('is_staff')}
                    />
                    Staff status
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Allows user to access admin areas.
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="inline-flex items-center text-xs text-gray-700">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                      checked={!!selectedUser.is_superuser}
                      onChange={() => handleToggle('is_superuser')}
                    />
                    Superuser status
                  </label>
                  <span className="text-[11px] text-gray-400">
                    User has all permissions without assigning them explicitly.
                  </span>
                </div>

                {/* Role selector */}
                <div className="flex items-center space-x-3">
                  <label className="text-xs text-gray-700 min-w-[60px]">Role</label>
                  <select
                    className="px-2 py-1.5 rounded-md border border-gray-300 text-sm bg-white"
                    value={selectedUser?.profile?.role || 'EMPLOYEE'}
                    onChange={async (e) => {
                      const newRole = e.target.value;
                      // Update local state for role immediately
                      handleProfileFieldChange('role', newRole);
                      // Live preview: refresh access lists for the selected role without persisting yet
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
                    <option value="EMPLOYEE">Employee</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="IT_SUPPORTER">IT Supporter</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                      value={selectedUser.profile?.phone_number || ''}
                      onChange={(e) => handleProfileFieldChange('phone_number', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                      rows={2}
                      value={selectedUser.profile?.address || ''}
                      onChange={(e) => handleProfileFieldChange('address', e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Date of birth</label>
                      <input
                        type="date"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                        value={selectedUser.profile?.date_of_birth || ''}
                        onChange={(e) => handleProfileFieldChange('date_of_birth', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Emergency contact</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                        value={selectedUser.profile?.emergency_contact || ''}
                        onChange={(e) => handleProfileFieldChange('emergency_contact', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Access (role-based + extras) */}
              <div className="px-6 py-3 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">Access</h3>
                <p className="text-[11px] text-gray-500 mt-1">
                  Role baseline: <span className="font-medium">{roleAccess?.role || '—'}</span>. You can add extra permissions; baseline permissions cannot be removed here.
                </p>
              </div>
              <div className="px-6 py-4 space-y-4">
                {!roleAccess && (
                  <div className="text-xs text-gray-500">No access data available.</div>
                )}
                {roleAccess && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                    {/* Granted (baseline + extras) */}
                    <div className="border border-gray-200 rounded-md bg-gray-50 overflow-hidden">
                      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between bg-gray-100">
                        <span className="font-semibold text-gray-800">Granted permissions</span>
                        <span className="text-[10px] text-gray-500">
                          {computedGranted.length}
                        </span>
                      </div>
                      <div className="px-3 py-2 border-b border-gray-100">
                        <input
                          type="text"
                          placeholder="Filter"
                          className="block w-full rounded-md border-gray-300 shadow-sm text-[11px]"
                          value={accessFilterGranted}
                          onChange={(e) => setAccessFilterGranted(e.target.value)}
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto bg-white">
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
                                className="px-3 py-1.5 hover:bg-gray-50 flex items-center justify-between"
                              >
                                <div className="min-w-0">
                                  <div className="font-medium text-gray-800 truncate">{p.content_type} | {p.name}</div>
                                  <div className="text-[10px] text-gray-500 truncate">{p.codename}</div>
                                </div>
                                <div className="ml-2 flex items-center space-x-2">
                                  {isBaseline && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] border border-gray-300 text-gray-600 bg-gray-50">Role</span>
                                  )}
                                  {isExtra && (
                                    <button
                                      type="button"
                                      className="px-2 py-0.5 rounded-md border border-red-300 text-red-600 hover:bg-red-50"
                                      onClick={() => handleAccessRemove(p.id)}
                                      disabled={isBaseline}
                                      title={isBaseline ? 'From role, cannot remove' : 'Remove extra permission'}
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        {computedGranted.length === 0 && (
                          <div className="px-3 py-2 text-gray-400">No permissions granted.</div>
                        )}
                      </div>
                    </div>

                    {/* Available (not baseline and not extra) */}
                    <div className="border border-gray-200 rounded-md bg-gray-50 overflow-hidden">
                      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between bg-teal-700 text-white">
                        <span className="font-semibold">Available to grant</span>
                        <span className="text-[10px] opacity-90">{computedAvailable.length}</span>
                      </div>
                      <div className="px-3 py-2 border-b border-gray-100 bg-white">
                        <input
                          type="text"
                          placeholder="Filter"
                          className="block w-full rounded-md border-gray-300 shadow-sm text-[11px]"
                          value={accessFilterAvailable}
                          onChange={(e) => setAccessFilterAvailable(e.target.value)}
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto bg-white">
                        {computedAvailable
                          .filter((p) =>
                            (p.name || '').toLowerCase().includes(accessFilterAvailable.toLowerCase()) ||
                            (p.codename || '').toLowerCase().includes(accessFilterAvailable.toLowerCase()) ||
                            (p.content_type || '').toLowerCase().includes(accessFilterAvailable.toLowerCase())
                          )
                          .map((p) => (
                            <div
                              key={p.id}
                              className="px-3 py-1.5 hover:bg-gray-50 flex items-center justify-between"
                            >
                              <div className="min-w-0">
                                <div className="font-medium text-gray-800 truncate">{p.content_type} | {p.name}</div>
                                <div className="text-[10px] text-gray-500 truncate">{p.codename}</div>
                              </div>
                              <button
                                type="button"
                                className="ml-2 px-2 py-0.5 rounded-md border border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                                onClick={() => handleAccessAdd(p.id)}
                              >
                                Add
                              </button>
                            </div>
                          ))}
                        {computedAvailable.length === 0 && (
                          <div className="px-3 py-2 text-gray-400">No permissions available to add.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Important dates */}
              <div className="px-6 py-3 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">Important dates</h3>
              </div>
              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs font-medium text-gray-700">Last login</div>
                  <div className="mt-1 text-gray-600 text-xs">
                    {selectedUser.last_login || 'Never'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-700">Date joined</div>
                  <div className="mt-1 text-gray-600 text-xs">
                    {selectedUser.date_joined || '—'}
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              Select a user from the list to view and edit details.
            </div>
          )}
        </div>
      </div>

      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Set password for {selectedUser.email}</h2>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New password</label>
                <input
                  type="password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                  value={passwordForm.password}
                  onChange={(e) => handlePasswordChange('password', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password confirmation</label>
                <input
                  type="password"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
                  value={passwordForm.password_confirm}
                  onChange={(e) => handlePasswordChange('password_confirm', e.target.value)}
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Password must contain at least 8 characters and cannot be entirely numeric.
              </p>
            </div>
            <div className="px-6 py-3 border-t border-gray-200 flex justify-end space-x-2 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={passwordSaving}
                onClick={handlePasswordSave}
                className="px-4 py-2 text-sm rounded-md border border-transparent text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
              >
                {passwordSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAuthManagement;
