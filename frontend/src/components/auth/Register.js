import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon, UserPlusIcon, BuildingOfficeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    const result = await registerUser(data);
    if (result.success) {
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } else {
      toast.error(result.error || 'Registration failed');
    }
  };

  const inputClass =
    'appearance-none block w-full px-4 py-4 rounded-xl border border-white/5 bg-black/40 text-white placeholder-gray-600 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all duration-300 text-sm font-medium';

  return (
    <div className="min-h-screen flex bg-[#070B14] overflow-hidden relative font-sans selection:bg-indigo-500/30">
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[5%] w-[40%] h-[40%] bg-violet-700/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
      </div>

      <div className="hidden lg:flex lg:w-[50%] flex-col justify-between p-16 relative z-10">
        <div className="flex items-center space-x-4 group cursor-default">
          <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-2xl shadow-indigo-500/40 group-hover:scale-110 transition-transform duration-500">
            <BuildingOfficeIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-white font-black text-2xl tracking-tighter uppercase block leading-none">Optima</span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] block">Management</span>
          </div>
        </div>

        <div className="max-w-xl">
          <h2 className="text-6xl font-black text-white leading-[1.05] tracking-tighter mb-8">
            Join the <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent italic">
              future of work.
            </span>
          </h2>
          <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-lg">
            Create your account to access the next-generation workforce management ecosystem.
          </p>
        </div>

        <div className="flex items-center space-x-6">
          <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest"> 2026 TechOptima Global</p>
          <div className="h-px flex-1 bg-white/5" />
        </div>
      </div>

      <div className="w-full lg:w-[50%] flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[480px]">
          <div className="bg-slate-900/40 backdrop-blur-[40px] rounded-[3rem] border border-white/10 shadow-[0_35px_80px_-15px_rgba(0,0,0,0.6)] p-10 sm:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

            <div className="mb-8 text-center sm:text-left">
              <h1 className="text-4xl font-black text-white tracking-tight mb-2">Create Account.</h1>
              <p className="text-gray-500 font-medium text-sm">Join TechOptima workforce management.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500/80 mb-2 uppercase tracking-[0.2em]">First Name</label>
                  <input
                    {...register('first_name', { required: 'Required' })}
                    type="text"
                    className={inputClass}
                    placeholder="John"
                  />
                  {errors.first_name && <p className="mt-1 text-[10px] font-black text-rose-500 uppercase">{errors.first_name.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500/80 mb-2 uppercase tracking-[0.2em]">Last Name</label>
                  <input
                    {...register('last_name', { required: 'Required' })}
                    type="text"
                    className={inputClass}
                    placeholder="Doe"
                  />
                  {errors.last_name && <p className="mt-1 text-[10px] font-black text-rose-500 uppercase">{errors.last_name.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500/80 mb-2 uppercase tracking-[0.2em]">Work Email</label>
                <input
                  {...register('email', {
                    required: 'Email required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid format' }
                  })}
                  type="email"
                  className={inputClass}
                  placeholder="john.doe@techoptima.com"
                />
                {errors.email && <p className="mt-1 text-[10px] font-black text-rose-500 uppercase">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500/80 mb-2 uppercase tracking-[0.2em]">Password</label>
                <div className="relative">
                  <input
                    {...register('password', { required: 'Password required', minLength: { value: 8, message: 'Min 8 characters' } })}
                    type={showPassword ? 'text' : 'password'}
                    className={`${inputClass} pr-12`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-4 flex items-center text-gray-600 hover:text-indigo-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-[10px] font-black text-rose-500 uppercase">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500/80 mb-2 uppercase tracking-[0.2em]">Confirm Password</label>
                <input
                  {...register('confirm_password', {
                    required: 'Confirmation required',
                    validate: (val) => val === password || 'Passwords do not match'
                  })}
                  type="password"
                  className={inputClass}
                  placeholder="••••••••"
                />
                {errors.confirm_password && <p className="mt-1 text-[10px] font-black text-rose-500 uppercase">{errors.confirm_password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 px-6 mt-4 rounded-[1.5rem] bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-700 text-white font-black text-sm uppercase tracking-[0.25em] shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(79,70,229,0.4)] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Already registered?</span>{' '}
              <Link to="/login" className="ml-2 text-xs font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;