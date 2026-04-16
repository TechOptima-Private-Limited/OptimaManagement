import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, ShieldCheckIcon, SparklesIcon, BuildingOfficeIcon, KeyIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

// ── Password complexity rules (same as Settings.js) ──────────────────────
const RULES = [
    { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { id: 'upper', label: 'One uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
    { id: 'lower', label: 'One lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
    { id: 'number', label: 'One number (0-9)', test: (p) => /[0-9]/.test(p) },
    { id: 'special', label: 'One special character (!@#$%^&*…)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const validatePassword = (password) => {
    const failed = RULES.filter((r) => !r.test(password));
    return failed.length === 0 ? null : failed.map((r) => r.label).join(', ');
};
// ─────────────────────────────────────────────────────────────────────────

const ForceChangePassword = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors }, watch } = useForm();

    const password = watch('new_password') || '';
    const rulesStatus = RULES.map((r) => ({ ...r, passed: r.test(password) }));
    const allPassed = rulesStatus.every((r) => r.passed);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await authAPI.changePassword({
                old_password: data.old_password,
                new_password: data.new_password,
                new_password_confirm: data.new_password_confirm
            });

            if (response.status === 200) {
                toast.success('Password updated successfully. Please login with your new credentials.');
                // Logout user after successful password change as per requirements
                setTimeout(() => {
                    logout();
                }, 2000);
            }
        } catch (error) {
            console.error('Password change failed:', error);
            toast.error(error.response?.data?.detail || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        'appearance-none block w-full px-4 py-4 rounded-xl border border-black/5 dark:border-white/5 bg-black/40 text-slate-900 dark:text-white placeholder-gray-600 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all duration-300 text-sm font-medium';

    return (
        <div className="min-h-screen flex bg-slate-50 dark:bg-[#070B14] overflow-hidden relative font-sans selection:bg-indigo-500/30">
            {/* ── Background Architecture ── */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
                <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-[10%] -right-[5%] w-[40%] h-[40%] bg-violet-700/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[100px]" />
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
            </div>

            {/* ── Left Decorative Section ── */}
            <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-16 relative z-10">
                <div className="flex items-center space-x-4 group cursor-default">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-2xl shadow-indigo-500/40 group-hover:scale-110 transition-transform duration-500">
                        <BuildingOfficeIcon className="h-6 w-6 text-slate-900 dark:text-white" />
                    </div>
                    <div>
                        <span className="text-slate-900 dark:text-white font-black text-2xl tracking-tighter uppercase block leading-none">Optima</span>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] block">Management</span>
                    </div>
                </div>

                <div className="max-w-xl">
                    <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-10">
                        <KeyIcon className="h-4 w-4 text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Security Protocol Required</span>
                    </div>

                    <h2 className="text-7xl font-black text-slate-900 dark:text-white leading-[1.05] tracking-tighter mb-8">
                        Secure your <br />
                        <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent italic">
                            access.
                        </span>
                    </h2>

                    <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-lg mb-12">
                        This is your first login. To maintain system integrity, you must replace your temporary token with a personalized security credential.
                    </p>
                </div>

                <div className="flex items-center space-x-6">
                    <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">© 2026 TechOptima Global</p>
                    <div className="h-px flex-1 bg-black/5 dark:bg-white/5" />
                </div>
            </div>

            {/* ── Right: Change Password Card ── */}
            <div className="w-full lg:w-[45%] flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-[480px]">
                    <div className="bg-white dark:bg-slate-900/40 backdrop-blur-[40px] rounded-[3rem] border border-black/10 dark:border-white/10 shadow-[0_35px_80px_-15px_rgba(0,0,0,0.6)] p-10 sm:p-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

                        <div className="mb-10 text-center sm:text-left">
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">First-Time Setup.</h1>
                            <p className="text-gray-500 font-medium text-sm">Please update your temporary password to proceed.</p>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            {/* Old Password */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500/80 mb-2 uppercase tracking-[0.2em]">
                                    Temporary Password
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('old_password', { required: 'Temporary password required' })}
                                        type="password"
                                        className={inputClass}
                                        placeholder="Enter current dummy password"
                                    />
                                </div>
                                {errors.old_password && (
                                    <p className="mt-2 text-[10px] font-black text-rose-500 uppercase tracking-wider">{errors.old_password.message}</p>
                                )}
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500/80 mb-2 uppercase tracking-[0.2em]">
                                    New Security Token
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('new_password', {
                                            required: 'New password required',
                                            validate: (v) => {
                                                const err = validatePassword(v);
                                                return err ? `Missing: ${err}` : true;
                                            }
                                        })}
                                        type={showPassword ? 'text' : 'password'}
                                        className={`${inputClass} pr-12`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-4 flex items-center text-gray-600 hover:text-indigo-400 transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.new_password && (
                                    <p className="mt-2 text-[10px] font-black text-rose-500 uppercase tracking-wider">{errors.new_password.message}</p>
                                )}
                                {/* Live complexity checklist */}
                                {password && password.length > 0 && (
                                    <div className="mt-3 space-y-1.5 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                        {rulesStatus.map((rule) => (
                                            <div key={rule.id} className="flex items-center space-x-2">
                                                {rule.passed
                                                    ? <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                                                    : <XCircleIcon className="h-3.5 w-3.5 text-gray-600 flex-shrink-0" />}
                                                <span className={`text-[10px] font-medium ${rule.passed ? 'text-emerald-400' : 'text-gray-500'}`}>
                                                    {rule.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500/80 mb-2 uppercase tracking-[0.2em]">
                                    Verify New Token
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('new_password_confirm', {
                                            required: 'Please confirm your password',
                                            validate: value => value === password || 'Passwords do not match'
                                        })}
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className={`${inputClass} pr-12`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-4 flex items-center text-gray-600 hover:text-indigo-400 transition-colors"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.new_password_confirm && (
                                    <p className="mt-2 text-[10px] font-black text-rose-500 uppercase tracking-wider">{errors.new_password_confirm.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !allPassed}
                                className="w-full py-5 px-6 rounded-[1.5rem] bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-700 text-slate-900 dark:text-white font-black text-sm uppercase tracking-[0.25em] shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(79,70,229,0.4)] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:translate-y-0"
                            >
                                {loading ? 'Updating Credentials...' : 'Update & Secure'}
                            </button>
                        </form>

                        <div className="mt-8 flex items-center justify-center space-x-3 opacity-20 group cursor-default">
                            <ShieldCheckIcon className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-indigo-400 transition-colors" />
                            <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.3em] group-hover:text-indigo-400 transition-colors">Secured by OptimaGuard</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForceChangePassword;
