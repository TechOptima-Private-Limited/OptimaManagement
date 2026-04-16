import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, ShieldCheckIcon, SparklesIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import loginBg from '../../assets/analytics_login_bg_sharp.png';

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
    'appearance-none block w-full px-4 py-5 sm:py-4 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-slate-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all duration-300 text-base sm:text-sm font-medium backdrop-blur-sm';

  return (
    <div className="min-h-screen flex bg-[#070B14] dark:bg-[#070B14] overflow-hidden relative font-sans selection:bg-purple-500/30" style={{ WebkitTapHighlightColor: 'transparent' }}>
      {/* ── Background Layer ── */}
      <div className="absolute inset-0 z-0 bg-[#070B14] dark:bg-[#070B14]">
        <img 
          src={loginBg} 
          alt="Login Background" 
          className="absolute inset-0 w-full h-full object-cover object-center scale-[1.02] contrast-[1.1] brightness-[0.8]"
        />
        {/* Blur wash over the background image */}
        <div className="absolute inset-0 backdrop-blur-[2px] bg-[#070B14]/40" />
        {/* Vignette: darken edges, keep center readable */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 20%, rgba(7,11,20,0.55) 100%)' }} />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row min-h-screen">
        
        {/* Logo Overlay */}
        <div className="absolute top-5 left-5 sm:top-10 sm:left-10 flex items-center space-x-3 sm:space-x-4 group cursor-default">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center shadow-xl shadow-purple-500/20">
            <BuildingOfficeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <span className="text-white font-black text-lg sm:text-xl tracking-tighter uppercase block leading-none">Optima</span>
            <span className="text-[9px] sm:text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] block">Management</span>
          </div>
        </div>

        {/* Centered Authentication card */}
        <div className="w-full flex items-center justify-center px-4 py-4 sm:p-8 md:p-12 pt-20 sm:pt-24 md:pt-0 min-h-screen">
          <div className="w-full max-w-[480px]">
            <div className="bg-white/5 backdrop-blur-2xl rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-6 sm:p-9 md:p-12 relative overflow-hidden">

            {/* Inner Glow */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

            {/* Header */}
            <div className="mb-6 sm:mb-8 md:mb-10 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">Welcome Back.</h1>
              <h2 className="text-slate-400 font-medium text-[10px] sm:text-xs tracking-wide uppercase">Sign in to your account</h2>
            </div>

            <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <div>
                <label className="block text-[10px] font-black text-slate-400/80 mb-2 uppercase tracking-[0.2em]">
                  Email Address
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
                  <label className="block text-[10px] font-black text-slate-400/80 mb-3 uppercase tracking-[0.2em]">
                    Password
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
              <div className="flex items-center justify-between pb-2 sm:pb-4">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="peer h-5 w-5 bg-white/5/5 border-black/10 dark:border-white/10 rounded-lg text-indigo-600 focus:ring-indigo-500/30 transition-all cursor-pointer"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors uppercase tracking-widest">Remember Me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Actions */}
              <button
                type="submit"
                disabled={loading}
                style={{ backgroundSize: '200% 100%', backgroundPosition: '0% 0%' }}
                onMouseEnter={e => e.currentTarget.style.backgroundPosition = '100% 0%'}
                onMouseLeave={e => e.currentTarget.style.backgroundPosition = '0% 0%'}
                className="w-full py-5 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#A78BFA] text-white font-black text-sm uppercase tracking-[0.2em] sm:tracking-[0.25em] shadow-[0_20px_40px_-10px_rgba(139,92,246,0.3)] hover:shadow-[0_28px_55px_-10px_rgba(139,92,246,0.55)] hover:scale-[1.02] active:scale-[0.97] active:shadow-[0_10px_25px_-8px_rgba(139,92,246,0.4)] transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center space-x-3 opacity-20 group cursor-default">
              <ShieldCheckIcon className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-indigo-400 transition-colors" />
              <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.3em] group-hover:text-indigo-400 transition-colors">Secured by OptimaGuard</span>
            </div>

          </div>

          <p className="mt-6 text-center text-[9px] font-black text-gray-700 uppercase tracking-[0.3em]">
            © 2026 TechOptima Global
          </p>
        </div>
      </div>
    </div>
  </div>
);
};

export default Login;
