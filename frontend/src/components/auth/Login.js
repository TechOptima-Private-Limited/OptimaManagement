import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, ShieldCheckIcon, SparklesIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) {
      toast.success('Access Granted. Welcome back.');
      if (result.user?.must_change_password) {
        navigate('/force-change-password', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } else {
      toast.error(result.error);
    }
  };

  const inputClass =
    'appearance-none block w-full px-4 py-4 rounded-xl border border-white/5 bg-black/40 text-white placeholder-gray-600 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all duration-300 text-sm font-medium';

  return (
    <div className="min-h-screen flex bg-[#070B14] overflow-hidden relative font-sans selection:bg-indigo-500/30">

      {/* ── Background Architecture ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[5%] w-[40%] h-[40%] bg-violet-700/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[100px]" />

        {/* Abstract Grid */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
      </div>

      {/* ── Left Decorative Section (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-16 relative z-10">
        {/* Navigation / Brand */}
        <div className="flex items-center space-x-4 group cursor-default">
          <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-2xl shadow-indigo-500/40 group-hover:scale-110 transition-transform duration-500">
            <BuildingOfficeIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-white font-black text-2xl tracking-tighter uppercase block leading-none">Optima</span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] block">Management</span>
          </div>
        </div>

        {/* Hero Text */}
        <div className="max-w-xl">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-10">
            <SparklesIcon className="h-4 w-4 text-indigo-400" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Next-Gen Workforce OS</span>
          </div>

          <h2 className="text-7xl font-black text-white leading-[1.05] tracking-tighter mb-8">
            Elevate your <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent italic">
              efficiency.
            </span>
          </h2>

          <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-lg mb-12">
            Experience a seamless, high-performance ecosystem for attendance, biometric sync, and intelligent resource scaling.
          </p>

          {/* Quick Stats / Features */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
            <div>
              <p className="text-3xl font-black text-white leading-none mb-2 tracking-tighter">99.9%</p>
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none">Sync Reliability</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white leading-none mb-2 tracking-tighter">RealTime</p>
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest legacy text-indigo-400">Biometric Delta</p>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="flex items-center space-x-6">
          <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest"> 2026 TechOptima Global</p>
          <div className="h-px flex-1 bg-white/5" />
        </div>
      </div>

      {/* ── Right: Authentication Card ── */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[440px]">

          <div className="bg-slate-900/40 backdrop-blur-[40px] rounded-[3rem] border border-white/10 shadow-[0_35px_80px_-15px_rgba(0,0,0,0.6)] p-10 sm:p-12 relative overflow-hidden">

            {/* Inner Glow */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

            {/* Header */}
            <div className="mb-10 text-center sm:text-left">
              <h1 className="text-4xl font-black text-white tracking-tight mb-2">Systems Online.</h1>
              <p className="text-gray-500 font-medium text-sm">Secure authorization required for access.</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <div>
                <label className="block text-[10px] font-black text-gray-500/80 mb-2 uppercase tracking-[0.2em]">
                  Work Credentials
                </label>
                <div className="relative">
                  <input
                    {...register('email', {
                      required: 'Email identity required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid identity format' }
                    })}
                    type="email"
                    autoComplete="email"
                    className={inputClass}
                    placeholder="Enter system email"
                  />
                  {errors.email && (
                    <p className="mt-2 text-[10px] font-black text-rose-500 uppercase tracking-wider">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-black text-gray-500/80 mb-2 uppercase tracking-[0.2em]">
                  Security Token
                </label>
                <div className="relative">
                  <input
                    {...register('password', { required: 'Password token required' })}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`${inputClass} pr-12`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-4 flex items-center text-gray-600 hover:text-indigo-400 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword
                      ? <EyeSlashIcon className="h-5 w-5" />
                      : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-[10px] font-black text-rose-500 uppercase tracking-wider">{errors.password.message}</p>
                )}
              </div>

              {/* Auth Meta */}
              <div className="flex items-center justify-between pb-4">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="peer h-5 w-5 bg-white/5 border-white/10 rounded-lg text-indigo-600 focus:ring-indigo-500/30 transition-all cursor-pointer"
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-500 group-hover:text-gray-400 transition-colors uppercase tracking-widest">Persist Session</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
                >
                  Reset Token
                </Link>
              </div>

              {/* Actions */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 px-6 rounded-[1.5rem] bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-700 text-white font-black text-sm uppercase tracking-[0.25em] shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(79,70,229,0.4)] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:translate-y-0"
              >
                {loading ? 'Initializing Access...' : 'Authenticate'}
              </button>
            </form>

            {/* Post Auth Link */}
            <div className="mt-10 pt-8 border-t border-white/5 text-center">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Unauthorized?</span>{' '}
              <Link to="/register" className="ml-2 text-xs font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors">
                Request Access
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center space-x-3 opacity-20 group cursor-default">
              <ShieldCheckIcon className="h-4 w-4 text-gray-400 group-hover:text-indigo-400 transition-colors" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] group-hover:text-indigo-400 transition-colors">Secured by OptimaGuard</span>
            </div>

          </div>

          <p className="mt-8 text-center text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] lg:hidden">
            © 2026 TechOptima Global
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;