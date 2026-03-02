import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [captcha, setCaptcha] = useState({ key: '', imageUrl: '' });
  const [fetchingCaptcha, setFetchingCaptcha] = useState(false);
  const { register, handleSubmit, formState: { errors }, resetField } = useForm();

  const fetchCaptcha = useCallback(async () => {
    setFetchingCaptcha(true);
    try {
      const response = await authAPI.getCaptcha();
      const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api').replace(/\/api$/, '');
      setCaptcha({
        key: response.data.key,
        imageUrl: response.data.image_url.startsWith('http')
          ? response.data.image_url
          : `${apiBase}${response.data.image_url}`
      });
    } catch (error) {
      console.error('Failed to fetch captcha:', error);
      toast.error('Failed to load security code');
    } finally {
      setFetchingCaptcha(false);
    }
  }, []);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data) => {
    const loginData = {
      ...data,
      captcha_key: captcha.key,
      captcha_value: data.captcha
    };

    const result = await login(loginData);
    if (result.success) {
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } else {
      toast.error(result.error);
      // Refresh captcha on failure
      fetchCaptcha();
      resetField('captcha');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
            <LockClosedIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  autoComplete="email"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="captcha" className="block text-sm font-medium text-gray-700">
                Security Verification
              </label>
              <div className="flex items-center space-x-4">
                <div className="bg-gray-100 rounded-lg p-1 flex items-center justify-center min-w-[120px] h-[48px] overflow-hidden">
                  {fetchingCaptcha ? (
                    <div className="animate-pulse flex space-x-4">
                      <div className="h-8 w-24 bg-gray-300 rounded"></div>
                    </div>
                  ) : (
                    <img
                      src={captcha.imageUrl}
                      alt="Captcha"
                      className="h-full object-contain mix-blend-multiply"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Refresh security code"
                >
                  <ArrowPathIcon className={`h-6 w-6 ${fetchingCaptcha ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <input
                {...register('captcha', { required: 'Security verification is required' })}
                type="text"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the code shown above"
              />
              {errors.captcha && (
                <p className="mt-1 text-sm text-red-600">{errors.captcha.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-white">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;