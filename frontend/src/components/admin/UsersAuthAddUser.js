import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, adminUserAPI } from '../../services/api';
import { isAdmin } from '../../utils/auth';
import { toast } from 'react-toastify';

const UsersAuthAddUser = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
  });
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current || saving) return; // guard against rapid double-submit
    if (!form.username || !form.email || !form.password || !form.password_confirm) {
      toast.error('Username, email and both passwords are required');
      return;
    }
    if (form.password !== form.password_confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (/^\d+$/.test(form.password)) {
      toast.error('Password cannot be entirely numeric');
      return;
    }
    submittingRef.current = true;
    setSaving(true);
    try {
      // Build payload: trim fields, omit optional empties, include password2 alias
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirm: form.password_confirm,
        password2: form.password_confirm,
      };
      const fn = (form.first_name || '').trim();
      const ln = (form.last_name || '').trim();
      if (fn) payload.first_name = fn;
      if (ln) payload.last_name = ln;
      await authAPI.register(payload);
      toast.success('User created successfully');
      navigate('/users-auth');
    } catch (error) {
      console.error('Failed to create user', error);
      const resp = error.response?.data;
      console.error('Create user error response:', resp);
      let message = null;
      if (Array.isArray(resp)) {
        message = resp.join(' | ');
      } else if (resp && typeof resp === 'object') {
        if (resp.detail || resp.message || resp.error) {
          message = resp.detail || resp.message || resp.error;
        } else {
          message = Object.entries(resp)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' | ');
        }
      } else if (typeof resp === 'string') {
        message = resp;
      }
      if (!message && error.response?.status === 500) {
        message = 'Server error (500). Please check backend logs.';
      }
      if (!message && error.response?.statusText) {
        message = `${error.response.status} ${error.response.statusText}`;
      }
      try {
        const { data } = await adminUserAPI.getUsers();
        const uname = form.username.trim();
        const mail = form.email.trim();
        const list = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
        const exists = list.some(u => u?.username === uname || u?.email === mail);
        if (exists) {
          toast.success('User created successfully');
          navigate('/users-auth');
          return;
        }
      } catch (verifyErr) {
        console.warn('Could not verify user existence after error', verifyErr);
      }
      toast.error(message || error.message || 'Failed to create user');
    } finally {
      setSaving(false);
      submittingRef.current = false;
    }
  };

  // Render page and rely on backend permissions (403) instead of client-side blocking

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/users-auth')}
            className="text-xs text-indigo-600 hover:text-indigo-800 mb-1"
          >
            ← Back to Users and Authentication
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add user</h1>
          <p className="text-sm text-gray-500">
            After you create a user, you can edit more options from the Users and Authentication page.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
            value={form.username}
            onChange={(e) => handleChange('username', e.target.value)}
          />
          <p className="mt-1 text-[11px] text-gray-400">
            Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
          <p className="mt-1 text-[11px] text-gray-400">Required. Enter a valid email address.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">First name</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
              value={form.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Last name</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
              value={form.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Your password must contain at least 8 characters and cannot be entirely numeric.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Password confirmation</label>
            <input
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
              value={form.password_confirm}
              onChange={(e) => handleChange('password_confirm', e.target.value)}
            />
            <p className="mt-1 text-[11px] text-gray-400">Enter the same password as before, for verification.</p>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-200 flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => navigate('/users-auth')}
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

export default UsersAuthAddUser;
