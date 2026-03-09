import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
  EyeIcon,
  EyeSlashIcon,
  UserCircleIcon,
  KeyIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const Settings = () => {
  const { theme } = useTheme();

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

  const inputClass =
    'block w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 shadow-inner px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 pr-10';

  return (
    <div className="min-h-[80vh] space-y-8">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a0f1e] via-indigo-950/60 to-[#070B14] border border-white/10 px-8 py-8 shadow-2xl">
        <div className="absolute top-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full -translate-x-24 -translate-y-24 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full translate-x-32 translate-y-32 pointer-events-none" />
        <div className="relative flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 shadow-lg">
            <Cog6ToothIcon className="h-7 w-7 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-sm text-gray-400 mt-1">Manage your personal preferences and security.</p>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Account Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
              <UserCircleIcon className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Account</h2>
              <p className="text-xs text-gray-400">View and edit your profile details.</p>
            </div>
          </div>
          <div className="px-6 py-6 text-sm text-gray-300">
            <p className="leading-relaxed">
              You can update your personal information, profile picture, and contact details on the Profile page.
            </p>
            <a
              href="/profile"
              className="inline-flex items-center mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 text-white text-xs font-medium hover:opacity-90 hover:shadow-lg hover:shadow-indigo-500/25 transform hover:scale-105 transition-all duration-200"
            >
              <UserCircleIcon className="h-4 w-4 mr-2" />
              Go to Profile
            </a>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-violet-500/20 border border-violet-500/30">
              <KeyIcon className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Change Password</h2>
              <p className="text-xs text-gray-400">Update your account password.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4 text-sm">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Current password</label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  value={form.old_password}
                  onChange={(e) => handleChange('old_password', e.target.value)}
                  placeholder="Enter current password"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowOld((s) => !s)}
                  className="absolute inset-y-0 right-3 my-auto h-5 w-5 text-gray-400 hover:text-indigo-400 transition-colors duration-200"
                  aria-label={showOld ? 'Hide password' : 'Show password'}
                >
                  {showOld ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* New / Confirm */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">New password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={form.new_password}
                    onChange={(e) => handleChange('new_password', e.target.value)}
                    placeholder="New password"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((s) => !s)}
                    className="absolute inset-y-0 right-3 my-auto h-5 w-5 text-gray-400 hover:text-indigo-400 transition-colors duration-200"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Confirm new password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.new_password_confirm}
                    onChange={(e) => handleChange('new_password_confirm', e.target.value)}
                    placeholder="Confirm password"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute inset-y-0 right-3 my-auto h-5 w-5 text-gray-400 hover:text-indigo-400 transition-colors duration-200"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Security hint */}
            <div className="flex items-start space-x-2 p-3 rounded-xl bg-white/5 border border-white/10">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400">
                Use at least 8 characters with a mix of letters, numbers, and symbols for a strong password.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={saving}
                className={`inline-flex items-center px-5 py-2.5 rounded-xl bg-gradient-to-r ${theme.primaryGradient} text-white text-sm font-medium hover:opacity-90 hover:shadow-lg hover:shadow-indigo-500/25 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              >
                <KeyIcon className="h-4 w-4 mr-2" />
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
