// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useForm } from 'react-hook-form';
// import { toast } from 'react-toastify';
// import { EyeIcon, EyeSlashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
// import { useAuth } from '../../context/AuthContext';

// const Register = () => {
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const { register: registerUser, loading } = useAuth();
//   const navigate = useNavigate();
//   const { register, handleSubmit, watch, formState: { errors } } = useForm();

//   const password = watch('password');

//   const onSubmit = async (data) => {
//     const result = await registerUser(data);
//     if (result.success) {
//       toast.success('Account created successfully! Welcome aboard!');
//       navigate('/dashboard');
//     } else {
//       toast.error(result.error);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8">
//         <div className="text-center">
//           <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
//             <UserPlusIcon className="h-8 w-8 text-green-600" />
//           </div>
//           <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
//             Create your account
//           </h2>
//           <p className="mt-2 text-center text-sm text-gray-600">
//             Or{' '}
//             <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
//               sign in to your existing account
//             </Link>
//           </p>
//         </div>

//         <div className="bg-white shadow-xl rounded-lg p-8">
//           <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
//                   First Name
//                 </label>
//                 <input
//                   {...register('first_name', { required: 'First name is required' })}
//                   type="text"
//                   className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="John"
//                 />
//                 {errors.first_name && (
//                   <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
//                   Last Name
//                 </label>
//                 <input
//                   {...register('last_name', { required: 'Last name is required' })}
//                   type="text"
//                   className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Doe"
//                 />
//                 {errors.last_name && (
//                   <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
//                 )}
//               </div>
//             </div>

//             <div>
//               <label htmlFor="username" className="block text-sm font-medium text-gray-700">
//                 Username
//               </label>
//               <input
//                 {...register('username', { required: 'Username is required' })}
//                 type="text"
//                 className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                 placeholder="johndoe"
//               />
//               {errors.username && (
//                 <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
//               )}
//             </div>

//             <div>
//               <label htmlFor="email" className="block text-sm font-medium text-gray-700">
//                 Email address
//               </label>
//               <input
//                 {...register('email', { 
//                   required: 'Email is required',
//                   pattern: {
//                     value: /^\S+@\S+$/i,
//                     message: 'Invalid email address'
//                   }
//                 })}
//                 type="email"
//                 autoComplete="email"
//                 className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                 placeholder="john@example.com"
//               />
//               {errors.email && (
//                 <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
//               )}
//             </div>

//             <div>
//               <label htmlFor="password" className="block text-sm font-medium text-gray-700">
//                 Password
//               </label>
//               <div className="mt-1 relative">
//                 <input
//                   {...register('password', { 
//                     required: 'Password is required',
//                     minLength: {
//                       value: 8,
//                       message: 'Password must be at least 8 characters'
//                     }
//                   })}
//                   type={showPassword ? 'text' : 'password'}
//                   className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Create a strong password"
//                 />
//                 <button
//                   type="button"
//                   className="absolute inset-y-0 right-0 pr-3 flex items-center"
//                   onClick={() => setShowPassword(!showPassword)}
//                 >
//                   {showPassword ? (
//                     <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
//                   ) : (
//                     <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
//                   )}
//                 </button>
//               </div>
//               {errors.password && (
//                 <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
//               )}
//             </div>

//             <div>
//               <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700">
//                 Confirm Password
//               </label>
//               <div className="mt-1 relative">
//                 <input
//                   {...register('password_confirm', { 
//                     required: 'Please confirm your password',
//                     validate: value => value === password || 'Passwords do not match'
//                   })}
//                   type={showConfirmPassword ? 'text' : 'password'}
//                   className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Confirm your password"
//                 />
//                 <button
//                   type="button"
//                   className="absolute inset-y-0 right-0 pr-3 flex items-center"
//                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                 >
//                   {showConfirmPassword ? (
//                     <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
//                   ) : (
//                     <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
//                   )}
//                 </button>
//               </div>
//               {errors.password_confirm && (
//                 <p className="mt-1 text-sm text-red-600">{errors.password_confirm.message}</p>
//               )}
//             </div>

//             <div className="flex items-center">
//               <input
//                 id="terms"
//                 name="terms"
//                 type="checkbox"
//                 className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//                 required
//               />
//               <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
//                 I agree to the{' '}
//                 <Link to="/terms" className="text-blue-600 hover:text-blue-500">
//                   Terms and Conditions
//                 </Link>{' '}
//                 and{' '}
//                 <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
//                   Privacy Policy
//                 </Link>
//               </label>
//             </div>

//             <div>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//               >
//                 {loading ? (
//                   <div className="flex items-center">
//                     <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-white">
//                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                       </svg>
//                     </div>
//                     Creating account...
//                   </div>
//                 ) : (
//                   'Create account'
//                 )}
//               </button>
//             </div>
//           </form>
//         </div>

//         <div className="text-center">
//           <p className="text-sm text-gray-600">
//             Already have an account?{' '}
//             <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
//               Sign in here
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;


import { useState } from 'react';

const EmployeeRegistration = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.password_confirm) {
      newErrors.password_confirm = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const apiBase = (process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:8080/api`);
      const response = await fetch(`${apiBase}/auth/employee-register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Store tokens
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        // Handle API errors
        if (data.email) setErrors(prev => ({ ...prev, email: Array.isArray(data.email) ? data.email[0] : data.email }));
        if (data.password) setErrors(prev => ({ ...prev, password: Array.isArray(data.password) ? data.password[0] : data.password }));
        if (data.password_confirm) setErrors(prev => ({ ...prev, password_confirm: Array.isArray(data.password_confirm) ? data.password_confirm[0] : data.password_confirm }));
        if (data.non_field_errors) setErrors(prev => ({ ...prev, general: Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors }));
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Registration Successful!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your account has been activated. Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Registration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Set up your password using the email address provided by HR
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {errors.general}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Enter your work email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Create a secure password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password_confirm"
                name="password_confirm"
                type="password"
                required
                value={formData.password_confirm}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${errors.password_confirm ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Confirm your password"
              />
              {errors.password_confirm && (
                <p className="mt-1 text-sm text-red-600">{errors.password_confirm}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Activating your account...' : 'Complete Registration'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Use the email address that was provided to you by HR
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRegistration;