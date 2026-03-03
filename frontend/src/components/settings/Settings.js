import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Settings = () => {
  const { theme, themes, themeId, setThemeId } = useTheme();

  const [form, setForm] = useState({ old_password: '', new_password: '', new_password_confirm: '' });
  const [saving, setSaving] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.old_password || !form.new_password || !form.new_password_confirm) {
      toast.error('All fields are required');
      return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword({
        old_password: form.old_password,
        new_password: form.new_password,
        new_password_confirm: form.new_password_confirm,
      });
      toast.success('Password changed successfully');
      setForm({ old_password: '', new_password: '', new_password_confirm: '' });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to change password';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your personal preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">Theme</h2>
            <p className="text-xs text-gray-500">Choose your application color theme.</p>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-6 gap-3">
              {Object.values(themes).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setThemeId(opt.id)}
                  className={`h-9 w-9 rounded-full border-2 bg-gradient-to-r ${opt.navbarGradient} ${themeId === opt.id ? 'border-gray-900' : 'border-gray-200'}`}
                  aria-label={opt.name}
                  title={opt.name}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">Account</h2>
            <p className="text-xs text-gray-500">View and edit your profile details.</p>
          </div>
          <div className="px-6 py-5 text-sm text-gray-700">
            <p>You can update your personal information in Your Profile page.</p>
            <a href="/profile" className="inline-block mt-3 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs hover:bg-indigo-700">Go to Profile</a>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">Change Password</h2>
            <p className="text-xs text-gray-500">Update your account password.</p>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Current password</label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  value={form.old_password}
                  onChange={(e) => handleChange('old_password', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOld((s) => !s)}
                  className="absolute inset-y-0 right-2 my-auto h-5 w-5 text-gray-500 hover:text-gray-700"
                  aria-label={showOld ? 'Hide password' : 'Show password'}
                >
                  {showOld ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={form.new_password}
                    onChange={(e) => handleChange('new_password', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((s) => !s)}
                    className="absolute inset-y-0 right-2 my-auto h-5 w-5 text-gray-500 hover:text-gray-700"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirm new password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.new_password_confirm}
                    onChange={(e) => handleChange('new_password_confirm', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute inset-y-0 right-2 my-auto h-5 w-5 text-gray-500 hover:text-gray-700"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <button type="submit" disabled={saving} className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs hover:bg-indigo-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
