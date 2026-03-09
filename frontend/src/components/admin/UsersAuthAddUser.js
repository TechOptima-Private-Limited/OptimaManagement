import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, adminUserAPI } from '../../services/api';
import { isAdmin } from '../../utils/auth';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';
import { UserPlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const UsersAuthAddUser = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
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
      toast.error(message || error.message || 'Failed to create user');
    } finally {
      setSaving(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate('/users-auth')}
              className="group flex items-center text-xs font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-all"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
              Back to Users and Authentication
            </button>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                <UserPlusIcon className="h-8 w-8 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Add new user</h1>
                <p className="text-sm text-slate-500 font-medium tracking-tight">
                  Configure core identity and security credentials for a new system user.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                <input
                  type="text"
                  className="block w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                  value={form.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="e.g. jdoe"
                />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter ml-1">
                  Required. 150 chars max. Letters, digits and @/./+/-/_ only.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  className="block w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="jdoe@example.com"
                />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter ml-1">Required. Valid email address only.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                <input
                  type="text"
                  className="block w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                  value={form.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                <input
                  type="text"
                  className="block w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                  value={form.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Password</label>
                <input
                  type="password"
                  className="block w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="••••••••"
                />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter ml-1">
                  Min 8 characters. Must not be entirely numeric.
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Identity</label>
                <input
                  type="password"
                  className="block w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                  value={form.password_confirm}
                  onChange={(e) => handleChange('password_confirm', e.target.value)}
                  placeholder="••••••••"
                />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter ml-1">Repeat the password exactly as above.</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 bg-white/5 border-t border-white/5 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/users-auth')}
              className="px-8 py-3 text-xs font-black rounded-2xl border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all transform active:scale-95"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-10 py-3 text-xs font-black rounded-2xl bg-gradient-to-r ${theme.primaryGradient} text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all disabled:opacity-50 transform hover:scale-105 active:scale-95`}
            >
              {saving ? 'CREATING USER...' : 'SAVE USER PROFILE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsersAuthAddUser;
